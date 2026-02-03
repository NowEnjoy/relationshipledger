import React, { useState, useEffect } from 'react';
import { TransactionType, Person, Occasion, Transaction } from '../types';
import { OCCASION_OPTIONS, TAG_OPTIONS } from '../constants';
import { X, Calendar, User, AlignLeft, DollarSign, Trash2, Plus, AlertCircle } from 'lucide-react';

interface TransactionFormProps {
  people: Person[];
  initialData?: Transaction | null;
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ people, initialData, onSave, onDelete, onClose }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.GIVE);
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [occasion, setOccasion] = useState(OCCASION_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Custom Tag State
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Delete Confirmation State
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setPersonName(initialData.personName);
      setAmount(initialData.amount.toString());
      setDate(initialData.date);
      setOccasion(initialData.occasion as Occasion);
      setNotes(initialData.notes);
      setSelectedTags(initialData.tags || []);
    }
  }, [initialData]);

  useEffect(() => {
    if (personName) {
      const match = people.filter(p => p.name.toLowerCase().includes(personName.toLowerCase()));
      setFilteredPeople(match);
      if (!initialData || personName !== initialData.personName) {
         setShowSuggestions(true);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [personName, people, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !amount) return;

    const existingPerson = people.find(p => p.name === personName);
    let personId = Date.now().toString(); // Fallback ID
    
    if (existingPerson) {
        personId = existingPerson.id;
    } else if (initialData && initialData.personName === personName) {
        personId = initialData.personId;
    }

    onSave({
      id: initialData?.id,
      type,
      personId,
      personName,
      amount: parseFloat(amount),
      date,
      occasion,
      notes,
      tags: selectedTags,
      createdAt: initialData?.createdAt // Preserve creation date
    });
    onClose();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (initialData && initialData.id) {
        if (confirmDelete) {
            onDelete(initialData.id);
            onClose();
        } else {
            setConfirmDelete(true);
            // Auto reset confirmation after 3 seconds
            setTimeout(() => setConfirmDelete(false), 3000);
        }
    }
  };

  const selectPerson = (name: string) => {
    setPersonName(name);
    setShowSuggestions(false);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (newTagInput.trim()) {
      const tag = newTagInput.trim();
      if (!selectedTags.includes(tag)) {
        setSelectedTags([...selectedTags, tag]);
      }
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-4 border-b dark:border-slate-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {initialData ? '修改记录 (Edit)' : '记一笔 (New)'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar pb-10">
            {/* Type Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType(TransactionType.GIVE)}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                  type === TransactionType.GIVE 
                    ? 'bg-white dark:bg-slate-700 text-give shadow-sm' 
                    : 'text-slate-400'
                }`}
              >
                送出去 (Give)
              </button>
              <button
                type="button"
                onClick={() => setType(TransactionType.RECEIVE)}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                  type === TransactionType.RECEIVE 
                    ? 'bg-white dark:bg-slate-700 text-receive shadow-sm' 
                    : 'text-slate-400'
                }`}
              >
                收进来 (Receive)
              </button>
            </div>

            {/* Amount */}
            <div className="relative">
              <label className="text-xs text-slate-500 mb-1 block">金额 (Value)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-transparent text-xl font-bold outline-none focus:ring-0 ${
                    type === TransactionType.GIVE 
                      ? 'border-emerald-100 focus:border-give text-give' 
                      : 'border-red-100 focus:border-receive text-receive'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Person Auto-complete */}
            <div className="relative z-10">
              <label className="text-xs text-slate-500 mb-1 block">往来对象 (Person)</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="姓名 (Name)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:border-blue-500 outline-none"
                  required
                />
              </div>
              {showSuggestions && filteredPeople.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredPeople.map(p => (
                    <li 
                      key={p.id} 
                      onClick={() => selectPerson(p.name)}
                      className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center"
                    >
                      <span>{p.name}</span>
                      {p.tags.length > 0 && <span className="text-xs text-slate-400">{p.tags[0]}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Occasion & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">事由 (Occasion)</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value as Occasion)}
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none appearance-none"
                >
                  {OCCASION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">日期 (Date)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Tags - Reverted to Simple Toggle */}
            <div>
              <label className="text-xs text-slate-500 mb-2 block">标签 (Tags)</label>
              <div className="flex flex-wrap gap-2 pb-1">
                {/* Standard Tags */}
                {TAG_OPTIONS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tag}
                  </button>
                ))}

                {/* Custom Tags (Rendered if selected but not in standard options) */}
                {selectedTags.filter(t => !TAG_OPTIONS.includes(t)).map(tag => (
                   <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-blue-500 text-white border-blue-500 shadow-sm"
                  >
                    {tag}
                  </button>
                ))}
                
                {/* Add Custom Tag */}
                {isAddingTag ? (
                  <div className="flex items-center">
                    <input 
                      autoFocus
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onBlur={handleAddCustomTag}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                      className="w-20 px-2 py-1.5 text-xs rounded-lg border border-blue-500 bg-transparent outline-none"
                      placeholder="Tag..."
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 flex items-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                  >
                    <Plus size={14} className="mr-1" /> Add
                  </button>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
               <label className="text-xs text-slate-500 mb-1 block">备注 (Notes)</label>
               <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 text-slate-400" size={20} />
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="详情描述..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none resize-none"
                  />
               </div>
            </div>

            {/* Delete Section */}
            {initialData && (
               <div className="pt-6 pb-2">
                 <button
                   type="button"
                   onClick={handleDeleteClick}
                   className={`w-full py-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition-all duration-200 ${
                     confirmDelete 
                       ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                       : 'bg-transparent border-red-200 text-red-500 hover:bg-red-50'
                   }`}
                 >
                   {confirmDelete ? (
                     <>
                        <AlertCircle size={20} />
                        <span>再次点击确认删除 (Confirm Delete?)</span>
                     </>
                   ) : (
                     <>
                        <Trash2 size={20} />
                        <span>删除此记录 (Delete)</span>
                     </>
                   )}
                 </button>
               </div>
            )}

          </div>

          {/* Footer - Only Save Button Now */}
          <div className="p-4 pt-2 pb-10 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-shrink-0 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <button
              type="submit"
              className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg transform active:scale-95 transition-all ${
                type === TransactionType.GIVE ? 'bg-give shadow-emerald-200' : 'bg-receive shadow-red-200'
              }`}
            >
              {initialData ? '保存修改 (Update)' : '保存 (Save)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;