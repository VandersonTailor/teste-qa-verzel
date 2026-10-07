import type { APIRequestContext } from '@playwright/test';
import type { Item } from './dados';

export const calcular = (request: APIRequestContext, itens: Item[], cupom?: unknown) =>
  request.post('/api/carrinho/calcular', { data: cupom === undefined ? { itens } : { itens, cupom } });

export const criarPedido = (
  request: APIRequestContext,
  cliente: Record<string, unknown>,
  itens: Item[],
  cupom?: unknown,
) => request.post('/api/pedidos', { data: cupom === undefined ? { cliente, itens } : { cliente, itens, cupom } });
