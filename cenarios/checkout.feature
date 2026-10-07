# language: pt
@checkout
Funcionalidade: Checkout e confirmação do pedido
  Regras que já existiam: nome e sobrenome, e-mail válido, CEP com 8 dígitos
  (com ou sem hífen), pagamento na entrega.

  Contexto:
    Dado que tenho 1 "Mochila Urbana 20L" no carrinho
    E estou na página "Finalizar compra"

  @CT37 @automatizado
  Cenário: Campos obrigatórios vazios
    Quando clico em "Confirmar pedido" sem preencher nada
    Então vejo "Informe o nome completo.", "Informe o e-mail." e "Informe o CEP."
    E nenhum pedido é enviado para a API

  @CT38 @CT39 @CT40 @automatizado
  Esquema do Cenário: Dados do cliente inválidos
    Quando informo nome "<nome>", e-mail "<email>" e CEP "<cep>"
    E clico em "Confirmar pedido"
    Então vejo a mensagem "<mensagem>"

    Exemplos:
      | nome        | email             | cep        | mensagem                       |
      | Maria       | maria@exemplo.com | 01310-100  | Informe nome e sobrenome.      |
      | Maria Silva | maria@exemplo     | 01310-100  | Informe um e-mail válido.      |
      | Maria Silva | maria@exemplo.com | 0131010    | Informe um CEP com 8 dígitos.  |
      | Maria Silva | maria@exemplo.com | 013101000  | Informe um CEP com 8 dígitos.  |
      | Maria Silva | maria@exemplo.com | 0131A-100  | Informe um CEP com 8 dígitos.  |

  @CT40
  Esquema do Cenário: CEP aceito com ou sem hífen
    Quando confirmo o pedido com CEP "<cep>"
    Então o pedido é confirmado com o CEP "01310100"

    Exemplos:
      | cep       |
      | 01310-100 |
      | 01310100  |

  @CT41 @automatizado
  Cenário: Pedido confirmado
    Dado que apliquei o cupom "BEMVINDO10"
    Quando confirmo o pedido com dados válidos
    Então vejo "Pedido confirmado" e o número no formato "VZ-000000"
    E o resumo mostra desconto "- R$ 10,00" e total "R$ 109,90"
    E o carrinho fica vazio

  @CT42 @api @automatizado
  Cenário: API detalha os campos inválidos do cliente
    Quando envio POST /api/pedidos com nome "Maria", e-mail "maria@" e CEP "0131010"
    Então recebo status 422 com o código "DADOS_INVALIDOS"
    E "campos" lista "cliente.nome", "cliente.email" e "cliente.cep"
