import { test, expect } from '@playwright/test';
import { Loja } from '../support/loja';

test.describe('UI | Checkout', () => {
  let loja: Loja;

  test.beforeEach(async ({ page }) => {
    loja = new Loja(page);
    await loja.abrirVitrine();
    await loja.adicionar('P005');
    await loja.abrirCarrinho();
  });

  test('CT37 - campos obrigatórios vazios exibem mensagens e não enviam o pedido', async ({ page }) => {
    let pedidoEnviado = false;
    page.on('request', (r) => { if (r.url().endsWith('/api/pedidos')) pedidoEnviado = true; });

    await loja.irParaCheckout();
    await page.getByRole('button', { name: 'Confirmar pedido' }).click();

    await expect(page.getByText('Informe o nome completo.')).toBeVisible();
    await expect(page.getByText('Informe o e-mail.')).toBeVisible();
    await expect(page.getByText('Informe o CEP.')).toBeVisible();
    expect(pedidoEnviado).toBe(false);
  });

  test('CT38/CT39/CT40 - nome sem sobrenome, e-mail e CEP inválidos são rejeitados', async ({ page }) => {
    await loja.irParaCheckout();
    await loja.preencherCheckout({ nome: 'Maria', email: 'maria@exemplo', cep: '0131010' });

    await expect(page.getByText('Informe nome e sobrenome.')).toBeVisible();
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
    await expect(page.getByText('Informe um CEP com 8 dígitos.')).toBeVisible();
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test('CT41 - pedido com cupom é confirmado com os valores do carrinho e o carrinho é esvaziado', async ({ page }) => {
    await loja.aplicarCupom('BEMVINDO10');
    await loja.irParaCheckout();

    const resposta = page.waitForResponse((r) => r.url().endsWith('/api/pedidos'));
    await loja.preencherCheckout({ nome: 'Maria Silva', email: 'maria@exemplo.com', cep: '01310100' });
    const pedido = await (await resposta).json();

    await expect(page).toHaveURL(/\/pedido-confirmado$/);
    expect(pedido.numero).toMatch(/^VZ-\d{6}$/);
    await expect(page.getByText('Pedido confirmado')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Pedido ${pedido.numero}`);
    await expect(page.getByText('Obrigado, Maria.')).toBeVisible();
    await expect(loja.valor('desconto')).toHaveText('- R$ 10,00');
    await expect(loja.valor('total')).toHaveText('R$ 109,90');

    await page.goto('/carrinho');
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  });
});
