export type UserRole = 'agente' | 'coordinatore' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  sede: string;
  sedi: string[] | null;
  avatar_emoji: string;
}

export type ClienteStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface ClienteComment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  createdAt: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  paese: string;
  lingua: string;
  budget_max: number | null;
  mutuo: boolean;
  tempo_ricerca: string;
  ha_visitato: boolean;
  regioni: string[];
  vicinanza_citta: boolean;
  motivo_zona: string[];
  tipologia: string[];
  stile: string;
  contesto: string[];
  dimensioni_min: number | null;
  dimensioni_max: number | null;
  camere: number;
  bagni: number | null;
  layout: string;
  dependance: boolean;
  terreno: boolean;
  piscina: boolean;
  uso: string;
  interesse_affitto: boolean;
  portale: string;
  property_name: string;
  ref_number: string;
  contattato_da: string;
  tipo_contatto: string;
  status: ClienteStatus;
  display_order: number;
  assigned_to: string;
  sede: string;
  emoji: string;
  card_color: string;
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
  created_at: string;
  updated_at: string;
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
  id: string;
  text: string;
  created_at: string;
}

export interface Notizia {
  id: string;
  user_id: string;
  name: string;
  zona: string;
  phone: string;
  type: string;
  notes: string;
  status: NotiziaStatus;
  emoji: string;
  reminder_date: string | null;
  created_at: string;
  updated_at: string;
  comments: NotiziaComment[];
  card_color: string;
  display_order: number;
  is_online: boolean;
  prezzo_richiesto: number | null;
  valore: number | null;
  rating: number | null;
  tally_submission_id: string;
  custom_fields: Record<string, unknown> | null;
}

export interface Appointment {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  user_id: string;
  cliente_id: string | null;
  completed: boolean;
  google_event_id: string | null;
  google_calendar_synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyReport {
  id: string;
  user_id: string;
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
  description: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

export type CalendarViewMode = 'day' | '3days' | 'week' | 'month';
