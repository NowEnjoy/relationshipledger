import React, { useState, useMemo } from 'react';
import { AppState, TransactionType } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Filter, X, RefreshCw } from 'lucide-react';
import { TAG_OPTIONS, OCCASION_OPTIONS } from '../constants';

const COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

interface AnalyticsProps {
  state: AppState;
}

const Analytics: React.FC<AnalyticsProps> = ({ state }) => {
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    personId: '',
    occasion: '',
    tag: ''
  });

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(tx => {
      if (filters.startDate && tx.date < filters.startDate) return false;
      if (filters.endDate && tx.date > filters.endDate) return false;
      if (filters.personId && tx.personId !== filters.personId) return false;
      if (filters.occasion && tx.occasion !== filters.occasion) return false;
      if (filters.tag && !tx.tags?.includes(filters.tag)) return false;
      return true;
    });
  }, [state.transactions, filters]);

  // Data processing for Occasion Pie Chart
  const occasionDataMap = filteredTransactions.reduce((acc, tx) => {
    acc[tx.occasion] = (acc[tx.occasion] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const occasionData = Object.keys(occasionDataMap).map(key => ({
    name: key,
    value: occasionDataMap[key]
  })).sort((a, b) => b.value - a.value);

  // Data processing for Monthly Activity
  const monthlyDataMap = filteredTransactions.reduce((acc, tx) => {
    const month = tx.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = { name: month, give: 0, receive: 0 };
    if (tx.type === TransactionType.GIVE) acc[month].give += tx.amount;
    else acc[month].receive += tx.amount;
    return acc;
  }, {} as Record<string, { name: string, give: number, receive: number }>);

  const monthlyData = Object.values(monthlyDataMap).sort((a: any, b: any) => a.name.localeCompare(b.name));

  // Data processing for Top Contacts (Top 5 by volume from filtered set)
  // We need to aggregate filtered transactions by person, not just use the person's total global balance
  const personAggregates = filteredTransactions.reduce((acc, tx) => {
    if (!acc[tx.personId]) {
      acc[tx.personId] = { name: tx.personName, give: 0, receive: 0 };
    }
    if (tx.type === TransactionType.GIVE) acc[tx.personId].give += tx.amount;
    else acc[tx.personId].receive += tx.amount;
    return acc;
  }, {} as Record<string, { name: string, give: number, receive: number }>);

  const topPeople = Object.values(personAggregates)
    .sort((a: { give: number; receive: number }, b: { give: number; receive: number }) => (b.give + b.receive) - (a.give + a.receive))
    .slice(0, 5);

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      personId: '',
      occasion: '',
      tag: ''
    });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="pb-32 pt-[calc(env(safe-area-inset-top)+3rem)] px-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">统计分析 (Analytics)</h1>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`p-2 rounded-xl flex items-center space-x-2 transition-colors ${isFilterOpen || activeFilterCount > 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
        >
          <Filter size={20} />
          {activeFilterCount > 0 && <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-700 dark:text-slate-200">筛选 (Filters)</h3>
            <button onClick={resetFilters} className="text-xs text-blue-500 flex items-center space-x-1">
              <RefreshCw size={12} /> <span>重置</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             {/* Dates */}
             <div className="col-span-2 flex space-x-2">
               <div className="flex-1">
                 <label className="text-[10px] text-slate-500 block mb-1">开始 (Start)</label>
                 <input 
                   type="date" 
                   value={filters.startDate}
                   onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                   className="w-full p-2 rounded-lg border dark:border-slate-700 bg-transparent text-sm"
                 />
               </div>
               <div className="flex-1">
                 <label className="text-[10px] text-slate-500 block mb-1">结束 (End)</label>
                 <input 
                   type="date" 
                   value={filters.endDate}
                   onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                   className="w-full p-2 rounded-lg border dark:border-slate-700 bg-transparent text-sm"
                 />
               </div>
             </div>

             {/* Person */}
             <div className="col-span-1">
               <label className="text-[10px] text-slate-500 block mb-1">对象 (Person)</label>
               <select 
                 value={filters.personId}
                 onChange={(e) => setFilters({...filters, personId: e.target.value})}
                 className="w-full p-2 rounded-lg border dark:border-slate-700 bg-transparent text-sm outline-none"
               >
                 <option value="">全部 (All)</option>
                 {state.people.map(p => (
                   <option key={p.id} value={p.id}>{p.name}</option>
                 ))}
               </select>
             </div>

             {/* Occasion */}
             <div className="col-span-1">
                <label className="text-[10px] text-slate-500 block mb-1">事由 (Occasion)</label>
                <select 
                 value={filters.occasion}
                 onChange={(e) => setFilters({...filters, occasion: e.target.value})}
                 className="w-full p-2 rounded-lg border dark:border-slate-700 bg-transparent text-sm outline-none"
               >
                 <option value="">全部 (All)</option>
                 {OCCASION_OPTIONS.map(occ => (
                   <option key={occ} value={occ}>{occ}</option>
                 ))}
               </select>
             </div>

             {/* Tags */}
             <div className="col-span-2">
               <label className="text-[10px] text-slate-500 block mb-1">标签 (Tag)</label>
               <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters({...filters, tag: ''})}
                    className={`px-3 py-1 rounded-full text-xs border ${!filters.tag ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    全部
                  </button>
                  {TAG_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setFilters({...filters, tag: tag === filters.tag ? '' : tag})}
                      className={`px-3 py-1 rounded-full text-xs border ${filters.tag === tag ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 dark:border-slate-700'}`}
                    >
                      {tag}
                    </button>
                  ))}
               </div>
             </div>
          </div>
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p>该筛选条件下无数据 (No Data)</p>
        </div>
      ) : (
        <>
          {/* Top Contacts */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">人情往来 TOP 5</h3>
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPeople} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={60} tick={{fill: '#64748b'}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Legend />
                  <Bar dataKey="give" fill="#ef4444" radius={[0, 4, 4, 0]} name="送出" barSize={15} />
                  <Bar dataKey="receive" fill="#10b981" radius={[0, 4, 4, 0]} name="收到" barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Occasion Breakdown */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">按事由分布 (By Occasion)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occasionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {occasionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
                {occasionData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center space-x-1 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                        <span>{entry.name}</span>
                    </div>
                ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">月度趋势 (Trends)</h3>
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tickFormatter={(v) => {
                      // v is 'YYYY-MM'
                      if (!v) return v;
                      const parts = v.split('-');
                      if (parts.length === 2) {
                        return `${parts[0].slice(2)}/${parts[1]}`;
                      }
                      return v;
                    }} 
                    tick={{fontSize: 10, fill: '#64748b'}}
                  />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="give" fill="#ef4444" radius={[4, 4, 0, 0]} name="送出" />
                  <Bar dataKey="receive" fill="#10b981" radius={[4, 4, 0, 0]} name="收到" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;