# Codex handoff - Chef Familiar

## 2026-06-06

Projeto: Chef Familiar Webapp
Workspace local: `C:\Users\remotedesk\OneDrive\Projetos\chef-familiar-webapp\chef-familiar-webapp`
GitHub: `https://github.com/AlexandreVieira1994/chef-familiar-webapp`
Producao Vercel: `https://chef-familiar-webapp.vercel.app`

## Objetivo atual

A prioridade atual e garantir que a app tem as tarefas essenciais a funcionar bem antes de investir mais no assistente IA completo.

Foco validado ate agora:
- gestao de inventario;
- adicao, edicao e remocao de entradas;
- agrupamento por ingrediente com varios lotes/entradas dentro de cada ingrediente;
- lista de compras;
- marcar compras como compradas;
- desfazer compras;
- planeador de receitas para gerar lista de compras;
- navegacao e estabilidade das paginas principais.

O assistente IA global ja existe visualmente, mas ainda nao e a prioridade para refinamento funcional.

## Estado de producao

Ultimo commit validado em producao:

`fb92bac Improve planner and shopping flows`

Estado Vercel:

- Projeto Vercel: `chef-familiar-webapp`
- Team: `team_YZZS9AFpiPnUzzcio5L06SEr`
- Project ID: `prj_yHKyQtQ7CikxWA7hLUH0NsdjdRMw`
- Deployment do commit `fb92bac`: `READY`
- Target: `production`

Paginas verificadas em producao:

- `/`
- `/recipes`
- `/planner`
- `/shopping`
- `/inventory`
- `/settings`

Resultado da ultima ronda:

- todas carregaram com `main` presente;
- sem erros/warnings de consola;
- sem texto corrompido visivel;
- assistente global presente em todas;
- H1s corretos;
- planeador, compras e inventario testados com fluxos reais.

## Alteracoes implementadas

### Inventario

O inventario passou a mostrar ingredientes agrupados.

Dentro de cada ingrediente aparecem as varias entradas/lotes, para ser possivel distinguir:

- quantidade inicial;
- quantidade restante;
- unidade;
- categoria;
- origem;
- local de armazenamento;
- data de validade;
- notas.

Foram adicionados hooks estaveis de teste no inventario, incluindo linhas de entrada.

Comportamento importante:

- entradas com `status = "removido"` nao aparecem como inventario ativo;
- entradas com `quantity_remaining <= 0` tambem nao contam para resumo/stock disponivel;
- remocao de inventario e feita por soft remove, nao por delete fisico.

Motivo: RLS/Supabase tornou delete fisico pouco fiavel. A estrategia segura e atualizar:

- `status = "removido"`
- `quantity_remaining = 0`

Arquivos relevantes:

- `app/inventory/page.tsx`
- `app/inventory/actions.ts`

### Lista de compras

Foi implementado fluxo para marcar item como comprado.

Ao marcar como comprado:

- cria uma entrada em `inventory_entries`;
- preenche quantidade comprada;
- preserva unidade comprada;
- estima validade;
- estima local de armazenamento;
- marca item da lista como `comprado`;
- guarda referencia `inventory_entry_id`.

Ao desfazer:

- a entrada de inventario criada pela lista e anulada por soft remove;
- o item de compras volta para `nao_comprado`;
- `purchased_quantity` e `inventory_entry_id` voltam a `null`.

Correcao importante:

- antes, unidades como `c. sopa` podiam cair para `un`;
- agora a UI preserva unidades planeadas fora da lista padrao;
- a action aceita unidades seguras e curtas, nao apenas uma whitelist rigida.

Estado visual melhorado:

- `nao_comprado` aparece como `Nao comprado`;
- `comprado` aparece como `Comprado`.

Arquivos relevantes:

- `app/shopping/page.tsx`
- `app/shopping/actions.ts`

### Planeador

O planeador gera listas de compras a partir de receitas selecionadas.

Correcao aplicada:

- se nenhuma receita estiver selecionada, o botao fica desativado;
- aparece mensagem: `Seleciona pelo menos uma receita para gerar a lista.`;
- ao selecionar uma receita, o botao ativa.

Foi criado um componente client pequeno para gerir este estado:

- `components/recipe-picker-form.tsx`

Arquivo de pagina:

- `app/planner/page.tsx`

### Assistente IA

O plano inicial previa um assistente natural para inventario/compras.

Estado atual:

- barra global do assistente esta visivel;
- entrada textual existe;
- foco atual mudou para garantir operacoes essenciais da app;
- nao continuar a aprofundar assistente IA antes de nova validacao das tarefas essenciais, salvo pedido explicito.

Nota do utilizador:

- como tem assinatura ChatGPT, a preferencia mudou para usar OpenAI em vez de Vercel AI Gateway para a feature de IA;
- ainda assim, Vercel continua importante para deploy.

## Commits importantes

Commits ja enviados para `main`:

- `118ce0a Group inventory entries by ingredient`
- `0dfd3fa Make inventory removal reliable`
- `0eadb87 Soft remove inventory entries when undoing purchases`
- `59d2fd6 Add stable inventory test hooks`
- `fb92bac Improve planner and shopping flows`

## Validacoes realizadas

### Inventario

Fluxos testados:

- adicionar entrada manual;
- editar quantidade;
- remover entrada;
- adicionar varios ingredientes por texto livre;
- remover entradas criadas para QA;
- confirmar que entradas removidas nao aparecem como ativas;
- confirmar que compras desfeitas nao deixam entradas ativas no inventario.

Exemplos usados em QA:

- `Teste QA Banana`
- `Teste QA Cenoura`
- `Teste QA Ovo`

Essas entradas foram removidas no fim dos testes.

### Compras

Fluxo testado:

- item `Azeite`, quantidade `2`, unidade `c. sopa`;
- unidade apareceu corretamente como `c. sopa`;
- item marcado como comprado;
- item passou para estado `Comprado`;
- botao `Desfazer` apareceu;
- desfazer voltou o item para `Nao comprado`;
- inventario nao mostrou entrada ativa da compra desfeita.

### Planeador

Fluxo testado:

- sem receitas selecionadas: botao desativado;
- mensagem de selecao obrigatoria visivel;
- ao selecionar uma receita, botao ativou;
- pagina sem erros de consola.

### Paginas

Paginas testadas:

- dashboard;
- receitas;
- detalhe de receita;
- planeador;
- compras;
- inventario;
- regras familiares.

Sem erros de consola durante as rondas finais.

## Ferramentas e notas operacionais

Git pode nao estar no PATH. Usar caminho absoluto:

`C:\Program Files\Git\cmd\git.exe`

Exemplo:

```powershell
& 'C:\Program Files\Git\cmd\git.exe' status --short
```

Node/npm:

- `npm` nao estava disponivel localmente;
- o node em `WindowsApps` deu `Acesso negado`;
- a validacao principal de build foi feita pelo deploy da Vercel.

Browser:

- plugin Browser esta disponivel;
- usar browser para validar producao em `https://chef-familiar-webapp.vercel.app`;
- o browser por vezes fica preso com locators Playwright avancados;
- quando isso acontecer, usar DOM visivel ou leituras diretas da pagina.

Vercel:

- conector Vercel esta disponivel;
- usar para listar teams, projetos e deployments;
- deploys por push para `main` ja estao ligados ao GitHub.

Supabase:

- a app usa Supabase;
- preservar soft remove em inventario por causa de RLS;
- antes de alterar schemas ou politicas, confirmar o impacto em producao.

## Proximos passos recomendados

1. Fazer novo ciclo QA completo em producao.
2. Testar fluxo de receitas com feedback sem poluir dados, ou usando entrada de teste removivel.
3. Melhorar UX visual da tabela de compras, porque os campos ainda ficam visualmente colados em leituras de texto.
4. Adicionar melhor feedback para erros de server actions quando Supabase falha.
5. Validar mobile/responsivo, especialmente inventario e compras.
6. So depois retomar assistente IA com OpenAI.

## Prompt recomendado para nova sessao

Ler este ficheiro primeiro:

`logbook/codex-handoff.md`

Depois continuar com:

```text
Continua o trabalho na app Chef Familiar a partir do logbook. Faz novo ciclo de QA na app inteira em producao, identifica correcoes/melhorias, aplica apenas alteracoes de escopo controlado, faz commit/push para GitHub e valida o deploy na Vercel.
```

### Atualizacao posterior no mesmo dia

Pedido do utilizador:

- rever a web app outra vez;
- remover redundancias;
- em especial, deixar o estado dos ingredientes automatico;
- iniciar a pagina de ingredientes com ingredientes colapsados;
- melhorar o aspeto das entradas/lotes.

Alteracoes aplicadas:

- criado `lib/inventory-status.ts` para estado automatico de inventario;
- estado de inventario deixou de ser escolhido manualmente na UI;
- lotes com validade vencida passam a ser tratados como expirados automaticamente;
- lotes expirados deixam de contar para o planeador e para o contexto do assistente;
- remocao por soft remove continua preservada com `status = "removido"`;
- pagina de inventario inicia ingredientes colapsados;
- painel de cada ingrediente so mostra os lotes ao abrir;
- entradas/lotes deixaram de ser tabela larga e passaram a cartoes editaveis;
- estados tecnicos de receitas foram humanizados em receitas, detalhe e planeador.

Commits desta ronda:

- `8775897 Simplify inventory status and lot display`
- `c4a9287 Fix collapsed inventory lot panels`

Validacao em producao:

- deployment Vercel do commit `c4a9287` ficou `READY`;
- `/inventory` sem erros/warnings de consola;
- ingredientes fechados por defeito;
- lotes escondidos com altura 0 quando o ingrediente esta fechado;
- abrir ingrediente mostra os lotes em cartoes;
- nao existe `select[name="status"]` dentro do inventario;
- `/planner` mostra estados humanos como `Por testar` e `Aprovada`;
- `/recipes` mostra estado atual humanizado, mantendo o seletor de avaliacao rapida por ser feedback humano.

### Atualizacao - assistente compacto e entrada manual

Pedido do utilizador:

- colapsar por defeito a aba de entrada manual no inventario;
- remover a entrada de texto livre do inventario, porque o assistente esta disponivel globalmente;
- transformar o assistente global numa notacao circular no fundo da pagina;
- clique simples abre a entrada de texto;
- manter premido inicia ditado/escuta;
- testar o assistente e corrigir o que impedisse funcionamento basico.

Alteracoes aplicadas:

- removido o card `Adicionar por texto` da pagina de inventario;
- `Adicionar entrada manual` passou a ser um painel `details` fechado por defeito;
- reduzido o padding inferior global porque deixou de haver barra fixa larga do assistente;
- `components/assistant-bar.tsx` foi refeito como botao flutuante circular no canto inferior direito;
- clique no botao abre/fecha um painel compacto com textarea, sugestoes, resposta e confirmacoes;
- long press tenta usar Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`) em `pt-PT`;
- se voz nao estiver disponivel no browser, o painel mostra fallback e continua a aceitar texto;
- fluxo de confirmacao do assistente manteve `Confirmar`, `Corrigir` e `Cancelar`.

Correcao de infraestrutura:

- a API do assistente falhava em producao porque a tabela `assistant_action_logs` nao existia no Supabase remoto;
- aplicada migracao remota no projeto Supabase `wfccmjfgosgqknzjeqhz` para criar `assistant_action_logs` com RLS e policies publicas de leitura/insercao/atualizacao;
- depois da migracao, `/api/assistant` voltou a criar propostas com `logId`;
- uma proposta de teste foi rejeitada via `/api/assistant/confirm` para nao alterar dados reais.
- tambem foi aplicada/confirmada no Supabase remoto a tabela `meal_plan_entries`, porque o worktree inclui a evolucao do planeador semanal.

Validacoes feitas antes de commit:

- `POST /api/assistant` com `O que falta comprar?` respondeu com itens pendentes da lista ativa;
- `POST /api/assistant` com `Comprei 1 kg batata e 6 ovos` gerou proposta com confirmacao obrigatoria;
- `POST /api/assistant/confirm` com `decision = reject` cancelou a proposta de teste;
- validacao local de build nao foi possivel porque `npm` nao esta disponivel nesta sessao; usar Vercel para validacao final.
