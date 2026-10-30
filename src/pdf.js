import { CONTATO } from './config.js';
import { CLIMA_PONTA_GROSSA, CONDICOES_INTERNAS_PADRAO } from './clima-pg.js';

const LEGAL_NOTICE = 'Estimativa preliminar. Não substitui projeto de climatização com ART.';
const PDF_VERSION = 'jsPDF 2.5.1 + AutoTable 3.8.2';

function formatNumber(value, decimals = 0) {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString('pt-BR');
}

function fileDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculationNumber(date = new Date()) {
  const stamp = date.toISOString().replace(/\D/g, '').slice(0, 14);
  return `CALC-${stamp}`;
}

function addSectionTitle(doc, title) {
  doc.setFontSize(11);
  doc.setTextColor(11, 77, 128);
  doc.text(title, 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 42);
  doc.setTextColor(19, 34, 56);
}

function addFooter(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const height = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 229, 237);
    doc.line(14, height - 18, 196, height - 18);
    doc.setFontSize(7.5);
    doc.setTextColor(94, 109, 128);
    doc.text(LEGAL_NOTICE, 14, height - 11);
    if (CONTATO) doc.text(`Contato: ${CONTATO}`, 196, height - 11, { align: 'right' });
    doc.text(`Página ${page}/${pageCount}`, 196, height - 5, { align: 'right' });
  }
}

function entryRows(entrada) {
  const windows = entrada.envoltoria.janelas.map((window, index) => (
    `Janela ${index + 1}: ${formatNumber(window.areaM2, 1)} m² · ${window.orientacao} · ${window.vidro} · ${window.protecao}`
  ));
  const equipment = entrada.equipamentos.length
    ? entrada.equipamentos.map((item) => `${item.quantidade} × ${item.tipo}${item.potenciaW ? ` (${formatNumber(item.potenciaW)} W)` : ''}`).join('; ')
    : 'Nenhum';
  return [
    ['Ambiente', `${entrada.ambiente.uso} · ${formatNumber(entrada.ambiente.areaM2, 1)} m² · pé-direito ${formatNumber(entrada.ambiente.peDireitoM, 1)} m`],
    ['Janelas', windows.length ? windows.join('\n') : 'Nenhuma'],
    ['Paredes externas', `${formatNumber(entrada.envoltoria.paredesExternasM2, 1)} m² · tipo ${entrada.envoltoria.tipoParede}`],
    ['Cobertura', `${formatNumber(entrada.envoltoria.tetoM2, 1)} m² · tipo ${entrada.envoltoria.tipoTeto}`],
    ['Pessoas', `${entrada.pessoas.quantidade} · atividade ${entrada.pessoas.atividade}`],
    ['Iluminação', `${formatNumber(entrada.iluminacao.wPorM2, 1)} W/m²`],
    ['Equipamentos', equipment],
    ['Ar externo', `${formatNumber(entrada.ar.renovacaoLpsPessoa, 1)} L/s·pessoa + ${formatNumber(entrada.ar.renovacaoLpsM2, 1)} L/s·m² · infiltração ${formatNumber(entrada.ar.infiltracaoACH, 1)} ACH`]
  ];
}

export function gerarPDF(entrada, resultado) {
  const jsPdfNamespace = globalThis.jspdf;
  if (!jsPdfNamespace?.jsPDF) {
    throw new Error('A biblioteca jsPDF não foi carregada.');
  }
  if (typeof jsPdfNamespace.jsPDF.API.autoTable !== 'function') {
    throw new Error('A extensão jspdf-autotable não foi carregada.');
  }

  const doc = new jsPdfNamespace.jsPDF({ format: 'a4', unit: 'mm' });
  const now = new Date();
  const clima = entrada.climaDados ?? CLIMA_PONTA_GROSSA;
  const interno = entrada.interno ?? CONDICOES_INTERNAS_PADRAO;
  const autoTableOptions = {
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, textColor: [19, 34, 56] },
    headStyles: { fillColor: [17, 103, 169], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [243, 247, 250] },
    margin: { left: 14, right: 14, bottom: 24 },
    didDrawPage: () => {}
  };

  doc.setFillColor(13, 53, 90);
  doc.rect(0, 0, 210, 31, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('Estimativa de carga térmica', 14, 14);
  doc.setFontSize(10);
  doc.text('NBR 16401-1:2024', 14, 22);
  doc.setFontSize(8);
  doc.text(`Cálculo ${calculationNumber(now)}`, 196, 14, { align: 'right' });
  doc.text(`${formatDate(now)} · Ponta Grossa/PR`, 196, 22, { align: 'right' });
  doc.setTextColor(19, 34, 56);

  doc.setFontSize(9);
  doc.text('Dados de projeto', 14, 41);
  doc.autoTable({
    ...autoTableOptions,
    startY: 44,
    head: [['Parâmetro', 'Valor', 'Fonte']],
    body: [
      ['Condição externa', `TBS ${formatNumber(clima.temperaturaBulboSecoC, 1)} °C · TBUc ${formatNumber(clima.temperaturaBulboUmidoCoincidenteC, 1)} °C · ΔTBS ${formatNumber(clima.variacaoDiariaTbsC, 1)} °C`, 'Curitiba/Afonso Pena · NBR 16401-1:2024, Tabela A.4'],
      ['Condição interna', `${formatNumber(interno.temperaturaC, 1)} °C · ${formatNumber(interno.umidadeRelativa * 100, 0)}% UR`, 'Hipótese MVP baseada na faixa de conforto'],
      ['Método', 'Componentes estacionários · margem de segurança', 'Baseado na NBR 16401 e ASHRAE Fundamentals'],
      ['Biblioteca PDF', PDF_VERSION, 'Versões fixadas via CDN']
    ],
    columnStyles: { 0: { cellWidth: 31 }, 1: { cellWidth: 89 }, 2: { cellWidth: 58 } }
  });

  addSectionTitle(doc, 'Entradas do cálculo');
  doc.autoTable({
    ...autoTableOptions,
    startY: doc.lastAutoTable.finalY + 3,
    head: [['Item', 'Informação']],
    body: entryRows(entrada),
    columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: 140 } }
  });

  addSectionTitle(doc, 'Componentes da carga');
  const totalBase = resultado.componentes.reduce(
    (sum, item) => sum + item.sensivel_W + item.latente_W,
    0
  );
  doc.autoTable({
    ...autoTableOptions,
    startY: doc.lastAutoTable.finalY + 3,
    head: [['Componente', 'Sensível (W)', 'Latente (W)', 'Total (W)', '% do total']],
    body: resultado.componentes.map((item) => {
      const itemTotal = item.sensivel_W + item.latente_W;
      return [
        item.nome,
        formatNumber(item.sensivel_W, 2),
        formatNumber(item.latente_W, 2),
        formatNumber(itemTotal, 2),
        `${formatNumber(totalBase ? itemTotal / totalBase * 100 : 0, 1)}%`
      ];
    }),
    foot: [['Total base', '', '', formatNumber(totalBase, 2), '100%']],
    columnStyles: { 0: { cellWidth: 67 }, 1: { cellWidth: 28 }, 2: { cellWidth: 28 }, 3: { cellWidth: 28 }, 4: { cellWidth: 27 } }
  });

  addSectionTitle(doc, 'Resultado e comparação');
  doc.autoTable({
    ...autoTableOptions,
    startY: doc.lastAutoTable.finalY + 3,
    head: [['Resultado', 'Valor']],
    body: [
      ['Carga total', `${formatNumber(resultado.total_W, 2)} W · ${formatNumber(resultado.total_BTUh, 0)} BTU/h · ${formatNumber(resultado.total_TR, 3)} TR`],
      ['Fator de segurança', `${formatNumber(resultado.fatorSeguranca * 100, 0)}%`],
      ['Capacidade comercial sugerida', resultado.capacidadeSugerida ? `${formatNumber(resultado.capacidadeSugerida)} BTU/h` : 'Acima de 60.000 BTU/h — projeto por zonas'],
      ['Regra dos 600 BTU/m²', `${formatNumber(resultado.regraBolso_BTUh)} BTU/h`],
      ['Diferença', resultado.diferencaPercentual === null ? 'Não aplicável' : `${formatNumber(resultado.diferencaPercentual, 1)}%`]
    ],
    columnStyles: { 0: { cellWidth: 67 }, 1: { cellWidth: 111 } }
  });

  const notices = resultado.avisos.length ? resultado.avisos : ['Nenhum aviso adicional de PMOC para os dados informados.'];
  addSectionTitle(doc, 'Avisos');
  doc.autoTable({
    ...autoTableOptions,
    startY: doc.lastAutoTable.finalY + 3,
    body: notices.map((notice) => [notice]),
    columnStyles: { 0: { cellWidth: 178 } }
  });

  addFooter(doc);
  doc.save(`carga-termica-${fileDate(now)}.pdf`);
}
