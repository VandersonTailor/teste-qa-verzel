export const PRODUTOS = {
  P001: { nome: 'Camiseta Essencial', preco: 59.9 },
  P002: { nome: 'Calça Jeans Slim', preco: 139.9 },
  P003: { nome: 'Tênis Casual Urbano', preco: 189.9 },
  P004: { nome: 'Boné Aba Curva', preco: 49.9 },
  P005: { nome: 'Mochila Urbana 20L', preco: 100 },
  P006: { nome: 'Kit 3 Pares de Meias', preco: 29.9 },
  P007: { nome: 'Jaqueta Corta-Vento', preco: 229.9 },
  P008: { nome: 'Garrafa Térmica 750ml', preco: 50 },
} as const;

export type ProdutoId = keyof typeof PRODUTOS;
export type Item = { produtoId: ProdutoId | string; quantidade: unknown };

export const CUPOM_VALIDO = 'BEMVINDO10';
export const CUPOM_EXPIRADO = 'VERAO2026';
export const FRETE_FIXO = 19.9;

export const CLIENTE_VALIDO = { nome: 'Maria Silva', email: 'maria@exemplo.com', cep: '01310-100' };

/** Formata como a loja exibe: "R$ 1.234,56" */
export const brl = (valor: number) =>
  'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
