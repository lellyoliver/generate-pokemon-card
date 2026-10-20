(() => {
  "use strict";

  const STORAGE_HP = "carta-tecnologia-hp";
  const STORAGE_RETREAT = "carta-tecnologia-retreat";

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
      symbol: "●",
      name: "Comum (Common)",
      border: "#448ecb",
      borderAlt: "#b0c8e8",
      glow: "rgba(68, 142, 203, 0.4)",
      holo: false,
    },
    {
      symbol: "◆",
      name: "Incomum (Uncommon)",
      border: "#1060b0",
      borderAlt: "#20c2f1",
      glow: "rgba(16, 96, 176, 0.45)",
      holo: false,
    },
    {
      symbol: "★",
      name: "Rara (Rare)",
      border: "#0050a0",
      borderAlt: "#0f9bd6",
      glow: "rgba(0, 80, 160, 0.45)",
      holo: false,
    },
    {
      symbol: "★★",
      name: "Rara Ultra (Ultra Rare)",
      border: "#6259a8",
      borderAlt: "#6561ab",
      glow: "rgba(98, 89, 168, 0.5)",
      holo: true,
    },
    {
      symbol: "★★★",
      name: "Rara Ilustração Especial (Special Illustration Rare)",
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
    });

    const rarities = content().rarities;
    if (Array.isArray(rarities)) {
      rarities.forEach((src, i) => {
        if (!RARITIES[i] || !src) return;
        if (src.symbol) RARITIES[i].symbol = src.symbol;
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
    retreat: null,
    portraitUrl: null,
  };

  const els = {
    name: document.getElementById("name"),
    age: document.getElementById("age"),
    ageField: document.getElementById("field-age"),
    ageError: document.getElementById("age-error"),
    profession: document.getElementById("profession"),
    dominantGrid: document.getElementById("dominant-grid"),
    secondaryGrid: document.getElementById("secondary-grid"),
    btnHp: document.getElementById("btn-hp"),
    btnRetreat: document.getElementById("btn-retreat"),
    btnReset: document.getElementById("btn-reset"),
    chipHp: document.getElementById("chip-hp"),
    chipHpClass: document.getElementById("chip-hp-class"),
    chipRetreat: document.getElementById("chip-retreat"),
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
    cardRetreat: document.getElementById("card-retreat"),
    cardEnergyLabel: document.getElementById("card-energy-label"),
    cardRaritySymbol: document.getElementById("card-rarity-symbol"),
    cardRarityName: document.getElementById("card-rarity-name"),
  };

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

  function resolveTheme() {
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

  function getHpClass(hp) {
    if (hp == null) return null;
    if (hp <= 60) return txt("hpClasses.veryLow", "Muito baixo");
    if (hp <= 100) return txt("hpClasses.low", "Baixo");
    if (hp <= 180) return txt("hpClasses.medium", "Médio");
    if (hp <= 250) return txt("hpClasses.high", "Alto");
    if (hp <= 330) return txt("hpClasses.veryHigh", "Muito alto");
    return txt("hpClasses.extreme", "Extremamente alto");
  }

  function rollHp() {
    // múltiplos de 10, de 30 a 380 → 36 valores possíveis
    const steps = Math.floor(Math.random() * 36);
    return 30 + steps * 10;
  }

  function rollRetreat() {
    return Math.floor(Math.random() * 6); // 0–5
  }

  function retreatSymbol(cost) {
    if (cost == null) return "—";
    if (cost === 0) return txt("retreat.none", "Nenhum");
    // Estrela estreita para caber 1–5 na coluna de recuo (visual e download).
    return "★".repeat(cost);
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

    if (state.secondary && state.secondary !== state.dominant) {
      const key = `${state.dominant}-${state.secondary}`;
      const combo = COMBOS[key];
      if (combo) {
        return {
          icon: combo.icon,
          energyIcon: dominant.icon,
          energyLabel: `${dominant.label} + ${TEMPERAMENTS[state.secondary].label}`,
          comboName: combo.name,
          desc: combo.desc,
          attention: null,
          artBg: combo.artBg,
          artColors: parseGradientColors(combo.artBg),
        };
      }
    }

    return {
      icon: dominant.icon,
      energyIcon: dominant.icon,
      energyLabel: dominant.label,
      comboName: dominant.name || dominant.label,
      desc: dominant.summary,
      attention: dominant.attention,
      artBg: dominant.artBg,
      artColors: parseGradientColors(dominant.artBg),
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
      retreat: state.retreat,
      retreatLabel: retreatSymbol(state.retreat),
      raritySymbol: rarity ? rarity.symbol : "●",
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
        desc: txt("card.emptyDesc", "Selecione um temperamento dominante para revelar a descrição."),
        attention: null,
        artColors: ["#6c757d", "#495057"],
      },
    };
  }

  function buildTempButtons(container, mode) {
    container.innerHTML = "";
    Object.values(TEMPERAMENTS).forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "temp-btn";
      btn.dataset.id = t.id;
      btn.style.setProperty("--temp-color", t.theme.primary);
      btn.innerHTML = `<span class="ico" aria-hidden="true">${t.icon}</span>${t.label}`;
      btn.addEventListener("click", () => {
        if (mode === "dominant") {
          if (state.dominant === t.id) {
            state.dominant = null;
          } else {
            state.dominant = t.id;
            if (state.secondary === t.id) state.secondary = null;
          }
        } else {
          if (state.secondary === t.id) {
            state.secondary = null;
          } else if (t.id !== state.dominant) {
            state.secondary = t.id;
          }
        }
        syncTempButtons();
        render();
      });
      container.appendChild(btn);
    });
  }

  function syncTempButtons() {
    els.dominantGrid.querySelectorAll(".temp-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.id === state.dominant);
    });
    els.secondaryGrid.querySelectorAll(".temp-btn").forEach((btn) => {
      const id = btn.dataset.id;
      btn.classList.toggle("secondary-active", id === state.secondary);
      btn.disabled = id === state.dominant;
      btn.style.opacity = id === state.dominant ? "0.4" : "1";
    });
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
    els.cardRetreat.textContent = retreatSymbol(state.retreat);

    if (rarity) {
      els.cardRaritySymbol.textContent = rarity.symbol;
      els.cardRarityName.textContent = rarity.name;
      els.cardRaritySymbol.style.color = rarity.border;
    } else {
      els.cardRaritySymbol.textContent = "●";
      els.cardRarityName.textContent = "—";
      els.cardRaritySymbol.style.color = "";
    }

    if (els.cardInfoBar) {
      const ageBit = state.age != null ? `IDADE ${state.age}` : "IDADE —";
      const temperBit = profile
        ? profile.energyLabel
        : txt("card.temperamentWord", "Temperamento");
      const professionBit = els.profession && els.profession.value
        ? els.profession.value
        : null;
      els.cardInfoBar.textContent = professionBit
        ? `${ageBit} · ${professionBit} · ${temperBit}`
        : `${ageBit} · ${temperBit} · ${txt("card.infoSuffix", "Carta de Tecnologia")}`;
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

      let descHtml = profile.desc;
      if (profile.attention) {
        descHtml += `<div class="attention">${profile.attention}</div>`;
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
        "Selecione um temperamento dominante para revelar a descrição."
      );
    }

    syncPortrait();

    els.chipHp.textContent = state.hp != null ? state.hp : "—";
    els.chipHpClass.textContent = hpClass || "—";
    els.chipRetreat.textContent = retreatSymbol(state.retreat);
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

  function saveRetreat(cost) {
    state.retreat = cost;
    localStorage.setItem(STORAGE_RETREAT, String(cost));
  }

  function loadStored() {
    const hpRaw = localStorage.getItem(STORAGE_HP);
    if (hpRaw != null) {
      const hp = Number(hpRaw);
      if (Number.isInteger(hp) && hp >= 30 && hp <= 380 && hp % 10 === 0) {
        state.hp = hp;
      }
    }
    const retreatRaw = localStorage.getItem(STORAGE_RETREAT);
    if (retreatRaw != null) {
      const r = Number(retreatRaw);
      if (Number.isInteger(r) && r >= 0 && r <= 5) {
        state.retreat = r;
      }
    }
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
      if (!state.dominant) {
        alert(txt("wizard.needDominant", "Selecione o temperamento dominante."));
        return false;
      }
      if (!state.secondary) {
        alert(txt("wizard.needSecondary", "Selecione o temperamento secundário."));
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (state.hp == null || state.retreat == null) {
        alert(txt("wizard.needStats", "Sorteie o HP e o custo de recuo para continuar."));
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
    buildTempButtons(els.dominantGrid, "dominant");
    buildTempButtons(els.secondaryGrid, "secondary");
    loadStored();
    syncTempButtons();
    setupCardTilt();
    setupWizard();

    els.name.addEventListener("input", () => {
      state.name = els.name.value;
      render();
    });

    els.age.addEventListener("input", () => render());
    if (els.profession) els.profession.addEventListener("change", () => render());

    els.btnHp.addEventListener("click", () => {
      saveHp(rollHp());
      render();
      els.btnHp.animate(
        [{ transform: "scale(1)" }, { transform: "scale(0.94)" }, { transform: "scale(1)" }],
        { duration: 220 }
      );
    });

    els.btnRetreat.addEventListener("click", () => {
      saveRetreat(rollRetreat());
      render();
      els.btnRetreat.animate(
        [{ transform: "scale(1)" }, { transform: "scale(0.94)" }, { transform: "scale(1)" }],
        { duration: 220 }
      );
    });

    els.btnReset.addEventListener("click", () => {
      state.name = "";
      state.age = null;
      state.dominant = null;
      state.secondary = null;
      state.hp = null;
      state.retreat = null;
      state.portraitUrl = null;
      els.name.value = "";
      els.age.value = "";
      if (els.profession) els.profession.value = "";
      const emailInput = document.getElementById("email");
      if (emailInput) emailInput.value = "";
      const emailField = document.getElementById("field-email");
      if (emailField) emailField.classList.remove("has-error");
      localStorage.removeItem(STORAGE_HP);
      localStorage.removeItem(STORAGE_RETREAT);
      syncTempButtons();
      render();
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

  whenContentReady().then(init);
})();
