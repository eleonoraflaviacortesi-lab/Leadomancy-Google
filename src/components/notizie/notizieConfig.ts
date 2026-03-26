import { NotiziaStatus } from "@/src/types";

export const NOTIZIA_STATUSES: NotiziaStatus[] = ['new', 'in_progress', 'done', 'on_shot', 'taken', 'credit', 'no', 'sold'];

export const NOTIZIA_STATUS_LABELS: Record<NotiziaStatus, string> = {
  new: 'Nuova',
  in_progress: 'In Lavorazione',
  done: 'Fatta',
  on_shot: 'On Shot',
  taken: 'Acquisita',
  credit: 'A Credito',
  no: 'No',
  sold: 'Venduta'
};

export const NOTIZIA_STATUS_COLORS: Record<NotiziaStatus, string> = {
  new: '#C0C8D8',
  in_progress: '#C8B8F5',
  done: '#B8E0C8',
  on_shot: '#F5E642',
  taken: '#6DC88A',
  credit: '#F5C842',
  no: '#F5A0B0',
  sold: '#1A1A18'
};

export const TIPO_OPTIONS = ['Villa', 'Casale', 'Appartamento', 'Palazzo', 'Trullo', 'Masseria', 'Terreno', 'Altro'];
