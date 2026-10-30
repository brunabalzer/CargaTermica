import { calcularCarga, validarEntrada } from './calc.js';
import { gerarPDF } from './pdf.js';
import { enviarLead, registrarCalculo } from './leads.js';

const form = document.querySelector('#calculator-form');
const steps = [...document.querySelectorAll('.form-step')];
const indicators = [...document.querySelectorAll('[data-step-indicator]')];
const windowsList = document.querySelector('#windows-list');
const results = document.querySelector('#results');
const formError = document.querySelector('#form-error');
const leadModal = document.querySelector('#lead-modal');
const leadForm = document.querySelector('#lead-form');
const leadError = document.querySelector('#lead-error');
const leadSuccess = document.querySelector('#lead-success');
let currentStep = 1;
let windowCount = 0;
let lastCalculation = null;
let lastInput = null;
let lastCalculationId = null;

const number = (name) => Number(form.elements[name].value);
const windowTemplate = (id) => `
  <article class="repeat-card" data-window-id="${id}">
    <div class="repeat-card-header"><strong>Janela ${id}</strong><button type="button" class="remove-window" data-remove-window="${id}">Remover</button></div>
    <div class="repeat-grid">
      <label>Área <span class="input-with-unit"><input data-window-field="areaM2" type="number" min="0" max="500" step="0.1" value="6" required><span>m²</span></span></label>
      <label>Orientação <select data-window-field="orientacao"><option value="N">Norte</option><option value="S">Sul</option><option value="L">Leste</option><option value="O">Oeste</option><option value="NE">Nordeste</option><option value="NO">Noroeste</option><option value="SE">Sudeste</option><option value="SO">Sudoeste</option><option value="horizontal">Horizontal</option></select></label>
      <label>Tipo de vidro <select data-window-field="vidro"><option value="simples">Simples</option><option value="laminado">Laminado</option><option value="insulado">Insulado</option><option value="pelicula">Com película</option></select></label>
      <label>Proteção solar <select data-window-field="protecao"><option value="nenhuma">Nenhuma</option><option value="cortina">Cortina interna</option><option value="brise">Brise externo</option><option value="toldo">Toldo externo</option></select></label>
    </div>
  </article>`;

function addWindow() {
  windowCount += 1;
  windowsList.insertAdjacentHTML('beforeend', windowTemplate(windowCount));
}

function setStep(step) {
  currentStep = Math.max(1, Math.min(4, step));
  steps.forEach((element) => {
    const active = Number(element.dataset.step) === currentStep;
    element.hidden = !active;
    element.classList.toggle('is-active', active);
  });
  indicators.forEach((element) => {
    const stepNumber = Number(element.dataset.stepIndicator);
    element.classList.toggle('is-active', stepNumber === currentStep);
    element.classList.toggle('is-complete', stepNumber < currentStep);
  });
  document.querySelector(`[data-step="${currentStep}"] legend`)?.focus();
}

function readWindows() {
  return [...windowsList.querySelectorAll('.repeat-card')].map((card) => ({
    areaM2: Number(card.querySelector('[data-window-field="areaM2"]').value),
    orientacao: card.querySelector('[data-window-field="orientacao"]').value,
    vidro: card.querySelector('[data-window-field="vidro"]').value,
    protecao: card.querySelector('[data-window-field="protecao"]').value
  }));
}

function readEquipment() {
  const equipment = [...form.querySelectorAll('input[name="equipment"]:checked')].map((checkbox) => ({
    tipo: checkbox.value,
    quantidade: Number(form.elements[`qty-${checkbox.value}`].value)
  }));
  const otherName = form.elements.outroNome.value.trim();
  const otherPower = Number(form.elements.outroPotenciaW.value);
  if (otherName && otherPower > 0) equipment.push({ tipo: 'generico', quantidade: Number(form.elements.outroQuantidade.value), potenciaW: otherPower });
  return equipment;
}

function readInput() {
  const area = number('areaM2');
  return {
    cidade: 'Ponta Grossa',
    clima: { frequencia: '1%', estacaoProxy: 'Curitiba-Afonso-Pena' },
    ambiente: { uso: form.elements.uso.value, areaM2: area, peDireitoM: number('peDireitoM') },
    interno: { temperaturaC: number('temperaturaC'), umidadeRelativa: number('umidadeRelativa') / 100 },
    envoltoria: {
      paredesExternasM2: number('paredesExternasM2'),
      tetoM2: number('tetoM2'),
      tipoParede: form.elements.tipoParede.value,
      tipoTeto: form.elements.tipoTeto.value,
      janelas: readWindows()
    },
    pessoas: { quantidade: number('quantidadePessoas'), atividade: form.elements.atividade.value },
    iluminacao: { wPorM2: number('wPorM2') },
    equipamentos: readEquipment(),
    ar: {
      renovacaoLpsPessoa: number('renovacaoLpsPessoa'),
      renovacaoLpsM2: number('renovacaoLpsM2'),
      infiltracaoACH: number('infiltracaoACH')
    },
    fatorSeguranca: number('fatorSeguranca') / 100
  };
}

function clearErrors() {
  formError.hidden = true;
  formError.textContent = '';
  form.querySelectorAll('.field-error').forEach((element) => { element.textContent = ''; });
  form.querySelectorAll('[aria-invalid="true"]').forEach((element) => element.removeAttribute('aria-invalid'));
}

function showErrors(errors) {
  clearErrors();
  formError.hidden = false;
  formError.textContent = errors.join(' ');
  const mappings = [
    ['areaM2', 'Área deve ser entre 4 e 500 m²'],
    ['peDireitoM', 'Pé-direito deve ser entre 2 e 8 m'],
    ['paredesExternasM2', 'Área de paredes externas inválida'],
    ['tetoM2', 'Área do teto inválida'],
    ['quantidadePessoas', 'Quantidade de pessoas deve ser entre 0 e 500'],
    ['wPorM2', 'Iluminação deve estar entre 0 e 500 W/m²'],
    ['temperaturaC', 'Temperatura interna deve ser entre 16 e 30 °C']
  ];
  mappings.forEach(([field, message]) => {
    if (errors.some((error) => error.includes(message))) {
      const input = form.elements[field];
      input.setAttribute('aria-invalid', 'true');
      input.closest('label')?.querySelector('.field-error')?.append(message);
    }
  });
}

function renderResult(resultado) {
  lastCalculation = resultado;
  lastInput = readInput();
  results.hidden = false;
  document.querySelector('#total-btuh').textContent = `${Math.round(resultado.total_BTUh).toLocaleString('pt-BR')}`;
  document.querySelector('#suggested-capacity').textContent = resultado.capacidadeSugerida
    ? `${resultado.capacidadeSugerida.toLocaleString('pt-BR')} BTU/h`
    : 'Acima de 60.000 BTU/h';
  document.querySelector('#total-kw').textContent = `${(resultado.total_W / 1000).toFixed(2).replace('.', ',')} kW`;
  document.querySelector('#total-tr').textContent = `${resultado.total_TR.toFixed(2).replace('.', ',')} TR`;
  document.querySelector('#result-context').textContent = `Margem de segurança: ${(resultado.fatorSeguranca * 100).toFixed(0)}% · Dados regionais provisórios de Curitiba/Afonso Pena`;

  const chart = document.querySelector('#component-chart');
  const positive = resultado.componentes.filter((item) => item.sensivel_W + item.latente_W > 0);
  const max = Math.max(...positive.map((item) => item.sensivel_W + item.latente_W), 1);
  chart.innerHTML = positive.map((item) => {
    const value = item.sensivel_W + item.latente_W;
    return `<div class="component-row"><span>${item.nome.replace('Ar externo — ', 'Ar: ')}</span><span class="bar-track"><span class="bar-fill" style="width:${(value / max) * 100}%"></span></span><strong>${Math.round(value)} W</strong></div>`;
  }).join('');

  const difference = resultado.diferencaPercentual;
  document.querySelector('#comparison-text').textContent = `Regra dos 600 BTU/m²: ${Math.round(resultado.regraBolso_BTUh).toLocaleString('pt-BR')} BTU/h · Cálculo técnico: ${Math.round(resultado.total_BTUh).toLocaleString('pt-BR')} BTU/h · Diferença: ${difference === null ? 'não aplicável' : `${difference.toFixed(1).replace('.', ',')}%`}`;
  document.querySelector('#comparison-risk').textContent = difference > 0
    ? 'A regra de bolso fica abaixo do cálculo técnico e pode subdimensionar o equipamento.'
    : 'A regra de bolso fica acima do cálculo técnico e pode levar a um equipamento superdimensionado.';
  document.querySelector('#notices').innerHTML = resultado.avisos.map((aviso) => `<div class="notice">${aviso}</div>`).join('');
  lastCalculationId = null;
  registrarCalculo(lastInput, resultado).then((id) => {
    lastCalculationId = id;
  }).catch(() => {});
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openLead(interesse) {
  leadForm.reset();
  leadForm.elements.cidade.value = 'Ponta Grossa';
  leadForm.dataset.interesse = interesse;
  leadError.hidden = true;
  leadSuccess.hidden = true;
  leadForm.hidden = false;
  document.querySelector('#lead-title').textContent = interesse === 'pmoc'
    ? 'Converse sobre seu PMOC'
    : 'Receba orientação para o seu ambiente';
  document.querySelector('#lead-intro').textContent = interesse === 'pmoc'
    ? 'O PMOC é especialmente relevante para edifícios de uso público ou coletivo climatizados. A partir de 60.000 BTU/h, procure também um responsável técnico habilitado.'
    : 'Envie seus dados para receber orientação sobre um projeto com engenheiro responsável.';
  leadModal.showModal();
  leadForm.elements.nome.focus();
}

function formatWhatsapp(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function whatsappLink(whatsapp, interesse) {
  const phone = whatsapp.replace(/\D/g, '');
  const message = `Olá! Fiz um cálculo de carga térmica em Ponta Grossa e gostaria de falar sobre ${interesse === 'pmoc' ? 'PMOC' : 'projeto com engenheiro responsável'}. Resultado: ${Math.round(lastCalculation.total_BTUh).toLocaleString('pt-BR')} BTU/h.`;
  return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
}

function downloadPDF() {
  if (!lastInput || !lastCalculation) return;
  try {
    gerarPDF(lastInput, lastCalculation);
  } catch (error) {
    formError.hidden = false;
    formError.textContent = `Não foi possível gerar o PDF: ${error.message}`;
    formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

document.querySelector('#add-window').addEventListener('click', addWindow);
windowsList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-window]');
  if (button) button.closest('.repeat-card').remove();
});
document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', () => setStep(currentStep + 1)));
document.querySelectorAll('[data-prev]').forEach((button) => button.addEventListener('click', () => setStep(currentStep - 1)));
form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearErrors();
  const entrada = readInput();
  const errors = validarEntrada(entrada);
  if (errors.length) {
    showErrors(errors);
    return;
  }
  renderResult(calcularCarga(entrada));
});
document.querySelector('#new-calculation').addEventListener('click', () => {
  results.hidden = true;
  setStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.querySelector('#download-pdf').addEventListener('click', downloadPDF);
document.querySelector('#project-cta').addEventListener('click', () => openLead('projeto'));
document.querySelector('#pmoc-cta').addEventListener('click', () => openLead('pmoc'));
document.querySelector('#close-lead-modal').addEventListener('click', () => leadModal.close());
leadForm.elements.whatsapp.addEventListener('input', (event) => {
  event.target.value = formatWhatsapp(event.target.value);
});
leadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  leadError.hidden = true;
  const dados = {
    nome: leadForm.elements.nome.value.trim(),
    whatsapp: leadForm.elements.whatsapp.value,
    email: leadForm.elements.email.value.trim(),
    cidade: leadForm.elements.cidade.value.trim(),
    interesse: leadForm.dataset.interesse,
    calculoId: lastCalculationId,
    consentimento: leadForm.elements.consentimento.checked
  };
  if (!dados.consentimento) {
    leadError.textContent = 'Você precisa autorizar o contato para continuar.';
    leadError.hidden = false;
    return;
  }
  try {
    await enviarLead(dados);
    leadForm.hidden = true;
    leadSuccess.hidden = false;
    document.querySelector('#whatsapp-now').href = whatsappLink(dados.whatsapp, dados.interesse);
  } catch (error) {
    leadError.textContent = `Não foi possível enviar agora: ${error.message}`;
    leadError.hidden = false;
  }
});

addWindow();
setStep(1);
