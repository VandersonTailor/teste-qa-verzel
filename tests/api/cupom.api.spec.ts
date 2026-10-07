import { test, expect } from '@playwright/test';
import { calcular, criarPedido } from '../support/api';
import { CLIENTE_VALIDO, CUPOM_EXPIRADO, CUPOM_VALIDO } from '../support/dados';

test.describe('API | Cupom de desconto', () => {
  test('CT01 - BEMVINDO10 aplica 10% sobre o subtotal @CA01', async ({ request }) => {
    const res = await calcular(request, [{ produtoId: 'P002', quantidade: 1 }, { produtoId: 'P004', quantidade: 2 }], CUPOM_VALIDO);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.subtotal).toBe(239.7);
    expect(body.desconto).toBe(23.97);
    expect(body.total).toBe(215.73);
    expect(body.cupom).toMatchObject({ codigo: 'BEMVINDO10', aplicado: true });
  });

  for (const variacao of ['bemvindo10', 'BemVindo10', '  BEMVINDO10  ', '\tbemvindo10 ']) {
    test(`CT02/CT03 - cupom "${variacao}" é normalizado e aplicado @CA02`, async ({ request }) => {
      const body = await (await calcular(request, [{ produtoId: 'P005', quantidade: 1 }], variacao)).json();
      expect(body.cupom).toMatchObject({ codigo: 'BEMVINDO10', aplicado: true });
      expect(body.desconto).toBe(10);
    });
  }

  test('CT04/CT12 - cupom inexistente responde 200 sem desconto e mensagem "Cupom inválido." @CA03', async ({ request }) => {
    const res = await calcular(request, [{ produtoId: 'P005', quantidade: 1 }], 'XPTO');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.desconto).toBe(0);
    expect(body.cupom).toMatchObject({ aplicado: false, mensagem: 'Cupom inválido.' });
  });

  test('CT05/CT12 - cupom expirado responde 200 sem desconto e mensagem "Cupom expirado." @CA04', async ({ request }) => {
    const body = await (await calcular(request, [{ produtoId: 'P005', quantidade: 1 }], CUPOM_EXPIRADO)).json();
    expect(body.desconto).toBe(0);
    expect(body.total).toBe(119.9);
    expect(body.cupom).toMatchObject({ aplicado: false, mensagem: 'Cupom expirado.' });
  });

  test('CT10 - pedido com cupom inexistente retorna 422 CUPOM_INVALIDO', async ({ request }) => {
    const res = await criarPedido(request, CLIENTE_VALIDO, [{ produtoId: 'P001', quantidade: 1 }], 'XPTO');
    expect(res.status()).toBe(422);
    expect((await res.json()).erro).toMatchObject({ codigo: 'CUPOM_INVALIDO', campo: 'cupom' });
  });

  test('CT11 - pedido com cupom expirado retorna 422 CUPOM_EXPIRADO', async ({ request }) => {
    const res = await criarPedido(request, CLIENTE_VALIDO, [{ produtoId: 'P001', quantidade: 1 }], CUPOM_EXPIRADO);
    expect(res.status()).toBe(422);
    expect((await res.json()).erro).toMatchObject({ codigo: 'CUPOM_EXPIRADO', campo: 'cupom' });
  });
});
