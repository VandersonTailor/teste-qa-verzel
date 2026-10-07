import { expect, type Page } from '@playwright/test';
import { PRODUTOS, type ProdutoId } from './dados';

/** Ações e elementos da Verzel Store usados pelos testes de interface. */
export class Loja {
  constructor(readonly page: Page) {}

  // ---------- vitrine ----------
  async abrirVitrine() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'Produtos' })).toBeVisible();
  }

  card(id: ProdutoId) {
    return this.page.getByRole('article', { name: PRODUTOS[id].nome });
  }

  async adicionar(id: ProdutoId, vezes = 1) {
    for (let i = 1; i <= vezes; i++) {
      await this.card(id).getByRole('button', { name: 'Adicionar ao carrinho' }).click();
      await expect(this.page.locator(`#aviso-${id}`)).toContainText(i < 5 ? `${i} no carrinho` : 'Limite');
    }
  }

  // ---------- carrinho ----------
  async abrirCarrinho() {
    await this.page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: /Carrinho/ }).click();
    await expect(this.page.getByRole('heading', { name: 'Carrinho', level: 1 })).toBeVisible();
    await this.aguardarCalculo();
  }

  /** Espera o resumo terminar de recalcular (a coluna usa aria-busy). */
  async aguardarCalculo() {
    await expect(this.page.locator('.coluna-resumo')).toHaveAttribute('aria-busy', 'false');
  }

  botaoAumentar(id: ProdutoId) {
    return this.page.getByRole('button', { name: `Aumentar quantidade de ${PRODUTOS[id].nome}` });
  }

  async aplicarCupom(codigo: string) {
    await this.page.getByLabel('Cupom de desconto').fill(codigo);
    await this.page.getByRole('button', { name: 'Aplicar cupom' }).click();
    await this.aguardarCalculo();
  }

  get mensagemCupom() {
    return this.page.locator('#mensagem-cupom');
  }

  valor(campo: 'subtotal' | 'desconto' | 'frete' | 'total') {
    return this.page.locator(`dd[data-valor="${campo}"]`);
  }

  get avisoFrete() {
    return this.page.locator('.aviso-frete');
  }

  // ---------- checkout ----------
  async irParaCheckout() {
    await this.page.getByRole('link', { name: 'Finalizar compra' }).click();
    await expect(this.page.getByRole('heading', { name: 'Finalizar compra' })).toBeVisible();
  }

  async preencherCheckout(dados: { nome: string; email: string; cep: string }) {
    await this.page.getByLabel('Nome completo').fill(dados.nome);
    await this.page.getByLabel('E-mail').fill(dados.email);
    await this.page.getByLabel('CEP').fill(dados.cep);
    await this.page.getByRole('button', { name: 'Confirmar pedido' }).click();
  }
}
