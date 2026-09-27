import React, { useState } from 'react';
import {
  Target,
  Search,
  Plus,
  Compass,
  ShoppingBag,
  Building,
  TrendingUp,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { CostCenter, ActivityCategory, JournalEntry } from '../../types/accounting';

interface CostCentersViewProps {
  costCenters: CostCenter[];
  entries: JournalEntry[];
  currencySymbol: string;
  onAddCostCenter: (cc: CostCenter) => void;
}

export const CostCentersView: React.FC<CostCentersViewProps> = ({
  costCenters,
  entries,
  currencySymbol,
  onAddCostCenter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New center state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ActivityCategory>('umrah');
  const [newLevel, setNewLevel] = useState('مستوى أول فاخر 5 نجوم');
  const [newDate, setNewDate] = useState('2026-04');
  const [newBudget, setNewBudget] = useState(500000);
  const [newDesc, setNewDesc] = useState('');

  // Calculate actual revenue and expenses per cost center from approved entries
  const approvedEntries = entries.filter((e) => e.status === 'approved');

  const costCenterStats = costCenters.map((cc) => {
    let revenue = 0;
    let directExpense = 0;

    approvedEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (line.costCenterId === cc.id || line.costCenterCode === cc.code) {
          if (line.accountCode.startsWith('4')) {
            revenue += line.credit - line.debit;
          } else if (line.accountCode.startsWith('5')) {
            directExpense += line.debit - line.credit;
          }
        }
      });
    });

    const budget = cc.allocatedBudget || 0;
    const netSurplus = revenue - directExpense;
    const isProfitable = netSurplus >= 0;
    const burnRate = budget > 0 ? (directExpense / budget) * 100 : 0;

    return {
      ...cc,
      actualRevenue: Math.max(0, revenue),
      actualExpense: Math.max(0, directExpense),
      netSurplus,
      isProfitable,
      burnRate,
    };
  });

  const filteredCenters = costCenterStats.filter((cc) => {
    const matchesSearch =
      cc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cc.name.includes(searchQuery) ||
      (cc.description && cc.description.includes(searchQuery));

    const matchesCat = categoryFilter === 'all' || cc.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      alert('يرجى كتابة كود واسم مركز التكلفة');
      return;
    }

    if (costCenters.some((c) => c.code === newCode.trim())) {
      alert(`مركز التكلفة بكود ${newCode} موجود بالفعل!`);
      return;
    }

    const newCC: CostCenter = {
      id: `cc-${newCode.trim().toLowerCase()}`,
      code: newCode.trim(),
      name: newName.trim(),
      category: newCategory,
      level: newLevel,
      date: newDate,
      allocatedBudget: Number(newBudget) || 0,
      isActive: true,
      description: newDesc,
    };

    onAddCostCenter(newCC);
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
            <Target className="w-5 h-5 text-amber-400" />
            <span>مراكز التكلفة والأنشطة (عمرة، حج، معارض سلع)</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
              {costCenters.length} مركز تكلفة
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            ربط ديناميكي يتيح استخراج قائمة دخل تفصيلية لكل رحلة ومعرض وتحديد فائض أو عجز كل نشاط بدقة
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer active:scale-95 group"
        >
          <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
          <span>إضافة رحلة / معرض جديد</span>
        </button>
      </div>

      {/* Filter and Category Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بكود الرحلة، الاسم، المعرض..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">تصنيف النشاط:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كافة الأنشطة والمراكز</option>
            <option value="umrah">رحلات العمرة بمستوياتها</option>
            <option value="hajj">مواسم الحج</option>
            <option value="exhibitions">المعارض السلعية (توشيبا / جولدن مان)</option>
            <option value="administrative">الإدارة والخدمات المشتركة</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-400 gap-2">
          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
            ترميز معياري ديناميكي
          </span>
        </div>
      </div>

      {/* Grid of Cost Center Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCenters.map((cc) => {
          return (
            <div
              key={cc.id}
              className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 shadow-lg transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded font-mono-num font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {cc.code}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {cc.category === 'umrah'
                        ? 'عمرة'
                        : cc.category === 'hajj'
                        ? 'حج'
                        : cc.category === 'exhibitions'
                        ? 'معرض سلعي'
                        : 'إداري عام'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white pt-1">{cc.name}</h3>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-amber-400 shrink-0">
                  {cc.category === 'umrah' ? (
                    <Compass className="w-4 h-4" />
                  ) : cc.category === 'exhibitions' ? (
                    <ShoppingBag className="w-4 h-4" />
                  ) : (
                    <Building className="w-4 h-4" />
                  )}
                </div>
              </div>

              {cc.level && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>المستوى والتاريخ:</span>
                  <span className="text-slate-200 font-semibold">{cc.level}</span>
                  {cc.date && <span className="font-mono-num">({cc.date})</span>}
                </div>
              )}

              {/* Financial Performance */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">الإيراد المحقق</span>
                  <span className="font-mono-num font-bold text-emerald-400">
                    {cc.actualRevenue.toLocaleString()} {currencySymbol}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">المصروف الفعلي</span>
                  <span className="font-mono-num font-bold text-rose-400">
                    {cc.actualExpense.toLocaleString()} {currencySymbol}
                  </span>
                </div>
                <div className="col-span-2 pt-1.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">صافي الفائض التشغيلي:</span>
                  <span
                    className={`font-mono-num font-bold ${
                      cc.netSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {cc.netSurplus.toLocaleString()} {currencySymbol}
                  </span>
                </div>
              </div>

              {/* Budget & Burn Rate */}
              {(cc.allocatedBudget ?? 0) > 0 && (
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>الموازنة المعتمدة:</span>
                    <span className="font-mono-num text-slate-200 font-semibold">
                      {(cc.allocatedBudget ?? 0).toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cc.burnRate >= 100
                          ? 'bg-rose-500'
                          : cc.burnRate >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, cc.burnRate)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>نسبة استهلاك الموازنة</span>
                    <span className="font-mono-num font-bold text-slate-300">
                      {cc.burnRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Cost Center Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <span>إضافة مركز تكلفة جديد (رحلة / معرض)</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">كود مركز التكلفة المعياري</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: UMR-2026-04-RAMADAN"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono-num font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">اسم الرحلة أو المعرض</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: عمرة رمضان 1447هـ - طيران"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">تصنيف النشاط</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ActivityCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="umrah">عمرة</option>
                    <option value="hajj">حج</option>
                    <option value="exhibitions">معرض سلعي</option>
                    <option value="administrative">إداري عام</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">المستوى والدرجة</label>
                  <input
                    type="text"
                    placeholder="مثال: مستوى أول 5 نجوم أبراج البيت"
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">تاريخ أو شهر التنفيذ</label>
                  <input
                    type="text"
                    placeholder="2026-04"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">الموازنة التقديرية المعتمدة (ج.م)</label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ملاحظات وبيان تفصيلي</label>
                <input
                  type="text"
                  placeholder="عدد المشتركين المتوقع، الفندق، خط السير..."
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
                  <span>حفظ مركز التكلفة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
