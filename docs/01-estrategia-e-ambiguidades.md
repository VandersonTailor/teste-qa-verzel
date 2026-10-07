# Estratégia de teste, premissas e ambiguidades

## Escopo

**Dentro:** card VZS-142 (cupom de desconto e frete grátis), CA01 a CA11, as fórmulas de cálculo e as regras que já existiam e entram no fluxo (checkout: nome, e-mail, CEP), pela interface e pela API (`/api/produtos`, `/api/produtos/{id}`, `/api/carrinho/calcular`, `/api/pedidos`), incluindo a tabela de códigos de erro.

**Fora (pelas regras do teste e da documentação):** carga, estresse e segurança; login, cadastro, pagamento online e consulta de pedidos. O que a seção "Sobre este ambiente" descreve como simplificação **não** foi tratado como bug: carrinho por aba, pedidos não armazenados, número de pedido fictício, sem e-mail, sem estoque, API sem estado.

## Abordagem

1. **Leitura da documentação → cenários.** Cada critério de aceite virou ao menos um cenário em Gherkin ([`cenarios/`](../cenarios)), com ID `CTxx` e tag do CA.
2. **Técnicas usadas:**
   - **Valor limite** no frete (R$ 199,90 / 200,00 / 200,10+) e na quantidade (5 / 6; 0 / 1).
   - **Partição de equivalência** no cupom (válido, inexistente, expirado, vazio, variações de caixa e espaços) e nos dados do cliente.
   - **Tabela de decisão** para frete × cupom (CA08/CA09): subtotal ≥ 200 com e sem desconto, subtotal < 200 com e sem desconto.
   - **Teste de contrato da API** contra a tabela de códigos de erro.
3. **Execução manual** pela interface e pela API, com resultado por cenário em [02-execucao.md](02-execucao.md).
4. **Exploratório** guiado por charters (ver a seção no [02-execucao.md](02-execucao.md#testes-exploratórios)), principalmente "a interface confia nos próprios dados ou na API?".
5. **Automação com Playwright** dos cenários de maior risco/valor (UI e API). Os testes que expõem bugs ficam marcados com `test.fail()` e o ID do bug: a suíte fica verde enquanto o bug existe e **avisa quando ele for corrigido**, para a anotação ser removida.
6. **Evidências** geradas por script reproduzível (`npm run evidencias`).

## Massa de dados usada para as bordas

| Subtotal | Itens | Para que |
|---|---|---|
| R$ 199,90 | P004 + P005 + P008 | logo abaixo do limite |
| R$ 200,00 | 2× P005 · 4× P008 · P005 + 2× P008 | exatamente no limite |
| R$ 219,80 | P003 + P006 | acima; com cupom cai para R$ 197,82 (CA08) |
| R$ 189,90 | P003 | abaixo; com cupom continua pagando frete |
| R$ 1.649,50 | 5× P005 + 5× P007 | maior carrinho possível com 2 itens, para o arredondamento |

## Ambiguidades e como interpretei

| # | Ponto da documentação | Interpretação adotada |
|---|---|---|
| A1 | CA06 diz "a partir de R$ 200,00, inclusive" e a regra de cálculo diz "igual ou maior". | Exatamente R$ 200,00 tem frete grátis. Por isso o frete cobrado nesse valor foi reportado como [BUG-01](03-bugs.md#bug-01). |
| A2 | CA10 diz "no máximo 5 unidades por **pedido**". | Limite de 5 **por produto** (como diz o texto "cada produto") e não 5 itens no pedido. Um pedido com 5× P001 + 5× P002 é válido. |
| A3 | CA02 (sem diferenciar maiúsculas) fala do **cupom**. | Só vale para o cupom. IDs de produto continuam sensíveis a caixa (`p001` → `PRODUTO_NAO_ENCONTRADO`), o que é aceitável. |
| A4 | CA05, "apenas um cupom por vez": a API recebe `cupom` como texto. | Na interface o campo some depois de aplicar (OK). Na API, mandar uma lista ou `"BEMVINDO10 VERAO2026"` dá "Cupom inválido." sem desconto, o que cumpre a regra. |
| A5 | CA11, arredondamento: a documentação não diz o método (meio para cima, bancário...). | Como os preços têm 1 casa e o único cupom válido é de 10%, o desconto sempre tem no máximo 2 casas exatas. Verifiquei que nenhum campo sai com mais de 2 casas nem com erro de ponto flutuante (ex.: 179.70000000000002). O método de arredondamento não dá para testar com os dados disponíveis. |
| A6 | Cupom vazio ou só com espaços. | A interface mostra "Informe um cupom." e não chama a API. Na API, `""` / `"   "` contam como "sem cupom" (`cupom: null`) tanto no cálculo quanto no pedido (201). Considerei correto. |
| A7 | Banner da home: "na primeira compra, o cupom BEMVINDO10 dá 10%". | A documentação não tem a regra de "primeira compra" e o ambiente não guarda pedidos, então não dá para testar. Registrado como melhoria (alinhar o texto) e não como bug. |
| A8 | `valorFaltanteFreteGratis` quando há cupom. | Calculado sobre o subtotal **antes** do desconto, por coerência com o CA08. A API faz assim. |
| A9 | Cupom expirado/inválido no cálculo dá 200 e no pedido dá 422. | Comportamento documentado; testei os dois lados (CT10–CT12). |
