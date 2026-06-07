# Planeamento

## Objetivo atual

Manter a app Chef Familiar estavel e utilizavel para planeamento alimentar familiar, com foco nos fluxos essenciais antes de expandir funcionalidades de IA.

## Prioridades

1. Validar producao depois de cada alteracao.
2. Manter inventario e compras fiaveis.
3. Melhorar planeador e receitas sem introduzir complexidade desnecessaria.
4. Refinar o assistente global apenas quando houver base solida para confirmar acoes com seguranca.
5. Melhorar responsividade e leitura visual nas paginas principais.

## Backlog curto

- Fazer QA completo em producao nas paginas principais.
- Validar mobile/responsivo em inventario, compras e planeador.
- Melhorar feedback visual para erros de server actions.
- Rever README para refletir estado real da app.
- Documentar qualquer migracao Supabase aplicada remotamente.

## Paginas principais para validar

- `/`
- `/recipes`
- `/planner`
- `/shopping`
- `/inventory`
- `/settings`

## Definicao de concluido

Uma tarefa so fica concluida quando:

- a alteracao esta implementada;
- os ficheiros alterados foram revistos;
- as validacoes possiveis foram executadas;
- o commit foi enviado para GitHub;
- a Vercel terminou o deployment;
- a app em producao foi testada nas areas afetadas;
- qualquer limitacao ficou registada.

## Decisoes pendentes

- Confirmar quando retomar o assistente IA como prioridade principal.
- Decidir se o planeador semanal deve ganhar uma vista calendario mais rica.
- Decidir se o inventario precisa de categorias editaveis pelo utilizador.
