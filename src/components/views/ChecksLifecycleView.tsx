import React, { useState } from 'react';
import {
  FileCheck2,
  Inbox,
  Clock,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building,
  Calendar,
  DollarSign,
  ShieldCheck,
  Receipt,
  PlusCircle,
} from 'lucide-react';
import { CheckTransaction, CheckStatus, CheckDirection, SystemSettings } from '../../types/accounting';

interface ChecksLifecycleViewProps {
  initialMode?: 'issued' | 'received' | 'collection';
  checks: CheckTransaction[];
  settings: SystemSettings;
  onUpdateCheckStatus: (checkId: string, newStatus: CheckStatus, notes?: string) => void;
  onAddNewCheck: (check: CheckTransaction) => void;
}

export const ChecksLifecycleView: React.FC<ChecksLifecycleViewProps> = ({
  initialMode = 'issued',
  checks,
  settings,
  onUpdateCheckStatus,
  onAddNewCheck,
}) => {
  const [activeTab, setActiveTab] = useState<'issued' | 'received' | 'collection'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New check state
  const [checkNum, setCheckNum] = useState('');
  const [bankName, setBankName] = useState('بنك مصر');
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState<number>(50000);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [direction, setDirection] = useState<CheckDirection>('outgoing');

  const filteredChecks = checks.filter((c) => {
    let matchesTab = false;
    if (activeTab === 'issued') matchesTab = c.direction === 'outgoing';
    else if (activeTab === 'received') matchesTab = c.direction === 'incoming';
    else if (activeTab === 'collection') matchesTab = c.status === 'in_collection';

    const matchesSearch =
      c.checkNumber.includes(searchQuery) ||
      c.beneficiaryOrDrawer.includes(searchQuery) ||
      c.bankName.includes(searchQuery);

    return matchesTab && matchesSearch;
  });

  const handleSaveCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkNum.trim() || !partyName.trim()) {
      alert('يرجى إدخال رقم الشيك واسم المستفيد أو الساحب');
      return;
    }

    // Duplicate check check per bank
    const duplicate = checks.find(
      (c) => c.checkNumber.trim() === checkNum.trim() && c.bankName.trim() === bankName.trim()
    );
    if (duplicate) {
      alert(`تحذير رقابي: رقم الشيك (${checkNum}) مسجل بالفعل لدى (${bankName})! يمنع تكرار أرقام الشيكات بالبنك الواحد.`);
      return;
    }

    const newC: CheckTransaction = {
      id: `chk-${Date.now()}`,
      checkNumber: checkNum.trim(),
      bankName: bankName.trim(),
      beneficiaryOrDrawer: partyName.trim(),
      amount: Number(amount) || 0,
      issueDate,
      dueDate,
      direction,
      status: direction === 'outgoing' ? 'issued_pending' : 'received_in_safe',
      statusDate: new Date().toISOString().split('T')[0],
      intermediateAccountCode: direction === 'outgoing' ? '2141' : '1131',
    };

    onAddNewCheck(newC);
    setShowAddModal(false);
    setCheckNum('');
    setPartyName('');
  };

  const getStatusBadge = (status: CheckStatus) => {
    switch (status) {
      case 'issued_pending':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            معلق بحساب وسيط الشيكات الصادرة (2141)
          </span>
        );
      case 'received_in_safe':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            شيك وارد محفوظ بخزينة الجمعية (1131)
          </span>
        );
      case 'in_collection':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            أودع بالبنك تحت التحصيل (1132)
          </span>
        );
      case 'cleared':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            تم الصرف / التحصيل وقيد بالبنك
          </span>
        );
      case 'bounced':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            شيك مرتد (بدون رصيد)
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400">
            ملغى نظامياً
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>دورة الرقابة المحاسبية على حركة الشيكات الوسيطة</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
                حساب 2141 & حساب 1132
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              حظر الخصم أو الإضافة المباشرة للبنك، واستخدام الحسابات الوسيطة حتى التحقق الفعلي بكشف الحساب
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setDirection(activeTab === 'issued' ? 'outgoing' : 'incoming');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer active:scale-95 group"
        >
          <Receipt className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          <span>تسجيل شيك جديد بالدفاتر</span>
        </button>
      </div>

      {/* Tabs Strip */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('issued')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'issued'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>14. الشيكات الصادرة (المسحوبة للموردين والفنادق)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/30 font-mono-num">
            {checks.filter((c) => c.direction === 'outgoing').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('received')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'received'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>15. الشيكات الواردة (من أعضاء وشركات المعارض)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/30 font-mono-num">
            {checks.filter((c) => c.direction === 'incoming').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('collection')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'collection'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>16. شيكات تحت التحصيل والمقاصة بالبنوك (1132)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/30 font-mono-num">
            {checks.filter((c) => c.status === 'in_collection').length}
          </span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الشيك، البنك، المستفيد، الساحب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-end text-xs text-slate-400 gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>حماية رقابية: منع تكرار أرقام الشيكات داخل نفس البنك</span>
        </div>
      </div>

      {/* Checks Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">رقم الشيك</th>
              <th className="p-3">البنك المسحوب عليه</th>
              <th className="p-3 min-w-[180px]">
                {activeTab === 'issued' ? 'المستفيد (الفندق / الطيران)' : 'الساحب (العضو / الشركة)'}
              </th>
              <th className="p-3">مبلغ الشيك</th>
              <th className="p-3">تاريخ التحرير</th>
              <th className="p-3">تاريخ الاستحقاق</th>
              <th className="p-3 min-w-[220px]">الحالة المحاسبية والرقابية</th>
              <th className="p-3 text-center">إجراءات دورة الشيك</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredChecks.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  لا توجد شيكات مطابقة في هذا التصنيف حالياً
                </td>
              </tr>
            ) : (
              filteredChecks.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                  <td className="p-3 font-mono-num font-bold text-amber-300">{c.checkNumber}</td>
                  <td className="p-3 text-white font-semibold">{c.bankName}</td>
                  <td className="p-3 text-slate-200">{c.beneficiaryOrDrawer}</td>
                  <td className="p-3 font-mono-num font-bold text-emerald-400 text-sm">
                    {c.amount.toLocaleString()} {settings.currencySymbol}
                  </td>
                  <td className="p-3 font-mono-num text-slate-400">{c.issueDate}</td>
                  <td className="p-3 font-mono-num text-slate-300 font-semibold">{c.dueDate}</td>
                  <td className="p-3">{getStatusBadge(c.status)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Incoming in safe -> Deposit to collection */}
                      {c.status === 'received_in_safe' && (
                        <button
                          onClick={() => onUpdateCheckStatus(c.id, 'in_collection', 'تم إيداع الشيك بحافظة تحصيل بالبنك')}
                          className="px-2 py-1 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/30 text-[11px] font-bold cursor-pointer"
                          title="إيداع الشيك بالبنك تحت التحصيل (حساب 1132)"
                        >
                          إيداع للتحصيل
                        </button>
                      )}

                      {/* In collection / Issued pending -> Clear */}
                      {(c.status === 'in_collection' || c.status === 'issued_pending') && (
                        <button
                          onClick={() => onUpdateCheckStatus(c.id, 'cleared', 'ورود الشيك بكشف حساب البنك المعتمد')}
                          className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold cursor-pointer"
                          title="تأكيد الخصم أو الإضافة الفعلي بالبنك"
                        >
                          تأكيد الصرف بالبنك
                        </button>
                      )}

                      {/* Bounce */}
                      {c.status !== 'cleared' && c.status !== 'bounced' && (
                        <button
                          onClick={() => onUpdateCheckStatus(c.id, 'bounced', 'ارتداد الشيك لعدم كفاية الرصيد')}
                          className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-[11px] font-bold cursor-pointer"
                          title="تسجيل ارتداد الشيك بدون رصيد"
                        >
                          ارتداد الشيك
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Check Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-400" />
                <span>تسجيل شيك {direction === 'outgoing' ? 'صادر (مسحوب)' : 'وارد'} جديد</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCheck} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">اتجاه الشيك</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as CheckDirection)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="outgoing">شيك صادر (مسحوب لمورد)</option>
                    <option value="incoming">شيك وارد (من عضو / شركة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">رقم الشيك (فريد بالبنك)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 900881"
                    value={checkNum}
                    onChange={(e) => setCheckNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono-num font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">البنك المسحوب عليه</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="بنك مصر">بنك مصر - حساب جاري</option>
                    <option value="البنك الأهلي المصري">البنك الأهلي المصري</option>
                    <option value="بنك فيصل الإسلامي">بنك فيصل الإسلامي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    {direction === 'outgoing' ? 'المستفيد (الفندق / الشركة)' : 'الساحب (العضو / الجهة)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="اسم الجهة..."
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">قيمة الشيك (ج.م)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono-num font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">تاريخ التحرير</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                الحساب الوسيط المستهدف تلقائياً:{' '}
                <span className="text-amber-300 font-bold">
                  {direction === 'outgoing' ? '2141 - حساب وسيط الشيكات الصادرة' : '1131 - شيكات بالخزينة'}
                </span>
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold cursor-pointer shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 active:scale-95 transition-all text-xs group"
                >
                  <CheckCircle2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span>حفظ الشيك بالدفاتر</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
