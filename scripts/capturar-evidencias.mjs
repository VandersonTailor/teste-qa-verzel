// Gera as evidências da execução manual/exploratória em ./evidencias
// Uso: npm run evidencias
import { chromium, request } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = 'https://verzel-store.qa-test-verzel-store.workers.dev';
const OUT = new URL('../evidencias/', import.meta.url);
const SHOTS = new URL('screenshots/', OUT);
const API = new URL('api/', OUT);
await mkdir(SHOTS, { recursive: true });
await mkdir(API, { recursive: true });

// ---------- API ----------
const api = await request.newContext({ baseURL: BASE });
const cliente = { nome: 'Maria Silva', email: 'maria@exemplo.com', cep: '01310-100' };
const chamadasApi = [
  ['CT01-calcular-cupom-valido', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P002', quantidade: 1 }, { produtoId: 'P004', quantidade: 2 }], cupom: 'BEMVINDO10' }],
  ['CT02-calcular-cupom-minusculo', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P005', quantidade: 1 }], cupom: 'bemvindo10' }],
  ['CT03-calcular-cupom-espacos', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P005', quantidade: 1 }], cupom: '  BEMVINDO10  ' }],
  ['CT04-calcular-cupom-inexistente', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P005', quantidade: 1 }], cupom: 'XPTO' }],
  ['CT05-calcular-cupom-expirado', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P005', quantidade: 1 }], cupom: 'VERAO2026' }],
  ['CT10-pedido-cupom-inexistente', 'POST', '/api/pedidos', { cliente, itens: [{ produtoId: 'P001', quantidade: 1 }], cupom: 'XPTO' }],
  ['CT11-pedido-cupom-expirado', 'POST', '/api/pedidos', { cliente, itens: [{ produtoId: 'P001', quantidade: 1 }], cupom: 'VERAO2026' }],
  ['CT13-calcular-subtotal-199_90', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P004', quantidade: 1 }, { produtoId: 'P005', quantidade: 1 }, { produtoId: 'P008', quantidade: 1 }] }],
  ['CT14-BUG01-calcular-subtotal-200_00', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P005', quantidade: 2 }] }],
  ['CT14-BUG01-calcular-subtotal-200_00-combinado', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P005', quantidade: 1 }, { produtoId: 'P008', quantidade: 2 }] }],
  ['CT14-BUG01-pedido-subtotal-200_00', 'POST', '/api/pedidos', { cliente, itens: [{ produtoId: 'P008', quantidade: 4 }] }],
  ['CT15-calcular-subtotal-219_80', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P003', quantidade: 1 }, { produtoId: 'P006', quantidade: 1 }] }],
  ['CT18-calcular-frete-antes-do-desconto', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P003', quantidade: 1 }, { produtoId: 'P006', quantidade: 1 }], cupom: 'BEMVINDO10' }],
  ['CT20-calcular-desconto-nao-incide-frete', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P005', quantidade: 1 }], cupom: 'BEMVINDO10' }],
  ['CT23-BUG02-calcular-quantidade-6', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P001', quantidade: 6 }] }],
  ['CT24-BUG02-pedido-quantidade-6', 'POST', '/api/pedidos', { cliente, itens: [{ produtoId: 'P001', quantidade: 6 }] }],
  ['CT25-calcular-quantidade-5', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P001', quantidade: 5 }] }],
  ['CT26-calcular-quantidade-0', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P001', quantidade: 0 }] }],
  ['CT26-calcular-quantidade-decimal', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P001', quantidade: 1.5 }] }],
  ['CT27-calcular-arredondamento', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P005', quantidade: 5 }, { produtoId: 'P007', quantidade: 5 }], cupom: 'BEMVINDO10' }],
  ['CT29-json-invalido', 'POST', '/api/carrinho/calcular', 'abc'],
  ['CT30-rota-inexistente', 'GET', '/api/xyz'],
  ['CT31-metodo-nao-permitido', 'DELETE', '/api/produtos'],
  ['CT32-itens-vazios', 'POST', '/api/carrinho/calcular', { itens: [] }],
  ['CT33-item-invalido', 'POST', '/api/carrinho/calcular', { itens: ['P001'] }],
  ['CT34-produto-inexistente-calcular', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P999', quantidade: 1 }] }],
  ['CT34-produto-inexistente-get', 'GET', '/api/produtos/P999'],
  ['CT35-item-duplicado', 'POST', '/api/carrinho/calcular', { itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }] }],
  ['CT36-listar-produtos', 'GET', '/api/produtos'],
  ['CT41-pedido-valido', 'POST', '/api/pedidos', { cliente, itens: [{ produtoId: 'P005', quantidade: 1 }], cupom: 'BEMVINDO10' }],
  ['CT42-pedido-dados-invalidos', 'POST', '/api/pedidos', { cliente: { nome: 'Maria', email: 'maria@', cep: '0131010' }, itens: [{ produtoId: 'P001', quantidade: 1 }] }],
];

for (const [nome, metodo, rota, corpo] of chamadasApi) {
  const opts = { headers: { 'Content-Type': 'application/json' } };
  if (corpo !== undefined) opts.data = typeof corpo === 'string' ? corpo : JSON.stringify(corpo);
  const res = await api.fetch(rota, { method: metodo, ...opts });
  const texto = await res.text();
  let resposta; try { resposta = JSON.parse(texto); } catch { resposta = texto; }
  const registro = { executadoEm: new Date().toISOString(), requisicao: { metodo, rota, corpo }, resposta: { status: res.status(), corpo: resposta } };
  await writeFile(new URL(`${nome}.json`, API), JSON.stringify(registro, null, 2) + '\n');
  console.log(`API  ${nome} -> ${res.status()}`);
}
await api.dispose();

// ---------- UI ----------
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const shot = async (nome) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: fileURLToPath(new URL(`${nome}.png`, SHOTS)), fullPage: true });
  console.log(`UI   ${nome}`);
};
const setCarrinho = async (itens, cupom = null) => {
  await page.goto(BASE + '/');
  await page.evaluate(([i, c]) => {
    sessionStorage.setItem('verzel-store:itens', JSON.stringify(i));
    sessionStorage.setItem('verzel-store:cupom', JSON.stringify(c));
  }, [itens, cupom]);
};
const aplicarCupom = async (codigo) => {
  await page.locator('#campo-cupom').fill(codigo);
  await page.getByRole('button', { name: 'Aplicar cupom' }).click();
};
const card = (nome) => page.getByRole('article', { name: nome });

// Vitrine
await page.goto(BASE + '/'); await shot('CT36-vitrine');

// Limite de 5 na vitrine
for (let i = 0; i < 5; i++) { await card('Camiseta Essencial').getByRole('button').click(); await page.waitForTimeout(300); }
await card('Camiseta Essencial').scrollIntoViewIfNeeded(); await shot('CT21-vitrine-limite-5-unidades');
await page.goto(BASE + '/carrinho'); await shot('CT22-carrinho-botao-mais-desabilitado-em-5');

// Cupons
await setCarrinho([{ produtoId: 'P002', quantidade: 1 }]);
await page.goto(BASE + '/carrinho');
await aplicarCupom('XPTO'); await shot('CT04-cupom-inexistente');
await aplicarCupom('VERAO2026'); await shot('CT05-cupom-expirado');
await aplicarCupom(''); await shot('CT06-cupom-vazio');
await aplicarCupom('  bemvindo10 '); await shot('CT01-CT02-CT03-cupom-valido-minusculo-com-espacos');
await page.getByRole('button', { name: 'Remover cupom' }).click(); await shot('CT08-cupom-removido');

// Frete
await setCarrinho([{ produtoId: 'P004', quantidade: 1 }, { produtoId: 'P005', quantidade: 1 }, { produtoId: 'P008', quantidade: 1 }]);
await page.goto(BASE + '/carrinho'); await shot('CT13-subtotal-199_90-frete-cobrado');
await setCarrinho([{ produtoId: 'P005', quantidade: 2 }]);
await page.goto(BASE + '/carrinho'); await shot('CT14-BUG01-subtotal-200_00-frete-cobrado');
await setCarrinho([{ produtoId: 'P003', quantidade: 1 }, { produtoId: 'P006', quantidade: 1 }]);
await page.goto(BASE + '/carrinho'); await shot('CT15-subtotal-219_80-frete-gratis');
await aplicarCupom('BEMVINDO10'); await shot('CT18-frete-gratis-considera-subtotal-antes-do-desconto');
await setCarrinho([{ produtoId: 'P005', quantidade: 1 }]);
await page.goto(BASE + '/carrinho'); await aplicarCupom('BEMVINDO10'); await shot('CT20-desconto-nao-incide-sobre-frete');

// Checkout
await setCarrinho([{ produtoId: 'P005', quantidade: 1 }]);
await page.goto(BASE + '/checkout');
await page.getByRole('button', { name: 'Confirmar pedido' }).click(); await shot('CT37-checkout-campos-obrigatorios');
await page.fill('#campo-nome', 'Maria'); await page.fill('#campo-email', 'maria@exemplo'); await page.fill('#campo-cep', '0131010');
await page.getByRole('button', { name: 'Confirmar pedido' }).click(); await shot('CT38-CT39-CT40-checkout-dados-invalidos');
await page.fill('#campo-nome', 'Maria Silva'); await page.fill('#campo-email', 'maria@exemplo.com'); await page.fill('#campo-cep', '01310-100');
await page.getByRole('button', { name: 'Confirmar pedido' }).click();
await page.waitForURL('**/pedido-confirmado'); await shot('CT41-pedido-confirmado');
await page.goto(BASE + '/carrinho'); await shot('CT41-carrinho-vazio-apos-pedido');

// Exploratórios
await setCarrinho([{ produtoId: 'P001', quantidade: 8 }]);
await page.goto(BASE + '/carrinho'); await shot('EX01-BUG02-carrinho-com-8-unidades');
await page.goto(BASE + '/checkout');
await page.fill('#campo-nome', 'Maria Silva'); await page.fill('#campo-email', 'maria@exemplo.com'); await page.fill('#campo-cep', '01310100');
await page.getByRole('button', { name: 'Confirmar pedido' }).click();
await page.waitForURL('**/pedido-confirmado'); await shot('EX01-BUG02-pedido-confirmado-com-8-unidades');

await setCarrinho([{ produtoId: 'P001', quantidade: 1 }], 'VERAO2026');
await page.goto(BASE + '/carrinho'); await shot('EX02-BUG03-cupom-expirado-exibido-como-aplicado');
await page.goto(BASE + '/checkout');
await page.fill('#campo-nome', 'Maria Silva'); await page.fill('#campo-email', 'maria@exemplo.com'); await page.fill('#campo-cep', '01310100');
await page.getByRole('button', { name: 'Confirmar pedido' }).click(); await shot('EX02-BUG03-checkout-recusa-cupom-expirado');

const novaAba = await ctx.newPage();
await novaAba.goto(BASE + '/carrinho'); await novaAba.waitForLoadState('networkidle');
await novaAba.screenshot({ path: fileURLToPath(new URL('EX04-nova-aba-carrinho-vazio.png', SHOTS)), fullPage: true });
console.log('UI   EX04-nova-aba-carrinho-vazio');

await page.goto(BASE + '/pagina-que-nao-existe'); await shot('EX05-pagina-nao-encontrada');
await setCarrinho([]);
await page.goto(BASE + '/checkout'); await shot('EX06-checkout-com-carrinho-vazio');

await browser.close();
