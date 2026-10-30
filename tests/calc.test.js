import assert from 'node:assert/strict';
import test from 'node:test';
import { avisosPMOC, calcularCarga, sugerirCapacidade, validarEntrada } from '../src/calc.js';

const base = {
  cidade: 'Ponta Grossa',
  ambiente: { uso: 'residencial', areaM2: 12, peDireitoM: 2.8 },
  interno: { temperaturaC: 24, umidadeRelativa: 0.5 },
  envoltoria: { paredesExternasM2: 18.1, tetoM2: 12, janelas: [] },
  pessoas: { quantidade: 2, atividade: 'sentado' },
  iluminacao: { wPorM2: 5 },
  equipamentos: [],
  ar: { renovacaoLpsPessoa: 7, renovacaoLpsM2: 0, infiltracaoACH: 0.5 },
  fatorSeguranca: 0.1
};

function entradaCaso(overrides) {
  return {
    ...base,
    ambiente: { ...base.ambiente, ...overrides.ambiente },
    envoltoria: { ...base.envoltoria, ...overrides.envoltoria },
    pessoas: { ...base.pessoas, ...overrides.pessoas },
    iluminacao: { ...base.iluminacao, ...overrides.iluminacao },
    ar: { ...base.ar, ...overrides.ar },
    equipamentos: overrides.equipamentos ?? base.equipamentos
  };
}

test('caso 1: quarto fica dentro de 2% da conta manual', () => {
  const resultado = calcularCarga(entradaCaso({
    envoltoria: {
      janelas: [{ areaM2: 1.5, orientacao: 'O', vidro: 'simples', protecao: 'nenhuma' }]
    }
  }));
  assert.ok(Math.abs(resultado.total_BTUh - 5409) / 5409 < 0.02);
});

test('caso 2: sala comercial fica dentro de 2% da conta manual', () => {
  const resultado = calcularCarga(entradaCaso({
    ambiente: { uso: 'comercial', areaM2: 30 },
    envoltoria: { paredesExternasM2: 24.8, tetoM2: 30, janelas: [{ areaM2: 6, orientacao: 'N', vidro: 'simples', protecao: 'nenhuma' }] },
    pessoas: { quantidade: 5, atividade: 'escritorio' },
    iluminacao: { wPorM2: 10 },
    equipamentos: [{ tipo: 'computador', quantidade: 3, potenciaW: 120 }],
    ar: { renovacaoLpsPessoa: 7, renovacaoLpsM2: 0.4 }
  }));
  assert.ok(Math.abs(resultado.total_BTUh - 13741) / 13741 < 0.02);
});

test('caso 3: consultório fica dentro de 2% da conta manual', () => {
  const resultado = calcularCarga(entradaCaso({
    ambiente: { uso: 'consultorio', areaM2: 20 },
    envoltoria: { paredesExternasM2: 23.2, tetoM2: 20, janelas: [{ areaM2: 2, orientacao: 'L', vidro: 'simples', protecao: 'cortina' }] },
    pessoas: { quantidade: 3, atividade: 'sentado' },
    iluminacao: { wPorM2: 8 },
    ar: { renovacaoLpsPessoa: 7, renovacaoLpsM2: 0 }
  }));
  assert.ok(Math.abs(resultado.total_BTUh - 6111) / 6111 < 0.02);
});

test('valida entradas inválidas em português', () => {
  const erros = validarEntrada({ ambiente: { areaM2: 2 } });
  assert.ok(erros.includes('Área deve ser entre 4 e 500 m²'));
  assert.throws(() => calcularCarga({ ambiente: { areaM2: 2 } }), /Área deve ser entre 4 e 500 m²/);
});

test('seleciona a capacidade comercial acima ou igual', () => {
  assert.equal(sugerirCapacidade(12000), 12000);
  assert.equal(sugerirCapacidade(12001), 18000);
  assert.equal(sugerirCapacidade(60001), null);
});

test('emite avisos de PMOC conforme uso e capacidade', () => {
  const residencial = { ambiente: { uso: 'residencial' } };
  const comercial = { ambiente: { uso: 'comercial' } };
  assert.equal(avisosPMOC(residencial, 30000).length, 0);
  assert.equal(avisosPMOC(comercial, 30000).length, 1);
  assert.equal(avisosPMOC(residencial, 60000).length, 1);
});
