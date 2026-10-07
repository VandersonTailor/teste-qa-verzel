import { test, expect } from '@playwright/test';
import { calcular, criarPedido } from '../support/api';
import { CLIENTE_VALIDO, CUPOM_VALIDO, FRETE_FIXO, type Item } from '../support/dados';

test.describe('API | Frete grátis e cálculo do total', () => {
  // Análise de valor limite em torno de R$ 200,00 (CA06/CA07).
  const limites: { caso: string; itens: Item[]; subtotal: number; frete: number; faltante: number; bug?: string }[] = [
    { caso: 'CT13 - R$ 199,90 (abaixo)', itens: [{ produtoId: 'P004', quantidade: 1 }, { produtoId: 'P005', quantidade: 1 }, { produtoId: 'P008', quantidade: 1 }], subtotal: 199.9, frete: FRETE_FIXO, faltante: 0.1 },
    { caso: 'CT14 - R$ 200,00 (no limite)', itens: [{ produtoId: 'P005', quantidade: 2 }], subtotal: 200, frete: 0, faltante: 0, bug: 'BUG-01' },
    { caso: 'CT15 - R$ 219,80 (acima)', itens: [{ produtoId: 'P003', quantidade: 1 }, { produtoId: 'P006', quantidade: 1 }], subtotal: 219.8, frete: 0, faltante: 0 },
  ];

  for (const l of limites) {
    test(`${l.caso}: frete ${l.frete} e faltante ${l.faltante} @CA06 @CA07`, async ({ request }) => {
      if (l.bug) test.fail(true, `${l.bug}: frete cobrado com subtotal exatamente R$ 200,00`);
      const body = await (await calcular(request, l.itens)).json();
      expect(body.subtotal).toBe(l.subtotal);
      expect(body.frete).toBe(l.frete);
      expect(body.freteGratis).toBe(l.frete === 0);
      expect(body.valorFaltanteFreteGratis).toBe(l.faltante);
      expect(body.total).toBe(Math.round((l.subtotal + l.frete) * 100) / 100);
    });
  }

  test('CT14 - pedido com subtotal R$ 200,00 sai com frete grátis @CA06', async ({ request }) => {
    test.fail(true, 'BUG-01: /api/pedidos também cobra frete com subtotal exatamente R$ 200,00');
    const res = await criarPedido(request, CLIENTE_VALIDO, [{ produtoId: 'P008', quantidade: 4 }]);
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.frete).toBe(0);
    expect(body.total).toBe(200);
  });

  test('CT18 - frete grátis considera o subtotal antes do desconto @CA08', async ({ request }) => {
    // 219,80 - 10% = 197,82 -> continua com frete grátis
    const body = await (await calcular(request, [{ produtoId: 'P003', quantidade: 1 }, { produtoId: 'P006', quantidade: 1 }], CUPOM_VALIDO)).json();
    expect(body).toMatchObject({ subtotal: 219.8, desconto: 21.98, frete: 0, freteGratis: true, total: 197.82 });
  });

  test('CT20 - desconto do cupom não incide sobre o frete @CA09', async ({ request }) => {
    const body = await (await calcular(request, [{ produtoId: 'P005', quantidade: 1 }], CUPOM_VALIDO)).json();
    expect(body).toMatchObject({ subtotal: 100, desconto: 10, frete: FRETE_FIXO, total: 109.9 });
  });

  test('CT27 - valores arredondados para 2 casas decimais @CA11', async ({ request }) => {
    const body = await (await calcular(request, [{ produtoId: 'P005', quantidade: 5 }, { produtoId: 'P007', quantidade: 5 }], CUPOM_VALIDO)).json();
    expect(body).toMatchObject({ subtotal: 1649.5, desconto: 164.95, total: 1484.55 });
    for (const campo of ['subtotal', 'desconto', 'frete', 'total', 'valorFaltanteFreteGratis']) {
      const centavos = body[campo] * 100;
      expect(Math.abs(centavos - Math.round(centavos)), `${campo}=${body[campo]}`).toBeLessThan(1e-6);
    }
  });

  test('CT28 - total = subtotal - desconto + frete com vários itens', async ({ request }) => {
    const body = await (await calcular(request, [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P004', quantidade: 1 }, { produtoId: 'P006', quantidade: 1 }], CUPOM_VALIDO)).json();
    expect(body).toMatchObject({ subtotal: 139.7, desconto: 13.97, frete: 19.9, valorFaltanteFreteGratis: 60.3, total: 145.63 });
  });
});
