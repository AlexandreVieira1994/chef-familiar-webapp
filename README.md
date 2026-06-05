# Chef Familiar Web App

Web app pessoal para planeamento alimentar familiar, receitas, inventario, lista de compras e BLW.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

## Setup 100% online

### 1. Supabase

1. Criar projeto em supabase.com.
2. Ir a SQL Editor.
3. Copiar e executar `supabase/schema.sql`.
4. Copiar e executar `supabase/seed.sql`.
5. Ir a Project Settings > API.
6. Copiar Project URL e anon public key.

### 2. Vercel

1. Criar conta em vercel.com.
2. Importar este repositorio GitHub.
3. Em Environment Variables adicionar:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - OPENAI_API_KEY, opcional para a fase inicial
   - OPENAI_MODEL, opcional
4. Fazer Deploy.

## Estado atual

- Dashboard criado.
- Pagina Receitas criada.
- Pagina Planeador criada.
- Pagina Compras criada.
- Pagina Inventario criada.
- Pagina Regras criada.
- Schema Supabase inicial criado.
- Seed inicial com receitas RF001 a RF015 criado.

## Proximos passos

1. Ligar paginas diretamente a Supabase.
2. Criar CRUD de receitas.
3. Criar CRUD de inventario.
4. Ativar gerador de plano com IA.
5. Gerar lista de compras automaticamente.
