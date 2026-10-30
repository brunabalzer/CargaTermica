import {
  BTUH_POR_W,
  CALOR_PESSOA_W,
  CAPACIDADES_COMERCIAIS_BTUH,
  FATOR_PROTECAO_SOLAR,
  FATOR_SOLAR_VIDRO,
  FATOR_SOLAR_W_M2,
  POTENCIAS_EQUIPAMENTOS_W,
  PROPRIEDADES_AR,
  U_COMPONENTES_W_M2K,
  VAZAO_AR_EXTERNO_LPS
} from './coeficientes.js';
import { CLIMA_PONTA_GROSSA, CONDICOES_INTERNAS_PADRAO } from './clima-pg.js';

const ORIENTACOES = new Set(Object.keys(FATOR_SOLAR_W_M2));
const USOS = new Set(['residencial', 'comercial', 'coletivo', 'publico', 'consultorio']);

const numero = (value) => typeof value === 'number' && Number.isFinite(value);
const entre = (value, min, max) => numero(value) && value >= min && value <= max;

export function validarEntrada(entrada) {
  const erros = [];
  if (!entrada || typeof entrada !== 'object') return ['Entrada deve ser um objeto'];
  const ambiente = entrada.ambiente ?? {};
  const envoltoria = entrada.envoltoria ?? {};
  const interno = entrada.interno ?? {};
  const pessoas = entrada.pessoas ?? {};
  const iluminacao = entrada.iluminacao ?? {};
  const ar = entrada.ar ?? {};

  if (!entre(ambiente.areaM2, 4, 500)) erros.push('Área deve ser entre 4 e 500 m²');
  if (!entre(ambiente.peDireitoM, 2, 8)) erros.push('Pé-direito deve ser entre 2 e 8 m');
  if (!USOS.has(ambiente.uso)) erros.push('Uso deve ser residencial, comercial, coletivo, público ou consultório');
  if (!entre(interno.temperaturaC, 16, 30)) erros.push('Temperatura interna deve ser entre 16 e 30 °C');
  if (!entre(interno.umidadeRelativa, 0.2, 0.8)) erros.push('Umidade relativa deve ser entre 20% e 80%');
  if (!entre(envoltoria.paredesExternasM2, 0, 2000)) erros.push('Área de paredes externas inválida');
  if (!entre(envoltoria.tetoM2, 0, 500)) erros.push('Área do teto inválida');
  if (!Array.isArray(envoltoria.janelas)) erros.push('Janelas deve ser uma lista');
  if (!entre(pessoas.quantidade, 0, 500)) erros.push('Quantidade de pessoas deve ser entre 0 e 500');
  if (!CALOR_PESSOA_W[pessoas.atividade]) erros.push('Atividade das pessoas inválida');
  if (!numero(iluminacao.wPorM2) || iluminacao.wPorM2 < 0 || iluminacao.wPorM2 > 500) erros.push('Iluminação deve estar entre 0 e 500 W/m²');
  if (!entre(ar.renovacaoLpsPessoa, 0, 100)) erros.push('Renovação por pessoa deve estar entre 0 e 100 L/(s·pessoa)');
  if (!entre(ar.renovacaoLpsM2, 0, 20)) erros.push('Renovação por área deve estar entre 0 e 20 L/(s·m²)');
  if (!entre(ar.infiltracaoACH, 0, 20)) erros.push('Infiltração deve estar entre 0 e 20 ACH');
  if (!entre(entrada.fatorSeguranca, 0, 0.3)) erros.push('Fator de segurança deve estar entre 0% e 30%');

  for (const [index, janela] of (envoltoria.janelas ?? []).entries()) {
    if (!entre(janela.areaM2, 0, 500)) erros.push(`Janela ${index + 1}: área inválida`);
    if (!ORIENTACOES.has(janela.orientacao)) erros.push(`Janela ${index + 1}: orientação inválida`);
    if (!FATOR_SOLAR_VIDRO[janela.vidro]) erros.push(`Janela ${index + 1}: vidro inválido`);
    if (!FATOR_PROTECAO_SOLAR[janela.protecao]) erros.push(`Janela ${index + 1}: proteção inválida`);
  }
  for (const [index, equipamento] of (entrada.equipamentos ?? []).entries()) {
    if (!POTENCIAS_EQUIPAMENTOS_W[equipamento.tipo] && (!numero(equipamento.potenciaW) || equipamento.potenciaW < 0)) {
      erros.push(`Equipamento ${index + 1}: tipo ou potência inválida`);
    }
    if (!entre(equipamento.quantidade, 0, 500)) erros.push(`Equipamento ${index + 1}: quantidade inválida`);
  }
  return erros;
}

export function sugerirCapacidade(btuh) {
  if (!numero(btuh) || btuh <= 0) return null;
  return CAPACIDADES_COMERCIAIS_BTUH.find((capacidade) => capacidade >= btuh) ?? null;
}

export function avisosPMOC(entrada, btuh) {
  const uso = entrada.ambiente.uso;
  const avisos = [];
  if (['comercial', 'coletivo', 'publico', 'consultorio'].includes(uso)) {
    avisos.push('Uso público/coletivo ou comercial: verifique a obrigação de PMOC prevista na Lei 13.589/2018.');
  }
  if (btuh >= 60000) {
    avisos.push('Capacidade igual ou superior a 60.000 BTU/h: procure responsável técnico habilitado e avalie o PMOC conforme a Portaria MS 3.523/1998.');
  }
  return avisos;
}

function componente(nome, sensivel_W = 0, latente_W = 0) {
  return { nome, sensivel_W, latente_W };
}

function calcularAr(entrada, clima, deltaT, volume) {
  const ar = entrada.ar;
  const vazaoRenovacaoM3s = (
    (ar.renovacaoLpsPessoa * entrada.pessoas.quantidade) +
    (ar.renovacaoLpsM2 * entrada.ambiente.areaM2)
  ) / 1000;
  const vazaoInfiltracaoM3s = ar.infiltracaoACH * volume / 3600;
  const fator = PROPRIEDADES_AR.densidadeKgM3 * PROPRIEDADES_AR.calorEspecificoJKgK * deltaT;
  return {
    renovacao: componente('Ar externo — renovação', vazaoRenovacaoM3s * fator),
    infiltracao: componente('Ar externo — infiltração', vazaoInfiltracaoM3s * fator)
  };
}

export function calcularCarga(entrada) {
  const erros = validarEntrada(entrada);
  if (erros.length) throw new Error(erros.join('; '));

  const clima = entrada.climaDados ?? CLIMA_PONTA_GROSSA;
  const interno = entrada.interno ?? CONDICOES_INTERNAS_PADRAO;
  const deltaT = Math.max(0, clima.temperaturaBulboSecoC - interno.temperaturaC);
  const envoltoria = entrada.envoltoria;
  const janelas = envoltoria.janelas;
  const areaJanela = janelas.reduce((total, janela) => total + janela.areaM2, 0);
  const paredeU = U_COMPONENTES_W_M2K.parede[envoltoria.tipoParede ?? 'media'];
  const tetoU = U_COMPONENTES_W_M2K.teto[envoltoria.tipoTeto ?? 'lajeSemTelhado'];
  const componentes = [];

  const solar = janelas.reduce((total, janela) => total + (
    janela.areaM2 *
    FATOR_SOLAR_W_M2[janela.orientacao] *
    FATOR_SOLAR_VIDRO[janela.vidro] *
    FATOR_PROTECAO_SOLAR[janela.protecao]
  ), 0);
  componentes.push(componente('Insolação nos vidros', solar));
  componentes.push(componente('Condução pelas paredes', paredeU * envoltoria.paredesExternasM2 * deltaT));
  componentes.push(componente('Condução pelo teto', tetoU * envoltoria.tetoM2 * deltaT));
  componentes.push(componente('Condução pelos vidros', areaJanela * U_COMPONENTES_W_M2K.vidro.simples * deltaT));

  const pessoa = CALOR_PESSOA_W[entrada.pessoas.atividade];
  componentes.push(componente(
    'Pessoas',
    entrada.pessoas.quantidade * pessoa.sensivel,
    entrada.pessoas.quantidade * pessoa.latente
  ));
  componentes.push(componente('Iluminação', entrada.ambiente.areaM2 * entrada.iluminacao.wPorM2));

  const equipamentos = (entrada.equipamentos ?? []).reduce((total, equipamento) => (
    total + equipamento.quantidade * (equipamento.potenciaW ?? POTENCIAS_EQUIPAMENTOS_W[equipamento.tipo])
  ), 0);
  componentes.push(componente('Equipamentos', equipamentos));

  const volume = entrada.ambiente.areaM2 * entrada.ambiente.peDireitoM;
  const ar = calcularAr(entrada, clima, deltaT, volume);
  componentes.push(ar.renovacao, ar.infiltracao);

  const sensivelBase = componentes.reduce((total, item) => total + item.sensivel_W, 0);
  const latenteBase = componentes.reduce((total, item) => total + item.latente_W, 0);
  const fatorSeguranca = entrada.fatorSeguranca;
  const total_W = (sensivelBase + latenteBase) * (1 + fatorSeguranca);
  const total_BTUh = total_W * BTUH_POR_W;
  const regraBolso_BTUh = 600 * entrada.ambiente.areaM2 +
    600 * Math.max(entrada.pessoas.quantidade - 1, 0) +
    600 * (entrada.equipamentos ?? []).reduce((total, equipamento) => total + equipamento.quantidade, 0);
  const diferencaPercentual = regraBolso_BTUh
    ? ((total_BTUh - regraBolso_BTUh) / regraBolso_BTUh) * 100
    : null;

  return {
    componentes,
    total_W,
    total_BTUh,
    total_TR: total_BTUh / 12000,
    fatorSeguranca,
    regraBolso_BTUh,
    diferencaPercentual,
    capacidadeSugerida: sugerirCapacidade(total_BTUh),
    avisos: avisosPMOC(entrada, total_BTUh)
  };
}
