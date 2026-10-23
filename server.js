"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const {
  InferenceClient,
  InferenceClientInputError,
  InferenceClientProviderOutputError,
} = require("@huggingface/inference");
const sharp = require("sharp");
const {
  generatePower,
  isTextApiEnabled,
} = require("./generate-power");

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
  [
    "/assets/font/PressStart2P-Regular.ttf",
    ["assets/font/PressStart2P-Regular.ttf", "font/ttf"],
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

const STYLE_GUIDANCE = 3.5;

/**
 * Widescreen HD (~2:1) — par suportado pelo FLUX Kontext.
 * Sem downscale para 288×152 (qualidade A).
 */
const OUTPUT_SIZE = { width: 1456, height: 720, dpi: 90 };

/** value (EN) → ambient corporativo do cargo. */
const PROFESSIONS = new Map([
  ["IT Manager", "glass manager office with KPI screens and sticky notes"],
  ["Systems Coordinator", "team bay with planning board and open laptops"],
  ["Web Developer", "dev desk with dual monitors (Intranet/PROWEB)"],
  ["ADVPL Developer", "ERP workstation with chunky Protheus screens"],
  ["Systems Analyst", "whiteboard with diagrams, sticky notes and laptop"],
  ["Infrastructure Analyst", "NOC corner with server racks and monitors"],
  ["Infrastructure Assistant", "support bench with PCs, cables and peripherals"],
  ["Process Analyst", "kanban wall with flowcharts and a laptop"],
]);

/** Cenários corporativos de TI (comédia leve — ainda é escritório). */
const CORPORATE_SCENES = [
  "open-plan IT office with desks, dual monitors and a ticket board on the wall",
  "helpdesk counter with a queue display and a coffee machine in the corner",
  "meeting room with glass walls covered in sticky notes and a TV with charts",
  "server-room aisle with blinking rack LEDs behind the character",
  "dev bay with standing desks, plants and a printer spewing paper",
  "corridor next to the IT support booth with cable reels and a whiteboard",
  "war-room table with laptops, coffee cups and a big screen of dashboards",
  "near a tall office window: desks, plants, monitors glowing softly",
];

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

const APPEARANCE_MAPS = {
  gender: { feminino: "woman", masculino: "man" },
  skin: {
    clara: "fair light skin",
    "morena-clara": "light brown skin",
    morena: "medium brown skin",
    negra: "dark brown skin",
    amarela: "East Asian skin tone",
  },
  hairColor: {
    preto: "black hair",
    castanho: "brown hair",
    loiro: "blonde hair",
    ruivo: "red hair",
    grisalho: "gray hair",
    colorido: "bright colorful dyed hair",
  },
  eyeColor: {
    castanho: "brown eyes",
    preto: "dark eyes",
    verde: "green eyes",
    azul: "blue eyes",
    mel: "hazel eyes",
  },
  hairLength: {
    longo: "long hair",
    medio: "medium-length hair",
    curto: "short hair",
    careca: "bald head",
  },
  hairType: {
    liso: "straight hair",
    cacheado: "curly hair",
    na: "",
  },
  glasses: {
    sim: "wearing simple pixel glasses",
    nao: "no glasses",
  },
  beard: {
    nenhuma: "clean-shaven, no facial hair",
    bigode: "mustache only, no beard",
    cavanhaque: "neat goatee",
    rala: "light stubble facial hair",
    curta: "short trimmed beard",
    cheia: "full thick beard",
    longa: "long beard",
  },
};

function parseAppearance(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new HttpError(400, "Informe as características da pessoa.");
  }
  const pick = (key) => {
    const value = String(raw[key] || "").trim();
    if (!value || !APPEARANCE_MAPS[key] || !APPEARANCE_MAPS[key][value]) {
      throw new HttpError(400, "Característica inválida: " + key + ".");
    }
    return value;
  };
  const gender = pick("gender");
  const skin = pick("skin");
  const hairColor = pick("hairColor");
  const eyeColor = pick("eyeColor");
  const hairLength = pick("hairLength");
  const glasses = pick("glasses");
  const beard = pick("beard");
  let hairType = String(raw.hairType || "").trim();
  if (hairLength === "careca") {
    hairType = "na";
  } else if (!APPEARANCE_MAPS.hairType[hairType] || hairType === "na") {
    throw new HttpError(400, "Informe se o cabelo é liso ou cacheado.");
  }
  return { gender, skin, hairColor, eyeColor, hairLength, hairType, glasses, beard };
}

function appearancePromptLine(appearance) {
  if (!appearance) return "";
  const g = APPEARANCE_MAPS.gender[appearance.gender];
  const skin = APPEARANCE_MAPS.skin[appearance.skin];
  const eyes = APPEARANCE_MAPS.eyeColor[appearance.eyeColor];
  const glasses = APPEARANCE_MAPS.glasses[appearance.glasses];
  const beard = APPEARANCE_MAPS.beard[appearance.beard];
  let hair = "";
  if (appearance.hairLength === "careca") {
    hair = APPEARANCE_MAPS.hairLength.careca;
  } else {
    const len = APPEARANCE_MAPS.hairLength[appearance.hairLength];
    const typ = APPEARANCE_MAPS.hairType[appearance.hairType];
    const col = APPEARANCE_MAPS.hairColor[appearance.hairColor];
    hair = [len, typ, col].filter(Boolean).join(", ");
  }
  return (
    "Apply these look traits (hair/skin/eyes/glasses/beard) while keeping facial likeness from the photo: " +
    g +
    " with " +
    skin +
    ", " +
    hair +
    ", large expressive " +
    eyes +
    ", " +
    glasses +
    ", " +
    beard +
    ". "
  );
}

/** Tabela oficial (ação / tom / fraqueza) → cena visual. */
const TEMPERAMENT_TABLE = {
  colerico: {
    acao: "Explosivo",
    tom: "CAPS, urgência, dono do chamado",
    scene:
      "chaotic urgent vibe: floating CAPS chat bubbles, red stress marks, papers flying, intense wide eyes",
  },
  melancholico: {
    acao: "Detalhista",
    tom: "Print, laudo, me prova",
    scene:
      "detective desk vibe: clipboard, screenshot printouts, sticky notes, magnifying glass, focused expression",
  },
  sanguineo: {
    acao: "Otimista",
    tom: "Fé, café, vai dar",
    scene:
      "optimistic playful vibe: soft smile, sparkles, it-works-on-my-machine energy, lighthearted props",
  },
  fleumatico: {
    acao: "Preguiçoso",
    tom: "Fila, café, segunda a gente vê",
    scene:
      "chill queue vibe: coffee cup, calm posture, ticket queue icons floating slowly, unbothered face",
  },
};

/** Combos dominante→secundário → humor/cena. */
const COMBO_SCENE = {
  "colerico-fleumatico": "rage with a stamp/queue stamp; high impact only when a ticket is open",
  "fleumatico-colerico": "calm outside, sharp glare at queue-jumpers",
  "sanguineo-fleumatico": "light optimism; corridor urgencies drift into a soft ticket queue",
  "melancholico-sanguineo": "smiling audit vibe; clipboard plus sparkles, no blame face",
  "colerico-melancholico": "pressure plus proof: shout bubbles with evidence stickers",
  "fleumatico-melancholico": "documented waiting; slow queue until a print appears",
  "sanguineo-colerico": "faith with a short deadline; urgent but cheerful energy",
  "sanguineo-melancholico": "feature disguised as hope until the report lands",
  "colerico-sanguineo": "ship-and-pray urgency with optimistic sparks",
  "melancholico-colerico": "dry verdict desk; laudo without filter, stern focus",
  "melancholico-fleumatico": "backstage silence; evidence props, quiet posture",
  "fleumatico-sanguineo": "fix now, paperwork later; coffee and a half-smile",
};

/** Base de atributos por dominante (regras) — fallback se o client não enviar attrs. */
const ATTR_BASE = {
  colerico: { paciencia: 0, humor: 3, cafe: 10, nerdisse: 25 },
  melancholico: { paciencia: 4, humor: 2, cafe: 8, nerdisse: 50 },
  sanguineo: { paciencia: 5, humor: 10, cafe: 6, nerdisse: 20 },
  fleumatico: { paciencia: 10, humor: 6, cafe: 7, nerdisse: 15 },
};

function resolveAttrsFromBase(dominant, secondary) {
  const a = ATTR_BASE[dominant];
  if (!a) return { paciencia: 5, humor: 5, cafe: 5, nerdisse: 20 };
  if (!secondary || secondary === dominant || !ATTR_BASE[secondary]) return { ...a };
  const b = ATTR_BASE[secondary];
  const mix = (x, y) => Math.round(x * 0.7 + y * 0.3);
  return {
    paciencia: mix(a.paciencia, b.paciencia),
    humor: mix(a.humor, b.humor),
    cafe: mix(a.cafe, b.cafe),
    nerdisse: mix(a.nerdisse, b.nerdisse),
  };
}

function pickCorporateScene(mood) {
  const key =
    String((mood && mood.flavor) || "") +
    String((mood && mood.name) || "") +
    String((mood && mood.dominant) || "") +
    String((mood && mood.attrs && mood.attrs.cafe) || 0) +
    String((mood && mood.attrs && mood.attrs.nerdisse) || 0);
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CORPORATE_SCENES[h % CORPORATE_SCENES.length];
}

function clipPromptText(value, max) {
  const t = String(value || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max - 1).trim() + "…" : t;
}

/** Roteiro: flavor = pose; attention/efeitos = gag; attrs = props; escritório = fundo. */
function moodSceneLine(mood) {
  if (!mood || typeof mood !== "object") return "";
  const dominant = String(mood.dominant || "").toLowerCase();
  const secondary = String(mood.secondary || "").toLowerCase();
  const attrs =
    mood.attrs && typeof mood.attrs === "object"
      ? mood.attrs
      : resolveAttrsFromBase(dominant, secondary);
  const cafe = Number(attrs.cafe) || 0;
  const humor = Number(attrs.humor) || 0;
  const paciencia = Number(attrs.paciencia) || 0;
  const nerdisse = Number(attrs.nerdisse) || 0;

  const dom = TEMPERAMENT_TABLE[dominant];
  const sec = secondary && secondary !== dominant ? TEMPERAMENT_TABLE[secondary] : null;
  const comboKey = sec ? `${dominant}-${secondary}` : "";
  const combo = comboKey ? COMBO_SCENE[comboKey] : "";
  const powerName = clipPromptText(mood.name, 30);
  const flavor = clipPromptText(mood.flavor, 140);
  const attention = clipPromptText(mood.attention, 38);

  const bits = [];

  // 1) Flavor manda na ação (prioridade máxima)
  if (flavor) {
    bits.push(
      "MAIN ACTION (highest priority — act this literally at a PC/desk, exaggerated comic anime pose, NOT a calm standing smile): " +
        flavor
    );
  } else {
    bits.push(
      "MAIN ACTION: frantic funny IT pose at a computer — hands on head, leaning into the screen, confused/anxious energy"
    );
  }
  if (powerName) bits.push("nickname vibe in the pose: " + powerName);

  // 2) Efeitos cômicos estilo gag panel
  bits.push(
    "COMIC EFFECTS (cute anime gag panel energy): floating question-mark bubbles, sweat drops, " +
      "anxiety swirls or tremor lines, exaggerated expression — like a funny manga beat, NOT a serious portrait"
  );

  // 3) Attention = gag visual
  if (attention) {
    bits.push(
      "WEAKNESS GAG (show this as a visual joke prop/situation, no readable letters): " + attention
    );
  }

  // 4) Temperamento / combo (energia, não pose principal)
  if (dom) bits.push("temperament energy only (" + dom.acao + "): " + dom.tom);
  if (sec) bits.push("secondary accent (" + sec.acao + ")");
  if (combo) bits.push("combo accent: " + combo);

  // 5) Atributos = props obrigatórios
  bits.push(
    "SPECIAL ATTRS as clear props — paciência " +
      paciencia +
      "/10, humor " +
      humor +
      "/10, café " +
      cafe +
      "/10, nerdisse " +
      nerdisse +
      "/50"
  );
  if (cafe >= 8) bits.push("café: huge steaming mug about to spill on the keyboard");
  else if (cafe >= 5) bits.push("café: coffee cup on the messy desk");
  if (humor >= 8) bits.push("humor: goofy/comic grin or wink amid the chaos");
  else if (humor <= 3) bits.push("humor: deadpan face while everything is absurd");
  else bits.push("humor: anxious half-smile");
  if (paciencia >= 8) bits.push("paciência: trying to stay zen while the desk is chaos");
  else if (paciencia <= 2) bits.push("paciência: sticky notes and papers flying around the head");
  else bits.push("paciência: cluttered but workable desk");
  if (nerdisse >= 35) bits.push("nerdisse: floating soft code glyphs, logs, bug icons around the monitor");
  else if (nerdisse >= 20) bits.push("nerdisse: glowing laptop/monitor with glitchy comedy vibe");
  else bits.push("nerdisse: simple PC, more people/queue vibe");

  // 6) Fundo corporativo por último
  bits.push(
    "BACKGROUND (secondary): real corporate IT office — " +
      pickCorporateScene(mood) +
      " — desks/monitors visible behind the gag"
  );

  return "Priority storyboard: " + bits.join("; ") + ". ";
}

function parseMood(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const allowed = ["sanguineo", "colerico", "melancholico", "fleumatico"];
  const dominant = String(raw.dominant || "").trim().toLowerCase();
  const secondary = String(raw.secondary || "").trim().toLowerCase();
  const attrsIn = raw.attrs && typeof raw.attrs === "object" ? raw.attrs : {};
  const num = (v, max) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(max, Math.round(n)));
  };
  const hasAny =
    attrsIn.paciencia != null ||
    attrsIn.humor != null ||
    attrsIn.cafe != null ||
    attrsIn.nerdisse != null;
  const base = resolveAttrsFromBase(
    allowed.includes(dominant) ? dominant : "",
    allowed.includes(secondary) ? secondary : ""
  );
  const clip = (v, max) => clipPromptText(v, max);
  return {
    dominant: allowed.includes(dominant) ? dominant : "",
    secondary: allowed.includes(secondary) ? secondary : "",
    attrs: {
      paciencia: hasAny ? num(attrsIn.paciencia, 10) : base.paciencia,
      humor: hasAny ? num(attrsIn.humor, 10) : base.humor,
      cafe: hasAny ? num(attrsIn.cafe, 10) : base.cafe,
      nerdisse: hasAny ? num(attrsIn.nerdisse, 50) : base.nerdisse,
    },
    name: clip(raw.name || raw.powerName, 30),
    flavor: clip(raw.flavor || raw.summary || raw.punchline, 120),
    attention: clip(raw.attention, 38),
  };
}

function buildStylePrompt(profession, appearance, mood) {
  const ambient = profession
    ? PROFESSIONS.get(profession)
    : "a cozy IT office with desks and monitors";
  const roleLine = profession
    ? "They work as a " + profession + " in " + ambient + ". "
    : "";
  const lookLine = appearancePromptLine(appearance);
  const sceneLine = moodSceneLine(mood);
  const hasFlavor = Boolean(mood && mood.flavor);
  return (
    "Transform the photo into a funny Pokémon-trainer TCG anime illustration (Ken Sugimori + cute comic gag panel energy): " +
    "big expressive eyes, bold cel-shading, exaggerated emotion — like a hilarious manga beat at work. " +
    "WIDESCREEN 2:1, FULL BODY (head to shoes) centered, often AT A DESK/PC interacting with the computer — " +
    "leaning in, hands on head, confused/anxious/obsessed pose when the card text calls for it. " +
    "Uniform: light sky-blue collared shirt + dark blue denim jeans. " +
    "PRIORITY: (1) act the card flavor as the main pose, (2) comic effects (question marks, sweat drops, swirl lines), " +
    "(3) attention as a visual gag, (4) attr props, (5) corporate office background. " +
    "NOT a calm LinkedIn smile standing stiff, NOT generic yellow superhero explosion burst, NOT empty gradient. " +
    "NOT pixel art, NOT photorealistic, NOT 3D. Keep facial likeness from the photo. " +
    lookLine +
    roleLine +
    sceneLine +
    (hasFlavor
      ? "If the flavor mentions bugs/anxiety/love letters/saving/etc., show that joke physically at the monitor. "
      : "") +
    "No readable text, no logos, no watermark, no UI chrome."
  );
}

/** JPEG HD widescreen (mantém resolução do FLUX). */
async function finalizeCardArt(buffer) {
  return sharp(buffer)
    .resize(OUTPUT_SIZE.width, OUTPUT_SIZE.height, {
      fit: "cover",
      position: "centre",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 92,
      chromaSubsampling: "4:2:0",
      mozjpeg: true,
    })
    .withMetadata({ density: OUTPUT_SIZE.dpi })
    .toBuffer();
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
    const appearance = parseAppearance(body.appearance);
    const mood = parseMood(body.mood);

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
        prompt: buildStylePrompt(profession, appearance, mood),
        guidance_scale: STYLE_GUIDANCE,
        num_inference_steps: 28,
        width: OUTPUT_SIZE.width,
        height: OUTPUT_SIZE.height,
        target_size: { width: OUTPUT_SIZE.width, height: OUTPUT_SIZE.height },
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
    const rawBuffer = Buffer.from(await result.arrayBuffer());
    const buffer = await finalizeCardArt(rawBuffer);
    const outMime = "image/jpeg";
    const savedFile = savePixelArtFile(config.pixelArtDir, buffer, outMime, email);

    if (config.emailGateEnabled && email) {
      const log = readGenerationLog(config.logPath);
      const idx = log.findIndex((entry) => entry && entry.email === email);
      const entry = {
        email,
        file: savedFile,
        profession,
        appearance,
        createdAt: new Date().toISOString(),
      };
      if (idx >= 0) log[idx] = entry;
      else log.push(entry);
      writeGenerationLog(config.logPath, log);
    }

    sendJson(res, 200, {
      url: "data:" + outMime + ";base64," + buffer.toString("base64"),
      provider: "huggingface",
      inferenceProvider: config.inferenceProvider,
      model: config.model,
      width: OUTPUT_SIZE.width,
      height: OUTPUT_SIZE.height,
      dpi: OUTPUT_SIZE.dpi,
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
  const entry = PUBLIC_FILES.get(pathname);
  if (entry) {
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
    return;
  }
  if (pathname.startsWith("/img/")) {
    serveImg(res, pathname);
    return;
  }
  sendJson(res, 404, { error: "Arquivo não encontrado." });
}

function createServer({ env = process.env, client, storage } = {}) {
  const token = String(env.HF_TOKEN || "").trim();
  const imageApiEnabled = isImageApiEnabled(env);
  const emailGateEnabled = isEmailGateEnabled(env);
  const emailDomain = emailDomainFromEnv(env);
  const pixelArtDir = storage?.pixelArtDir || path.join(ROOT, "pixel-art");
  const logPath = storage?.logPath || path.join(pixelArtDir, "log.json");
  ensureDir(pixelArtDir);
  const textApiEnabled = isTextApiEnabled(env);
  const llmModel =
    String(env.LLM_MODEL || "").trim() || "openai/gpt-oss-20b";
  const config = {
    model: String(env.HF_MODEL || "").trim() || DEFAULT_MODEL,
    inferenceProvider: String(env.HF_PROVIDER || "").trim() || "fal-ai",
    imageApiEnabled,
    hfConfigured: imageApiEnabled && token.startsWith("hf_") && token.length > 3,
    textApiEnabled,
    llmModel,
    llmConfigured: textApiEnabled && token.startsWith("hf_") && token.length > 3,
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
    if (req.method === "POST" && pathname === "/api/generate-power") {
      await handleGeneratePower(req, res, config, inference);
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
        textApiEnabled: config.textApiEnabled,
        llmModel: config.llmModel,
        llmConfigured: config.llmConfigured,
        emailGateEnabled: config.emailGateEnabled,
        emailDomain: config.emailDomain,
      });
      return;
    }
    if (
      req.method === "OPTIONS" &&
      (pathname === "/api/stylize" || pathname === "/api/generate-power")
    ) {
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

async function handleGeneratePower(req, res, config, inference) {
  try {
    const raw = await readBody(req);
    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch (_) {
      throw new HttpError(400, "JSON inválido.");
    }

    const dominant = String(body.dominant || "").trim();
    const secondary = body.secondary ? String(body.secondary).trim() : null;
    const allowed = ["sanguineo", "colerico", "melancholico", "fleumatico"];
    if (!allowed.includes(dominant)) {
      throw new HttpError(400, "Temperamento dominante inválido.");
    }
    if (secondary && !allowed.includes(secondary)) {
      throw new HttpError(400, "Temperamento secundário inválido.");
    }

    const professionValue = parseProfession(body.profession || body.professionValue);
    if (!professionValue) {
      throw new HttpError(400, "Selecione uma profissão.");
    }
    const professionLabel = String(body.professionLabel || "").trim() || professionValue;
    const hooks = Array.isArray(body.hooks) ? body.hooks : [];
    const genderRaw = String(body.gender || "").trim().toLowerCase();
    const gender =
      genderRaw === "feminino" || genderRaw === "masculino" ? genderRaw : null;
    if (!gender) {
      throw new HttpError(400, "Informe o gênero (feminino ou masculino).");
    }

    const llmProvider = String(process.env.LLM_PROVIDER || "").trim() || "groq";
    const power = await generatePower({
      token: String(process.env.HF_TOKEN || "").trim(),
      client: inference,
      env: {
        ...process.env,
        LLM_TEXT_API: config.textApiEnabled ? "1" : "0",
        LLM_MODEL: config.llmModel,
        LLM_PROVIDER: llmProvider,
      },
      input: {
        professionValue,
        professionLabel,
        dominant,
        secondary,
        hooks,
        gender,
      },
    });

    sendJson(res, 200, { ok: true, power });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message =
      error instanceof HttpError
        ? error.message
        : "Não foi possível gerar o poder da carta.";
    sendJson(res, status, { error: message });
  }
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
    if (!isTextApiEnabled(process.env)) {
      console.log("LLM_TEXT_API=0: poder da carta usa fallback local (sem LLM).");
    } else {
      console.log(
        "LLM poder: " +
          (String(process.env.LLM_MODEL || "").trim() || "openai/gpt-oss-20b") +
          " @ " +
          (String(process.env.LLM_PROVIDER || "").trim() || "groq")
      );
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
