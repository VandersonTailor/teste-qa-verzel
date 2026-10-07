# Execução dos testes: VZS-142 (cupom de desconto e frete grátis)

| | |
|---|---|
| **Ambiente** | https://verzel-store.qa-test-verzel-store.workers.dev (versão 2.3.0 da entrega) |
| **Data da execução** | 06/10/2026 |
| **Navegador** | Chromium (Playwright 1.x), desktop 1280x900 |
| **API** | Requisições via Playwright `request` e curl |
| **Cenários** | [`cenarios/`](../cenarios) (Gherkin) |

## Resumo

| Total | Passou | Falhou | Bugs abertos |
|:---:|:---:|:---:|:---:|
| 48 (42 planejados + 6 exploratórios) | 43 | 5 (CT14, CT23, CT24, EX01, EX02) | 3 |

| Critério | Resultado | Observação |
|---|---|---|
| CA01: BEMVINDO10 dá 10% | ✅ Passou | |
| CA02: maiúsculas/minúsculas e espaços | ✅ Passou | |
| CA03: cupom inexistente | ✅ Passou | |
| CA04: cupom expirado | ✅ Passou | Falha só ao restaurar da sessão ([BUG-03](03-bugs.md#bug-03)) |
| CA05: um cupom por vez | ✅ Passou | |
| CA06: frete grátis a partir de R$ 200,00, **inclusive** | ❌ **Falhou** | [BUG-01](03-bugs.md#bug-01) |
| CA07: frete R$ 19,90 e aviso de quanto falta | ✅ Passou | No limite, o aviso fica "Faltam R$ 0,00" ([BUG-01](03-bugs.md#bug-01)) |
| CA08: frete considera o subtotal antes do desconto | ✅ Passou | |
| CA09: desconto não incide sobre o frete | ✅ Passou | |
| CA10: máximo de 5 unidades na interface **e na API** | ❌ **Falhou** | Interface OK, API não valida ([BUG-02](03-bugs.md#bug-02)) |
| CA11: arredondamento em 2 casas | ✅ Passou | |

Legenda do tipo: **UI** = manual pela interface · **API** = manual pela API · **EXP** = exploratório · 🤖 = também automatizado com Playwright.

## Cupom de desconto

| ID | Cenário | CA | Tipo | Resultado | Evidência |
|---|---|---|---|---|---|
| CT01 | BEMVINDO10 aplica 10% sobre o subtotal (239,70 → desconto 23,97 → total 215,73) | CA01 | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT01-CT02-CT03-cupom-valido-minusculo-com-espacos.png) · [api](../evidencias/api/CT01-calcular-cupom-valido.json) |
| CT02 | `bemvindo10` / `BemVindo10` são aceitos | CA02 | UI + API 🤖 | ✅ Passou | [api](../evidencias/api/CT02-calcular-cupom-minusculo.json) |
| CT03 | `"  BEMVINDO10  "` (espaços nas pontas) é aceito | CA02 | UI + API 🤖 | ✅ Passou | [api](../evidencias/api/CT03-calcular-cupom-espacos.json) |
| CT04 | Cupom inexistente → "Cupom inválido.", sem desconto | CA03 | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT04-cupom-inexistente.png) · [api](../evidencias/api/CT04-calcular-cupom-inexistente.json) |
| CT05 | VERAO2026 → "Cupom expirado.", sem desconto | CA04 | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT05-cupom-expirado.png) · [api](../evidencias/api/CT05-calcular-cupom-expirado.json) |
| CT06 | Campo vazio → "Informe um cupom.", sem chamar a API | | UI | ✅ Passou | [tela](../evidencias/screenshots/CT06-cupom-vazio.png) |
| CT07 | Com um cupom aplicado não há campo para outro | CA05 | UI 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT01-CT02-CT03-cupom-valido-minusculo-com-espacos.png) |
| CT08 | Remover cupom zera o desconto e o campo volta | CA05 | UI 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT08-cupom-removido.png) |
| CT09 | Cupom continua aplicado após recarregar a página | | UI | ✅ Passou | |
| CT10 | Pedido com cupom inexistente → 422 `CUPOM_INVALIDO` | | API 🤖 | ✅ Passou | [api](../evidencias/api/CT10-pedido-cupom-inexistente.json) |
| CT11 | Pedido com cupom expirado → 422 `CUPOM_EXPIRADO` | | API 🤖 | ✅ Passou | [api](../evidencias/api/CT11-pedido-cupom-expirado.json) |
| CT12 | Cálculo com cupom inválido/expirado → 200, sem desconto, motivo em `cupom.mensagem` | | API 🤖 | ✅ Passou | [api](../evidencias/api/CT04-calcular-cupom-inexistente.json) |

## Frete grátis e total

| ID | Cenário | CA | Tipo | Resultado | Evidência |
|---|---|---|---|---|---|
| CT13 | Subtotal R$ 199,90 → frete R$ 19,90, "Faltam R$ 0,10" | CA07 | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT13-subtotal-199_90-frete-cobrado.png) · [api](../evidencias/api/CT13-calcular-subtotal-199_90.json) |
| CT14 | Subtotal **R$ 200,00** → frete grátis | CA06 | UI + API 🤖 | ❌ **Falhou: [BUG-01](03-bugs.md#bug-01)** | [tela](../evidencias/screenshots/CT14-BUG01-subtotal-200_00-frete-cobrado.png) · [api](../evidencias/api/CT14-BUG01-calcular-subtotal-200_00.json) · [pedido](../evidencias/api/CT14-BUG01-pedido-subtotal-200_00.json) |
| CT15 | Subtotal R$ 219,80 → frete grátis | CA06 | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT15-subtotal-219_80-frete-gratis.png) · [api](../evidencias/api/CT15-calcular-subtotal-219_80.json) |
| CT16 | Aviso "Faltam R$ 60,10" com R$ 139,90 | CA07 | UI 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT04-cupom-inexistente.png) |
| CT17 | Aviso de quanto falta some ao atingir o frete grátis (1 → 2 tênis) | CA06 | UI 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT15-subtotal-219_80-frete-gratis.png) |
| CT18 | R$ 219,80 com cupom (total R$ 197,82) continua com frete grátis | CA08 | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT18-frete-gratis-considera-subtotal-antes-do-desconto.png) · [api](../evidencias/api/CT18-calcular-frete-antes-do-desconto.json) |
| CT19 | R$ 189,90 com cupom continua pagando frete | CA08 | UI | ✅ Passou | |
| CT20 | Mochila R$ 100 + cupom → desconto R$ 10,00, frete R$ 19,90, total R$ 109,90 | CA09 | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT20-desconto-nao-incide-sobre-frete.png) · [api](../evidencias/api/CT20-calcular-desconto-nao-incide-frete.json) |
| CT27 | Arredondamento: 1649,50 → desconto 164,95 / total 1484,55; 59,90 → 5,99; 29,90 → 2,99 | CA11 | API 🤖 | ✅ Passou | [api](../evidencias/api/CT27-calcular-arredondamento.json) |
| CT28 | Total = subtotal - desconto + frete com 3 itens + cupom | | API 🤖 | ✅ Passou | |

## Quantidade por produto

| ID | Cenário | CA | Tipo | Resultado | Evidência |
|---|---|---|---|---|---|
| CT21 | Vitrine: na 5ª unidade aparece "Limite de 5 unidades atingido." e o botão desabilita | CA10 | UI 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT21-vitrine-limite-5-unidades.png) |
| CT22 | Carrinho: botão "+" desabilitado com 5 unidades | CA10 | UI 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT22-carrinho-botao-mais-desabilitado-em-5.png) |
| CT23 | `/carrinho/calcular` com 6 unidades → 422 `QUANTIDADE_MAXIMA_EXCEDIDA` | CA10 | API 🤖 | ❌ **Falhou: [BUG-02](03-bugs.md#bug-02)** | [api](../evidencias/api/CT23-BUG02-calcular-quantidade-6.json) |
| CT24 | `/pedidos` com 6 unidades → 422 `QUANTIDADE_MAXIMA_EXCEDIDA` | CA10 | API 🤖 | ❌ **Falhou: [BUG-02](03-bugs.md#bug-02)** | [api](../evidencias/api/CT24-BUG02-pedido-quantidade-6.json) |
| CT25 | 5 unidades são aceitas | CA10 | API 🤖 | ✅ Passou | [api](../evidencias/api/CT25-calcular-quantidade-5.json) |
| CT26 | Quantidade 0, -1, 1.5, "2", ausente/null → 422 `QUANTIDADE_INVALIDA` | | API 🤖 | ✅ Passou | [api](../evidencias/api/CT26-calcular-quantidade-0.json) · [api](../evidencias/api/CT26-calcular-quantidade-decimal.json) |

## API: contrato e erros

| ID | Cenário | Tipo | Resultado | Evidência |
|---|---|---|---|---|
| CT29 | Corpo `abc` e `[1,2]` → 400 `JSON_INVALIDO` | API 🤖 | ✅ Passou | [api](../evidencias/api/CT29-json-invalido.json) |
| CT30 | `GET /api/xyz` → 404 `ROTA_NAO_ENCONTRADA` | API 🤖 | ✅ Passou | [api](../evidencias/api/CT30-rota-inexistente.json) |
| CT31 | `DELETE /api/produtos` e `GET /api/carrinho/calcular` → 405 | API 🤖 | ✅ Passou | [api](../evidencias/api/CT31-metodo-nao-permitido.json) |
| CT32 | `itens: []` e corpo `{}` → 422 `ITENS_OBRIGATORIOS` | API 🤖 | ✅ Passou | [api](../evidencias/api/CT32-itens-vazios.json) |
| CT33 | Item que não é objeto → 422 `ITEM_INVALIDO` | API 🤖 | ✅ Passou | [api](../evidencias/api/CT33-item-invalido.json) |
| CT34 | Produto inexistente → 422 no cálculo / 404 no `GET /produtos/{id}` | API 🤖 | ✅ Passou | [api](../evidencias/api/CT34-produto-inexistente-calcular.json) · [api](../evidencias/api/CT34-produto-inexistente-get.json) |
| CT35 | Produto repetido nos itens → 422 `ITEM_DUPLICADO` | API 🤖 | ✅ Passou | [api](../evidencias/api/CT35-item-duplicado.json) |
| CT36 | `GET /api/produtos` traz os 8 produtos e preços da documentação | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT36-vitrine.png) · [api](../evidencias/api/CT36-listar-produtos.json) |

## Checkout

| ID | Cenário | Tipo | Resultado | Evidência |
|---|---|---|---|---|
| CT37 | Campos vazios mostram mensagens e não chamam `/api/pedidos` | UI 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT37-checkout-campos-obrigatorios.png) |
| CT38 | Nome sem sobrenome (`Maria`, `"Maria  "`) é recusado | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT38-CT39-CT40-checkout-dados-invalidos.png) |
| CT39 | E-mail inválido (`maria@`, `maria@exemplo`, com espaço) é recusado | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT38-CT39-CT40-checkout-dados-invalidos.png) |
| CT40 | CEP com 7/9 dígitos, letras, ponto ou espaço é recusado; `01310-100` e `01310100` são aceitos | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT38-CT39-CT40-checkout-dados-invalidos.png) |
| CT41 | Pedido válido com cupom → "Pedido VZ-000000", valores iguais aos do carrinho, carrinho esvaziado | UI + API 🤖 | ✅ Passou | [tela](../evidencias/screenshots/CT41-pedido-confirmado.png) · [tela](../evidencias/screenshots/CT41-carrinho-vazio-apos-pedido.png) · [api](../evidencias/api/CT41-pedido-valido.json) |
| CT42 | API devolve `DADOS_INVALIDOS` com a lista de `campos` | API 🤖 | ✅ Passou | [api](../evidencias/api/CT42-pedido-dados-invalidos.json) |

## Testes exploratórios

Sessões de cerca de 60 min, guiadas por estas perguntas: "a interface confia nos próprios dados ou no que a API responde?", "o que acontece nas bordas dos valores?" e "dá para pular as validações da interface?". O carrinho fica no `sessionStorage` (`verzel-store:itens` e `verzel-store:cupom`), então editei esses valores pelo DevTools para simular estados que a interface não deixa criar.

| ID | Charter / o que foi feito | Resultado | Evidência |
|---|---|---|---|
| EX01 | Pôr 8 unidades no `sessionStorage` e finalizar a compra | ❌ **[BUG-02](03-bugs.md#bug-02)**: o carrinho mostra "Limite de 5 unidades por produto." mas deixa finalizar, e o pedido VZ-xxxxxx sai com 8 unidades | [carrinho](../evidencias/screenshots/EX01-BUG02-carrinho-com-8-unidades.png) · [pedido](../evidencias/screenshots/EX01-BUG02-pedido-confirmado-com-8-unidades.png) |
| EX02 | Cupom expirado salvo na sessão (simula um cupom que expira com o carrinho aberto) | ❌ **[BUG-03](03-bugs.md#bug-03)**: aparece "Cupom VERAO2026 aplicado." com desconto R$ 0,00, e o erro só surge ao confirmar o pedido | [carrinho](../evidencias/screenshots/EX02-BUG03-cupom-expirado-exibido-como-aplicado.png) · [checkout](../evidencias/screenshots/EX02-BUG03-checkout-recusa-cupom-expirado.png) |
| EX03 | Duplo clique em "Confirmar pedido" | ✅ Só uma requisição `POST /api/pedidos` | |
| EX04 | Abrir o carrinho em nova aba | ✅ Carrinho vazio: comportamento esperado segundo "Sobre este ambiente" | [tela](../evidencias/screenshots/EX04-nova-aba-carrinho-vazio.png) |
| EX05 | Rota inexistente na loja (`/pagina-que-nao-existe`) | ✅ Página "Página não encontrada" com link para os produtos | [tela](../evidencias/screenshots/EX05-pagina-nao-encontrada.png) |
| EX06 | Acessar `/checkout` com o carrinho vazio | ✅ Volta para "Seu carrinho está vazio" | [tela](../evidencias/screenshots/EX06-checkout-com-carrinho-vazio.png) |

Outras checagens exploratórias sem problema: subtotais de 199,40 / 199,60 / 199,70 / 199,80 em várias combinações e ordens de itens (o faltante esteve sempre certo); cupom como número (`123`), lista, `null`, `""` e `"   "`; cupom com espaço no meio (`BEM VINDO10` → inválido); id de produto em minúsculas (`p001` → não encontrado, interpretação em [ambiguidades](01-estrategia-e-ambiguidades.md)).
