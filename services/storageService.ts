import { AppState, Person, Transaction, TransactionType } from '../types';
import { STORAGE_KEY_DATA } from '../constants';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- Helper: Rebuild People State from Transactions ---
// This ensures data consistency after imports or deletions
const recalculateState = (transactions: Transaction[]): AppState => {
  const peopleMap: Record<string, Person> = {};

  transactions.forEach(tx => {
    if (!peopleMap[tx.personId]) {
      peopleMap[tx.personId] = {
        id: tx.personId,
        name: tx.personName,
        tags: [],
        totalGiven: 0,
        totalReceived: 0,
        balance: 0,
        lastInteraction: tx.date
      };
    }

    const p = peopleMap[tx.personId];
    
    // Update basic info in case it changed in the transaction
    p.name = tx.personName; 
    
    // Update Interaction Date
    if (tx.date > p.lastInteraction) {
      p.lastInteraction = tx.date;
    }

    // Update Totals
    if (tx.type === TransactionType.GIVE) {
      p.totalGiven += tx.amount;
      p.balance += tx.amount;
    } else {
      p.totalReceived += tx.amount;
      p.balance -= tx.amount;
    }
  });

  return {
    transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    people: Object.values(peopleMap)
  };
};

// --- Storage Functions ---

export const loadData = (): AppState => {
  const raw = localStorage.getItem(STORAGE_KEY_DATA);
  if (!raw) {
    return { people: [], transactions: [] };
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load data", e);
    return { people: [], transactions: [] };
  }
};

export const saveData = (state: AppState): void => {
  const json = JSON.stringify(state);
  localStorage.setItem(STORAGE_KEY_DATA, json);
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY_DATA);
};

// --- Export Functions ---

export const exportDataJSON = (): void => {
  const state = loadData();
  
  // DIRECT EXPORT: No wrapper, no encryption, just the raw data object.
  // Using 2 spaces indentation for readability (Show Real Data)
  const jsonString = JSON.stringify(state, null, 2);
  
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relationship_ledger_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportDataCSV = (): void => {
  const state = loadData();
  const headers = ['Date', 'Type', 'Person', 'Amount', 'Occasion', 'Notes', 'Tags'];
  
  // Simple CSV generation showing real data
  const rows = state.transactions.map(tx => [
    tx.date,
    tx.type === 'GIVE' ? '送出' : '收到', // Localized for readability
    `"${tx.personName}"`, // Quote names to handle commas
    tx.amount,
    tx.occasion,
    `"${tx.notes.replace(/"/g, '""')}"`, // Escape quotes in notes
    `"${(tx.tags || []).join(';')}"` // Semicolon separated tags
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  // Add BOM for Excel utf-8 compatibility so Chinese characters display correctly
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relationship_ledger_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// --- Import Function ---

export const importDataJSON = (jsonString: string): AppState => {
  try {
    const parsed = JSON.parse(jsonString);
    
    let importedTransactions: Transaction[] = [];

    // Handle different formats
    if (parsed.transactions && Array.isArray(parsed.transactions)) {
        // Direct format (New)
        importedTransactions = parsed.transactions;
    } else if (parsed.payload && typeof parsed.payload === 'object' && Array.isArray(parsed.payload.transactions)) {
        // Wrapper format (Old)
        importedTransactions = parsed.payload.transactions;
    } else {
        throw new Error("Unknown file format");
    }

    const currentData = loadData();
    const existingIds = new Set(currentData.transactions.map(t => t.id));
    
    // Filter duplicates based on ID
    const newUniqueTransactions = importedTransactions.filter(tx => !existingIds.has(tx.id));

    if (newUniqueTransactions.length === 0) {
        alert("所有数据已存在，无需导入 (All data exists).");
        return currentData;
    }

    // Merge and Recalculate
    const allTransactions = [...currentData.transactions, ...newUniqueTransactions];
    const newState = recalculateState(allTransactions);
    
    saveData(newState);
    alert(`成功导入 ${newUniqueTransactions.length} 条记录 (Import Successful).`);
    return newState;

  } catch (e) {
    console.error(e);
    alert("导入失败：文件格式错误 (Import Failed).");
    return loadData();
  }
};

// --- Transaction Logic Helpers ---

export const addTransaction = (
  state: AppState, 
  transactionData: Omit<Transaction, 'id' | 'createdAt'>
): AppState => {
  const newTx: Transaction = {
    ...transactionData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  const newTransactions = [newTx, ...state.transactions];
  return recalculateState(newTransactions);
};

export const updateTransaction = (
  state: AppState,
  updatedTx: Transaction
): AppState => {
  const newTransactions = state.transactions.map(t => 
    t.id === updatedTx.id ? updatedTx : t
  );
  return recalculateState(newTransactions);
};

export const deleteTransaction = (
  state: AppState,
  transactionId: string
): AppState => {
  const newTransactions = state.transactions.filter(t => t.id !== transactionId);
  return recalculateState(newTransactions);
};