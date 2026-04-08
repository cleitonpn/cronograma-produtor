# Cronograma Produtor

App mobile (Android + iOS) para gestão de obra de montagem de stands em feiras e eventos.

## Stack

- **Frontend:** React Native + Expo SDK 52 (TypeScript)
- **Navegação:** Expo Router 4 (file-based routing)
- **Backend/Banco:** Supabase (PostgreSQL + Auth + Edge Functions)
- **UI:** React Native Paper (Material Design 3)

## Funcionalidades

### Admin
- Dashboard com visão geral (progresso global, atalhos rápidos)
- Gerenciar **Eventos** (criar, editar status, ver projetos do evento)
- Gerenciar **Projetos** (criar, atribuir produtor, aplicar template)
- Gerenciar **Templates de Checklist** (criar templates reutilizáveis com itens por fase)
- Gerenciar **Produtores** (criar contas de acesso)
- **Export PDF** por projeto com log completo de tarefas e horários

### Produtor
- Ver apenas os projetos atribuídos a ele
- **Checklist interativo** por fase (Pré-Montagem → Montagem → Desmontagem)
- Marcar tarefas como "Iniciado" (registra `started_at`) e "Finalizado" (registra `completed_at`)
- Adicionar observações em tarefas
- **Diário de Obra**: registrar ocorrências e anotações por projeto
- Perfil com resumo dos projetos

### Cronograma Híbrido
Ao criar um projeto, se nenhum template for escolhido, o **template padrão** é aplicado automaticamente (configurado na aba Config). O admin pode designar qualquer template como padrão.

---

## Configuração

### 1. Clonar e instalar dependências

```bash
git clone <repo>
cd cronograma-produtor
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Em **SQL Editor**, execute o arquivo `supabase/migrations/001_schema.sql`
3. Em **Project Settings → API**, copie:
   - `Project URL`
   - `anon / public` key

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 4. Deploy da Edge Function (para criar usuários)

```bash
# Instale o CLI do Supabase
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref SEU-PROJECT-REF

# Deploy
supabase functions deploy create-user
```

### 5. Criar o primeiro admin manualmente

No **Supabase Dashboard → Authentication → Users**, crie um usuário:
- Email: `admin@suaempresa.com`
- Password: `suasenha`

Depois execute no **SQL Editor**:
```sql
INSERT INTO profiles (id, name, email, role)
SELECT id, 'Administrador', email, 'admin'
FROM auth.users
WHERE email = 'admin@suaempresa.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### 6. Rodar o app

```bash
npx expo start
```

Escaneie o QR Code com o **Expo Go** (Android/iOS) ou rode em emulador.

---

## Banco de Dados – Visão Geral

```
auth.users                  ← Supabase Auth (email/senha)
    │
    └── profiles             ← id, name, email, role (admin|produtor)

events                      ← Feiras e eventos
    └── projects             ← Stands/expositores (project.producer_id → profiles)
            └── project_tasks  ← Tarefas do checklist (status, started_at, completed_at)
            └── diary_entries  ← Diário de obra

checklist_templates          ← Templates reutilizáveis
    └── template_items       ← Itens padrão (copiados para project_tasks ao criar projeto)
```

### Segurança (RLS)
- **Admin** vê e gerencia tudo
- **Produtor** vê apenas projetos atribuídos a ele (`producer_id = auth.uid()`)
- Tarefas e diário seguem a mesma regra de isolamento por `project_id`

---

## Estrutura de Arquivos

```
app/
├── _layout.tsx              # Root: providers + redirecionamento por role
├── login.tsx                # Tela de login
├── (admin)/                 # Grupo Admin
│   ├── _layout.tsx          # Stack Navigator
│   ├── (tabs)/              # Abas: Dashboard, Eventos, Projetos, Config
│   ├── evento/[id].tsx      # Detalhe do evento
│   ├── evento/novo.tsx      # Criar evento
│   ├── projeto/[id].tsx     # Detalhe do projeto (admin)
│   ├── projeto/novo.tsx     # Criar projeto
│   ├── template/[id].tsx    # Detalhe do template
│   ├── template/novo.tsx    # Criar template
│   └── usuario/novo.tsx     # Criar produtor
└── (produtor)/              # Grupo Produtor
    ├── _layout.tsx          # Stack Navigator
    ├── (tabs)/              # Abas: Meus Projetos, Perfil
    └── projeto/[id].tsx     # Checklist + Diário de Obra

lib/
├── supabase.ts              # Cliente Supabase
├── types.ts                 # Types TypeScript
├── format.ts                # Formatação de datas
└── theme.ts                 # Cores e tema

contexts/
└── AuthContext.tsx           # Autenticação global

components/
├── TaskCard.tsx             # Card de tarefa com ações Iniciar/Finalizar
├── ProjectCard.tsx          # Card de projeto com barra de progresso
├── StatusBadge.tsx          # Badge de status colorido
└── EmptyState.tsx           # Estado vazio

supabase/
├── migrations/001_schema.sql  # Schema completo do banco
└── functions/create-user/     # Edge Function para criar produtores
```

---

## Relatórios para a Diretoria

### Via App (PDF)
Em qualquer projeto (visão admin), toque em **PDF** para gerar e compartilhar um relatório com:
- Informações do evento/projeto
- Progresso geral
- Todas as tarefas por fase com status e timestamps
- Duração de cada tarefa

### Via Supabase Dashboard (SQL)
Acesse **Table Editor** ou **SQL Editor** no painel do Supabase para consultas ad-hoc:

```sql
-- Progresso por projeto
SELECT
  e.name AS evento,
  p.name AS projeto,
  pr.name AS produtor,
  p.status,
  COUNT(t.id) AS total_tarefas,
  COUNT(t.id) FILTER (WHERE t.status = 'concluido') AS concluidas,
  ROUND(100.0 * COUNT(t.id) FILTER (WHERE t.status = 'concluido') / NULLIF(COUNT(t.id), 0), 1) AS pct_concluido
FROM projects p
JOIN events e ON e.id = p.event_id
LEFT JOIN profiles pr ON pr.id = p.producer_id
LEFT JOIN project_tasks t ON t.project_id = p.id
GROUP BY e.name, p.name, pr.name, p.status
ORDER BY e.name, p.name;
```

Você pode exportar os resultados para CSV diretamente pelo painel do Supabase.
