# language: pt
@VZS-142 @cupom
Funcionalidade: Cupom de desconto no carrinho
  Como cliente da Verzel Store
  Quero aplicar um cupom de desconto
  Para pagar menos nas minhas compras

  Contexto:
    Dado que estou na Verzel Store com o carrinho vazio

  @CT01 @CA01 @automatizado
  Cenário: Cupom BEMVINDO10 aplica 10% sobre o subtotal
    Dado que adicionei 1 "Calça Jeans Slim" e 2 "Boné Aba Curva" ao carrinho
    Quando aplico o cupom "BEMVINDO10"
    Então vejo a mensagem "Cupom BEMVINDO10 aplicado."
    E o subtotal é "R$ 239,70"
    E o desconto é "- R$ 23,97"
    E o total é "R$ 215,73"

  @CT02 @CT03 @CA02 @automatizado
  Esquema do Cenário: Código do cupom ignora maiúsculas/minúsculas e espaços nas pontas
    Dado que adicionei 1 "Mochila Urbana 20L" ao carrinho
    Quando aplico o cupom "<digitado>"
    Então o cupom "BEMVINDO10" é aplicado
    E o desconto é "- R$ 10,00"

    Exemplos:
      | digitado         |
      | bemvindo10       |
      | BemVindo10       |
      |   BEMVINDO10     |
      |   bemvindo10     |

  @CT04 @CA03 @automatizado
  Cenário: Cupom inexistente
    Dado que adicionei 1 "Calça Jeans Slim" ao carrinho
    Quando aplico o cupom "XPTO"
    Então vejo a mensagem "Cupom inválido."
    E o desconto é "R$ 0,00"
    E o total é "R$ 159,80"

  @CT05 @CA04 @automatizado
  Cenário: Cupom fora da validade
    Dado que adicionei 1 "Calça Jeans Slim" ao carrinho
    Quando aplico o cupom "VERAO2026"
    Então vejo a mensagem "Cupom expirado."
    E o desconto é "R$ 0,00"

  @CT06
  Cenário: Tentar aplicar cupom com o campo vazio
    Dado que adicionei 1 "Calça Jeans Slim" ao carrinho
    Quando clico em "Aplicar cupom" sem digitar nada
    Então vejo a mensagem "Informe um cupom."
    E nenhuma requisição de cálculo com cupom é feita

  @CT07 @CA05 @automatizado
  Cenário: Apenas um cupom por vez
    Dado que apliquei o cupom "BEMVINDO10"
    Então o campo de cupom não fica mais disponível
    E vejo a opção "Remover cupom"

  @CT08 @CA05 @automatizado
  Cenário: Remover o cupom aplicado e aplicar outro
    Dado que apliquei o cupom "BEMVINDO10"
    Quando clico em "Remover cupom"
    Então o desconto volta a ser "R$ 0,00"
    E o campo de cupom volta a ser exibido
    E posso aplicar outro cupom

  @CT09
  Cenário: Cupom aplicado continua após recarregar a página
    Dado que apliquei o cupom "BEMVINDO10"
    Quando recarrego a página do carrinho
    Então o cupom "BEMVINDO10" continua aplicado com o mesmo desconto

  @CT10 @api @automatizado
  Cenário: Pedido com cupom inexistente é recusado pela API
    Quando envio POST /api/pedidos com o cupom "XPTO"
    Então recebo status 422 com o código "CUPOM_INVALIDO"

  @CT11 @api @automatizado
  Cenário: Pedido com cupom expirado é recusado pela API
    Quando envio POST /api/pedidos com o cupom "VERAO2026"
    Então recebo status 422 com o código "CUPOM_EXPIRADO"

  @CT12 @api @automatizado
  Cenário: Cálculo com cupom inválido ou expirado não gera erro
    Quando envio POST /api/carrinho/calcular com o cupom "XPTO"
    Então recebo status 200
    E o desconto é 0
    E "cupom.aplicado" é false com a mensagem "Cupom inválido."

  @EX02 @exploratorio @bug @BUG-03 @automatizado
  Cenário: Cupom inválido salvo na sessão não pode ser exibido como aplicado
    Dado que o carrinho da sessão guarda o cupom "VERAO2026"
    Quando abro o carrinho
    Então não vejo "Cupom VERAO2026 aplicado."
    E vejo a mensagem "Cupom expirado."
