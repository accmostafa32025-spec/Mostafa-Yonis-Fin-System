import React, { useState } from 'react';
import {
  GitFork,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Folder,
  FileText,
  AlertCircle,
  Download,
  PlusCircle,
} from 'lucide-react';
import { Account, AccountType, NaturalBalance } from '../../types/accounting';

interface ChartOfAccountsViewProps {
  accounts: Account[];
  onAddAccount: (account: Account) => void;
}

export const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({
  accounts,
  onAddAccount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New account form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('asset');
  const [newNaturalBalance, setNewNaturalBalance] = useState<NaturalBalance>('debit');
  const [newLevel, setNewLevel] = useState<number>(3);
  const [newIsPosting, setNewIsPosting] = useState<boolean>(true);
  const [newRequiresCostCenter, setNewRequiresCostCenter] = useState<boolean>(false);
  const [newOpeningDebit, setNewOpeningDebit] = useState<number>(0);
  const [newOpeningCredit, setNewOpeningCredit] = useState<number>(0);
  const [newDesc, setNewDesc] = useState<string>('');

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.code.includes(searchQuery) ||
      acc.name.includes(searchQuery) ||
      (acc.description && acc.description.includes(searchQuery));

    const matchesType = selectedType === 'all' || acc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleSaveNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      alert('يرجى إدخال كود واسم الحساب');
      return;
    }

    if (accounts.some((a) => a.code === newCode.trim())) {
      alert(`كود الحساب ${newCode} موجود مسبقاً في شجرة الحسابات!`);
      return;
    }

    const newAcc: Account = {
      id: `acc-${newCode.trim()}`,
      code: newCode.trim(),
      name: newName.trim(),
      type: newType,
      naturalBalance: newNaturalBalance,
      level: newLevel,
      isPosting: newIsPosting,
      requiresCostCenter: newRequiresCostCenter,
      financialStatementCategory:
        newType === 'asset'
          ? 'current_asset'
          : newType === 'liability'
          ? 'current_liability'
          : newType === 'equity'
          ? 'equity'
          : newType === 'revenue'
          ? 'operating_revenue'
          : 'operating_expense',
      openingBalanceDebit: newOpeningDebit,
      openingBalanceCredit: newOpeningCredit,
      description: newDesc,
    };

    onAddAccount(newAcc);
    setShowAddModal(false);
    setNewCode('');
    setNewName('');
    setNewDesc('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-amber-400" />
            <span>شجرة ودليل الحسابات المالي الموحد (Chart of Accounts)</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
              {accounts.length} حساب
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            هيكل هرمي رباعي المستويات متوافق مع النظام المحاسبي للجمعيات والجهاز المركزي للمحاسبات
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer active:scale-95 group"
        >
          <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
          <span>إضافة حساب جديد بالدليل</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالكود أو الاسم أو الوصف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">المجموعة:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كافة المجموعات (1 إلى 5)</option>
            <option value="asset">1. الأصول</option>
            <option value="liability">2. الالتزامات</option>
            <option value="equity">3. حقوق الملكية وصافي الأصول</option>
            <option value="revenue">4. الإيرادات</option>
            <option value="expense">5. المصروفات</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-400 gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>يقبل الترحيل المباشر ({accounts.filter((a) => a.isPosting).length})</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>حساب رئيسي تجميعي ({accounts.filter((a) => !a.isPosting).length})</span>
          </span>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3 w-28">كود الحساب</th>
              <th className="p-3 min-w-[220px]">اسم الحساب</th>
              <th className="p-3">المستوى</th>
              <th className="p-3">المجموعة</th>
              <th className="p-3">طبيعة الحساب</th>
              <th className="p-3">قابلية الترحيل</th>
              <th className="p-3">مركز التكلفة</th>
              <th className="p-3">رصيد أول المدة</th>
              <th className="p-3 min-w-[180px]">الوصف والتوجيه المحاسبي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredAccounts.map((acc) => {
              const isLevel1 = acc.level === 1;
              const isLevel2 = acc.level === 2;

              return (
                <tr
                  key={acc.id}
                  className={`transition-colors ${
                    isLevel1
                      ? 'bg-slate-900/80 font-bold text-amber-300'
                      : isLevel2
                      ? 'bg-slate-900/40 font-semibold text-slate-200'
                      : 'hover:bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <td className="p-3 font-mono-num font-bold text-amber-400/90">
                    {acc.code}
                  </td>
                  <td className="p-3">
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingRight: `${(acc.level - 1) * 16}px` }}
                    >
                      {acc.isPosting ? (
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span>{acc.name}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono-num">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px]">
                      مستوى {acc.level}
                    </span>
                  </td>
                  <td className="p-3 text-[11px]">
                    {acc.type === 'asset'
                      ? 'أصول'
                      : acc.type === 'liability'
                      ? 'التزامات'
                      : acc.type === 'equity'
                      ? 'حقوق ملكية'
                      : acc.type === 'revenue'
                      ? 'إيرادات'
                      : 'مصروفات'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        acc.naturalBalance === 'debit'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {acc.naturalBalance === 'debit' ? 'مدين' : 'دائن'}
                    </span>
                  </td>
                  <td className="p-3">
                    {acc.isPosting ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        حركي (يقبل القيد)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                        تجميعي رئيسي
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {acc.requiresCostCenter ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        إلزامي (نشاط)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">عام</span>
                    )}
                  </td>
                  <td className="p-3 font-mono-num font-bold text-slate-200">
                    {acc.openingBalanceDebit > 0
                      ? `${acc.openingBalanceDebit.toLocaleString()} (م)`
                      : acc.openingBalanceCredit > 0
                      ? `${acc.openingBalanceCredit.toLocaleString()} (د)`
                      : '-'}
                  </td>
                  <td className="p-3 text-[11px] text-slate-400">
                    {acc.description || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitFork className="w-5 h-5 text-amber-400" />
                <span>إضافة حساب جديد إلى شجرة الحسابات</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewAccount} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">كود الحساب (رقمي)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 5125"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">اسم الحساب</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مصروفات مياه وكهرباء"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">نوع الحساب</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as AccountType;
                      setNewType(t);
                      setNewNaturalBalance(t === 'asset' || t === 'expense' ? 'debit' : 'credit');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="asset">أصول</option>
                    <option value="liability">التزامات</option>
                    <option value="equity">حقوق ملكية</option>
                    <option value="revenue">إيرادات</option>
                    <option value="expense">مصروفات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">طبيعة الحساب</label>
                  <select
                    value={newNaturalBalance}
                    onChange={(e) => setNewNaturalBalance(e.target.value as NaturalBalance)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="debit">مدين (Debit)</option>
                    <option value="credit">دائن (Credit)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">المستوى</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value={2}>مستوى 2 (فرعي)</option>
                    <option value={3}>مستوى 3 (حركي تحليلي)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">رصيد أول المدة (مدين)</label>
                  <input
                    type="number"
                    value={newOpeningDebit}
                    onChange={(e) => setNewOpeningDebit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={newIsPosting}
                    onChange={(e) => setNewIsPosting(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500"
                  />
                  <span>يقبل الترحيل المباشر (حساب حركي)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={newRequiresCostCenter}
                    onChange={(e) => setNewRequiresCostCenter(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500"
                  />
                  <span>إلزامية مركز التكلفة (حج/عمرة/معارض)</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">الوصف والتوجيه المحاسبي</label>
                <input
                  type="text"
                  placeholder="وصف طبيعة استخدام الحساب..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold hover:brightness-110 cursor-pointer shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 active:scale-95 transition-all group"
                >
                  <CheckCircle2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span>حفظ الحساب بالدليل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
