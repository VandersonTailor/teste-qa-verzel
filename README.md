# Verzel Store: teste do card VZS-142 (cupom de desconto e frete grátis)

Validação da entrega **VZS-142 v2.3.0** da [Verzel Store](https://verzel-store.qa-test-verzel-store.workers.dev/), feita para o teste técnico de QA Júnior da Verzel, a partir da [documentação da entrega](https://verzel-store.qa-test-verzel-store.workers.dev/documentacao).

## Resultado em uma linha

**9 dos 11 critérios de aceite passaram. A entrega não deveria seguir como está:** foram encontrados **3 bugs**, sendo 2 de severidade alta que quebram regras de negócio do card (CA06 e CA10).

| Bug | Resumo | Severidade |
|---|---|---|
| [BUG-01](docs/03-bugs.md#bug-01) | Com subtotal **exatamente R$ 200,00** é cobrado frete de R$ 19,90 (e a tela mostra "Faltam R$ 0,00 para o frete grátis.") | Alta |
| [BUG-02](docs/03-bugs.md#bug-02) | A **API aceita mais de 5 unidades** do mesmo produto; dá para fechar pedido com 8 unidades | Alta |
| [BUG-03](docs/03-bugs.md#bug-03) | Cupom expirado restaurado da sessão aparece como "aplicado" no carrinho | Baixa |

## Onde encontrar cada entrega

| Entrega pedida | Onde está |
|---|---|
| Cenários de teste (Gherkin) | [`cenarios/`](cenarios): [cupom](cenarios/cupom.feature) · [frete e total](cenarios/frete-e-total.feature) · [quantidade](cenarios/quantidade.feature) · [checkout](cenarios/checkout.feature) · [contrato da API](cenarios/api-contrato.feature) |
| Estratégia, premissas e ambiguidades | [`docs/01-estrategia-e-ambiguidades.md`](docs/01-estrategia-e-ambiguidades.md) |
| Execução (manual + exploratória) com o resultado de cada cenário | [`docs/02-execucao.md`](docs/02-execucao.md) |
| Report dos bugs | [`docs/03-bugs.md`](docs/03-bugs.md) |
| Evidências da execução | [`docs/04-evidencias.md`](docs/04-evidencias.md), com os arquivos em [`evidencias/screenshots`](evidencias/screenshots) e [`evidencias/api`](evidencias/api) |
| Automação com Playwright | [`tests/`](tests): 48 testes (API + interface), detalhes abaixo |

## Estrutura

```
├── cenarios/                 # Cenários em Gherkin (pt-BR), com tags @CTxx e @CAxx
├── docs/
│   ├── 01-estrategia-e-ambiguidades.md
│   ├── 02-execucao.md        # Resultado de cada cenário
│   ├── 03-bugs.md            # Bugs com passos, esperado x obtido e evidências
│   └── 04-evidencias.md      # Índice das evidências
├── evidencias/
│   ├── api/                  # Requisição + resposta de cada chamada (JSON)
│   └── screenshots/          # Telas da execução
├── scripts/
│   └── capturar-evidencias.mjs  # Gera de novo todas as evidências
├── tests/
│   ├── api/                  # Testes de API (Playwright request)
│   ├── e2e/                  # Testes de interface (Chromium)
│   └── support/              # Massa de dados, helpers de API e Page Object da loja
└── playwright.config.ts
```

## Como rodar a automação

**Pré-requisitos:** Node.js 18 ou mais novo (testado com 20.19) e npm.

```bash
git clone https://github.com/VandersonTailor/teste-qa-verzel.git
cd teste-qa-verzel
npm install
npx playwright install chromium
```

| Comando | O que faz |
|---|---|
| `npm test` | Roda tudo (API + interface) |
| `npm run test:api` | Só os testes de API |
| `npm run test:e2e` | Só os testes de interface |
| `npm run test:headed` | Interface com o navegador visível |
| `npm run report` | Abre o relatório HTML da última execução (com screenshots) |
| `npm run evidencias` | Gera de novo os arquivos de `evidencias/` |

Para apontar para outro ambiente: `BASE_URL=https://outro-endereco npm test`.

### Como ler o resultado

O resultado esperado hoje é **`48 passed`**. Seis desses testes cobrem bugs conhecidos e aparecem com **`x`** na saída `list`: eles verificam o comportamento **documentado** e estão marcados com `test.fail('BUG-0X ...')`, então "passam" porque o bug ainda está lá.

Quando o time corrigir um bug, o teste correspondente começa a **falhar** com a mensagem *"Expected to fail, but passed"*. É o aviso para remover o `test.fail()` e manter o teste como regressão.

| Teste marcado | Bug |
|---|---|
| `api/frete.api.spec.ts`: CT14 (cálculo e pedido) | BUG-01 |
| `e2e/frete-e-quantidade.spec.ts`: CT14 | BUG-01 |
| `api/validacoes.api.spec.ts`: CT23, CT24 | BUG-02 |
| `e2e/cupom.spec.ts`: EX02 | BUG-03 |

### O que está automatizado

| Arquivo | Cenários |
|---|---|
| `tests/api/cupom.api.spec.ts` | CT01–CT05, CT10–CT12: cupom válido, caixa e espaços, inválido, expirado (cálculo e pedido) |
| `tests/api/frete.api.spec.ts` | CT13–CT15 (valor limite do frete), CT18, CT20, CT27, CT28 |
| `tests/api/validacoes.api.spec.ts` | CT23–CT26 (quantidade), CT29–CT36 (códigos de erro e produtos), CT41–CT42 (pedido) |
| `tests/e2e/cupom.spec.ts` | CT01–CT05, CT07–CT08 e EX02 pela interface |
| `tests/e2e/frete-e-quantidade.spec.ts` | CT13–CT18 e CT21–CT22 pela interface |
| `tests/e2e/checkout.spec.ts` | CT37–CT41: validações do checkout e pedido confirmado |

**Decisões da automação**
- Os seletores usam principalmente papéis e textos acessíveis (`getByRole`, `getByLabel`) e os atributos `data-valor` do resumo. As classes CSS ficaram só em dois pontos que não têm nome acessível (`.coluna-resumo` e `.aviso-frete`), concentrados no Page Object `tests/support/loja.ts`.
- A espera pelo recálculo usa o `aria-busy` do resumo, sem `waitForTimeout` fixo.
- O ambiente é compartilhado com outros candidatos, por isso uso só 2 workers e nada de carga. Cada teste usa um contexto de navegador novo, então os carrinhos não se misturam.
- Testes de API e de interface ficam em *projects* separados no Playwright, para rodar cada camada isoladamente.
