
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, Person, Transaction } from './types';
import { loadData, saveData, addTransaction, updateTransaction, deleteTransaction, exportDataJSON, exportDataCSV, importDataJSON, clearAllData } from './services/storageService';
import { isActivated, isAdmin, getDeviceId, generateLicenseForKey, getLicenseHistory, LicenseHistoryItem, clearLicenseHistory } from './services/authService'; 
import { Home, Plus, Users, PieChart, Settings, Download, Upload, FileText, Trash2, AlertTriangle, ShieldCheck, Key, History, TrendingUp, Smartphone, Info, Shield, Share2, HelpCircle } from 'lucide-react';
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
    const adminStatus = isAdmin();
    setUserIsAdmin(adminStatus);
    if (adminStatus) {
      setLicenseHistory(getLicenseHistory());
    }
    setIsCheckingAuth(false);
    const data = loadData();
    setState(data);
  }, []);

  const trendData = useMemo(() => {
    const monthlyMap: Record<string, number> = {};
    licenseHistory.forEach(item => {
      const month = item.date.substring(0, 7); 
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
    setLicenseHistory(getLicenseHistory()); 
    setAdminInputId('');
  };

  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有授权生成历史吗？')) {
      clearLicenseHistory();
      setLicenseHistory([]);
    }
  };

  const SettingsTab = () => (
    <div className="pb-32 pt-[calc(env(safe-area-inset-top)+3rem)] px-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">设置 (Settings)</h1>
      
      <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-xs font-bold tracking-wider">软件授权状态 (License Status)</p>
          <p className="text-lg font-bold">{userIsAdmin ? '管理员模式' : '已激活 Pro 版'}</p>
        </div>
        <ShieldCheck size={32} className="text-blue-200" />
      </div>

      {userIsAdmin && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-amber-200 dark:border-amber-900/30">
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-400 tracking-wider mb-3 flex items-center">
              <Key size={16} className="mr-2" />
              激活码生成工具 (License Generator)
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
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] text-slate-400 mb-1 select-none">本次生成 (点击复制):</p>
                  <code 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                    }}
                    className="text-lg font-mono font-bold text-blue-600 tracking-wider block select-all cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {generatedKey}
                  </code>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-400 tracking-wider flex items-center">
                <TrendingUp size={16} className="mr-2" />
                生成趋势统计 (Generation Stats)
              </h2>
              <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                累计: {licenseHistory.length}
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

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-sm font-bold text-slate-400 tracking-wider flex items-center">
                <History size={16} className="mr-2" />
                生成历史记录 (License History)
              </h2>
              {licenseHistory.length > 0 && (
                <button onClick={handleClearHistory} className="text-[10px] text-red-500 hover:underline">清空记录</button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {licenseHistory.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">尚无生成历史</p>
              ) : (
                licenseHistory.map(item => (
                  <div key={item.id} className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center text-[10px]">
                    <div className="space-y-0.5">
                      <p className="font-mono font-bold text-blue-600 select-all">{item.licenseKey}</p>
                      <p className="text-slate-400">Device: {item.deviceId}</p>
                    </div>
                    <div className="text-right text-slate-400">
                      {item.date.split('T')[0]}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <h2 className="px-4 py-3 text-sm font-bold text-slate-400 tracking-wider bg-slate-50 dark:bg-slate-900/50">数据管理 (Data)</h2>
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

      <div className="bg-slate-50 dark:bg-slate-800/40 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 space-y-4">
        <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wider flex items-center">
          <Smartphone size={16} className="mr-2" />
          安装指南 (Installation)
        </h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 p-1.5 rounded-lg mt-0.5"><Info size={14}/></div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>iPhone/iOS 安装：</strong> 请务必使用 <span className="text-blue-600 font-bold">Safari 浏览器</span> 打开。点击底部工具栏中间的 <span className="text-blue-600 font-bold">“分享”按钮</span>（向上箭头图标），下拉找到并点击 <span className="text-blue-600 font-bold">“添加到主屏幕”</span>。
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 p-1.5 rounded-lg mt-0.5"><Info size={14}/></div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>华为/安卓安装：</strong> 优先推荐使用 <span className="text-blue-600 font-bold">系统自带浏览器</span> 或 <span className="text-blue-600 font-bold">Microsoft Edge</span>。点击菜单中的 <span className="text-blue-600 font-bold">“添加到主屏幕”</span> 或 <span className="text-blue-600 font-bold">“安装应用”</span>。
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-2">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center">
              <HelpCircle size={14} className="mr-1" /> 点击“添加”没反应怎么办？
            </p>
            <div className="text-[10px] text-amber-600/80 dark:text-amber-500/80 leading-relaxed">
              <p className="mb-1">1. <strong>检查浏览器：</strong> 若自带浏览器不支持，请前往应用商店下载 <strong>Microsoft Edge</strong> 或 <strong>夸克 (Quark)</strong>，它们对桌面图标的支持非常完美。</p>
              <p>2. <strong>检查系统权限：</strong> 请前往手机的 <strong>“设置 - 应用管理 - [浏览器名称] - 权限管理”</strong>，确保 <strong>“桌面快捷方式”</strong> 权限已开启，否则无法创建图标。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-bold">
          <Shield size={16} className="text-blue-500" />
          <span>隐私与安全声明 (Privacy & Security)</span>
        </div>
        
        <p className="leading-relaxed">
          <strong>为保护您的隐私数据</strong>，本程序采用“全离线架构”。您的每一笔账本记录、备注以及人脉信息均<strong>仅严格存储于您当前的设备本地</strong>，绝不进行任何形式的云端传输或后台收集。
        </p>

        <div className="pt-2 border-t dark:border-slate-700 space-y-1">
          <p className="text-amber-600 dark:text-amber-500 font-bold flex items-center">
             <AlertTriangle size={14} className="mr-1" /> 重要提醒 (Important Reminder)
          </p>
          <p className="text-[10px] leading-relaxed">
            由于数据和激活状态存储在浏览器各自的“沙箱”中，如果您在不同浏览器打开，需要<strong>重复输入相同的激活码</strong>进行解锁。同时，请务必定期使用导出功能备份数据。
          </p>
        </div>

        <p className="mt-2 text-[10px] opacity-60">
          您的设备标识 (Device ID): <span className="font-mono">{getDeviceId()}</span>
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-6 space-y-1 opacity-40">
        <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400">
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
