import { test, expect } from '@playwright/test';
import { Loja } from '../support/loja';

test.describe('UI | Cupom de desconto no carrinho', () => {
  let loja: Loja;

  test.beforeEach(async ({ page }) => {
    loja = new Loja(page);
    await loja.abrirVitrine();
    await loja.adicionar('P002'); // R$ 139,90
    await loja.abrirCarrinho();
  });

  test('CT01/CT02/CT03 - cupom em minúsculas e com espaços aplica 10% de desconto @CA01 @CA02', async ({ page }) => {
    await loja.aplicarCupom('  bemvindo10 ');

    await expect(page.getByText('Cupom BEMVINDO10 aplicado.')).toBeVisible();
    await expect(loja.valor('subtotal')).toHaveText('R$ 139,90');
    await expect(loja.valor('desconto')).toHaveText('- R$ 13,99');
    await expect(loja.valor('frete')).toHaveText('R$ 19,90');
    await expect(loja.valor('total')).toHaveText('R$ 145,81');
  });

  test('CT04 - cupom inexistente exibe "Cupom inválido." sem desconto @CA03', async () => {
    await loja.aplicarCupom('XPTO');
    await expect(loja.mensagemCupom).toHaveText('Cupom inválido.');
    await expect(loja.valor('desconto')).toHaveText('R$ 0,00');
    await expect(loja.valor('total')).toHaveText('R$ 159,80');
  });

  test('CT05 - cupom expirado exibe "Cupom expirado." sem desconto @CA04', async () => {
    await loja.aplicarCupom('VERAO2026');
    await expect(loja.mensagemCupom).toHaveText('Cupom expirado.');
    await expect(loja.valor('desconto')).toHaveText('R$ 0,00');
    await expect(loja.valor('total')).toHaveText('R$ 159,80');
  });

  test('CT07/CT08 - só um cupom por vez; removendo, o desconto sai e o campo volta @CA05', async ({ page }) => {
    await loja.aplicarCupom('BEMVINDO10');
    // Com um cupom aplicado não existe campo para aplicar outro
    await expect(page.getByLabel('Cupom de desconto')).toHaveCount(0);

    await page.getByRole('button', { name: 'Remover cupom' }).click();
    await loja.aguardarCalculo();
    await expect(loja.valor('desconto')).toHaveText('R$ 0,00');
    await expect(page.getByLabel('Cupom de desconto')).toBeVisible();
  });

  test('EX02 - cupom expirado guardado na sessão não pode aparecer como aplicado', async ({ page }) => {
    test.fail(true, 'BUG-03: interface exibe "Cupom VERAO2026 aplicado." mesmo com a API respondendo aplicado=false');
    await page.evaluate(() => sessionStorage.setItem('verzel-store:cupom', JSON.stringify('VERAO2026')));
    await page.reload();
    await loja.aguardarCalculo();

    await expect(loja.valor('desconto')).toHaveText('R$ 0,00');
    await expect(page.getByText(/Cupom VERAO2026 aplicado/)).toHaveCount(0, { timeout: 3_000 });
  });
});
