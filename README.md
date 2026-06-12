# Chef Familiar

Aplicacao mobile Expo para planeamento alimentar familiar, receitas, inventario,
lista de compras e regras da familia.

## Stack

- Expo SDK 54
- React Native 0.81
- Expo Router
- Supabase
- GitHub

## Estrutura

- `mobile/`: app Expo usada no iPhone com Expo Go SDK 54.
- `supabase/`: schema, seeds e migracoes da base de dados.

O codigo antigo da app web Next.js/Vercel foi removido. O repo passa a ter o
mobile como superficie principal.

## Setup local

```bash
cd mobile
npm install
cp .env.example .env
npm run start
```

Preenche `mobile/.env` com:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Usa apenas a anon/publishable key no cliente mobile. Nunca colocar service role
keys no Expo.

## Scripts

```bash
cd mobile
npm run start
npm run ios
npm run android
npm run typecheck
```

Todos os scripts de arranque usam `--tunnel` por omissao, para o iPhone nao
depender da rede local.

## Estado atual

- Estrutura Expo mobile criada.
- SDK alinhado para Expo Go SDK 54.
- Cliente Supabase base configurado em `mobile/src/lib/supabase.ts`.
- Ecras iniciais existem para inventario, receitas, plano, compras e regras.
- As leituras/escritas reais do Supabase ainda devem ser ligadas e validadas por
  ecran.
