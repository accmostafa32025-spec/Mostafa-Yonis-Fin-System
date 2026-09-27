import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  Edit,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertCircle,
  ShieldAlert,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  JournalEntry,
  EntryStatus,
  User,
  SystemSettings,
  Account,
  AccountingAnomaly,
} from '../../types/accounting';
import { detectEntryAnomalies } from '../../services/anomalyDetection';
import { CfoBypassModal } from '../common/CfoBypassModal';

interface JournalEntriesViewProps {
  entries: JournalEntry[];
  currentUser: User;
  settings: SystemSettings;
  accounts: Account[];
  users?: User[];
  onNewVoucher: () => void;
  onEditEntry: (entry: JournalEntry) => void;
  onApproveEntry: (entryId: string, overrideReason?: string, authorizedBy?: string) => void;
  onReverseEntry: (entryId: string, reason: string) => void;
}

export const JournalEntriesView: React.FC<JournalEntriesViewProps> = ({
  entries,
  currentUser,
  settings,
  accounts,
  users,
  onNewVoucher,
  onEditEntry,
  onApproveEntry,
  onReverseEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [reversingEntryId, setReversingEntryId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // CFO Bypass Modal states
  const [isBypassModalOpen, setIsBypassModalOpen] = useState(false);
  const [bypassModalEntry, setBypassModalEntry] = useState<JournalEntry | null>(null);
  const [bypassModalAnomalies, setBypassModalAnomalies] = useState<AccountingAnomaly[]>([]);

  const handleApproveClick = (entry: JournalEntry) => {
    const anomalies = detectEntryAnomalies(entry.lines, accounts, entries);
    if (anomalies.length > 0 && !entry.cfoOverride) {
      setBypassModalEntry(entry);
      setBypassModalAnomalies(anomalies);
      setIsBypassModalOpen(true);
      return;
    }

    onApproveEntry(entry.id);
  };

  const handleConfirmCfoBypass = (reason: string, authorizedBy: string) => {
    if (bypassModalEntry) {
      onApproveEntry(bypassModalEntry.id, reason, authorizedBy);
      setIsBypassModalOpen(false);
      setBypassModalEntry(null);
      setBypassModalAnomalies([]);
    }
  };

  const filtered = entries.filter((e) => {
    const matchesSearch =
      e.entryNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.documentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.lines.some((l) => l.accountName.includes(searchQuery) || l.accountCode.includes(searchQuery));

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesPeriod = periodFilter === 'all' || e.period === periodFilter;

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const handleOpenReverseModal = (entry: JournalEntry) => {
    setReversingEntryId(entry.id);
    setReversalReason(`تصحيح قيد يومية رقم ${entry.entryNo} بناءً على مراجعة داخلية`);
    setReversalModalOpen(true);
  };

  const handleConfirmReverse = () => {
    if (reversingEntryId && reversalReason.trim()) {
      onReverseEntry(reversingEntryId, reversalReason);
      setReversalModalOpen(false);
      setReversingEntryId(null);
      setReversalReason('');
    }
  };

  const getStatusBadge = (status: EntryStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            معتمد ومرحل
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            تحت المراجعة
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            مسودة غير معتمدة
          </span>
        );
      case 'reversed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            قيد معكوس / ملغى نظامياً
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>سجل القيود اليومية المحاسبية (اليومية العامة)</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
              {filtered.length} قيد
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            تسجيل واعتماد القيود مع حظر الحذف للمعتمد والاعتماد الصارم على القيود العكسية
          </p>
        </div>

        <button
          onClick={onNewVoucher}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer active:scale-95 group"
        >
          <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
          <span>إنشاء قيد يومية جديد</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم القيد، البيان، رقم المستند، الحساب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كافة الحالات</option>
            <option value="approved">معتمد ومرحل</option>
            <option value="under_review">تحت المراجعة</option>
            <option value="draft">مسودة</option>
            <option value="reversed">معكوس</option>
          </select>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">الفترة:</span>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كافة الفترات المالية</option>
            <option value="2026-01">2026-01 (يناير)</option>
            <option value="2026-02">2026-02 (فبراير)</option>
            <option value="2026-03">2026-03 (مارس)</option>
          </select>
        </div>
      </div>

      {/* Entries Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3 w-10"></th>
              <th className="p-3">رقم القيد</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">المستند المؤيد</th>
              <th className="p-3 min-w-[220px]">البيان العام</th>
              <th className="p-3">إجمالي القيد</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">المسؤول</th>
              <th className="p-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  لا توجد قيود مطابقة لمعايير البحث الحالية
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const isExpanded = expandedEntryId === entry.id;

                return (
                  <React.Fragment key={entry.id}>
                    <tr className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="عرض تفاصيل سطور القيد"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-3 font-mono-num font-bold text-amber-300 whitespace-nowrap">
                        {entry.entryNo}
                      </td>
                      <td className="p-3 font-mono-num text-slate-300 whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="p-3 text-slate-300">
                        <span className="font-semibold text-white">{entry.documentNo}</span>
                        <span className="text-[10px] text-slate-500 block">({entry.documentType})</span>
                      </td>
                      <td className="p-3 text-slate-200">
                        <div>{entry.description}</div>
                        {entry.reversalOfEntryNo && (
                          <span className="text-[10px] text-rose-400 block mt-0.5 font-semibold">
                            عكس القيد الأصلي رقم: {entry.reversalOfEntryNo}
                          </span>
                        )}
                        {/* CFO Override or Anomaly badges */}
                        {entry.cfoOverride ? (
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>توجيه شاذ مصادق عليه بكلمة سر المدير المالي ({entry.cfoOverrideBy})</span>
                          </div>
                        ) : (
                          (() => {
                            const anoms = detectEntryAnomalies(entry.lines, accounts, entries);
                            if (anoms.length > 0) {
                              return (
                                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold animate-pulse">
                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                  <span>⚠️ قيد شاذ يخالف طبيعة الحساب ({anoms.length} توجيهات)</span>
                                </div>
                              );
                            }
                            return null;
                          })()
                        )}
                      </td>
                      <td className="p-3 font-mono-num font-bold text-emerald-400 whitespace-nowrap">
                        {entry.totalDebit.toLocaleString()} {settings.currencySymbol}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {getStatusBadge(entry.status)}
                      </td>
                      <td className="p-3 text-slate-300 text-[11px] whitespace-nowrap">
                        <div>أنشأه: {entry.createdBy}</div>
                        {entry.approvedBy && (
                          <div className="text-emerald-400 text-[10px]">اعتمده: {entry.approvedBy}</div>
                        )}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Approve (if draft or under_review) */}
                          {entry.status !== 'approved' && entry.status !== 'reversed' && (
                            <button
                              onClick={() => handleApproveClick(entry)}
                              className="p-1.5 rounded-lg bg-[#131626] hover:bg-[#1b1f36] border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer group"
                              title="اعتماد وترحيل القيد"
                            >
                              <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          )}

                          {/* Edit */}
                          {entry.status !== 'approved' && entry.status !== 'reversed' && (
                            <button
                              onClick={() => onEditEntry(entry)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                              title="تعديل القيد"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reverse (Strictly for approved entries, no direct delete) */}
                          {entry.status === 'approved' && (
                            <button
                              onClick={() => handleOpenReverseModal(entry)}
                              className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer"
                              title="إجراء قيد عكسي تصحيحي (حظر الحذف)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Print */}
                          <button
                            onClick={() => window.print()}
                            className="p-1.5 rounded-lg bg-[#131626] hover:bg-[#1b1f36] text-[#8E92BC] hover:text-white border border-[#232742] hover:border-[#39e3d7]/40 transition-colors cursor-pointer group"
                            title="طباعة سند القيد"
                          >
                            <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Lines */}
                    {isExpanded && (
                      <tr className="bg-slate-900/40 border-b border-slate-800">
                        <td colSpan={9} className="p-4 pr-12">
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                            <h4 className="text-xs font-bold text-amber-400">
                              تفاصيل سطور ومراكز تكلفة القيد {entry.entryNo}:
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-right text-xs">
                                <thead>
                                  <tr className="text-slate-400 border-b border-slate-800 pb-1">
                                    <th className="p-1.5">كود الحساب</th>
                                    <th className="p-1.5">اسم الحساب المحاسبي</th>
                                    <th className="p-1.5">مدين (ج.م)</th>
                                    <th className="p-1.5">دائن (ج.م)</th>
                                    <th className="p-1.5">مركز التكلفة</th>
                                    <th className="p-1.5">الجهة / الطرف</th>
                                    <th className="p-1.5">البيان التحليلي</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900">
                                  {entry.lines.map((line) => (
                                    <tr key={line.id} className="text-slate-300">
                                      <td className="p-1.5 font-mono-num text-amber-300/80">{line.accountCode}</td>
                                      <td className="p-1.5 font-semibold text-white">{line.accountName}</td>
                                      <td className="p-1.5 font-mono-num text-emerald-400 font-bold">
                                        {line.debit > 0 ? line.debit.toLocaleString() : '-'}
                                      </td>
                                      <td className="p-1.5 font-mono-num text-amber-400 font-bold">
                                        {line.credit > 0 ? line.credit.toLocaleString() : '-'}
                                      </td>
                                      <td className="p-1.5 text-slate-400">
                                        {line.costCenterName ? (
                                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                                            {line.costCenterName}
                                          </span>
                                        ) : (
                                          '-'
                                        )}
                                      </td>
                                      <td className="p-1.5 text-slate-300">{line.entityName || '-'}</td>
                                      <td className="p-1.5 text-slate-400">{line.notes || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reversal Confirmation Modal */}
      {reversalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">إجراء قيد عكسي تصحيحي نظامي</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              وفقاً لمعايير الرقابة والمراجعة الداخلية بالجهاز المركزي للمحاسبات،{' '}
              <span className="font-bold text-rose-400">يحظر حذف القيود المعتمدة</span>. سيتم إنشاء
              قيد عكسي تلقائي معكوس الأطراف (المدين دائناً والدائن مديناً) مع تسجيل العملية في سجل
              التعديلات (Audit Trail).
            </p>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">
                سبب إجراء القيد العكسي (إلزامي للرقابة):
              </label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReversalModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmReverse}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
              >
                تأكيد إنشاء القيد العكسي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CFO Password Override Warning Modal */}
      {isBypassModalOpen && bypassModalEntry && (
        <CfoBypassModal
          isOpen={isBypassModalOpen}
          anomalies={bypassModalAnomalies}
          entryNo={bypassModalEntry.entryNo}
          documentNo={bypassModalEntry.documentNo}
          settings={settings}
          users={users}
          targetActionName="اعتماد وترحيل القيد"
          onConfirmBypass={handleConfirmCfoBypass}
          onCancel={() => {
            setIsBypassModalOpen(false);
            setBypassModalEntry(null);
            setBypassModalAnomalies([]);
          }}
        />
      )}
    </div>
  );
};
