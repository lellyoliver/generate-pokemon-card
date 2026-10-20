# Carta de Tecnologia — Hugging Face

Gerador de cartas com foto, temperamentos, atributos e download em PDF.
A transformação da foto em ilustração usa o cliente oficial `@huggingface/inference`,
com requisições feitas pelo servidor Node.js.

## Instalação

Use **Node.js 22 ou superior**. Na pasta do projeto, execute:

```bash
npm install
npm start
```

Abra <http://localhost:3000>. A aplicação precisa do servidor para transformar fotos.

## Textos da tela

Quase todos os textos editáveis ficam em **`content.json`**: marca, piadas, ticker,
rótulos do wizard, botões, profissões, temperamentos, combinações, raridades e
mensagens da geração de imagem. Edite o arquivo e recarregue a página (`Ctrl+F5`).

## Configuração

Este pacote não inclui arquivos `.env`. Mantenha seu arquivo local e ajuste estas
variáveis nele, ou defina-as no ambiente do processo:

```dotenv
HF_TOKEN=hf_SEU_TOKEN_AQUI
HF_MODEL=black-forest-labs/FLUX.1-Kontext-dev
HF_PROVIDER=fal-ai
PORT=3000
HF_IMAGE_API=1
EMAIL_GATE=1
EMAIL_DOMAIN=seu email
# Só se a rede corporativa bloquear TLS (desenvolvimento local):
# HF_INSECURE_TLS=1
```

Com `EMAIL_GATE=1`, a geração pede e-mail `@ancora.com.br`. Cada e-mail gera uma vez
(registro em `pixel-art/log.json`); se tentar de novo, a API devolve a imagem já salva.
As artes ficam em `pixel-art/`. Para liberar gerações livres, use `EMAIL_GATE=0` e reinicie.

- Crie o token em <https://huggingface.co/settings/tokens>, com permissão para
  **Inference Providers**. O token fica no servidor, sem ser enviado ao navegador.
- Para desligar a geração de imagem sem apagar o token, use `HF_IMAGE_API=0`
  e reinicie o servidor. Com `1` (padrão) a API fica ativa.
- Em rede com proxy/SSL inspection, use `HF_INSECURE_TLS=1` no `.env` local
  (desliga a verificação TLS) ou configure `NODE_EXTRA_CA_CERTS` com o
  certificado raiz da empresa. Não use isso em produção.
- Se já houver `HF_MODEL` no seu ambiente, substitua seu valor pelo modelo acima.
  As variáveis do processo têm prioridade sobre as do arquivo local.
- `HF_MODEL`, `HF_PROVIDER` e `PORT` são opcionais; os valores acima são os padrões.
- O provedor padrão é **fal-ai**, acessado pelo Hugging Face. Com um token HF e
  faturamento pelo Hugging Face, não é necessária uma chave separada do fal-ai.
- Para outro modelo, confirme que ele tem um provedor ativo e suporta a tarefa
  **image-to-image**, com os parâmetros usados neste projeto. Estar no Hub não
  significa que o modelo tem uma API de inferência disponível.
- Se a conta ou o modelo exigir saldo, permissões ou aceite de condições,
  regularize isso no Hugging Face. A integração **não garante geração gratuita**.
- Reinicie o servidor depois de mudar a configuração.

## Uso

1. Monte a carta e escolha uma foto.
2. Clique em **Transformar em pixel art**.
3. Quando a arte estiver pronta, use **Baixar carta (PDF)** (7×9,7 cm para impressão).
   O PDF captura a carta **igual à tela** (não redesenha do zero).

A foto é reduzida para até 768 pixels no maior lado e convertida para JPEG antes
do envio. O estilo é fixo: retrato em pixel art 16-bit no visual de carta Pokémon.

O indicador **Hugging Face configurado** informa que há um token com o prefixo
esperado. A autenticação, o saldo e a disponibilidade do modelo são verificados
quando uma geração é solicitada. O tempo limite da requisição é de 2 minutos;
se ele for atingido, a tarefa remota pode continuar em processamento.

## Verificação

```bash
npm test
```

Os testes usam token fictício e respostas simuladas. Não carregam arquivos de
ambiente nem geram imagens reais. Cobrem o contrato do SDK, a resposta da API,
entradas inválidas e erros de acesso, saldo, limite e disponibilidade. Os testes
da tela simulam o DOM para verificar o indicador de configuração, a geração,
o reinício da carta e a recuperação após erros.

O servidor publica apenas os arquivos necessários à tela. O código do servidor
e arquivos de configuração não são disponibilizados por HTTP.

## Referências

- [Cliente oficial JavaScript](https://huggingface.co/docs/huggingface.js/inference/README)
- [API image-to-image](https://huggingface.co/docs/inference-providers/tasks/image-to-image)
- [Modelo padrão](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev)
- [Cobrança e créditos](https://huggingface.co/docs/inference-providers/pricing)
