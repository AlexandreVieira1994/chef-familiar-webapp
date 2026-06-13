# Chef Familiar

Aplicacao mobile Expo para planeamento alimentar familiar, receitas, inventario,
lista de compras e regras da familia.

Este README e a documentacao principal do repo. A app vive em `mobile/`; os
ficheiros de documentacao duplicados dentro dessa pasta foram removidos para
evitar divergencias.

## Stack

- Expo SDK 54, compativel com Expo Go SDK 54
- React Native 0.81
- Expo Router
- TypeScript
- Supabase

## Estrutura

- `mobile/`: aplicacao Expo/React Native e dependencias da app.
- `supabase/`: schema, seeds e migrations da base de dados.
- `AGENTS.md`: instrucoes operacionais para agentes e contribuidores.
- `ARQUITETURA.md`: visao tecnica mais detalhada.
- `package.json`: scripts de conveniencia que delegam para `mobile/`.
- `mobile/package.json`: manifest real da app Expo, com dependencias e scripts
  usados pelo Expo.

O codigo antigo da app web Next.js/Vercel foi removido. O repo passa a ter o
mobile como superficie principal.

## Setup Local

```bash
cd mobile
npm install
cp .env.example .env
```

Preenche `mobile/.env` com:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Usa apenas a anon/publishable key no cliente mobile. Nunca colocar service role
keys no Expo, porque variaveis `EXPO_PUBLIC_*` ficam visiveis no bundle mobile.

## Comandos

Na raiz do repo:

```bash
npm run start
npm run ios
npm run android
npm run lint
npm run typecheck
```

Ou diretamente na app:

```bash
cd mobile
npm run start
npm run ios
npm run android
npm run lint
npm run typecheck
npx expo-doctor
```

Todos os scripts de arranque usam `--tunnel` por omissao, para o iPhone nao
depender da rede local.

## Estado Atual

- Estrutura Expo mobile criada.
- SDK alinhado para Expo Go SDK 54.
- Cliente Supabase base configurado em `mobile/src/lib/supabase.ts`.
- Dashboard com resumos reais de receitas, inventario, compras, regras e
  proximas refeicoes.
- Modulos operacionais para receitas, inventario, plano semanal, compras e
  regras familiares.
- Camada de servicos/tipos mobile criada para preparar a futura integracao do
  copiloto de IA.
