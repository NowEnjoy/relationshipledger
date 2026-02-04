
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, Person, Transaction } from './types';
import { loadData, saveData, addTransaction, updateTransaction, deleteTransaction, exportDataJSON, exportDataCSV, importDataJSON, clearAllData } from './services/storageService';
import { isActivated, isAdmin, getDeviceId, generateLicenseForKey, getLicenseHistory, LicenseHistoryItem, clearLicenseHistory } from './services/authService'; 
import { Home, Plus, Users, PieChart, Settings, Download, Upload, FileText, Trash2, AlertTriangle, ShieldCheck, Key, History, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import Analytics from './components/Analytics';
import PeopleDirectory from './components/PeopleDirectory';
import PersonDetail from './components/PersonDetail';
import ActivationScreen from './components/ActivationScreen';

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
  
  const [activated, setActivated] = useState<boolean>(false);
  const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminInputId, setAdminInputId] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [licenseHistory, setLicenseHistory] = useState<LicenseHistoryItem[]>([]);

  const [viewingPersonId, setViewingPersonId] = useState<string | null>(null);
  const [confirmClearData, setConfirmClearData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActivated(isActivated());
    setUserIsAdmin(isAdmin());
    if (isAdmin()) {
      setLicenseHistory(getLicenseHistory());
    }
    setIsCheckingAuth(false);
    const data = loadData();
    setState(data);
  }, []);

  // 计算每月生成趋势
  const trendData = useMemo(() => {
    const monthlyMap: Record<string, number> = {};
    licenseHistory.forEach(item => {
      const month = item.date.substring(0, 7); // YYYY-MM
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });
    return Object.keys(monthlyMap)
      .sort()
      .map(month => ({ month, count: monthlyMap[month] }));
  }, [licenseHistory]);

  if (isCheckingAuth) return null;

  if (!activated) {
    return <ActivationScreen onActivated={() => {
        setActivated(true);
        const adminStatus = isAdmin();
        setUserIsAdmin(adminStatus);
        if (adminStatus) setLicenseHistory(getLicenseHistory());
    }} />;
  }

  const handleGenerateKey = () => {
    const key = generateLicenseForKey(adminInputId.trim().toUpperCase());
    setGeneratedKey(key);
    setLicenseHistory(getLicenseHistory()); // 刷新历史
    setAdminInputId('');
  };

  const SettingsTab = () => (
    <div className="pb-32 pt-[calc(env(safe-area-inset-top)+3rem)] px-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">设置 (Settings)</h1>
      
      <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-xs uppercase font-bold tracking-wider">软件授权状态</p>
          <p className="text-lg font-bold">{userIsAdmin ? '管理员模式' : '已激活 Pro 版'}</p>
        </div>
        <ShieldCheck size={32} className="text-blue-200" />
      </div>

      {userIsAdmin && (
        <>
          {/* 激活码生成器 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-amber-200 dark:border-amber-900/30">
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center">
              <Key size={16} className="mr-2" />
              激活码生成工具
            </h2>
            <div className="space-y-3">
              <input 
                type="text"
                placeholder="输入客户的 Device ID"
                value={adminInputId}
                onChange={(e) => setAdminInputId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border dark:border-slate-700 bg-transparent text-sm"
              />
              <button 
                onClick={handleGenerateKey}
                disabled={!adminInputId}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold transition-colors"
              >
                生成并记录历史
              </button>
              {generatedKey && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 select-all animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] text-slate-400 mb-1">本次生成 (点击复制):</p>
                  <code className="text-lg font-mono font-bold text-blue-600 tracking-wider">{generatedKey}</code>
                </div>
              )}
            </div>
          </div>

          {/* 生成统计与趋势 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <TrendingUp size={16} className="mr-2" />
                生成趋势统计
              </h2>
              <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                累计: {licenseHistory.length} 个
              </span>
            </div>
            
            {trendData.length > 0 ? (
              <div className="h-40 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="生成量" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center py-4 text-xs text-slate-400">暂无趋势数据</p>
            )}
          </div>

          {/* 历史记录列表 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
             <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <History size={16} className="mr-2" />
                  生成历史 (History)
                </h2>
                <button 
                  onClick={() => { if(confirm('确定清空所有生成记录？')) { clearLicenseHistory(); setLicenseHistory([]); } }}
                  className="text-[10px] text-red-500 hover:underline"
                >
                  清空记录
                </button>
             </div>
             <div className="max-h-60 overflow-y-auto no-scrollbar">
               {licenseHistory.length === 0 ? (
                 <p className="p-10 text-center text-xs text-slate-400">暂无生成记录</p>
               ) : (
                 licenseHistory.map(item => (
                   <div key={item.id} className="p-3 border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <code className="text-xs font-bold text-blue-600 select-all">{item.licenseKey}</code>
                        <span className="text-[10px] text-slate-400">{item.date.split('T')[0]}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Device: {item.deviceId}</p>
                   </div>
                 ))
               )}
             </div>
          </div>
        </>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <h2 className="px-4 py-3 text-sm font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">数据管理 (Data)</h2>
        <button onClick={exportDataJSON} className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b dark:border-slate-700">
          <div className="bg-blue-100 text-blue-500 p-2 rounded-lg"><Download size={20} /></div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white">导出备份 (Export JSON)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">导出所有记录为 JSON，用于数据迁移或恢复</p>
          </div>
        </button>
        <button onClick={exportDataCSV} className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b dark:border-slate-700">
          <div className="bg-emerald-100 text-emerald-500 p-2 rounded-lg"><FileText size={20} /></div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white">导出表格 (Export CSV)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">导出 CSV 格式，方便在 Excel/WPS 中查看</p>
          </div>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b dark:border-slate-700">
          <div className="bg-purple-100 text-purple-500 p-2 rounded-lg"><Upload size={20} /></div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white">导入备份 (Import JSON)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">选择已导出的 JSON 文件恢复您的历史数据</p>
          </div>
        </button>
        <input type="file" ref={fileInputRef} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const res = importDataJSON(ev.target?.result as string);
              setState(res);
            };
            reader.readAsText(file);
          }
        }} accept=".json" className="hidden" />
        <button onClick={() => {
          if (confirmClearData) {
            clearAllData();
            setState({ people: [], transactions: [] });
            setConfirmClearData(false);
          } else {
            setConfirmClearData(true);
            setTimeout(() => setConfirmClearData(false), 3000);
          }
        }} className={`w-full flex items-center space-x-3 p-4 text-left transition-colors duration-200 ${confirmClearData ? 'bg-red-500 text-white' : 'hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
          <div className={`p-2 rounded-lg ${confirmClearData ? 'bg-white/20 text-white' : 'bg-red-100 text-red-500'}`}><AlertTriangle size={20} /></div>
          <div className="flex-1">
            <h3 className={`font-bold ${confirmClearData ? 'text-white' : 'text-red-600 dark:text-red-400'}`}>{confirmClearData ? '再次点击确认清空' : '清空数据 (Delete All)'}</h3>
            <p className={`text-[10px] ${confirmClearData ? 'text-white/80' : 'text-slate-400'} mt-0.5`}>彻底清空本地所有记录，操作前建议先备份</p>
          </div>
        </button>
      </div>

      <div className="p-4 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl leading-relaxed">
        <p className="mb-2 font-bold text-slate-500 dark:text-slate-300">隐私声明 (Privacy Policy):</p>
        <p>您的所有账本记录完全存储在设备本地，绝不进行云端传输。激活码仅用于设备身份核验。</p>
        <p className="mt-1 text-amber-600 dark:text-amber-500 font-medium">温馨提示：由于数据仅在本地存储，请务必定期使用导出功能进行备份，以防因浏览器清理缓存或更换设备导致数据丢失。</p>
        <p className="mt-2 text-[10px]">您的 Device ID: <span className="font-mono">{getDeviceId()}</span></p>
      </div>

      <div className="flex flex-col items-center justify-center py-6 space-y-1 opacity-40">
        <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
          Copyright © 2025 FF. All Rights Reserved.
        </p>
        <p className="text-[9px] font-medium tracking-tight text-slate-400">
          版权所有 违者必究
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <main className="w-full min-h-full bg-background relative sm:max-w-md sm:mx-auto sm:shadow-2xl">
        {activeTab === Tab.DASHBOARD && (
          <Dashboard transactions={state.transactions} totalGiven={state.transactions.filter(t=>t.type==='GIVE').reduce((s,t)=>s+t.amount,0)} totalReceived={state.transactions.filter(t=>t.type==='RECEIVE').reduce((s,t)=>s+t.amount,0)} onEditTransaction={(tx)=>{setEditingTransaction(tx);setShowAddForm(true);}} onDeleteTransaction={(id)=>{const ns=deleteTransaction(state,id);setState(ns);saveData(ns);}} />
        )}
        {activeTab === Tab.PEOPLE && (
          viewingPersonId ? (
            <PersonDetail 
              person={state.people.find(p=>p.id===viewingPersonId)!} 
              transactions={state.transactions.filter(t=>t.personId===viewingPersonId)} 
              onBack={()=>setViewingPersonId(null)}
              onEditTransaction={(tx)=>{setEditingTransaction(tx);setShowAddForm(true);}}
              onDeleteTransaction={(id)=>{const ns=deleteTransaction(state,id);setState(ns);saveData(ns);}}
            />
          ) : (
            <PeopleDirectory people={state.people} onPersonClick={setViewingPersonId} />
          )
        )}
        {activeTab === Tab.ANALYTICS && <Analytics state={state} />}
        {activeTab === Tab.SETTINGS && <SettingsTab />}

        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 z-30 sm:absolute">
          <button onClick={() => { setEditingTransaction(null); setShowAddForm(true); }} className="bg-slate-900 dark:bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all">
            <Plus size={28} />
          </button>
        </div>

        <div className="fixed bottom-0 w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t dark:border-slate-700 pb-safe-bottom pt-2 px-6 flex justify-between items-center z-40 sm:absolute sm:max-w-md">
          <button onClick={() => {setActiveTab(Tab.DASHBOARD);setViewingPersonId(null);}} className={`flex flex-col items-center p-2 space-y-1 ${activeTab === Tab.DASHBOARD ? 'text-primary' : 'text-slate-400'}`}>
            <Home size={24} />
            <span className="text-[10px] font-medium">首页</span>
          </button>
          <button onClick={() => setActiveTab(Tab.PEOPLE)} className={`flex flex-col items-center p-2 space-y-1 ${activeTab === Tab.PEOPLE ? 'text-primary' : 'text-slate-400'}`}>
            <Users size={24} />
            <span className="text-[10px] font-medium">人脉</span>
          </button>
          <button onClick={() => setActiveTab(Tab.ANALYTICS)} className={`flex flex-col items-center p-2 space-y-1 ${activeTab === Tab.ANALYTICS ? 'text-primary' : 'text-slate-400'}`}>
            <PieChart size={24} />
            <span className="text-[10px] font-medium">统计</span>
          </button>
          <button onClick={() => setActiveTab(Tab.SETTINGS)} className={`flex flex-col items-center p-2 space-y-1 ${activeTab === Tab.SETTINGS ? 'text-primary' : 'text-slate-400'}`}>
            <Settings size={24} />
            <span className="text-[10px] font-medium">设置</span>
          </button>
        </div>
      </main>

      {showAddForm && (
        <TransactionForm 
          people={state.people} 
          initialData={editingTransaction} 
          onSave={(data)=>{
            const ns = data.id ? updateTransaction(state, data) : addTransaction(state, data);
            setState(ns);
            saveData(ns);
            setShowAddForm(false);
          }} 
          onDelete={(id)=>{
            const ns = deleteTransaction(state, id);
            setState(ns);
            saveData(ns);
            setShowAddForm(false);
          }} 
          onClose={()=>setShowAddForm(false)} 
        />
      )}
    </div>
  );
}

export default App;
