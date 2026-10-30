import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config.js';

const CONSENTIMENTO_TEXTO = 'Autorizo o contato para orçamento conforme a Política de Privacidade.';

function getClient() {
  const factory = globalThis.supabase?.createClient;
  if (!factory || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return factory(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function origemURL() {
  const params = new URLSearchParams(globalThis.location?.search ?? '');
  const source = params.get('utm_source');
  const campaign = params.get('utm_campaign');
  return [source && `utm_source=${source}`, campaign && `utm_campaign=${campaign}`].filter(Boolean).join('&') || null;
}

export async function registrarCalculo(entrada, resultado) {
  const client = getClient();
  if (!client) return null;
  const id = globalThis.crypto?.randomUUID?.();
  if (!id) throw new Error('O navegador não oferece identificador seguro para o cálculo.');
  const { error } = await client.from('calculos').insert({
    id,
    tipo_uso: entrada.ambiente.uso,
    area_m2: entrada.ambiente.areaM2,
    total_btuh: resultado.total_BTUh,
    regra_bolso_btuh: resultado.regraBolso_BTUh,
    capacidade_sugerida: resultado.capacidadeSugerida,
    entrada,
    origem: origemURL()
  });
  if (error) throw error;
  return id;
}

export async function enviarLead(dados) {
  const client = getClient();
  if (!client) throw new Error('Supabase não configurado. Preencha src/config.js antes de enviar leads.');
  const { error } = await client.from('leads').insert({
    nome: dados.nome,
    whatsapp: dados.whatsapp,
    email: dados.email || null,
    cidade: dados.cidade,
    interesse: dados.interesse,
    calculo_id: dados.calculoId || null,
    consentimento: dados.consentimento,
    consentimento_texto: dados.consentimento ? CONSENTIMENTO_TEXTO : null
  });
  if (error) throw error;
  return null;
}

export { CONSENTIMENTO_TEXTO };
