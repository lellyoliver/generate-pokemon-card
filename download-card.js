(() => {
  "use strict";

  // Tamanho físico para impressão (cm → pontos PDF; 1 pt = 1/72 in).
  const PRINT_WIDTH_CM = 7;
  const PRINT_HEIGHT_CM = 9.7;
  const CM_TO_PT = 72 / 2.54;
  const PAGE_W_PT = PRINT_WIDTH_CM * CM_TO_PT;
  const PAGE_H_PT = PRINT_HEIGHT_CM * CM_TO_PT;

  function slugify(name) {
    return String(name)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "carta";
  }

  function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(",", 2)[1];
    if (!base64) throw new Error("Imagem da carta inválida.");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function buildPrintPdf(jpegBytes, imageWidthPx, imageHeightPx) {
    const encoder = new TextEncoder();
    const parts = [];
    const offsets = [0];

    function push(text) {
      parts.push(typeof text === "string" ? encoder.encode(text) : text);
    }

    function markObject() {
      let offset = 0;
      for (let i = 0; i < parts.length; i += 1) offset += parts[i].length;
      offsets.push(offset);
    }

    const contentStream =
      "q\n" +
      PAGE_W_PT.toFixed(4) + " 0 0 " + PAGE_H_PT.toFixed(4) + " 0 0 cm\n" +
      "/Im0 Do\nQ\n";
    const contentBytes = encoder.encode(contentStream);

    push("%PDF-1.4\n");
    markObject();
    push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    markObject();
    push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
    markObject();
    push(
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
        PAGE_W_PT.toFixed(4) + " " + PAGE_H_PT.toFixed(4) +
        "] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>\nendobj\n"
    );
    markObject();
    push("4 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n");
    push(contentBytes);
    push("\nendstream\nendobj\n");
    markObject();
    push(
      "5 0 obj\n<< /Type /XObject /Subtype /Image /Width " + imageWidthPx +
        " /Height " + imageHeightPx +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " +
        jpegBytes.length + " >>\nstream\n"
    );
    push(jpegBytes);
    push("\nendstream\nendobj\n");

    let xrefStart = 0;
    for (let i = 0; i < parts.length; i += 1) xrefStart += parts[i].length;
    push("xref\n0 6\n");
    push("0000000000 65535 f \n");
    for (let i = 1; i <= 5; i += 1) {
      push(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
    }
    push("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xrefStart + "\n%%EOF\n");

    const total = parts.reduce((n, p) => n + p.length, 0);
    const pdf = new Uint8Array(total);
    let cursor = 0;
    parts.forEach((part) => {
      pdf.set(part, cursor);
      cursor += part.length;
    });
    return pdf;
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2_000);
  }

  function downloadLabel() {
    const stylize = window.APP_CONTENT && window.APP_CONTENT.form && window.APP_CONTENT.form.buttons;
    return (stylize && stylize.download) || "⬇️ Baixar carta (PDF)";
  }

  function waitForFonts() {
    if (!document.fonts || !document.fonts.ready) return Promise.resolve();
    return document.fonts.ready.catch(() => {});
  }

  function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function readJpegSize(jpegBytes) {
    // SOF0/SOF2: FF C0 / FF C2 … height/width em big-endian
    for (let i = 0; i < jpegBytes.length - 9; i += 1) {
      if (jpegBytes[i] !== 0xff) continue;
      const marker = jpegBytes[i + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = (jpegBytes[i + 5] << 8) | jpegBytes[i + 6];
        const width = (jpegBytes[i + 7] << 8) | jpegBytes[i + 8];
        return { width, height };
      }
    }
    return null;
  }

  /** Captura a carta HTML da tela para o PDF. */
  async function captureCardAsJpeg(card) {
    const api = window.modernScreenshot;
    if (!api || typeof api.domToJpeg !== "function") {
      throw new Error("Biblioteca de captura não carregou. Recarregue a página.");
    }

    const prev = {
      tiltX: card.style.getPropertyValue("--tilt-x"),
      tiltY: card.style.getPropertyValue("--tilt-y"),
      transform: card.style.transform,
      boxShadow: card.style.boxShadow,
    };

    card.classList.add("capturing-pdf");
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.transform = "none";
    card.style.boxShadow = "none";
    card.scrollIntoView({ block: "nearest", inline: "nearest" });

    try {
      await waitForFonts();
      const portrait = card.querySelector(".card-portrait, #card-portrait");
      if (portrait && portrait.getAttribute("src") && (!portrait.complete || portrait.naturalWidth === 0)) {
        await new Promise((resolve) => {
          portrait.onload = resolve;
          portrait.onerror = resolve;
          setTimeout(resolve, 2_000);
        });
      }
      await nextFrame();

      const rect = card.getBoundingClientRect();
      const dataUrl = await api.domToJpeg(card, {
        scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
        quality: 0.95,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        backgroundColor: "#000430",
        style: {
          transform: "none",
          boxShadow: "none",
          margin: "0",
        },
        filter(node) {
          // Não precisa filtrar; só garante que está no DOM.
          return true;
        },
      });

      const bytes = dataUrlToBytes(dataUrl);
      const size = readJpegSize(bytes);
      if (!size || !size.width || !size.height) {
        throw new Error("Não foi possível medir a imagem gerada.");
      }
      return { bytes, width: size.width, height: size.height };
    } finally {
      card.classList.remove("capturing-pdf");
      if (prev.tiltX) card.style.setProperty("--tilt-x", prev.tiltX);
      else card.style.removeProperty("--tilt-x");
      if (prev.tiltY) card.style.setProperty("--tilt-y", prev.tiltY);
      else card.style.removeProperty("--tilt-y");
      card.style.transform = prev.transform;
      card.style.boxShadow = prev.boxShadow;
    }
  }

  async function downloadCard() {
    if (typeof window.getTemperamentoCardData !== "function") {
      alert("Dados da carta ainda não estão prontos.");
      return;
    }

    const data = window.getTemperamentoCardData();
    if (!data.ready) {
      alert("Selecione um temperamento dominante antes de baixar.");
      return;
    }

    const card = document.getElementById("card");
    if (!card) {
      alert("Carta não encontrada na tela.");
      return;
    }

    const btn = document.getElementById("btn-download");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Gerando PDF…";
    }

    try {
      const shot = await captureCardAsJpeg(card);
      const pdfBytes = buildPrintPdf(shot.bytes, shot.width, shot.height);
      const filename = `carta-tecnologia-${slugify(data.name)}.pdf`;
      triggerDownload(new Blob([pdfBytes], { type: "application/pdf" }), filename);
    } catch (err) {
      console.error(err);
      alert((err && err.message) || "Não foi possível gerar o PDF da carta.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = downloadLabel();
      }
    }
  }

  function init() {
    const btn = document.getElementById("btn-download");
    if (btn) btn.addEventListener("click", downloadCard);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
