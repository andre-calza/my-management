# Gestao de Equipes

Sistema desktop local e offline para Windows, construido com Electron, React, TypeScript, Vite, SQLite, better-sqlite3, Tailwind CSS e Electron Builder.

## Requisitos

- Node.js 20+
- npm

## Comandos

```bash
npm install
npm run dev
npm run build
npm run dist
```

O banco SQLite e criado automaticamente na primeira execucao, com dados de exemplo e conflitos propositalmente cadastrados para validacao dos alertas.

## Estrutura

- `src/main`: Electron main process, IPC, banco e services.
- `src/renderer`: React, paginas, componentes e cliente IPC.
- `src/shared`: tipos e constantes compartilhados.
