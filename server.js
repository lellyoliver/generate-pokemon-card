"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const {
  InferenceClient,
  InferenceClientInputError,
  InferenceClientProviderOutputError,
} = require("@huggingface/inference");

const ROOT = __dirname;
const DEFAULT_MODEL = "black-forest-labs/FLUX.1-Kontext-dev";
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 120_000;

// Apenas os arquivos usados no navegador são públicos.
const PUBLIC_FILES = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ["/content.json", ["content.json", "application/json; charset=utf-8"]],
  ["/content.js", ["content.js", "text/javascript; charset=utf-8"]],
  ["/script.js", ["script.js", "text/javascript; charset=utf-8"]],
  ["/download-card.js", ["download-card.js", "text/javascript; charset=utf-8"]],
  ["/huggingface-stylize.js", ["huggingface-stylize.js", "text/javascript; charset=utf-8"]],
  [
    "/modern-screenshot.js",
    ["node_modules/modern-screenshot/dist/index.js", "text/javascript; charset=utf-8"],
  ],
]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        chunks.length = 0;
        reject(new HttpError(413, "Arquivo muito grande (máx. 8 MB por requisição)."));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
    req.on("aborted", () => reject(new HttpError(400, "Envio da imagem interrompido.")));
  });
}

function parseImage(image) {
  const match = typeof image === "string"
    ? /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image)
    : null;
  if (!match) {
    throw new HttpError(400, "Envie uma imagem PNG, JPEG ou WebP em base64.");
  }
  const buffer = Buffer.from(match[2], "base64");
  const mime = match[1];
  const validSignature =
    (mime === "image/png" && buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) ||
    (mime === "image/jpeg" && buffer.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))) ||
    (mime === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP");
  if (!buffer.length || buffer.toString("base64") !== match[2] || !validSignature) {
    throw new HttpError(400, "A imagem está vazia ou contém dados inválidos.");
  }
  return new Blob([buffer], { type: mime });
}

const STYLE_GUIDANCE = 3.2;

/** value (EN) → ambient hint used in the image prompt */
const PROFESSIONS = new Map([
  ["Fullstack Web Developer", "at a pixel-art desk with dual monitors showing code and a browser, keyboard and coffee cup"],
  ["ADVPL Developer", "at a pixel-art ERP workstation with chunky software screens and an office desk"],
  ["Systems Analyst", "beside a pixel whiteboard with system diagrams and sticky notes, laptop open"],
  ["Systems Coordinator", "in a pixel team space with a planning board and laptops"],
  ["Systems Manager", "in a pixel manager office with dashboard monitors and strategy notes"],
  ["Process Analyst", "near pixel process flowcharts and a kanban board, documents and laptop"],
  ["Infrastructure Assistant", "with pixel data-center / server-rack tiles in the background, cables and network gear"],
  ["Infrastructure Analyst", "in a pixel network ops vibe with server racks and monitoring screens behind the character"],
]);

function parseProfession(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new HttpError(400, "A profissão deve ser um texto válido.");
  }
  const profession = value.trim();
  if (!PROFESSIONS.has(profession)) {
    throw new HttpError(400, "Profissão inválida. Escolha uma das opções disponíveis.");
  }
  return profession;
}

function buildStylePrompt(profession) {
  const ambient = profession
    ? PROFESSIONS.get(profession)
    : "with a simple flat pastel pixel-art background";
  const roleLine = profession
    ? "Portray them as a " + profession + ", " + ambient + ". "
    : "";
  return (
    "Transform this photo into a tiny chibi / super-deformed pixel art character sprite, " +
    "like a cute RPG party member or indie game NPC. " +
    "Style rules (strict): oversized head, tiny body, short stubby limbs, thick 1-pixel black outline, " +
    "very low resolution chunky pixels, flat colors with minimal shading, no anti-aliasing, no blur, no photorealism. " +
    "Face style: two simple vertical black pixel eyes, soft pink blush pixels on the cheeks, " +
    "no nose, no open mouth — if expression is happy, keep a tiny closed-mouth smile or no mouth at all. " +
    "Do not show teeth, do not draw an open-mouth grin, do not add detailed facial features. " +
    "Match hair color/style and outfit vibe to the person so they stay recognizable as a chibi version of them. " +
    roleLine +
    "Keep light pixel-art environmental storytelling from their profession " +
    "(tools, screens, workplace mood) without clutter. Bold readable colors, no text or borders."
  );
}

function collectErrorCodes(error) {
  const codes = [];
  for (let current = error; current; current = current.cause) {
    if (current.code) codes.push(current.code);
    if (current.message) codes.push(current.message);
  }
  return codes.join(" ");
}

function publicError(error) {
  if (error instanceof HttpError) return error;
  if (error.name === "TimeoutError" || error.name === "AbortError") {
    return new HttpError(504, "A geração demorou mais que o esperado. Tente novamente mais tarde.");
  }
  const chain = collectErrorCodes(error);
  if (/SELF_SIGNED_CERT_IN_CHAIN|UNABLE_TO_VERIFY_LEAF_SIGNATURE|CERT_HAS_EXPIRED/i.test(chain)) {
    return new HttpError(
      502,
      "O Node.js não confia no certificado TLS da rede (proxy corporativo). No .env local use HF_INSECURE_TLS=1 ou configure NODE_EXTRA_CA_CERTS e reinicie.",
    );
  }
  if (
    (error.name === "TypeError" && /fetch failed/i.test(error.message || "")) ||
    /ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT/i.test(chain)
  ) {
    return new HttpError(502, "Falha de rede ao falar com o Hugging Face. Confira sua conexão e tente novamente.");
  }
  const status = error.httpResponse?.status;
  const remoteMessage = String(
    error.httpResponse?.body?.error || error.httpResponse?.body?.message || error.message || "",
  );
  if (status === 401 || status === 403) {
    return new HttpError(502, "O Hugging Face recusou o acesso. Confira HF_TOKEN, a permissão Inference Providers e o acesso ao modelo.");
  }
  if (status === 402 || /no remaining credits|payment required/i.test(remoteMessage)) {
    return new HttpError(402, "Sem créditos disponíveis no Hugging Face. Confira o saldo e o faturamento da conta.");
  }
  if (status === 429) {
    return new HttpError(429, "Limite de uso do Hugging Face atingido. Aguarde e tente novamente.");
  }
  if ([400, 404, 422].includes(status) || error instanceof InferenceClientInputError) {
    return new HttpError(502, "O modelo ou os parâmetros não são compatíveis com o provedor. Confira HF_MODEL e HF_PROVIDER no README.");
  }
  if ([500, 502, 503, 504].includes(status)) {
    return new HttpError(503, "O serviço de geração está indisponível. Tente novamente mais tarde.");
  }
  if (error instanceof InferenceClientProviderOutputError) {
    return new HttpError(502, "O Hugging Face não retornou uma imagem válida. Tente outra foto.");
  }
  return new HttpError(502, "Não foi possível gerar a imagem no Hugging Face. Confira sua conexão e tente novamente.");
}

function isEnvFlagOn(value, defaultOn = true) {
  const raw = String(value ?? (defaultOn ? "1" : "0")).trim().toLowerCase();
  return !["0", "false", "off", "no", "disabled"].includes(raw);
}

function isImageApiEnabled(env) {
  return isEnvFlagOn(env.HF_IMAGE_API, true);
}

function isEmailGateEnabled(env) {
  return isEnvFlagOn(env.EMAIL_GATE, true);
}

function emailDomainFromEnv(env) {
  const raw = String(env.EMAIL_DOMAIN || "ancora.com.br").trim().toLowerCase().replace(/^@/, "");
  return raw || "ancora.com.br";
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readGenerationLog(logPath) {
  try {
    const data = JSON.parse(fs.readFileSync(logPath, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
}

function writeGenerationLog(logPath, entries) {
  ensureDir(path.dirname(logPath));
  fs.writeFileSync(logPath, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

function parseCorporateEmail(value, domain) {
  if (value === undefined || value === null || value === "") {
    throw new HttpError(400, "Informe o e-mail corporativo antes de gerar o pixel art.");
  }
  if (typeof value !== "string") {
    throw new HttpError(400, "O e-mail deve ser um texto válido.");
  }
  const email = value.trim().toLowerCase();
  const escaped = domain.replace(/\./g, "\\.");
  const re = new RegExp("^[^\\s@]+@" + escaped + "$");
  if (!re.test(email) || email.length > 120) {
    throw new HttpError(400, "Use um e-mail @" + domain + " válido.");
  }
  return email;
}

function extensionForMime(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

function mimeForExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

function safeEmailSlug(email) {
  return String(email).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "user";
}

function savePixelArtFile(pixelArtDir, buffer, mime, email) {
  ensureDir(pixelArtDir);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = email ? safeEmailSlug(email) : "guest";
  const filename = base + "_" + stamp + "." + extensionForMime(mime);
  const filePath = path.join(pixelArtDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
}

function resolveLoggedArtPath(pixelArtDir, filename) {
  const name = path.basename(String(filename || ""));
  if (!/^[a-zA-Z0-9._-]+\.(png|jpe?g|webp)$/.test(name)) return null;
  const filePath = path.join(pixelArtDir, name);
  if (path.dirname(filePath) !== path.resolve(pixelArtDir)) return null;
  if (!fs.existsSync(filePath)) return null;
  return filePath;
}

function loadSavedArtAsDataUrl(pixelArtDir, filename) {
  const filePath = resolveLoggedArtPath(pixelArtDir, filename);
  if (!filePath) return null;
  const buffer = fs.readFileSync(filePath);
  if (!buffer.length) return null;
  const mime = mimeForExtension(filePath);
  return "data:" + mime + ";base64," + buffer.toString("base64");
}

async function handleStylize(req, res, config, client) {
  try {
    if (!config.imageApiEnabled) {
      throw new HttpError(503, "A geração de imagem está desligada (HF_IMAGE_API=0). Ative no .env e reinicie o servidor.");
    }
    if (!config.hfConfigured) {
      throw new HttpError(503, "Configure HF_TOKEN no seu ambiente e reinicie o servidor. Veja o README.");
    }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] || "")) {
      throw new HttpError(415, "Envie a requisição como application/json.");
    }
    const raw = await readBody(req);
    let body;
    try {
      body = JSON.parse(raw);
    } catch (_) {
      throw new HttpError(400, "O corpo da requisição deve ser um JSON válido.");
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new HttpError(400, "Envie um objeto JSON com image.");
    }
    const image = parseImage(body.image);
    const profession = parseProfession(body.profession);
    if (!profession) {
      throw new HttpError(400, "Selecione uma profissão antes de gerar o pixel art.");
    }

    let email = null;
    if (config.emailGateEnabled) {
      email = parseCorporateEmail(body.email, config.emailDomain);
      const log = readGenerationLog(config.logPath);
      const existing = log.find((entry) => entry && entry.email === email && entry.file);
      if (existing) {
        const cachedUrl = loadSavedArtAsDataUrl(config.pixelArtDir, existing.file);
        if (cachedUrl) {
          sendJson(res, 200, {
            url: cachedUrl,
            provider: "huggingface",
            inferenceProvider: config.inferenceProvider,
            model: config.model,
            saved: true,
            cached: true,
          });
          return;
        }
        // Arquivo sumiu: segue para gerar de novo e atualizar o log abaixo.
      }
    }

    const signal = AbortSignal.timeout(TIMEOUT_MS);
    const result = await client.imageToImage({
      model: config.model,
      provider: config.inferenceProvider,
      inputs: image,
      parameters: {
        prompt: buildStylePrompt(profession),
        guidance_scale: STYLE_GUIDANCE,
        num_inference_steps: 28,
      },
    }, {
      signal,
      retry_on_error: false,
      // O SDK também consulta os metadados do modelo; limite essa consulta.
      fetch: (input, init) => fetch(input, { ...init, signal }),
    });
    if (!(result instanceof Blob) || !/^image\/(png|jpeg|webp)$/.test(result.type) || !result.size) {
      throw new InferenceClientProviderOutputError("Imagem de saída inválida.");
    }
    const buffer = Buffer.from(await result.arrayBuffer());
    const savedFile = savePixelArtFile(config.pixelArtDir, buffer, result.type, email);

    if (config.emailGateEnabled && email) {
      const log = readGenerationLog(config.logPath);
      const idx = log.findIndex((entry) => entry && entry.email === email);
      const entry = {
        email,
        file: savedFile,
        profession,
        createdAt: new Date().toISOString(),
      };
      if (idx >= 0) log[idx] = entry;
      else log.push(entry);
      writeGenerationLog(config.logPath, log);
    }

    sendJson(res, 200, {
      url: "data:" + result.type + ";base64," + buffer.toString("base64"),
      provider: "huggingface",
      inferenceProvider: config.inferenceProvider,
      model: config.model,
      saved: true,
      cached: false,
    });
  } catch (error) {
    const safeError = publicError(error);
    // Não registre a requisição do SDK, que pode conter a foto e credenciais.
    if (!(error instanceof HttpError)) {
      console.error(
        "[stylize]",
        error.name || "Error",
        error.httpResponse?.status || "",
        String(error.message || "").slice(0, 200),
        collectErrorCodes(error).slice(0, 200),
      );
    }
    if (!res.destroyed) sendJson(res, safeError.status, { error: safeError.message });
  }
}

const IMG_MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function serveImg(res, pathname) {
  const name = path.basename(pathname);
  if (!/^[a-zA-Z0-9._-]+\.(png|jpe?g|webp|gif)$/.test(name)) {
    sendJson(res, 404, { error: "Arquivo não encontrado." });
    return;
  }
  const filePath = path.join(ROOT, "img", name);
  if (path.dirname(filePath) !== path.join(ROOT, "img")) {
    sendJson(res, 404, { error: "Arquivo não encontrado." });
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(res, 404, { error: "Arquivo não encontrado." });
      return;
    }
    res.writeHead(200, {
      "Content-Type": IMG_MIME[path.extname(name).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    });
    res.end(data);
  });
}

function serveStatic(res, pathname) {
  if (pathname.startsWith("/img/")) {
    serveImg(res, pathname);
    return;
  }
  const entry = PUBLIC_FILES.get(pathname);
  if (!entry) {
    sendJson(res, 404, { error: "Arquivo não encontrado." });
    return;
  }
  fs.readFile(path.join(ROOT, entry[0]), (error, data) => {
    if (error) {
      sendJson(res, 404, { error: "Arquivo não encontrado." });
      return;
    }
    res.writeHead(200, {
      "Content-Type": entry[1],
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  });
}

function createServer({ env = process.env, client, storage } = {}) {
  const token = String(env.HF_TOKEN || "").trim();
  const imageApiEnabled = isImageApiEnabled(env);
  const emailGateEnabled = isEmailGateEnabled(env);
  const emailDomain = emailDomainFromEnv(env);
  const pixelArtDir = storage?.pixelArtDir || path.join(ROOT, "pixel-art");
  const logPath = storage?.logPath || path.join(pixelArtDir, "log.json");
  ensureDir(pixelArtDir);
  const config = {
    model: String(env.HF_MODEL || "").trim() || DEFAULT_MODEL,
    inferenceProvider: String(env.HF_PROVIDER || "").trim() || "fal-ai",
    imageApiEnabled,
    hfConfigured: imageApiEnabled && token.startsWith("hf_") && token.length > 3,
    emailGateEnabled,
    emailDomain,
    pixelArtDir,
    logPath,
  };
  const inference = client || new InferenceClient(token);

  return http.createServer(async (req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    } catch (_) {
      sendJson(res, 400, { error: "Endereço inválido." });
      return;
    }
    if (req.method === "POST" && pathname === "/api/stylize") {
      await handleStylize(req, res, config, inference);
      return;
    }
    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        provider: "huggingface",
        model: config.model,
        inferenceProvider: config.inferenceProvider,
        imageApiEnabled: config.imageApiEnabled,
        hfConfigured: config.hfConfigured,
        emailGateEnabled: config.emailGateEnabled,
        emailDomain: config.emailDomain,
      });
      return;
    }
    if (req.method === "OPTIONS" && pathname === "/api/stylize") {
      res.writeHead(204, { Allow: "POST, OPTIONS" });
      res.end();
      return;
    }
    if (req.method === "GET") {
      serveStatic(res, pathname);
      return;
    }
    res.writeHead(405, { Allow: "GET, POST, OPTIONS" });
    res.end("Method not allowed");
  });
}

function applyInsecureTlsIfRequested() {
  const flag = String(process.env.HF_INSECURE_TLS || "").trim().toLowerCase();
  if (!["1", "true", "yes", "on"].includes(flag)) return false;
  // Proxy corporativo com certificado autoassinado: só para uso local consciente.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  return true;
}

// Importar createServer nos testes não carrega arquivos de ambiente.
if (require.main === module) {
  try {
    process.loadEnvFile(path.join(ROOT, ".env"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const insecureTls = applyInsecureTlsIfRequested();
  const port = Number(process.env.PORT) || 3000;
  const imageApiEnabled = isImageApiEnabled(process.env);
  const emailGateEnabled = isEmailGateEnabled(process.env);
  createServer().listen(port, () => {
    console.log("Carta de Tecnologia em http://localhost:" + port);
    if (!imageApiEnabled) {
      console.log("HF_IMAGE_API=0: geração de imagem desligada.");
    }
    if (emailGateEnabled) {
      console.log("EMAIL_GATE ativo: 1 geração por e-mail @" + emailDomainFromEnv(process.env) + ".");
    } else {
      console.log("EMAIL_GATE=0: limite por e-mail desligado.");
    }
    if (insecureTls) {
      console.warn("HF_INSECURE_TLS ativo: verificação TLS desligada (apenas desenvolvimento local).");
    }
  });
}

module.exports = { createServer };
