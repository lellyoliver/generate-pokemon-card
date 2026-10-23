# Como jogar — Carta de Tecnologia

Regras de **mesa** depois de gerar e imprimir a carta (PDF **7 × 9,7 cm**).  
A geração da carta (quiz, LLM, cartoon) está em [`regras-carta-temperamento.md`](./regras-carta-temperamento.md).

Tema: você e o colega resolvem (ou sabotam) o **chamado** do escritório com temperamento, café e evidência.

---

## O que você precisa

| Item | Quantidade |
|---|---|
| Cartas impressas (1 por pessoa) | 2+ |
| Dados (d10 ou d6) | 1 por mesa |
| Fichas de **Chamado** (papel, clipes, moedas…) | 3–5 por duelo |
| Mesa / corredor / coffee break | 5–15 min |

**Chamado aberto** = ticket formal na mesa. Sem chamado, vários poderes enfraquecem (veja **Fraqueza**).

---

## Leitura da carta

| Na carta | No jogo |
|---|---|
| **HP** | Vida. Chegou a 0 → perdeu o duelo. |
| **Poder X/10** | Força do ataque principal (dano base). |
| **name + flavor** | Nome e efeito narrativo do poder. |
| **attention** | **Fraqueza** — condição que anula ou reduz o ataque. |
| **Paciência / Humor / Café / Nerdisse** | Dados secundários (empates, buffs, evidência). |
| **Evolução** (Basic / Stage 1 / Stage 2) | Desempate + bônus leve. |
| **Raridade** | Só flavor visual — **não** muda dano. |
| **Profissão** | Cenário da zoeira (não muda números). |

### Dano do ataque

Use a caixinha **Poder X/10**:

```
dano = Poder × 10
```

Exemplos: Poder `4/10` → **40** de dano · Poder `7/10` → **70**.

(Internamente a API também guarda um `dano` por slot de temperamento; na mesa, a caixinha **Poder** é a fonte oficial.)

---

## Modo rápido — Duelo 1×1 (recomendado)

**Objetivo:** zerar o HP do oponente.

### Preparação

1. Cada um coloca a carta na mesa, HP pra cima.
2. Coloque **3 Chamados** no centro (pilha).
3. Quem tiver **maior Café** começa. Empate → maior **Humor**. Ainda empatou → dado.

### Turno (1 jogador)

1. **Abrir chamado (opcional)** — gaste 1 ficha da pilha e declare: *“Chamado aberto.”*  
   Sem ficha restante, ninguém abre chamado novo neste duelo.
2. **Atacar** — declare o poder (`name`) e role:
   - **d10 ≥ 4** → acerto (sucesso).
   - **d10 ≤ 3** → erro (o turno acaba; oponente zoeira à vontade).
3. **Fraqueza (`attention`)** — o **defensor** pode invocar a fraqueza do atacante **uma vez por duelo**, se a condição fizer sentido na mesa (ex.: “sem print”, “sem chamado”, “atendeu no corredor”).  
   - Se a fraqueza **bate**: o ataque causa **metade** do dano (arredonda para baixo) **ou** é anulado (combinem antes; padrão = **metade**).
4. **Aplicar dano** no HP do oponente (só no acerto).
5. Passe a vez.

### Buffs de atributo (opcional, 1 por turno)

No seu turno, **antes** do ataque, gaste o atributo assim (marque com caneta ou ficha; cada uso **−2** no atributo até o fim do duelo, mín. 0):

| Atributo | Efeito |
|---|---|
| **Paciência** | +1 no d10 deste ataque (espera na fila). |
| **Humor** | Se errar o dado, **refaz 1 vez** (conversa salvou). |
| **Café** | Este ataque **ignora** fraqueza do oponente (war room). |
| **Nerdisse** | Exige **evidência**: o defensor não pode invocar fraqueza neste ataque. |

### Fim

Quem chegar a **HP 0** perde.  
Se a pilha de Chamados acabar e os dois ainda tiverem HP, vence quem tiver **mais HP**. Empate → maior **Poder**; depois maior **Evolução** (Stage 2 > Stage 1 > Basic).

---

## Modo mesa — War Room (3–6 jogadores)

**Objetivo:** ser o último com HP > 0 **ou** acumular 3 **Resolvidos**.

### Preparação

1. Todos com carta e HP visível.
2. Pilha de **Chamados** = número de jogadores + 2.
3. Ordem: Café decrescente.

### Rodada

1. O jogador da vez **abre 1 Chamado** (obrigatório enquanto houver fichas) e escolhe **um alvo**.
2. Ataca o alvo com as mesmas regras do duelo (d10, fraqueza, buffs).
3. Se o alvo cair a 0 HP, o atacante ganha **1 Resolvido** e o alvo fica fora (só zoeira).
4. Se o atacante **errar** o d10, o próximo jogador à esquerda pode **roubar o Chamado** (vira o atacante imediato contra o mesmo alvo, sem gastar ficha nova).

### Vitória

- **3 Resolvidos**, ou  
- último sobrevivente, ou  
- acabaram os Chamados → maior HP (desempates iguais ao duelo).

---

## Modo festa — Flash Round (sem dano longo)

Ideal pra coffee break (**~2 min** por confronto).

1. Dois jogadores, **1 ataque cada**.
2. Cada um rola d10 + **Poder**.
3. Maior total vence. Empate → maior **Humor**; depois **Nerdisse**.
4. Perdedor conta em voz alta o `attention` da própria carta (obrigatório).

---

## Temperamentos na mesa (lembrete)

| Dominante | Estilo de jogo | Fraqueza típica |
|---|---|---|
| **Colérico** | Alto impacto, pouco HP | Sem chamado, o drama esfria |
| **Melancólico** | Quer evidência / print | Sem prova, a conversa trava |
| **Sanguíneo** | Buff social (Humor) | Mostraram o erro → fé acaba |
| **Fleumático** | Muito HP, pouco dano | Atender no corredor / furar fila |

Combos (dominante + secundário) só mudam o texto e o **Poder** já calculado na carta — na mesa você **não** recalcula atributos.

---

## Casa / variantes

Combinem **antes** do primeiro ataque:

1. **Fraqueza mata** — em vez de metade, anula 100%.  
2. **Sem dado** — acerto automático; só fraqueza e buffs importam.  
3. **Best of 3** — melhor de três Flash Rounds.  
4. **Time por área** — soma HP do time (ex.: Dev vs Infra); um ataque por round, escolhido pelo time.

---

## Etiqueta de escritório

- O jogo é **zoeira**, não avaliação de desempenho.
- `attention` e `flavor` são piadas de TI — não use como feedback real.
- Se alguém não quiser duelar, vale só colecionar / trocar cartas.

---

## Resumo de 30 segundos

1. Gera a carta → imprime.  
2. HP = vida · Poder×10 = dano.  
3. Abre **Chamado** → rola d10 (≥4 acerta) → aplica dano.  
4. Oponente pode citar sua **fraqueza** (`attention`) → dano pela metade.  
5. Atributos dão buffs (−2 cada uso).  
6. HP 0 = perdeu. Café decide quem começa.
