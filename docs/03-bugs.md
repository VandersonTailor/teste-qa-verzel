# Bugs encontrados: VZS-142

| ID | Título | Severidade | Prioridade | Onde | CA |
|---|---|---|---|---|---|
| [BUG-01](#bug-01) | Frete de R$ 19,90 cobrado quando o subtotal é exatamente R$ 200,00 | Alta | Alta | API (cálculo e pedido) → interface | CA06 |
| [BUG-02](#bug-02) | API aceita mais de 5 unidades do mesmo produto | Alta | Alta | API (cálculo e pedido) | CA10 |
| [BUG-03](#bug-03) | Cupom expirado restaurado da sessão aparece como "aplicado" no carrinho | Baixa | Média | Interface (carrinho) | CA04 |

Critério de severidade: **Alta** = regra de negócio da entrega quebrada, com impacto financeiro ou em pedido real; **Média** = funciona com contorno; **Baixa** = impacto pequeno ou só em situação menos comum.

---

## BUG-01

**Frete de R$ 19,90 cobrado quando o subtotal é exatamente R$ 200,00**

| | |
|---|---|
| **Severidade / Prioridade** | Alta / Alta |
| **Componente** | API `POST /api/carrinho/calcular` e `POST /api/pedidos` (a interface exibe o que a API devolve) |
| **Critério violado** | CA06: "O frete é grátis para compras com subtotal a partir de R$ 200,00, **inclusive**." Regras de cálculo: "Frete R$ 0,00 quando o subtotal é **igual ou maior** que R$ 200,00." |
| **Ambiente** | Produção do teste, v2.3.0, Chromium e API, 06/10/2026 |
| **Reprodutível** | Sempre (testado com 2× Mochila, 4× Garrafa e Mochila + 2× Garrafa) |

**Passos para reproduzir (interface)**
1. Acessar a loja e adicionar **2× "Mochila Urbana 20L"** (R$ 100,00 cada).
2. Abrir o carrinho.

**Resultado esperado**
- Subtotal R$ 200,00 · Frete **Grátis** · Total **R$ 200,00** · sem aviso de "Faltam ...".

**Resultado obtido**
- Subtotal R$ 200,00 · Frete **R$ 19,90** · Total **R$ 219,90** · aviso **"Faltam R$ 0,00 para o frete grátis."**

**Passos para reproduzir (API)**
```http
POST /api/carrinho/calcular
{ "itens": [ { "produtoId": "P005", "quantidade": 2 } ] }
```
Resposta obtida (200):
```json
{ "subtotal": 200, "desconto": 0, "frete": 19.9, "freteGratis": false, "valorFaltanteFreteGratis": 0, "total": 219.9 }
```
O `POST /api/pedidos` com o mesmo carrinho (ou 4× P008) cria o pedido com `frete: 19.9` e `total: 219.9`.

**Observações**
- A própria resposta se contradiz: `valorFaltanteFreteGratis: 0` com `freteGratis: false`.
- R$ 199,90 → frete cobrado (correto) e R$ 200,10+ → grátis (correto). Só o valor exato do limite falha, o que sugere a comparação `subtotal > 200` em vez de `subtotal >= 200`.
- Impacto: o cliente que monta o carrinho para chegar ao valor do banner ("Frete grátis a partir de R$ 200,00") paga R$ 19,90 a mais.

**Evidências**
- [Carrinho com R$ 200,00 cobrando frete](../evidencias/screenshots/CT14-BUG01-subtotal-200_00-frete-cobrado.png)
- [API cálculo (2× P005)](../evidencias/api/CT14-BUG01-calcular-subtotal-200_00.json) · [API cálculo (P005 + 2× P008)](../evidencias/api/CT14-BUG01-calcular-subtotal-200_00-combinado.json) · [API pedido (4× P008)](../evidencias/api/CT14-BUG01-pedido-subtotal-200_00.json)
- Testes automatizados: `tests/api/frete.api.spec.ts` (CT14) e `tests/e2e/frete-e-quantidade.spec.ts` (CT14)

---

## BUG-02

**API aceita mais de 5 unidades do mesmo produto**

| | |
|---|---|
| **Severidade / Prioridade** | Alta / Alta |
| **Componente** | API `POST /api/carrinho/calcular` e `POST /api/pedidos` |
| **Critério violado** | CA10: "Cada produto pode ter no máximo 5 unidades por pedido. A regra vale para a interface **e para a API**." Códigos de erro: `422 QUANTIDADE_MAXIMA_EXCEDIDA`, "A quantidade de um produto é maior que 5." |
| **Reprodutível** | Sempre (testado com 6, 8 e 10 unidades) |

**Passos para reproduzir**
```http
POST /api/pedidos
{
  "cliente": { "nome": "Maria Silva", "email": "maria@exemplo.com", "cep": "01310-100" },
  "itens": [ { "produtoId": "P001", "quantidade": 6 } ]
}
```

**Resultado esperado**
`422` com `{ "erro": { "codigo": "QUANTIDADE_MAXIMA_EXCEDIDA", "campo": "itens[0].quantidade", ... } }`

**Resultado obtido**
`201 Created`: pedido `VZ-xxxxxx` com `quantidade: 6`, `total: 359.4`. O `/api/carrinho/calcular` também responde 200 calculando as 6 unidades. O código `QUANTIDADE_MAXIMA_EXCEDIDA` nunca é devolvido.

**Pela interface (exploratório EX01)**
A interface bloqueia a 6ª unidade nos botões (CT21/CT22 passaram), mas o limite só existe no front. Com o carrinho da sessão alterado para 8 unidades (`sessionStorage["verzel-store:itens"] = [{"produtoId":"P001","quantidade":8}]`):
1. O carrinho mostra o aviso "Limite de 5 unidades por produto." e **mesmo assim mantém "Finalizar compra" ativo**.
2. Ao confirmar, o pedido é criado com **8× Camiseta Essencial**, total R$ 479,20.

**Impacto**
Qualquer cliente da API (ou alguém que altere o front) cria pedidos acima do limite da regra de negócio. Sugestão: validar na API e bloquear o "Finalizar compra" quando o próprio carrinho mostra o aviso de limite.

**Evidências**
- [API cálculo com 6](../evidencias/api/CT23-BUG02-calcular-quantidade-6.json) · [API pedido com 6](../evidencias/api/CT24-BUG02-pedido-quantidade-6.json)
- [Carrinho com 8 unidades e "Finalizar compra" ativo](../evidencias/screenshots/EX01-BUG02-carrinho-com-8-unidades.png) · [Pedido confirmado com 8 unidades](../evidencias/screenshots/EX01-BUG02-pedido-confirmado-com-8-unidades.png)
- Testes automatizados: `tests/api/validacoes.api.spec.ts` (CT23, CT24)

---

## BUG-03

**Cupom expirado restaurado da sessão aparece como "aplicado" no carrinho**

| | |
|---|---|
| **Severidade / Prioridade** | Baixa / Média |
| **Componente** | Interface: carrinho (`/carrinho`) |
| **Critério relacionado** | CA04: cupom fora da validade exibe "Cupom expirado." e nenhum desconto é aplicado |
| **Reprodutível** | Sempre, com o cupom já guardado na sessão |

**Contexto**
O cupom fica salvo no `sessionStorage` (`verzel-store:cupom`) e é reenviado à API a cada recálculo. Um caso real: o cliente aplica um cupom válido e ele expira enquanto o carrinho está aberto. Para reproduzir hoje, basta gravar um cupom expirado na sessão.

**Passos para reproduzir**
1. Adicionar 1× "Camiseta Essencial" ao carrinho.
2. No DevTools, executar `sessionStorage.setItem('verzel-store:cupom', '"VERAO2026"')` e recarregar `/carrinho`.
3. Observar o bloco de cupom e o resumo.
4. Clicar em "Finalizar compra", preencher dados válidos e confirmar.

**Resultado esperado**
O carrinho usa a resposta da API (`cupom.aplicado: false`, `mensagem: "Cupom expirado."`): mostra "Cupom expirado." e volta o campo de cupom.

**Resultado obtido**
- O carrinho exibe **"Cupom VERAO2026 aplicado."** com o botão "Remover cupom", mas o desconto é R$ 0,00 (a API respondeu `aplicado: false`).
- No checkout o pedido é recusado com "Cupom expirado." (422 `CUPOM_EXPIRADO`), e na tela de checkout não há como remover o cupom: o cliente precisa voltar ao carrinho sem saber o motivo.

**Evidências**
- [Carrinho com "Cupom VERAO2026 aplicado." e desconto R$ 0,00](../evidencias/screenshots/EX02-BUG03-cupom-expirado-exibido-como-aplicado.png)
- [Checkout recusando o pedido](../evidencias/screenshots/EX02-BUG03-checkout-recusa-cupom-expirado.png)
- Teste automatizado: `tests/e2e/cupom.spec.ts` (EX02)

---

## Melhorias sugeridas (não são bugs)

- **Duas chamadas ao aplicar o cupom:** ao aplicar `"  bemvindo10 "`, a interface chama `/carrinho/calcular` primeiro com o texto digitado e logo depois com `BEMVINDO10`. O resultado está certo, mas a segunda chamada sobra.
- **Banner "na primeira compra":** a home diz que o BEMVINDO10 vale "na primeira compra", mas a documentação não tem essa regra e o ambiente não guarda pedidos. Vale alinhar o texto com o PO (ver [ambiguidades](01-estrategia-e-ambiguidades.md)).
