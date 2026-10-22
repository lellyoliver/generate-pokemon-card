# Carta de Tecnologia (estilo Pokémon)

Página em `.html` + `.js` que gera uma carta com as características de uma pessoa, usando os 4 temperamentos clássicos como "símbolo de energia".

## Tela

- **Topo:** estágio de evolução, nome da pessoa, HP e símbolo de energia.
- **Centro:** ícone do temperamento (ou da combinação) e descrição.
- **Rodapé:** idade, saúde (classificação de HP), raridade e **atributos** (Paciência, Humor, Café, Nerdisse).

## Temperamentos

| Temperamento | Ícone | Cor do tema | Resumo | Pontos de atenção |
|---|---|---|---|---|
| Sanguíneo | ☀️ | Âmbar / coral `#e07a5f` | Expansivo, otimista, comunicativo, sociável | Dispersão, impulsividade |
| Colérico | ⚡ | Amarelo elétrico `#f4a261` | Enérgico, decidido, competitivo | Impaciência, teimosia |
| Melancólico | 🍂 | Índigo / névoa `#5c6b8a` | Reflexivo, sensível, analítico | Pessimismo, autocrítica |
| Fleumático | 🌊 | Azul água `#2a9d8f` | Calmo, estável, paciente | Passividade, resistência a mudanças |

O **dominante** define a cor de fundo da carta (como o tipo na carta Pokémon). Com secundário, o fundo mistura as duas cores.

### Seleção

- Dominante: **obrigatório**.
- Secundário: **opcional**, diferente do dominante.
- A ordem importa: o primeiro é o dominante e o segundo suaviza ou intensifica o primeiro.

### Questionário por profissão

Cada profissão tem seu próprio `quiz` em `content.json` (5 perguntas, mesmas 4 opções de temperamento).  
O wizard usa o quiz da profissão escolhida no passo 1; se faltar, cai no `quiz` geral.  
Trocar a profissão **reinicia** o questionário.

### Combinações (dominante-secundário)

| Combinação | Ícone | Nome |
|---|---|---|
| Sanguíneo-Colérico | 🌦️ | Sol com chuva e raios |
| Sanguíneo-Fleumático | 🏖️ | Praia ensolarada |
| Sanguíneo-Melancólico | 🌅 | Pôr do sol |
| Colérico-Sanguíneo | 🔥 | Fogo selvagem |
| Colérico-Melancólico | 🌪️ | Tornado |
| Colérico-Fleumático | 💨 | Vapor / Gêiser |
| Melancólico-Sanguíneo | 🌫️ | Névoa com sol |
| Melancólico-Colérico | 🌬️ | Vento gelado |
| Melancólico-Fleumático | 🌲 | Floresta isolada |
| Fleumático-Sanguíneo | 🏝️ | Oásis |
| Fleumático-Colérico | 🏞️ | Rio com correnteza |
| Fleumático-Melancólico | 🧊 | Bloco de gelo |

## Poderes (por temperamento)

Estas regras valem para **todas as áreas de TI** (dev, sistemas, processos, infra, coordenação, etc.).  
Todo mundo **recebe chamado** e **conversa com usuário** — isso é o núcleo do jogo, não um tema de uma profissão só.

A **profissão** só troca o *cenário* da zoeira (PROWEB, Protheus, servidor…).  
O **gênero** (step Características) define a concordância do texto (`ela`/`ele`).  
As **características** (pele, cabelo, olhos, óculos…) entram no prompt do **pixel art**.  
Na carta: `name` + **flavor** (`summary`/`desc`) + `attention` + caixinha **`Poder X/10`**.

### Campos do poder (contrato da carta)

Referência oficial. Se mudar de novo, atualize **esta seção** primeiro.

| Campo | O que é | O que **não** é | Tamanho |
|---|---|---|---|
| **`name`** | Apelido engraçado (quiz + profissão). | Frase cortada do quiz. | **3–5 palavras**. |
| **`summary`** / **`flavor`** / **`desc`** | Frase **hilária** de personalidade + cargo, com gênero. | `Cause`, `+20`, colar opção do quiz. | **1–2 linhas**. |
| **`attention`** | Aviso curto / fraqueza em tom de zoeira. | Citação entre aspas; bônus numérico (`+N`). | **1 linha**. |

#### `name` (título)

- **3–5 palavras**, sem ponto final; **apelido engraçado** de colega de TI.
- Bons: `Profissional do Chamado`, `Rainha do Print`, `Senhor do Rollback`, `Fé no Cache`.
- Ruins: `PROWEB vendedor Pro`, `Liberar de novo deve ter`, `Olho log build e`.
- Proibido terminar com `Pro` ou só colar keywords da profissão.

#### `summary` / `flavor` (descrição)

**Sem** `Cause X de dano` e **sem** bônus `+20` / `+40`. Só sabor + concordância de gênero:

| Temperamento | Exemplo (feminino) | Exemplo (masculino) |
|---|---|---|
| Colérico | Ela já abriu o log em CAPS. | Ele já abriu o log em CAPS. |
| Melancólico | Sem print ela nem começa a conversa. | Sem print ele nem começa a conversa. |
| Sanguíneo | Ela relaxa — com fé e café isso volta. | Ele relaxa — com fé e café isso volta. |
| Fleumático | Ela manda o urgente pra fila. | Ele manda o urgente pra fila. |

#### `attention`

- Fraqueza engraçada no tom do dominante, **sem números de bônus**.
- Exemplos: `Sem chamado aberto, o drama esfria.` · `Se mostrarem o erro na tela, a fé acaba.`

### Características (wizard step 2/5)

Obrigatórias antes do quiz / pixel art:

| Campo | Valores |
|---|---|
| Gênero | `feminino` · `masculino` → textos da LLM |
| Cor de pele | clara, morena-clara, morena, negra, amarela → imagem |
| Cor de cabelo | preto, castanho, loiro, ruivo, grisalho, colorido → imagem |
| Cor dos olhos | castanho, preto, verde, azul, mel → imagem |
| Tamanho do cabelo | grande, medio, pequeno, careca → imagem |
| Tipo de cabelo | liso, cacheado (N/A se careca) → imagem |
| Óculos | sim, nao → imagem |

### Tokens de jogo (universais de TI)

| Token | Significado | Vale para |
|---|---|---|
| Dano | HP perdido pelo oponente | Todos |
| Confiança | Buff próprio (próximo ataque / moral na conversa) | Todos |
| Chamado | Ticket / demanda formal aberta (Service Desk, e-mail, fila) | Todos |
| Usuário | Pessoa do outro lado — culpa, dúvida no corredor, “só uma perguntinha” | Todos |
| Evidência | Print, log, laudo, repro — prova do que aconteceu | Todos |

### Mecânica-base por dominante

| Temperamento | Ação | Tom do flavor | Fraqueza típica (`attention`) |
|---|---|---|---|
| **Colérico** | Explosivo | CAPS, urgência, dono do chamado | Sem chamado, o drama esfria |
| **Melancólico** | Detalhista | Print, laudo, “me prova” | Sem evidência, a conversa não anda |
| **Sanguíneo** | Otimista | Fé, café, “vai dar” | Se mostrarem o erro, a fé acaba |
| **Fleumático** | Preguiçoso | Fila, café, segunda a gente vê | Atender no corredor: perde a fila |

### Como escrever um poder (qualquer profissão)

1. **`name`:** apelido engraçado (quiz + profissão).
2. **`flavor` / `summary`:** 1 frase hilária com gênero — **sem** Cause e **sem** `+N`.
3. **`attention`:** fraqueza curta no mesmo tom.

### Combos (dominante + secundário)

O combo **mistura** as duas mecânicas (sempre com chamado/usuário no centro).

| Dominante → Secundário | Tendência do poder |
|---|---|
| Colérico → Fleumático | Impacto alto **só com chamado aberto**. |
| Fleumático → Colérico | Pouco esforço; **pune quem pula a fila** do chamado. |
| Sanguíneo → Fleumático | Pouco dano; **imunidade a “urgente”** sem chamado. |
| Melancólico → Sanguíneo | Evidência + ego: você **não é alvo de culpa** neste turno. |
| Colérico → Melancólico | Pressão + prova: Confuso / bônus se falhar no protocolo. |
| Fleumático → Melancólico | Espera documentada: dano baixo + **marcadores de espera / evidência**. |

Implementação por cargo: `content.json` → `professions[].temperaments` e `professions[].combos` (mesmo esqueleto; só mudam nomes e frases).

## Geração por IA (contrato de prompt)

Objetivo texto: **`name`** + **`flavor`** hilário (com gênero) + **`attention`** curto.  
Objetivo imagem: cenário de humor com **tabela de temperamento** + **combo** + **Base 70/30** (`/api/stylize`).

### Quem decide o quê

| Parte | Quem | Por quê |
|---|---|---|
| Dominante / secundário | Quiz + `scoreQuiz` | Determinístico |
| Atributos (paciência/humor/café/nerdisse) | Base dominante 70% + secundário 30% | Caixinha + cena da imagem |
| Gênero | Step Características | Concordância ela/ele nos textos |
| Aparência | Step Características | Prompt do cartoon (`/api/stylize`) |
| `name` / `flavor` / `attention` | LLM (`/api/generate-power`) | Zoeira de personalidade |
| Humor visual (tabela + combo + attrs) | Prompt imagem (`/api/stylize`) | Estado de humor na arte |
| Poder `X/10` | Atributos + dano típico interno | Caixinha amarela |
| Validação | Servidor | Rejeita Cause / `+N` / colar quiz |

### Payload texto (generate-power)

```json
{
  "profissao": "Desenvolvedor Web",
  "genero": "feminino",
  "genero_gramatica": "Use ela/dela e adjetivos no feminino.",
  "dominante": "colerico",
  "secundario": "sanguineo",
  "hooks": ["…"],
  "keywords": ["PROWEB", "vendedor", "título sumiu"],
  "vibe": "Humor PROWEB/comercial…"
}
```

### Payload imagem (stylize)

Além de `image` + `profession`, envia:

- `appearance` — características (pele, cabelo, olhos, óculos, gênero visual)
- `mood` — `{ dominant, secondary, attrs, name, flavor, attention }`
  - `attrs` = Base 70/30
  - `name` / `flavor` / `attention` = texto da carta (LLM) → gag visual

O prompt:

1. mantém **semelhança facial da foto** enviada;
2. aplica os traços de `appearance`;
3. desenha em estilo **anime / carta Pokémon** (Sugimori/TCG), **full body** centralizado, widescreen;
4. uniforme fixo: **camisa azul-claro** + **jeans azul-escuro**;
5. prioridade visual: **flavor = pose**, efeitos cômicos (`?`, suor), **attention = gag**, attrs = props, escritório = fundo;
6. saída HD: **1456×720** (sem downscale para 288×152).

### Saída da LLM de texto

```
{"name":"...","flavor":"...","attention":"..."}
```

Validar: sem Cause / `+N` / colar quiz; flavor respeita o gênero.

### Fluxo resumido

```
dados → características → quiz → LLM textos (com gênero)
                              → foto + appearance + mood(tabela/combo/attrs) → cartoon
                              → carta / PDF
```

## Atributos (junção de poder)

Aparecem no **fim da carta**, abaixo de Evolução / Vitalidade / Raridade.  
Valem para **todas as profissões** — vêm só do temperamento (dominante 70% + secundário 30%, arredondado).

### O que cada atributo dá ao jogador

| Atributo | Escala | O que dá (benefício) | Como entra no poder |
|---|---|---|---|
| **Paciência** | 0–10 | **+espera / defesa**: o oponente gasta mais para te pressionar; bônus em poderes de fila e “não respondo no corredor”. | 1 ponto = 1 na média |
| **Humor** | 0–10 | **+confiança / conversa**: dano extra se for tranquilo com o usuário; compra confiança. | 1 ponto = 1 na média |
| **Café** | 0–10 | **+urgência / war room**: acelera dano de pressão, reinício, hotfix. | 1 ponto = 1 na média |
| **Nerdisse** | 0–50 | **+evidência / laudo**: dano extra com causa raiz, print, “usuário”. | **÷ 5** → escala 0–10 |

### Base por temperamento dominante

| Temperamento | Paciência | Humor | Café | Nerdisse |
|---|---|---|---|---|
| Colérico | 0 | 3 | 10 | 25 |
| Melancólico | 4 | 2 | 8 | 50 |
| Sanguíneo | 5 | 10 | 6 | 20 |
| Fleumático | 10 | 6 | 7 | 15 |

### Caixinha flutuante (atributos)

Ao lado do título **Atributos Especiais**: **`Poder X/10`** (junção de atributos + dano típico interno). Amarelo.

### Poder total (caixinha `X/10`)

Nota de **1 a 10** (junção):

1. Normalizar atributos em 0–10: `paciência`, `humor`, `café`, `nerdisse ÷ 5`.
2. Dano típico do temperamento dominante → 0–10:

| Temperamento | Dano médio do poder | `dano_n` (÷ 6, máx 10) |
|---|---|---|
| Colérico | 47 | 8 |
| Melancólico | 25 | 4 |
| Sanguíneo | 33 | 6 |
| Fleumático | 15 | 3 |

3. **Fórmula:**

```
média = (paciência + humor + café + nerdisse/5 + dano_n) / 5
poder = clamp(1, 10, arredondar(média))
```

4. Exibição: caixinha flutuante **`{poder}/10`** ao lado do título “Atributos Especial”. Cada atributo na barra mostra **`valor/máx`** (ex.: `7/10`, `41/50`).

## Idade

Válida apenas de **18 a 90 anos**.

## Evolução (por idade)

| Identificador | Faixa |
|---|---|
| Basic | 18 a 40 anos |
| Stage 1 | 41 a 60 anos |
| Stage 2 | 61 a 90 anos |

## Raridade (por idade)

Intervalo 18–90 dividido em 5 faixas iguais: `índice = min(4, floor((idade - 18) / 14,4))`.

| Idade | Símbolo | Raridade | Cor da borda |
|---|---|---|---|
| 18–32 | ● | Comum (Common) | Prata `#9aa0a6` |
| 33–46 | ◆ | Incomum (Uncommon) | Esmeralda `#3d9b6e` |
| 47–61 | ★ | Rara (Rare) | Ouro `#d4a84b` |
| 62–75 | ★★ | Rara Ultra (Ultra Rare) | Violeta `#9b5de5` |
| 76–90 | ★★★ | Rara Ilustração Especial (Special Illustration Rare) | Arco-íris / holofoil |

## Pontos de Saúde (HP)

O HP segue o **temperamento** (estressado → pouco HP; calmo/paciente → muito HP).  
Sorteado **automaticamente ao terminar o quiz**, em **múltiplos de 10** dentro da faixa. O secundário pode empurrar a faixa **um nível** para cima ou para baixo. Valor salvo em `localStorage`.

### Faixas por classificação

| HP | Classificação |
|---|---|
| 30–60 | Muito baixo |
| 70–100 | Baixo |
| 110–180 | Médio |
| 190–250 | Alto |
| 260–330 | Muito alto |
| 340–380 | Extremamente alto |

### Tabela por temperamento dominante

| Temperamento | Perfil | Faixa base (HP) | Classificação |
|---|---|---|---|
| Colérico (Explosivo) | Estressado | 30–60 | Muito baixo |
| Melancólico (Detalhista) | Tenso / crítico | 70–100 | Baixo |
| Sanguíneo (Otimista) | Energético | 190–250 | Alto |
| Fleumático (Preguiçoso) | Calmo / paciente | 340–380 | Extremamente alto |

**Secundário:** se for mais calmo que o dominante, sobe 1 faixa (ex.: Colérico + Fleumático → 70–100). Se for mais estressado, desce 1 faixa (ex.: Fleumático + Colérico → 260–330). As faixas **Médio** (110–180) e **Muito alto** (260–330) aparecem nesses ajustes.

## Arquivos

- `index.html`: estrutura da tela.
- `style.css`: estilos da tela e da carta.
- `content.json`: textos editáveis (marca, formulário, temperamentos, combos, mensagens).
- `script.js`: dados, regras e renderização da carta.
