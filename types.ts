export enum TransactionType {
  GIVE = 'GIVE',
  RECEIVE = 'RECEIVE'
}

export enum Occasion {
  BIRTHDAY = '生日',
  BIRTHDAY_BANQUET = '生日宴',
  FULL_MOON = '满月宴',
  FIRST_BIRTHDAY = '周岁宴',
  WEDDING = '婚礼',
  HOUSEWARMING = '乔迁新房',
  ACADEMIC = '升学宴',
  FESTIVAL = '节日',
  VISIT_SICK = '生病探望',
  DINNER = '请客吃饭',
  OTHER = '其他'
}

export interface Person {
  id: string;
  name: string;
  tags: string[];
  totalGiven: number;
  totalReceived: number;
  lastInteraction: string; // ISO Date
  balance: number; // Positive means you gave more (they owe you favors), negative means you received more
}

export interface Transaction {
  id: string;
  type: TransactionType;
  personId: string;
  personName: string; // Denormalized for easier display
  amount: number;
  date: string; // ISO Date
  occasion: string;
  notes: string;
  tags?: string[];
  createdAt: string;
}

export interface AppState {
  people: Person[];
  transactions: Transaction[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
}