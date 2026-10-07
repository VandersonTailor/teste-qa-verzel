import { test, expect } from '@playwright/test';
import { Loja } from '../support/loja';

test.describe('UI | Frete grátis', () => {
  test('CT13/CT16 - abaixo de R$ 200,00 cobra R$ 19,90 e informa quanto falta @CA07', async ({ page }) => {
    const loja = new Loja(page);
    await loja.abrirVitrine();
    await loja.adicionar('P004');
    await loja.adicionar('P005');
    await loja.adicionar('P008'); // 49,90 + 100,00 + 50,00 = 199,90
    await loja.abrirCarrinho();

    await expect(loja.valor('subtotal')).toHaveText('R$ 199,90');
    await expect(loja.valor('frete')).toHaveText('R$ 19,90');
    await expect(loja.valor('total')).toHaveText('R$ 219,80');
    await expect(loja.avisoFrete).toHaveText('Faltam R$ 0,10 para o frete grátis.');
  });

  test('CT14 - com subtotal exatamente R$ 200,00 o frete é grátis @CA06', async ({ page }) => {
    test.fail(true, 'BUG-01: frete de R$ 19,90 cobrado e aviso "Faltam R$ 0,00 para o frete grátis."');
    const loja = new Loja(page);
    await loja.abrirVitrine();
    await loja.adicionar('P005', 2); // 2 x 100,00
    await loja.abrirCarrinho();

    await expect(loja.valor('subtotal')).toHaveText('R$ 200,00');
    await expect(loja.valor('frete')).toHaveText('Grátis', { timeout: 3_000 });
    await expect(loja.valor('total')).toHaveText('R$ 200,00');
    await expect(loja.avisoFrete).toHaveCount(0);
  });

  test('CT15/CT17/CT18 - acima de R$ 200,00 o frete é grátis mesmo se o desconto deixar abaixo @CA06 @CA08', async ({ page }) => {
    const loja = new Loja(page);
    await loja.abrirVitrine();
    await loja.adicionar('P003');
    await loja.adicionar('P006'); // 189,90 + 29,90 = 219,80
    await loja.abrirCarrinho();

    await expect(loja.valor('frete')).toHaveText('Grátis');
    await expect(loja.avisoFrete).toHaveCount(0);

    await loja.aplicarCupom('BEMVINDO10');
    await expect(loja.valor('desconto')).toHaveText('- R$ 21,98');
    await expect(loja.valor('frete')).toHaveText('Grátis');
    await expect(loja.valor('total')).toHaveText('R$ 197,82');
  });
});

test.describe('UI | Limite de 5 unidades por produto', () => {
  test('CT21/CT22 - vitrine e carrinho bloqueiam a 6ª unidade @CA10', async ({ page }) => {
    const loja = new Loja(page);
    await loja.abrirVitrine();
    await loja.adicionar('P001', 5);

    await expect(page.locator('#aviso-P001')).toHaveText('Limite de 5 unidades atingido.');
    await expect(loja.card('P001').getByRole('button', { name: 'Adicionar ao carrinho' })).toBeDisabled();

    await loja.abrirCarrinho();
    await expect(page.getByRole('group', { name: 'Quantidade de Camiseta Essencial' }).locator('output')).toHaveText('5');
    await expect(loja.botaoAumentar('P001')).toBeDisabled();
    await expect(loja.valor('subtotal')).toHaveText('R$ 299,50');
  });
});
