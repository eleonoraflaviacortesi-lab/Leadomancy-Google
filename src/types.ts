export type NotiziaStatus = 'new' | 'in_progress' | 'done' | 'on_shot' | 'taken' | 'credit' | 'no' | 'sold';

export interface Notizia {
  id: string;
  user_id: string;
  emoji: string;
  name: string;
  nome: string; // Keep both for compatibility
  zona: string;
  telefono: string;
  type: string;
  prezzo_richiesto: number;
  prezzo: number; // Keep both for compatibility
  valore: number;
  rating: number;
  status: NotiziaStatus;
  display_order: number;
  notes: string;
  created_at: string;
  updated_at: string;
  reminder_date?: string;
  reminder_time?: string;
  comments?: any[];
  is_online?: boolean;
  card_color?: string;
  agent_name?: string;
  _rowIndex?: number;
}

export type ClienteStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

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
  budget_max: number;
  mutuo: string;
  tempo_ricerca: string;
  ha_visitato: string;
  regioni: string[];
  vicinanza_citta: string;
  motivo_zona: string[];
  tipologia: string[];
  stile: string;
  contesto: string[];
  dimensione_min: number;
  dimensione_max: number;
  camere: string;
  bagni: string;
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
  descrizione: string;
  note_extra: string;
  status: ClienteStatus;
  display_order: number;
  assigned_to: string;
  reminder_date?: string;
  last_contact_date?: string;
  rating?: number;
  emoji?: string;
  comments?: any[];
  created_at: string;
  updated_at: string;
  card_color?: string;
  custom_fields?: Record<string, any>;
  _rowIndex?: number;
}

export interface ClienteFilters {
  search?: string;
  status?: ClienteStatus;
  regione?: string;
  portale?: string;
  ref_number?: string;
  assigned_to?: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
  type: 'visit' | 'meeting' | 'call' | 'other' | 'task';
  cliente_id?: string;
  notizia_id?: string;
  google_event_id?: string;
  google_calendar_synced: boolean;
  calendar_id?: string;
  completed: boolean;
  tasks?: { id: string, title: string, completed: boolean }[];
  notes?: string;
  card_color?: string;
  created_at: string;
  _rowIndex?: number;
}

export interface DailyReport {
  id: string;
  user_id: string;
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
  notes?: string;
  created_at: string;
  updated_at: string;
  _rowIndex?: number;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  cognome: string;
  full_name?: string;
  sede: string;
  sedi?: string[];
  role: 'admin' | 'agent' | 'coordinatore' | 'agente';
  photo_url?: string;
  avatar_emoji?: string;
  _rowIndex?: number;
}

export interface SedeTarget {
  id: string;
  sede: string;
  month: number;
  year: number;
  contatti_target: number;
  notizie_target: number;
  appuntamenti_target: number;
  acquisizioni_target: number;
  incarichi_target: number;
  vendite_target: number;
  fatturato_target: number;
  trattative_chiuse_target: number;
  _rowIndex?: number;
}

export interface UndoableAction {
  type: string;
  payload: any;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}
