import { Occasion } from './types';

export const OCCASION_OPTIONS = [
  Occasion.BIRTHDAY,
  Occasion.BIRTHDAY_BANQUET,
  Occasion.FULL_MOON,
  Occasion.FIRST_BIRTHDAY,
  Occasion.WEDDING,
  Occasion.HOUSEWARMING,
  Occasion.ACADEMIC,
  Occasion.FESTIVAL,
  Occasion.VISIT_SICK,
  Occasion.DINNER,
  Occasion.OTHER
];

export const TAG_OPTIONS = ['ff亲人', 'zz亲人', 'ff其他', 'zz其他'];

// Simple encryption mock key (In real app, user sets this)
export const STORAGE_KEY_DATA = 'relationship_ledger_data';
export const STORAGE_KEY_SETTINGS = 'relationship_ledger_settings';

export const CURRENCY_SYMBOL = '¥';