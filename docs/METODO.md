# Método técnico — Calculadora de carga térmica

## 1. Escopo e limite de uso

A aplicação será uma **estimativa preliminar de carga de resfriamento** para uma zona térmica de pequeno porte em Ponta Grossa/PR e outras cidades do Paraná. O método é estacionário e por componentes; não substitui um cálculo horário CLTD/RTS, simulação energética, seleção definitiva de equipamentos, projeto de distribuição de ar ou projeto legal com ART.

O resultado deve sempre exibir:

> Estimativa preliminar. Não substitui projeto de climatização com ART.

O usuário poderá comparar o resultado com a regra informal de 600 BTU/h por m², mas essa comparação será apresentada apenas como referência comercial, nunca como critério normativo.

## 2. Base técnica e condições de projeto

### 2.1 Normas e referências locais

- ABNT NBR 16401-1:2024: condições climáticas, cargas térmicas e critérios de projeto.
- ABNT NBR 16401-3:2024: renovação e tratamento do ar.
- ASHRAE Handbook — Fundamentals: propriedades psicrométricas, ganhos solares e balanço sensível/latente.
- ABNT NBR 15220: propriedades térmicas e transmitância de componentes construtivos.
- Lei 13.589/2018 e Portaria MS 3.523/1998: aviso de PMOC conforme uso da edificação.

A NBR 16401-1:2024 determina que o projetista escolha a frequência anual de ocorrência. Para a ferramenta:

- padrão comercial/residencial: **1% no verão**;
- opção conservadora: **0,4%**;
- opção econômica/exploratória: **2%**, explicitando que a condição interna poderá ser ultrapassada com maior frequência.

Para resfriamento, a condição principal usa TBS externa e TBU coincidente. A condição de verificação usa TBU e TBS coincidente.

### 2.2 Ponta Grossa/PR

Ponta Grossa não foi localizada na tabela de cidades da cópia local da NBR 16401-1:2024. A tabela contém, entre outras, Curitiba — Afonso Pena — e Londrina — José Richa. A aplicação não deve rotular um valor interpolado como “dado NBR de Ponta Grossa”.

Até obter uma fonte climática oficial específica, a cidade deverá ser cadastrada como:

1. `fonte: "aproximação regional — Curitiba/Afonso Pena e Londrina/José Richa"`;
2. `status: "provisório"`;
3. com os valores de projeto e a hipótese visíveis no resultado;
4. com a possibilidade de substituir os valores por dados oficiais sem alterar o motor.

Para esta etapa, a estação substituta adotada é **Curitiba — Afonso Pena**, por ser a referência paranaense listada mais próxima na tabela consultada. Na NBR 16401-1:2024, Tabela A.2, ela aparece em 25,528° S, 49,176° O e altitude 911 m; na Tabela A.4, para 1%: **TBS 28,8 °C, TBU coincidente 20,2 °C e variação diária ΔTBS 9,4 °C**. Esses valores são da estação de Curitiba, não de Ponta Grossa, e devem aparecer como proxy regional. Londrina também está listada, mas é uma referência climática menos próxima e mais quente.

O Prompt 2 deve centralizar esses valores em `src/clima-pg.js`, sem espalhá-los nas fórmulas. A publicação deve ocorrer somente depois de confirmar a aplicabilidade do proxy ou obter uma série/estação oficial de Ponta Grossa no INMET/BDMEP. Não usar os valores genéricos 30/21 °C como se fossem normativos.

Latitude de cálculo solar: **25,1° S**, aproximada para Ponta Grossa. Longitude, altitude e fuso devem ser metadados da cidade, não fatores ocultos no cálculo.

## 3. Entradas da zona

Obrigatórias:

- cidade e frequência de projeto;
- comprimento, largura e pé-direito;
- temperatura e umidade relativa internas;
- orientação e dimensões de cada janela;
- tipo de vidro e proteção solar;
- áreas de paredes externas, cobertura/teto e portas;
- ocupação e nível de atividade;
- iluminação instalada ou W/m²;
- equipamentos e potência;
- renovação de ar por ocupante ou vazão informada;
- infiltração;
- fator de segurança configurável.

Validações: dimensões, áreas, pessoas, potências e vazões não podem ser negativas; a área envidraçada não pode exceder a área da fachada; a área do recinto deve ser positiva; unidades devem aparecer junto dos campos.

## 4. Balanço de carga

Todas as parcelas serão calculadas em W e separadas em sensível e latente:

```text
Q_sensível = Q_solar_vidros + Q_condução + Q_pessoas_s
             + Q_iluminação + Q_equipamentos_s + Q_ar_externo_s

Q_latente = Q_pessoas_l + Q_equipamentos_l + Q_ar_externo_l

Q_total_base = Q_sensível + Q_latente
Q_total_projeto = Q_total_base × (1 + fator_segurança)
```

O padrão inicial do fator de segurança é **10%**, configurável entre 0% e 30%. Ele cobre incertezas de uso, exposição e dados preliminares; não deve ser usado para corrigir entradas ausentes ou para substituir o dimensionamento de dutos.

### 4.1 Condução

Para cada componente:

```text
Q_cond = U × A × (T_ext_equivalente - T_int)
```

Em paredes e cobertura, `T_ext_equivalente` pode incluir uma diferença sol-ar simplificada documentada por tipo de exposição, cor e cobertura. Em vidros, usar a diferença de temperatura do ar e tratar a parcela solar separadamente.

O catálogo inicial terá:

- paredes leve, média e pesada;
- cor clara e escura;
- laje com telhado, laje sem telhado e telha sem forro;
- vidro simples, laminado e insulado.

Os valores de U serão dados editáveis e terão fonte e unidade. Quando a composição for conhecida, calcular U por resistências térmicas; não ocultar um U arbitrário.

### 4.2 Insolação nos vidros

```text
Q_solar_vidro = A_vidro × I_orientação × SHGC_vidro × F_proteção
```

Orientações: N, S, L, O, NE, NO, SE, SO e horizontal. O motor deve selecionar o valor de irradiância/ganho solar mais desfavorável dentro do conjunto simplificado para a latitude e época adotadas, em vez de somar todas as orientações ao mesmo tempo.

Catálogo de SHGC/fator solar inicial:

- vidro simples;
- laminado;
- insulado;
- com película.

Proteções:

- nenhuma;
- cortina interna;
- brise/toldo externo.

Os fatores são aproximações de pré-dimensionamento e devem ser identificados como tais. Brise externo reduz a radiação antes do vidro; cortina interna não deve ser tratada com a mesma eficiência.

### 4.3 Pessoas

```text
Q_pessoas_s = número × ganho_sensível_atividade
Q_pessoas_l = número × ganho_latente_atividade
```

Perfis: sentado, escritório, atividade leve e academia. Os ganhos dependem da temperatura interna de referência e devem ser armazenados em uma tabela versionada, com fonte ASHRAE/NBR indicada no código e na documentação.

### 4.4 Iluminação

```text
Q_iluminação = potência_instalada
```

Se o usuário informar W/m²:

```text
potência_instalada = W/m² × área_do_piso
```

O ganho é inicialmente sensível. Luminárias, reatores e uso intermitente podem ser tratados por fator de uso editável em versão posterior.

### 4.5 Equipamentos

Cada equipamento terá quantidade, potência elétrica, fração de uso e fração sensível/latente. Na primeira versão, computadores, TVs, geladeira, forno e equipamento genérico serão presets editáveis. A potência informada pelo usuário sempre prevalece sobre a típica.

```text
Q_equip = quantidade × potência × fator_uso
```

Não presumir que toda potência nominal de uma geladeira ou forno seja continuamente convertida em carga interna; usar fator de uso explícito.

### 4.6 Ar externo e infiltração

Para renovação:

```text
V_ext = (F_a × área) + (F_p × pessoas)
```

Os valores `F_a` e `F_p` devem vir da tabela de ocupação/atividade da NBR 16401-3:2024 e ser apresentados em L/(s·m²) e L/(s·pessoa). A seleção de atividade deve ser visível; não usar fixamente 27 m³/h por pessoa como regra universal.

Para ar exterior, calcular entalpia:

```text
Q_ar_total = ρ × V × (h_ext - h_int)
Q_ar_sensível ≈ ρ × V × cp × (T_ext - T_int)
Q_ar_latente = Q_ar_total - Q_ar_sensível
```

Usar psicrometria consistente para obter umidade absoluta/entalpia. Infiltração será informada por ACH (trocas/h) ou vazão:

```text
V_infiltração = ACH × volume / 3600
```

Renovação e infiltração serão parcelas distintas para evitar dupla contagem. A infiltração pode ser zero somente quando o usuário confirmar envelope/pressurização compatível.

## 5. Saída e comunicação de risco

Mostrar:

- carga sensível, latente e total;
- carga antes e depois da margem;
- kW, BTU/h e TR;
- contribuição percentual por componente;
- regra de 600 BTU/h/m², com diferença absoluta e percentual;
- cidade, frequência, condições externas e fonte;
- hipótese provisória de Ponta Grossa, se aplicável;
- alerta de resultado preliminar.

Avisos legais:

- uso público/coletivo climatizado: informar a obrigação de PMOC prevista na Lei 13.589/2018;
- capacidade igual ou superior a 60.000 BTU/h: recomendar avaliação de responsável técnico habilitado e PMOC conforme legislação aplicável;
- CTAs devem dizer “projeto com engenheiro responsável”, sem prometer ART assinada pela autora.

## 6. Critérios de aceitação do motor

Antes da interface:

1. unidade invariável: o mesmo caso em SI deve produzir o mesmo resultado após conversão para BTU/h;
2. caso sem janela, ocupantes, iluminação, equipamentos e ar externo deve produzir apenas condução;
3. aumentar área de janela ou irradiância nunca reduz a carga solar;
4. aumentar pessoas aumenta sensível, latente e ar de renovação;
5. fator de segurança de 0% reproduz a carga-base;
6. mudança de orientação altera somente a parcela solar;
7. renovação e infiltração aparecem separadas;
8. entradas inválidas geram erro explícito, nunca zero silencioso;
9. resultados de referência serão testados com tolerância definida para cada componente;
10. os testes não tratarão a regra dos 600 BTU/h/m² como verdade de engenharia.

## 7. Plano das próximas etapas

1. **Prompt 2:** implementar dados climáticos versionados, psicrometria mínima, motor puro e testes `node --test`.
2. **Prompt 3:** formulário acessível, validação, resumo e gráficos simples sem framework.
3. **Prompt 4:** PDF com entradas, hipóteses, parcelas, fontes e aviso legal.
4. **Prompt 5:** Supabase com apenas anon key no navegador, RLS de INSERT, consentimento LGPD e CTAs.
5. **Prompt 6:** GitHub Pages, workflow, README, métricas de cálculos e pedidos de projeto.

## Fontes consultadas

- Cópia local: `NBR 16401/abnt-nbr-16401-1-2024.pdf`, seção 5 e Anexo A.
- Cópia local: `NBR 16401/abnt-nbr-16401-3-2024.pdf`, seção 5 e Tabela 1.
- Cópia local: `planilhas/planilha-de-carga-termica-nbr-16401-atualizada-1_compress.pdf`.
- Lei 13.589/2018: https://www2.camara.leg.br/legin/fed/lei/2018/lei-13589-4-janeiro-2018-786057-publicacaooriginal-154702-pl.html
- Portaria MS 3.523/1998: https://bvsms.saude.gov.br/bvs/saudelegis/gm/1998/prt3523_28_08_1998.html
- INMET, Normais Climatológicas do Brasil 1991–2020: https://portal.inmet.gov.br/normais
- INMET, BDMEP: https://bdmep.inmet.gov.br/

## 8. Regra de bolso, capacidades e PMOC

### 8.1 Comparação com 600 BTU/h

A comparação de mercado será calculada separadamente do método físico:

```text
Q_600 = 600 × área_m²
      + 600 × max(pessoas - 1, 0)
      + 600 × quantidade_de_equipamentos
```

O primeiro ocupante não gera parcela adicional; cada pessoa extra e cada equipamento cadastrado gera 600 BTU/h. “Equipamento” significa item da lista, não cada watt consumido. A diferença percentual será:

```text
diferença_% = 100 × (Q_projeto_BTU/h - Q_600) / Q_600
```

Mostrar sinal e legenda: valor positivo significa que o cálculo físico excede a regra; valor negativo significa que a regra excede o cálculo. Se `Q_600` for zero, não calcular percentual: exibir “não aplicável”.

### 8.2 Capacidades comerciais

Tabela de referência da interface:

| Capacidade nominal | BTU/h | TR aproximada |
|---:|---:|---:|
| 9.000 | 9.000 | 0,75 |
| 12.000 | 12.000 | 1,00 |
| 18.000 | 18.000 | 1,50 |
| 22.000/24.000 | 24.000 | 2,00 |
| 30.000 | 30.000 | 2,50 |
| 36.000 | 36.000 | 3,00 |
| 48.000 | 48.000 | 4,00 |
| 57.000/60.000 | 60.000 | 5,00 |

Conversões internas:

```text
BTU/h = W × 3,412141633
TR = BTU/h / 12.000
```

Fonte das conversões: NIST SP 811, *Guide for the Use of the International System of Units*, conversão de energia; a equivalência prática de 1 TR = 12.000 BTU/h é a definição frigorífica usual documentada no ASHRAE Handbook. A capacidade recomendada é a primeira da tabela maior ou igual à carga de projeto. Acima de 60.000 BTU/h, não arredondar para um equipamento inexistente: sugerir dois ou mais aparelhos, dividir por zonas e exigir avaliação de responsável técnico.

### 8.3 Avisos de PMOC

- Residência unifamiliar sem uso coletivo: não exibir obrigação automática; manter o aviso geral de que o cálculo é preliminar.
- Uso público ou coletivo com ambiente artificialmente climatizado: exibir que a Lei 13.589/2018 exige PMOC para o edifício, conforme seu art. 1º.
- Carga total igual ou superior a 60.000 BTU/h (5 TR): exibir recomendação de avaliação por responsável técnico habilitado e de PMOC conforme a regulamentação aplicável. O texto não deve sugerir que a ferramenta substitui o profissional.

A Portaria MS 3.523/1998 estabelece medidas de manutenção e controle da qualidade do ar e deve ser citada junto com a Lei 13.589/2018. O limite de 60.000 BTU/h é tratado pela aplicação como gatilho de comunicação comercial/técnica; a obrigação de PMOC deve continuar condicionada ao uso e à legislação aplicável.

## 9. Estrutura de pastas e módulos

```text
calc-carga-termica/
├── docs/
│   ├── METODO.md
│   └── PROGRESSO.md
├── src/
│   ├── calc.js       # funções puras, sem DOM ou rede
│   ├── clima-pg.js   # cidades, proxy, frequência e fontes
│   ├── psicrometria.js
│   ├── ui.js         # formulário, validação e renderização
│   ├── pdf.js        # documento técnico via jsPDF CDN
│   └── leads.js      # Supabase e consentimento LGPD
├── tests/
│   ├── calc.test.js
│   └── fixtures.js
├── supabase/
│   └── schema.sql
├── index.html
├── privacidade.html
├── styles.css
├── README.md
└── .github/workflows/deploy.yml
```

`calc.js` deve receber e devolver objetos serializáveis e não acessar `window`, `document`, Supabase ou CDN. `ui.js` converte campos para SI antes da chamada. `pdf.js` recebe um resultado já calculado. `leads.js` nunca recebe a chave service-role.

## 10. Contrato JSON

Exemplo mínimo de entrada:

```json
{
  "cidade": "Ponta Grossa",
  "clima": {"frequencia": "1%", "estacaoProxy": "Curitiba-Afonso-Pena"},
  "ambiente": {"uso": "comercial", "areaM2": 30, "peDireitoM": 2.8},
  "interno": {"temperaturaC": 24, "umidadeRelativa": 0.5},
  "envoltoria": {
    "paredesExternasM2": 30,
    "tetoM2": 30,
    "janelas": [{"areaM2": 6, "orientacao": "N", "vidro": "simples", "protecao": "nenhuma"}]
  },
  "pessoas": {"quantidade": 5, "atividade": "escritorio"},
  "iluminacao": {"wPorM2": 10},
  "equipamentos": [{"tipo": "computador", "quantidade": 3, "potenciaW": 120}],
  "ar": {"renovacaoLpsPessoa": 7, "renovacaoLpsM2": 0.4, "infiltracaoACH": 0.5},
  "fatorSeguranca": 0.1
}
```

Exemplo de saída:

```json
{
  "cargasW": {
    "sensivel": 4200,
    "latente": 900,
    "base": 5100,
    "projeto": 5610
  },
  "projeto": {"btuPorHora": 19141, "tr": 1.595},
  "comparacao600": {"btuPorHora": 24000, "diferencaPercentual": -20.2},
  "componentesW": {
    "solarVidros": 1200,
    "conducao": 600,
    "pessoasSensivel": 375,
    "pessoasLatente": 275
  },
  "capacidadeSugeridaBtuPorHora": 24000,
  "avisos": ["Estimativa preliminar. Não substitui projeto de climatização com ART."]
}
```

Os números desse exemplo de saída são somente de forma; o motor deverá recalculá-los e os testes deverão comparar cada componente.

## 11. Coeficientes e sua origem

Para evitar falsa precisão, cada constante terá `valor`, `unidade`, `fonte`, `escopo` e `observacao`. A origem será classificada assim:

| Item | Valor usado nos casos | Origem/documentação |
|---|---:|---|
| TBS/TBU/ΔTBS externos | 28,8/20,2/9,4 °C | NBR 16401-1:2024, Tabela A.4, Curitiba/Afonso Pena, frequência 1% |
| Temperatura/UR internas | 24 °C/50% | hipótese de conforto para demonstração; confirmar com NBR 16401-2 e programa do ambiente |
| `U` parede | 1,80 W/(m²·K) | hipótese didática compatível com ordem de grandeza de parede; substituir pela composição calculada conforme NBR 15220 |
| `U` teto | 1,50 W/(m²·K) | hipótese didática; substituir pela composição conforme NBR 15220 |
| `U` vidro simples | 2,80 W/(m²·K) | hipótese didática de catálogo; confirmar pelo fabricante |
| Irradiância equivalente O/L/N | 500/450/250 W/m² | hipótese de fechamento manual inspirada no método solar do ASHRAE Fundamentals; não é tabela normativa |
| Fator proteção | nenhuma 1,0; cortina 0,60 | hipótese didática; proteção real depende de abertura, tecido e instalação |
| Ganho pessoa sentado | 75/55 W sensível/latente | ordem de grandeza de tabela de ganhos internos do ASHRAE Fundamentals; confirmar para temperatura/atividade |
| Iluminação | 5/10/8 W/m² | hipótese de densidade instalada para os exemplos; não declarar como exigência NBR |
| Computador | 120 W sensível por unidade | preset didático editável; substituir pela potência medida ou placa do fabricante |
| `ρ` e `cp` | 1,20 kg/m³ e 1.006 J/(kg·K) | propriedades aproximadas do ar; ASHRAE Fundamentals |
| Renovação | 7 L/(s·pessoa) + 0,4 L/(s·m²) | NBR 16401-3:2024, Tabela 1, linha de escritório; nos casos é hipótese de referência, não universal |
| Margem | 10% | decisão de produto; não é exigência normativa |

Os valores marcados como hipótese não podem ser apresentados como “coeficientes da NBR”. O professor/projetista deve validar ou substituir esses valores antes da publicação.

## 12. Casos de teste calculados à mão

Os casos abaixo são fechamentos didáticos determinísticos, não projetos executivos. Para preencher dados omitidos no enunciado, foi adotado pé-direito de 2,8 m, paredes externas conforme indicado, teto igual à área do piso, temperatura interna de 24 °C, proxy externo de 28,8 °C e os coeficientes da seção 11. Para simplificar a conferência manual, a parcela de ar usa apenas sensível `ρ × V × cp × ΔT`; a implementação atual mantém a parcela latente do ar em zero até a psicrometria por entalpia ser implementada. A condução pelos vidros, entretanto, é incluída no motor e nos fechamentos abaixo.

### Caso 1 — quarto, 12 m²

Hipóteses: 3 m × 4 m, duas paredes externas de 3 m e 4 m, janela oeste de 1,5 m² sem proteção, 2 pessoas sentadas, iluminação de 5 W/m², sem equipamentos, renovação de 7 L/(s·pessoa), infiltração de 0,5 ACH. Parede externa líquida = `(3 + 4) × 2,8 - 1,5 = 18,1 m²`; teto = 12 m²; volume = 33,6 m³.

```text
Solar = 1,5 × 500 × 1,00 = 750 W
Condução parede = 1,8 × 18,1 × (28,8 - 24) = 156,38 W
Condução teto = 1,5 × 12 × 4,8 = 86,40 W
Condução vidro = 2,8 × 1,5 × 4,8 = 20,16 W
Pessoas sensível = 2 × 75 = 150 W
Pessoas latente = 2 × 55 = 110 W
Iluminação = 12 × 5 = 60 W
Ar renovação = 1,20 × 0,014 × 1.006 × 4,8 = 81,00 W
Ar infiltração = 1,20 × (0,5 × 33,6 / 3600) × 1.006 × 4,8 = 26,87 W

Sensível base = 750 + 156,38 + 86,40 + 20,16 + 150 + 60 + 81,12 + 27,04
              = 1.331,10 W
Latente base = 110 W
Total base = 1.441,10 W
Total projeto (10%) = 1.585,22 W
BTU/h = 1.585,22 × 3,412141633 = 5.409 BTU/h
TR = 5.409 / 12.000 = 0,451 TR
```

Regra de bolso: `600 × 12 + 600 × (2 - 1) = 7.800 BTU/h`. Diferença: `(5.409 - 7.800) / 7.800 = -30,7%`. Capacidade comercial sugerida: **9.000 BTU/h**.

### Caso 2 — sala comercial, 30 m²

Hipóteses: 5 m × 6 m, duas paredes externas de 5 m e 6 m, vidro norte de 6 m², 5 pessoas sentadas, 3 computadores de 120 W, iluminação de 10 W/m², renovação de `0,4 L/(s·m²) + 7 L/(s·pessoa)`, infiltração de 0,5 ACH. Parede líquida = `(5 + 6) × 2,8 - 6 = 24,8 m²`; teto = 30 m²; volume = 84 m³.

```text
Solar = 6 × 250 × 1,00 = 1.500 W
Condução parede = 1,8 × 24,8 × 4,8 = 214,27 W
Condução teto = 1,5 × 30 × 4,8 = 216,00 W
Condução vidro = 2,8 × 6 × 4,8 = 80,64 W
Pessoas sensível = 5 × 75 = 375 W
Pessoas latente = 5 × 55 = 275 W
Iluminação = 30 × 10 = 300 W
Computadores = 3 × 120 = 360 W
Vazão externa = (0,4 × 30 + 7 × 5) L/s = 0,047 m³/s
Ar renovação = 1,20 × 0,047 × 1.006 × 4,8 = 272,21 W
Ar infiltração = 1,20 × (0,5 × 84 / 3600) × 1.006 × 4,8 = 67,18 W

Sensível base = 1.500 + 214,27 + 216 + 80,64 + 375 + 300 + 360 + 272,34 + 67,60
              = 3.385,95 W
Latente base = 275 W
Total base = 3.660,95 W
Total projeto (10%) = 4.027,05 W
BTU/h = 4.027,05 × 3,412141633 = 13.741 BTU/h
TR = 13.741 / 12.000 = 1,145 TR
```

Regra de bolso: `600 × 30 + 600 × 4 + 600 × 3 = 22.200 BTU/h`. Diferença: `(13.741 - 22.200) / 22.200 = -38,1%`. Capacidade comercial sugerida: **18.000 BTU/h**.

### Caso 3 — consultório, 20 m²

Hipóteses: 4 m × 5 m, duas paredes externas de 4 m e 5 m, janela leste de 2 m² com cortina interna, 3 pessoas sentadas, iluminação de 8 W/m², sem equipamento adicional, renovação de 7 L/(s·pessoa), infiltração de 0,5 ACH. Parede líquida = `(4 + 5) × 2,8 - 2 = 23,2 m²`; teto = 20 m²; volume = 56 m³.

```text
Solar = 2 × 450 × 0,60 = 540 W
Condução parede = 1,8 × 23,2 × 4,8 = 200,45 W
Condução teto = 1,5 × 20 × 4,8 = 144,00 W
Condução vidro = 2,8 × 2 × 4,8 = 26,88 W
Pessoas sensível = 3 × 75 = 225 W
Pessoas latente = 3 × 55 = 165 W
Iluminação = 20 × 8 = 160 W
Ar renovação = 1,20 × 0,021 × 1.006 × 4,8 = 121,86 W
Ar infiltração = 1,20 × (0,5 × 56 / 3600) × 1.006 × 4,8 = 44,79 W

Sensível base = 540 + 200,45 + 144 + 26,88 + 225 + 160 + 121,69 + 45,07
              = 1.463,09 W
Latente base = 165 W
Total base = 1.628,09 W
Total projeto (10%) = 1.790,90 W
BTU/h = 1.790,90 × 3,412141633 = 6.111 BTU/h
TR = 6.111 / 12.000 = 0,509 TR
```

Regra de bolso: `600 × 20 + 600 × (3 - 1) = 13.200 BTU/h`. Diferença: `(6.111 - 13.200) / 13.200 = -53,7%`. Capacidade comercial sugerida: **9.000 BTU/h**.

### Conferência dos fechamentos

| Caso | Sensível base (W) | Latente base (W) | Total base (W) | Projeto +10% (W) | Saída BTU/h | Saída TR |
|---|---:|---:|---:|---:|---:|---:|
| Quarto | 1.331,10 | 110,00 | 1.441,10 | 1.585,22 | 5.409 | 0,451 |
| Sala comercial | 3.385,95 | 275,00 | 3.660,95 | 4.027,05 | 13.741 | 1,145 |
| Consultório | 1.463,09 | 165,00 | 1.628,09 | 1.790,90 | 6.111 | 0,509 |

## 13. Dúvidas técnicas para validar antes do Prompt 2

1. A fonte climática oficial a ser publicada será o proxy Curitiba/Afonso Pena ou uma estação/série específica de Ponta Grossa obtida no INMET/BDMEP?
2. O professor aceita usar os valores didáticos de irradiância, U, ganhos internos e proteção apenas para testes, desde que a interface os identifique como hipóteses?
3. A condição interna padrão deve ser 24 °C/50% UR para todos os usos ou variar por ocupação?
4. O ar externo dos exemplos deve usar a linha de escritório da NBR 16401-3 ou tabelas específicas para quarto e consultório?
5. A carga latente do ar externo será obrigatória já no Prompt 2, com psicrometria completa, antes dos testes de interface?
6. A regra de 600 por equipamento deve contar itens da lista ou potência instalada agrupada?
7. Para cargas acima de 60.000 BTU/h, a interface deve sugerir dois aparelhos iguais ou apenas encaminhar para projeto por zonas?
8. Os textos jurídicos e comerciais devem ser revisados por responsável técnico e profissional de privacidade antes da publicação?
#	Dúvida	Minha recomendação
1	Fonte climática	Por enquanto, Curitiba/Afonso Pena como substituta de Ponta Grossa. O clima é parecido e o valor está na tabela da norma e da ASHRAE. Na tela e no PDF, deixe escrito: "dados de projeto: Curitiba (estação de referência mais próxima)". Numa versão 2, calcule os percentis 0,4%/1% a partir da série horária do INMET de Ponta Grossa. Isso daria um ótimo diferencial e até um post.
2	Valores didáticos	Sim, desde que identificados. Na interface, "valor típico adotado" com a fonte. Só não chame de "cálculo pela NBR" um número que não vem da norma. Use "baseado na NBR 16401" em vez de "conforme".
3	Condição interna	24 °C / 50% UR fixo para todos os usos no MVP. Está dentro da faixa de conforto de verão da norma e simplifica. Deixe configurável no código, mas fora da interface.
4	Ar externo	Uma tabela por tipo de uso, com os valores da NBR 16401-3 (Fp por pessoa + Fa por m²). Escritório e consultório simples usam a linha de escritório. Quarto e residência usam uma renovação mínima ou infiltração. Avise que clínicas com procedimentos seguem a NBR 7256, fora do escopo da ferramenta.
5	Latente do ar externo	Sim, já no Prompt 2, mas simplificado: q_lat = 3010 · Q(m³/s) · Δw(kg/kg), com a umidade absoluta calculada do TBS/TBU por fórmula. Não precisa de psicrometria completa. Sem isso, consultórios e salas cheias ficam subdimensionados.
6	Regra dos 600	Contar itens. É assim que o mercado usa ("+600 por pessoa, +600 por eletrônico"), e o objetivo é justamente mostrar o erro da regra.
7	Acima de 60.000 BTU/h	Mostrar só como indicação ("ex.: 2 × 30.000 BTU/h") e destacar o CTA "isso exige projeto por zonas e responsável técnico". Essa faixa é o lead mais valioso, então a ferramenta não deve parecer que resolve sozinha.
8	Revisão dos textos	Sim, uma revisão rápida. O aviso técnico passa por um engenheiro registrado (professor ou parceiro). A política de privacidade pode partir de um modelo de LGPD para pequenos negócios. Para esse porte, não é obrigatório ter encarregado de dados (DPO).