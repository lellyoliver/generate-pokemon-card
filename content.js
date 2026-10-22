(() => {
  "use strict";

  function setText(el, value) {
    if (!el || value == null) return;
    el.textContent = value;
  }

  function applyBrand(C) {
    const badge = document.querySelector(".brand-badge");
    const title = document.querySelector(".brand h1");
    const sub = document.querySelector(".brand-sub");
    const jokes = document.querySelector(".brand-jokes");
    setText(badge, C.brand && C.brand.badge);
    setText(title, C.brand && C.brand.title);
    setText(sub, C.brand && C.brand.subtitle);
    if (jokes && C.brand && Array.isArray(C.brand.jokes)) {
      jokes.innerHTML = "";
      C.brand.jokes.forEach((joke) => {
        const span = document.createElement("span");
        if (joke.warn) span.className = "warn";
        span.textContent = joke.text;
        jokes.appendChild(span);
      });
    }
  }

  function applyTicker(C) {
    const track = document.querySelector(".ticker-track");
    if (!track || !Array.isArray(C.ticker) || !C.ticker.length) return;
    const items = C.ticker;
    const repeat = 4;
    track.innerHTML = "";
    for (let r = 0; r < repeat; r += 1) {
      items.forEach((item) => {
        const span = document.createElement("span");
        const tag = document.createElement("i");
        tag.className = "tag";
        tag.textContent = item.tag || "";
        span.appendChild(tag);
        span.appendChild(document.createTextNode(" " + (item.text || "")));
        track.appendChild(span);
      });
    }
  }

  function applyFloaters(C) {
    const host = document.getElementById("scene-floaters");
    if (!host || !Array.isArray(C.floaters)) return;
    host.innerHTML = "";
    C.floaters.forEach((item) => {
      if (!item || !item.src) return;
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.alt || "";
      img.className = "floater" + (item.class ? " " + item.class : "");
      img.draggable = false;
      host.appendChild(img);
    });
  }

  function applyForm(C) {
    const F = C.form || {};
    setText(document.getElementById("form-title"), F.title);

    document.querySelectorAll(".wizard-step .step-title").forEach((el, i) => {
      if (F.steps && F.steps[i]) el.textContent = F.steps[i];
    });

    const labels = F.labels || {};
    const labelFor = (id, key) => {
      const input = document.getElementById(id);
      if (!input || !labels[key]) return;
      const lab = document.querySelector(`label[for="${id}"]`);
      setText(lab, labels[key]);
    };
    labelFor("name", "name");
    labelFor("age", "age");
    labelFor("profession", "profession");
    labelFor("email", "email");
    labelFor("photo-input", "photo");
    labelFor("gender", "gender");
    labelFor("skin", "skin");
    labelFor("hair-color", "hairColor");
    labelFor("eye-color", "eyeColor");
    labelFor("hair-length", "hairLength");
    labelFor("hair-type", "hairType");
    labelFor("glasses", "glasses");

    const placeholders = F.placeholders || {};
    const name = document.getElementById("name");
    const age = document.getElementById("age");
    const email = document.getElementById("email");
    if (name && placeholders.name) name.placeholder = placeholders.name;
    if (age && placeholders.age) age.placeholder = placeholders.age;
    if (email && placeholders.email) email.placeholder = placeholders.email;

    const hints = F.hints || {};
    const ageHint = document.querySelector("#field-age .hint");
    const professionHint = document.querySelector("#field-profession .hint");
    const emailHint = document.querySelector("#field-email .hint");
    const appearanceIntro = document.getElementById("appearance-intro");
    const downloadHint = document.querySelector('.wizard-step[data-step="4"] .hint');
    setText(ageHint, hints.age);
    setText(professionHint, hints.profession);
    setText(emailHint, hints.email);
    setText(appearanceIntro, hints.appearance);
    setText(downloadHint, hints.download);

    fillAppearanceSelects(F);

    const quiz = C.quiz || {};
    setText(document.getElementById("quiz-intro"), quiz.intro);
    setText(document.getElementById("quiz-result-title"), quiz.resultTitle);

    const errors = F.errors || {};
    setText(document.getElementById("name-error"), errors.name);
    setText(document.getElementById("age-error"), errors.age);
    setText(document.getElementById("profession-error"), errors.profession);
    setText(document.getElementById("email-error"), errors.email);
    const appearanceError = errors.appearance || "Preencha todas as características.";
    [
      "gender-error",
      "skin-error",
      "hair-color-error",
      "eye-color-error",
      "hair-length-error",
      "hair-type-error",
      "glasses-error",
    ].forEach((id) => setText(document.getElementById(id), appearanceError));

    const buttons = F.buttons || {};
    const btnMap = [
      ["btn-stylize", "stylize"],
      ["btn-clear-photo", "clearPhoto"],
      ["btn-download", "download"],
      ["btn-reset", "reset"],
      ["btn-wizard-back", "back"],
      ["btn-wizard-next", "next"],
    ];
    btnMap.forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el && buttons[key]) el.textContent = buttons[key];
    });

    const preview = document.getElementById("photo-preview");
    if (preview && F.photoAlt) preview.alt = F.photoAlt;
  }

  function fillSelect(select, options, placeholder) {
    if (!select || !Array.isArray(options)) return;
    const current = select.value;
    select.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = placeholder || "Selecione…";
    select.appendChild(empty);
    options.forEach((opt) => {
      if (!opt || !opt.value) return;
      const el = document.createElement("option");
      el.value = opt.value;
      el.textContent = opt.label || opt.value;
      select.appendChild(el);
    });
    if (current) select.value = current;
  }

  function fillAppearanceSelects(F) {
    const A = F.appearance || {};
    const ph = (F.placeholders && F.placeholders.select) || "Selecione…";
    fillSelect(document.getElementById("gender"), A.gender, ph);
    fillSelect(document.getElementById("skin"), A.skin, ph);
    fillSelect(document.getElementById("hair-color"), A.hairColor, ph);
    fillSelect(document.getElementById("eye-color"), A.eyeColor, ph);
    fillSelect(document.getElementById("hair-length"), A.hairLength, ph);
    fillSelect(document.getElementById("hair-type"), A.hairType, ph);
    fillSelect(document.getElementById("glasses"), A.glasses, ph);
  }

  function applyProfessions(C) {
    const select = document.getElementById("profession");
    if (!select || !Array.isArray(C.professions)) return;
    const current = select.value;
    const placeholder =
      (C.form && C.form.placeholders && C.form.placeholders.profession) || "Selecione…";
    select.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = placeholder;
    select.appendChild(empty);
    C.professions.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.value;
      opt.textContent = p.label;
      select.appendChild(opt);
    });
    if (current) select.value = current;
  }

  function applyCard(C) {
    const card = C.card || {};
    setText(document.getElementById("card-name"), card.emptyName);
    setText(document.getElementById("card-stage"), card.emptyStage);
    setText(document.getElementById("card-desc"), card.emptyDesc);
    setText(document.getElementById("card-info-bar"), card.infoFallback);
    const energy = document.getElementById("card-energy");
    if (energy && card.energyTitle) energy.title = card.energyTitle;

    const stats = card.stats || {};
    const items = document.querySelectorAll(".card-stats-bar .item");
    const keys = ["age", "health", "rarity"];
    items.forEach((item, i) => {
      const span = item.querySelector("span");
      if (span && stats[keys[i]]) span.textContent = stats[keys[i]];
    });

    const attrsTitle = document.getElementById("card-attrs-title");
    if (attrsTitle && card.attrsTitle) attrsTitle.textContent = card.attrsTitle;

    const attrs = card.attrs || {};
    document.querySelectorAll(".card-attrs-bar .attr span[data-attr]").forEach((span) => {
      const key = span.getAttribute("data-attr");
      if (key && attrs[key]) span.textContent = attrs[key];
    });

    const benefits = card.attrsBenefit || {};
    document.querySelectorAll(".card-attrs-bar .attr-benefit[data-benefit]").forEach((el) => {
      const key = el.getAttribute("data-benefit");
      if (key && benefits[key]) el.textContent = benefits[key];
    });
  }

  function applyContent(C) {
    if (!C) return;
    if (C.meta && C.meta.title) document.title = C.meta.title;
    if (C.meta && C.meta.lang) document.documentElement.lang = C.meta.lang;
    applyBrand(C);
    applyTicker(C);
    applyFloaters(C);
    applyForm(C);
    applyProfessions(C);
    applyCard(C);
  }

  async function loadContent() {
    // Relative path: works under / and under GitHub Pages project URLs (/repo/).
    const res = await fetch(new URL("content.json", document.baseURI), { cache: "no-cache" });
    if (!res.ok) throw new Error("Não foi possível carregar content.json");
    return res.json();
  }

  window.applyAppContent = applyContent;

  loadContent()
    .then((content) => {
      window.APP_CONTENT = content;
      applyContent(content);
      window.dispatchEvent(new Event("app-content-ready"));
    })
    .catch((err) => {
      console.error(err);
      window.APP_CONTENT = window.APP_CONTENT || {};
      window.dispatchEvent(new Event("app-content-ready"));
    });
})();
