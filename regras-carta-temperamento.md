# Carta de Tecnologia (estilo Pokémon)

Página em `.html` + `.js` que gera uma carta com as características de uma pessoa, usando os 4 temperamentos clássicos como "símbolo de energia".

## Tela

- **Topo:** estágio de evolução, nome da pessoa, HP e símbolo de energia.
- **Centro:** ícone do temperamento (ou da combinação) e descrição.
- **Rodapé:** idade, saúde, custo de recuo e raridade.

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

Sorteado por botão com `Math.random()`, em **múltiplos de 10, de 30 a 380**. O valor fica salvo (localStorage).

| HP | Classificação |
|---|---|
| 30–60 | Muito baixo |
| 70–100 | Baixo |
| 110–180 | Médio |
| 190–250 | Alto |
| 260–330 | Muito alto |
| 340–380 | Extremamente alto |

## Custo de recuo

Sorteado por `Math.random()`, de **0 a 5**.

| Custo | Símbolo | Significado |
|---|---|---|
| 0 | Nenhum | Recuo gratuito |
| 1 | ⭐ | Descartar 1 energia |
| 2 | ⭐⭐ | Descartar 2 energias |
| 3 | ⭐⭐⭐ | Descartar 3 energias |
| 4 | ⭐⭐⭐⭐ | Descartar 4 energias |
| 5 | ⭐⭐⭐⭐⭐ | Descartar 5 energias |

## Arquivos

- `index.html`: estrutura da tela.
- `style.css`: estilos da tela e da carta.
- `content.json`: textos editáveis (marca, formulário, temperamentos, combos, mensagens).
- `script.js`: dados, regras e renderização da carta.
