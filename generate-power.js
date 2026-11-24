"use strict";

/**
 * Contrato de geração de poder (regras/regras-carta-temperamento.md § Geração por IA).
 * LLM devolve name + flavor + attention (sem Cause/+N). Gênero define concordância (ele/ela).
 * Temperamento/atributos para cena visual ficam em /api/stylize (não aqui).
 */

const SYSTEM_PROMPT = `Você escreve o texto de uma carta estilo Pokémon sobre um colega de TI, em PT-BR natural, com humor leve de escritório que qualquer colega entenderia.

Responda SOMENTE com um JSON válido numa única linha, sem markdown e sem explicação:
{"name":"apelido","flavor":"descrição","attention":"fraqueza","pose":"visual pose in English"}

Como escrever:
- Baseie TUDO nas "respostas" do quiz: elas mostram como a pessoa age no trabalho. Descubra o padrão de comportamento e descreva-o com suas palavras (não copie as frases).
- A frase precisa fazer sentido sozinha, com sujeito e verbo, gramática correta e uma situação real do cargo. Nada de palavras soltas, jargão inventado ou frases sem nexo.
- name: CURTO, 2 a 3 palavras, no máximo 22 caracteres, apelido carinhoso de colega (ex.: Rainha do Print, Rei do Hotfix, Dama da Fila). Não terminar com "Pro".
- flavor: 1 frase completa de 25 a 90 caracteres descrevendo o jeito da pessoa no cargo, com uma piada clara.
- attention: a PIADA da carta. Curtíssima (2 a 7 palavras), seca, estilo punchline de meme, sobre a fraqueza da pessoa. Nada de explicar. Ex.: "Sem print, sem amor." · "Deploy de sexta? Sempre." · "Segunda ela vê." · "Café acabou, TI caiu." · "Chamado? Nunca ouvi falar."
- Gênero: feminino → ela/dela e Rainha/Senhora/Mestra; masculino → ele/dele e Rei/Senhor/Mestre.
- pose: EM INGLÊS, 12 a 35 palavras, descrevendo a pose corporal, expressão facial e o que a pessoa está fazendo/segurando, para um ilustrador desenhar. Deve encenar o comportamento das respostas (ex.: quem pede print → "holding up a printed screenshot to the camera, squinting suspiciously"). Seja específico e original; evite "hands on head" e "confused".
- Sem números, sem "Cause", sem explicar. Só o campo pose é em inglês.
- Os tamanhos são aproximados: NÃO conte caracteres nem palavras, apenas escreva frases curtas e responda direto com o JSON.

Exemplos bons:
{"name":"Rainha do Print","flavor":"Ela só começa a investigar depois que alguém manda o print do erro.","attention":"Sem print, sem amor.","pose":"holding a printed screenshot up close to her glasses, squinting suspiciously, other hand on hip"}
{"name":"Senhor do Vai Dar","flavor":"Ele promete resolver antes das seis e jura que o deploy de sexta é tranquilo.","attention":"Deploy de sexta? Sempre.","pose":"pressing the deploy button with one finger while winking and giving a confident thumbs up, backpack already on"}
{"name":"Guardiã da Fila","flavor":"Ela atende todo mundo com calma, mas o urgente do corredor vai pro fim da fila.","attention":"Urgente? Segunda ela vê.","pose":"sipping tea serenely while gently pointing a colleague toward a long ticket queue sign"}

Exemplos ruins (não faça): "PROWEB vendedor fé cache", "Log CAPS dono chamado já", frases sem verbo ou que misturam palavras-chave sem sentido.`;

const BANNED_NAME_SNIPPETS = [
  "liberacao com fe cega",
  "liberação com fé cega",
  "tres palavras chave",
  "três palavras chave",
  "trocador de cabo pro",
  "proweb liberacao",
  "proweb liberação",
  "proweb vendedor",
  "vendedor pro",
  "intranet pro",
  "advpl pro",
  "protheus pro",
];

/** Apelidos engraçados por cargo (fallback offline / variedade). */
const FUNNY_NAMES_BY_PROFESSION = {
  "Web Developer": [
    "Profissional do Chamado",
    "Senhor do Titulo Sumiu",
    "Rainha do Proweb",
    "Fe no Codigo Vendedor",
    "Mestre da Visita Fantasma",
  ],
  "ADVPL Developer": [
    "Senhor do Fonte Legado",
    "Rainha da Custom",
    "Profissional do Dicionario",
    "Guardião do Ponto",
    "Mestre do Patch Surpresa",
  ],
  "Systems Analyst": [
    "Rainha do Print",
    "Senhor do AtendAki",
    "Profissional do Parametro",
    "Guardião da Tela Errada",
    "Mestre do Laudo Seco",
  ],
  "Systems Coordinator": [
    "Senhor da Daily",
    "Rainha do Chamado",
    "Profissional do Bloqueio",
    "Mestre da Escala Quente",
    "Guardião do Fluxo",
  ],
  "IT Manager": [
    "Senhor da Prioridade",
    "Rainha do Urgente Inventado",
    "Profissional do Orcamento Zero",
    "Mestre da Diretoria",
    "Guardião da Fila Estrategica",
  ],
  "Infrastructure Analyst": [
    "Senhor da Permissao",
    "Rainha do Servidor Calado",
    "Profissional da Pasta Liberada",
    "Mestre da Mudanca",
    "Guardião do Ping Mentiroso",
  ],
  "Infrastructure Assistant": [
    "Senhor do Update 5h40",
    "Rainha do Mouse Perdido",
    "Profissional do Cabo",
    "Mestre da Senha Emprestada",
    "Guardião da Maquina Nova",
  ],
  "Process Analyst": [
    "Senhor da Etapa Pulada",
    "Rainha da Ata Incompleta",
    "Profissional do Formulario",
    "Mestre do Fluxo Bonito",
    "Guardião do Atalho Proibido",
  ],
};

const FUNNY_NAMES_BY_SLOT = {
  COL: ["Grito no Slack Caps", "War Room Sem Cafe", "Dono do Chamado Ja"],
  MEL: ["Laudo de Tres Paginas", "Print Ou Nao Falamos", "Causa Raiz Com Carimbo"],
  SAN: ["Fe no Cache Sagrado", "Na Minha Funciona Ainda", "Hotfix de Boa"],
  FLE: ["Fila Com Cafe Quente", "Segunda a Gente Ve", "Freeze Com Boa Vontade"],
  COL_FLE: ["Raiva Com Carimbo", "Checklist Quente Demais"],
  FLE_COL: ["Nao Fura Minha Fila", "Calma Que Trava Tudo"],
  SAN_FLE: ["Cinco Minutos Com Sorriso", "Urgente Vai Pra Fila"],
  MEL_SAN: ["Laudo Sorridente Pro", "Homolog Mentiu de Novo"],
  COL_MEL: ["Grito Com Evidencia", "Caca Usuario Oficial"],
  FLE_MEL: ["Plantao de Ferro", "Espera Com Print"],
};

const BANNED_FLAVOR_SNIPPETS = [
  "gerente manda msg no output",
  "manda msg no output",
  "tres palavras chave",
  "deve ter sido cache",
  "hotfix rapido",
  "hotfix rápido",
  "cause ",
  "compre 1 confianca",
  "compre 1 confiança",
];

const BONUS_NUMBER_RE = /\+\s*\d+|−\s*\d+|-\s*\d+|\d+\s*de\s*dano|\bCause\b/i;

/** Fallback offline — sem números de bônus. */
const ATTENTION_CATALOG = {
  A1: "A bola de cristal do TI está em manutenção. Abra um chamado!",
  A2: "Repetir o ataque: perde o clima.",
  A3: "Trocar a carta no meio: a zoeira some.",
  A4: "Sem print, a conversa nem começa.",
  A5: "Sem evidências, o bug é uma lenda urbana.",
  A6: "Atender no corredor: perde o café.",
  A7: "Sem urgência real: vira só papo.",
  A8: "Pular a fila: todo mundo trava.",
};

const DEFAULT_ATTENTION = {
  sanguineo: "A5",
  colerico: "A1",
  melancholico: "A4",
  fleumatico: "A6",
};

/** Dano fixo do servidor (caixinha). Hint só orienta o tom do flavor. */
const SLOTS = {
  COL: {
    id: "COL",
    dano: 40,
    hint: "Tom explosivo / CAPS / urgência falsa.",
  },
  MEL: {
    id: "MEL",
    dano: 20,
    hint: "Tom de laudo, print e ‘me prova’.",
  },
  SAN: {
    id: "SAN",
    dano: 30,
    hint: "Tom leve, fé e ‘vai dar certo’.",
  },
  FLE: {
    id: "FLE",
    dano: 10,
    hint: "Tom de fila, café e ‘segunda a gente vê’.",
  },
  COL_FLE: {
    id: "COL_FLE",
    dano: 40,
    hint: "Raiva com carimbo: explosivo, mas só com processo.",
  },
  FLE_COL: {
    id: "FLE_COL",
    dano: 30,
    hint: "Calma por fora, bloqueio se furarem a fila.",
  },
  SAN_FLE: {
    id: "SAN_FLE",
    dano: 20,
    hint: "Otimista que joga urgente do corredor pra fila.",
  },
  MEL_SAN: {
    id: "MEL_SAN",
    dano: 25,
    hint: "Laudo com um sorriso: detalhe sem levar a culpa.",
  },
  COL_MEL: {
    id: "COL_MEL",
    dano: 40,
    hint: "Explosivo + prova: protocolo ou grito.",
  },
  FLE_MEL: {
    id: "FLE_MEL",
    dano: 15,
    hint: "Espera documentada até ter print.",
  },
};

const DEFAULT_FLAVORS = {
  COL: "O log não mente. Quem mexeu que lute.",
  MEL: "Sem print do cenário eu nem começo a conversa.",
  SAN: "Relaxa — com fé e um café isso volta sozinho.",
  FLE: "Entra na fila. O urgente do corredor espera.",
  COL_FLE: "Quero dono no chamado. Sem chamado, sem grito.",
  FLE_COL: "Calmo por fora. Pular a fila? Aí trava tudo.",
  SAN_FLE: "Sorrio, anoto e mando pra fila com carinho.",
  MEL_SAN: "Monto o laudo sorrindo e não levo a culpa.",
  COL_MEL: "Protocolo furado? Grito primeiro, print depois.",
  FLE_MEL: "Espero com café até alguém mandar o print.",
};

const SLOT_BY_COMBO = {
  "colerico-fleumatico": "COL_FLE",
  "fleumatico-colerico": "FLE_COL",
  "sanguineo-fleumatico": "SAN_FLE",
  "melancholico-sanguineo": "MEL_SAN",
  "colerico-melancholico": "COL_MEL",
  "fleumatico-melancholico": "FLE_MEL",
};

const SLOT_BY_DOMINANT = {
  colerico: "COL",
  melancholico: "MEL",
  sanguineo: "SAN",
  fleumatico: "FLE",
};

const PROFESSION_KEYWORDS = {
  "IT Manager": ["diretoria", "urgente", "orçamento", "fila", "risco"],
  "Systems Coordinator": ["daily", "bloqueio", "dono", "escala", "time"],
  "Web Developer": ["PROWEB", "vendedor", "título sumiu", "visita", "código"],
  "ADVPL Developer": ["fonte", "custom", "dicionário", "ponto de entrada", "sexta"],
  "Systems Analyst": ["AtendAki", "print", "parâmetro", "tela", "usuário"],
  "Infrastructure Analyst": ["servidor", "permissão", "pasta", "sexta", "janela"],
  "Infrastructure Assistant": ["update 5h40", "senha", "mouse", "máquina nova", "cabo"],
  "Process Analyst": ["etapa", "ata", "formulário", "CEO", "atalho"],
};

const PROFESSION_VIBE = {
  "IT Manager":
    "Humor de quem prioriza com a diretoria: ‘urgente’ inventado, orçamento zero, reunião que vira fila.",
  "Systems Coordinator":
    "Humor de daily e dono do chamado: bloqueio no time, escala, ‘volta pro fluxo’.",
  "Web Developer":
    "Humor PROWEB/comercial: título sumiu, visita fantasma, código do vendedor, supervisor no corredor.",
  "ADVPL Developer":
    "Humor de fonte Protheus: custom de sexta, dicionário bravo, ‘só um campo’, pouco usuário final.",
  "Systems Analyst":
    "Humor Protheus no AtendAki: print ou não falamos, parâmetro misterioso, encaminha ADVPL.",
  "Infrastructure Analyst":
    "Humor de servidor e permissão: pasta no corredor, mudança na sexta, ping mente.",
  "Infrastructure Assistant":
    "Humor de suporte: update 5h40, senha emprestada, mouse/Wi-Fi, máquina nova na fila.",
  "Process Analyst":
    "Humor de fluxo e reunião: pular etapa, ata incompleta, formulário sem mapa, CEO com opinião.",
};

function resolveSlot(dominant, secondary) {
  if (secondary && secondary !== dominant) {
    const key = `${dominant}-${secondary}`;
    const comboId = SLOT_BY_COMBO[key];
    if (comboId && SLOTS[comboId]) return SLOTS[comboId];
  }
  const id = SLOT_BY_DOMINANT[dominant] || "SAN";
  return SLOTS[id];
}

function pickHooks(hooks) {
  if (!Array.isArray(hooks)) return [];
  return hooks
    .map((h) => String(h || "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeForBan(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function assertOriginalText(name, flavor, respostas) {
  const n = normalizeForBan(name);
  const f = normalizeForBan(flavor);
  for (const banned of BANNED_NAME_SNIPPETS) {
    if (n.includes(banned)) throw new Error("name genérico/proibido.");
  }
  if (/\bpro$/i.test(n) || n.endsWith(" pro")) {
    throw new Error("name genérico terminando em Pro.");
  }
  for (const banned of BANNED_FLAVOR_SNIPPETS) {
    if (f.includes(banned)) throw new Error("flavor genérico/proibido.");
  }
  if (BONUS_NUMBER_RE.test(name) || BONUS_NUMBER_RE.test(flavor)) {
    throw new Error("texto com número de bônus/dano proibido.");
  }
  // Não colar a resposta do quiz inteira.
  for (const ans of Array.isArray(respostas) ? respostas : []) {
    const a = normalizeForBan(ans);
    if (a.length >= 18 && (f.includes(a) || n.includes(a))) {
      throw new Error("texto colou a resposta do quiz.");
    }
  }
}

function keywordsFor(professionValue) {
  return PROFESSION_KEYWORDS[professionValue] || ["chamado", "usuário", "café"];
}

function vibeFor(professionValue) {
  return (
    PROFESSION_VIBE[professionValue] ||
    "Humor de TI de escritório: chamado, corredor, café e fila."
  );
}

function normalizeGender(gender) {
  const g = String(gender || "").trim().toLowerCase();
  if (g === "feminino" || g === "masculino") return g;
  return "masculino";
}

function buildUserPayload({
  professionLabel,
  professionValue,
  dominant,
  secondary,
  hooks,
  questions,
  gender,
}) {
  const slot = resolveSlot(dominant, secondary);
  const respostas = pickHooks(hooks);
  const perguntas = Array.isArray(questions)
    ? questions.slice(0, respostas.length).map((q) => String(q || "").trim().slice(0, 160))
    : [];
  const genero = normalizeGender(gender);
  return {
    profissao: professionLabel || professionValue || "TI",
    professionValue: professionValue || "",
    genero,
    genero_gramatica:
      genero === "feminino"
        ? "Use ela/dela e adjetivos no feminino."
        : "Use ele/dele e adjetivos no masculino.",
    dominante: dominant,
    secundario: secondary && secondary !== dominant ? secondary : null,
    slot_id: slot.id,
    dano: slot.dano,
    efeito_hint: slot.hint,
    respostas,
    perguntas,
    hooks: respostas,
    keywords: keywordsFor(professionValue),
    vibe: vibeFor(professionValue),
  };
}

function validateLlmFields(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("JSON inválido.");
  }
  const name = String(raw.name || "")
    .replace(/[“”"']/g, "")
    .replace(/[.!?…,—;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = name.split(" ").filter(Boolean);
  if (words.length < 2 || words.length > 3 || name.length > 22 || name.includes("\n")) {
    throw new Error("name inválido (precisa 2–3 palavras, até 22 caracteres).");
  }

  let flavor = String(raw.flavor || raw.punchline || raw.cenario || "")
    .replace(/\s+/g, " ")
    .trim();
  if (/^Cause\b/i.test(flavor)) {
    throw new Error("flavor não pode começar com Cause.");
  }
  if (BONUS_NUMBER_RE.test(flavor)) {
    throw new Error("flavor não pode ter bônus/dano numérico.");
  }
  if (flavor.length < 20 || flavor.length > 140) {
    throw new Error("flavor deve ter entre 20 e 140 caracteres (sem cortar).");
  }
  if (flavor.split(" ").length < 5) {
    throw new Error("flavor precisa ser uma frase completa.");
  }

  let attention = String(raw.attention || "").replace(/\s+/g, " ").trim();
  if (!attention && raw.attention_id) {
    const id = String(raw.attention_id || "").trim().toUpperCase();
    attention = ATTENTION_CATALOG[id] || "";
  }
  if (/^Cause\b/i.test(attention) || BONUS_NUMBER_RE.test(attention)) {
    throw new Error("attention inválido (Cause ou número).");
  }
  if (/^[“"'].*[”"']$/.test(attention)) {
    throw new Error("attention não pode ser citação de sabor.");
  }
  if (attention.length < 8 || attention.length > 45 || attention.includes("\n")) {
    throw new Error("attention deve ser curto (8 a 45 caracteres).");
  }

  const pose = String(raw.pose || "").replace(/\s+/g, " ").trim().slice(0, 240);

  return { name: words.join(" "), flavor, attention, pose };
}

function validateAgainstQuiz(parsed, payload) {
  assertOriginalText(parsed.name, parsed.flavor, payload.respostas || payload.hooks);
  return parsed;
}

function assemblePower({ name, flavor, punchline, attention, attention_id, pose, slot }) {
  const text = String(flavor || punchline || "").trim();
  const attentionText =
    (attention && String(attention).trim()) ||
    ATTENTION_CATALOG[attention_id] ||
    ATTENTION_CATALOG.A1;
  return {
    name,
    /** Descrição na carta = só flavor. */
    summary: text,
    flavor: text,
    attention: attentionText,
    pose: String(pose || "").trim(),
    slot_id: slot.id,
    dano: slot.dano,
    source: "llm",
  };
}

function pickFunnyName(list, salt) {
  const pool = Array.isArray(list) && list.length ? list : ["Profissional do Chamado"];
  let h = 0;
  const s = String(salt || "ti");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

function adaptNameGender(name, gender) {
  const g = String(gender || "").toLowerCase();
  if (g === "feminino") {
    return String(name)
      .replace(/\bSenhor\b/g, "Senhora")
      .replace(/\bRei\b/g, "Rainha")
      .replace(/\bMestre\b/g, "Mestra")
      .replace(/\bGuardiao\b/g, "Guardia")
      .replace(/\bGuardião\b/g, "Guardiã");
  }
  if (g === "masculino") {
    return String(name)
      .replace(/\bSenhora\b/g, "Senhor")
      .replace(/\bRainha\b/g, "Rei")
      .replace(/\bMestra\b/g, "Mestre")
      .replace(/\bGuardia\b/g, "Guardiao")
      .replace(/\bGuardiã\b/g, "Guardião");
  }
  return name;
}

function offlineName(payload) {
  const byProf = FUNNY_NAMES_BY_PROFESSION[payload.professionValue];
  const bySlot = FUNNY_NAMES_BY_SLOT[payload.slot_id];
  const pool = [
    ...(Array.isArray(byProf) ? byProf : []),
    ...(Array.isArray(bySlot) ? bySlot : []),
  ].filter((n) => n.length <= 22);
  if (!pool.length) pool.push("Mestre do Chamado");
  const salt =
    (payload.respostas && payload.respostas[0]) ||
    payload.profissao ||
    payload.dominante ||
    "ti";
  return adaptNameGender(pickFunnyName(pool, salt), payload.genero);
}

function offlineFlavor(payload, slot) {
  return DEFAULT_FLAVORS[slot.id] || DEFAULT_FLAVORS.COL;
}

function offlinePower(payload) {
  const slot = SLOTS[payload.slot_id] || resolveSlot(payload.dominante, payload.secundario);
  const name = offlineName(payload);
  const flavor = offlineFlavor(payload, slot);
  const attention_id = DEFAULT_ATTENTION[payload.dominante] || "A1";
  const power = assemblePower({
    name,
    flavor,
    attention: ATTENTION_CATALOG[attention_id],
    slot,
  });
  power.source = "offline";
  return power;
}

function unescapeJsonString(s) {
  return String(s || "")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, " ")
    .replace(/\\\\/g, "\\");
}

function extractField(body, keys) {
  for (const key of keys) {
    const re = new RegExp(
      `"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`,
      "i"
    );
    const m = body.match(re);
    if (m && m[1] && m[1] !== "...") return unescapeJsonString(m[1]).trim();
  }
  return "";
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("Resposta sem JSON.");

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1].trim() : raw;

  // 1) Objetos JSON completos (ordem livre dos campos).
  const candidates = [];
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] !== "{") continue;
    let depth = 0;
    for (let j = i; j < body.length; j += 1) {
      if (body[j] === "{") depth += 1;
      else if (body[j] === "}") {
        depth -= 1;
        if (depth === 0) {
          candidates.push(body.slice(i, j + 1));
          break;
        }
      }
    }
  }
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    try {
      const obj = JSON.parse(candidates[i]);
      if (obj && (obj.name || obj.flavor || obj.punchline)) return obj;
    } catch (_) {
      /* tenta o próximo */
    }
  }

  // 2) Salvamento: puxa name/flavor/attention mesmo se o JSON estiver quebrado.
  const name = extractField(body, ["name"]);
  const flavor = extractField(body, ["flavor", "punchline", "summary", "desc"]);
  const attention = extractField(body, ["attention"]);
  if (name && flavor && attention) {
    return { name, flavor, attention };
  }
  if (name && flavor) {
    return { name, flavor, attention: attention || "Sem chamado, a zoeira esfria." };
  }

  throw new Error("Resposta sem JSON.");
}

function isTextApiEnabled(env) {
  const flag = String(env.LLM_TEXT_API ?? "1").trim().toLowerCase();
  return !["0", "false", "no", "off"].includes(flag);
}

function routerModelId(env) {
  const model = String(env.LLM_MODEL || "").trim() || "openai/gpt-oss-20b";
  const provider = String(env.LLM_PROVIDER || "").trim() || "groq";
  if (model.includes(":")) return model;
  return `${model}:${provider}`;
}

function looksLikePowerJson(text) {
  const t = String(text || "");
  return /\{[\s\S]*"name"\s*:/.test(t) || /\{[\s\S]*"flavor"\s*:/.test(t);
}

/** Prefere `content`; só usa `reasoning` se o content não trouxer JSON (modelos com thinking). */
function messageText(choiceMessage) {
  if (!choiceMessage || typeof choiceMessage !== "object") return "";
  const content = String(choiceMessage.content || "").trim();
  const reasoning = String(choiceMessage.reasoning || "").trim();
  if (looksLikePowerJson(content)) return content;
  if (looksLikePowerJson(reasoning)) return reasoning;
  return content || reasoning;
}

async function postChat(token, payload) {
  const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  let json;
  try {
    json = JSON.parse(raw);
  } catch (_) {
    throw new Error(`LLM HTTP ${res.status}: resposta inválida`);
  }
  return { res, raw, json };
}

function llmErrorMessage(json, raw) {
  const err = json && json.error;
  const msg =
    (err && (err.message || err.failed_generation || err)) || raw.slice(0, 220);
  return typeof msg === "string" ? msg : JSON.stringify(msg);
}

/**
 * @param {{ token: string, env?: NodeJS.ProcessEnv, messages: object[], temperature?: number, jsonMode?: boolean }} opts
 */
async function chatViaHfRouter({
  token,
  env = process.env,
  messages,
  temperature = 0.7,
  jsonMode,
}) {
  const model = routerModelId(env);
  const wantJson =
    jsonMode != null
      ? Boolean(jsonMode)
      : String(env.LLM_JSON_MODE || "1") !== "0";
  const payload = {
    model,
    messages,
    max_tokens: 2000,
    temperature,
  };
  if (/gpt-oss/i.test(model)) payload.reasoning_effort = "low";
  if (wantJson) {
    payload.response_format = { type: "json_object" };
  }

  let { res, raw, json } = await postChat(token, payload);

  // Groq/HF: json_object às vezes falha com "Failed to validate JSON" —
  // nesse caso (e em unsupported) tenta de novo sem response_format.
  if (
    !res.ok &&
    payload.response_format &&
    /response_format|json_object|unsupported|validate json|failed_generation|json/i.test(
      raw
    )
  ) {
    console.warn(
      "[generate-power] JSON mode falhou, retry sem response_format:",
      llmErrorMessage(json, raw).slice(0, 160)
    );
    delete payload.response_format;
    ({ res, raw, json } = await postChat(token, payload));
  }

  if (!res.ok) {
    throw new Error(llmErrorMessage(json, raw));
  }
  const text = messageText(json.choices?.[0]?.message);
  if (!text) throw new Error("LLM devolveu conteúdo vazio.");
  return text;
}

/**
 * @param {object} opts
 * @param {string} [opts.token] HF_TOKEN
 * @param {NodeJS.ProcessEnv} [opts.env]
 * @param {object} opts.input
 */
async function generatePower({ token, client, env = process.env, input }) {
  const payload = buildUserPayload(input);
  const slot = SLOTS[payload.slot_id];
  const hfToken = String(token || env.HF_TOKEN || "").trim();

  if (!isTextApiEnabled(env) || !hfToken) {
    return offlinePower(payload);
  }

  const context = {
    profissao: payload.profissao,
    genero: payload.genero,
    genero_gramatica: payload.genero_gramatica,
    dominante: payload.dominante,
    secundario: payload.secundario,
    tom: payload.efeito_hint,
    respostas: payload.respostas,
    keywords: payload.keywords,
    vibe: payload.vibe,
  };

  const userPayload =
    "Cargo: " + context.profissao + ".\n" +
    "Gênero: " + context.genero + " (" + context.genero_gramatica + ")\n" +
    "Temperamento: " + context.dominante +
    (context.secundario ? " com toque de " + context.secundario : "") +
    ". Tom sugerido: " + context.tom + "\n" +
    "Contexto do cargo: " + context.vibe + "\n" +
    "Quiz da pessoa (situação → como ela age):\n" +
    (payload.respostas || [])
      .map((r, i) =>
        payload.perguntas[i] ? "- " + payload.perguntas[i] + " → " + r : "- " + r
      )
      .join("\n") +
    "\n\nEscreva o JSON {name, flavor, attention, pose} descrevendo ESTA pessoa a partir dessas respostas.";

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPayload },
  ];

  console.log("[generate-power] LLM →", routerModelId(env));

  async function once(msgs, label, temperature, jsonMode) {
    const text = await chatViaHfRouter({
      token: hfToken,
      env,
      messages: msgs,
      temperature,
      jsonMode,
    });
    console.log(`[generate-power] ${label} tail:`, text.replace(/\s+/g, " ").slice(-320));
    const parsed = validateAgainstQuiz(validateLlmFields(extractJsonObject(text)), payload);
    const power = assemblePower({ ...parsed, slot });
    console.log(
      "[generate-power] OK source=llm name=",
      power.name,
      "flavor=",
      String(power.flavor || "").slice(0, 60)
    );
    return power;
  }

  const strictRetryMessages = [
    {
      role: "system",
      content:
        'Output ONLY one JSON line: {"name":"...","flavor":"...","attention":"...","pose":"..."}. name/flavor/attention in Portuguese; pose in English describing body pose, facial expression and action based on the answers. No thinking, no markdown.',
    },
    {
      role: "user",
      content:
        "Gênero " +
        context.genero +
        ". Profissão " +
        context.profissao +
        ". Dominante " +
        context.dominante +
        ". name=apelido curto de 2-3 palavras (até 22 caracteres). flavor=1 frase completa e coerente de 25-90 caracteres sobre como a pessoa age, baseada nas respostas. attention=piada curtíssima de 2 a 7 palavras, estilo punchline (ex.: 'Sem print, sem amor.'). Sem números.\n" +
        JSON.stringify({
          respostas: (context.respostas || []).slice(0, 3),
          keywords: context.keywords,
        }),
    },
  ];

  const attempts = [
    { msgs: messages, label: "try", temperature: 0.5, jsonMode: true },
    { msgs: messages, label: "retry", temperature: 0.3, jsonMode: false },
    { msgs: strictRetryMessages, label: "retry2", temperature: 0.3, jsonMode: false },
    { msgs: strictRetryMessages, label: "retry3", temperature: 0.2, jsonMode: true },
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      return await once(
        attempt.msgs,
        attempt.label,
        attempt.temperature,
        attempt.jsonMode
      );
    } catch (err) {
      lastError = err;
      console.warn(`[generate-power] ${attempt.label} falhou:`, err && err.message);
    }
  }

  const fallback = offlinePower(payload);
  fallback.source = "fallback";
  fallback.error =
    lastError && lastError.message ? lastError.message : "llm_failed";
  console.warn("[generate-power] fallback:", fallback.error);
  return fallback;
}

module.exports = {
  SYSTEM_PROMPT,
  ATTENTION_CATALOG,
  SLOTS,
  DEFAULT_FLAVORS,
  DEFAULT_PUNCHLINES: DEFAULT_FLAVORS,
  PROFESSION_KEYWORDS,
  PROFESSION_VIBE,
  resolveSlot,
  buildUserPayload,
  validateLlmFields,
  assemblePower,
  offlinePower,
  generatePower,
  isTextApiEnabled,
  extractJsonObject,
  routerModelId,
  chatViaHfRouter,
};
