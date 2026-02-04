
export enum TransactionType {
  GIVE = 'GIVE',
  RECEIVE = 'RECEIVE'
}

export enum Occasion {
  BIRTHDAY = '生日',
  FULL_MOON = '满月宴',
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
  balance: number; // Positive means you received more, negative means you gave more (net cash flow)
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
