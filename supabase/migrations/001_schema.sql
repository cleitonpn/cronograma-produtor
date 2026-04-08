-- ============================================================
-- Cronograma Produtor – Schema inicial
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (estende auth.users)
-- ============================================================
CREATE TABLE profiles (
  id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  email    TEXT NOT NULL,
  role     TEXT NOT NULL CHECK (role IN ('admin', 'produtor')) DEFAULT 'produtor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  location   TEXT,
  client     TEXT,
  start_date DATE,
  end_date   DATE,
  status     TEXT NOT NULL CHECK (status IN ('planejamento', 'ativo', 'concluido')) DEFAULT 'planejamento',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHECKLIST TEMPLATES
-- ============================================================
CREATE TABLE checklist_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  is_default  BOOLEAN DEFAULT FALSE,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Garante apenas um template padrão
CREATE UNIQUE INDEX idx_one_default_template
  ON checklist_templates (is_default)
  WHERE is_default = TRUE;

-- ============================================================
-- TEMPLATE ITEMS
-- ============================================================
CREATE TABLE template_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id     UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  phase           TEXT NOT NULL CHECK (phase IN ('pre_montagem', 'montagem', 'desmontagem')) DEFAULT 'montagem',
  order_index     INTEGER NOT NULL DEFAULT 0,
  estimated_hours NUMERIC(5,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  producer_id UUID REFERENCES profiles(id),
  template_id UUID REFERENCES checklist_templates(id),
  status      TEXT NOT NULL CHECK (status IN ('pendente', 'em_andamento', 'concluido')) DEFAULT 'pendente',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECT TASKS
-- ============================================================
CREATE TABLE project_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  phase           TEXT NOT NULL CHECK (phase IN ('pre_montagem', 'montagem', 'desmontagem')) DEFAULT 'montagem',
  order_index     INTEGER NOT NULL DEFAULT 0,
  estimated_hours NUMERIC(5,2) DEFAULT 0,
  estimated_start TIMESTAMPTZ,
  estimated_end   TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  status          TEXT NOT NULL CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'bloqueado')) DEFAULT 'pendente',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DIARY ENTRIES (diário de obra)
-- ============================================================
CREATE TABLE diary_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES profiles(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries   ENABLE ROW LEVEL SECURITY;

-- Função helper: role do usuário atual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── PROFILES ─────────────────────────────────────────────────
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR get_user_role() = 'admin');

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR get_user_role() = 'admin');

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR get_user_role() = 'admin');

CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  USING (get_user_role() = 'admin');

-- ── EVENTS ───────────────────────────────────────────────────
CREATE POLICY "events_select_admin"
  ON events FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "events_select_producer"
  ON events FOR SELECT
  USING (
    get_user_role() = 'produtor' AND
    id IN (SELECT event_id FROM projects WHERE producer_id = auth.uid())
  );

CREATE POLICY "events_insert"  ON events FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "events_update"  ON events FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "events_delete"  ON events FOR DELETE USING (get_user_role() = 'admin');

-- ── CHECKLIST TEMPLATES ───────────────────────────────────────
CREATE POLICY "templates_select"
  ON checklist_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "templates_insert" ON checklist_templates FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "templates_update" ON checklist_templates FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "templates_delete" ON checklist_templates FOR DELETE USING (get_user_role() = 'admin');

-- ── TEMPLATE ITEMS ────────────────────────────────────────────
CREATE POLICY "template_items_select"
  ON template_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "template_items_insert" ON template_items FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "template_items_update" ON template_items FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "template_items_delete" ON template_items FOR DELETE USING (get_user_role() = 'admin');

-- ── PROJECTS ──────────────────────────────────────────────────
CREATE POLICY "projects_select_admin"
  ON projects FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "projects_select_producer"
  ON projects FOR SELECT
  USING (get_user_role() = 'produtor' AND producer_id = auth.uid());

CREATE POLICY "projects_insert"  ON projects FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "projects_update_admin"    ON projects FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "projects_update_producer" ON projects FOR UPDATE USING (get_user_role() = 'produtor' AND producer_id = auth.uid());
CREATE POLICY "projects_delete"  ON projects FOR DELETE USING (get_user_role() = 'admin');

-- ── PROJECT TASKS ────────────────────────────────────────────
CREATE POLICY "tasks_select_admin"
  ON project_tasks FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "tasks_select_producer"
  ON project_tasks FOR SELECT
  USING (
    get_user_role() = 'produtor' AND
    project_id IN (SELECT id FROM projects WHERE producer_id = auth.uid())
  );

CREATE POLICY "tasks_insert"  ON project_tasks FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "tasks_update_admin"    ON project_tasks FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "tasks_update_producer" ON project_tasks FOR UPDATE USING (
    get_user_role() = 'produtor' AND
    project_id IN (SELECT id FROM projects WHERE producer_id = auth.uid())
  );
CREATE POLICY "tasks_delete"  ON project_tasks FOR DELETE USING (get_user_role() = 'admin');

-- ── DIARY ENTRIES ────────────────────────────────────────────
CREATE POLICY "diary_select_admin"
  ON diary_entries FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "diary_select_producer"
  ON diary_entries FOR SELECT
  USING (
    get_user_role() = 'produtor' AND
    project_id IN (SELECT id FROM projects WHERE producer_id = auth.uid())
  );

CREATE POLICY "diary_insert"
  ON diary_entries FOR INSERT
  WITH CHECK (
    auth.uid() = producer_id AND
    project_id IN (SELECT id FROM projects WHERE producer_id = auth.uid())
  );

-- ============================================================
-- TRIGGER: cria profile ao criar usuário (auth)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'produtor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TEMPLATE PADRÃO DE MONTAGEM
-- ============================================================
DO $$
DECLARE
  tmpl_id UUID := uuid_generate_v4();
BEGIN
  INSERT INTO checklist_templates (id, name, description, is_default, created_by)
  VALUES (
    tmpl_id,
    'Template Padrão de Montagem',
    'Cronograma padrão para montagem e desmontagem de stands em feiras e eventos',
    TRUE,
    NULL
  );

  INSERT INTO template_items (template_id, title, description, phase, order_index, estimated_hours) VALUES
  -- PRÉ-MONTAGEM
  (tmpl_id, 'Briefing e aprovação do projeto',      'Reunião final com cliente para aprovação do projeto',           'pre_montagem', 1, 2),
  (tmpl_id, 'Contratação de fornecedores',           'Iluminação, audiovisual, limpeza, buffet e outros',             'pre_montagem', 2, 4),
  (tmpl_id, 'Conferência de materiais e mobiliário', 'Checagem de todos os materiais e mobiliários necessários',      'pre_montagem', 3, 2),
  (tmpl_id, 'Credenciamento e liberação de acesso',  'Providenciar credenciais para toda a equipe de montagem',       'pre_montagem', 4, 1),
  (tmpl_id, 'Logística e transporte',                'Confirmar veículos, horários e rotas para entrega de materiais','pre_montagem', 5, 2),
  -- MONTAGEM
  (tmpl_id, 'Demarcação do espaço',                  'Marcar e conferir metragem do espaço contratado no pavilhão',   'montagem',     1, 1),
  (tmpl_id, 'Montagem da estrutura principal',       'Paredes, teto, estrutura metálica e mezanino (se houver)',      'montagem',     2, 8),
  (tmpl_id, 'Instalação elétrica',                   'Passagem de fiação, tomadas, quadro elétrico e DPS',           'montagem',     3, 4),
  (tmpl_id, 'Instalação de piso',                    'Assentamento do piso (carpete, porcelanato, vinílico etc.)',    'montagem',     4, 3),
  (tmpl_id, 'Pintura e acabamento',                  'Pintura de paredes e aplicação de acabamentos gerais',         'montagem',     5, 4),
  (tmpl_id, 'Instalação de iluminação',              'Luminárias, spots, LED e elementos cênicos de luz',            'montagem',     6, 3),
  (tmpl_id, 'Instalação de audiovisual',             'Monitores, TVs, sistemas de som, projetores e cabeamento',     'montagem',     7, 3),
  (tmpl_id, 'Decoração e comunicação visual',        'Adesivos, banners, totens, lettering e elementos decorativos', 'montagem',     8, 4),
  (tmpl_id, 'Posicionamento de mobiliário',          'Móveis, expositores, balcões, mesas e cadeiras',               'montagem',     9, 2),
  (tmpl_id, 'Limpeza final e vistoria',              'Limpeza geral e inspeção completa antes da abertura do evento','montagem',    10, 2),
  -- DESMONTAGEM
  (tmpl_id, 'Retirada de mobiliário e expositores', 'Embalar e remover todos os móveis e expositores',               'desmontagem',  1, 2),
  (tmpl_id, 'Desmontagem de audiovisual',           'Retirar e embalar equipamentos de A/V',                         'desmontagem',  2, 2),
  (tmpl_id, 'Remoção de comunicação visual',        'Retirar adesivos, banners e sinalização',                       'desmontagem',  3, 1),
  (tmpl_id, 'Desmontagem da estrutura',             'Desmontar paredes, teto e toda estrutura física do stand',      'desmontagem',  4, 6),
  (tmpl_id, 'Limpeza e entrega do espaço',          'Limpeza final e devolução do espaço ao pavilhão',               'desmontagem',  5, 2);
END $$;
