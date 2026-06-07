# Regras e instrucoes para o Codex

## Regra principal

Depois de qualquer alteracao de codigo ou conteudo:

1. Rever os ficheiros alterados.
2. Executar validacoes locais quando as ferramentas estiverem disponiveis.
3. Fazer commit.
4. Fazer push para GitHub.
5. Aguardar o deployment da Vercel ficar `READY`.
6. Testar a app em producao antes de considerar a tarefa concluida.

Se alguma ferramenta local nao estiver disponivel, registar a limitacao na resposta final e continuar a validacao por GitHub/Vercel quando possivel.

## Contexto a ler primeiro

No inicio de uma sessao de trabalho neste projeto:

1. Ler `AGENTS.md`.
2. Ler `logbook/codex-handoff.md`.
3. Ler `logbook/planning.md`.
4. Consultar `logbook/project-log.md` para perceber a ultima sessao.

## Git

O comando `git` pode nao estar no PATH. Quando isso acontecer, usar:

```powershell
& 'C:\Program Files\Git\cmd\git.exe' status --short
```

Manter commits pequenos e com mensagem clara. Nao reverter alteracoes existentes sem pedido explicito do utilizador.

## Vercel

A app esta ligada a deploy por push para GitHub.

Producao:

```text
https://chef-familiar-webapp.vercel.app
```

Depois do push, confirmar que o deployment do commit ficou pronto e validar as paginas afetadas em producao.

## Supabase

Preservar a estrategia de soft remove no inventario:

- `status = "removido"`
- `quantity_remaining = 0`

Nao alterar schema, RLS ou policies sem confirmar impacto e sem registar a razao.

## Produto

Prioridade da app:

1. Fluxos essenciais de inventario, compras, receitas e planeador.
2. Estabilidade e clareza visual.
3. Assistente IA apenas quando os fluxos base estiverem solidos ou quando houver pedido explicito.

Evitar funcionalidades grandes sem necessidade. Preferir melhorias pequenas, testaveis e com impacto direto.
