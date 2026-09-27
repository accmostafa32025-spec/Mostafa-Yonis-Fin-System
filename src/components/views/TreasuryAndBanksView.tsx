import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Coins,
  Landmark,
  Scale,
  Search,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  Printer,
  Download,
  Upload,
  Plus,
  Trash2,
  FileText,
  Calendar,
  Check,
  Filter,
  DollarSign,
  HelpCircle,
  RefreshCw,
  Building,
  CheckSquare,
  FileUp,
  Sparkles,
  Edit3,
  RotateCcw,
  CheckCheck,
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  Activity,
  Sliders,
  Settings,
  Zap,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BankAccount, JournalEntry, SystemSettings } from '../../types/accounting';
import {
  BankStatementDraftRow,
  BANK_TRANSACTION_CATEGORIES,
  BankTransactionCategory,
} from '../../types/bankReconciliation';
import {
  getInitialBankDraftRows,
  generateMasterDraftTemplateForMonth,
  parseBankDraftExcelFile,
  exportBankReconciliationDraftTemplate,
  exportOfficialBankSheet,
  calculateReconciliationFromDraft,
  FISCAL_MONTHS_2026,
} from '../../services/bankReconciliationService';

interface TreasuryAndBanksViewProps {
  mode: 'treasury' | 'banks' | 'bank_reconciliation';
  bankAccounts: BankAccount[];
  entries: JournalEntry[];
  settings: SystemSettings;
  onNavigate?: (sheet: string) => void;
  onUpdateSettings?: (newSettings: SystemSettings) => void;
}

export const TreasuryAndBanksView: React.FC<TreasuryAndBanksViewProps> = ({
  mode,
  bankAccounts,
  entries,
  settings,
  onNavigate,
  onUpdateSettings,
}) => {
  // Current active sub-tab inside banks / reconciliation - default to draft_sheet as main sheet
  const [activeTab, setActiveTab] = useState<'overview' | 'reconciliation' | 'draft_sheet'>('draft_sheet');

  // Selected Bank for detailed movement or reconciliation
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-03');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'reconciled' | 'unreconciled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Draft Rows State (User editable & prefilled)
  const [draftRows, setDraftRows] = useState<BankStatementDraftRow[]>(() =>
    getInitialBankDraftRows(bankAccounts)
  );

  // File import ref and feedback message
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotification, setImportNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Modal / Inline New Draft Row Form State
  const [isAddingDraftRow, setIsAddingDraftRow] = useState<boolean>(false);
  const [newRowDate, setNewRowDate] = useState<string>('2026-03-24');
  const [newRowDocNo, setNewRowDocNo] = useState<string>('');
  const [newRowCheckNo, setNewRowCheckNo] = useState<string>('');
  const [newRowCategory, setNewRowCategory] = useState<BankTransactionCategory>('مقدمات عمرة');
  const [newRowDesc, setNewRowDesc] = useState<string>('');
  const [newRowDeposit, setNewRowDeposit] = useState<number | ''>('');
  const [newRowWithdrawal, setNewRowWithdrawal] = useState<number | ''>('');
  const [newRowNotes, setNewRowNotes] = useState<string>('');

  // Row Editing Modal State
  const [editingRow, setEditingRow] = useState<BankStatementDraftRow | null>(null);

  // Print Movement Modal State
  const [printingAccount, setPrintingAccount] = useState<BankAccount | null>(null);

  // Real-time Liquidity Threshold Settings Modal State
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);
  const [tempTreasuryMin, setTempTreasuryMin] = useState<number>(settings.minTreasuryBalanceAlert ?? 100000);
  const [tempBankMin, setTempBankMin] = useState<number>(settings.minBankBalanceAlert ?? 1000000);
  const [tempAlertsEnabled, setTempAlertsEnabled] = useState<boolean>(settings.enableLiquidityAlerts !== false);

  useEffect(() => {
    setTempTreasuryMin(settings.minTreasuryBalanceAlert ?? 100000);
    setTempBankMin(settings.minBankBalanceAlert ?? 1000000);
    setTempAlertsEnabled(settings.enableLiquidityAlerts !== false);
  }, [settings.minTreasuryBalanceAlert, settings.minBankBalanceAlert, settings.enableLiquidityAlerts]);

  const handleSaveThresholds = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        minTreasuryBalanceAlert: tempTreasuryMin,
        minBankBalanceAlert: tempBankMin,
        enableLiquidityAlerts: tempAlertsEnabled,
      });
    }
    setIsThresholdModalOpen(false);
  };

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];

  // When switching months, ensure rows exist or auto-seed
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    const hasRows = draftRows.some((r) => r.month === newMonth);
    if (!hasRows) {
      const generated = generateMasterDraftTemplateForMonth(newMonth, bankAccounts);
      setDraftRows((prev) => [...prev, ...generated]);
    }
  };

  // Reset or reapply official master template for current month
  const handleResetMasterTemplateForMonth = () => {
    if (
      window.confirm(
        `هل تريد استدعاء وتطبيق نموذج الشيت الرئيسي المعتمد لشهر (${selectedMonth})؟ سيتم تحديث حركات الشهر وفق القالب الرسمي المعياري للجمعية.`
      )
    ) {
      const standardRows = generateMasterDraftTemplateForMonth(selectedMonth, bankAccounts);
      setDraftRows((prev) => [
        ...prev.filter((r) => r.month !== selectedMonth),
        ...standardRows,
      ]);
      setImportNotification({
        message: `تم تطبيق نموذج الشيت الرئيسي المعتمد لشهر ${selectedMonth} بنجاح (${standardRows.length} حركة بنكية معيارية).`,
        type: 'success',
      });
      setTimeout(() => setImportNotification(null), 6000);
    }
  };

  // Import Excel file uploaded by user
  const handleImportExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseBankDraftExcelFile(file, bankAccounts, selectedMonth);
      if (result.rows.length === 0) {
        setImportNotification({
          message: 'لم يتم العثور على أسطر صالحة في ملف الإكسيل المرفق.',
          type: 'error',
        });
      } else {
        // Merge with existing rows or replace current month
        setDraftRows((prev) => [
          ...prev.filter((r) => r.month !== selectedMonth),
          ...result.rows,
        ]);
        setImportNotification({
          message: `تم استيراد ${result.rowCount} حركة بنكية بنجاح من ورقة "${result.sheetName}" بملف الإكسيل المرفق لشهر ${selectedMonth}!`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setImportNotification({
        message: `خطأ أثناء قراءة ملف الإكسيل: ${err.message || 'الملف غير صالح'}`,
        type: 'error',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportNotification(null), 7000);
    }
  };

  // 1. Calculate General Ledger Movement for each bank account
  const getAccountMovement = (bank: BankAccount) => {
    const lines: Array<{
      date: string;
      entryNo: string;
      documentNo: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }> = [];

    let runningBalance = bank.bookBalance;

    const approvedEntries = entries
      .filter((e) => e.status === 'approved')
      .sort((a, b) => a.date.localeCompare(b.date));

    approvedEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (line.accountId === bank.glAccountId || line.accountCode === '1121' || line.accountCode === '1122') {
          // match specific gl account
          if (
            (bank.id === 'bnk-1' && line.accountCode === '1121') ||
            (bank.id === 'bnk-2' && line.accountCode === '1122')
          ) {
            const dr = Number(line.debit) || 0;
            const cr = Number(line.credit) || 0;
            runningBalance += dr - cr;
            lines.push({
              date: entry.date,
              entryNo: entry.entryNo,
              documentNo: entry.documentNo,
              description: line.notes || entry.description,
              debit: dr,
              credit: cr,
              balance: runningBalance,
            });
          }
        }
      });
    });

    return lines;
  };

  // 2. Draft sheet calculations with status filter
  const filteredDraftRows = useMemo(() => {
    return draftRows.filter((r) => {
      const matchBank = !selectedBankId || r.bankAccountId === selectedBankId;
      const matchMonth = !selectedMonth || r.month === selectedMonth;
      const matchCategory = filterCategory === 'all' || r.category === filterCategory;
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'reconciled' && r.isReconciled) ||
        (filterStatus === 'unreconciled' && !r.isReconciled);
      const matchSearch =
        !searchQuery ||
        r.description.includes(searchQuery) ||
        r.documentNo.includes(searchQuery) ||
        r.checkNumber.includes(searchQuery) ||
        r.category.includes(searchQuery);
      return matchBank && matchMonth && matchCategory && matchStatus && matchSearch;
    });
  }, [draftRows, selectedBankId, selectedMonth, filterCategory, filterStatus, searchQuery]);

  const totalDraftDeposits = filteredDraftRows.reduce((sum, r) => sum + r.depositAmount, 0);
  const totalDraftWithdrawals = filteredDraftRows.reduce((sum, r) => sum + r.withdrawalAmount, 0);

  // Accurate Bank reconciliation math for current selected bank & month from draft
  const currentReconciliation = useMemo(() => {
    if (!selectedBank) return null;
    return calculateReconciliationFromDraft(selectedMonth, selectedBank.id, selectedBank, draftRows);
  }, [selectedMonth, selectedBank, draftRows]);

  // Bank reconciliation math for current selected bank & month
  const unreconciledDeposits = draftRows
    .filter((r) => (!selectedBankId || r.bankAccountId === selectedBankId) && r.month === selectedMonth && !r.isReconciled && r.depositAmount > 0)
    .reduce((sum, r) => sum + r.depositAmount, 0);

  const unreconciledWithdrawals = draftRows
    .filter((r) => (!selectedBankId || r.bankAccountId === selectedBankId) && r.month === selectedMonth && !r.isReconciled && r.withdrawalAmount > 0)
    .reduce((sum, r) => sum + r.withdrawalAmount, 0);

  const bookBal = selectedBank ? selectedBank.bookBalance : 0;
  const stmtBal = selectedBank ? selectedBank.statementBalance : 0;
  const adjustedBookBalance = bookBal + unreconciledDeposits - unreconciledWithdrawals;
  const diffReconciliation = stmtBal - adjustedBookBalance;

  // Save edited row handler
  const handleSaveEditedRow = (updated: BankStatementDraftRow) => {
    setDraftRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditingRow(null);
  };

  // Add new row handler
  const handleAddNewDraftRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRowDate || !newRowDocNo) {
      alert('يرجى إدخال تاريخ العملية ورقم المستند');
      return;
    }

    const newRow: BankStatementDraftRow = {
      id: `drf-${Date.now()}`,
      month: selectedMonth || '2026-03',
      date: newRowDate,
      documentNo: newRowDocNo,
      checkNumber: newRowCheckNo,
      category: newRowCategory,
      description: newRowDesc || `حركة ${newRowCategory}`,
      depositAmount: Number(newRowDeposit) || 0,
      withdrawalAmount: Number(newRowWithdrawal) || 0,
      bankAccountId: selectedBankId,
      notes: newRowNotes,
      isReconciled: true,
    };

    setDraftRows((prev) => [newRow, ...prev]);
    setIsAddingDraftRow(false);
    // Reset form
    setNewRowDocNo('');
    setNewRowCheckNo('');
    setNewRowDesc('');
    setNewRowDeposit('');
    setNewRowWithdrawal('');
    setNewRowNotes('');
  };

  const handleDeleteDraftRow = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السطر من شيت درافت التسوية؟')) {
      setDraftRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleToggleReconciled = (id: string) => {
    setDraftRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isReconciled: !r.isReconciled } : r))
    );
  };

  // Treasury Calculations
  const treasuryLines: any[] = [];
  let treasuryBalance = 150000;

  entries
    .filter((e) => e.status === 'approved')
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((entry) => {
      entry.lines.forEach((line) => {
        if (line.accountCode === '1111' || line.accountName.includes('خزينة')) {
          const dr = Number(line.debit) || 0;
          const cr = Number(line.credit) || 0;
          treasuryBalance += dr - cr;
          treasuryLines.push({
            date: entry.date,
            documentNo: entry.documentNo,
            description: line.notes || entry.description,
            receiptDr: dr,
            paymentCr: cr,
            balance: treasuryBalance,
          });
        }
      });
    });

  // ==========================================
  // REAL-TIME LIQUIDITY MONITORING CALCULATIONS
  // ==========================================
  const isLiquidityAlertsEnabled = settings.enableLiquidityAlerts !== false;
  const minTreasuryThreshold = settings.minTreasuryBalanceAlert ?? 100000;
  const minBankDefaultThreshold = settings.minBankBalanceAlert ?? 1000000;

  // Real-time Treasury status
  const isTreasuryLiquidityLow = isLiquidityAlertsEnabled && treasuryBalance < minTreasuryThreshold;
  const isTreasuryCritical = isLiquidityAlertsEnabled && treasuryBalance <= 0;
  const treasuryDeficit = Math.max(0, minTreasuryThreshold - treasuryBalance);
  const treasurySurplus = Math.max(0, treasuryBalance - minTreasuryThreshold);
  const treasuryPercentage = minTreasuryThreshold > 0 ? (treasuryBalance / minTreasuryThreshold) * 100 : 100;

  // Real-time Bank accounts liquidity statuses
  const bankLiquidityStatuses = useMemo(() => {
    return bankAccounts.map((b) => {
      const movement = getAccountMovement(b);
      const realtimeBalance = movement.length > 0 ? movement[movement.length - 1].balance : b.bookBalance;
      const minThreshold =
        (settings.bankMinBalances && settings.bankMinBalances[b.id]) ??
        (b.minBalanceAlert ?? minBankDefaultThreshold);
      const isLow = isLiquidityAlertsEnabled && realtimeBalance < minThreshold;
      const isCritical = isLiquidityAlertsEnabled && realtimeBalance <= 0;
      const deficit = Math.max(0, minThreshold - realtimeBalance);
      const surplus = Math.max(0, realtimeBalance - minThreshold);
      const percentage = minThreshold > 0 ? (realtimeBalance / minThreshold) * 100 : 100;

      return {
        bank: b,
        realtimeBalance,
        minThreshold,
        isLow,
        isCritical,
        deficit,
        surplus,
        percentage,
      };
    });
  }, [bankAccounts, entries, settings, isLiquidityAlertsEnabled, minBankDefaultThreshold]);

  const lowLiquidityBanks = bankLiquidityStatuses.filter((s) => s.isLow);
  const hasLowLiquidityBanks = lowLiquidityBanks.length > 0;
  const selectedBankStatus = bankLiquidityStatuses.find((s) => s.bank.id === selectedBank?.id);

  // ==========================================
  // QUICK THRESHOLD ADJUSTMENT MODAL RENDERER
  // ==========================================
  const renderThresholdModal = () => {
    if (!isThresholdModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn text-right">
        <div className="bg-[#0f111d] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>إعدادات حدود أمان السيولة النقدية والمصرفية</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                    رصد لحظي
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  تحديد الحد الأدنى للسيولة المعتمد لإطلاق تنبيهات "انخفاض السيولة"
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsThresholdModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveThresholds} className="space-y-4">
            {/* Toggle Switch */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-xs font-bold text-white block">تفعيل التنبيهات اللحظية لانخفاض السيولة</span>
                  <span className="text-[11px] text-slate-400">إظهار لافتات التحذير فور انخفاض الرصيد عن الحد الأدنى</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={tempAlertsEnabled}
                onChange={(e) => setTempAlertsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
            </div>

            {/* Treasury Input */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>الحد الأدنى لرصيد الخزينة النقدية (كود 1111):</span>
                </label>
                <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                  الرصيد الفعلي الحالي: {treasuryBalance.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                عند هبوط رصيد الخزينة عن هذا الحد، يُطلق النظام تنبيهاً فورياً باللون الكهرماني/الأحمر لمنع نفاد النقدية.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={tempTreasuryMin}
                  onChange={(e) => setTempTreasuryMin(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono-num font-bold text-xs focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                  {settings.currencySymbol}
                </span>
              </div>
            </div>

            {/* Bank Input */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-blue-400" />
                  <span>الحد الأدنى لرصيد الحسابات البنكية (كود 1121 / 1122):</span>
                </label>
                <span className="text-[10px] text-blue-400/90 font-mono font-bold">
                  إجمالي البنوك الحالي: {bankAccounts.reduce((s, b) => s + b.bookBalance, 0).toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يطلق النظام تنبيهاً فور هبوط رصيد أي حساب بنكي دون هذا الحد لتغطية الشيكات المتداولة وتجنب الارتجاع.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="50000"
                  required
                  value={tempBankMin}
                  onChange={(e) => setTempBankMin(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono-num font-bold text-xs focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                  {settings.currencySymbol}
                </span>
              </div>
            </div>

            {/* Quick Test / Simulation Presets */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                اختبار ومحاكاة التنبيهات اللحظية (معاينة فورية للاستجابة):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setTempTreasuryMin(200000); // 200k > 150k -> Triggers Treasury Alert
                    setTempAlertsEnabled(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-right cursor-pointer"
                  title="تعيين حد الخزينة 200,000 ج.م لإظهار تنبيه انخفاض السيولة بالخزينة فوراً"
                >
                  ⚡ محاكاة عجز الخزينة (200 ألف)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempBankMin(3000000); // 3M > 2.45M -> Triggers Bank Alert for Bank Misr Current!
                    setTempAlertsEnabled(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-right cursor-pointer"
                  title="تعيين حد البنك 3,000,000 ج.م لإظهار تنبيه انخفاض السيولة المصرفية فوراً"
                >
                  ⚡ محاكاة انخفاض البنك (3 ملايين)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempTreasuryMin(100000);
                    setTempBankMin(1000000);
                    setTempAlertsEnabled(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-semibold text-right cursor-pointer"
                >
                  ✓ الحدود القياسية (100 ألف / 1 مليون)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempTreasuryMin(50000);
                    setTempBankMin(500000);
                    setTempAlertsEnabled(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-right cursor-pointer"
                >
                  ✓ حدود أمان مخفضة (أمان تام)
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsThresholdModalOpen(false);
                  onNavigate?.('settings');
                }}
                className="text-xs text-slate-400 hover:text-white underline underline-offset-2 cursor-pointer"
              >
                شيت الإعدادات الكاملة (Sheet 35)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsThresholdModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتطبيق فوري</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ==========================================
  // MODE 1: TREASURY (الخزينة)
  // ==========================================
  if (mode === 'treasury') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>يومية حركة الخزينة النقدية الرئيسية (Cash Register)</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
                  كود 1111
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                متابعة المقبوضات والمدفوعات النقدية اللحظية والرصد الفوري لحدود الأمان والسيولة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsThresholdModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              title="تعديل الحد الأدنى الآمن لرصيد الخزينة"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>حد أمان السيولة ({minTreasuryThreshold.toLocaleString()} {settings.currencySymbol})</span>
            </button>

            <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">رصيد الخزينة اللحظي:</span>
              <span
                className={`text-base font-bold font-mono-num ${
                  isTreasuryLiquidityLow ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {treasuryBalance.toLocaleString()} {settings.currencySymbol}
              </span>
              {isTreasuryLiquidityLow ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  انخفاض السيولة!
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  سيولة آمنة
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Liquidity Alert or Reassuring Health Banner */}
        {isTreasuryLiquidityLow ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-950/75 via-slate-950 to-rose-950/60 border-2 border-rose-500/70 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center animate-bounce flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-rose-300">
                      تنبيه رقابي عاجل: انخفاض السيولة النقدية بالخزينة عن الحد الأدنى المقرر!
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-bold border border-rose-500/50">
                      رصد لحظي فوري
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/90 pt-0.5">
                    رصيد الخزينة الحالي هبط دون حد الأمان المعتمد في إعدادات النظام ({minTreasuryThreshold.toLocaleString()} {settings.currencySymbol}).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsThresholdModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold border border-rose-500/40 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>تعديل حد الأمان في الإعدادات</span>
                </button>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/90 border border-rose-500/30 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block">رصيد الخزينة الفعلي الحالي</span>
                <span className="text-base sm:text-lg font-bold font-mono-num text-rose-300 block pt-1">
                  {treasuryBalance.toLocaleString()} {settings.currencySymbol}
                </span>
                <span className="text-[10px] text-rose-400 font-medium">رصيد دفتري تراكمي</span>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block">الحد الأدنى الآمن (الإعدادات)</span>
                <span className="text-base sm:text-lg font-bold font-mono-num text-amber-300 block pt-1">
                  {minTreasuryThreshold.toLocaleString()} {settings.currencySymbol}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">الحد الرقابي المعتمد</span>
              </div>

              <div className="bg-slate-950/90 border border-rose-500/40 rounded-xl p-3">
                <span className="text-[11px] text-rose-400 block font-bold">عجز السيولة عن الحد الآمن</span>
                <span className="text-base sm:text-lg font-bold font-mono-num text-rose-400 block pt-1">
                  -{treasuryDeficit.toLocaleString()} {settings.currencySymbol}
                </span>
                <span className="text-[10px] text-rose-400/90 font-medium">قيمة النقص المطلوب تغذيتها</span>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block">نسبة كفاية الرصيد</span>
                <span className="text-base sm:text-lg font-bold font-mono-num text-rose-300 block pt-1">
                  {treasuryPercentage.toFixed(1)}%
                </span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, treasuryPercentage))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Operational Impact & Direct Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-rose-500/30 text-xs">
              <div className="flex items-center gap-2 text-rose-200">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>
                  <strong>الإجراء المطلوب:</strong> يُرجى إصدار أمر سحب بنكي لتغذية الخزينة أو تعجيل توريد مقبوضات الاشتراكات لتفادي تعطل سداد المصروفات النثرية المستعجلة.
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onNavigate?.('entry_voucher_form')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow cursor-pointer text-xs"
                >
                  سند صرف لتغذية الخزينة
                </button>
                <button
                  onClick={() => onNavigate?.('banks')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all text-xs cursor-pointer"
                >
                  التحقق من أرصدة البنوك
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white flex items-center gap-2">
                  <span>الرصد اللحظي للسيولة النقدية: الرصيد في النطاق الآمن المعتمد</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    سيولة مستقرة
                  </span>
                </span>
                <p className="text-slate-400 text-[11px] pt-0.5">
                  رصيد الخزينة الحالي ({treasuryBalance.toLocaleString()} {settings.currencySymbol}) يحقق فائض أمان قدره (+{treasurySurplus.toLocaleString()} {settings.currencySymbol}) فوق الحد الأدنى المقرر في الإعدادات ({minTreasuryThreshold.toLocaleString()} {settings.currencySymbol}).
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsThresholdModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-colors flex-shrink-0 cursor-pointer"
              title="تعديل الحد الأدنى الآمن للسيولة في إعدادات النظام"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>إعدادات حد الأمان ({minTreasuryThreshold.toLocaleString()} {settings.currencySymbol})</span>
            </button>
          </div>
        )}

        {/* Treasury Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">رقم المستند</th>
                <th className="p-3">البيان والشرح</th>
                <th className="p-3 text-emerald-400">وارد / مقبوضات (ج.م)</th>
                <th className="p-3 text-rose-400">منصرف / مدفوعات (ج.م)</th>
                <th className="p-3 text-amber-400">الرصيد التراكمي (ج.م)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="bg-slate-900/40 text-slate-400">
                <td className="p-3 font-mono-num">2026-01-01</td>
                <td className="p-3">رصيد أول المدة</td>
                <td className="p-3 font-medium">الرصيد النقدي الافتتاحي للخزينة الرئيسية</td>
                <td className="p-3 font-mono-num font-bold text-emerald-400">150,000</td>
                <td className="p-3 font-mono-num text-slate-500">0.00</td>
                <td className="p-3 font-mono-num font-bold text-amber-400">150,000</td>
              </tr>
              {treasuryLines.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 text-slate-300">
                  <td className="p-3 font-mono-num">{row.date}</td>
                  <td className="p-3 font-mono-num text-blue-400">{row.documentNo}</td>
                  <td className="p-3 font-medium">{row.description}</td>
                  <td className="p-3 font-mono-num font-bold text-emerald-400">
                    {row.receiptDr > 0 ? row.receiptDr.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 font-mono-num font-bold text-rose-400">
                    {row.paymentCr > 0 ? row.paymentCr.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 font-mono-num font-bold text-amber-400">
                    {row.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Real-time Liquidity Threshold Adjustment Modal */}
        {renderThresholdModal()}
      </div>
    );
  }

  // ==========================================
  // MODE 2 & 3: BANKS & BANK RECONCILIATION
  // ==========================================
  const totalBook = bankAccounts.reduce((s, b) => s + b.bookBalance, 0);
  const totalStmt = bankAccounts.reduce((s, b) => s + b.statementBalance, 0);

  return (
    <div className="space-y-5">
      {/* Top Header in Pulvent Brand Scheme */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#131626] border border-[#232742] p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3632c7] to-[#39e3d7] p-0.5 flex items-center justify-center shadow-lg shadow-[#3632c7]/30">
            <div className="w-full h-full bg-[#0B0D17] rounded-[10px] flex items-center justify-center">
              <Landmark className="w-6 h-6 text-[#39e3d7]" />
            </div>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>إدارة الحسابات البنكية والتسوية الشهرية</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#3632c7]/25 text-[#39e3d7] font-semibold border border-[#39e3d7]/30">
                {bankAccounts.length} حسابات مصرفية معتمدة
              </span>
            </h2>
            <p className="text-xs text-[#8E92BC]">
              بنك مصر (حساب جاري 1121) • بنك مصر (أذون خزانة 1122) • التسويات البنكية وشيت الدرافت المتقدم
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Button: تنزيل شيت درافت للتعبئة والتسوية */}
          <button
            onClick={() =>
              exportBankReconciliationDraftTemplate(
                bankAccounts,
                draftRows,
                selectedBankId || undefined,
                selectedMonth
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#3632c7] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-lg shadow-[#3632c7]/30 transition-all cursor-pointer active:scale-95"
            title="تنزيل شيت إكسيل مسودة درافت لتعبئة أرقام المتحصل والمنصرف بالبنك وبنود التسوية"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل شيت درافت التسوية (Excel)</span>
          </button>

          {/* Button: تحميل شيت البنك */}
          <button
            onClick={() => {
              if (selectedBank) {
                exportOfficialBankSheet(selectedBank, entries, draftRows, selectedMonth);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A1860] hover:bg-[#242182] text-[#D7D6F4] hover:text-white text-xs font-bold border border-[#3632c7]/60 shadow transition-all cursor-pointer"
            title="تصدير كشف حساب البنك المعتمد مع ملخص العمليات والتسويات"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#39e3d7]" />
            <span>تحميل شيت البنك (كشف الحساب)</span>
          </button>

          {/* Button: عمل تسوية البنك */}
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'bg-[#3632c7] text-white ring-2 ring-[#39e3d7]'
                : 'bg-[#131626] hover:bg-[#1b1f36] text-[#D7D6F4] border border-[#232742]'
            }`}
          >
            <Scale className="w-4 h-4 text-[#39e3d7]" />
            <span>عمل تسوية البنك</span>
          </button>
        </div>
      </div>

      {/* Real-time Bank Liquidity Alert Banner */}
      {hasLowLiquidityBanks ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-950/75 via-slate-950 to-rose-950/60 border-2 border-rose-500/70 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center animate-bounce flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-rose-300">
                    تنبيه انخفاض السيولة المصرفية: هبوط رصيد ({lowLiquidityBanks.length}) حساب بنكي دون الحد الأدنى!
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-bold border border-rose-500/50">
                    رصد لحظي فوري
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 pt-0.5">
                  رصد فوري لسلامة أرصدة البنوك لتغطية الشيكات الصادرة وتجنب السحب على المكشوف أو الارتجاع المصرفي.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsThresholdModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold border border-rose-500/40 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>إعدادات حدود أمان البنوك</span>
              </button>
            </div>
          </div>

          {/* Cards for each low-liquidity bank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lowLiquidityBanks.map((item) => (
              <div
                key={item.bank.id}
                className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-500/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{item.bank.bankName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold font-mono-num">
                    عجز سيولة: -{item.deficit.toLocaleString()} {settings.currencySymbol}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الرصيد اللحظي:</span>
                    <span className="font-mono-num font-bold text-rose-300">
                      {item.realtimeBalance.toLocaleString()} {settings.currencySymbol}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">الحد الأدنى المقرر:</span>
                    <span className="font-mono-num font-bold text-amber-300">
                      {item.minThreshold.toLocaleString()} {settings.currencySymbol}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">نسبة التغطية:</span>
                    <span className="font-mono-num font-bold text-rose-400">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-300 border-t border-slate-900">
                  <span className="text-rose-200/90 text-[10px]">
                    {item.bank.id === 'bnk-1'
                      ? 'يوصى بتحويل سيولة من محفظة أذون الخزانة (بنك مصر 1122) لتغطية الشيكات المتداولة.'
                      : 'يوصى بإعادة هيكلة استثمارات أذون الخزانة وتجديد الاستحقاقات.'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBankId(item.bank.id);
                      setActiveTab('overview');
                    }}
                    className="text-[10px] text-cyan-300 hover:text-white underline cursor-pointer"
                  >
                    معاينة الحساب
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-[#131626] border border-emerald-500/30 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white flex items-center gap-2">
                <span>الرصد اللحظي للسيولة المصرفية: كافة الحسابات البنكية ({bankAccounts.length}) في النطاق الآمن</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  مؤشر أمان 100%
                </span>
              </span>
              <p className="text-[#8E92BC] text-[11px] pt-0.5">
                كافة الأرصدة البنكية أعلى من الحد الأدنى الآمن المقرر في إعدادات النظام ({minBankDefaultThreshold.toLocaleString()} {settings.currencySymbol}).
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsThresholdModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0D17] hover:bg-[#1a1d30] text-[#39e3d7] border border-[#232742] text-[11px] font-semibold transition-colors flex-shrink-0 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>حد أمان البنوك ({minBankDefaultThreshold.toLocaleString()} {settings.currencySymbol})</span>
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs in Pulvent Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232742] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('draft_sheet')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'draft_sheet'
                ? 'bg-gradient-to-r from-[#3632c7] to-[#1A1860] text-[#39e3d7] border border-[#39e3d7]/50 shadow-lg shadow-[#3632c7]/20 ring-1 ring-[#39e3d7]/30'
                : 'text-[#8E92BC] hover:text-white hover:bg-[#131626] border border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#39e3d7]" />
            <span>الشيت الرئيسي لدرافت التسوية البنكية</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#39e3d7]/20 text-[#39e3d7] font-mono-num font-bold">
              {draftRows.filter((r) => r.month === selectedMonth).length} حركة
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'bg-[#3632c7]/30 text-[#39e3d7] border border-[#39e3d7]/40 shadow-sm'
                : 'text-[#8E92BC] hover:text-white hover:bg-[#131626] border border-transparent'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>مذكرة التسوية والمطابقة البنكية</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#3632c7]/30 text-[#39e3d7] border border-[#39e3d7]/40 shadow-sm'
                : 'text-[#8E92BC] hover:text-white hover:bg-[#131626] border border-transparent'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>أرصدة وكروت الحسابات البنكية</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live Liquidity Status Pill for Selected Bank */}
          {selectedBankStatus && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                selectedBankStatus.isLow
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {selectedBankStatus.isLow ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>تنبيه سيولة: {selectedBank?.bankName} (عجز -{selectedBankStatus.deficit.toLocaleString()} {settings.currencySymbol})</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>سيولة {selectedBank?.bankName}: آمنة (+{selectedBankStatus.surplus.toLocaleString()} {settings.currencySymbol})</span>
                </>
              )}
            </div>
          )}

          {/* Month Selector for all 12 fiscal months */}
          <div className="flex items-center gap-2 text-xs bg-[#131626] p-1.5 px-3 rounded-xl border border-[#232742]">
            <Calendar className="w-3.5 h-3.5 text-[#39e3d7]" />
            <span className="text-[#8E92BC] font-medium">الشهر المالي للدرافت:</span>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-[#0B0D17] border border-[#232742] text-[#39e3d7] font-bold rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none focus:border-[#39e3d7] text-xs"
            >
              {FISCAL_MONTHS_2026.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.labelAr} ({m.quarterAr})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ==========================================
          SUB-TAB 1: OVERVIEW & BANK CARDS
      ========================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow">
              <span className="text-xs text-slate-400">إجمالي الأرصدة الدفترية بالبنوك</span>
              <p className="text-lg sm:text-xl font-bold font-mono-num text-white pt-1">
                {totalBook.toLocaleString()} {settings.currencySymbol}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow">
              <span className="text-xs text-slate-400">إجمالي رصيد كشوف الحسابات المعتمدة</span>
              <p className="text-lg sm:text-xl font-bold font-mono-num text-blue-400 pt-1">
                {totalStmt.toLocaleString()} {settings.currencySymbol}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow">
              <span className="text-xs text-slate-400">فارق التسوية الإجمالي (معلقات بالطريق)</span>
              <p className="text-lg sm:text-xl font-bold font-mono-num text-emerald-400 pt-1">
                {(totalStmt - totalBook).toLocaleString()} {settings.currencySymbol}
              </p>
            </div>
          </div>

          {/* Bank Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((b) => {
              const diff = b.statementBalance - b.bookBalance;
              const movement = getAccountMovement(b);

              return (
                <div
                  key={b.id}
                  className={`bg-slate-950 border rounded-xl p-5 shadow-xl transition-all space-y-4 ${
                    selectedBankId === b.id
                      ? 'border-blue-500/60 ring-1 ring-blue-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white">{b.bankName}</h3>
                        {b.id === 'bnk-2' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                            سندات وأذون خزانة
                          </span>
                        )}
                        {b.id === 'bnk-1' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40">
                            حساب جاري رئيسي
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                          حساب افتراضي معتمد
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 pt-0.5">{b.branch}</p>
                      {b.accountRoleAr && (
                        <p className="text-[11px] text-cyan-200/90 pt-0.5 font-medium">
                          {b.accountRoleAr}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs pt-1">
                        <span className="font-mono-num text-amber-300 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                          رقم الحساب: {b.accountNumber}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 font-mono-num">
                          كود الدليل: {b.glAccountId}
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                      <Building className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Balance Details */}
                  <div className="space-y-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الرصيد الدفتري المسجل بالجمعية:</span>
                      <span className="font-mono-num font-bold text-white text-sm">
                        {b.bookBalance.toLocaleString()} {settings.currencySymbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">رصيد كشف حساب البنك المعتمد:</span>
                      <span className="font-mono-num font-bold text-blue-300 text-sm">
                        {b.statementBalance.toLocaleString()} {settings.currencySymbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                      <span className="text-slate-400">فارق المطابقة والتسوية:</span>
                      <span
                        className={`font-mono-num font-bold ${
                          diff === 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {diff === 0 ? 'مطابق تماماً (0.00)' : `${diff.toLocaleString()} ${settings.currencySymbol}`}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Liquidity Status for this Bank */}
                  {(() => {
                    const bStatus = bankLiquidityStatuses.find((s) => s.bank.id === b.id);
                    if (!bStatus) return null;

                    return bStatus.isLow ? (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-between font-bold text-rose-300">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse flex-shrink-0" />
                            <span>تنبيه: انخفاض السيولة دون الحد الأدنى</span>
                          </span>
                          <span className="font-mono-num text-rose-400 font-bold">
                            عجز -{bStatus.deficit.toLocaleString()} {settings.currencySymbol}
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-200/80 leading-relaxed">
                          الرصيد الدفتري اللحظي ({bStatus.realtimeBalance.toLocaleString()} {settings.currencySymbol}) هبط عن حد الأمان المعتمد في الإعدادات ({bStatus.minThreshold.toLocaleString()} {settings.currencySymbol}).
                        </p>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, bStatus.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs flex items-center justify-between text-emerald-300">
                        <span className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>سيولة مصرفية آمنة ومستقرة</span>
                        </span>
                        <span className="font-mono-num text-[11px] text-emerald-400 font-semibold">
                          فائض +{bStatus.surplus.toLocaleString()} {settings.currencySymbol} فوق الحد الآمن
                        </span>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>تاريخ آخر مطابقة:</span>
                      <span className="font-mono-num text-slate-300 font-semibold">
                        {b.lastReconciledDate}
                      </span>
                    </span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>حالة الحساب: نشط</span>
                    </span>
                  </div>

                  {/* Specific Action Buttons for each account */}
                  <div className="pt-2 border-t border-[#232742] flex flex-wrap items-center gap-2">
                    {/* زر طباعة حركة الحساب */}
                    <button
                      onClick={() => setPrintingAccount(b)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white text-xs font-semibold border border-[#232742] hover:border-[#39e3d7]/50 transition-colors cursor-pointer group"
                      title="طباعة كشف حركة الحساب والأستاذ العام"
                    >
                      <Printer className="w-4 h-4 text-[#8E92BC] group-hover:text-white group-hover:scale-110 transition-transform" />
                      <span>طباعة حركة الحساب</span>
                    </button>

                    {/* زر عمل تسوية البنك لهذا الحساب */}
                    <button
                      onClick={() => {
                        setSelectedBankId(b.id);
                        setActiveTab('reconciliation');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#3632c7]/20 hover:bg-[#3632c7]/35 text-[#39e3d7] text-xs font-semibold border border-[#3632c7]/50 transition-colors cursor-pointer group"
                      title="فتح نموذج تسوية البنك لهذا الحساب"
                    >
                      <Scale className="w-4 h-4 text-[#39e3d7] group-hover:scale-110 transition-transform" />
                      <span>تسوية الحساب</span>
                    </button>

                    {/* زر تحميل شيت البنك */}
                    <button
                      onClick={() => exportOfficialBankSheet(b, entries, draftRows, selectedMonth)}
                      className="p-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] text-[#8E92BC] hover:text-[#39e3d7] border border-[#232742] hover:border-[#39e3d7]/40 transition-colors cursor-pointer flex items-center justify-center group"
                      title="تحميل شيت إكسيل لكشف حساب هذا البنك"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#39e3d7] group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-TAB 2: BANK RECONCILIATION (مذكرة التسوية)
      ========================================== */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>مذكرة التسوية البنكية المعتمدة لشهر {selectedMonth}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    مطابق ومعتمد 100%
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  مقارنة الرصيد الدفتري برصيد كشف الحساب وتحديد معلقات الشيكات والإيداعات بالطريق
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white text-xs font-semibold border border-[#232742] hover:border-[#39e3d7]/50 transition-colors cursor-pointer group"
              >
                <Printer className="w-4 h-4 text-[#8E92BC] group-hover:text-white group-hover:scale-110 transition-transform" />
                <span>طباعة مذكرة التسوية</span>
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5 min-w-[280px]">بيان التسوية والمطابقة البنكية المعيارية</th>
                  <th className="p-3.5 text-center">
                    <div>بنك مصر - جاري رئيسي</div>
                    <div className="text-[11px] font-mono-num text-slate-400 font-normal">
                      حساب رقم (1990199000000018)
                    </div>
                  </th>
                  <th className="p-3.5 text-center">
                    <div>بنك مصر - سندات وأذون خزانة</div>
                    <div className="text-[11px] font-mono-num text-emerald-400 font-normal">
                      حساب رقم (1990199000000203)
                    </div>
                  </th>
                  <th className="p-3.5 text-center text-amber-300">الإجمالي العام للبنوك (ج.م)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {/* 1. الرصيد الدفتري */}
                <tr className="hover:bg-slate-900/40 text-slate-300 font-semibold">
                  <td className="p-3.5 text-white">الرصيد الدفتري بحسابات الجمعية في نهاية الفترة</td>
                  <td className="p-3.5 text-center font-mono-num font-bold text-white">2,450,000</td>
                  <td className="p-3.5 text-center font-mono-num font-bold text-white">9,020,000</td>
                  <td className="p-3.5 text-center font-mono-num font-bold text-amber-300">
                    11,470,000
                  </td>
                </tr>

                {/* 2. يضاف: إيداعات بالطريق */}
                <tr className="hover:bg-slate-900/40 text-slate-300">
                  <td className="p-3.5 text-emerald-400">
                    (+) يضاف: إيداعات بالطريق وشيكات تحت التحصيل لم تظهر بكشف البنك
                  </td>
                  <td className="p-3.5 text-center font-mono-num font-bold text-emerald-400">
                    + 120,000
                  </td>
                  <td className="p-3.5 text-center font-mono-num text-slate-500">0.00</td>
                  <td className="p-3.5 text-center font-mono-num font-bold text-emerald-400">
                    + 120,000
                  </td>
                </tr>

                {/* 3. يخصم: شيكات صادرة لم تصرف */}
                <tr className="hover:bg-slate-900/40 text-slate-300">
                  <td className="p-3.5 text-rose-400">
                    (-) يخصم: شيكات صادرة لم تصرف من البنك بعد (حساب وسيط الشيكات 2141)
                  </td>
                  <td className="p-3.5 text-center font-mono-num font-bold text-rose-400">
                    - 95,000
                  </td>
                  <td className="p-3.5 text-center font-mono-num text-slate-500">0.00</td>
                  <td className="p-3.5 text-center font-mono-num font-bold text-rose-400">
                    - 95,000
                  </td>
                </tr>

                {/* 4. يخصم: مصاريف بنكية لم تسجل */}
                <tr className="hover:bg-slate-900/40 text-slate-300">
                  <td className="p-3.5 text-amber-400">
                    (-) يخصم: مصروفات وعمولات مصرفية مقيدة بالبنك ولم تسجل بالدفاتر
                  </td>
                  <td className="p-3.5 text-center font-mono-num text-slate-500">0.00</td>
                  <td className="p-3.5 text-center font-mono-num text-slate-500">0.00</td>
                  <td className="p-3.5 text-center font-mono-num text-slate-500">0.00</td>
                </tr>

                {/* 5. يضاف: عوائد بنكية */}
                <tr className="hover:bg-slate-900/40 text-slate-300">
                  <td className="p-3.5 text-teal-400">
                    (+) يضاف: عوائد وأرباح بنكية مقيدة بالبنك ولم تثبت بعد بالدفاتر
                  </td>
                  <td className="p-3.5 text-center font-mono-num text-slate-500">0.00</td>
                  <td className="p-3.5 text-center font-mono-num text-slate-500">0.00</td>
                  <td className="p-3.5 text-center font-mono-num text-slate-500">0.00</td>
                </tr>

                {/* 6. الرصيد المعدل المطابق */}
                <tr className="bg-slate-900/70 font-bold text-white border-t-2 border-slate-700">
                  <td className="p-3.5 text-sm">الرصيد المعدل المطابق لكشف حساب البنك المعتمد</td>
                  <td className="p-3.5 text-center font-mono-num text-emerald-400 text-sm font-bold">
                    2,475,000
                  </td>
                  <td className="p-3.5 text-center font-mono-num text-emerald-400 text-sm font-bold">
                    9,020,000
                  </td>
                  <td className="p-3.5 text-center font-mono-num text-amber-300 text-sm font-bold">
                    11,495,000
                  </td>
                </tr>

                {/* 7. حالة المطابقة */}
                <tr className="bg-emerald-950/20 text-emerald-300 font-bold">
                  <td className="p-3.5">حالة المطابقة والرقابة الدورية</td>
                  <td className="p-3.5 text-center">مطابق ومعتمد 100%</td>
                  <td className="p-3.5 text-center">مطابق ومعتمد 100%</td>
                  <td className="p-3.5 text-center">مطابق ومعتمد 100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Reconciliation Audit Notes */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-slate-300">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4" />
              <span>ضوابط الرقابة الداخلية وإجراءات الاعتماد:</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pr-2">
              <li>
                تم دمج حسابات بنك مصر وحساب أذون الخزانة في منظومة متوافقة مع متطلبات مراجعي الجهاز
                المركزي للمحاسبات.
              </li>
              <li>
                حساب وسيط الشيكات الصادرة (2141) يعكس كافة الشيكات المسلمة للموردين التي لم تصرف من
                البنك حتى تاريخ إقفال كشف الحساب.
              </li>
              <li>
                كافة العوائد البنكية وأرباح أذون الخزانة يتم إثباتها وفق إشعارات الإضافة المعتمدة من
                إدارة المعاملات المالية ببنك مصر.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-TAB 3: DRAFT SHEET (الشيت الرئيسي لدرافت حركة البنك والتسوية الشهرية)
      ========================================== */}
      {activeTab === 'draft_sheet' && (
        <div className="space-y-4">
          {/* Master Sheet Brand Banner */}
          <div className="bg-gradient-to-r from-[#1A1860] via-[#131626] to-[#0A2540] border border-[#3632c7]/50 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#39e3d7]/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3632c7] to-[#39e3d7] p-0.5 flex items-center justify-center shadow-lg shadow-[#3632c7]/40">
                  <div className="w-full h-full bg-[#0B0D17] rounded-[10px] flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-[#39e3d7]" />
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      الشيت الرئيسي لدرافت حركة البنك والتسوية الشهرية
                    </h3>
                    <span className="text-[11px] px-3 py-0.5 rounded-full bg-[#39e3d7]/20 text-[#39e3d7] font-bold border border-[#39e3d7]/40">
                      القالب الرئيسي المعتمد لكل شهر
                    </span>
                  </div>
                  <p className="text-xs text-[#8E92BC] pt-1">
                    الشيت المعتمد لتسجيل وإدخال كافة مقبوضات ومنصرفات البنوك شهرياً (مقدمات حج، عمرة، مرتبات، حوافز، مكافآت، شيكات، إعانات، عوائد) واحتساب التسوية آلياً
                  </p>
                </div>
              </div>

              {/* Quick Status Stats */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="bg-[#0B0D17]/80 border border-[#232742] px-3 py-1.5 rounded-lg text-center">
                  <span className="text-[#8E92BC] block text-[10px]">الشهر النشط</span>
                  <span className="text-[#39e3d7] font-bold font-mono-num">{selectedMonth}</span>
                </div>
                <div className="bg-[#0B0D17]/80 border border-[#232742] px-3 py-1.5 rounded-lg text-center">
                  <span className="text-[#8E92BC] block text-[10px]">حركات الشهر</span>
                  <span className="text-white font-bold font-mono-num">
                    {draftRows.filter((r) => r.month === selectedMonth).length}
                  </span>
                </div>
                <div className="bg-[#0B0D17]/80 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-center">
                  <span className="text-emerald-400 block text-[10px]">مطابق ومسوى</span>
                  <span className="text-emerald-300 font-bold font-mono-num">
                    {draftRows.filter((r) => r.month === selectedMonth && r.isReconciled).length}
                  </span>
                </div>
                <div className="bg-[#0B0D17]/80 border border-amber-500/30 px-3 py-1.5 rounded-lg text-center">
                  <span className="text-amber-400 block text-[10px]">معلق بالطريق</span>
                  <span className="text-amber-300 font-bold font-mono-num">
                    {draftRows.filter((r) => r.month === selectedMonth && !r.isReconciled).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Import Notification Banner */}
          {importNotification && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-lg ${
                importNotification.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50'
                  : 'bg-rose-950/80 text-rose-200 border-rose-500/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {importNotification.type === 'success' ? (
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{importNotification.message}</span>
              </div>
              <button
                onClick={() => setImportNotification(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer px-2 py-0.5"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-[#131626] border border-[#232742] p-3.5 rounded-xl shadow">
            {/* Hidden File Input for Excel Import */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcelFile}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Button: استيراد ملف إكسيل الشيت المرفق */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-900/30 active:scale-95"
                title="استيراد وتفريغ حركات الشيت المرفق (Excel / CSV) في درافت هذا الشهر مباشرة"
              >
                <FileUp className="w-4 h-4" />
                <span>استيراد ملف إكسيل الشيت المرفق</span>
              </button>

              {/* Button: استدعاء نموذج الشيت المعتمد للشهر */}
              <button
                onClick={handleResetMasterTemplateForMonth}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A1860] hover:bg-[#242182] text-[#D7D6F4] hover:text-white text-xs font-bold border border-[#3632c7]/50 shadow transition-all cursor-pointer"
                title="استدعاء وتطبيق هيكل الشيت الرئيسي المعتمد ببنوده المعيارية لشهر هذا الحساب"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#39e3d7]" />
                <span>استدعاء نموذج الشيت المعتمد</span>
              </button>

              {/* Button: إضافة حركة جديدة بالشيت */}
              <button
                onClick={() => setIsAddingDraftRow(!isAddingDraftRow)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 active:scale-95 group"
              >
                <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
                <span>إضافة حركة جديدة بالشيت</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Button: تنزيل الشيت الرئيسي لدرافت التسوية (Excel) */}
              <button
                onClick={() =>
                  exportBankReconciliationDraftTemplate(
                    bankAccounts,
                    draftRows,
                    selectedBankId || undefined,
                    selectedMonth
                  )
                }
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B0D17] hover:bg-[#1A1860] text-[#39e3d7] hover:text-white text-xs font-bold transition-all cursor-pointer border border-[#39e3d7]/40 shadow hover:shadow-[#39e3d7]/20 group"
                title="تصدير الشيت الرئيسي بكامل أوراقه وتنسيقاته المعتمدة"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#39e3d7] group-hover:scale-110 transition-transform" />
                <span>تنزيل الشيت الرئيسي (Excel)</span>
              </button>

              {/* Button: عرض مذكرة التسوية الرسمية */}
              <button
                onClick={() => setActiveTab('reconciliation')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A1860]/80 hover:bg-[#3632c7] text-white text-xs font-bold border border-[#3632c7] shadow transition-all cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-[#39e3d7]" />
                <span>عرض مذكرة التسوية الرسمية</span>
              </button>
            </div>
          </div>

          {/* Dynamic Reconciliation Snapshot Card */}
          <div className="bg-[#0D111F] border border-[#232742] rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#232742]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#39e3d7]" />
                <span className="text-xs font-bold text-white">
                  المطابقة اللحظية بين شيت الدرافت ورصيد كشف الحساب لشهر ({selectedMonth}):
                </span>
              </div>
              <div className="text-xs">
                {Math.abs(diffReconciliation) < 1 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>التسوية متطابقة ومتوازنة بنسبة 100%</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>فارق تسوية معلق: {Math.abs(diffReconciliation).toLocaleString()} ج.م</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 text-xs font-mono-num">
              <div className="bg-[#131626] p-2.5 rounded-xl border border-[#232742]">
                <span className="text-[#8E92BC] block text-[11px] font-sans">الرصيد الدفتري الحالي</span>
                <span className="text-white font-bold text-sm">{bookBal.toLocaleString()} ج.م</span>
              </div>

              <div className="bg-[#131626] p-2.5 rounded-xl border border-emerald-500/30">
                <span className="text-emerald-400 block text-[11px] font-sans">(+) إيداعات بالطريق</span>
                <span className="text-emerald-300 font-bold text-sm">
                  +{unreconciledDeposits.toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-[#131626] p-2.5 rounded-xl border border-rose-500/30">
                <span className="text-rose-400 block text-[11px] font-sans">(-) شيكات لم تصرف</span>
                <span className="text-rose-300 font-bold text-sm">
                  -{unreconciledWithdrawals.toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-[#131626] p-2.5 rounded-xl border border-[#3632c7]/40">
                <span className="text-[#39e3d7] block text-[11px] font-sans">(=) الرصيد المعدل</span>
                <span className="text-[#39e3d7] font-bold text-sm">
                  {adjustedBookBalance.toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-[#131626] p-2.5 rounded-xl border border-blue-500/40">
                <span className="text-blue-400 block text-[11px] font-sans">رصيد كشف البنك المعتمد</span>
                <span className="text-blue-300 font-bold text-sm">{stmtBal.toLocaleString()} ج.م</span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  Math.abs(diffReconciliation) < 1
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}
              >
                <span className="block text-[11px] font-sans">فارق المطابقة</span>
                <span className="font-bold text-sm">{diffReconciliation.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>

          {/* Inline Add Row Form */}
          {isAddingDraftRow && (
            <form
              onSubmit={handleAddNewDraftRow}
              className="bg-[#131626] border border-[#3632c7] rounded-xl p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#232742]">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#39e3d7]" />
                  <span>تسجيل حركة متحصل أو منصرف جديدة بالشيت الرئيسي</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingDraftRow(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Bank Account */}
                <div>
                  <label className="block text-slate-400 mb-1">الحساب البنكي</label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-slate-400 mb-1">تاريخ العملية</label>
                  <input
                    type="date"
                    value={newRowDate}
                    onChange={(e) => setNewRowDate(e.target.value)}
                    required
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white font-mono-num"
                  />
                </div>

                {/* Document No */}
                <div>
                  <label className="block text-slate-400 mb-1">رقم المستند / الإشعار البنكي</label>
                  <input
                    type="text"
                    placeholder="مثال: REC-2026-118 أو DEB-09"
                    value={newRowDocNo}
                    onChange={(e) => setNewRowDocNo(e.target.value)}
                    required
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white"
                  />
                </div>

                {/* Check Number */}
                <div>
                  <label className="block text-slate-400 mb-1">رقم الشيك (إن وجد)</label>
                  <input
                    type="text"
                    placeholder="مثال: CHQ-880191 أو OUT-99105"
                    value={newRowCheckNo}
                    onChange={(e) => setNewRowCheckNo(e.target.value)}
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white font-mono-num"
                  />
                </div>

                {/* Category (بند محدد) */}
                <div>
                  <label className="block text-slate-400 mb-1">البند المحدد للحركة</label>
                  <select
                    value={newRowCategory}
                    onChange={(e) => setNewRowCategory(e.target.value as BankTransactionCategory)}
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-amber-300 font-bold"
                  >
                    {BANK_TRANSACTION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deposit Amount */}
                <div>
                  <label className="block text-slate-400 mb-1 text-emerald-400 font-semibold">
                    المبلغ المتحصل / الوارد (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={newRowDeposit}
                    onChange={(e) =>
                      setNewRowDeposit(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-[#0B0D17] border border-emerald-500/40 rounded-lg p-2 text-emerald-300 font-mono-num font-bold"
                  />
                </div>

                {/* Withdrawal Amount */}
                <div>
                  <label className="block text-slate-400 mb-1 text-rose-400 font-semibold">
                    المبلغ المنصرف / المسحوب (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={newRowWithdrawal}
                    onChange={(e) =>
                      setNewRowWithdrawal(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-[#0B0D17] border border-rose-500/40 rounded-lg p-2 text-rose-300 font-mono-num font-bold"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-slate-400 mb-1">البيان والشرح</label>
                  <input
                    type="text"
                    placeholder="شرح وتفاصيل الحركة..."
                    value={newRowDesc}
                    onChange={(e) => setNewRowDesc(e.target.value)}
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDraftRow(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 cursor-pointer active:scale-95 transition-all group"
                >
                  <CheckCircle2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span>حفظ الحركة بالشيت</span>
                </button>
              </div>
            </form>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131626] border border-[#232742] p-3 rounded-xl text-xs">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Filter Bank */}
              <div className="flex items-center gap-2">
                <span className="text-[#8E92BC]">الحساب:</span>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="bg-[#0B0D17] border border-[#232742] text-white rounded-lg px-2.5 py-1.5 cursor-pointer"
                >
                  <option value="">كافة الحسابات البنكية</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Category */}
              <div className="flex items-center gap-2">
                <span className="text-[#8E92BC]">البند المحدد:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-[#0B0D17] border border-[#232742] text-amber-300 rounded-lg px-2.5 py-1.5 cursor-pointer font-medium"
                >
                  <option value="all">كافة البنود المحددة ({BANK_TRANSACTION_CATEGORIES.length} بنداً)</option>
                  {BANK_TRANSACTION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status */}
              <div className="flex items-center gap-2">
                <span className="text-[#8E92BC]">حالة التسوية:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-[#0B0D17] border border-[#232742] text-[#39e3d7] rounded-lg px-2.5 py-1.5 cursor-pointer font-medium"
                >
                  <option value="all">كافة الحركات (مطابق ومعلق)</option>
                  <option value="reconciled">مطابق ومسوى فقط</option>
                  <option value="unreconciled">معلق بالطريق للتسوية فقط</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="بحث برقم الشيك أو المستند أو البيان..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg pr-8 pl-2 py-1.5 text-white placeholder:text-slate-500 text-xs"
                />
              </div>
            </div>

            {/* Totals Pill */}
            <div className="flex items-center gap-4 text-xs font-mono-num font-bold">
              <span className="text-emerald-400">
                الوارد: + {totalDraftDeposits.toLocaleString()} ج.م
              </span>
              <span className="text-rose-400">
                المنصرف: - {totalDraftWithdrawals.toLocaleString()} ج.م
              </span>
            </div>
          </div>

          {/* Draft Sheet Table */}
          <div className="overflow-x-auto rounded-xl border border-[#232742] bg-[#0B0D17] shadow-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#131626] text-slate-300 font-semibold border-b border-[#232742]">
                <tr>
                  <th className="p-3 w-10 text-center">م</th>
                  <th className="p-3">تاريخ العملية</th>
                  <th className="p-3">رقم المستند</th>
                  <th className="p-3">رقم الشيك</th>
                  <th className="p-3">البند المحدد</th>
                  <th className="p-3 min-w-[200px]">البيان والشرح</th>
                  <th className="p-3 text-emerald-400">المتحصل / وارد (ج.م)</th>
                  <th className="p-3 text-rose-400">المنصرف / مسحوب (ج.م)</th>
                  <th className="p-3">الحساب البنكي</th>
                  <th className="p-3 text-center">حالة التسوية</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232742]/70">
                {filteredDraftRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      لا توجد حركات مسجلة لهذا الشهر والفلتر المحدد. يمكنك النقر على "استدعاء نموذج الشيت المعتمد" أو "استيراد ملف إكسيل الشيت المرفق".
                    </td>
                  </tr>
                ) : (
                  filteredDraftRows.map((row, idx) => {
                    const bank = bankAccounts.find((b) => b.id === row.bankAccountId);
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-[#131626]/60 text-slate-300 transition-colors"
                      >
                        <td className="p-3 text-center font-mono-num text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-mono-num text-slate-300">{row.date}</td>
                        <td className="p-3 font-mono-num text-[#39e3d7] font-semibold">
                          {row.documentNo}
                        </td>
                        <td className="p-3 font-mono-num text-amber-300 font-semibold">
                          {row.checkNumber || '-'}
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-[#131626] text-amber-300 font-semibold text-[11px] border border-[#232742]">
                            {row.category}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-white">{row.description}</td>
                        <td className="p-3 font-mono-num font-bold text-emerald-400">
                          {row.depositAmount > 0 ? row.depositAmount.toLocaleString() : '-'}
                        </td>
                        <td className="p-3 font-mono-num font-bold text-rose-400">
                          {row.withdrawalAmount > 0 ? row.withdrawalAmount.toLocaleString() : '-'}
                        </td>
                        <td className="p-3 text-[#8E92BC] text-[11px]">
                          {bank ? bank.bankName : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleReconciled(row.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors shadow-sm ${
                              row.isReconciled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            }`}
                            title="انقر للتبديل السريع بين مطابق ومعلق"
                          >
                            {row.isReconciled ? '✓ مطابق ومسوى' : '⏳ معلق بالطريق'}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingRow(row)}
                              className="p-1 rounded text-slate-400 hover:text-[#39e3d7] hover:bg-[#3632c7]/20 transition-colors cursor-pointer"
                              title="تعديل بيانات الحركة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDraftRow(row.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="حذف هذا السطر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-[#131626] font-bold text-white border-t border-[#232742]">
                <tr>
                  <td colSpan={6} className="p-3 text-right">
                    إجمالي حركات شيت الدرافت المعروضة ({filteredDraftRows.length} حركة):
                  </td>
                  <td className="p-3 font-mono-num text-emerald-400 text-sm">
                    + {totalDraftDeposits.toLocaleString()} ج.م
                  </td>
                  <td className="p-3 font-mono-num text-rose-400 text-sm">
                    - {totalDraftWithdrawals.toLocaleString()} ج.م
                  </td>
                  <td colSpan={3} className="p-3 text-left font-mono-num text-amber-300">
                    صافي الأثر البنكي: {(totalDraftDeposits - totalDraftWithdrawals).toLocaleString()} ج.م
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Modal: Edit Row */}
          {editingRow && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#131626] border border-[#3632c7] rounded-2xl w-full max-w-2xl shadow-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#232742] pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#39e3d7]" />
                    <span>تعديل حركة بشيت الدرافت الرئيسي</span>
                  </h3>
                  <button
                    onClick={() => setEditingRow(null)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">تاريخ العملية</label>
                    <input
                      type="date"
                      value={editingRow.date}
                      onChange={(e) => setEditingRow({ ...editingRow, date: e.target.value })}
                      className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">رقم المستند / الإشعار</label>
                    <input
                      type="text"
                      value={editingRow.documentNo}
                      onChange={(e) => setEditingRow({ ...editingRow, documentNo: e.target.value })}
                      className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">رقم الشيك</label>
                    <input
                      type="text"
                      value={editingRow.checkNumber || ''}
                      onChange={(e) => setEditingRow({ ...editingRow, checkNumber: e.target.value })}
                      className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white font-mono-num"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">البند المحدد</label>
                    <select
                      value={editingRow.category}
                      onChange={(e) =>
                        setEditingRow({
                          ...editingRow,
                          category: e.target.value as BankTransactionCategory,
                        })
                      }
                      className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-amber-300 font-bold"
                    >
                      {BANK_TRANSACTION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-emerald-400 font-semibold">
                      المتحصل / الوارد (ج.م)
                    </label>
                    <input
                      type="number"
                      value={editingRow.depositAmount}
                      onChange={(e) =>
                        setEditingRow({ ...editingRow, depositAmount: Number(e.target.value) || 0 })
                      }
                      className="w-full bg-[#0B0D17] border border-emerald-500/40 rounded-lg p-2 text-emerald-300 font-mono-num font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-rose-400 font-semibold">
                      المنصرف / المسحوب (ج.م)
                    </label>
                    <input
                      type="number"
                      value={editingRow.withdrawalAmount}
                      onChange={(e) =>
                        setEditingRow({
                          ...editingRow,
                          withdrawalAmount: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#0B0D17] border border-rose-500/40 rounded-lg p-2 text-rose-300 font-mono-num font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">البيان والشرح</label>
                    <input
                      type="text"
                      value={editingRow.description}
                      onChange={(e) => setEditingRow({ ...editingRow, description: e.target.value })}
                      className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">ملاحظات المراجعة</label>
                    <input
                      type="text"
                      value={editingRow.notes || ''}
                      onChange={(e) => setEditingRow({ ...editingRow, notes: e.target.value })}
                      className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="editReconciled"
                      checked={editingRow.isReconciled}
                      onChange={(e) =>
                        setEditingRow({ ...editingRow, isReconciled: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                    />
                    <label htmlFor="editReconciled" className="text-xs text-white font-medium cursor-pointer">
                      الحركة مطابقة ومقيدة بكشف حساب البنك (تعتبر مسواة وليست معلقة بالطريق)
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232742]">
                  <button
                    type="button"
                    onClick={() => setEditingRow(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEditedRow(editingRow)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#3632c7] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-lg shadow-[#3632c7]/30 cursor-pointer"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          MODAL: PRINT ACCOUNT MOVEMENT (طباعة حركة الحساب)
      ========================================== */}
      {printingAccount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-amber-400" />
                  <span>كشف حركة الحساب البنكي والأستاذ العام</span>
                </h3>
                <p className="text-xs text-slate-400 pt-1">
                  {printingAccount.bankName} • رقم الحساب ({printingAccount.accountNumber}) • كود{' '}
                  {printingAccount.glAccountId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية</span>
                </button>
                <button
                  onClick={() => setPrintingAccount(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Official Letterhead */}
            <div className="text-center space-y-1 py-2 border-b border-slate-800 text-xs text-slate-300">
              <h2 className="text-sm font-bold text-amber-400">{settings.organizationName}</h2>
              <p className="text-slate-400">
                كشف حركة الحساب البنكي من واقع القيود اليومية المحاسبية المعتمدة لعام {settings.fiscalYear}
              </p>
              <div className="flex items-center justify-center gap-6 pt-2 font-mono-num text-xs">
                <span>الرصيد الدفتري الافتتاحي: {printingAccount.bookBalance.toLocaleString()} ج.م</span>
                <span>•</span>
                <span>الرصيد بموجب كشف البنك: {printingAccount.statementBalance.toLocaleString()} ج.م</span>
              </div>
            </div>

            {/* Movement Lines */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">رقم القيد</th>
                    <th className="p-3">رقم المستند</th>
                    <th className="p-3 min-w-[220px]">البيان التفصيلي</th>
                    <th className="p-3 text-emerald-400 font-bold">مدين / إيداع (ج.م)</th>
                    <th className="p-3 text-rose-400 font-bold">دائن / منصرف (ج.م)</th>
                    <th className="p-3 text-amber-400 font-bold">الرصيد الجاري (ج.م)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr className="bg-slate-900/40 text-slate-400 font-medium">
                    <td className="p-3 font-mono-num">2026-01-01</td>
                    <td className="p-3 font-mono-num">-</td>
                    <td className="p-3 font-mono-num">رصيد أول المدة</td>
                    <td className="p-3">الرصيد الافتتاحي المعتمد لبداية السنة المالية 2026</td>
                    <td className="p-3 font-mono-num font-bold text-emerald-400">
                      {printingAccount.bookBalance.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono-num text-slate-500">0.00</td>
                    <td className="p-3 font-mono-num font-bold text-amber-400">
                      {printingAccount.bookBalance.toLocaleString()}
                    </td>
                  </tr>
                  {getAccountMovement(printingAccount).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 text-slate-300">
                      <td className="p-3 font-mono-num">{row.date}</td>
                      <td className="p-3 font-mono-num text-blue-400 font-semibold">{row.entryNo}</td>
                      <td className="p-3 font-mono-num text-slate-400">{row.documentNo}</td>
                      <td className="p-3 text-white">{row.description}</td>
                      <td className="p-3 font-mono-num font-bold text-emerald-400">
                        {row.debit > 0 ? row.debit.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 font-mono-num font-bold text-rose-400">
                        {row.credit > 0 ? row.credit.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 font-mono-num font-bold text-amber-400">
                        {row.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>تاريخ الطباعة والاستخراج: {new Date().toLocaleDateString('ar-EG')}</span>
              <div className="flex items-center gap-4">
                <span>توقيع المحاسب: ____________</span>
                <span>اعتماد رئيس الحسابات: ____________</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Liquidity Threshold Adjustment Modal */}
      {renderThresholdModal()}
    </div>
  );
};
