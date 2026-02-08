
import React, { useState, useMemo } from 'react';
import { AppState, TransactionType } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Filter, RefreshCw, Trophy, Target, Share2, Info, Calendar } from 'lucide-react';
import { TAG_OPTIONS, OCCASION_OPTIONS, CURRENCY_SYMBOL } from '../constants';

const COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

interface AnalyticsProps {
  state: AppState;
}

const Analytics: React.FC<AnalyticsProps> = ({ state }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    personId: '',
    occasion: '',
    tag: ''
  });

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

  // Social Archetype Logic
  const archetype = useMemo(() => {
    const totalGiven = state.transactions.filter(t => t.type === TransactionType.GIVE).reduce((s, t) => s + t.amount, 0);
    const totalReceived = state.transactions.filter(t => t.type === TransactionType.RECEIVE).reduce((s, t) => s + t.amount, 0);
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const recentTx = state.transactions.find(t => new Date(t.date) > lastYear);

    if (!recentTx && state.transactions.length > 0) return { type: '休眠型', label: 'Dormant', desc: '深居简出，岁月静好', color: 'bg-slate-500' };
    
    const ratio = totalGiven === 0 ? (totalReceived > 0 ? 99 : 1) : totalReceived / totalGiven;
    if (ratio >= 0.8 && ratio <= 1.2) return { type: '储蓄型', label: 'Balanced', desc: '礼尚往来，稳健社交', color: 'bg-emerald-500' };
    if (ratio > 1.2) return { type: '净流入型', label: 'Inflow', desc: '备受关怀，福气满满', color: 'bg-red-500' };
    return { type: '净流出型', label: 'Outflow', desc: '社交达人，慷慨大方', color: 'bg-blue-500' };
  }, [state.transactions]);

  // Data processing
  const personAggregates = useMemo(() => {
    const agg = filteredTransactions.reduce((acc, tx) => {
      if (!acc[tx.personId]) acc[tx.personId] = { name: tx.personName, total: 0, give: 0, receive: 0 };
      acc[tx.personId].total += tx.amount;
      if (tx.type === TransactionType.GIVE) acc[tx.personId].give += tx.amount;
      else acc[tx.personId].receive += tx.amount;
      return acc;
    }, {} as Record<string, { name: string, total: number, give: number, receive: number }>);
    return Object.values(agg).sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  const top10 = personAggregates.slice(0, 10);
  const totalVolume = personAggregates.reduce((s, p) => s + p.total, 0);
  const top10Volume = top10.reduce((s, p) => s + p.total, 0);
  const concentration = totalVolume > 0 ? Math.round((top10Volume / totalVolume) * 100) : 0;

  const occasionData = useMemo(() => {
    const map = filteredTransactions.reduce((acc, tx) => {
      acc[tx.occasion] = (acc[tx.occasion] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(map).map(name => ({ name, value: map[name] })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const resetFilters = () => setFilters({ startDate: '', endDate: '', personId: '', occasion: '', tag: '' });

  return (
    <div className="pb-32 pt-[calc(env(safe-area-inset-top)+3rem)] px-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">统计分析 (Analytics)</h1>
        <div className="flex space-x-2">
           <button onClick={() => setShowPoster(true)} className="p-2 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95 transition-transform">
            <Share2 size={20} />
          </button>
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`p-2 rounded-xl flex items-center space-x-2 transition-colors ${isFilterOpen ? 'bg-blue-100 text-blue-600' : 'bg-white dark:bg-slate-800 text-slate-500 shadow-sm'}`}>
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Social Archetype Card */}
      <div className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-xl ${archetype.color}`}>
        <div className="absolute -right-4 -top-4 opacity-20 rotate-12">
            <Trophy size={100} />
        </div>
        <p className="text-xs font-bold opacity-80 mb-1">人情往来体质 (Social Archetype)</p>
        <h2 className="text-2xl font-black mb-1">{archetype.type} ({archetype.label})</h2>
        <p className="text-sm opacity-90">{archetype.desc}</p>
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <div className="text-[10px] space-y-0.5">
                <p>核心圈层占比 (Core Concentration):</p>
                <p className="text-sm font-bold">{concentration}% 的互动来自 TOP 10 对象</p>
            </div>
            <Target size={24} className="opacity-40" />
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">筛选条件 (Filters)</h3>
            <button onClick={resetFilters} className="text-xs text-blue-500 flex items-center space-x-1">
              <RefreshCw size={12} /> <span>重置</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="col-span-2 flex space-x-2">
               <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="flex-1 p-2 rounded-lg border dark:border-slate-700 bg-transparent text-xs" />
               <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="flex-1 p-2 rounded-lg border dark:border-slate-700 bg-transparent text-xs" />
             </div>
             <select value={filters.occasion} onChange={(e) => setFilters({...filters, occasion: e.target.value})} className="col-span-1 p-2 rounded-lg border dark:border-slate-700 bg-transparent text-xs outline-none">
                <option value="">所有事由 (All Occasions)</option>
                {OCCASION_OPTIONS.map(occ => <option key={occ} value={occ}>{occ}</option>)}
             </select>
             <select value={filters.tag} onChange={(e) => setFilters({...filters, tag: e.target.value})} className="col-span-1 p-2 rounded-lg border dark:border-slate-700 bg-transparent text-xs outline-none">
                <option value="">所有标签 (All Tags)</option>
                {TAG_OPTIONS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
             </select>
          </div>
        </div>
      )}

      {/* TOP 5 List View */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex justify-between items-center">
            往来对象排行 (Top Contacts)
            <span className="text-[10px] font-normal text-slate-400">按总金额排序</span>
        </h3>
        <div className="space-y-4">
            {personAggregates.slice(0, 5).map((p, i) => (
                <div key={p.name} className="flex items-center space-x-3">
                    <span className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-[10px] font-bold rounded-full text-slate-500">{i+1}</span>
                    <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.name}</span>
                            <span className="text-xs font-mono text-slate-500">{CURRENCY_SYMBOL}{p.total.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-400" style={{ width: `${(p.give/p.total)*100}%` }}></div>
                            <div className="h-full bg-red-400" style={{ width: `${(p.receive/p.total)*100}%` }}></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Occasion Pie */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">事由权重分析 (By Occasion)</h3>
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={occasionData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                        {occasionData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Guide Flow */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2 text-slate-400 mb-3">
            <Info size={14} />
            <span className="text-[11px] font-bold uppercase tracking-wider">洞察指南 (Insight Guide)</span>
        </div>
        <div className="flex justify-around items-center">
            <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xs shadow-sm">1</div>
                <span className="text-[10px] text-slate-500">点“统计”</span>
            </div>
            <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xs shadow-sm">2</div>
                <span className="text-[10px] text-slate-500">查“排行”</span>
            </div>
            <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xs shadow-sm">3</div>
                <span className="text-[10px] text-slate-500">识“核心圈”</span>
            </div>
        </div>
      </div>

      {/* Poster Modal */}
      {showPoster && (
        <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                {/* Close Button */}
                <button onClick={() => setShowPoster(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full z-10">
                    <X size={20} className="text-slate-500" />
                </button>
                
                {/* Poster Content */}
                <div className="p-8 pb-12">
                    <div className="mb-8">
                        <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm mb-1">
                            <Calendar size={16} />
                            <span>{new Date().getFullYear()} 年度人情战报</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">年度往来对象排行榜</h2>
                        <p className="text-slate-400 text-xs mt-1">Annual Top 10 Relationships</p>
                    </div>

                    <div className="space-y-4 mb-10">
                        {top10.length > 0 ? top10.map((p, i) => (
                            <div key={p.name} className="flex items-center justify-between group">
                                <div className="flex items-center space-x-3">
                                    <span className={`w-6 h-6 flex items-center justify-center text-[11px] font-black rounded-lg ${i < 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {i + 1}
                                    </span>
                                    <span className={`font-bold ${i < 3 ? 'text-lg text-slate-900' : 'text-slate-500'}`}>{p.name}</span>
                                </div>
                                <span className="font-mono text-xs font-bold text-slate-400 italic">
                                    {Math.round((p.total / totalVolume) * 100)}%
                                </span>
                            </div>
                        )) : (
                            <p className="text-center py-10 text-slate-300">暂无数据记录</p>
                        )}
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10">
                             <Trophy size={120} />
                        </div>
                        <h3 className="text-4xl font-black mb-2 text-blue-400 italic">
                            {concentration}%
                        </h3>
                        <p className="text-lg font-bold leading-tight">的社交走动<br/>集中在这些对象身上</p>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end">
                            <div className="text-[10px] opacity-60">
                                <p>人情账本 Pro · 专属洞察</p>
                                <p>Data-Driven Insights</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-blue-400">体质: {archetype.type}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p className="mt-6 text-white/40 text-xs font-medium tracking-widest uppercase">长按截图分享年度洞察 (Long Press to Screenshot)</p>
        </div>
      )}
    </div>
  );
};

const X = ({ size, className }: { size: number, className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default Analytics;
