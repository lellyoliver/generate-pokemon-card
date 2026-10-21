(() => {
  "use strict";

  const MAX_SIDE = 768;
  const JPEG_QUALITY = 0.85;

  function msg(key, fallback) {
    const stylize = (window.APP_CONTENT && window.APP_CONTENT.stylize) || {};
    return stylize[key] != null && stylize[key] !== "" ? stylize[key] : fallback;
  }

  const els = {
    file: document.getElementById("photo-input"),
    preview: document.getElementById("photo-preview"),
    btnStylize: document.getElementById("btn-stylize"),
    btnClearPhoto: document.getElementById("btn-clear-photo"),
    status: document.getElementById("stylize-status"),
    btnReset: document.getElementById("btn-reset"),
    profession: document.getElementById("profession"),
    professionField: document.getElementById("field-profession"),
    email: document.getElementById("email"),
    emailField: document.getElementById("field-email"),
  };

  function getProfession() {
    return els.profession && els.profession.value ? els.profession.value.trim() : "";
  }

  function getEmail() {
    return els.email && els.email.value ? els.email.value.trim() : "";
  }

  function markProfessionError(show) {
    if (els.professionField) els.professionField.classList.toggle("has-error", Boolean(show));
  }

  function markEmailError(show) {
    if (els.emailField) els.emailField.classList.toggle("has-error", Boolean(show));
  }

  function isValidCorporateEmail(value, domain) {
    const email = String(value || "").trim().toLowerCase();
    const escaped = String(domain || "ancora.com.br").replace(/\./g, "\\.");
    return new RegExp("^[^\\s@]+@" + escaped + "$").test(email);
  }

  let originalDataUrl = null;
  let apiReady = false;
  let serverReachable = false;
  let isBusy = false;
  let emailGateEnabled = true;
  let emailDomain = "ancora.com.br";

  function setStatus(text, kind) {
    if (!els.status) return;
    els.status.textContent = text || "";
    els.status.dataset.kind = kind || "";
  }

  function setBusy(busy) {
    isBusy = busy;
    if (els.btnStylize) els.btnStylize.disabled = busy || !originalDataUrl || !apiReady;
    if (els.file) els.file.disabled = busy;
    if (els.btnClearPhoto) els.btnClearPhoto.disabled = busy;
    if (els.btnReset) els.btnReset.disabled = busy;
    if (els.profession) els.profession.disabled = busy;
    if (els.email) els.email.disabled = busy;
  }

  function syncEmailFieldVisibility() {
    if (!els.emailField) return;
    els.emailField.hidden = !emailGateEnabled;
    window.EMAIL_GATE_ENABLED = emailGateEnabled;
    window.EMAIL_DOMAIN = emailDomain;
    if (els.email && emailDomain) {
      const hint = els.emailField.querySelector(".hint");
      if (hint && window.APP_CONTENT && window.APP_CONTENT.form && window.APP_CONTENT.form.hints) {
        // placeholder already from content; keep domain-aware hint lightly
      }
      if (!els.email.placeholder) {
        els.email.placeholder = "nome@" + emailDomain;
      }
    }
  }

  function resizeToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        };
        img.onerror = () => reject(new Error("Imagem inválida."));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function showPreview(dataUrl) {
    if (!els.preview) return;
    els.preview.src = dataUrl;
    els.preview.hidden = !dataUrl;
  }

  let imageApiEnabled = true;

  async function checkHealth() {
    try {
      const res = await fetch(new URL("api/health", document.baseURI));
      if (!res.ok) throw new Error("Servidor indisponível.");
      const data = await res.json();
      serverReachable = true;
      imageApiEnabled = data.imageApiEnabled !== false;
      emailGateEnabled = data.emailGateEnabled !== false;
      emailDomain = data.emailDomain || "ancora.com.br";
      apiReady = imageApiEnabled && data.provider === "huggingface" && data.hfConfigured === true;
      syncEmailFieldVisibility();
      if (!imageApiEnabled) {
        setStatus(msg("apiOff", "Geração de imagem desligada (HF_IMAGE_API=0)."), "warn");
      } else if (!apiReady) {
        setStatus(
          msg("needToken", "Configure HF_TOKEN no .env e reinicie o servidor. Veja o README."),
          "warn"
        );
      }
    } catch (_) {
      serverReachable = false;
      apiReady = false;
      imageApiEnabled = true;
      emailGateEnabled = true;
      syncEmailFieldVisibility();
      setStatus(
        msg(
          "needServer",
          "Sem servidor Node neste endereço (ex.: GitHub Pages). Rode localmente com npm start."
        ),
        "warn"
      );
    } finally {
      setBusy(isBusy);
    }
  }

  async function stylize() {
    if (isBusy) return;
    if (!originalDataUrl) {
      setStatus(msg("needPhoto", "Escolha uma foto primeiro."), "warn");
      return;
    }
    if (!imageApiEnabled) {
      setStatus(
        msg("apiOffHint", "Geração de imagem desligada (HF_IMAGE_API=0). Ative no .env e reinicie."),
        "warn"
      );
      return;
    }
    if (!serverReachable || !apiReady) {
      setStatus(
        serverReachable
          ? msg("needToken", "Configure HF_TOKEN no .env e reinicie o servidor. Veja o README.")
          : msg(
              "needServer",
              "Sem servidor Node neste endereço (ex.: GitHub Pages). Rode localmente com npm start."
            ),
        "warn"
      );
      return;
    }
    const profession = getProfession();
    if (!profession) {
      markProfessionError(true);
      setStatus(msg("needProfession", "Selecione a profissão antes de gerar o pixel art."), "warn");
      return;
    }
    markProfessionError(false);

    const email = getEmail();
    if (emailGateEnabled) {
      if (!isValidCorporateEmail(email, emailDomain)) {
        markEmailError(true);
        setStatus(msg("needEmail", "Informe o e-mail @" + emailDomain + " antes de gerar."), "warn");
        return;
      }
    }
    markEmailError(false);

    setBusy(true);
    setStatus(msg("pending", "Gerando pixel art… isso pode levar até 2 minutos."), "pending");

    try {
      const payload = { image: originalDataUrl, profession };
      if (emailGateEnabled) payload.email = email.toLowerCase();

      const res = await fetch(new URL("api/stylize", document.baseURI), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Falha ao estilizar.");
      }
      if (!data.url) throw new Error("Resposta sem URL de imagem.");

      if (typeof window.setCardPortrait === "function") {
        window.setCardPortrait(data.url);
      }
      showPreview(data.url);
      if (data.cached) {
        setStatus(
          msg("cached", "Este e-mail já tinha arte gerada — carregamos a imagem salva."),
          "ok"
        );
      } else {
        setStatus(msg("ready", "Pixel art pronto! A arte da carta foi atualizada."), "ok");
      }
    } catch (err) {
      console.error(err);
      setStatus(err.message || msg("error", "Erro ao estilizar."), "warn");
    } finally {
      setBusy(false);
    }
  }

  function clearPhoto() {
    originalDataUrl = null;
    if (els.file) els.file.value = "";
    showPreview("");
    if (typeof window.setCardPortrait === "function") {
      window.setCardPortrait(null);
    }
    setStatus("");
    setBusy(false);
  }

  function init() {
    if (!els.file || !els.btnStylize) return;

    checkHealth();

    if (els.profession) {
      els.profession.addEventListener("change", () => {
        markProfessionError(false);
      });
    }
    if (els.email) {
      els.email.addEventListener("input", () => {
        markEmailError(false);
      });
    }

    els.file.addEventListener("change", async () => {
      const file = els.file.files && els.file.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setStatus(msg("badFile", "Selecione um arquivo de imagem."), "warn");
        return;
      }
      try {
        setBusy(true);
        setStatus(msg("preparing", "Preparando foto…"), "pending");
        originalDataUrl = await resizeToDataUrl(file);
        showPreview(originalDataUrl);
        if (typeof window.setCardPortrait === "function") {
          window.setCardPortrait(originalDataUrl);
        }
        setStatus(
          msg("photoReady", "Foto pronta. Clique em “Transformar em pixel art”."),
          "ok"
        );
      } catch (err) {
        setStatus(err.message || msg("loadError", "Erro ao carregar foto."), "warn");
      } finally {
        setBusy(false);
      }
    });

    els.btnStylize.addEventListener("click", stylize);
    if (els.btnClearPhoto) els.btnClearPhoto.addEventListener("click", clearPhoto);
    if (els.btnReset) els.btnReset.addEventListener("click", clearPhoto);
    setBusy(false);
  }

  function whenContentReady() {
    if (window.APP_CONTENT) return Promise.resolve();
    return new Promise((resolve) => {
      window.addEventListener("app-content-ready", () => resolve(), { once: true });
    });
  }

  function boot() {
    whenContentReady().then(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
