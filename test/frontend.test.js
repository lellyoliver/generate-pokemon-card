"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "../huggingface-stylize.js"), "utf8");
const PHOTO = "data:image/jpeg;base64,/9j/AA==";
const ART = "data:image/png;base64,iVBORw0KGgo=";

async function setup(configured) {
  const elements = new Map();
  for (const id of ["photo-input", "photo-preview", "btn-stylize", "btn-clear-photo",
    "stylize-status", "btn-reset", "profession", "field-profession", "email", "field-email"]) {
    const handlers = new Map();
    elements.set(id, {
      dataset: {},
      value: id === "profession" ? "Web Developer" : "",
      files: [],
      hidden: id === "field-email",
      classList: {
        toggle() {},
        remove() {},
      },
      querySelector() { return null; },
      addEventListener(type, handler) {
        if (!handlers.has(type)) handlers.set(type, []);
        handlers.get(type).push(handler);
      },
      async fire(type) {
        for (const handler of handlers.get(type) || []) await handler();
      },
    });
  }
  const portraits = [];
  const requests = [];
  const canvases = [];
  let finish;
  vm.runInNewContext(source, {
    console: { error() {} },
    window: {
      APP_CONTENT: {},
      setCardPortrait: image => portraits.push(image),
      getAppearanceTraits: () => ({
        gender: "feminino",
        skin: "clara",
        hairColor: "castanho",
        eyeColor: "castanho",
        hairLength: "medio",
        hairType: "liso",
        glasses: "nao",
      }),
      addEventListener() {},
    },
    document: {
      readyState: "complete",
      baseURI: "http://localhost/",
      getElementById: id => elements.get(id),
      addEventListener() {},
      createElement(tag) {
        assert.equal(tag, "canvas");
        const canvas = {
          getContext: () => ({ drawImage() {} }),
          toDataURL: () => PHOTO,
        };
        canvases.push(canvas);
        return canvas;
      },
    },
    FileReader: class {
      readAsDataURL() { this.result = PHOTO; this.onload(); }
    },
    Image: class {
      constructor() { this.width = 1200; this.height = 800; }
      set src(_) { this.onload(); }
    },
    URL,
    fetch: async (url, options) => {
      const href = String(url);
      if (href === "http://localhost/api/health") {
        return {
          ok: true,
          json: async () => ({
            provider: "huggingface",
            hfConfigured: configured,
            emailGateEnabled: false,
            emailDomain: "ancora.com.br",
          }),
        };
      }
      assert.equal(href, "http://localhost/api/stylize");
      requests.push(JSON.parse(options.body));
      return new Promise(resolve => {
        finish = (ok = true) => resolve({
          ok, json: async () => ok ? { url: ART } : { error: "Sem créditos disponíveis." },
        });
      });
    },
  });
  await new Promise(setImmediate);
  return { elements, portraits, requests, canvases, finish: ok => finish(ok) };
}

test("tela consulta health, transforma a foto e limpa o estado ao reiniciar", async () => {
  const app = await setup(true);
  const get = id => app.elements.get(id);
  assert.equal(get("btn-stylize").disabled, true);
  get("photo-input").files = [{ type: "image/png" }];
  await get("photo-input").fire("change");
  assert.equal(app.canvases[0].width, 768);
  assert.equal(app.canvases[0].height, 512);
  assert.equal(get("btn-stylize").disabled, false);
  const generating = get("btn-stylize").fire("click");
  assert.equal(get("btn-stylize").disabled, true);
  assert.match(get("btn-stylize").textContent, /Gerando cartoon/);
  assert.equal(get("btn-reset").disabled, true);
  assert.equal(get("btn-clear-photo").disabled, true);
  assert.equal(app.requests.length, 1);
  assert.equal(app.requests[0].image, PHOTO);
  assert.equal(app.requests[0].profession, "Web Developer");
  assert.equal(app.requests[0].appearance.gender, "feminino");
  // Segundo clique enquanto carrega não dispara outra API
  await get("btn-stylize").fire("click");
  assert.equal(app.requests.length, 1);
  app.finish();
  await generating;
  assert.equal(get("photo-preview").src, ART);
  assert.equal(app.portraits.at(-1), ART);
  assert.match(get("stylize-status").textContent, /Cartoon pronto|Pixel art pronto/);
  assert.match(get("btn-stylize").textContent, /Transformar em cartoon/);
  assert.equal(get("btn-reset").disabled, false);
  await get("btn-reset").fire("click");
  assert.equal(get("btn-stylize").disabled, true);
  assert.equal(get("photo-preview").hidden, true);
  assert.equal(app.portraits.at(-1), null);
});

test("sem token a tela mantém a geração desativada mesmo depois do upload", async () => {
  const app = await setup(false);
  app.elements.get("photo-input").files = [{ type: "image/png" }];
  await app.elements.get("photo-input").fire("change");
  assert.equal(app.elements.get("btn-stylize").disabled, true);
  await app.elements.get("btn-stylize").fire("click");
  assert.equal(app.requests.length, 0);
});

test("erro da API aparece na tela e libera os controles para nova tentativa", async () => {
  const app = await setup(true);
  app.elements.get("photo-input").files = [{ type: "image/png" }];
  await app.elements.get("photo-input").fire("change");
  const generating = app.elements.get("btn-stylize").fire("click");
  app.finish(false);
  await generating;
  assert.equal(app.elements.get("stylize-status").textContent, "Sem créditos disponíveis.");
  assert.equal(app.elements.get("stylize-status").dataset.kind, "warn");
  assert.equal(app.elements.get("btn-stylize").disabled, false);
  assert.equal(app.elements.get("photo-input").disabled, false);
  assert.equal(app.portraits.at(-1), PHOTO);
});
