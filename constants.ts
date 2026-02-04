
import { Occasion } from './types';

export const OCCASION_OPTIONS = [
  Occasion.BIRTHDAY,
  Occasion.FULL_MOON,
  Occasion.WEDDING,
  Occasion.HOUSEWARMING,
  Occasion.ACADEMIC,
  Occasion.FESTIVAL,
  Occasion.VISIT_SICK,
  Occasion.DINNER,
  Occasion.OTHER
];

// 移除默认标签，改为动态管理
export const TAG_OPTIONS: string[] = [];

export const STORAGE_KEY_DATA = 'relationship_ledger_data';
export const STORAGE_KEY_SETTINGS = 'relationship_ledger_settings';
export const STORAGE_KEY_TAGS = 'relationship_ledger_tags'; // 新增标签库存储键

export const CURRENCY_SYMBOL = '¥';
