import React from 'react';
import { Person, Transaction, TransactionType } from '../types';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import SwipeableItem from './SwipeableItem';

interface PersonDetailProps {
  person: Person;
  transactions: Transaction[];
  onBack: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const PersonDetail: React.FC<PersonDetailProps> = ({ person, transactions, onBack, onEditTransaction, onDeleteTransaction }) => {
  return (
    <div className="pb-32 pt-[calc(env(safe-area-inset-top)+1rem)] px-4 space-y-6">
      
      {/* Header / Nav */}
      <div className="flex items-center space-x-4 mb-2">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={24} className="text-slate-700 dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{person.name}</h1>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 dark:shadow-none relative overflow-hidden">
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
         
         <div className="flex justify-between items-start mb-6">
           <div>
             <p className="text-slate-400 text-sm mb-1">净值 (Net Balance)</p>
             <div className="text-3xl font-bold flex items-baseline">
                {CURRENCY_SYMBOL} {Math.abs(person.balance).toLocaleString()}
                <span className={`ml-2 text-sm font-medium px-2 py-0.5 rounded-full ${person.balance >= 0 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {person.balance >= 0 ? '送出去' : '收进来'}
                </span>
             </div>
           </div>
           <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold">
             {person.name.charAt(0)}
           </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <span className="text-xs text-red-300 block mb-1">Total Given</span>
              <span className="text-lg font-bold">{CURRENCY_SYMBOL}{person.totalGiven}</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <span className="text-xs text-emerald-300 block mb-1">Total Received</span>
              <span className="text-lg font-bold">{CURRENCY_SYMBOL}{person.totalReceived}</span>
            </div>
         </div>
      </div>

      {/* Tags */}
      {person.tags && person.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {person.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">往来记录 (History)</h3>
        <div className="space-y-1">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
               <Wallet size={32} className="mx-auto mb-2 opacity-50" />
               <p>暂无记录</p>
            </div>
          ) : (
            transactions.map(tx => (
              <SwipeableItem
                key={tx.id}
                onDelete={() => onDeleteTransaction(tx.id)}
                onClick={() => onEditTransaction(tx)}
              >
                <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === TransactionType.GIVE ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'
                        }`}>
                            {tx.type === TransactionType.GIVE ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm">{tx.occasion}</p>
                            <p className="text-xs text-slate-500">{tx.date}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`font-bold ${
                            tx.type === TransactionType.GIVE ? 'text-give' : 'text-receive'
                        }`}>
                            {tx.type === TransactionType.GIVE ? '-' : '+'}{CURRENCY_SYMBOL}{tx.amount}
                        </div>
                        {tx.notes && <p className="text-[10px] text-slate-400 max-w-[100px] truncate">{tx.notes}</p>}
                    </div>
                </div>
              </SwipeableItem>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default PersonDetail;