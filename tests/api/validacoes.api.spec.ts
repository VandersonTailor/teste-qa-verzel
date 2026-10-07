import { test, expect } from '@playwright/test';
import { calcular, criarPedido } from '../support/api';
import { CLIENTE_VALIDO, PRODUTOS } from '../support/dados';

test.describe('API | Quantidade por produto', () => {
  test('CT25 - 5 unidades do mesmo produto são aceitas @CA10', async ({ request }) => {
    const res = await calcular(request, [{ produtoId: 'P001', quantidade: 5 }]);
    expect(res.status()).toBe(200);
    expect((await res.json()).subtotal).toBe(299.5);
  });

  test('CT23 - /carrinho/calcular rejeita 6 unidades com QUANTIDADE_MAXIMA_EXCEDIDA @CA10', async ({ request }) => {
    test.fail(true, 'BUG-02: API aceita mais de 5 unidades por produto');
    const res = await calcular(request, [{ produtoId: 'P001', quantidade: 6 }]);
    expect(res.status()).toBe(422);
    expect((await res.json()).erro).toMatchObject({ codigo: 'QUANTIDADE_MAXIMA_EXCEDIDA', campo: 'itens[0].quantidade' });
  });

  test('CT24 - /pedidos rejeita 6 unidades com QUANTIDADE_MAXIMA_EXCEDIDA @CA10', async ({ request }) => {
    test.fail(true, 'BUG-02: API aceita mais de 5 unidades por produto');
    const res = await criarPedido(request, CLIENTE_VALIDO, [{ produtoId: 'P001', quantidade: 6 }]);
    expect(res.status()).toBe(422);
    expect((await res.json()).erro.codigo).toBe('QUANTIDADE_MAXIMA_EXCEDIDA');
  });

  for (const quantidade of [0, -1, 1.5, '2', null]) {
    test(`CT26 - quantidade ${JSON.stringify(quantidade)} retorna QUANTIDADE_INVALIDA`, async ({ request }) => {
      const res = await calcular(request, [{ produtoId: 'P001', quantidade }]);
      expect(res.status()).toBe(422);
      expect((await res.json()).erro).toMatchObject({ codigo: 'QUANTIDADE_INVALIDA', campo: 'itens[0].quantidade' });
    });
  }
});

test.describe('API | Códigos de erro e produtos', () => {
  test('CT29 - corpo que não é objeto JSON retorna 400 JSON_INVALIDO', async ({ request }) => {
    for (const corpo of ['abc', '[1,2]']) {
      const res = await request.post('/api/carrinho/calcular', { data: corpo });
      expect(res.status()).toBe(400);
      expect((await res.json()).erro.codigo).toBe('JSON_INVALIDO');
    }
  });

  test('CT30 - rota inexistente retorna 404 ROTA_NAO_ENCONTRADA', async ({ request }) => {
    const res = await request.get('/api/xyz');
    expect(res.status()).toBe(404);
    expect((await res.json()).erro.codigo).toBe('ROTA_NAO_ENCONTRADA');
  });

  test('CT31 - método não aceito retorna 405 METODO_NAO_PERMITIDO', async ({ request }) => {
    const res = await request.get('/api/carrinho/calcular');
    expect(res.status()).toBe(405);
    expect((await res.json()).erro.codigo).toBe('METODO_NAO_PERMITIDO');
  });

  const errosItens = [
    { caso: 'CT32 - itens vazio', itens: [], codigo: 'ITENS_OBRIGATORIOS' },
    { caso: 'CT33 - item que não é objeto', itens: ['P001'], codigo: 'ITEM_INVALIDO' },
    { caso: 'CT34 - produto inexistente', itens: [{ produtoId: 'P999', quantidade: 1 }], codigo: 'PRODUTO_NAO_ENCONTRADO' },
    { caso: 'CT35 - produto duplicado', itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }], codigo: 'ITEM_DUPLICADO' },
  ];
  for (const e of errosItens) {
    test(`${e.caso} retorna 422 ${e.codigo}`, async ({ request }) => {
      const res = await request.post('/api/carrinho/calcular', { data: { itens: e.itens } });
      expect(res.status()).toBe(422);
      expect((await res.json()).erro.codigo).toBe(e.codigo);
    });
  }

  test('CT34 - GET de produto inexistente retorna 404 PRODUTO_NAO_ENCONTRADO', async ({ request }) => {
    const res = await request.get('/api/produtos/P999');
    expect(res.status()).toBe(404);
    expect((await res.json()).erro.codigo).toBe('PRODUTO_NAO_ENCONTRADO');
  });

  test('CT36 - lista os 8 produtos com os preços da documentação', async ({ request }) => {
    const res = await request.get('/api/produtos');
    expect(res.status()).toBe(200);
    const lista: { id: string; nome: string; preco: number }[] = await res.json();
    expect(lista.map(({ id, nome, preco }) => ({ id, nome, preco }))).toEqual(
      Object.entries(PRODUTOS).map(([id, p]) => ({ id, nome: p.nome, preco: p.preco })),
    );
  });
});

test.describe('API | Pedido', () => {
  test('CT41 - pedido válido retorna 201 com número VZ-000000 e resumo de valores', async ({ request }) => {
    const res = await criarPedido(request, CLIENTE_VALIDO, [{ produtoId: 'P005', quantidade: 1 }], 'BEMVINDO10');
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.numero).toMatch(/^VZ-\d{6}$/);
    expect(body.cliente.cep).toBe('01310100');
    expect(body).toMatchObject({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
  });

  test('CT42 - dados do cliente inválidos retornam 422 DADOS_INVALIDOS com detalhes por campo', async ({ request }) => {
    const res = await criarPedido(request, { nome: 'Maria', email: 'maria@', cep: '0131010' }, [{ produtoId: 'P001', quantidade: 1 }]);
    expect(res.status()).toBe(422);
    const { erro } = await res.json();
    expect(erro.codigo).toBe('DADOS_INVALIDOS');
    expect(erro.campos.map((c: { campo: string }) => c.campo).sort()).toEqual(['cliente.cep', 'cliente.email', 'cliente.nome']);
  });
});
