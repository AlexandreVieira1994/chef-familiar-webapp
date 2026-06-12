# Chef Familiar Mobile

App Expo/React Native do Chef Familiar.

## Requisitos

- Node.js 20.19 ou superior
- npm
- Expo Go com suporte a SDK 54

## Instalar

```bash
npm install
cp .env.example .env
```

Preenche `.env` com a URL e anon/publishable key do Supabase.

## Correr

```bash
npm run start
```

O script arranca sempre com `--tunnel`.

Depois abre o QR code no Expo Go.

## Verificacoes

```bash
npm run typecheck
npx expo-doctor
```

## Notas

- O projeto esta fixado em Expo SDK 54 por compatibilidade com o iPhone de
  teste.
- O cliente Supabase fica em `src/lib/supabase.ts`.
- `EXPO_PUBLIC_*` fica visivel no bundle mobile; usar apenas chaves publicas.
- A app ja inclui dashboard e modulos reais para receitas, inventario, plano,
  compras e regras.
