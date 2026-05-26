# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS v4 + Wouter + TanStack Query

## Apps

- **FinanceApp** (`artifacts/financeapp`) — Personal finance web app in Brazilian Portuguese
  - Tela 1: Dashboard com saldo, receitas, despesas e gastos por categoria
  - Tela 2: Cadastro de despesa com grid de categorias
  - Tela 3: Histórico de transações com filtros e paginação
  - Tela 4: Cadastro de receita com pré-visualização e recorrência
  - Tela 5: Gerenciador de categorias com ícone e cor personalizada
- **API Server** (`artifacts/api-server`) — Express REST API with routes for transactions, categories, dashboard

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## DB Schema

- `categories` — default and custom transaction categories
- `transactions` — income and expense transactions with category references

## Notes on Codegen

After running `orval`, the `lib/api-zod/src/index.ts` is overwritten with only `export * from "./generated/api"` to avoid duplicate export conflicts. This is handled automatically by the codegen script.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
