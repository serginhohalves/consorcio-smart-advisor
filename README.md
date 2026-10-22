# Consórcio Smart Advisor

Simulador mobile-first para comparar **consórcio** e **financiamento**.

## Stack

- Vite + React + TypeScript (strict)
- Tailwind CSS
- Vitest (testes), oxlint (lint), Prettier (formatação)
- GitHub Actions (CI)

## Arquitetura

```
src/
├── core/          # Regras de negócio em TypeScript puro (sem React)
│   ├── domain/    # Entidades e tipos
│   ├── use-cases/ # Cálculos (consórcio, financiamento, comparação)
│   └── index.ts   # API pública do core
├── ui/            # Componentes React
└── shared/        # Utilitários (formatadores BRL / %)
```

O `core/` não depende de React nem do navegador. A UI apenas consome o core.
Valores monetários são representados em **centavos (inteiros)**.

## Scripts

| Comando             | O que faz                   |
| ------------------- | --------------------------- |
| `npm run dev`       | Servidor de desenvolvimento |
| `npm test`          | Testes (Vitest)             |
| `npm run lint`      | Lint (oxlint)               |
| `npm run typecheck` | Checagem de tipos           |
| `npm run format`    | Formata o código (Prettier) |
| `npm run build`     | Build de produção           |
