# language: pt
@api
Funcionalidade: Contrato de erros da API

  @CT29 @automatizado
  Cenário: Corpo que não é um objeto JSON
    Quando envio "abc" ou "[1,2]" para POST /api/carrinho/calcular
    Então recebo status 400 com o código "JSON_INVALIDO"

  @CT30 @automatizado
  Cenário: Rota inexistente
    Quando envio GET /api/xyz
    Então recebo status 404 com o código "ROTA_NAO_ENCONTRADA"

  @CT31 @automatizado
  Cenário: Método não permitido
    Quando envio GET /api/carrinho/calcular
    Então recebo status 405 com o código "METODO_NAO_PERMITIDO"

  @CT32 @CT33 @CT34 @CT35 @automatizado
  Esquema do Cenário: Itens inválidos
    Quando envio POST /api/carrinho/calcular com itens <itens>
    Então recebo status 422 com o código "<codigo>"

    Exemplos:
      | itens                                                                   | codigo                 |
      | []                                                                      | ITENS_OBRIGATORIOS     |
      | ["P001"]                                                                | ITEM_INVALIDO          |
      | [{"produtoId":"P999","quantidade":1}]                                   | PRODUTO_NAO_ENCONTRADO |
      | [{"produtoId":"P001","quantidade":1},{"produtoId":"P001","quantidade":1}] | ITEM_DUPLICADO       |

  @CT36 @automatizado
  Cenário: Catálogo de produtos
    Quando envio GET /api/produtos
    Então recebo os 8 produtos com os ids, nomes e preços da documentação
