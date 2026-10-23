# Carta de Tecnologia (estilo Pokémon)

Página em `.html` + `.js` que gera uma carta com as características de uma pessoa, usando os 4 temperamentos clássicos como "símbolo de energia".

## Tela (carta HTML)

O que aparece hoje na carta (`#card`):

- **Topo:** estágio de evolução (`Basic` / `Stage 1` / `Stage 2`), nome da pessoa, **HP** (sem ícone de energia).
- **Arte:** foto → cartoon (`/api/stylize`); sem ícone de temperamento.
- **Barra de info:** rótulo da **profissão** (ex.: Desenvolvedor Web).
- **Bloco de poder:** `name` do poder (combo/temperamento) + **flavor** (descrição) + **attention** (aviso).
- **Atributos Especiais:** Paciência, Humor, Café, Nerdisse + caixinha `Poder X/10`.
- **Rodapé:** Evolução (idade), Vitalidade (classificação de HP), Raridade.

**PDF:** captura do HTML da carta (`modern-screenshot` → JPEG → página **7,0 × 9,7 cm**).

## Temperamentos

Textos vêm de `content.json`. Cores de **fundo da carta** vêm do `theme` da **profissão** (`content.json` → `professions[].theme`) — a profissão é obrigatória. Sem ícones de temperamento na carta.

| Temperamento | Resumo | Pontos de atenção |
|---|---|---|
| Sanguíneo | Expansivo, otimista, comunicativo | Dispersão, impulsividade |
| Colérico | Enérgico, decidido, competitivo | Impaciência, teimosia |
| Melancólico | Reflexivo, sensível, analítico | Pessimismo, autocrítica |
| Fleumático | Calmo, estável, paciente | Passividade, resistência a mudanças |

### Seleção

- Dominante: **obrigatório**.
- Secundário: **opcional**, diferente do dominante.
- A ordem importa: o primeiro é o dominante e o segundo suaviza ou intensifica o primeiro.

### Questionário por profissão

Cada profissão tem seu próprio `quiz` em `content.json` (5 perguntas, mesmas 4 opções de temperamento).  
O wizard usa o quiz da profissão escolhida no passo 1; se faltar, cai no `quiz` geral.  
Trocar a profissão **reinicia** o questionário.

### Combinações (dominante-secundário)

| Combinação |
|---|
| Sanguíneo-Colérico |
| Sanguíneo-Fleumático |
| Sanguíneo-Melancólico |
| Colérico-Sanguíneo |
| Colérico-Melancólico |
| Colérico-Fleumático |
| Melancólico-Sanguíneo |
| Melancólico-Colérico |
| Melancólico-Fleumático |
| Fleumático-Sanguíneo |
| Fleumático-Colérico |
| Fleumático-Melancólico |

## Poderes (por temperamento)

Estas regras valem para **todas as áreas de TI**.  
Todo mundo **recebe chamado** e **conversa com usuário** — núcleo do jogo.

A **profissão** só troca o *cenário* da zoeira e as **cores** da carta (`theme`).  
O **gênero** (step Características) define a concordância do texto (`ela`/`ele`).  
As **características** (pele, cabelo, olhos, óculos, barba…) entram no prompt do **cartoon**.  
Na carta: `name` + **flavor** (`summary`) + `attention` + caixinha `Poder X/10`.

### Campos do poder — retorno atual da API

`POST /api/generate-power` devolve (após validação):

```json
{
  "name": "…",
  "summary": "…",
  "flavor": "…",
  "attention": "…",
  "slot_id": "COL",
  "dano": 40,
  "source": "llm"
}
```

- `summary` e `flavor` são o **mesmo texto** (descrição da carta).
- `source`: `llm` | `offline` | `fallback`.
- Sem `Cause`, sem `+N` na descrição.

| Campo                | O que é                                           | O que **não** é                             | Tamanho (validação)                           |
| -------------------- | ------------------------------------------------- | ------------------------------------------- | --------------------------------------------- |
| `name`               | Apelido engraçado (quiz + profissão).             | Frase cortada do quiz; terminar em `Pro`.   | **3–4 palavras**, ≤ 30 caracteres.            |
| `flavor` / `summary` | 1 frase hilária (personalidade + cargo + gênero). | `Cause`, `+20`, colar opção do quiz.        | **12–48 caracteres** (sem cortar; rejeita se passar). |
| `attention`          | Aviso curto / fraqueza em tom de zoeira.          | Citação entre aspas; bônus numérico (`+N`). | **16–38 caracteres**, 1 linha.                |

#### `name` (título do poder)

- **3–4 palavras**, ≤ 30 caracteres, sem ponto final; apelido de colega de TI.
- Bons: `Profissional do Chamado`, `Rainha do Print`, `Senhor do Rollback`.
- Ruins: `PROWEB vendedor Pro`, colar keywords da profissão.

#### `flavor` / `summary` (descrição na carta)

**Até 48 caracteres.** Sem `Cause` e sem `+N`. Exemplos curtos:

| Temperamento | Exemplo (≤ 48) |
|---|---|
| Colérico | `Log em CAPS. Quem mexeu que se explique.` |
| Melancólico | `Sem print do cenário eu nem começo a conversa.` |
| Sanguíneo | `Relaxa — com fé e um café isso volta sozinho.` |
| Fleumático | `Entra na fila. O urgente do corredor espera.` |

Concordância: feminino → ela/dela; masculino → ele/dele (também no `name`: Rainha/Rei, Senhora/Senhor).

#### `attention`

- Fraqueza engraçada no tom do dominante, **sem números de bônus**.
- Exemplos: `Sem chamado, o drama esfria.` · `Sem print, a fé acaba.`

### Características (wizard step 2/5)

Obrigatórias antes do quiz / cartoon:

| Campo | Valores |
|---|---|
| Gênero | `feminino` · `masculino` → textos da LLM |
| Cor de pele | clara, morena-clara, morena, negra, amarela → imagem |
| Cor de cabelo | preto, castanho, loiro, ruivo, grisalho, colorido → imagem |
| Cor dos olhos | castanho, preto, verde, azul, mel → imagem |
| Tamanho do cabelo | longo, medio, curto, careca → imagem |
| Tipo de cabelo | liso, cacheado (N/A se careca) → imagem |
| Óculos | sim, nao → imagem |
| Barba / facial | nenhuma, bigode, cavanhaque, rala, curta, cheia, longa → imagem |

### Tokens de jogo (universais de TI)

| Token | Significado | Vale para |
|---|---|---|
| Dano | HP perdido pelo oponente (interno / slot) | Todos |
| Confiança | Buff próprio (próximo ataque / moral) | Todos |
| Chamado | Ticket / demanda formal | Todos |
| Usuário | Pessoa do outro lado | Todos |
| Evidência | Print, log, laudo | Todos |

### Mecânica-base por dominante

| Temperamento | Ação | Tom do flavor | Fraqueza típica (`attention`) |
|---|---|---|---|
| **Colérico** | Explosivo | CAPS, urgência, dono do chamado | Sem chamado, o drama esfria |
| **Melancólico** | Detalhista | Print, laudo, “me prova” | Sem evidência, a conversa não anda |
| **Sanguíneo** | Otimista | Fé, café, “vai dar” | Se mostrarem o erro, a fé acaba |
| **Fleumático** | Preguiçoso | Fila, café, segunda a gente vê | Atender no corredor: perde a fila |

### Como escrever um poder

1. `name`**:** apelido engraçado (quiz + profissão), 3–4 palavras (≤ 30 caracteres).
2. `flavor` **/** `summary`**:** 1 frase hilária com gênero, **12–48 caracteres** — sem Cause e sem `+N`.
3. `attention`**:** fraqueza curta no mesmo tom (16–38 caracteres).

### Combos (dominante + secundário)

| Dominante → Secundário | Tendência do poder |
|---|---|
| Colérico → Fleumático | Impacto alto **só com chamado aberto**. |
| Fleumático → Colérico | Pouco esforço; **pune quem pula a fila**. |
| Sanguíneo → Fleumático | Pouco dano; **imunidade a “urgente”** sem chamado. |
| Melancólico → Sanguíneo | Evidência + ego: **não é alvo de culpa** neste turno. |
| Colérico → Melancólico | Pressão + prova. |
| Fleumático → Melancólico | Espera documentada + evidência. |

Implementação: quiz/textos em `content.json` → `professions[]`; lógica em `script.js` + `generate-power.js`.

## Geração por IA (contrato)

### Quem decide o quê

| Parte | Quem | Por quê |
|---|---|---|
| Dominante / secundário | Quiz + `scoreQuiz` | Determinístico |
| Atributos | Base dominante **70%** + secundário **30%** | Caixinha + props na imagem |
| Cores da carta | `professions[].theme` (obrigatório) | Faixas do fundo |
| Gênero | Step Características | Concordância ela/ele |
| Aparência | Step Características | Prompt do cartoon |
| `name` / `flavor` / `attention` | LLM (`/api/generate-power`) | Texto da carta |
| Humor visual | Prompt imagem (`/api/stylize` + `mood`) | Pose / gag |
| Poder `X/10` | Atributos + dano típico interno | Caixinha amarela |
| PDF | Screenshot do `#card` | 7 × 9,7 cm |
| Validação texto | Servidor (`generate-power.js`) | Cause / `+N` / tamanho / quiz |

### Payload texto (`/api/generate-power`)

```json
{
  "profession": "Web Developer",
  "professionLabel": "Desenvolvedor Web",
  "genero": "feminino",
  "dominant": "colerico",
  "secondary": "sanguineo",
  "hooks": ["…"]
}
```

(O servidor monta `genero_gramatica`, `keywords` e `vibe` a partir da profissão.)

### Payload imagem (`/api/stylize`)

- `image` + `profession`
- `appearance` — pele, cabelo, olhos, óculos, barba, gênero visual
- `mood` — `{ dominant, secondary, attrs, name, flavor, attention }`

O prompt:

1. mantém **semelhança facial** da foto;
2. aplica `appearance`;
3. estilo **anime / TCG** (Sugimori), **full body**, widescreen;
4. uniforme: **camisa azul-claro** + **jeans azul-escuro**;
5. prioridade: **flavor = pose**, efeitos cômicos, **attention = gag**, attrs = props, escritório = fundo;
6. saída HD: **1456×720** (FLUX → `sharp`, sem downscale 288×152).

### Saída LLM texto (validada)

```json
{"name":"...","flavor":"...","attention":"..."}
```

Servidor espelha `flavor` → `summary` para a UI.

### Fluxo resumido

```
dados → características → quiz → LLM textos (name≤30·3–4/flavor≤48/attention≤38)
                              → foto + appearance + mood → cartoon 1456×720
                              → carta HTML → PDF 7×9,7 cm
```

## Atributos (junção de poder)

Abaixo de Evolução / Vitalidade / Raridade.  
Só do temperamento: dominante **70%** + secundário **30%** (arredondado).

| Atributo | Escala | Benefício | No poder |
|---|---|---|---|
| **Paciência** | 0–10 | +espera / defesa | 1:1 na média |
| **Humor** | 0–10 | +confiança / conversa | 1:1 |
| **Café** | 0–10 | +urgência / war room | 1:1 |
| **Nerdisse** | 0–50 | +evidência / laudo | **÷ 5** → 0–10 |

### Base por temperamento dominante

| Temperamento | Paciência | Humor | Café | Nerdisse |
|---|---|---|---|---|
| Colérico | 0 | 3 | 10 | 25 |
| Melancólico | 4 | 2 | 8 | 50 |
| Sanguíneo | 5 | 10 | 6 | 20 |
| Fleumático | 10 | 6 | 7 | 15 |

### Poder total (`X/10`)

1. Normalizar: `paciência`, `humor`, `café`, `nerdisse ÷ 5`.
2. Dano típico do dominante → `dano_n` (÷ 6, máx 10): Colérico 8 · Melancólico 4 · Sanguíneo 6 · Fleumático 3.
3. `média = (paciência + humor + café + nerdisse/5 + dano_n) / 5`
4. `poder = clamp(1, 10, round(média))`
5. UI: `{poder}/10` + cada atributo como `valor/máx`.

## Idade

Válida de **18 a 90 anos**.

## Evolução (por idade)

| Identificador | Faixa |
|---|---|
| Basic | 18 a 40 anos |
| Stage 1 | 41 a 60 anos |
| Stage 2 | 61 a 90 anos |

## Raridade (por idade)

`índice = min(4, floor((idade - 18) / 14,4))`.

| Idade | Raridade | Borda (código atual) |
|---|---|---|
| 18–32 | Comum | `#448ecb` |
| 33–46 | Incomum | `#1060b0` |
| 47–61 | Rara | `#0050a0` |
| 62–75 | Rara Ultra | `#6259a8` (holo) |
| 76–90 | Rara Ilustração Especial | `#004090` (holo + rainbow) |

## Pontos de Saúde (HP)

Sorteado ao **terminar o quiz**, múltiplos de 10, salvo em `localStorage`.  
Secundário pode subir/descer **1 faixa** conforme calma relativa.

| HP | Classificação (Vitalidade) |
|---|---|
| 30–60 | Muito baixo |
| 70–100 | Baixo |
| 110–180 | Médio |
| 190–250 | Alto |
| 260–330 | Muito alto |
| 340–380 | Extremamente alto |

| Temperamento dominante | Faixa base | Classificação |
|---|---|---|
| Colérico | 30–60 | Muito baixo |
| Melancólico | 70–100 | Baixo |
| Sanguíneo | 190–250 | Alto |
| Fleumático | 340–380 | Extremamente alto |

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Estrutura da tela / carta |
| `style.css` | UI + carta (Press Start 2P local) |
| `content.json` / `content.js` | Textos, profissões, quizzes, themes |
| `script.js` | Quiz, atributos, theme, render da carta |
| `generate-power.js` | LLM `name` / `flavor` / `attention` |
| `huggingface-stylize.js` + `server.js` | Cartoon `/api/stylize` |
| `download-card.js` | PDF a partir do HTML `#card` |
