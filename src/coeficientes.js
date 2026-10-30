// Valores didáticos/documentados em docs/METODO.md; hipóteses não devem ser rotuladas como valores normativos.
export const FATOR_SOLAR_W_M2 = Object.freeze({
  N: 250, S: 250, L: 450, O: 500,
  NE: 400, NO: 450, SE: 350, SO: 500, horizontal: 700
});

export const FATOR_SOLAR_VIDRO = Object.freeze({
  simples: 1,
  laminado: 0.75,
  insulado: 0.65,
  pelicula: 0.45
});

export const FATOR_PROTECAO_SOLAR = Object.freeze({
  nenhuma: 1,
  cortina: 0.6,
  brise: 0.35,
  toldo: 0.35
});

export const U_COMPONENTES_W_M2K = Object.freeze({
  parede: { leve: 2.2, media: 1.8, pesada: 1.4 },
  teto: { lajeComTelhado: 1.2, lajeSemTelhado: 1.5, telhaSemForro: 2.5 },
  vidro: { simples: 2.8, laminado: 2.8, insulado: 1.8, pelicula: 2.8 }
});

// Ganhos internos de referência, aproximados para 24 °C; conferir ASHRAE Fundamentals.
export const CALOR_PESSOA_W = Object.freeze({
  sentado: { sensivel: 75, latente: 55 },
  escritorio: { sensivel: 75, latente: 55 },
  atividadeLeve: { sensivel: 100, latente: 100 },
  academia: { sensivel: 170, latente: 250 }
});

// Potências típicas editáveis, conforme docs/METODO.md.
export const POTENCIAS_EQUIPAMENTOS_W = Object.freeze({
  computador: 120,
  tv: 100,
  geladeira: 150,
  forno: 1500,
  generico: 100
});

// NBR 16401-3:2024, Tabela 1, linha de referência de escritório.
export const VAZAO_AR_EXTERNO_LPS = Object.freeze({
  pessoa: 7,
  area: 0.4
});

export const PROPRIEDADES_AR = Object.freeze({
  densidadeKgM3: 1.2,
  calorEspecificoJKgK: 1006
});

export const CAPACIDADES_COMERCIAIS_BTUH = Object.freeze([
  9000, 12000, 18000, 24000, 30000, 36000, 48000, 60000
]);

export const BTUH_POR_W = 3.412141633;
export const W_POR_TR = 12000 / BTUH_POR_W;
