# Arquitetura

## Objetivo

O Chef Familiar e agora uma aplicacao mobile-first para gerir receitas,
inventario, planeamento semanal, compras e regras familiares a partir de um
iPhone com Expo Go.

## Camadas

- `mobile/src/app`: rotas e ecras Expo Router.
- `mobile/src/components`: componentes React Native partilhados.
- `mobile/src/constants`: tema visual e constantes de layout.
- `mobile/src/hooks`: hooks comuns.
- `mobile/src/lib`: integracoes de infraestrutura, tipos, formatters e servicos
  de dominio sobre Supabase.
- `supabase`: schema, seeds e migracoes SQL.

## Estado funcional

O mobile ja contem uma base operacional sem IA:

- dashboard com contadores e resumos reais
- receitas com lista, detalhe e edicao
- inventario com criacao, edicao e soft delete
- plano semanal com criacao, substituicao de entradas e remocao
- compras com lista ativa, marcacao de comprado e desfazer compra
- regras familiares com CRUD simples

Tambem existe um contrato inicial para propostas do futuro assistente de IA,
mas o copiloto ainda nao esta exposto na interface.

## Expo

O projeto deve permanecer em Expo SDK 54 enquanto o dispositivo de teste usar
Expo Go limitado a SDK 54. Antes de alterar dependencias Expo, confirmar a tabela
de compatibilidade da documentacao versionada do SDK 54.

Versoes base esperadas:

- Expo SDK 54
- React Native 0.81
- React 19.1
- Node.js 20.19 ou superior

## Supabase

O cliente mobile usa variaveis publicas do Expo:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

A app mobile nunca deve incluir `service_role` keys. Tabelas expostas pela Data
API devem ter RLS e grants coerentes com o modelo de acesso.

## Removido

A implementacao Next.js/Vercel foi removida para evitar duas superficies de app
no mesmo repo. Qualquer funcionalidade antiga que ainda for necessaria deve ser
reimplementada no mobile, preferencialmente por ecran e com verificacao contra o
schema Supabase.
