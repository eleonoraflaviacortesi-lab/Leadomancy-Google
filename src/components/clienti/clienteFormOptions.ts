export const REGIONI_OPTIONS = ['Tuscany', 'Umbria', 'Marche', 'Lazio', 'Liguria', 'Emilia-Romagna', 'Veneto', 'Lombardia', 'Piemonte', 'Other'];

export const TIPOLOGIA_OPTIONS = ['Villa', 'Farmhouse', 'Country estate', 'Historic apartment / Prestigious apartment', 'Portion of a farmhouse', 'Portion of a farmhouse within a residence', 'Agriturismo (hospitality-oriented rural property)', 'Modern residence', 'Town house', 'Castle', 'Other'];

export const STILE_OPTIONS = ['Luxurious', 'Very high-end / Ultra-luxury', 'Historic / Period property', 'Countryside / Rustic', 'Modern and minimalist', 'Renovation project', 'To be partially restored', 'New build or under construction', 'Turnkey / Fully move-in ready', 'Other'];

export const CONTESTO_OPTIONS = ['Rural', 'Hilltop', 'Close to town', 'Historic center', 'Open to suggestions', 'Other'];
export const MOTIVO_ZONA_OPTIONS = ['Lifestyle', 'Investment potential', 'Natural surroundings', 'Proximity to specific locations', 'Other'];
export const TEMPO_RICERCA_OPTIONS = ['Less than 3 months', '3-6 months', '6-12 months', 'More than 1 year'];

export const MUTUO_OPTIONS = [
  { v: 'yes', l: 'Yes' },
  { v: 'no', l: 'No' },
  { v: 'not_sure', l: 'Not sure yet' }
];

export const HA_VISITATO_OPTIONS = [
  { v: 'yes', l: 'Yes' },
  { v: 'no', l: 'No' },
  { v: 'scheduled', l: 'Scheduled' }
];

export const VICINANZA_OPTIONS = [
  { v: 'yes', l: 'Yes' },
  { v: 'no', l: 'No' },
  { v: 'somewhat', l: 'Somewhat' }
];

export const TERRENO_OPTIONS = [
  { v: 'yes', l: 'Yes' },
  { v: 'no', l: 'No' },
  { v: 'maybe', l: 'Maybe' }
];

export const PISCINA_OPTIONS = [
  { v: 'necessary', l: 'Necessary' },
  { v: 'optional', l: 'Optional' },
  { v: 'not_needed', l: 'Not needed' }
];

export const USO_OPTIONS = [
  { v: 'primary_residence', l: 'Primary residence' },
  { v: 'second_home', l: 'Second home' },
  { v: 'investment', l: 'Investment' },
  { v: 'mixed_use', l: 'Mixed use' }
];

export const INTERESSE_AFFITTO_OPTIONS = [
  { v: 'yes', l: 'Yes' },
  { v: 'no', l: 'No' },
  { v: 'not_sure', l: 'Not sure yet' }
];

export const TIPO_CONTATTO_OPTIONS = ['Phone', 'Email', 'WhatsApp', 'In person', 'Website', 'Referral'];
export const CAMERE_OPTIONS = ['1', '2', '3', '4', '5+'];
export const BAGNI_OPTIONS = ['1', '2', '3', '4+'];
export const LAYOUT_OPTIONS = ['Open space', 'Traditional', 'No preference'];

export const DEPENDANCE_OPTIONS = [
  { v: 'yes', l: 'Yes' },
  { v: 'no', l: 'No' },
  { v: 'maybe', l: 'Maybe' }
];

export const CLIENTE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; fg: string }> = {
  new: { label: 'New', color: '#C0C8D8', bg: '#EEF1F8', fg: '#2B3A5C' },
  contacted: { label: 'Contacted', color: '#C8B8F5', bg: '#EDE8FD', fg: '#3B2B8A' },
  qualified: { label: 'Qualified', color: '#A090E8', bg: '#EAE6FB', fg: '#3B2B8A' },
  proposal: { label: 'Proposal', color: '#F5C4A0', bg: '#FEF0E4', fg: '#7A3010' },
  negotiation: { label: 'Negotiation', color: '#F5C842', bg: '#FEF5D0', fg: '#5C3800' },
  closed_won: { label: 'Closed ✓', color: '#B8E0C8', bg: '#E8F7EF', fg: '#1B5E38' },
  closed_lost: { label: 'Lost', color: '#F5A0B0', bg: '#FEE8EC', fg: '#7A1A2A' },
};
