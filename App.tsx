
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Person, Transaction } from './types';
import { loadData, saveData, addTransaction, updateTransaction, deleteTransaction, exportDataJSON, exportDataCSV, importDataJSON, clearAllData } from './services/storageService';
import { Home, Plus, Users, PieChart, Settings, Download, Upload, FileText, Trash2, AlertTriangle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import Analytics from './components/Analytics';
import PeopleDirectory from './components/PeopleDirectory';
import PersonDetail from './components/PersonDetail';

enum Tab {
  DASHBOARD = 'DASHBOARD',
  PEOPLE = 'PEOPLE',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS'
}

function App() {
  const [state, setState] = useState<AppState>({ people: [], transactions: [] });
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // New state for People Detail View
  const [viewingPersonId, setViewingPersonId] = useState<string | null>(null);
  
  // State for Clear Data Confirmation
  const [confirmClearData, setConfirmClearData] = useState(false);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const data = loadData();
    setState(data);
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Reset detail view when changing tabs
    setViewingPersonId(null);
    setConfirmClearData(false); // Reset confirmation state on tab change
  };

  const handleSaveTransaction = (data: any) => {
    let newState;
    if (data.id) {
       // It's an update
       newState = updateTransaction(state, data);
    } else {
       // It's a new transaction
       newState = addTransaction(state, data);
    }
    setState(newState);
    saveData(newState);
  };

  const handleDeleteTransaction = (id: string) => {
    const newState = deleteTransaction(state, id);
    setState(newState);
    saveData(newState);
  }

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingTransaction(null);
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const newState = importDataJSON(content);
        setState(newState);
      }
    };
    reader.readAsText(file);
    
    // Reset value so same file can be selected again
    event.target.value = '';
  };

  const handleClearAll = () => {
    if (confirmClearData) {
        // Second click: execute delete
        clearAllData();
        setState({ people: [], transactions: [] });
        setConfirmClearData(false);
    } else {
        // First click: ask for confirmation
        setConfirmClearData(true);
        // Auto-reset after 3 seconds if not confirmed
        setTimeout(() => setConfirmClearData(false), 3000);
    }
  };

  const calculateTotals = () => {
    const given = state.transactions
      .filter(t => t.type === 'GIVE')
      .reduce((sum, t) => sum + t.amount, 0);
    const received = state.transactions
      .filter(t => t.type === 'RECEIVE')
      .reduce((sum, t) => sum + t.amount, 0);
    return { given, received };
  };

  const { given, received } = calculateTotals();

  // Helper to render People Tab content
  const renderPeopleTab = () => {
    if (viewingPersonId) {
      const person = state.people.find(p => p.id === viewingPersonId);
      // If person deleted (all transactions gone), return to directory
      if (!person) {
        setViewingPersonId(null);
        return <PeopleDirectory people={state.people} onPersonClick={setViewingPersonId} />;
      }
      
      const personTransactions = state.transactions.filter(t => t.personId === viewingPersonId);
      return (
        <PersonDetail 
          person={person} 
          transactions={personTransactions} 
          onBack={() => setViewingPersonId(null)}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      );
    }
    return <PeopleDirectory people={state.people} onPersonClick={setViewingPersonId} />;
  };

  // Settings Component Inline for simplicity
  const SettingsTab = () => (
    <div className="pb-32 pt-[calc(env(safe-area-inset-top)+3rem)] px-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">设置 (Settings)</h1>
      
      {/* Data Management */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <h2 className="px-4 py-3 text-sm font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">数据管理 (Data)</h2>
        
        {/* Export JSON */}
        <button 
          onClick={exportDataJSON}
          className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b dark:border-slate-700"
        >
          <div className="bg-blue-100 text-blue-500 p-2 rounded-lg">
            <Download size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">导出备份 (Export JSON)</h3>
            <p className="text-xs text-slate-500">Full backup for restoring later</p>
          </div>
        </button>

        {/* Export CSV */}
        <button 
          onClick={exportDataCSV}
          className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b dark:border-slate-700"
        >
          <div className="bg-emerald-100 text-emerald-500 p-2 rounded-lg">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">导出表格 (Export CSV)</h3>
            <p className="text-xs text-slate-500">For Excel/Numbers</p>
          </div>
        </button>

        {/* Import */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b dark:border-slate-700"
        >
          <div className="bg-purple-100 text-purple-500 p-2 rounded-lg">
            <Upload size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">导入备份 (Import JSON)</h3>
            <p className="text-xs text-slate-500">Restore data (Skips duplicates)</p>
          </div>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileImport} 
          accept=".json" 
          className="hidden" 
        />

        {/* Clear All - Modified for Double Tap Confirmation */}
        <button 
          onClick={handleClearAll}
          className={`w-full flex items-center space-x-3 p-4 text-left transition-colors duration-200 ${
            confirmClearData 
              ? 'bg-red-500 text-white' 
              : 'hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
        >
          <div className={`p-2 rounded-lg ${
            confirmClearData ? 'bg-white/20 text-white' : 'bg-red-100 text-red-500'
          }`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className={`font-bold ${
                confirmClearData ? 'text-white' : 'text-red-600 dark:text-red-400'
            }`}>
                {confirmClearData ? '再次点击确认清空 (Click Again)' : '清空数据 (Delete All)'}
            </h3>
            <p className={`text-xs ${
                confirmClearData ? 'text-red-100' : 'text-slate-500'
            }`}>
                {confirmClearData ? '此操作无法撤销 (Irreversible)' : 'Permanently remove everything'}
            </p>
          </div>
        </button>
      </div>

      <div className="p-4 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl leading-relaxed">
        <p className="mb-2 font-bold text-slate-500 dark:text-slate-300">隐私声明 (Privacy Policy):</p>
        <p>数据安全与隐私至关重要。您的所有账本记录完全存储在设备本地，绝不进行云端传输或信息收集。由于数据不存储于服务器，请务必通过“导出备份”功能定期保存数据文件，以防设备损坏、丢失或应用卸载导致数据无法找回。</p>
      </div>

      {/* Copyright Footer */}
      <div className="text-center py-6 text-slate-300 dark:text-slate-700">
        <p className="text-xs font-medium">Relationship Ledger</p>
        <p className="text-[10px] mt-1">Designed by FF &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Content Area */}
      <main className="w-full min-h-full bg-background relative sm:max-w-md sm:mx-auto sm:shadow-2xl">
        {activeTab === Tab.DASHBOARD && (
          <Dashboard 
            transactions={state.transactions} 
            totalGiven={given}
            totalReceived={received}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
        {activeTab === Tab.PEOPLE && renderPeopleTab()}
        {activeTab === Tab.ANALYTICS && <Analytics state={state} />}
        {activeTab === Tab.SETTINGS && <SettingsTab />}

        {/* Floating Action Button - Fixed Positioning */}
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 z-30 sm:absolute">
          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowAddForm(true);
            }}
            className="bg-slate-900 dark:bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={28} />
          </button>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t dark:border-slate-700 pb-safe-bottom pt-2 px-6 flex justify-between items-center z-40 sm:absolute sm:max-w-md">
          <button 
            onClick={() => handleTabChange(Tab.DASHBOARD)}
            className={`flex flex-col items-center p-2 space-y-1 ${activeTab === Tab.DASHBOARD ? 'text-primary' : 'text-slate-400'}`}
          >
            <Home size={24} strokeWidth={activeTab === Tab.DASHBOARD ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          
          <button 
            onClick={() => handleTabChange(Tab.PEOPLE)}
            className={`flex flex-col items-center p-2 space-y-1 ${activeTab === Tab.PEOPLE ? 'text-primary' : 'text-slate-400'}`}
          >
            <Users size={24} strokeWidth={activeTab === Tab.PEOPLE ? 2.5 : 2} />
            <span className="text-[10px] font-medium">People</span>
          </button>

          <button 
            onClick={() => handleTabChange(Tab.ANALYTICS)}
            className={`flex flex-col items-center p-2 space-y-1 ${activeTab === Tab.ANALYTICS ? 'text-primary' : 'text-slate-400'}`}
          >
            <PieChart size={24} strokeWidth={activeTab === Tab.ANALYTICS ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Stats</span>
          </button>

          <button 
            onClick={() => handleTabChange(Tab.SETTINGS)}
            className={`flex flex-col items-center p-2 space-y-1 ${activeTab === Tab.SETTINGS ? 'text-primary' : 'text-slate-400'}`}
          >
            <Settings size={24} strokeWidth={activeTab === Tab.SETTINGS ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </main>

      {/* Modals */}
      {showAddForm && (
        <TransactionForm 
          people={state.people}
          initialData={editingTransaction}
          onSave={handleSaveTransaction} 
          onDelete={handleDeleteTransaction}
          onClose={closeForm} 
        />
      )}

    </div>
  );
}

export default App;
