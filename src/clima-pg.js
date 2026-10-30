// Fonte climática: ABNT NBR 16401-1:2024, Tabelas A.2 e A.4.
// Ponta Grossa não consta na tabela consultada; Curitiba/Afonso Pena é proxy regional provisório.
export const CLIMA_PONTA_GROSSA = Object.freeze({
  cidade: 'Ponta Grossa',
  fonte: 'Curitiba/Afonso Pena — ABNT NBR 16401-1:2024, Tabelas A.2 e A.4',
  estacaoProxy: 'Curitiba-Afonso-Pena',
  frequencia: '1%',
  latitudeSulGraus: 25.1,
  temperaturaBulboSecoC: 28.8,
  temperaturaBulboUmidoCoincidenteC: 20.2,
  variacaoDiariaTbsC: 9.4,
  altitudeM: 911
});

// Hipótese de conforto para demonstração; confirmar conforme o uso e a NBR 16401-2.
export const CONDICOES_INTERNAS_PADRAO = Object.freeze({
  temperaturaC: 24,
  umidadeRelativa: 0.5
});
