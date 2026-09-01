# Study Tracker — Documentação de Arquitetura

> Guia técnico completo, escrito para que desenvolvedores e usuários curiosos entendam como o aplicativo funciona por dentro.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Analogia para leigos](#2-analogia-para-leigos)
3. [Stack tecnológica](#3-stack-tecnológica)
4. [Estrutura de pastas](#4-estrutura-de-pastas)
5. [Inicialização do aplicativo](#5-inicialização-do-aplicativo)
6. [Comunicação Front ↔ Back (IPC)](#6-comunicação-front--back-ipc)
7. [Camada de dados (Prisma + SQLite)](#7-camada-de-dados-prisma--sqlite)
8. [Fluxos principais](#8-fluxos-principais)
9. [Módulo de Cursos](#9-módulo-de-cursos)
10. [Sistema de Backup](#10-sistema-de-backup)
11. [Segurança do Electron](#11-segurança-do-electron)
12. [Build e distribuição](#12-build-e-distribuição)
13. [Glossário](#13-glossário)

---

## 1. Visão geral

O **Study Tracker** é um aplicativo **desktop** (Windows, Mac, Linux) para registrar horas de estudo, gerenciar cursos e acompanhar estatísticas.

Ele é construído com **Electron**, que combina duas partes:

| Parte                    | O que é                          | Tecnologia                      |
| ------------------------ | -------------------------------- | ------------------------------- |
| **Frontend (interface)** | Tudo que o usuário vê e clica    | React + TypeScript + Tailwind   |
| **Backend (motor)**      | Lógica, banco de dados, arquivos | Node.js + Electron Main Process |

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDY TRACKER (Electron)                  │
│                                                              │
│  ┌──────────────────────┐    IPC     ┌────────────────────┐ │
│  │   FRONTEND (React)   │ ◄────────► │  BACKEND (Node.js) │ │
│  │                      │            │                    │ │
│  │  • Páginas           │            │  • Handlers IPC    │ │
│  │  • Componentes       │            │  • Prisma ORM      │ │
│  │  • Hooks / Stores    │            │  • Backup (ZIP)    │ │
│  │  • Cronômetro        │            │  • Migrations      │ │
│  └──────────────────────┘            └─────────┬──────────┘ │
│                                                   │            │
│                                          ┌────────▼────────┐ │
│                                          │  SQLite (arquivo)│ │
│                                          └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Analogia para leigos

Imagine um **restaurante**:

- **Frontend (React)** = o salão onde o cliente faz o pedido no cardápio
- **Preload** = o garçom autorizado a levar pedidos à cozinha
- **Backend (Electron Main)** = a cozinha, onde os pratos são preparados
- **SQLite** = a despensa onde os ingredientes (dados) ficam guardados
- **IPC** = o bilhete de pedido que vai do salão à cozinha

O cliente **nunca entra na cozinha** diretamente (segurança). Ele só pode pedir através do garçom (preload), que entrega pedidos padronizados à cozinha (handlers).

---

## 3. Stack tecnológica

| Camada         | Tecnologias                                     |
| -------------- | ----------------------------------------------- |
| Desktop        | Electron 37                                     |
| UI             | React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Estado local   | Zustand (cronômetro, modo compacto)             |
| Roteamento     | React Router (HashRouter)                       |
| Banco de dados | SQLite via Prisma ORM                           |
| Validação      | Zod (compartilhado entre front e back)          |
| Build          | Vite 7 + electron-builder                       |
| Backup         | adm-zip (arquivos JSON compactados)             |

---

## 4. Estrutura de pastas

```
study-tracker/
├── electron/                  # BACKEND (processo principal)
│   ├── main/
│   │   ├── index.ts           # Ponto de entrada
│   │   ├── app.ts             # Ciclo de vida (iniciar, fechar, erros)
│   │   ├── database.ts        # Conexão Prisma + path do banco
│   │   ├── migrations.ts      # Aplica migrations SQL
│   │   ├── backup.ts          # Criar/restaurar backups ZIP
│   │   ├── attachments.ts     # Armazenamento de anexos (limite de 25 MB)
│   │   ├── paths.ts           # Caminhos do projeto (dev vs produção)
│   │   ├── prisma-client.ts   # Carrega Prisma no Electron
│   │   └── sqlite-introspection.ts
│   ├── ipc/
│   │   ├── index.ts           # Registra todos os handlers
│   │   ├── validate.ts        # Validação Zod nos handlers
│   │   └── handlers/          # Um arquivo por domínio
│   │       ├── sessions.handler.ts
│   │       ├── courses.handler.ts
│   │       ├── backup.handler.ts
│   │       ├── settings.handler.ts
│   │       └── window.handler.ts
│   ├── preload/
│   │   └── index.ts           # Ponte segura Front → Back
│   └── windows/
│       └── main-window.ts     # Janela principal + modo compacto
│
├── src/                       # FRONTEND (interface React)
│   ├── main.tsx               # Entrada React
│   ├── App.tsx                # Rotas e layouts
│   ├── pages/                 # Uma página por rota
│   ├── components/            # UI reutilizável
│   ├── hooks/                 # Lógica de dados (useSessions, etc.)
│   ├── stores/                # Estado global (Zustand)
│   ├── layouts/               # MainLayout e CompactLayout
│   ├── utils/                 # Formatação de data, tempo, formulários
│   └── services/
│       └── ipc-client.ts      # Cliente tipado da API Electron
│
├── shared/                    # CÓDIGO COMPARTILHADO (front + back)
│   ├── types/
│   │   ├── models.ts          # Interfaces TypeScript
│   │   └── ipc-channels.ts    # Nomes dos canais IPC
│   ├── schemas/               # Validação Zod
│   └── constants/             # Constantes (status de curso, etc.)
│
├── prisma/
│   ├── schema.prisma          # Modelos do banco
│   └── migrations/            # SQL de evolução do schema
│
└── database/                  # Banco SQLite em desenvolvimento
    └── study-tracker.db
```

---

## 5. Inicialização do aplicativo

Quando você abre o Study Tracker, esta sequência acontece:

```
Usuário clica no ícone
        │
        ▼
electron/main/index.ts
        │
        ├── setupAppLifecycle()     → registra handlers de erro e fechamento
        │
        └── initializeApp()
                │
                ├── app.whenReady()           → Electron pronto
                ├── registerAllIpcHandlers()  → "liga" os canais IPC
                ├── initializeDatabase()
                │       ├── applyMigrations() → cria/atualiza tabelas
                │       └── upsert settings   → garante config padrão
                ├── syncSettingsEffects()     → always-on-top, iniciar com Windows
                ├── runDailyBackupIfNeeded()    → backup automático (se configurado)
                └── createMainWindow()          → abre a janela com React
```

### Onde fica o banco de dados?

| Ambiente                        | Caminho                                    |
| ------------------------------- | ------------------------------------------ |
| Desenvolvimento (`npm run dev`) | `study-tracker/database/study-tracker.db`  |
| Produção (app instalado)        | `%APPDATA%/study-tracker/study-tracker.db` |

### Migrations (evolução do banco)

O app não usa `prisma migrate` em runtime. Ele tem um sistema próprio em `migrations.ts`:

1. Verifica uma tabela interna `_study_tracker_migrations`
2. Aplica migrations pendentes em ordem
3. Ignora erros de "coluna já existe" (idempotente)
4. Faz backup automático **antes** de cada migration (se pasta configurada)

---

## 6. Comunicação Front ↔ Back (IPC)

**IPC** = _Inter-Process Communication_ (comunicação entre processos).

O React roda em um processo isolado (renderer). O Node.js roda em outro (main). Eles não compartilham memória — precisam de mensagens.

### O caminho completo de uma requisição

Exemplo: **listar sessões de estudo**

```
┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────────┐   ┌────────┐
│ HistoryPage │ → │ useSessions  │ → │ ipcClient   │ → │ preload      │ → │ handler│
│  (React)    │   │   (hook)     │   │ .sessions   │   │ contextBridge│   │ sessions│
│             │   │              │   │ .list()     │   │              │   │ .handler│
└─────────────┘   └──────────────┘   └─────────────┘   └──────────────┘   └───┬────┘
                                                                               │
                                                                               ▼
                                                                          ┌────────┐
                                                                          │ Prisma │
                                                                          │ SQLite │
                                                                          └────────┘
```

### Passo a passo

1. **Página React** (`HistoryPage`) chama o hook `useSessions()`
2. **Hook** chama `ipcClient.sessions.list()`
3. **ipc-client.ts** chama `window.api.sessions.list()` (API exposta pelo preload)
4. **Preload** (`electron/preload/index.ts`) envia mensagem IPC:
   ```typescript
   ipcRenderer.invoke('session:list');
   ```
5. **Handler** (`sessions.handler.ts`) recebe, valida, consulta o banco:
   ```typescript
   ipcMain.handle('session:list', wrapIpcHandler(async () => {
     const sessions = await prisma.studySession.findMany(...)
     return sessions.map(mapSession)
   }))
   ```
6. Resposta volta pelo mesmo caminho até o React atualizar a tela

### Convenção de nomes dos canais

Padrão: `domínio:ação`

| Canal                   | Ação                             |
| ----------------------- | -------------------------------- |
| `session:create`        | Criar sessão                     |
| `session:list`          | Listar sessões                   |
| `course:create`         | Criar curso                      |
| `course:stats`          | Estatísticas de um curso         |
| `course-note:create`    | Criar anotação do caderno        |
| `course-attachment:add` | Anexar arquivo ao curso/anotação |
| `backup:create`         | Backup manual                    |
| `backup:restore`        | Restaurar backup                 |
| `settings:update`       | Salvar configurações             |
| `window:enter-compact`  | Modo cronômetro compacto         |

### Validação dupla (Zod)

Os mesmos schemas Zod em `shared/schemas/` são usados:

- **Frontend**: valida formulários antes de enviar
- **Backend**: valida novamente nos handlers (nunca confiar só no front)

```typescript
// shared/schemas/session.schema.ts
export const createSessionSchema = z.object({
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  durationSeconds: z.number().int().positive(),
  courseId: z.string().nullable().optional(),
});
```

### Contrato da API (`StudyTrackerApi`)

O arquivo `shared/types/models.ts` define **todas** as funções disponíveis:

```typescript
interface StudyTrackerApi {
  sessions: { create; update; delete; list };
  courses: { create; update; delete; list; get; stats };
  courseNotes: { list; create; update; delete };
  courseAttachments: { list; add; delete; read; open };
  backup: { create; list; validate; preview; restore; pickFile };
  settings: { get; update; pickBackupFolder };
  stats: { get };
  window: { enterCompact; exitCompact; setAlwaysOnTop; getCompactMode };
}
```

TypeScript garante que frontend, preload e handlers falem a mesma língua.

---

## 7. Camada de dados (Prisma + SQLite)

### Modelos

```
┌─────────────────┐       ┌─────────────────┐
│  StudySession   │       │     Course      │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ startedAt       │       │ name            │
│ endedAt         │──┐    │ platform        │
│ durationSeconds │  │    │ url             │
│ courseId? ──────┼──┘    │ instructor      │
│ createdAt       │  FK   │ category        │
└─────────────────┘       │ officialHours   │
                            │ status          │
┌─────────────────┐         │ priority        │
│   AppSettings   │         │ notes (Markdown)│
├─────────────────┤         │ tags (JSON)     │
│ weeklyGoalHours │         └─────────────────┘
│ theme           │
│ backupFolderPath│
│ backupOnQuit    │
│ autoBackupDaily │
└─────────────────┘
```

### Horas estudadas em um curso

**Não são armazenadas no banco.** São calculadas em tempo real:

```sql
SELECT SUM(durationSeconds) FROM StudySession WHERE courseId = ?
```

Isso garante que o número sempre reflita as sessões reais vinculadas.

---

## 8. Fluxos principais

### 8.1 Cronômetro (registrar sessão)

```
Dashboard → TimerCard
    │
    ├── Usuário seleciona curso (opcional) → course-select-store (localStorage)
    │
    ├── Clica "Iniciar"
    │       ├── timer-store: status = 'running'
    │       └── IPC window:enter-compact → janela encolhe no canto da tela
    │
    ├── Durante estudo: tick a cada 1s, persiste em localStorage (recupera se fechar)
    │
    └── Clica "Finalizar"
            ├── timer-store calcula duração
            ├── IPC session:create { startedAt, endedAt, durationSeconds, courseId }
            ├── handler salva no SQLite
            └── IPC window:exit-compact → janela volta ao normal
```

**Por que localStorage no cronômetro?** Se o app fechar acidentalmente durante o estudo, o tempo acumulado é recuperado na próxima abertura.

### 8.2 Histórico (editar/excluir sessão)

```
HistoryPage → useSessions() → session:list
    │
    ├── Editar → SessionFormDialog → session:update
    └── Excluir → DeleteSessionDialog → session:delete
```

### 8.3 Estatísticas

```
StatisticsPage → useStats() → stats:get
    │
    └── Handler agrega dados do SQLite:
            • hoje, semana, mês, ano
            • médias, maior sessão, dias estudados
            • progresso da meta semanal
```

### 8.4 Modo compacto

Quando o cronômetro inicia, a janela principal:

1. Salva posição/tamanho atuais
2. Anima (250ms) para 340×160px no canto inferior direito
3. React troca `MainLayout` por `CompactLayout` (widget minimalista)

Ao finalizar, o processo se inverte.

### 8.5 Configurações

```
SettingsPage → useSettings() → settings:get / settings:update
    │
    ├── Meta semanal, tema, always-on-top
    ├── Iniciar com Windows (via app.setLoginItemSettings)
    └── Backup (BackupSection) → backup:*
```

---

## 9. Módulo de Cursos

### Página `/courses`

- **CRUD completo** via `courses.handler.ts`
- Formulário com todos os campos (nome, plataforma, URL, instrutor, etc.)
- Tags armazenadas como JSON string no SQLite: `'["python","backend"]'`
- Anotações em texto livre (Markdown)

### Estatísticas por curso

Endpoint `course:stats` retorna:

| Métrica                      | Cálculo                                          |
| ---------------------------- | ------------------------------------------------ |
| Horas estudadas              | Soma de `durationSeconds` das sessões vinculadas |
| % concluído                  | `horas_estudadas / officialHours × 100`          |
| Tempo médio/sessão           | `total_segundos / quantidade_sessões`            |
| Última sessão                | Sessão mais recente por `startedAt`              |
| Tempo desde última atividade | `agora - endedAt da última sessão`               |
| Histórico                    | Lista completa de sessões do curso               |

### Caderno de anotações e anexos

Cada curso tem um **caderno** com várias anotações (`CourseNote`) e **anexos** (`CourseAttachment`):

| Recurso              | Comportamento                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| Anotações            | Título + conteúdo livre, uma lista por curso                                                              |
| Anexos               | Vinculados ao curso e, opcionalmente, a uma anotação específica                                           |
| Limite               | 25 MB por arquivo (`attachments.ts`)                                                                      |
| Armazenamento        | Arquivo copiado para uma pasta privada do app, com nome higienizado                                       |
| Chave (`storageKey`) | `<courseId>/<attachmentId>_<nome-higienizado>`                                                            |
| Abertura             | Pré-visualização no app (`course-attachment:read`) ou no programa padrão do SO (`course-attachment:open`) |

Ao excluir um curso, suas anotações e anexos são removidos em cascata (`onDelete: Cascade`), inclusive
a pasta de arquivos no disco.

| Ambiente        | Pasta de anexos                               |
| --------------- | --------------------------------------------- |
| Desenvolvimento | `database/course-attachments/`                |
| Produção        | `%APPDATA%/study-tracker/course-attachments/` |

### Vinculação sessão ↔ curso

- No cronômetro: `courseId` enviado no `session:create`
- Na edição: `SessionFormDialog` permite alterar o curso
- Ao excluir curso: sessões permanecem, `courseId` vira `null` (onDelete: SetNull)

---

## 10. Sistema de Backup

### Filosofia

> Os dados do usuário são críticos. O SQLite não é a única fonte da verdade.

### Formato do arquivo

```
backup-2026-07-07-18-30-15.zip
├── manifest.json      → versão, data, checksums SHA-256
├── sessions.json      → todas as sessões
├── courses.json       → todos os cursos
├── settings.json      → configurações
└── categories.json    → categorias únicas extraídas dos cursos
```

### Quando o backup acontece

| Gatilho            | Configuração                       |
| ------------------ | ---------------------------------- |
| Manual             | Botão em Configurações             |
| Diário automático  | `autoBackupDaily` (padrão: ligado) |
| Ao fechar app      | `backupOnQuit` (padrão: desligado) |
| Antes de migration | Sempre (se pasta configurada)      |

### Restauração

1. Usuário seleciona arquivo `.zip`
2. `backup:preview` → valida checksums + mostra contagem de registros
3. Usuário escolhe módulos (sessões, cursos, configurações)
4. `backup:restore` → substitui dados selecionados no SQLite

### Retenção

Mantém as **50 versões** mais recentes; versões antigas são removidas automaticamente.

---

## 11. Segurança do Electron

O app segue as boas práticas do Electron:

| Configuração       | Valor   | Por quê                                               |
| ------------------ | ------- | ----------------------------------------------------- |
| `contextIsolation` | `true`  | React não acessa Node.js diretamente                  |
| `nodeIntegration`  | `false` | Impede scripts maliciosos de usar `fs`, etc.          |
| `sandbox`          | `true`  | Processo renderer isolado                             |
| `contextBridge`    | preload | Expõe **apenas** funções específicas via `window.api` |

O React **nunca** importa Prisma, `fs` ou `electron` diretamente. Tudo passa pelo preload.

---

## 12. Build e distribuição

### Desenvolvimento

```bash
npm run dev
```

- Vite serve React em `http://localhost:5173`
- Electron carrega essa URL
- Hot reload automático

### Produção

```bash
npm run build:win
```

1. `prisma generate` → gera cliente Prisma
2. `vite build` → compila React + Electron
3. `electron-builder` → gera instalador NSIS

**Output:** `release/Study Tracker-Setup-1.0.0.exe`

### Empacotamento especial

- Engines do Prisma (`.node`) ficam em `app.asar.unpacked` (pastas com `.` são ignoradas pelo asar)
- Migrations SQL vão em `extraResources/prisma/`

---

## 13. Glossário

| Termo               | Significado simples                                            |
| ------------------- | -------------------------------------------------------------- |
| **Electron**        | Framework que cria apps desktop com tecnologias web            |
| **IPC**             | Sistema de mensagens entre frontend e backend                  |
| **Preload**         | Script de ponte segura entre os dois processos                 |
| **Handler**         | Função no backend que responde a um pedido IPC                 |
| **Prisma**          | Ferramenta que facilita falar com o banco de dados             |
| **SQLite**          | Banco de dados em um único arquivo no disco                    |
| **Migration**       | Script que evolui a estrutura do banco (novas tabelas/colunas) |
| **Zod**             | Biblioteca de validação de dados                               |
| **Hook**            | Função React que encapsula lógica reutilizável                 |
| **Store (Zustand)** | Estado global da interface (ex: cronômetro)                    |
| **Renderer**        | Processo onde roda o React (a interface)                       |
| **Main Process**    | Processo Node.js com acesso ao sistema                         |

---

## Diagrama resumido

```
                    USUÁRIO
                      │
                      ▼
              ┌───────────────┐
              │  React (UI)   │
              │  pages/hooks  │
              └───────┬───────┘
                      │ window.api.*
              ┌───────▼───────┐
              │    Preload    │  ← única ponte autorizada
              └───────┬───────┘
                      │ ipcRenderer.invoke
              ┌───────▼───────┐
              │  IPC Handlers │  ← validação Zod
              │  + Prisma     │
              └───────┬───────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    SQLite       Backup ZIP    Sistema (janela,
    (dados)      (JSON)        pasta, startup)
```

---

_Documentação gerada para Study Tracker v1.0.0_
