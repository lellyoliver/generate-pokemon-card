(() => {
  "use strict";

  const STORAGE_HP = "carta-tecnologia-hp";

  function content() {
    return window.APP_CONTENT || {};
  }

  function txt(path, fallback) {
    const parts = String(path).split(".");
    let cur = content();
    for (let i = 0; i < parts.length; i += 1) {
      if (cur == null || typeof cur !== "object") return fallback;
      cur = cur[parts[i]];
    }
    return cur != null && cur !== "" ? cur : fallback;
  }

  /** Temas/cores ficam aqui; textos vêm de content.json. */
  const TEMPERAMENTS = {
    sanguineo: {
      id: "sanguineo",
      label: "Sanguíneo",
      icon: "☀️",
      name: "",
      summary: "",
      attention: "",
      artBg: "linear-gradient(160deg, #20c2f1 0%, #0f9bd6 50%, #1060b0 100%)",
      theme: {
        primary: "#0f9bd6",
        bodyFrom: "#20c2f1",
        bodyMid: "#1060b0",
        bodyTo: "#0050a0",
        glow: "rgba(32, 194, 241, 0.45)",
      },
    },
    colerico: {
      id: "colerico",
      label: "Colérico",
      icon: "⚡",
      name: "",
      summary: "",
      attention: "",
      artBg: "linear-gradient(160deg, #3070b0 0%, #1060b0 45%, #004090 100%)",
      theme: {
        primary: "#1060b0",
        bodyFrom: "#3070b0",
        bodyMid: "#1060b0",
        bodyTo: "#004090",
        glow: "rgba(16, 96, 176, 0.45)",
      },
    },
    melancholico: {
      id: "melancholico",
      label: "Melancólico",
      icon: "🍂",
      name: "",
      summary: "",
      attention: "",
      artBg: "linear-gradient(160deg, #6561ab 0%, #6259a8 55%, #5350a1 100%)",
      theme: {
        primary: "#6259a8",
        bodyFrom: "#6561ab",
        bodyMid: "#5050a0",
        bodyTo: "#004090",
        glow: "rgba(98, 89, 168, 0.45)",
      },
    },
    fleumatico: {
      id: "fleumatico",
      label: "Fleumático",
      icon: "🌊",
      name: "",
      summary: "",
      attention: "",
      artBg: "linear-gradient(160deg, #0ea8de 0%, #0050a0 55%, #004090 100%)",
      theme: {
        primary: "#0050a0",
        bodyFrom: "#0f9bd6",
        bodyMid: "#0050a0",
        bodyTo: "#004090",
        glow: "rgba(0, 80, 160, 0.45)",
      },
    },
  };

  const COMBOS = {
    "sanguineo-colerico": {
      icon: "🌦️",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #20c2f1 0%, #1060b0 50%, #004090 100%)",
    },
    "sanguineo-fleumatico": {
      icon: "🏖️",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #20c2f1 0%, #0f9bd6 50%, #0050a0 100%)",
    },
    "sanguineo-melancholico": {
      icon: "🌅",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #20c2f1 0%, #6259a8 40%, #004090 100%)",
    },
    "colerico-sanguineo": {
      icon: "🔥",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #3070b0 0%, #1060b0 40%, #004090 100%)",
    },
    "colerico-melancholico": {
      icon: "🌪️",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #1060b0 0%, #5050a0 40%, #004090 100%)",
    },
    "colerico-fleumatico": {
      icon: "💨",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #448ecb 0%, #1060b0 50%, #004090 100%)",
    },
    "melancholico-sanguineo": {
      icon: "🌫️",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #6561ab 0%, #0f9bd6 40%, #004090 100%)",
    },
    "melancholico-colerico": {
      icon: "🌬️",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #6259a8 0%, #1060b0 55%, #004090 100%)",
    },
    "melancholico-fleumatico": {
      icon: "🌲",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #5350a1 0%, #0050a0 50%, #004090 100%)",
    },
    "fleumatico-sanguineo": {
      icon: "🏝️",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #0ea8de 0%, #20c2f1 40%, #0050a0 100%)",
    },
    "fleumatico-colerico": {
      icon: "🏞️",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #0f9bd6 0%, #1060b0 45%, #004090 100%)",
    },
    "fleumatico-melancholico": {
      icon: "🧊",
      name: "",
      desc: "",
      artBg: "linear-gradient(160deg, #0ea8de 0%, #6259a8 40%, #004090 100%)",
    },
  };

  const RARITIES = [
    {
      name: "Comum",
      border: "#448ecb",
      borderAlt: "#b0c8e8",
      glow: "rgba(68, 142, 203, 0.4)",
      holo: false,
    },
    {
      name: "Incomum",
      border: "#1060b0",
      borderAlt: "#20c2f1",
      glow: "rgba(16, 96, 176, 0.45)",
      holo: false,
    },
    {
      name: "Rara",
      border: "#0050a0",
      borderAlt: "#0f9bd6",
      glow: "rgba(0, 80, 160, 0.45)",
      holo: false,
    },
    {
      name: "Rara Ultra",
      border: "#6259a8",
      borderAlt: "#6561ab",
      glow: "rgba(98, 89, 168, 0.5)",
      holo: true,
    },
    {
      name: "Rara Ilustração Especial",
      border: "#004090",
      borderAlt: "#20c2f1",
      glow: "rgba(0, 64, 144, 0.5)",
      holo: true,
      rainbow: true,
    },
  ];

  function applyContentTexts() {
    const temps = content().temperaments || {};
    Object.keys(TEMPERAMENTS).forEach((id) => {
      const src = temps[id];
      if (!src) return;
      if (src.label) TEMPERAMENTS[id].label = src.label;
      if (src.labelSecondary) TEMPERAMENTS[id].labelSecondary = src.labelSecondary;
      if (src.icon) TEMPERAMENTS[id].icon = src.icon;
      if (src.name) TEMPERAMENTS[id].name = src.name;
      if (src.summary) TEMPERAMENTS[id].summary = src.summary;
      if (src.attention) TEMPERAMENTS[id].attention = src.attention;
    });

    const combos = content().combos || {};
    Object.keys(COMBOS).forEach((key) => {
      const src = combos[key];
      if (!src) return;
      if (src.icon) COMBOS[key].icon = src.icon;
      if (src.name) COMBOS[key].name = src.name;
      if (src.desc) COMBOS[key].desc = src.desc;
      if (src.attention) COMBOS[key].attention = src.attention;
    });

    const rarities = content().rarities;
    if (Array.isArray(rarities)) {
      rarities.forEach((src, i) => {
        if (!RARITIES[i] || !src) return;
        if (src.name) RARITIES[i].name = src.name;
      });
    }
  }

  const DEFAULT_THEME = {
    primary: "#6259a8",
    bodyFrom: "#20c2f1",
    bodyMid: "#1060b0",
    bodyTo: "#004090",
    glow: "rgba(98, 89, 168, 0.45)",
  };

  const DEFAULT_RARITY_STYLE = {
    border: "#1060b0",
    borderAlt: "#20c2f1",
    glow: "rgba(16, 96, 176, 0.45)",
    holo: false,
    rainbow: false,
  };

  const state = {
    name: "",
    age: null,
    dominant: null,
    secondary: null,
    hp: null,
    portraitUrl: null,
    /** Poder gerado (LLM ou fallback): { name, summary, attention } */
    generatedPower: null,
    powerLoading: false,
  };

  const quizState = {
    index: 0,
    answers: [],
  };

  const els = {
    name: document.getElementById("name"),
    age: document.getElementById("age"),
    ageField: document.getElementById("field-age"),
    ageError: document.getElementById("age-error"),
    profession: document.getElementById("profession"),
    quizPanel: document.getElementById("quiz-panel"),
    quizResult: document.getElementById("quiz-result"),
    quizProgress: document.getElementById("quiz-progress"),
    quizQuestion: document.getElementById("quiz-question"),
    quizOptions: document.getElementById("quiz-options"),
    quizResultText: document.getElementById("quiz-result-text"),
    btnReset: document.getElementById("btn-reset"),
    card: document.getElementById("card"),
    cardStage: document.getElementById("card-stage"),
    cardName: document.getElementById("card-name"),
    cardHp: document.getElementById("card-hp"),
    cardEnergy: document.getElementById("card-energy"),
    cardArt: document.getElementById("card-art"),
    cardIcon: document.getElementById("card-icon"),
    cardPortrait: document.getElementById("card-portrait"),
    cardInfoBar: document.getElementById("card-info-bar"),
    cardAbilityCost: document.getElementById("card-ability-cost"),
    cardComboName: document.getElementById("card-combo-name"),
    cardDesc: document.getElementById("card-desc"),
    cardAge: document.getElementById("card-age"),
    cardHealth: document.getElementById("card-health"),
    cardRarityStat: document.getElementById("card-rarity-stat"),
    cardAttrsBar: document.getElementById("card-attrs-bar"),
    cardAttrsPower: document.getElementById("card-attrs-power"),
    gender: document.getElementById("gender"),
    skin: document.getElementById("skin"),
    hairColor: document.getElementById("hair-color"),
    eyeColor: document.getElementById("eye-color"),
    hairLength: document.getElementById("hair-length"),
    hairType: document.getElementById("hair-type"),
    glasses: document.getElementById("glasses"),
    attrPaciencia: document.getElementById("attr-paciencia"),
    attrHumor: document.getElementById("attr-humor"),
    attrCafe: document.getElementById("attr-cafe"),
    attrNerdisse: document.getElementById("attr-nerdisse"),
    cardEnergyLabel: document.getElementById("card-energy-label"),
  };

  /** Atributos-base por temperamento (junção de poder). Escala 0–10, Nerdisse 0–50. */
  const ATTR_BASE = {
    colerico: { paciencia: 0, humor: 3, cafe: 10, nerdisse: 25 },
    melancholico: { paciencia: 4, humor: 2, cafe: 8, nerdisse: 50 },
    sanguineo: { paciencia: 5, humor: 10, cafe: 6, nerdisse: 20 },
    fleumatico: { paciencia: 10, humor: 6, cafe: 7, nerdisse: 15 },
  };

  /** Dano médio típico do poder → usado no score /10 (÷ 6, máx 10). */
  const ATTR_DAMAGE_MID = {
    colerico: 47,
    melancholico: 25,
    sanguineo: 33,
    fleumatico: 15,
  };

  function resolveAttributes(dominant, secondary) {
    if (!dominant || !ATTR_BASE[dominant]) return null;
    const a = ATTR_BASE[dominant];
    if (!secondary || secondary === dominant || !ATTR_BASE[secondary]) {
      return { ...a };
    }
    const b = ATTR_BASE[secondary];
    const mix = (x, y) => Math.round(x * 0.7 + y * 0.3);
    return {
      paciencia: mix(a.paciencia, b.paciencia),
      humor: mix(a.humor, b.humor),
      cafe: mix(a.cafe, b.cafe),
      nerdisse: mix(a.nerdisse, b.nerdisse),
    };
  }

  /** Poder de junção 1–10: média de attrs normalizados + dano típico. */
  function computePowerScore(attrs, dominant) {
    if (!attrs) return null;
    const danoMid = ATTR_DAMAGE_MID[dominant] != null ? ATTR_DAMAGE_MID[dominant] : 30;
    const danoN = Math.min(10, danoMid / 6);
    const avg =
      (attrs.paciencia + attrs.humor + attrs.cafe + attrs.nerdisse / 5 + danoN) / 5;
    return Math.max(1, Math.min(10, Math.round(avg)));
  }

  function getEvolution(age) {
    if (age == null || age < 18 || age > 90) return null;
    if (age <= 40) return txt("evolution.basic", "Basic");
    if (age <= 60) return txt("evolution.stage1", "Stage 1");
    return txt("evolution.stage2", "Stage 2");
  }

  function getRarity(age) {
    if (age == null || age < 18 || age > 90) return null;
    const index = Math.min(4, Math.floor((age - 18) / 14.4));
    return RARITIES[index];
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function mixHex(a, b, t) {
    const A = hexToRgb(a);
    const B = hexToRgb(b);
    const r = Math.round(A.r + (B.r - A.r) * t);
    const g = Math.round(A.g + (B.g - A.g) * t);
    const bl = Math.round(A.b + (B.b - A.b) * t);
    return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  function selectedProfessionValue() {
    return els.profession && els.profession.value ? els.profession.value.trim() : "";
  }

  function professionPack() {
    const value = selectedProfessionValue();
    if (!value) return null;
    const list = content().professions || [];
    return list.find((p) => p && p.value === value) || null;
  }

  /** Rótulo de ação na UI; role = dominant | secondary (nomes diferentes). */
  function actionLabel(tempId, role) {
    const base = TEMPERAMENTS[tempId];
    if (!base) return "";
    if (role === "secondary") return base.labelSecondary || base.label;
    return base.label;
  }

  function hookLabelsFromAnswers(answers) {
    const questions = getQuiz();
    const labels = [];
    answers.forEach((id, i) => {
      const q = questions[i];
      if (!q || !Array.isArray(q.options)) return;
      const opt = q.options.find((o) => o && o.id === id);
      if (opt && opt.label) labels.push(opt.label);
    });
    // Todas as respostas do quiz — a LLM monta name/punchline a partir delas.
    return labels;
  }

  function readAppearance() {
    return {
      gender: els.gender && els.gender.value ? els.gender.value.trim() : "",
      skin: els.skin && els.skin.value ? els.skin.value.trim() : "",
      hairColor: els.hairColor && els.hairColor.value ? els.hairColor.value.trim() : "",
      eyeColor: els.eyeColor && els.eyeColor.value ? els.eyeColor.value.trim() : "",
      hairLength: els.hairLength && els.hairLength.value ? els.hairLength.value.trim() : "",
      hairType: els.hairType && els.hairType.value ? els.hairType.value.trim() : "",
      glasses: els.glasses && els.glasses.value ? els.glasses.value.trim() : "",
    };
  }

  function appearanceComplete(a) {
    if (!a) return false;
    const required = ["gender", "skin", "hairColor", "eyeColor", "hairLength", "glasses"];
    if (!required.every((k) => a[k])) return false;
    if (a.hairLength === "careca") return true;
    return Boolean(a.hairType && a.hairType !== "");
  }

  async function requestGeneratedPower(dominant, secondary, answers) {
    const pack = professionPack();
    const profession = selectedProfessionValue();
    const professionLabel = (pack && pack.label) || profession;
    const hooks = hookLabelsFromAnswers(answers);
    const appearance = readAppearance();
    state.powerLoading = true;
    state.generatedPower = null;
    render();
    try {
      const res = await fetch("/api/generate-power", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession,
          professionLabel,
          dominant,
          secondary,
          hooks,
          gender: appearance.gender,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.power) {
        throw new Error((data && data.error) || "Falha ao gerar poder.");
      }
      const summary = String(data.power.summary || data.power.flavor || "").trim();
      const attention = String(data.power.attention || "").trim();
      state.generatedPower = {
        name: data.power.name,
        summary,
        attention,
        source: data.power.source,
      };
      if (!summary) {
        console.warn("[generate-power] resposta sem flavor/summary", data.power);
      }
    } catch (err) {
      console.warn("[generate-power] falha no client:", err && err.message);
      state.generatedPower = null;
    } finally {
      state.powerLoading = false;
      render();
    }
  }

  /** Quiz da profissão selecionada; senão, o quiz geral. */
  function getQuizConfig() {
    const global = content().quiz || {};
    const pack = professionPack();
    const local = pack && pack.quiz ? pack.quiz : null;
    const questions =
      local && Array.isArray(local.questions) && local.questions.length
        ? local.questions
        : Array.isArray(global.questions)
          ? global.questions
          : [];
    return {
      intro: (local && local.intro) || global.intro,
      progress: global.progress || "Pergunta {current} de {total}",
      resultTitle: (local && local.resultTitle) || global.resultTitle,
      resultText:
        (local && local.resultText) ||
        global.resultText ||
        "Dominante: {dominant} · Secundário: {secondary}",
      questions,
    };
  }

  function getQuiz() {
    return getQuizConfig().questions;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resetQuiz() {
    quizState.index = 0;
    quizState.answers = [];
    state.dominant = null;
    state.secondary = null;
    state.generatedPower = null;
    state.powerLoading = false;
    const quizIntro = document.getElementById("quiz-intro");
    if (quizIntro) {
      quizIntro.hidden = false;
      const intro = getQuizConfig().intro;
      if (intro) quizIntro.textContent = intro;
    }
    if (els.quizPanel) els.quizPanel.hidden = false;
    if (els.quizResult) els.quizResult.hidden = true;
    renderQuizQuestion();
    render();
  }

  function scoreQuiz(answers) {
    const scores = {
      sanguineo: 0,
      colerico: 0,
      melancholico: 0,
      fleumatico: 0,
    };
    answers.forEach((id) => {
      if (scores[id] != null) scores[id] += 1;
    });
    const order = ["sanguineo", "colerico", "melancholico", "fleumatico"];
    const ranked = order.slice().sort((a, b) => {
      if (scores[b] !== scores[a]) return scores[b] - scores[a];
      return order.indexOf(a) - order.indexOf(b);
    });
    const dominant = ranked[0];
    const secondary = ranked.find((id) => id !== dominant) || ranked[1];
    return { dominant, secondary, scores };
  }

  function showQuizResult() {
    const quiz = getQuizConfig();
    const { dominant, secondary } = scoreQuiz(quizState.answers);
    state.dominant = dominant;
    state.secondary = secondary;
    state.generatedPower = null;
    saveHp(rollHp());
    const quizIntro = document.getElementById("quiz-intro");
    if (quizIntro) quizIntro.hidden = true;
    if (els.quizPanel) {
      els.quizPanel.hidden = true;
      els.quizOptions.innerHTML = "";
    }
    if (els.quizResult) els.quizResult.hidden = false;
    const resultTitle = document.getElementById("quiz-result-title");
    if (resultTitle && quiz.resultTitle) resultTitle.textContent = quiz.resultTitle;
    if (els.quizResultText) {
      els.quizResultText.textContent = quiz.resultText
        .replace("{dominant}", actionLabel(dominant, "dominant"))
        .replace("{secondary}", actionLabel(secondary, "secondary"));
    }
    render();
    void requestGeneratedPower(dominant, secondary, quizState.answers.slice());
  }

  function renderQuizQuestion() {
    const quiz = getQuizConfig();
    const questions = quiz.questions;
    if (!els.quizOptions || !questions.length) return;

    if (quizState.index >= questions.length) {
      showQuizResult();
      return;
    }

    const quizIntro = document.getElementById("quiz-intro");
    if (quizIntro && !quizIntro.hidden && quiz.intro) {
      quizIntro.textContent = quiz.intro;
    }

    const q = questions[quizState.index];
    if (els.quizProgress) {
      els.quizProgress.textContent = quiz.progress
        .replace("{current}", String(quizState.index + 1))
        .replace("{total}", String(questions.length));
    }
    if (els.quizQuestion) els.quizQuestion.textContent = q.text || "";

    els.quizOptions.innerHTML = "";
    (q.options || []).forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option";
      btn.textContent = opt.label || "";
      btn.addEventListener("click", () => {
        quizState.answers.push(opt.id);
        quizState.index += 1;
        renderQuizQuestion();
      });
      els.quizOptions.appendChild(btn);
    });
  }

  function setupQuiz() {
    renderQuizQuestion();
  }

  function resolveTheme() {
    const pack = professionPack();
    if (pack && pack.theme) {
      return {
        primary: pack.theme.primary,
        bodyFrom: pack.theme.bodyFrom,
        bodyMid: pack.theme.bodyMid,
        bodyTo: pack.theme.bodyTo,
        glow: pack.theme.glow,
      };
    }

    const dominant = state.dominant ? TEMPERAMENTS[state.dominant] : null;
    if (!dominant) return { ...DEFAULT_THEME };

    const base = { ...dominant.theme };
    if (state.secondary && state.secondary !== state.dominant) {
      const sec = TEMPERAMENTS[state.secondary];
      if (sec) {
        return {
          primary: mixHex(base.primary, sec.theme.primary, 0.35),
          bodyFrom: mixHex(base.bodyFrom, sec.theme.bodyFrom, 0.35),
          bodyMid: mixHex(base.bodyMid, sec.theme.bodyMid, 0.35),
          bodyTo: mixHex(base.bodyTo, sec.theme.bodyTo, 0.35),
          glow: base.glow,
        };
      }
    }
    return base;
  }

  function applyCardColors(theme, rarity) {
    const rarityStyle = rarity || DEFAULT_RARITY_STYLE;
    const card = els.card;
    card.style.setProperty("--body-from", theme.bodyFrom);
    card.style.setProperty("--body-mid", theme.bodyMid);
    card.style.setProperty("--body-to", theme.bodyTo);
    card.style.setProperty("--theme-primary", theme.primary);
    card.style.setProperty("--theme-glow", theme.glow);
    card.style.setProperty("--rarity-border", rarityStyle.border);
    card.style.setProperty("--rarity-border-alt", rarityStyle.borderAlt);
    card.style.setProperty("--rarity-glow", rarityStyle.glow);
    card.classList.toggle("rarity-holo", Boolean(rarityStyle.holo));
    card.classList.toggle("rarity-rainbow", Boolean(rarityStyle.rainbow));
  }

  /** Ordem do mais estressado (0) ao mais calmo (3). */
  const TEMPERAMENT_CALMNESS = {
    colerico: 0,
    melancholico: 1,
    sanguineo: 2,
    fleumatico: 3,
  };

  /** Índice da faixa base do dominante (pula Médio e Muito alto — esses vêm do secundário). */
  const HP_BAND_INDEX = {
    colerico: 0,
    melancholico: 1,
    sanguineo: 3,
    fleumatico: 5,
  };

  const HP_BANDS = [
    { min: 30, max: 60 },
    { min: 70, max: 100 },
    { min: 110, max: 180 },
    { min: 190, max: 250 },
    { min: 260, max: 330 },
    { min: 340, max: 380 },
  ];

  function getHpClass(hp) {
    if (hp == null) return null;
    if (hp <= 60) return txt("hpClasses.veryLow", "Muito baixo");
    if (hp <= 100) return txt("hpClasses.low", "Baixo");
    if (hp <= 180) return txt("hpClasses.medium", "Médio");
    if (hp <= 250) return txt("hpClasses.high", "Alto");
    if (hp <= 330) return txt("hpClasses.veryHigh", "Muito alto");
    return txt("hpClasses.extreme", "Extremamente alto");
  }

  function hpRangeForTemperaments(dominant, secondary) {
    let index = HP_BAND_INDEX[dominant];
    if (index == null) index = 2;
    if (secondary && secondary !== dominant) {
      const d = TEMPERAMENT_CALMNESS[dominant];
      const s = TEMPERAMENT_CALMNESS[secondary];
      if (d != null && s != null) {
        if (s > d) index = Math.min(HP_BANDS.length - 1, index + 1);
        else if (s < d) index = Math.max(0, index - 1);
      }
    }
    return HP_BANDS[index];
  }

  function rollHp() {
    const range = hpRangeForTemperaments(state.dominant, state.secondary);
    const steps = Math.floor((range.max - range.min) / 10) + 1;
    const pick = Math.floor(Math.random() * steps);
    return range.min + pick * 10;
  }

  function validateAge(raw) {
    if (raw === "" || raw == null) return { ok: true, value: null };
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 18 || n > 90) {
      return { ok: false, value: null };
    }
    return { ok: true, value: n };
  }

  function parseGradientColors(css) {
    const matches = css.match(/#[0-9a-fA-F]{3,8}/g);
    return matches && matches.length ? matches : ["#6c757d", "#495057"];
  }

  function resolveProfile() {
    const dominant = state.dominant ? TEMPERAMENTS[state.dominant] : null;
    if (!dominant) return null;

    const pack = professionPack();
    const packArtBg = pack && pack.theme && pack.theme.artBg ? pack.theme.artBg : null;
    const gen = state.generatedPower;

    if (state.secondary && state.secondary !== state.dominant) {
      const key = `${state.dominant}-${state.secondary}`;
      const combo = COMBOS[key];
      if (combo) {
        const secondary = TEMPERAMENTS[state.secondary];
        const artBg = packArtBg || combo.artBg;
        return {
          icon: combo.icon,
          energyIcon: dominant.icon,
          energyLabel: `${actionLabel(state.dominant, "dominant")} + ${actionLabel(state.secondary, "secondary")}`,
          comboName: (gen && gen.name) || combo.name,
          desc:
            state.powerLoading
              ? "Gerando poder da carta…"
              : (gen && gen.summary) || combo.desc,
          attention: state.powerLoading
            ? null
            : (gen && gen.attention) || combo.attention || secondary.attention || null,
          artBg,
          artColors: parseGradientColors(artBg),
        };
      }
    }

    const artBg = packArtBg || dominant.artBg;
    return {
      icon: dominant.icon,
      energyIcon: dominant.icon,
      energyLabel: actionLabel(state.dominant, "dominant"),
      comboName: (gen && gen.name) || dominant.name || dominant.label,
      desc: state.powerLoading
        ? "Gerando poder da carta…"
        : (gen && gen.summary) || dominant.summary,
      attention: state.powerLoading
        ? null
        : (gen && gen.attention) || dominant.attention,
      artBg,
      artColors: parseGradientColors(artBg),
    };
  }

  function getCardSnapshot() {
    const ageCheck = validateAge(els.age.value);
    const age = ageCheck.ok ? ageCheck.value : null;
    const profile = resolveProfile();
    const rarity = getRarity(age);
    const theme = resolveTheme();

    return {
      name: state.name.trim() || txt("card.emptyName", "???"),
      age,
      evolution: getEvolution(age) || "—",
      hp: state.hp,
      hpClass: getHpClass(state.hp),
      attrs: (() => {
        const a = resolveAttributes(state.dominant, state.secondary);
        if (!a) return null;
        return {
          ...a,
          power: computePowerScore(a, state.dominant),
        };
      })(),
      rarityName: rarity ? rarity.name : "—",
      rarityStyle: rarity
        ? {
            border: rarity.border,
            borderAlt: rarity.borderAlt,
            glow: rarity.glow,
            holo: rarity.holo,
            rainbow: Boolean(rarity.rainbow),
          }
        : { ...DEFAULT_RARITY_STYLE },
      theme,
      profession: els.profession && els.profession.value ? els.profession.value : "",
      portraitUrl: state.portraitUrl,
      ready: Boolean(state.dominant),
      profile: profile || {
        icon: "❓",
        energyIcon: "❓",
        energyLabel: "—",
        comboName: "",
        desc: txt("card.emptyDesc", "Selecione uma ação dominante para revelar a descrição."),
        attention: null,
        artColors: ["#6c757d", "#495057"],
      },
    };
  }

  function render() {
    const ageCheck = validateAge(els.age.value);
    els.ageField.classList.toggle("has-error", !ageCheck.ok);
    state.age = ageCheck.ok ? ageCheck.value : null;

    const name = state.name.trim() || "???";
    const evolution = getEvolution(state.age);
    const rarity = getRarity(state.age);
    const profile = resolveProfile();
    const hpClass = getHpClass(state.hp);

    els.card.classList.toggle("empty", !state.dominant);
    applyCardColors(resolveTheme(), rarity);

    els.cardStage.textContent = evolution || "—";
    els.cardName.textContent = name;
    els.cardHp.textContent = state.hp != null ? state.hp : "??";
    els.cardAge.textContent = state.age != null ? state.age : "—";
    els.cardHealth.textContent = hpClass || "—";
    if (els.cardRarityStat) {
      els.cardRarityStat.textContent = rarity ? rarity.name : "—";
    }

    const attrs = resolveAttributes(state.dominant, state.secondary);
    if (els.cardAttrsBar) {
      els.cardAttrsBar.hidden = !attrs;
      if (attrs) {
        if (els.attrPaciencia) els.attrPaciencia.textContent = `${attrs.paciencia}/10`;
        if (els.attrHumor) els.attrHumor.textContent = `${attrs.humor}/10`;
        if (els.attrCafe) els.attrCafe.textContent = `${attrs.cafe}/10`;
        if (els.attrNerdisse) els.attrNerdisse.textContent = `${attrs.nerdisse}/50`;
        const power = computePowerScore(attrs, state.dominant);
        if (els.cardAttrsPower) {
          const label = txt("card.attrsPowerLabel", "Poder");
          els.cardAttrsPower.textContent = `${label} ${power}/10`;
        }
      }
    }

    if (els.cardInfoBar) {
      const pack = professionPack();
      els.cardInfoBar.textContent =
        (pack && pack.label) || txt("card.infoSuffix", "Carta de Tecnologia");
    }

    if (profile) {
      els.cardEnergy.textContent = profile.energyIcon;
      els.cardEnergyLabel.textContent = profile.energyLabel;
      els.cardIcon.textContent = profile.icon;
      if (els.cardAbilityCost) els.cardAbilityCost.textContent = profile.energyIcon;
      // Título do bloco = nome do poder (combo ou temperamento solo).
      els.cardComboName.textContent = profile.comboName || profile.energyLabel || "—";
      els.cardArt.style.setProperty("--art-bg", profile.artBg);
      els.cardArt.style.background = profile.artBg;

      let descHtml = escapeHtml(profile.desc);
      if (profile.attention) {
        descHtml += `<div class="attention">${escapeHtml(profile.attention)}</div>`;
      }
      els.cardDesc.innerHTML = descHtml;
    } else {
      els.cardEnergy.textContent = "❓";
      els.cardEnergyLabel.textContent = "—";
      els.cardIcon.textContent = "❓";
      if (els.cardAbilityCost) els.cardAbilityCost.textContent = "❓";
      els.cardComboName.textContent = "—";
      els.cardArt.style.background =
        "linear-gradient(160deg, #6c757d 0%, #495057 100%)";
      els.cardDesc.textContent = txt(
        "card.emptyDesc",
        "Selecione uma ação dominante para revelar a descrição."
      );
    }

    syncPortrait();
  }

  function syncPortrait() {
    const has = Boolean(state.portraitUrl);
    els.card.classList.toggle("has-portrait", has);
    if (els.cardPortrait) {
      if (has) {
        els.cardPortrait.src = state.portraitUrl;
        els.cardPortrait.hidden = false;
      } else {
        els.cardPortrait.removeAttribute("src");
        els.cardPortrait.hidden = true;
      }
    }
  }

  function setCardPortrait(url) {
    state.portraitUrl = url || null;
    syncPortrait();
  }

  function saveHp(hp) {
    state.hp = hp;
    localStorage.setItem(STORAGE_HP, String(hp));
  }

  function loadStored() {
    const hpRaw = localStorage.getItem(STORAGE_HP);
    if (hpRaw != null) {
      const hp = Number(hpRaw);
      if (Number.isInteger(hp) && hp >= 30 && hp <= 380 && hp % 10 === 0) {
        state.hp = hp;
      }
    }
    localStorage.removeItem("carta-tecnologia-retreat");
  }

  function setupCardTilt() {
    const card = els.card;
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltY = (x - 0.5) * 14;
      const tiltX = (0.5 - y) * 10;
      card.style.setProperty("--tilt-x", `${tiltX}deg`);
      card.style.setProperty("--tilt-y", `${tiltY}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  }

  const WIZARD_LAST = 4;
  let wizardStep = 0;

  function setWizardStep(step) {
    wizardStep = Math.max(0, Math.min(WIZARD_LAST, step));
    document.querySelectorAll(".wizard-step").forEach((el) => {
      el.classList.toggle("active", Number(el.dataset.step) === wizardStep);
    });
    document.querySelectorAll(".wizard-dot").forEach((dot) => {
      const i = Number(dot.dataset.dot);
      dot.classList.toggle("active", i === wizardStep);
      dot.classList.toggle("done", i < wizardStep);
    });
    const back = document.getElementById("btn-wizard-back");
    const next = document.getElementById("btn-wizard-next");
    if (back) back.disabled = wizardStep === 0;
    if (next) {
      next.hidden = wizardStep === WIZARD_LAST;
      next.textContent = txt("form.buttons.next", "Próximo →");
    }
  }

  function validateCorporateEmail(raw) {
    if (!window.EMAIL_GATE_ENABLED) return { ok: true };
    const domain = window.EMAIL_DOMAIN || "ancora.com.br";
    const email = String(raw || "").trim().toLowerCase();
    const escaped = String(domain).replace(/\./g, "\\.");
    const ok = new RegExp("^[^\\s@]+@" + escaped + "$").test(email);
    return { ok };
  }

  function markAppearanceErrors(show) {
    const a = readAppearance();
    const checks = [
      ["field-gender", () => !a.gender],
      ["field-skin", () => !a.skin],
      ["field-hair-color", () => !a.hairColor],
      ["field-eye-color", () => !a.eyeColor],
      ["field-hair-length", () => !a.hairLength],
      ["field-hair-type", () => a.hairLength !== "careca" && !a.hairType],
      ["field-glasses", () => !a.glasses],
    ];
    checks.forEach(([id, isBad]) => {
      const field = document.getElementById(id);
      if (field) field.classList.toggle("has-error", Boolean(show && isBad()));
    });
  }

  function syncHairTypeForBald() {
    if (!els.hairLength || !els.hairType) return;
    const bald = els.hairLength.value === "careca";
    els.hairType.disabled = bald;
    if (bald) els.hairType.value = "na";
    const field = document.getElementById("field-hair-type");
    if (field) field.classList.toggle("is-disabled", bald);
  }

  function canLeaveWizardStep(step) {
    if (step === 0) {
      const nameOk = Boolean(String(els.name.value || "").trim());
      const nameField = document.getElementById("field-name");
      if (nameField) nameField.classList.toggle("has-error", !nameOk);

      const ageFilled = els.age.value !== "" && els.age.value != null;
      const ageCheck = validateAge(els.age.value);
      const ageOk = ageFilled && ageCheck.ok;
      if (els.ageField) els.ageField.classList.toggle("has-error", !ageOk);

      const professionOk = Boolean(els.profession && els.profession.value);
      const professionField = document.getElementById("field-profession");
      if (professionField) professionField.classList.toggle("has-error", !professionOk);

      const emailField = document.getElementById("field-email");
      const emailInput = document.getElementById("email");
      let emailOk = true;
      if (window.EMAIL_GATE_ENABLED && emailField && !emailField.hidden) {
        const emailCheck = validateCorporateEmail(emailInput && emailInput.value);
        emailField.classList.toggle("has-error", !emailCheck.ok);
        emailOk = emailCheck.ok;
      }

      return nameOk && ageOk && professionOk && emailOk;
    }
    if (step === 1) {
      const a = readAppearance();
      const ok = appearanceComplete(a);
      markAppearanceErrors(!ok);
      if (!ok) {
        alert(txt("form.errors.appearance", "Preencha todas as características."));
      }
      return ok;
    }
    if (step === 2) {
      if (!state.dominant || !state.secondary) {
        alert(txt("wizard.needQuiz", "Responda todas as perguntas para gerar seu temperamento."));
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!state.portraitUrl) {
        alert(txt("wizard.needPortrait", "Envie a foto e gere o pixel art para continuar."));
        return false;
      }
      return true;
    }
    return true;
  }

  function setupWizard() {
    const back = document.getElementById("btn-wizard-back");
    const next = document.getElementById("btn-wizard-next");
    if (!back || !next) return;
    back.addEventListener("click", () => setWizardStep(wizardStep - 1));
    next.addEventListener("click", () => {
      if (!canLeaveWizardStep(wizardStep)) return;
      setWizardStep(wizardStep + 1);
    });
    setWizardStep(0);
  }

  function init() {
    applyContentTexts();
    loadStored();
    setupQuiz();
    setupCardTilt();
    setupWizard();

    els.name.addEventListener("input", () => {
      state.name = els.name.value;
      render();
    });

    els.age.addEventListener("input", () => render());
    if (els.profession) {
      els.profession.addEventListener("change", () => {
        // Trocar profissão = questionário diferente; recomeça o quiz.
        resetQuiz();
      });
    }
    if (els.hairLength) {
      els.hairLength.addEventListener("change", syncHairTypeForBald);
      syncHairTypeForBald();
    }

    els.btnReset.addEventListener("click", () => {
      state.name = "";
      state.age = null;
      state.dominant = null;
      state.secondary = null;
      state.hp = null;
      state.portraitUrl = null;
      state.generatedPower = null;
      els.name.value = "";
      els.age.value = "";
      if (els.profession) els.profession.value = "";
      [
        els.gender,
        els.skin,
        els.hairColor,
        els.eyeColor,
        els.hairLength,
        els.hairType,
        els.glasses,
      ].forEach((el) => {
        if (el) el.value = "";
      });
      syncHairTypeForBald();
      markAppearanceErrors(false);
      const emailInput = document.getElementById("email");
      if (emailInput) emailInput.value = "";
      const emailField = document.getElementById("field-email");
      if (emailField) emailField.classList.remove("has-error");
      localStorage.removeItem(STORAGE_HP);
      localStorage.removeItem("carta-tecnologia-retreat");
      resetQuiz();
      const photoInput = document.getElementById("photo-input");
      const photoPreview = document.getElementById("photo-preview");
      if (photoInput) photoInput.value = "";
      if (photoPreview) {
        photoPreview.removeAttribute("src");
        photoPreview.hidden = true;
      }
      const professionField = document.getElementById("field-profession");
      if (professionField) professionField.classList.remove("has-error");
      setWizardStep(0);
    });

    render();
  }

  function whenContentReady() {
    if (window.APP_CONTENT) return Promise.resolve();
    return new Promise((resolve) => {
      window.addEventListener("app-content-ready", () => resolve(), { once: true });
    });
  }

  window.getTemperamentoCardData = getCardSnapshot;
  window.setCardPortrait = setCardPortrait;
  window.getAppearanceTraits = readAppearance;
  window.getStylizeMood = function getStylizeMood() {
    const attrs = resolveAttributes(state.dominant, state.secondary);
    const gen = state.generatedPower;
    return {
      dominant: state.dominant || "",
      secondary: state.secondary || "",
      attrs: attrs || { paciencia: 0, humor: 0, cafe: 0, nerdisse: 0 },
      /** Texto da carta (LLM) → roteiro cômico da imagem */
      name: (gen && gen.name) || "",
      flavor: (gen && gen.summary) || "",
      attention: (gen && gen.attention) || "",
    };
  };

  whenContentReady().then(init);
})();
