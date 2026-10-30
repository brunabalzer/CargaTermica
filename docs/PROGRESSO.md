# Progresso

## Etapa atual

**Etapa 1 — plano técnico e método de cálculo: concluída, com casos manuais e regras comerciais.**

## Entregas

- `docs/METODO.md`: escopo, limitações, método por componentes, unidades, dados climáticos, alertas legais, critérios de aceitação e plano das próximas etapas.
- `docs/METODO.md`: comparação 600 BTU/h, capacidades comerciais, contrato JSON e três casos fechados numericamente.
- Repositório Git inicializado em `calc-carga-termica`.

## Decisões importantes

- A ferramenta é uma estimativa preliminar, não um projeto executivo.
- O padrão de frequência climática será 1% no verão, com opções 0,4% e 2%.
- Ponta Grossa não foi encontrada na tabela local da NBR 16401-1:2024; Curitiba/Afonso Pena foi escolhida como proxy regional provisório. Para 1%, a tabela local registra TBS 28,8 °C, TBU coincidente 20,2 °C e ΔTBS 9,4 °C.
- O fator de segurança padrão será 10% e configurável.
- A regra de 600 BTU/h/m² será apenas comparação informativa.
- Não prometer ART assinada pela autora; CTAs usarão “projeto com engenheiro responsável”.
- Os três exemplos usam coeficientes didáticos explicitamente marcados; eles precisam de revisão técnica antes da publicação.
- O motor inclui condução pelos vidros. A conta manual original a omitia; os fechamentos foram corrigidos para refletir o método completo.

## Próximo passo

**Prompt 2 — motor implementado.** A API `calcularCarga(entrada)` retorna componentes em W, total em W/BTU/h/TR, fator de segurança, regra dos 600 BTU/h, diferença percentual, capacidade sugerida e avisos.

Exemplo de entrada:

```json
{
  "ambiente": {"uso": "comercial", "areaM2": 30, "peDireitoM": 2.8},
  "interno": {"temperaturaC": 24, "umidadeRelativa": 0.5},
  "envoltoria": {"paredesExternasM2": 24.8, "tetoM2": 30, "janelas": []},
  "pessoas": {"quantidade": 5, "atividade": "escritorio"},
  "iluminacao": {"wPorM2": 10},
  "equipamentos": [{"tipo": "computador", "quantidade": 3, "potenciaW": 120}],
  "ar": {"renovacaoLpsPessoa": 7, "renovacaoLpsM2": 0.4, "infiltracaoACH": 0.5},
  "fatorSeguranca": 0.1
}
```

Exemplo de saída resumida:

```json
{
  "total_W": 4026.95,
  "total_BTUh": 13740.51,
  "total_TR": 1.145,
  "fatorSeguranca": 0.1,
  "regraBolso_BTUh": 22200,
  "diferencaPercentual": -38.11,
  "capacidadeSugerida": 18000,
  "avisos": ["Uso público/coletivo ou comercial: verifique a obrigação de PMOC prevista na Lei 13.589/2018."]
}
```

**Supabase pronto; próximo passo: Prompt 6.** O schema cria `calculos` e `leads` com RLS permitindo apenas INSERT para `anon`; a leitura pública fica bloqueada. `src/config.js` contém placeholders vazios para a URL e anon key. A interface registra cálculos sem bloquear a tela, abre os CTAs em modal, captura consentimento LGPD e UTM, e mantém fallback funcional quando o Supabase não está configurado.
