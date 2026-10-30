# Métricas da calculadora

As consultas prontas estão em [supabase/metricas.sql](../supabase/metricas.sql). Execute-as no **SQL Editor** do Supabase com uma conta autorizada a ler as tabelas. A chave pública `anon` não possui permissão de `SELECT`.

## Indicadores

- **Cálculos por semana:** volume de uso e média de BTU/h.
- **Leads por interesse:** pedidos de `projeto` e `pmoc`, agrupados por semana.
- **Taxa cálculo → lead:** considera leads cujo `calculo_id` aponta para um cálculo registrado. Leads enviados antes do registro do cálculo podem ficar sem vínculo e não entram nessa taxa.
- **Origem:** agrupa `utm_source` e `utm_campaign` registrados no campo `origem`; acessos sem UTM aparecem como `direto/sem UTM`.
- **Diferença média:** média percentual de `(cálculo técnico - regra dos 600) / regra dos 600 × 100`. Valor negativo indica que o cálculo técnico ficou abaixo da regra de bolso.

## Uso editorial

A diferença média pode orientar conteúdos educativos, como Reels que expliquem por que área, pessoas, insolação, equipamentos e renovação de ar alteram a capacidade necessária. Ela é uma métrica de comunicação e não valida, sozinha, o dimensionamento de um projeto.

## Permissões

O dashboard deve ser consultado no painel do Supabase ou por uma camada administrativa protegida. O front-end público recebe apenas permissão de `INSERT`, conforme [supabase/schema.sql](../supabase/schema.sql).
