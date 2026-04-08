export type UserRole = 'admin' | 'produtor';
export type EventStatus = 'planejamento' | 'ativo' | 'concluido';
export type ProjectStatus = 'pendente' | 'em_andamento' | 'concluido';
export type TaskPhase = 'pre_montagem' | 'montagem' | 'desmontagem';
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluido' | 'bloqueado';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Event {
  id: string;
  name: string;
  location: string | null;
  client: string | null;
  start_date: string | null;
  end_date: string | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  // aggregates
  project_count?: number;
}

export interface Project {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  producer_id: string | null;
  template_id: string | null;
  status: ProjectStatus;
  created_at: string;
  // relations
  event?: Event;
  producer?: Profile;
  template?: ChecklistTemplate;
  // aggregates
  total_tasks?: number;
  done_tasks?: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  items?: TemplateItem[];
}

export interface TemplateItem {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  phase: TaskPhase;
  order_index: number;
  estimated_hours: number;
  created_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  phase: TaskPhase;
  order_index: number;
  estimated_start: string | null;
  estimated_end: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: TaskStatus;
  notes: string | null;
  created_at: string;
}

export interface DiaryEntry {
  id: string;
  project_id: string;
  producer_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export const PHASE_LABELS: Record<TaskPhase, string> = {
  pre_montagem: 'Pré-Montagem',
  montagem: 'Montagem',
  desmontagem: 'Desmontagem',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  bloqueado: 'Bloqueado',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  planejamento: 'Planejamento',
  ativo: 'Ativo',
  concluido: 'Concluído',
};
