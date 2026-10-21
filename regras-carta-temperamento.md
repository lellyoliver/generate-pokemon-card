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

A **profissão** só troca o *cenário* da frase (código, DNS, processo, servidor…), nunca a mecânica.  
Texto na carta: `name` (título) + `summary` (efeito) + `attention` (sabor).

### Tokens de jogo (universais de TI)

| Token | Significado | Vale para |
|---|---|---|
| Dano | HP perdido pelo oponente | Todos |
| Confiança | Buff próprio (próximo ataque / moral na conversa) | Todos |
| Chamado | Ticket / demanda formal aberta (Service Desk, e-mail, fila) | Todos |
| Usuário | Pessoa do outro lado — culpa, dúvida no corredor, “só uma perguntinha” | Todos |
| Evidência | Print, log, laudo, repro — prova do que aconteceu | Todos |

### Mecânica-base por dominante

| Temperamento | Ação | Dano base | Condição / ganho | Fraqueza (atenção) |
|---|---|---|---|---|
| **Colérico** | Explosivo | Alto (35–60) | Bônus se o chamado **ainda não foi tratado com urgência** (reinício, hotfix, war room). Pode **Paralisar** até cumprir o protocolo. | Impaciência: sem urgência/chamado, dano **parcial** ou fim de turno. |
| **Melancólico** | Detalhista | Baixo–médio (20–30) | Bônus se achar causa em **usuário**, erro ou evidência. O oponente pode **descartar 1 confiança**; anexa evidência. | Sem prova, só o dano base. |
| **Sanguíneo** | Otimista | Médio (25–40) | Se for **tranquilo com o usuário** (confiança, “funciona aí”, tom leve), cause **dano extra** e **compre 1 confiança**. | Se o oponente **mostrar o erro**, o bônus some. |
| **Fleumático** | Preguiçoso | Baixo (10–20) | **Dano pleno / bloqueio** só se a dúvida **não foi resolvida no corredor** — o outro lado precisa **abrir chamado**. Ficar calmo → **ganha confiança**; ataque inimigo custa +1 “paciência”. | Se você atender tudo na hora / mexer demais, perde a espera. |

### Como escrever um poder (qualquer profissão)

1. **Abrir com dano** (“Cause X de dano”).
2. **Uma condição universal**: chamado, usuário, confiança ou evidência.
3. **Um bônus ou status** (dano extra, Paralisado, Confuso, descartar confiança).
4. **Uma frase de atenção** no tom da profissão (só o sabor muda).

**Tamanho:** `summary` / `desc` com **no máximo 3 linhas** na carta. Atenção também curta.

**Exemplos-guia (iguais para todos — mude só o vocabulário da área):**

| Dominante | Exemplo de efeito |
|---|---|
| Colérico | Cause 40 de dano. Se o chamado ainda não foi tratado neste turno, o oponente fica Paralizado até cumprir o protocolo. |
| Melancólico | Cause 20 de dano. Se a causa for “usuário”, cause 40 a mais e ele descarta 1 confiança. |
| Sanguíneo | Cause 30 de dano. Se você for tranquilo com o usuário e declarar que “funciona”, cause 20 a mais e compre 1 confiança. |
| Fleumático | Cause 10 de dano. O oponente não pode atacar no próximo turno, a menos que abra um chamado. Se você não responder no corredor, compre 1 confiança. |

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

### Poder total (caixinha flutuante `X/10`)

Nota única na carta: **Poder de junção**, de **1 a 10**.

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
