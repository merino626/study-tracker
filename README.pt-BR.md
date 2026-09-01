<div align="center">

<img src="build/icon.png" alt="Study Tracker" width="120" />

# Study Tracker

**Aplicativo desktop para registrar horas de estudo, gerenciar cursos online e acompanhar o progresso real — sem conta, sem nuvem, sem telemetria.**

[![Electron](https://img.shields.io/badge/Electron-37-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-local-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-green.svg)](LICENSE)

[English](README.md) · **Português (BR)**

### [⬇️ Baixar para Windows](https://github.com/merino626/study-tracker/releases/latest)

</div>

---

## Índice

- [Download](#download)
- [Capturas de tela](#capturas-de-tela)
- [Por que eu criei este projeto](#por-que-eu-criei-este-projeto)
- [Funcionalidades](#funcionalidades)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como rodar](#como-rodar)
- [Scripts disponíveis](#scripts-disponíveis)
- [Onde ficam os seus dados](#onde-ficam-os-seus-dados)
- [Formato do backup](#formato-do-backup)
- [Modelo de segurança](#modelo-de-segurança)
- [Roadmap](#roadmap)
- [Licença](#licença)

---

## Download

| Plataforma              | Arquivo                                                                                                     | Link                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Windows 10/11 (x64)** | `Study Tracker-Setup-1.0.0.exe` (instalador NSIS)                                                           | **[Baixar a versão mais recente](https://github.com/merino626/study-tracker/releases/latest)** |
| macOS / Linux           | Os alvos `.dmg` / `.AppImage` já estão configurados no `electron-builder.yml`, mas ainda não são publicados | [Gerar você mesmo](#build-de-produção)                                                         |

> O instalador não é assinado digitalmente (certificado de code signing é pago), então o SmartScreen do
> Windows pode exibir o aviso _"O Windows protegeu o computador"_. Clique em **Mais informações →
> Executar assim mesmo**, ou compile a partir do código-fonte com `npm run build:win`.

O instalador permite escolher a pasta de instalação e criar atalhos na área de trabalho e no Menu Iniciar.

---

## Capturas de tela

<!--
  Coloque suas capturas em docs/screenshots/ e descomente o bloco abaixo.
  Sugestões: dashboard.png, timer-compact.png, courses.png,
  course-detail.png, statistics.png, settings.png

| Dashboard | Cronômetro compacto |
|-----------|---------------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Cronômetro compacto](docs/screenshots/timer-compact.png) |

| Cursos | Estatísticas |
|--------|--------------|
| ![Cursos](docs/screenshots/courses.png) | ![Estatísticas](docs/screenshots/statistics.png) |
-->

_Capturas em breve — coloque seus PNGs em [`docs/screenshots/`](docs/screenshots/) e descomente a galeria neste arquivo._

---

## Por que eu criei este projeto

A maioria das ferramentas de acompanhamento de estudos é web, exige cadastro, cobra assinatura ou manda
seus dados para algum servidor. Eu queria algo que:

- **iniciasse o cronômetro em um clique** e saísse da frente enquanto eu estudo;
- **ligasse cada minuto registrado a um curso real**, para eu saber o quanto de fato já avancei;
- **mantivesse 100% dos dados na minha máquina**, em um arquivo SQLite que eu posso copiar para onde quiser;
- **nunca perdesse nada** — backups em ZIP com checksum, automáticos e restauráveis.

Ele também funciona como uma vitrine completa de um aplicativo Electron com estrutura de produção:
contrato de IPC totalmente tipado, validação dupla com Zod, um executor de migrations idempotente feito
à mão e um subsistema de backup com verificação por checksum.

---

## Funcionalidades

### ⏱️ Cronômetro com modo compacto

- Iniciar / pausar / finalizar em um clique. O tempo decorrido é gravado no `localStorage` a cada
  segundo, então um fechamento acidental ou uma queda do app nunca perde a sessão em andamento.
- Ao iniciar o cronômetro, a janela **encolhe com animação para um widget de 340×160 px** fixado no
  canto inferior direito da tela, ficando visível sem cobrir o material que você está estudando.
- Opção _sempre visível_ (always on top), para o widget flutuar sobre o navegador ou o player de vídeo.
- É possível vincular a sessão a um curso antes de começar; o último curso escolhido fica memorizado.

### 📚 Gerenciamento de cursos

- CRUD completo com nome, plataforma (Udemy, Alura, Coursera, YouTube, LinkedIn Learning, Pluralsight,
  Domestika, Outro), URL, instrutor, categoria, carga horária oficial e datas de início / conclusão.
- **Status** (não iniciado · em andamento · concluído · pausado) e **prioridade** (baixa · média · alta).
- Nota pessoal, tags livres (armazenadas como array JSON) e anotações em Markdown.
- **Estatísticas por curso**: horas estudadas, percentual concluído em relação à carga horária oficial,
  tempo médio por sessão, última sessão, tempo desde a última atividade e o histórico completo.
- Excluir um curso nunca apaga o seu histórico — as sessões vinculadas apenas perdem a referência ao
  curso (`onDelete: SetNull`).

### 📓 Caderno de anotações e anexos

- Um caderno com várias anotações por curso, cada uma com título e conteúdo livre.
- Anexos de arquivos (até 25 MB cada) vinculados ao curso ou a uma anotação específica. Os arquivos são
  copiados para o diretório privado do aplicativo, com nomes higienizados e uma chave de armazenamento
  gerada automaticamente.
- Os anexos podem ser visualizados dentro do app ou abertos no programa padrão do sistema operacional.

### 📊 Dashboard e estatísticas

- Totais de hoje / semana / mês / ano, calculados em tempo real a partir da tabela de sessões.
- Barra de progresso da meta semanal, com alvo configurável (padrão: 20 h/semana).
- Cards de insight: médias gerais, maior sessão, quantidade de dias estudados e recorte por período.
- As horas estudadas **nunca são desnormalizadas** — são sempre agregadas das sessões reais, então os
  números não têm como sair de sincronia.

### 🗂️ Histórico

- Lista cronológica de todas as sessões, com edição (início, fim, duração, curso vinculado) e diálogo de
  confirmação antes de excluir.

### 💾 Backup e restauração

- Os backups são **arquivos ZIP contendo JSON**, mais um `manifest.json` com checksum SHA-256 de cada arquivo.
- Quatro gatilhos: manual, diário automático, ao fechar o app (opcional) e **sempre antes de uma migration**.
- A restauração é guiada: validar checksums → pré-visualizar a contagem de registros → escolher quais
  módulos (sessões, cursos, configurações) restaurar.
- As 50 versões mais recentes são mantidas; as antigas são removidas automaticamente.

### 🎨 Interface

- Tema claro / escuro / do sistema, via `next-themes`.
- Construída com shadcn/ui + primitivos Radix, então diálogos, switches e tooltips já são acessíveis.
- Opção de _iniciar junto com o Windows_.

---

## Stack tecnológica

| Camada         | Tecnologia                                                                              |
| -------------- | --------------------------------------------------------------------------------------- |
| Desktop        | **Electron 37** (divisão main / preload / renderer)                                     |
| UI             | **React 19**, **TypeScript 5.8**, **Tailwind CSS 4**, shadcn/ui, Radix UI, lucide-react |
| Estado local   | **Zustand** (cronômetro, modo compacto, seleção de curso)                               |
| Roteamento     | React Router 7 (`HashRouter`, necessário no protocolo `file://`)                        |
| Banco de dados | **SQLite** através do **Prisma ORM 6**                                                  |
| Validação      | Schemas **Zod** compartilhados entre renderer e main                                    |
| Datas          | date-fns                                                                                |
| Backup         | adm-zip + checksums SHA-256                                                             |
| Build          | **Vite 7**, vite-plugin-electron, **electron-builder** (NSIS / DMG / AppImage)          |
| Qualidade      | ESLint 9 (flat config), Prettier 3 + prettier-plugin-tailwindcss, `tsc --noEmit`        |

---

## Arquitetura

O processo renderer **nunca** toca em Node.js, `fs`, `electron` ou Prisma. Toda operação passa por uma
ponte estreita e totalmente tipada, exposta pelo script de preload.

```
                       USUÁRIO
                          │
                  ┌───────▼────────┐
                  │  React (UI)    │   páginas · componentes · hooks · stores Zustand
                  └───────┬────────┘
                          │ window.api.*        (contrato tipado StudyTrackerApi)
                  ┌───────▼────────┐
                  │    Preload     │   única ponte autorizada (contextBridge)
                  └───────┬────────┘
                          │ ipcRenderer.invoke('dominio:acao')
                  ┌───────▼────────┐
                  │ Handlers IPC   │   validação Zod → regra de negócio
                  │   + Prisma     │
                  └───────┬────────┘
             ┌────────────┼─────────────┐
             ▼            ▼             ▼
        Arquivo       Backup ZIP    Integração com o SO
        SQLite        (JSON+hash)   (janela, diálogos, startup)
```

### Sequência de inicialização

```
electron/main/index.ts
   ├── setupAppLifecycle()             → tratamento de erros, hooks de encerramento
   └── initializeApp()
         ├── app.whenReady()
         ├── registerAllIpcHandlers()  → registra todos os canais 'dominio:acao'
         ├── initializeDatabase()
         │      ├── applyMigrations()  → executor idempotente próprio
         │      └── upsert das configurações padrão
         ├── syncSettingsEffects()     → always-on-top, iniciar com o Windows
         ├── runDailyBackupIfNeeded()
         └── createMainWindow()
```

### Convenção dos canais IPC

Os canais seguem o padrão `domínio:ação` e são declarados uma única vez, em um objeto const, em
[`shared/types/ipc-channels.ts`](shared/types/ipc-channels.ts):

| Domínio             | Canais                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| `session`           | `create`, `update`, `delete`, `list`                                     |
| `course`            | `create`, `update`, `delete`, `list`, `get`, `stats`                     |
| `course-note`       | `list`, `create`, `update`, `delete`                                     |
| `course-attachment` | `list`, `add`, `delete`, `read`, `open`                                  |
| `backup`            | `create`, `list`, `validate`, `preview`, `restore`, `pick-file`          |
| `settings`          | `get`, `update`, `pick-backup-folder`                                    |
| `stats`             | `get`                                                                    |
| `window`            | `enter-compact`, `exit-compact`, `set-always-on-top`, `get-compact-mode` |

### Validação dupla

Os mesmos schemas Zod de [`shared/schemas/`](shared/schemas/) rodam **duas vezes** — no formulário,
antes de enviar, e novamente dentro do handler, antes de qualquer coisa chegar ao banco. O renderer é
tratado como entrada não confiável, exatamente como seria um cliente de navegador.

### Migrations

O app propositalmente **não** executa `prisma migrate` em runtime. Um executor próprio em
[`electron/main/migrations.ts`](electron/main/migrations.ts) registra os arquivos aplicados na tabela
`_study_tracker_migrations`, aplica o SQL pendente em ordem, tolera erros de "coluna já existe"
(idempotente) e cria um backup antes de rodar qualquer coisa.

📖 **A documentação de arquitetura completa e ilustrada está em
[`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)** — mais de 500 linhas cobrindo cada fluxo, diagrama e
decisão de projeto.

---

## Estrutura do projeto

```
study-tracker/
├── electron/                   # PROCESSO PRINCIPAL (lado Node.js)
│   ├── main/
│   │   ├── index.ts            # ponto de entrada
│   │   ├── app.ts              # ciclo de vida, tratamento de erros
│   │   ├── database.ts         # conexão Prisma + resolução do caminho do banco
│   │   ├── migrations.ts       # executor de migrations idempotente
│   │   ├── backup.ts           # criar / validar / restaurar backups ZIP
│   │   ├── attachments.ts      # armazenamento de arquivos, sanitização, limite de 25 MB
│   │   ├── paths.ts            # caminhos em desenvolvimento vs empacotado
│   │   ├── prisma-client.ts    # carrega o Prisma dentro do bundle Electron
│   │   └── sqlite-introspection.ts
│   ├── ipc/
│   │   ├── index.ts            # registra todos os handlers
│   │   ├── validate.ts         # validação Zod + tratamento de erro
│   │   └── handlers/           # um arquivo por domínio
│   ├── preload/index.ts        # contextBridge → window.api
│   └── windows/main-window.ts  # janela principal + animação do modo compacto
│
├── src/                        # RENDERER (React)
│   ├── pages/                  # Dashboard, Cursos, Detalhe do curso, Histórico, Estatísticas, Configurações
│   ├── components/             # courses/ dashboard/ history/ layout/ settings/ statistics/ timer/ ui/
│   ├── hooks/                  # useSessions, useCourses, useStats, useTimer, useBackup, …
│   ├── stores/                 # Zustand: cronômetro, modo compacto, seleção de curso
│   ├── layouts/                # MainLayout, CompactLayout
│   ├── services/ipc-client.ts  # cliente tipado sobre window.api
│   └── lib/, utils/
│
├── shared/                     # COMPARTILHADO ENTRE OS DOIS PROCESSOS
│   ├── types/models.ts         # modelos de domínio + contrato StudyTrackerApi
│   ├── types/ipc-channels.ts   # nomes dos canais
│   ├── schemas/                # schemas Zod
│   └── constants/              # status, plataformas, tamanhos de janela, config de backup
│
├── prisma/
│   ├── schema.prisma           # StudySession, Course, CourseNote, CourseAttachment, AppSettings
│   └── migrations/             # migrations em SQL puro
│
├── docs/ARQUITETURA.md         # documentação completa de arquitetura (PT-BR)
├── build/icon.png              # ícone usado pelo electron-builder
└── electron-builder.yml        # configuração de empacotamento (NSIS / DMG / AppImage)
```

---

## Como rodar

### Pré-requisitos

- **Node.js 20+** e npm
- Windows, macOS ou Linux (o desenvolvimento funciona nos três; só o instalador Windows é publicado)

### Instalação

```bash
git clone https://github.com/merino626/study-tracker.git
cd study-tracker
npm install            # o postinstall roda `prisma generate` automaticamente
copy .env.example .env # Linux/macOS: cp .env.example .env
```

O `.env` guarda apenas o caminho do SQLite usado em desenvolvimento:

```env
DATABASE_URL="file:../database/study-tracker.db"
```

### Desenvolvimento

```bash
npm run dev
```

O Vite serve o renderer em `http://localhost:5173` e o Electron carrega essa URL com hot reload. O
arquivo do banco é criado automaticamente em `database/study-tracker.db` na primeira execução, e as
migrations são aplicadas na inicialização.

### Build de produção

```bash
npm run build:win     # instalador Windows (NSIS) → release/
npm run build         # plataforma atual
```

O pipeline executa `prisma generate` → `vite build` (renderer + main + preload) → `electron-builder`.
O instalador gerado é `release/Study Tracker-Setup-<versão>.exe`.

> **Detalhe do empacotamento:** as engines nativas (`.node`) do Prisma precisam ficar fora do arquivo
> asar, por isso `node_modules/.prisma` e `@prisma/client` estão declarados em `asarUnpack`, e as
> migrations SQL são enviadas via `extraResources` — é isso que faz as migrations funcionarem no app
> instalado.

---

## Scripts disponíveis

| Script                   | O que faz                                                     |
| ------------------------ | ------------------------------------------------------------- |
| `npm run dev`            | Servidor Vite + Electron com hot reload                       |
| `npm run build`          | Build de produção completo para a plataforma atual            |
| `npm run build:win`      | Instalador NSIS para Windows                                  |
| `npm run build:renderer` | Build apenas do renderer                                      |
| `npm run preview`        | Pré-visualiza o renderer compilado no navegador               |
| `npm run typecheck`      | `tsc --noEmit` no renderer, no main e no código compartilhado |
| `npm run lint`           | ESLint 9 (flat config)                                        |
| `npm run format`         | Prettier + ordenação de classes Tailwind                      |
| `npm run format:check`   | Verifica a formatação sem alterar arquivos                    |

---

## Onde ficam os seus dados

| Ambiente                        | Banco de dados                             | Anexos                                        |
| ------------------------------- | ------------------------------------------ | --------------------------------------------- |
| Desenvolvimento (`npm run dev`) | `database/study-tracker.db`                | `database/course-attachments/`                |
| App instalado                   | `%APPDATA%/study-tracker/study-tracker.db` | `%APPDATA%/study-tracker/course-attachments/` |

Nada sai da máquina: não existe conta, servidor, analytics nem uma única requisição de rede em todo o
código. Para levar seus dados para outro computador, copie o arquivo `.db` — ou, melhor ainda, use um
backup em ZIP.

---

## Formato do backup

```
backup-2026-07-07-18-30-15.zip
├── manifest.json      # versão do formato, data e checksum SHA-256 de cada arquivo
├── sessions.json      # todas as sessões de estudo
├── courses.json       # todos os cursos
├── settings.json      # configurações do app
└── categories.json    # categorias únicas extraídas dos cursos
```

Como o conteúdo é JSON puro, o backup também serve como exportação portátil, que você pode ler,
comparar ou processar com qualquer ferramenta.

---

## Modelo de segurança

| Configuração       | Valor         | Por quê                                                     |
| ------------------ | ------------- | ----------------------------------------------------------- |
| `contextIsolation` | `true`        | O contexto JS do renderer fica isolado do preload           |
| `nodeIntegration`  | `false`       | O código React não tem acesso a `fs`, `child_process`, etc. |
| `sandbox`          | `true`        | O renderer roda dentro do sandbox do sistema operacional    |
| `contextBridge`    | só no preload | Expõe uma lista explícita de funções como `window.api`      |

Todo payload IPC é revalidado com Zod dentro do processo principal, e os nomes dos arquivos anexados são
higienizados antes de chegar ao sistema de arquivos.

---

## Roadmap

- [ ] Publicar builds para macOS (`.dmg`) e Linux (`.AppImage`)
- [ ] Instalador Windows assinado, para remover o aviso do SmartScreen
- [ ] Atualização automática via electron-updater
- [ ] Gráficos na página de estatísticas (linhas de tendência semanal / mensal)
- [ ] Exportação em CSV além do backup ZIP
- [ ] Testes automatizados (Vitest + Playwright para o shell Electron)

---

## Licença

Distribuído sob a [Licença MIT](LICENSE) — © 2026 Luis Eduardo.

<div align="center">

Feito com ☕ e cursos demais na Udemy sem terminar.

</div>
