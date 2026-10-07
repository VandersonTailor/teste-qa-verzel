# language: pt
@VZS-142 @quantidade
Funcionalidade: Limite de 5 unidades por produto
  Cada produto pode ter no máximo 5 unidades por pedido, na interface e na API (CA10).

  @CT21 @CA10 @automatizado
  Cenário: Vitrine bloqueia a 6ª unidade
    Dado que adicionei 5 "Camiseta Essencial" pela vitrine
    Então vejo "Limite de 5 unidades atingido."
    E o botão "Adicionar ao carrinho" fica desabilitado

  @CT22 @CA10 @automatizado
  Cenário: Carrinho bloqueia a 6ª unidade
    Dado que tenho 5 "Camiseta Essencial" no carrinho
    Então o botão "+" fica desabilitado
    E a quantidade continua 5

  @CT23 @CA10 @api @automatizado
  Cenário: Cálculo do carrinho recusa mais de 5 unidades
    Quando envio POST /api/carrinho/calcular com 6 unidades de "P001"
    Então recebo status 422 com o código "QUANTIDADE_MAXIMA_EXCEDIDA"

  @CT24 @CA10 @api @automatizado
  Cenário: Pedido recusa mais de 5 unidades
    Quando envio POST /api/pedidos com 6 unidades de "P001"
    Então recebo status 422 com o código "QUANTIDADE_MAXIMA_EXCEDIDA"

  @CT25 @CA10 @api @automatizado
  Cenário: 5 unidades são aceitas
    Quando envio POST /api/carrinho/calcular com 5 unidades de "P001"
    Então recebo status 200 com subtotal 299.5

  @CT26 @api @automatizado
  Esquema do Cenário: Quantidade inválida
    Quando envio POST /api/carrinho/calcular com quantidade <quantidade>
    Então recebo status 422 com o código "QUANTIDADE_INVALIDA" no campo "itens[0].quantidade"

    Exemplos:
      | quantidade |
      | 0          |
      | -1         |
      | 1.5        |
      | "2"        |
      | null       |

  @EX01 @exploratorio @bug @BUG-02
  Cenário: Carrinho com mais de 5 unidades não pode virar pedido
    Dado que o carrinho da sessão tem 8 "Camiseta Essencial"
    Quando finalizo a compra com dados válidos
    Então o pedido é recusado com "QUANTIDADE_MAXIMA_EXCEDIDA"
