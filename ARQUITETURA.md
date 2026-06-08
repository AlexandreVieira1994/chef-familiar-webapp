# Arquitetura da App

Este ficheiro descreve a arquitetura atual da app Chef Familiar, as suas funcionalidades e os principais fluxos de dados. Deve ser atualizado sempre que forem adicionadas novas paginas, tabelas, integracoes ou regras de negocio relevantes.

## Visao geral

Chef Familiar e uma web app pessoal para planeamento alimentar familiar. A app junta receitas com fonte externa, inventario de ingredientes, plano de refeicoes, lista de compras, regras familiares e um assistente natural com IA.

O fluxo principal e:

1. Registar ingredientes existentes no inventario.
2. Escolher ou gerar um plano de refeicoes com base nas receitas disponiveis.
3. Gerar uma lista de compras descontando o que ja existe no inventario.
4. Marcar compras como compradas para criar entradas novas no inventario.
5. Usar regras familiares e feedback de receitas para orientar escolhas futuras.

## Stack tecnica

- Next.js App Router.
- React e TypeScript.
- Tailwind CSS para estilos.
- Supabase como base de dados Postgres e API de dados.
- OpenAI API para o assistente natural.
- Vercel para alojamento e deploy.

## Estrutura de pastas

- `app/`: rotas, paginas, server actions e API routes.
- `components/`: componentes reutilizaveis de interface.
- `lib/`: clientes, helpers de dominio e logica do assistente.
- `lib/ai/`: contexto, tipos, cliente OpenAI e execucao de propostas do assistente.
- `supabase/`: schema, seeds e migrations SQL.
- `logbook/`: notas de planeamento e handoff do projeto.

## Rotas e funcionalidades

### `/`

Dashboard principal. Mostra o fluxo sugerido da app, atalhos para inventario, planeador, receitas e regras, e um calendario de receitas para os proximos 14 dias com base em `meal_plan_entries`.

### `/recipes`

Lista receitas carregadas da tabela `recipes`. Mostra codigo, nome, categoria, fonte externa, custo, estado, notas e imagem. Permite atualizar rapidamente o estado da receita.

Estados suportados:

- `por_testar`
- `aprovada`
- `neutra`
- `a_melhorar`
- `rejeitada`

### `/recipes/[code]`

Detalhe de uma receita. Carrega a receita pelo seu `code`, ingredientes associados em `recipe_ingredients`, historico de feedback, imagem, fonte original e passos derivados das notas.

Tambem permite atualizar estado e notas da receita.

### `/planner`

Planeador de refeicoes. Permite:

- Ver refeicoes planeadas nos proximos dias.
- Adicionar uma refeicao manualmente por data, momento do dia e receita.
- Remover entradas do plano.
- Gerar plano automatico entre 1 e 14 dias.
- Escolher momentos do dia: pequeno-almoco, almoco, lanche e jantar.
- Escolher estilo de receitas: simples, requintadas, arrojadas ou aproveitamento.
- Gerar lista de compras a partir do plano.

O planeador exclui receitas rejeitadas e privilegia receitas com `source_url`.

### `/inventory`

Inventario de ingredientes. Permite:

- Listar entradas agrupadas por nome de ingrediente.
- Ver lotes, quantidades, unidades, validade, local, categoria e notas.
- Adicionar entradas manuais.
- Atualizar entradas existentes.
- Remover uma entrada individual ou varias entradas selecionadas.
- Calcular automaticamente estados como disponivel, expirado ou sem stock.

Remocoes sao soft deletes: a entrada fica com `quantity_remaining = 0`, `status = removido` e uma nota de remocao.

### `/shopping`

Lista de compras ativa. Mostra a lista mais recente em `shopping_lists` e os itens associados em `shopping_list_items`.

Permite:

- Ver ingredientes em falta, quantidade planeada, categoria, estado e notas.
- Marcar um item como comprado.
- Criar automaticamente uma entrada em `inventory_entries` ao marcar comprado.
- Desfazer uma compra, removendo logicamente a entrada de inventario criada pela lista.

### `/settings`

Pagina de regras familiares. Permite editar regras em texto, uma por linha. As regras sao guardadas em `family_rules` e usadas pelo planeador automatico e pelo assistente.

### `/api/assistant`

Endpoint POST que recebe mensagem, historico e pagina atual. Chama `createAssistantProposal` para responder em texto ou criar uma proposta executavel.

### `/api/assistant/confirm`

Endpoint POST que aprova ou rejeita uma proposta pendente do assistente. Quando aprovada, executa a acao registada em `assistant_action_logs` e revalida paginas afetadas.

## Modelo de dados

As tabelas principais estao definidas em `supabase/schema.sql`.

### `recipes`

Guarda receitas importadas. Campos relevantes:

- `code`: identificador unico visivel, como `RF001`.
- `name`, `category`, `status`.
- `prep_time_min`, `cook_time_min`, `cost_level`.
- `notes`.
- `feedback_notes`, `last_feedback_at`, `feedback_history`.
- `image_url`.
- `source_url`, obrigatorio e validado como URL HTTP/HTTPS.

### `recipe_ingredients`

Ingredientes associados a receitas:

- `recipe_id`.
- `ingredient_name`.
- `quantity`, `unit`.
- `category`.
- `optional`.
- `image_url`.

### `inventory_entries`

Lotes de ingredientes existentes em casa:

- `entry_date`.
- `ingredient_name`.
- `quantity_initial`, `quantity_remaining`.
- `unit`, `category`, `source`.
- `expiry_date`, `storage_location`.
- `status`, `notes`.

### `shopping_lists`

Listas de compras:

- `start_date`, `end_date`.
- `status`, por exemplo `ativa` ou `substituida`.
- `created_at`.

### `shopping_list_items`

Itens de uma lista de compras:

- `shopping_list_id`.
- `ingredient_name`.
- `planned_quantity`, `planned_unit`.
- `category`.
- `purchased_status`.
- `purchased_quantity`.
- `inventory_entry_id`, quando a compra cria uma entrada no inventario.
- `notes`.

### `meal_plan_entries`

Plano de refeicoes:

- `planned_date`.
- `meal_slot`.
- `recipe_id`.
- `notes`.

### `family_rules`

Regras familiares usadas pela IA e pelo planeador:

- `rule_key`.
- `rule_value`.

### `recipe_feedback`

Historico normalizado de feedback de receitas:

- `recipe_id`.
- `status`.
- `rating`.
- `notes`.

### `assistant_action_logs`

Registo das propostas do assistente:

- `user_message`.
- `interpreted_intent`.
- `proposed_payload`.
- `status`: `proposed`, `approved`, `rejected`, `executed` ou `failed`.
- `result`.
- `error`.

## Fluxos de dados principais

### Inventario

1. O utilizador cria ou atualiza entradas em `/inventory`.
2. Server actions em `app/inventory/actions.ts` validam input e escrevem em `inventory_entries`.
3. Helpers em `lib/inventory-status.ts` calculam se uma entrada esta disponivel, expirada, sem stock ou removida.
4. A pagina e revalidada com `revalidatePath`.

### Planeamento

1. O utilizador cria entradas manualmente ou pede plano automatico em `/planner`.
2. `app/planner/actions.ts` le receitas, regras familiares, inventario e historico recente.
3. Receitas rejeitadas sao excluidas.
4. O gerador ordena candidatos por aproveitamento de ingredientes a expirar, repeticao recente, estilo pedido, estado da receita e codigo.
5. O plano e gravado em `meal_plan_entries`.

### Lista de compras

1. A lista pode ser gerada a partir de receitas ou do plano.
2. A app soma ingredientes de `recipe_ingredients`.
3. O inventario utilizavel e descontado por ingrediente e unidade.
4. A lista ativa anterior passa para `substituida`.
5. A nova lista e criada em `shopping_lists` e os itens em `shopping_list_items`.
6. Ao marcar comprado, a app cria uma entrada em `inventory_entries` e associa-a ao item comprado.

### Feedback de receitas

1. O utilizador avalia receitas em `/recipes` ou `/recipes/[code]`.
2. `app/recipes/actions.ts` atualiza o estado da receita.
3. A ultima nota fica em `feedback_notes`.
4. O historico recente fica em `feedback_history`.
5. Um registo tambem e criado em `recipe_feedback`.

### Regras familiares

1. O utilizador edita regras em `/settings`.
2. A app apaga as regras existentes e grava ate 30 linhas novas em `family_rules`.
3. As regras sao usadas pelo planeador e pelo assistente.

## Assistente com IA

O assistente esta sempre presente no layout atraves de `AssistantBar`.

Componentes principais:

- `app/api/assistant/route.ts`: recebe pedidos de chat.
- `lib/ai/context.ts`: carrega regras, receitas, inventario utilizavel e lista de compras ativa.
- `lib/ai/assistant.ts`: interpreta mensagens, cria respostas ou propostas.
- `lib/ai/actions.ts`: grava, aprova, rejeita e executa propostas.
- `app/api/assistant/confirm/route.ts`: confirma ou rejeita propostas pela interface.

Acoes executaveis atuais:

- Adicionar entradas ao inventario.
- Marcar item da lista de compras como comprado.
- Criar ou alterar um plano simples de refeicoes.

O assistente nao executa imediatamente operacoes persistentes. Primeiro grava uma proposta em `assistant_action_logs` e exige confirmacao na interface.

Regras importantes do assistente:

- Responde em portugues europeu.
- Usa o contexto real da app.
- Nao inventa receitas novas.
- Apenas usa receitas com fontes externas verificaveis.
- Se faltar `OPENAI_API_KEY`, responde com erro funcional em vez de chamar a API.

## Configuracao e ambientes

Variaveis esperadas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`, opcional. Por omissao: `gpt-5.4-mini`.

Quando a Supabase nao esta configurada, `getSupabase()` devolve `null`. As paginas continuam a renderizar, mas sem dados reais, e algumas acoes persistentes falham com erro de configuracao.

## Regras de seguranca atuais

O schema ativa RLS nas tabelas principais. As policies atuais sao publicas para leitura e, em varias tabelas, tambem para escrita. Isto e aceitavel apenas para uma app pessoal ou ambiente controlado. Antes de expor a app a utilizadores externos, sera necessario rever autenticacao, permissoes e policies.

## Deploy

O projeto esta preparado para deploy na Vercel. O fluxo esperado e:

1. Alterar codigo ou conteudo.
2. Fazer commit.
3. Fazer push para GitHub.
4. Aguardar o deploy da Vercel associado ao commit.
5. Testar a app no URL deployado.

## Limitacoes conhecidas

- Nao existe autenticacao de utilizadores na app.
- As policies Supabase sao permissivas.
- O inventario compara ingredientes por nome e unidade normalizados, nao por uma entidade canonica de ingrediente.
- A lista de compras nao converte unidades equivalentes, por exemplo gramas para quilos.
- O gerador automatico de plano usa heuristicas locais, nao um motor de otimizacao completo.
- As receitas devem vir de fontes externas; a app bloqueia criacao livre de receitas pelo assistente.
