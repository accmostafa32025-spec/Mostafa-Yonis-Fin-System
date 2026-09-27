import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Printer,
  Save,
  Send,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  FlatIconNewEntry,
  FlatIconAudit,
  FlatIconApprove,
} from '../common/FlatIcons';
import confetti from 'canvas-confetti';
import {
  Account,
  CostCenter,
  Member,
  Supplier,
  User,
  JournalEntry,
  JournalLine,
  SystemSettings,
  EntryStatus,
  AccountingAnomaly,
} from '../../types/accounting';
import { validateSingleEntry } from '../../services/validationEngine';
import { CfoBypassModal } from '../common/CfoBypassModal';

interface EntryVoucherFormViewProps {
  accounts: Account[];
  costCenters: CostCenter[];
  members: Member[];
  suppliers: Supplier[];
  currentUser: User;
  settings: SystemSettings;
  existingEntries: JournalEntry[];
  editingEntry?: JournalEntry | null;
  users?: User[];
  onSaveEntry: (entry: JournalEntry, newStatus?: EntryStatus) => void;
  onCancel: () => void;
}

export const EntryVoucherFormView: React.FC<EntryVoucherFormViewProps> = ({
  accounts,
  costCenters,
  members,
  suppliers,
  currentUser,
  settings,
  existingEntries,
  editingEntry,
  users,
  onSaveEntry,
  onCancel,
}) => {
  // Generate next entry number
  const nextSeq = existingEntries.length + 1;
  const defaultEntryNo = `JV-${settings.fiscalYear}-${String(nextSeq).padStart(4, '0')}`;

  const [entryNo, setEntryNo] = useState(editingEntry?.entryNo || defaultEntryNo);
  const [date, setDate] = useState(editingEntry?.date || new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState(editingEntry?.period || settings.activePeriod);
  const [entryType, setEntryType] = useState<JournalEntry['entryType']>(editingEntry?.entryType || 'general');
  const [documentNo, setDocumentNo] = useState(editingEntry?.documentNo || '');
  const [documentType, setDocumentType] = useState<JournalEntry['documentType']>(editingEntry?.documentType || 'cash_voucher');
  const [description, setDescription] = useState(editingEntry?.description || '');
  const [reviewerNotes, setReviewerNotes] = useState(editingEntry?.reviewerNotes || '');

  // Lines
  const [lines, setLines] = useState<JournalLine[]>(
    editingEntry?.lines || [
      {
        id: 'ln-temp-1',
        accountId: '',
        accountCode: '',
        accountName: '',
        debit: 0,
        credit: 0,
        notes: '',
      },
      {
        id: 'ln-temp-2',
        accountId: '',
        accountCode: '',
        accountName: '',
        debit: 0,
        credit: 0,
        notes: '',
      },
    ]
  );

  // CFO Override & Anomaly Handling
  const [cfoOverride, setCfoOverride] = useState<boolean>(editingEntry?.cfoOverride || false);
  const [cfoOverrideBy, setCfoOverrideBy] = useState<string>(editingEntry?.cfoOverrideBy || '');
  const [cfoOverrideReason, setCfoOverrideReason] = useState<string>(editingEntry?.cfoOverrideReason || '');
  const [cfoOverrideTimestamp, setCfoOverrideTimestamp] = useState<string>(editingEntry?.cfoOverrideTimestamp || '');
  const [isBypassModalOpen, setIsBypassModalOpen] = useState(false);
  const [pendingSaveStatus, setPendingSaveStatus] = useState<EntryStatus | null>(null);

  const [hasRunValidation, setHasRunValidation] = useState(false);

  // Compute totals
  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.001 && totalDebit > 0;

  // Run validation
  const currentEntryObj: Partial<JournalEntry> = {
    id: editingEntry?.id,
    entryNo,
    date,
    period,
    entryType,
    documentNo,
    documentType,
    description,
    lines,
    totalDebit,
    totalCredit,
    cfoOverride,
    cfoOverrideBy,
    cfoOverrideReason,
    cfoOverrideTimestamp,
  };

  const validation = validateSingleEntry(
    currentEntryObj,
    existingEntries,
    accounts,
    costCenters,
    settings,
    currentUser.approvalLimit
  );

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: `ln-temp-${Date.now()}`,
        accountId: '',
        accountCode: '',
        accountName: '',
        debit: 0,
        credit: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) {
      alert('يجب أن يحتوي القيد المحاسبي على سطرين على الأقل (طرف مدين وطرف دائن)');
      return;
    }
    const updated = [...lines];
    updated.splice(idx, 1);
    setLines(updated);
  };

  const handleAccountChange = (idx: number, accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    const updated = [...lines];
    if (acc) {
      updated[idx] = {
        ...updated[idx],
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
      };
    } else {
      updated[idx] = {
        ...updated[idx],
        accountId: '',
        accountCode: '',
        accountName: '',
      };
    }
    setLines(updated);
  };

  const handleCostCenterChange = (idx: number, ccId: string) => {
    const cc = costCenters.find((c) => c.id === ccId);
    const updated = [...lines];
    updated[idx] = {
      ...updated[idx],
      costCenterId: cc?.id || undefined,
      costCenterCode: cc?.code || undefined,
      costCenterName: cc?.name || undefined,
    };
    setLines(updated);
  };

  const handleLineValueChange = (
    idx: number,
    field: 'debit' | 'credit' | 'notes',
    value: any
  ) => {
    const updated = [...lines];
    if (field === 'debit') {
      const num = parseFloat(value) || 0;
      updated[idx].debit = num;
      if (num > 0) updated[idx].credit = 0; // prevent both
    } else if (field === 'credit') {
      const num = parseFloat(value) || 0;
      updated[idx].credit = num;
      if (num > 0) updated[idx].debit = 0; // prevent both
    } else {
      updated[idx][field] = value;
    }
    setLines(updated);
  };

  const handleSave = (targetStatus: EntryStatus) => {
    setHasRunValidation(true);

    // Rule: التحقق من وجود قيود وتوجيهات شاذة تخالف طبيعة نوع الحساب
    if (validation.anomalies.length > 0 && !cfoOverride) {
      setPendingSaveStatus(targetStatus);
      setIsBypassModalOpen(true);
      return;
    }

    doExecuteSave(
      targetStatus,
      cfoOverride,
      cfoOverrideBy,
      cfoOverrideReason,
      cfoOverrideTimestamp
    );
  };

  const doExecuteSave = (
    targetStatus: EntryStatus,
    overrideActive: boolean,
    overrideByVal: string,
    overrideReasonVal: string,
    overrideTimestampVal: string
  ) => {
    if (targetStatus === 'approved') {
      if (!validation.canApprove && (!overrideActive || validation.errors.length > 0)) {
        alert('لا يمكن اعتماد القيد لوجود أخطاء رقابية أو عدم توازن. يرجى مراجعة تنبيهات الفحص بالأسفل.');
        return;
      }
      if (!currentUser.permissions.canApprove) {
        alert(`المستخدم الحالي (${currentUser.fullName}) لا يملك صلاحية اعتماد القيود.`);
        return;
      }
      if (totalDebit > currentUser.approvalLimit) {
        alert(`قيمة القيد (${totalDebit.toLocaleString()} ج.م) تتجاوز الحد المالي لصلاحية اعتمادك (${currentUser.approvalLimit.toLocaleString()} ج.م).`);
        return;
      }
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    }

    const savedEntry: JournalEntry = {
      id: editingEntry?.id || `entry-${Date.now()}`,
      entryNo,
      date,
      period,
      entryType,
      documentNo,
      documentType,
      description,
      lines,
      totalDebit,
      totalCredit,
      status: targetStatus,
      createdBy: editingEntry?.createdBy || currentUser.fullName,
      reviewedBy: targetStatus === 'approved' || targetStatus === 'under_review' ? currentUser.fullName : editingEntry?.reviewedBy,
      approvedBy: targetStatus === 'approved' ? currentUser.fullName : editingEntry?.approvedBy,
      reviewerNotes: reviewerNotes || editingEntry?.reviewerNotes,
      hasAnomalies: validation.anomalies.length > 0,
      anomaliesSummary: validation.anomalies.map(
        (a) => `[سطر ${a.lineNumber} - ${a.accountCode} ${a.accountName}]: ${a.title}`
      ),
      cfoOverride: overrideActive,
      cfoOverrideBy: overrideByVal,
      cfoOverrideReason: overrideReasonVal,
      cfoOverrideTimestamp: overrideTimestampVal,
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveEntry(savedEntry, targetStatus);
  };

  const handleConfirmCfoBypass = (reason: string, authorizedBy: string) => {
    const timestamp = new Date().toISOString();
    setCfoOverride(true);
    setCfoOverrideBy(authorizedBy);
    setCfoOverrideReason(reason);
    setCfoOverrideTimestamp(timestamp);
    setIsBypassModalOpen(false);

    const statusToSave = pendingSaveStatus || 'draft';
    doExecuteSave(statusToSave, true, authorizedBy, reason, timestamp);
  };

  return (
    <div className="space-y-5">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{editingEntry ? 'تعديل قيد يومية محاسبي' : 'نموذج إدخال سند قيد يومية'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono-num font-bold">
                {entryNo}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              تسجيل القيد مع التحقق الفوري من التوازن ومراكز التكلفة وصلاحيات الاعتماد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setHasRunValidation(!hasRunValidation)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>فحص رقابي فوري</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 cursor-pointer"
            title="طباعة سند القيد"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Entry No */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">رقم القيد التلقائي</label>
            <input
              type="text"
              value={entryNo}
              onChange={(e) => setEntryNo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono-num font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">تاريخ القيد</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Period */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">الفترة المالية</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Entry Type */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">نوع القيد</label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="general">قيد يومية عام (تسوية)</option>
              <option value="receipt">سند قبض ومقبوضات</option>
              <option value="payment">سند صرف ومدفوعات</option>
              <option value="adjustment">قيد تسوية بنكية / مقاصة</option>
              <option value="closing">قيد إقفال ختامي</option>
              <option value="reversal">قيد تصحيحي عكسي</option>
            </select>
          </div>

          {/* Document No */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              رقم المستند المؤيد <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="مثال: REC-2026-088 أو إذن صرف 12"
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">نوع المستند</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="cash_voucher">إيصال استلام نقدية / توريد</option>
              <option value="check_voucher">شيك مسحوب / شيك وارد</option>
              <option value="bank_voucher">إشعار إضافة / خصم بنكي</option>
              <option value="invoice">فاتورة مورد / تذاكر طيران</option>
              <option value="settlement">مذكرة تسوية داخلية</option>
              <option value="internal_memo">محضر اعتماد مجلس الإدارة</option>
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-slate-400 font-medium mb-1">
              البيان العام للقيد المحاسبي <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="إيضاح وافٍ للعملية المالية وطبيعتها وأطرافها..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Anomaly Detection Alert Banner */}
        {validation.anomalies.length > 0 && (
          <div>
            {!cfoOverride ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 border-2 border-rose-500/60 shadow-xl space-y-3 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span>رسالة تحذيرية رقابية: تم رصد ({validation.anomalies.length}) توجيهات شاذة تخالف طبيعة نوع الحساب!</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-bold border border-rose-500/40">
                          حظر الحفظ والترحيل
                        </span>
                      </h4>
                      <p className="text-xs text-rose-200/90 mt-0.5">
                        بناءً على معايير الرقابة والتسويات، تم حظر الحفظ أو الاعتماد التلقائي. يتطلب إتمام العملية إدخال كلمة سر المدير المالي (CFO) للتجاوز المصرح به.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingSaveStatus(null);
                      setIsBypassModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-emerald-600 hover:from-rose-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all cursor-pointer shrink-0"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>إدخال كلمة سر المدير المالي للتجاوز</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {validation.anomalies.map((anom, i) => (
                    <div
                      key={anom.lineId || i}
                      className="bg-slate-950/80 border border-rose-500/30 rounded-lg p-2.5 text-[11px] text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {anom.lineNumber}
                      </span>
                      <div className="flex-1">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>[{anom.accountCode}] {anom.accountName}</span>
                          <span className="text-rose-400 font-mono">
                            {anom.direction === 'debit' ? 'مدين' : 'دائن'} {anom.amount.toLocaleString()} ج.م
                          </span>
                        </div>
                        <p className="text-slate-400 text-[10px] mt-0.5">{anom.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-emerald-300 font-bold flex items-center gap-2">
                      <span>تم تجاوز التوجيهات الشاذة رسمياً بمصادقة وكلمة سر المدير المالي (CFO)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">
                        معتمد للتسوية
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      المعتمد: <strong className="text-white">{cfoOverrideBy}</strong> | التبرير: {cfoOverrideReason}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBypassModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                >
                  تعديل تبرير التجاوز
                </button>
              </div>
            )}
          </div>
        )}

        {/* Lines Table */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>سطور القيد المزدوج (الطرف المدين والطرف الدائن)</span>
              <span className="text-xs font-normal text-slate-400">
                (عدد السطور: {lines.length})
              </span>
            </h3>
            <button
              type="button"
              onClick={handleAddLine}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#3632c7]/20 hover:bg-[#3632c7]/35 text-[#39e3d7] border border-[#39e3d7]/40 text-xs font-bold transition-all cursor-pointer"
            >
              <FlatIconNewEntry className="w-4 h-4" />
              <span>إضافة سطر جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3 w-10 text-center">م</th>
                  <th className="p-3 min-w-[240px]">الحساب المحاسبي</th>
                  <th className="p-3 w-32">مدين (ج.م)</th>
                  <th className="p-3 w-32">دائن (ج.م)</th>
                  <th className="p-3 min-w-[220px]">مركز التكلفة (للحج والعمرة والمعارض)</th>
                  <th className="p-3 min-w-[180px]">البيان التحليلي للسطر</th>
                  <th className="p-3 w-12 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {lines.map((line, idx) => {
                  const selectedAcc = accounts.find((a) => a.id === line.accountId);
                  const isCostCenterRequired = selectedAcc?.requiresCostCenter;

                  return (
                    <tr key={line.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Row index */}
                      <td className="p-3 text-center text-slate-500 font-mono-num font-bold">
                        {idx + 1}
                      </td>

                      {/* Account Selector */}
                      <td className="p-2">
                        <select
                          value={line.accountId}
                          onChange={(e) => handleAccountChange(idx, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="">-- اختر الحساب المحاسبي --</option>
                          {accounts
                            .filter((a) => a.isPosting)
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                [{a.code}] {a.name} ({a.naturalBalance === 'debit' ? 'طبيعته مدين' : 'طبيعته دائن'})
                              </option>
                            ))}
                        </select>
                        {selectedAcc && (
                          <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                            <span className="text-slate-400">الكود: {selectedAcc.code}</span>
                            {isCostCenterRequired && (
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                يلزم مركز تكلفة
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Debit */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={line.debit === 0 ? '' : line.debit}
                          placeholder="0.00"
                          onChange={(e) => handleLineValueChange(idx, 'debit', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono-num font-bold text-left focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Credit */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={line.credit === 0 ? '' : line.credit}
                          placeholder="0.00"
                          onChange={(e) => handleLineValueChange(idx, 'credit', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono-num font-bold text-left focus:outline-none focus:border-amber-500"
                        />
                      </td>

                      {/* Cost Center */}
                      <td className="p-2">
                        <select
                          value={line.costCenterId || ''}
                          onChange={(e) => handleCostCenterChange(idx, e.target.value)}
                          className={`w-full bg-slate-900 border rounded-lg px-2.5 py-1.5 text-white focus:outline-none cursor-pointer ${
                            isCostCenterRequired && !line.costCenterId
                              ? 'border-rose-500 bg-rose-950/20'
                              : 'border-slate-700/80 focus:border-amber-500'
                          }`}
                        >
                          <option value="">
                            {isCostCenterRequired ? '⚠️ مطلوب اختيار مركز التكلفة' : '-- بدون مركز تكلفة (عام) --'}
                          </option>
                          {costCenters.map((cc) => (
                            <option key={cc.id} value={cc.id}>
                              [{cc.code}] {cc.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Line Notes */}
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="بيان تفصيلي للسطر..."
                          value={line.notes || ''}
                          onChange={(e) => handleLineValueChange(idx, 'notes', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="حذف هذا السطر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Balance Bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-xs text-slate-400 block">إجمالي المدين:</span>
              <span className="text-lg font-bold text-emerald-400 font-mono-num">
                {totalDebit.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">إجمالي الدائن:</span>
              <span className="text-lg font-bold text-amber-400 font-mono-num">
                {totalCredit.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">فارق التوازن:</span>
              <span
                className={`text-lg font-bold font-mono-num ${
                  isBalanced ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {difference.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>القيد متوازن محاسبياً (المدين = الدائن)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-bold">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>القيد غير متوازن - لا يمكن الاعتماد</span>
              </div>
            )}
          </div>
        </div>

        {/* Validation Results Box */}
        {(hasRunValidation || validation.errors.length > 0) && (
          <div className="rounded-xl border p-4 space-y-2 bg-slate-950 border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>تقرير محرك الفحص الرقابي الذكي:</span>
            </h4>

            {/* Errors */}
            {validation.errors.map((err, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-900/50 p-2 rounded-lg">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{err}</span>
              </div>
            ))}

            {/* Warnings */}
            {validation.warnings.map((warn, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-900/50 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{warn}</span>
              </div>
            ))}

            {/* Successes */}
            {validation.successes.map((suc, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-900/50 p-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{suc}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              إلغاء / تراجع
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Draft */}
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ كمسودة</span>
            </button>

            {/* Send for Review */}
            <button
              type="button"
              onClick={() => handleSave('under_review')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] text-[#39e3d7] border border-[#39e3d7]/40 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FlatIconAudit className="w-4 h-4" />
              <span>إرسال للمراجعة والتدقيق</span>
            </button>

            {/* Approve & Post */}
            <button
              type="button"
              onClick={() => handleSave('approved')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-xl shadow-[#3632c7]/30 transition-all cursor-pointer active:scale-95"
            >
              <FlatIconApprove className="w-4 h-4" />
              <span>اعتماد وترحيل القيد نهائياً</span>
            </button>
          </div>
        </div>
      </div>

      {/* CFO Password Override Warning Modal */}
      <CfoBypassModal
        isOpen={isBypassModalOpen}
        anomalies={validation.anomalies}
        entryNo={entryNo}
        documentNo={documentNo}
        settings={settings}
        users={users}
        targetActionName={
          pendingSaveStatus === 'approved'
            ? 'اعتماد وترحيل القيد'
            : pendingSaveStatus === 'under_review'
            ? 'إرسال القيد للمراجعة'
            : 'حفظ القيد'
        }
        onConfirmBypass={handleConfirmCfoBypass}
        onCancel={() => {
          setIsBypassModalOpen(false);
          setPendingSaveStatus(null);
        }}
      />
    </div>
  );
};
