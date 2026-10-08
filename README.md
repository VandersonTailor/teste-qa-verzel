# Verzel Store QA test: discount coupon and free shipping (card VZS-142)

Validation of release **VZS-142 v2.3.0** of the [Verzel Store](https://verzel-store.qa-test-verzel-store.workers.dev/), done for Verzel's Junior QA technical test and based on the [release documentation](https://verzel-store.qa-test-verzel-store.workers.dev/documentacao).

## Result in one line

**9 of the 11 acceptance criteria passed. The release should not ship as it is:** I found **3 bugs**, 2 of them high severity because they break business rules of the card (CA06 and CA10).

| Bug | Summary | Severity |
|---|---|---|
| [BUG-01](docs/03-bugs.md#bug-01) | With a subtotal of **exactly R$ 200.00**, shipping of R$ 19.90 is charged (and the screen says R$ 0.00 is missing for free shipping) | High |
| [BUG-02](docs/03-bugs.md#bug-02) | The **API accepts more than 5 units** of the same product; an order with 8 units goes through | High |
| [BUG-03](docs/03-bugs.md#bug-03) | An expired coupon restored from the session is shown as "applied" in the cart | Low |

## Where to find each deliverable

| Deliverable | Location |
|---|---|
| Test scenarios (Gherkin) | [`cenarios/`](cenarios): [coupon](cenarios/cupom.feature) · [shipping and total](cenarios/frete-e-total.feature) · [quantity](cenarios/quantidade.feature) · [checkout](cenarios/checkout.feature) · [API contract](cenarios/api-contrato.feature) |
| Strategy, assumptions and ambiguities | [`docs/01-estrategia-e-ambiguidades.md`](docs/01-estrategia-e-ambiguidades.md) |
| Execution (manual and exploratory) with the result of each scenario | [`docs/02-execucao.md`](docs/02-execucao.md) |
| Bug reports | [`docs/03-bugs.md`](docs/03-bugs.md) |
| Evidence | [`docs/04-evidencias.md`](docs/04-evidencias.md), with the files in [`evidencias/screenshots`](evidencias/screenshots) and [`evidencias/api`](evidencias/api) |
| Automation with Playwright | [`tests/`](tests): 48 tests (API and UI), details below |

The scenarios and documents are written in Portuguese.

## Structure

```
├── cenarios/                 # Gherkin scenarios (pt-BR), tagged @CTxx and @CAxx
├── docs/
│   ├── 01-estrategia-e-ambiguidades.md
│   ├── 02-execucao.md        # result of each scenario
│   ├── 03-bugs.md            # bugs with steps, expected vs actual, evidence
│   └── 04-evidencias.md      # index of the evidence
├── evidencias/
│   ├── api/                  # request and response of each call (JSON)
│   └── screenshots/          # screens captured during execution
├── scripts/
│   └── capturar-evidencias.mjs  # regenerates all the evidence
├── tests/
│   ├── api/                  # API tests (Playwright request)
│   ├── e2e/                  # UI tests (Chromium)
│   └── support/              # test data, API helpers and the store Page Object
└── playwright.config.ts
```

## Running the automation

**Requirements:** Node.js 18 or newer (tested with 20.19) and npm.

```bash
git clone https://github.com/VandersonTailor/teste-qa-verzel.git
cd teste-qa-verzel
npm install
npx playwright install chromium
```

| Command | What it does |
|---|---|
| `npm test` | Runs everything (API and UI) |
| `npm run test:api` | API tests only |
| `npm run test:e2e` | UI tests only |
| `npm run test:headed` | UI tests with the browser visible |
| `npm run report` | Opens the HTML report of the last run (with screenshots) |
| `npm run evidencias` | Regenerates the files in `evidencias/` |

To point at another environment: `BASE_URL=https://another-address npm test`.

### Reading the result

The expected result today is **`48 passed`**. Six of those tests cover known bugs and appear with an **`x`** in the `list` output: they check the **documented** behaviour and are marked with `test.fail('BUG-0X ...')`, so they "pass" because the bug is still there.

When the team fixes a bug, the matching test starts to **fail** with the message *"Expected to fail, but passed"*. That is the signal to remove the `test.fail()` and keep the test as a regression test.

| Marked test | Bug |
|---|---|
| `api/frete.api.spec.ts`: CT14 (calculation and order) | BUG-01 |
| `e2e/frete-e-quantidade.spec.ts`: CT14 | BUG-01 |
| `api/validacoes.api.spec.ts`: CT23, CT24 | BUG-02 |
| `e2e/cupom.spec.ts`: EX02 | BUG-03 |

### What is automated

| File | Scenarios |
|---|---|
| `tests/api/cupom.api.spec.ts` | CT01–CT05, CT10–CT12: valid coupon, letter case and spaces, invalid, expired (calculation and order) |
| `tests/api/frete.api.spec.ts` | CT13–CT15 (shipping boundary value), CT18, CT20, CT27, CT28 |
| `tests/api/validacoes.api.spec.ts` | CT23–CT26 (quantity), CT29–CT36 (error codes and products), CT41–CT42 (order) |
| `tests/e2e/cupom.spec.ts` | CT01–CT05, CT07–CT08 and EX02 through the UI |
| `tests/e2e/frete-e-quantidade.spec.ts` | CT13–CT18 and CT21–CT22 through the UI |
| `tests/e2e/checkout.spec.ts` | CT37–CT41: checkout validations and confirmed order |

**Automation decisions**

- Selectors rely mainly on accessible roles and labels (`getByRole`, `getByLabel`) and on the `data-valor` attributes of the summary. CSS classes are used in only two places that have no accessible name (`.coluna-resumo` and `.aviso-frete`), both inside the Page Object `tests/support/loja.ts`.
- Waiting for the recalculation uses the summary's `aria-busy` attribute, with no fixed `waitForTimeout`.
- The environment is shared with other candidates, so I use only 2 workers and no load. Each test uses a fresh browser context, so carts do not mix.
- API and UI tests live in separate Playwright *projects*, so each layer can run on its own.
