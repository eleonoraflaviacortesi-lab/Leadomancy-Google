export type UserRole = 'agente' | 'coordinatore' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  cognome: string;
  full_name: string;
  role: UserRole;
  sede: string;
  sedi: string[] | null;
  avatar_emoji: string;
  photo_url?: string;
  _rowIndex?: number;
}

export type ClienteStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface ClienteComment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  created_at: string;
  createdAt?: string;
}

export interface Cliente {
  id: string;
  user_id: string;
  sede: string;
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  paese: string;
  lingua: string;
  budget_max: number | null;
  mutuo: string;
  tempo_ricerca: string;
  ha_visitato: string;
  regioni: string[];
  vicinanza_citta: string;
  motivo_zona: string[];
  tipologia: string[];
  stile: string;
  contesto: string[];
  dimensione_min: number | null;
  dimensione_max: number | null;
  camere: string;
  bagni: string | null;
  layout: string;
  dependance: string;
  terreno: string;
  piscina: string;
  uso: string;
  interesse_affitto: string;
  portale: string;
  proprieta_visitata: string;
  ref_number: string;
  contattato_da: string;
  tipo_contatto: string;
  status: ClienteStatus;
  display_order: number;
  assigned_to: string;
  emoji: string;
  card_color: string | null;
  comments: ClienteComment[];
  descrizione: string;
  note_extra: string;
  tally_submission_id: string;
  data_submission: string;
  reminder_date: string | null;
  last_contact_date: string | null;
  row_bg_color: string | null;
  row_text_color: string | null;
  rating: number | null;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  _rowIndex?: number;
}

export interface ClienteFilters {
  search?: string;
  portale?: string;
  regione?: string;
  ref_number?: string;
  status?: ClienteStatus;
  assigned_to?: string;
}

export type NotiziaStatus = 'new' | 'in_progress' | 'done' | 'on_shot' | 'taken' | 'credit' | 'no' | 'sold' | string;

export interface NotiziaComment {
  id?: string;
  text: string;
  created_at: string;
}

export interface Notizia {
  id: string;
  user_id: string;
  sede: string;
  emoji: string;
  name: string;
  nome: string;
  zona: string;
  telefono: string;
  phone: string;
  type: string;
  prezzo_richiesto: number | null;
  prezzo: number | null;
  valore: number | null;
  rating: number | null;
  status: NotiziaStatus;
  display_order: number;
  notes: string;
  created_at: string;
  updated_at: string;
  reminder_date: string | null;
  reminder_time?: string;
  comments: NotiziaComment[];
  is_online: boolean;
  card_color: string | null;
  agent_name?: string;
  tally_submission_id?: string;
  custom_fields?: Record<string, unknown> | null;
  _rowIndex?: number;
}

export interface Appointment {
  id: string;
  title: string;
  description: string;
  date?: string;
  time?: string;
  start_time: string;
  end_time: string;
  location: string;
  user_id: string;
  cliente_id: string | null;
  notizia_id: string | null;
  completed: boolean;
  google_event_id: string | null;
  google_calendar_synced: boolean;
  type: 'visit' | 'meeting' | 'call' | 'other' | 'task';
  calendar_id: string | null;
  priority?: 'bassa' | 'media' | 'alta' | null;
  card_color?: string | null;
  tasks?: { id: string, title: string, completed: boolean }[];
  notes?: string;
  created_at: string;
  updated_at: string;
  _rowIndex?: number;
}

export interface DailyReport {
  id: string;
  user_id: string;
  sede: string;
  date: string;
  contatti_reali: number;
  contatti_ideali: number;
  notizie_reali: number;
  notizie_ideali: number;
  clienti_gestiti: number;
  appuntamenti_vendita: number;
  acquisizioni: number;
  incarichi_vendita: number;
  vendite_numero: number;
  vendite_valore: number;
  affitti_numero: number;
  affitti_valore: number;
  nuove_trattative: number;
  trattative_chiuse: number;
  valutazioni_fatte: number;
  fatturato_a_credito: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  sede: string;
  mentions: string[];
  reply_to_id: string | null;
  reactions: Record<string, string[]>;
  linked_cliente_id: string | null;
  linked_notizia_id: string | null;
  created_at: string;
  author_name?: string;
  author_emoji?: string;
}

export interface UndoableAction {
  type?: string;
  payload?: any;
  description?: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

export type CalendarViewMode = 'day' | '3days' | 'week' | 'month';

export interface CicloProduttivo {
  id: string;
  user_id: string;
  sede: string;
  date: string;
  contatti_reali: number;
  notizie_reali: number;
  clienti_gestiti: number;
  appuntamenti_vendita: number;
  acquisizioni: number;
  incarichi_vendita: number;
  valutazioni_fatte: number;
  vendite_numero: number;
  vendite_valore: number;
  nuove_trattative: number;
  trattative_chiuse: number;
  fatturato_a_credito: number;
  notes: string;
  created_at: string;
  updated_at: string;
}
