"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { once } = require("node:events");
const { test } = require("node:test");
const {
  InferenceClientInputError,
  InferenceClientProviderApiError,
} = require("@huggingface/inference");
const { createServer } = require("../server");

const nativeFetch = global.fetch;
const PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lFkAAAAASUVORK5CYII=";
const IMAGE = "data:image/png;base64," + PNG_BASE64;
const FAKE_TOKEN = "hf_fake_token_for_offline_tests";

async function start(t, options = {}) {
  const pixelArtDir = fs.mkdtempSync(path.join(os.tmpdir(), "carta-pixel-"));
  t.after(() => {
    fs.rmSync(pixelArtDir, { recursive: true, force: true });
  });
  const env = {
    HF_TOKEN: FAKE_TOKEN,
    EMAIL_GATE: "0",
    ...(options.env || {}),
  };
  const server = createServer({
    env,
    client: options.client,
    storage: options.storage || {
      pixelArtDir,
      logPath: path.join(pixelArtDir, "log.json"),
    },
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  return {
    base: "http://127.0.0.1:" + server.address().port,
    pixelArtDir,
    logPath: path.join(pixelArtDir, "log.json"),
  };
}

const APPEARANCE = {
  gender: "feminino",
  skin: "clara",
  hairColor: "castanho",
  eyeColor: "castanho",
  hairLength: "medio",
  hairType: "liso",
  glasses: "nao",
  beard: "nenhuma",
};

function post(base, body) {
  const payload = { appearance: APPEARANCE, ...body };
  if (body && body.appearance === null) delete payload.appearance;
  return nativeFetch(base + "/api/stylize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

test("health informa configuração sem divulgar o token", async (t) => {
  const { base } = await start(t, {
    env: { HF_TOKEN: FAKE_TOKEN, HF_MODEL: "example/model", HF_PROVIDER: "fal-ai" },
  });
  const response = await nativeFetch(base + "/api/health");
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.ok, true);
  assert.equal(health.provider, "huggingface");
  assert.equal(health.model, "example/model");
  assert.equal(health.inferenceProvider, "fal-ai");
  assert.equal(health.imageApiEnabled, true);
  assert.equal(health.hfConfigured, true);
  assert.equal(health.emailGateEnabled, false);
  assert.equal(health.emailDomain, "ancora.com.br");
  assert.equal(health.textApiEnabled, true);
  assert.ok(health.llmModel);
  assert.equal(typeof health.llmConfigured, "boolean");
});

test("HF_IMAGE_API=0 desliga a geração sem chamar o serviço", async (t) => {
  const { base } = await start(t, {
    env: { HF_TOKEN: FAKE_TOKEN, HF_IMAGE_API: "0" },
    client: { imageToImage() { assert.fail("API desligada não deve chamar o serviço"); } },
  });
  const health = await (await nativeFetch(base + "/api/health")).json();
  assert.equal(health.imageApiEnabled, false);
  assert.equal(health.hfConfigured, false);
  const response = await post(base, { image: IMAGE, profession: "Web Developer" });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /desligada|HF_IMAGE_API/i);
});

test("ausência de token impede geração sem chamar o serviço", async (t) => {
  const { base } = await start(t, {
    env: { HF_TOKEN: "", EMAIL_GATE: "0" },
    client: { imageToImage() { assert.fail("Não deve chamar o serviço"); } },
  });
  const health = await (await nativeFetch(base + "/api/health")).json();
  assert.equal(health.hfConfigured, false);
  const response = await post(base, { image: IMAGE });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /HF_TOKEN/);
});

test("SDK envia foto e prompt pelo roteador HF e retorna a arte como data URL", async (t) => {
  const calls = [];
  t.mock.method(global, "fetch", async (input, init = {}) => {
    const url = new URL(input);
    calls.push({ url, init });
    if (url.hostname === "huggingface.co" && url.pathname.startsWith("/api/models/")) {
      return Response.json({ inferenceProviderMapping: {
        "fal-ai": {
          providerId: "fal-ai/flux-kontext/dev", status: "live", task: "image-to-image",
        },
      } });
    }
    if (url.hostname === "router.huggingface.co" && init.method === "POST") {
      assert.ok(url.pathname.startsWith("/fal-ai/"));
      assert.equal(init.headers.Authorization, "Bearer " + FAKE_TOKEN);
      const payload = JSON.parse(init.body);
      assert.equal(payload.image_url, IMAGE);
      assert.match(payload.prompt, /Pokémon|anime|Sugimori/i);
      assert.match(payload.prompt, /FULL BODY|full body/i);
      assert.match(payload.prompt, /comic|gag|question mark|sweat/i);
      assert.match(payload.prompt, /corporate|office|workplace/i);
      assert.match(payload.prompt, /sky-blue|dark blue denim/i);
      assert.match(payload.prompt, /Web Developer/);
      assert.match(payload.prompt, /likeness/i);
      assert.match(payload.prompt, /woman/i);
      assert.match(payload.prompt, /fair light skin/i);
      assert.equal(payload.guidance_scale, 3.5);
      assert.equal(payload.num_inference_steps, 28);
      assert.equal(payload.width, 1456);
      assert.equal(payload.height, 720);
      return Response.json({
        request_id: "offline-test", status: "COMPLETED",
        response_url: "https://queue.fal.run/fal-ai/flux-kontext/requests/offline-test",
      });
    }
    if (url.hostname === "router.huggingface.co" && url.pathname.endsWith("/requests/offline-test")) {
      return Response.json({ images: [{ url: "https://images.example.test/result.png" }] });
    }
    if (url.hostname === "images.example.test") {
      assert.equal(init.headers, undefined, "Não enviar token ao host da imagem");
      return new Response(Buffer.from(PNG_BASE64, "base64"), {
        headers: { "Content-Type": "image/png" },
      });
    }
    assert.fail("Requisição externa inesperada nos testes: " + url.origin + url.pathname);
  });
  const { base } = await start(t);
  const response = await post(base, {
    image: IMAGE,
    profession: "Web Developer",
    appearance: {
      gender: "feminino",
      skin: "clara",
      hairColor: "preto",
      eyeColor: "castanho",
      hairLength: "medio",
      hairType: "cacheado",
      glasses: "sim",
      beard: "nenhuma",
    },
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.match(body.url, /^data:image\/jpeg;base64,/);
  assert.equal(body.provider, "huggingface");
  assert.equal(body.inferenceProvider, "fal-ai");
  assert.equal(body.model, "black-forest-labs/FLUX.1-Kontext-dev");
  assert.equal(body.saved, true);
  assert.equal(body.cached, false);
  assert.equal(body.width, 1456);
  assert.equal(body.height, 720);
  assert.equal(body.dpi, 90);
  assert.ok(calls.some(({ url, init }) => url.hostname === "router.huggingface.co" && init.method === "POST"));
  assert.ok(calls.every(({ init }) => init.signal instanceof AbortSignal));
});

test("estilo anime widescreen full-body corporativo com attrs", async (t) => {
  const { base } = await start(t, { client: {
    async imageToImage(args, options) {
      assert.equal(args.inputs.type, "image/png");
      assert.equal(args.parameters.guidance_scale, 3.5);
      assert.equal(args.parameters.width, 1456);
      assert.equal(args.parameters.height, 720);
      assert.match(args.parameters.prompt, /Pokémon|anime|Sugimori/i);
      assert.match(args.parameters.prompt, /FULL BODY|full body/i);
      assert.match(args.parameters.prompt, /MAIN ACTION|Priority storyboard/i);
      assert.match(args.parameters.prompt, /comic|gag|question mark|sweat/i);
      assert.match(args.parameters.prompt, /corporate|office|workplace/i);
      assert.match(args.parameters.prompt, /sky-blue|dark blue denim/i);
      assert.match(args.parameters.prompt, /goatee|beard/i);
      assert.match(args.parameters.prompt, /Systems Analyst/);
      assert.match(args.parameters.prompt, /Rainha do Print|laudo com sorriso|SPECIAL ATTRS|café/i);
      assert.equal(options.retry_on_error, false);
      assert.ok(options.signal instanceof AbortSignal);
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      );
      return new Blob([png], { type: "image/png" });
    },
  } });
  const response = await post(base, {
    image: IMAGE,
    profession: "Systems Analyst",
    appearance: {
      gender: "feminino",
      skin: "clara",
      hairColor: "preto",
      eyeColor: "castanho",
      hairLength: "medio",
      hairType: "cacheado",
      glasses: "sim",
      beard: "cavanhaque",
    },
    mood: {
      dominant: "melancholico",
      attrs: { paciencia: 4, humor: 2, cafe: 8, nerdisse: 50 },
      name: "Rainha do Print",
      flavor: "Ela entrega laudo com sorriso e não leva a culpa.",
      attention: "Sem evidência, a conversa trava.",
    },
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.match(body.url, /^data:image\/jpeg;base64,/);
  assert.equal(body.width, 1456);
  assert.equal(body.height, 720);
  assert.equal(body.dpi, 90);
});

test("JSON e imagens inválidas são recusados antes de chegar ao provedor", async (t) => {
  const { base } = await start(t, { client: {
    imageToImage() { assert.fail("Entrada inválida não deve chamar o serviço"); },
  } });
  for (const body of [null, [], {}, { image: "https://example.test/photo.png" },
    { image: "data:image/png;base64,AAAA" }, { image: "data:image/svg+xml;base64,AAAA" },
    { image: IMAGE }, { image: IMAGE, profession: "Pirate" },
    { image: IMAGE, profession: "Web Developer", appearance: null }]) {
    const response = await post(base, body);
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  }
  const malformed = await nativeFetch(base + "/api/stylize", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{broken",
  });
  assert.equal(malformed.status, 400);
  const wrongType = await nativeFetch(base + "/api/stylize", { method: "POST", body: "hello" });
  assert.equal(wrongType.status, 415);
});

test("requisição acima de 8 MB retorna 413", async (t) => {
  const { base } = await start(t, { client: {
    imageToImage() { assert.fail("Corpo acima do limite não deve chamar o serviço"); },
  } });
  const response = await post(base, { image: "x".repeat(8 * 1024 * 1024) });
  assert.equal(response.status, 413);
  assert.match((await response.json()).error, /8 MB/);
});

for (const [upstream, expected, message] of [
  [401, 502, /token|HF_TOKEN/], [403, 502, /acesso/], [402, 402, /créditos/],
  [429, 429, /Limite/], [503, 503, /indisponível/], [404, 502, /modelo|Modelo/],
]) {
  test("erro HF " + upstream + " recebe mensagem útil sem detalhes privados", async (t) => {
    const { base } = await start(t, { client: {
      async imageToImage() {
        throw new InferenceClientProviderApiError("private: " + FAKE_TOKEN,
          { url: "https://router.huggingface.co/test", method: "POST" },
          { requestId: "offline", status: upstream, body: "private provider detail" });
      },
    } });
    const response = await post(base, { image: IMAGE, profession: "Web Developer" });
    assert.equal(response.status, expected);
    const result = await response.text();
    assert.match(result, message);
    assert.ok(!result.includes(FAKE_TOKEN));
    assert.ok(!result.includes("private provider detail"));
  });
}

test("modelo sem provedor, tempo limite e resposta inválida são tratados", async (t) => {
  for (const failure of [
    { error: new InferenceClientInputError("No provider"), status: 502 },
    { error: new DOMException("Timeout", "TimeoutError"), status: 504 },
    { blob: new Blob(["not an image"], { type: "text/html" }), status: 502 },
    { blob: new Blob([], { type: "image/png" }), status: 502 },
  ]) {
    const { base } = await start(t, { client: {
      async imageToImage() {
        if (failure.error) throw failure.error;
        return failure.blob;
      },
    } });
    const response = await post(base, { image: IMAGE, profession: "Web Developer" });
    assert.equal(response.status, failure.status);
    assert.ok((await response.json()).error);
  }
});

test("EMAIL_GATE exige @ancora.com.br e devolve a arte já gerada", async (t) => {
  let hfCalls = 0;
  const ctx = await start(t, {
    env: { HF_TOKEN: FAKE_TOKEN, EMAIL_GATE: "1" },
    client: {
      async imageToImage() {
        hfCalls += 1;
        return new Blob([Buffer.from(PNG_BASE64, "base64")], { type: "image/png" });
      },
    },
  });
  const { base, pixelArtDir, logPath } = ctx;
  const health = await (await nativeFetch(base + "/api/health")).json();
  assert.equal(health.emailGateEnabled, true);

  const bad = await post(base, {
    image: IMAGE, profession: "Web Developer", email: "alguem@gmail.com",
  });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /ancora\.com\.br/i);

  const missing = await post(base, { image: IMAGE, profession: "Web Developer" });
  assert.equal(missing.status, 400);

  const ok = await post(base, {
    image: IMAGE,
    profession: "Web Developer",
    email: "pessoa@ancora.com.br",
  });
  assert.equal(ok.status, 200);
  const first = await ok.json();
  assert.equal(first.saved, true);
  assert.equal(first.cached, false);
  assert.match(first.url, /^data:image\/jpeg;base64,/);
  assert.equal(first.width, 1456);
  assert.equal(first.height, 720);
  assert.equal(hfCalls, 1);

  const files = fs.readdirSync(pixelArtDir).filter((f) => /\.(jpe?g|png)$/i.test(f));
  assert.equal(files.length, 1);
  const log = JSON.parse(fs.readFileSync(logPath, "utf8"));
  assert.equal(log.length, 1);
  assert.equal(log[0].email, "pessoa@ancora.com.br");
  assert.equal(log[0].file, files[0]);

  const again = await post(base, {
    image: IMAGE,
    profession: "Web Developer",
    email: "pessoa@ancora.com.br",
  });
  assert.equal(again.status, 200);
  const reused = await again.json();
  assert.equal(reused.cached, true);
  assert.equal(reused.url, first.url);
  assert.equal(hfCalls, 1, "Não deve chamar o HF de novo");
  assert.equal(
    fs.readdirSync(pixelArtDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).length,
    1
  );
});

test("HTML carrega o novo script e o servidor publica somente arquivos da tela", async (t) => {
  const { base } = await start(t);
  const page = await (await nativeFetch(base + "/")).text();
  assert.match(page, /huggingface-stylize\.js/);
  assert.match(page, /style\.css/);
  assert.match(page, /content\.js/);
  assert.match(page, /download-card\.js/);
  assert.match(page, /modern-screenshot\.js/);
  assert.doesNotMatch(page, /id="huggingface-health"/);
  assert.match(page, /class="card-art-frame"/);
  assert.match(page, /id="profession"/);
  assert.match(page, /id="email"/);
  for (const file of [
    "style.css", "content.json", "content.js",
    "script.js", "download-card.js", "huggingface-stylize.js", "modern-screenshot.js",
  ]) {
    assert.equal((await nativeFetch(base + "/" + file)).status, 200);
  }
  assert.equal((await nativeFetch(base + "/img/pc.png")).status, 200);
  assert.equal((await nativeFetch(base + "/img/maquina-cafe.png")).status, 200);
  assert.equal((await nativeFetch(base + "/img/ar-condicionado.png")).status, 200);
  assert.equal((await nativeFetch(base + "/img/../server.js")).status, 404);
  for (const file of ["server.js", "package.json", "README.md", "test/server.test.js"]) {
    assert.equal((await nativeFetch(base + "/" + file)).status, 404);
  }
  assert.equal((await nativeFetch(base + "/%E0%A4%A")).status, 400);
});
