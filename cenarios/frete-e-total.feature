# language: pt
@VZS-142 @frete
Funcionalidade: Frete grátis e cálculo do total
  Regra: total = subtotal - desconto + frete
  Frete grátis a partir de R$ 200,00 (inclusive) de subtotal, antes do desconto.
  Abaixo disso, frete fixo de R$ 19,90 e aviso de quanto falta.

  @CT13 @CT14 @CT15 @CA06 @CA07 @automatizado
  Esquema do Cenário: Valor limite do frete grátis
    Dado que tenho no carrinho itens que somam "<subtotal>"
    Quando vejo o resumo do pedido
    Então o frete é "<frete>"
    E o total é "<total>"
    E o aviso de frete é "<aviso>"

    Exemplos:
      | caso | subtotal   | frete    | total      | aviso                                  |
      | CT13 | R$ 199,90  | R$ 19,90 | R$ 219,80  | Faltam R$ 0,10 para o frete grátis.    |
      | CT14 | R$ 200,00  | Grátis   | R$ 200,00  | (sem aviso)                            |
      | CT15 | R$ 219,80  | Grátis   | R$ 219,80  | (sem aviso)                            |

  @CT16 @CA07
  Cenário: Carrinho informa quanto falta para o frete grátis
    Dado que tenho 1 "Calça Jeans Slim" no carrinho
    Então vejo "Faltam R$ 60,10 para o frete grátis."

  @CT17 @CA06
  Cenário: Aviso some ao atingir o frete grátis
    Dado que tenho 1 "Tênis Casual Urbano" no carrinho
    E vejo "Faltam R$ 10,10 para o frete grátis."
    Quando aumento a quantidade para 2
    Então o frete é "Grátis"
    E o aviso de quanto falta não é exibido

  @CT18 @CA08 @automatizado
  Cenário: Frete grátis considera o subtotal antes do desconto
    Dado que tenho 1 "Tênis Casual Urbano" e 1 "Kit 3 Pares de Meias" no carrinho
    Quando aplico o cupom "BEMVINDO10"
    Então o desconto é "- R$ 21,98"
    E o frete continua "Grátis"
    E o total é "R$ 197,82"

  @CT19 @CA08
  Cenário: Desconto não faz um carrinho abaixo de R$ 200,00 ganhar frete
    Dado que tenho 1 "Tênis Casual Urbano" no carrinho
    Quando aplico o cupom "BEMVINDO10"
    Então o frete continua "R$ 19,90"
    E o aviso continua "Faltam R$ 10,10 para o frete grátis."

  @CT20 @CA09 @automatizado
  Cenário: Desconto não incide sobre o frete
    Dado que tenho 1 "Mochila Urbana 20L" no carrinho
    Quando aplico o cupom "BEMVINDO10"
    Então o desconto é "- R$ 10,00"
    E o frete é "R$ 19,90"
    E o total é "R$ 109,90"

  @CT27 @CA11 @api @automatizado
  Cenário: Valores arredondados para 2 casas decimais
    Quando calculo 5 "Mochila Urbana 20L" e 5 "Jaqueta Corta-Vento" com o cupom "BEMVINDO10"
    Então subtotal, desconto, frete, total e faltante têm no máximo 2 casas decimais
    E o desconto é 164.95 e o total é 1484.55

  @CT28 @api @automatizado
  Cenário: Total de um carrinho com vários itens
    Quando calculo 1 "Camiseta Essencial", 1 "Boné Aba Curva" e 1 "Kit 3 Pares de Meias" com o cupom "BEMVINDO10"
    Então subtotal é 139.7, desconto 13.97, frete 19.9, faltante 60.3 e total 145.63
