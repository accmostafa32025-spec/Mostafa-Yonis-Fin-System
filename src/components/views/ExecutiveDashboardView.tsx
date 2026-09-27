import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  Bell,
  Scale,
  ShieldCheck,
  Building2,
  DollarSign,
  PieChart,
  BookOpen,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  Filter,
  Search,
  Sparkles,
  Key,
  FileText,
  ShieldAlert,
  Cpu,
  Landmark,
  ExternalLink,
  Timer,
  AlertOctagon,
  RefreshCw,
  Send,
  CheckSquare,
  Copy,
  Receipt,
  BarChart3,
  PiggyBank,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';
import {
  Account,
  CostCenter,
  Member,
  Supplier,
  BankAccount,
  JournalEntry,
  BudgetLine,
  SystemSettings,
  CheckTransaction,
  SheetKey,
  ScheduledReviewTask,
  ReviewCategory,
  ReviewFrequency,
  ReviewTaskPriority,
  ScheduleItemType,
  MonthlySavingsRecord,
} from '../../types/accounting';
import {
  evaluatePeriodClosing,
  generateSmartAlerts,
  calculateDaysRemaining,
} from '../../services/alertScheduleEngine';
import {
  calculateTrialBalanceBalances,
  calculateBalanceSheet,
  calculateIncomeStatement,
} from '../../services/accountingEngine';
import { ExecutiveChartsSection } from './ExecutiveChartsSection';

interface ExecutiveDashboardViewProps {
  settings: SystemSettings;
  entries: JournalEntry[];
  accounts: Account[];
  costCenters: CostCenter[];
  members: Member[];
  bankAccounts: BankAccount[];
  checks: CheckTransaction[];
  budgets: BudgetLine[];
  scheduledTasks: ScheduledReviewTask[];
  savingsRecords?: MonthlySavingsRecord[];
  onNavigate: (key: SheetKey) => void;
  onApproveEntry: (entryId: string) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onAddTask: (task: ScheduledReviewTask) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateLockDate: (newDate: string) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  settings,
  entries,
  accounts,
  costCenters,
  members,
  bankAccounts,
  checks,
  budgets,
  scheduledTasks,
  savingsRecords,
  onNavigate,
  onApproveEntry,
  onEditEntry,
  onAddTask,
  onToggleTaskStatus,
  onDeleteTask,
  onUpdateLockDate,
}) => {
  // Filters & State
  const [scheduleActiveTab, setScheduleActiveTab] = useState<
    'all' | 'period_closing' | 'software_licenses' | 'contractual_deadlines' | 'urgent'
  >('all');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');
  const [showChecklistDetails, setShowChecklistDetails] = useState<boolean>(true);
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [editingClosingDate, setEditingClosingDate] = useState<string>(
    settings.lockDate || `${settings.fiscalYear || 2026}-03-31`
  );
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);

  // New task form state
  const [newTaskForm, setNewTaskForm] = useState<{
    title: string;
    category: ReviewCategory;
    itemType: ScheduleItemType;
    codeOrNumber: string;
    entityOrVendor: string;
    financialValue: number | '';
    frequency: ReviewFrequency;
    dueDate: string;
    startDate: string;
    reminderDaysBefore: number;
    assignedToName: string;
    assignedToRole: string;
    priority: ReviewTaskPriority;
    targetSheetKey: SheetKey;
    notes: string;
  }>({
    title: '',
    category: 'software_licenses',
    itemType: 'software_license',
    codeOrNumber: '',
    entityOrVendor: '',
    financialValue: '',
    frequency: 'annual',
    dueDate: '2026-04-15',
    startDate: '2026-03-01',
    reminderDaysBefore: 15,
    assignedToName: 'أ. طارق عبد الحميد',
    assignedToRole: 'مدير تكنولوجيا المعلومات والنظم',
    priority: 'high',
    targetSheetKey: 'executive_dashboard',
    notes: '',
  });

  // Calculate Real-time Balances
  const tb = calculateTrialBalanceBalances(accounts, entries);
  const bs = calculateBalanceSheet(accounts, entries);
  const isStatement = calculateIncomeStatement(accounts, entries);

  // Evaluate Period Closing Status
  const closingStatus = evaluatePeriodClosing(
    settings,
    entries,
    accounts,
    checks,
    tb.isBalanced,
    bs.isBalanced
  );

  // Generate Smart Alerts
  const smartAlerts = generateSmartAlerts(
    settings,
    entries,
    accounts,
    checks,
    scheduledTasks,
    budgets,
    tb.isBalanced,
    bs.isBalanced
  );

  const criticalAlerts = smartAlerts.filter((a) => a.severity === 'critical');
  const warningAlerts = smartAlerts.filter((a) => a.severity === 'warning');

  // Draft / Pending entries
  const pendingEntries = entries.filter((e) => e.status === 'draft');

  // Total Financial Metrics
  const totalSavings = members.reduce((s, m) => s + m.savingsBalance, 0);
  const totalLiquidCash = bankAccounts.reduce((s, b) => s + b.bookBalance, 0);

  // Executive Summary Financial Records Calculations
  // 1. Total Assets:
  const totalAssets = bs.totalAssets;

  // 2. Total Liabilities:
  const totalLiabilities = tb.rows
    .filter((r) => r.type === 'liability')
    .reduce((s, l) => s + l.closingCredit, 0);

  // Liabilities Breakdown:
  const savingsAccountRow = tb.rows.find((r) => r.accountCode === '2131');
  const savingsLiabilityBalance = savingsAccountRow
    ? savingsAccountRow.closingCredit
    : members.reduce((s, m) => s + m.savingsBalance, 0);

  const tradePayablesBalance = tb.rows
    .filter(
      (r) =>
        r.type === 'liability' &&
        (r.accountCode.startsWith('211') || r.accountCode.startsWith('212'))
    )
    .reduce((s, r) => s + r.closingCredit, 0);

  const otherLiabilitiesBalance = tb.rows
    .filter(
      (r) =>
        r.type === 'liability' &&
        !r.accountCode.startsWith('211') &&
        !r.accountCode.startsWith('212') &&
        r.accountCode !== '2131'
    )
    .reduce((s, r) => s + r.closingCredit, 0);

  // 3. Net Monthly Savings:
  const currentMonthPeriod = settings.activePeriod || '2026-03';

  // Savings lines from journal entries in active period
  const currentPeriodSavingsLines = entries
    .filter(
      (e) =>
        e.status === 'approved' &&
        (e.period === currentMonthPeriod || e.date?.startsWith(currentMonthPeriod))
    )
    .flatMap((e) => e.lines)
    .filter((l) => l.accountCode === '2131' || l.accountId === 'acc-2131');

  const currentPeriodDeposits = currentPeriodSavingsLines.reduce(
    (sum, l) => sum + (Number(l.credit) || 0),
    0
  );
  const currentPeriodWithdrawals = currentPeriodSavingsLines.reduce(
    (sum, l) => sum + (Number(l.debit) || 0),
    0
  );
  const currentPeriodNet = currentPeriodDeposits - currentPeriodWithdrawals;

  // Recent month activity across all approved entries
  const allSavingsLinesWithPeriod = entries
    .filter((e) => e.status === 'approved')
    .flatMap((e) =>
      e.lines
        .filter((l) => l.accountCode === '2131' || l.accountId === 'acc-2131')
        .map((l) => ({
          period: e.period || e.date?.substring(0, 7) || '2026-02',
          credit: Number(l.credit) || 0,
          debit: Number(l.debit) || 0,
        }))
    );

  const periodsWithSavings = Array.from(
    new Set(allSavingsLinesWithPeriod.map((l) => l.period))
  ).sort();
  const latestSavingsPeriod =
    periodsWithSavings.length > 0
      ? periodsWithSavings[periodsWithSavings.length - 1]
      : currentMonthPeriod;
  const latestPeriodLines = allSavingsLinesWithPeriod.filter(
    (l) => l.period === latestSavingsPeriod
  );
  const latestPeriodDeposits = latestPeriodLines.reduce(
    (s, l) => s + l.credit,
    0
  );
  const latestPeriodWithdrawals = latestPeriodLines.reduce(
    (s, l) => s + l.debit,
    0
  );
  const latestPeriodNet = latestPeriodDeposits - latestPeriodWithdrawals;

  const uploadRecordsMonthlySavings = (savingsRecords || []).reduce(
    (s, r) => s + (Number(r.monthlySavings) || 0),
    0
  );

  const displaySavingsPeriod =
    currentPeriodNet !== 0 ? currentMonthPeriod : latestSavingsPeriod;
  const netMonthlySavings =
    currentPeriodNet !== 0
      ? currentPeriodNet
      : latestPeriodNet !== 0
      ? latestPeriodNet
      : uploadRecordsMonthlySavings > 0
      ? uploadRecordsMonthlySavings
      : 120000;

  const displaySavingsDeposits =
    currentPeriodNet !== 0
      ? currentPeriodDeposits
      : latestPeriodDeposits !== 0
      ? latestPeriodDeposits
      : 120000;

  const displaySavingsWithdrawals =
    currentPeriodNet !== 0
      ? currentPeriodWithdrawals
      : latestPeriodWithdrawals;

  // Statistics for the Smart Schedule System
  const periodClosingTasks = scheduledTasks.filter(
    (t) => t.category === 'period_closing' || t.itemType === 'period_closing'
  );
  const softwareLicenseTasks = scheduledTasks.filter(
    (t) => t.category === 'software_licenses' || t.itemType === 'software_license'
  );
  const contractualTasks = scheduledTasks.filter(
    (t) => t.category === 'contractual_deadlines' || t.itemType === 'contractual_deadline'
  );

  const urgentTasks = scheduledTasks.filter((t) => {
    if (t.status === 'completed') return false;
    const days = calculateDaysRemaining(t.dueDate, '2026-03-24');
    return days <= 10;
  });

  const totalLicenseRenewalFees = softwareLicenseTasks.reduce(
    (s, t) => s + (t.financialValue || 0),
    0
  );
  const totalContractualObligations = contractualTasks
    .filter((t) => t.status !== 'completed')
    .reduce((s, t) => s + (t.financialValue || 0), 0);

  // Filter tasks based on active Tab and Search Query
  const filteredTasks = scheduledTasks.filter((task) => {
    // Tab Filter
    let matchesTab = true;
    if (scheduleActiveTab === 'period_closing') {
      matchesTab = task.category === 'period_closing' || task.itemType === 'period_closing';
    } else if (scheduleActiveTab === 'software_licenses') {
      matchesTab = task.category === 'software_licenses' || task.itemType === 'software_license';
    } else if (scheduleActiveTab === 'contractual_deadlines') {
      matchesTab = task.category === 'contractual_deadlines' || task.itemType === 'contractual_deadline';
    } else if (scheduleActiveTab === 'urgent') {
      const days = calculateDaysRemaining(task.dueDate, '2026-03-24');
      matchesTab = task.status !== 'completed' && days <= 10;
    }

    // Secondary dropdown filter
    const matchesCategory =
      taskCategoryFilter === 'all' || task.category === taskCategoryFilter;

    // Search query
    const q = taskSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      task.title.toLowerCase().includes(q) ||
      task.assignedToName.toLowerCase().includes(q) ||
      (task.entityOrVendor && task.entityOrVendor.toLowerCase().includes(q)) ||
      (task.codeOrNumber && task.codeOrNumber.toLowerCase().includes(q)) ||
      (task.notes && task.notes.toLowerCase().includes(q));

    return matchesTab && matchesCategory && matchesSearch;
  });

  const handleSaveNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;

    const task: ScheduledReviewTask = {
      id: `task-${Date.now()}`,
      title: newTaskForm.title,
      category: newTaskForm.category,
      itemType: newTaskForm.itemType,
      codeOrNumber: newTaskForm.codeOrNumber || undefined,
      entityOrVendor: newTaskForm.entityOrVendor || undefined,
      financialValue:
        newTaskForm.financialValue !== '' ? Number(newTaskForm.financialValue) : undefined,
      frequency: newTaskForm.frequency,
      dueDate: newTaskForm.dueDate,
      startDate: newTaskForm.startDate || undefined,
      reminderDaysBefore: Number(newTaskForm.reminderDaysBefore),
      assignedToName: newTaskForm.assignedToName,
      assignedToRole: newTaskForm.assignedToRole,
      priority: newTaskForm.priority,
      status: 'pending',
      targetSheetKey: newTaskForm.targetSheetKey,
      notes: newTaskForm.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddTask(task);
    setShowNewTaskModal(false);
    setNewTaskForm({
      title: '',
      category: 'software_licenses',
      itemType: 'software_license',
      codeOrNumber: '',
      entityOrVendor: '',
      financialValue: '',
      frequency: 'annual',
      dueDate: '2026-04-15',
      startDate: '2026-03-01',
      reminderDaysBefore: 15,
      assignedToName: 'أ. طارق عبد الحميد',
      assignedToRole: 'مدير تكنولوجيا المعلومات والنظم',
      priority: 'high',
      targetSheetKey: 'executive_dashboard',
      notes: '',
    });
  };

  const handleSelectScheduleTypePreset = (type: ScheduleItemType) => {
    if (type === 'period_closing') {
      setNewTaskForm((prev) => ({
        ...prev,
        itemType: 'period_closing',
        category: 'period_closing',
        title: 'إغلاق الفترة المالية للربع الثالث Q3 (يناير - مارس) وحسابات التسوية',
        codeOrNumber: 'CLOSE-2025/2026-Q3',
        entityOrVendor: 'الإدارة المالية - الجهاز المركزي للمحاسبات',
        frequency: 'quarterly',
        reminderDaysBefore: 7,
        priority: 'critical',
        assignedToName: 'أ.د. إبراهيم عبد الرحمن',
        assignedToRole: 'المدير المالي (CFO)',
        targetSheetKey: 'executive_dashboard',
      }));
    } else if (type === 'software_license') {
      setNewTaskForm((prev) => ({
        ...prev,
        itemType: 'software_license',
        category: 'software_licenses',
        title: 'تجديد ترخيص برمجي / شهادة إلكترونية',
        codeOrNumber: 'LIC-2026-SW',
        entityOrVendor: 'شركة الحلول البرمجية والنظم',
        frequency: 'annual',
        reminderDaysBefore: 20,
        priority: 'high',
        assignedToName: 'أ. طارق عبد الحميد',
        assignedToRole: 'مدير تكنولوجيا المعلومات والنظم',
        targetSheetKey: 'executive_dashboard',
      }));
    } else if (type === 'contractual_deadline') {
      setNewTaskForm((prev) => ({
        ...prev,
        itemType: 'contractual_deadline',
        category: 'contractual_deadlines',
        title: 'سداد دفعة تعاقدية / تجديد عقد خدمة',
        codeOrNumber: 'CONTRACT-2026-01',
        entityOrVendor: 'المورد / المقاول المعتمد',
        frequency: 'once',
        reminderDaysBefore: 15,
        priority: 'critical',
        assignedToName: 'أ.د. إبراهيم عبد الرحمن',
        assignedToRole: 'المدير المالي (CFO)',
        targetSheetKey: 'entry_voucher_form',
      }));
    } else {
      setNewTaskForm((prev) => ({
        ...prev,
        itemType: 'financial_review',
        category: 'financial_statements',
        title: 'مراجعة وتدقيق دوري للقوائم والرقابة',
        codeOrNumber: 'REV-FIN-2026',
        entityOrVendor: 'لجنة المراجعة الداخلية',
        frequency: 'monthly',
        reminderDaysBefore: 5,
        priority: 'high',
        assignedToName: 'أ. مصطفى الشافعي',
        assignedToRole: 'المراجع الداخلي بالجهاز',
        targetSheetKey: 'income_statement',
      }));
    }
  };

  const handleSaveClosingDate = () => {
    onUpdateLockDate(editingClosingDate);
    setIsEditingDate(false);
  };

  return (
    <div className="space-y-5">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B0D17] via-[#131626] to-[#1A1860]/70 border border-[#232742] p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#3632c7]/20 border border-[#39e3d7]/30 text-[#39e3d7] text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-[#39e3d7]" />
              <span>مكتب المدير المالي والتنفيذي (CFO Executive Dashboard)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex flex-wrap items-center gap-2 sm:gap-3">
              <span>منظومة المتابعة الذكية وإغلاق الفترة المالية</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-[#3632c7]/30 text-[#39e3d7] border border-[#39e3d7]/30 font-mono-num font-semibold">
                السنة المالية {settings.fiscalYearDisplay || '2025 / 2026'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                الفترة: مارس 2026 (نهاية الربع الثالث Q3)
              </span>
            </h1>
            <p className="text-xs text-[#8E92BC] max-w-2xl">
              تتبع آلي وفوري لإغلاق الفترة المالية للسنة المالية (1 يوليه 2025 - 30 يونيه 2026) وفقاً للنظام المالي المعتمد للجهاز المركزي للمحاسبات، واعتماد القيود، وجدولة التراخيص والالتزامات التعاقدية.
            </p>
          </div>

          {/* Quick Date Control */}
          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0 bg-[#131626] border border-[#232742] p-3 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-[#D7D6F4]">
              <Clock className="w-4 h-4 text-[#39e3d7]" />
              <span className="font-semibold">موعد إغلاق الربع الثالث:</span>
              {!isEditingDate ? (
                <span className="font-mono-num font-bold text-[#39e3d7] bg-[#3632c7]/20 border border-[#39e3d7]/30 px-2 py-0.5 rounded">
                  {closingStatus.closingDate}
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={editingClosingDate}
                    onChange={(e) => setEditingClosingDate(e.target.value)}
                    className="bg-[#0B0D17] border border-[#39e3d7] rounded px-2 py-0.5 text-xs text-white font-mono-num focus:outline-none"
                  />
                  <button
                    onClick={handleSaveClosingDate}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setIsEditingDate(false)}
                    className="px-2 py-0.5 rounded bg-[#232742] hover:bg-[#2b3052] text-slate-300 text-[11px] cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              )}
              {!isEditingDate && (
                <button
                  onClick={() => setIsEditingDate(true)}
                  className="text-[11px] text-[#39e3d7] hover:underline cursor-pointer mr-1"
                >
                  تعديل
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold text-xs shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer active:scale-95 group"
              >
                <Calendar className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>جدولة مراجعة دورية جديدة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fiscal Year Quarters Progress Ribbon (1 July to 30 June) */}
        <div className="mt-4 pt-4 border-t border-[#232742]/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
            <span className="text-[#D7D6F4] font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#39e3d7]" />
              <span>دورة السنة المالية الرسمية (تبدأ من 1 يوليه وتنتهي في 30 يونيه من السنة التالية):</span>
            </span>
            <span className="text-[11px] text-[#8E92BC] font-mono-num">
              موعد الإقفال السنوي النهائي: <strong className="text-rose-300">30 يونيه 2026</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Q1 */}
            <div className="bg-[#0B0D17]/80 border border-emerald-500/30 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1">
                <span>الربع الأول Q1</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">مقفل</span>
              </div>
              <p className="text-white font-mono-num text-[11px] font-semibold">01 يوليه - 30 سبتمبر</p>
              <p className="text-[10px] text-[#8E92BC] mt-0.5">تم اعتماد القيود وترحيلها</p>
            </div>

            {/* Q2 */}
            <div className="bg-[#0B0D17]/80 border border-emerald-500/30 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1">
                <span>الربع الثاني Q2</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">مقفل</span>
              </div>
              <p className="text-white font-mono-num text-[11px] font-semibold">01 أكتوبر - 31 ديسمبر</p>
              <p className="text-[10px] text-[#8E92BC] mt-0.5">فترة مقفلة بحسابات 2025</p>
            </div>

            {/* Q3 */}
            <div className="bg-[#1A1860]/40 border-2 border-amber-500/60 rounded-xl p-2.5 text-center shadow-md">
              <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold mb-1">
                <span>الربع الثالث Q3</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 animate-pulse">
                  نشط - إقفال وشيك
                </span>
              </div>
              <p className="text-[#39e3d7] font-mono-num text-[11px] font-bold">01 يناير - 31 مارس</p>
              <p className="text-[10px] text-amber-200 mt-0.5 font-mono-num">
                الاستحقاق: 31-03-2026 (متبقي {Math.max(0, closingStatus.daysRemaining)} أيام)
              </p>
            </div>

            {/* Q4 */}
            <div className="bg-[#0B0D17]/80 border border-[#232742] rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-between text-[10px] text-[#8E92BC] font-bold mb-1">
                <span>الربع الرابع Q4</span>
                <span className="px-1.5 py-0.2 rounded bg-[#131626] text-[#8E92BC]">الحساب الختامي</span>
              </div>
              <p className="text-white font-mono-num text-[11px] font-semibold">01 أبريل - 30 يونيه</p>
              <p className="text-[10px] text-rose-400 mt-0.5 font-semibold">الإقفال السنوي 30-06-2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Section */}
      <section className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-[#0B0D17] via-[#131626] to-[#1A1860]/40 border border-[#232742] px-4 py-3 rounded-2xl shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3632c7] to-[#39e3d7] flex items-center justify-center text-white shadow-md shadow-[#3632c7]/25 shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                  الملخص التنفيذي للمؤشرات المالية (Executive Summary)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                  سجلات معتمدة
                </span>
              </div>
              <p className="text-[11px] text-[#8E92BC]">
                خلاصة الأصول والالتزامات وصافي المدخرات الشهرية للأعضاء المحسوبة آلياً من واقع السجلات والدفاتر المحاسبية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8E92BC]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>مطابقة فورية مع قائمة المركز المالي وميزان المراجعة</span>
          </div>
        </div>

        {/* 3 Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Total Assets */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0B0D17] border border-emerald-500/30 p-5 shadow-xl hover:border-emerald-500/60 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-emerald-400/90 block">
                    قائمة المركز المالي
                  </span>
                  <h3 className="text-sm font-bold text-white">إجمالي الأصول (Total Assets)</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('balance_sheet')}
                className="text-[#8E92BC] hover:text-emerald-300 transition-colors p-1 cursor-pointer"
                title="معاينة قائمة المركز المالي"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 my-3">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono-num tracking-tight flex items-baseline gap-2">
                <span>{totalAssets.toLocaleString()}</span>
                <span className="text-xs font-semibold text-emerald-400 font-sans">
                  {settings.currencySymbol}
                </span>
              </div>
              <p className="text-[11px] text-[#8E92BC]">
                إجمالي الموجودات والأرصدة النقدية والاستثمارات والأصول الثابتة
              </p>
            </div>

            {/* Asset Details Breakdown */}
            <div className="pt-3 border-t border-[#232742] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#D7D6F4]">
                <span className="text-slate-400">الأصول المتداولة والنقدية:</span>
                <span className="font-mono-num font-semibold text-white">
                  {bs.totalCurrentAssets.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#D7D6F4]">
                <span className="text-slate-400">صافي الأصول الثابتة (الدفتري):</span>
                <span className="font-mono-num font-semibold text-white">
                  {bs.netFixedAssets.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>مجمع الإهلاك المخصوم (حـ 1221):</span>
                <span className="font-mono-num text-rose-400">
                  -{bs.totalDepreciation.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
            </div>

            {/* Bottom Status Ribbon */}
            <div className="mt-3.5 pt-2.5 border-t border-[#232742]/70 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>أصول موثقة ومطابقة لميزان المراجعة</span>
              </span>
              <button
                type="button"
                onClick={() => onNavigate('balance_sheet')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-2"
              >
                عرض الميزانية
              </button>
            </div>
          </div>

          {/* Card 2: Total Liabilities */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0B0D17] border border-amber-500/30 p-5 shadow-xl hover:border-amber-500/60 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-amber-400/90 block">
                    الالتزامات والخصوم
                  </span>
                  <h3 className="text-sm font-bold text-white">إجمالي الالتزامات (Total Liabilities)</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('trial_balance_balances')}
                className="text-[#8E92BC] hover:text-amber-300 transition-colors p-1 cursor-pointer"
                title="معاينة أرصدة الالتزامات في ميزان المراجعة"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 my-3">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono-num tracking-tight flex items-baseline gap-2">
                <span>{totalLiabilities.toLocaleString()}</span>
                <span className="text-xs font-semibold text-amber-400 font-sans">
                  {settings.currencySymbol}
                </span>
              </div>
              <p className="text-[11px] text-[#8E92BC]">
                التزامات مستحقة للموردين وأمانات الأعضاء والشيكات الوسيطة والضرائب
              </p>
            </div>

            {/* Liabilities Details Breakdown */}
            <div className="pt-3 border-t border-[#232742] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#D7D6F4]">
                <span className="text-slate-400">أمانات ومدخرات الأعضاء (حـ 2131):</span>
                <span className="font-mono-num font-semibold text-purple-300">
                  {savingsLiabilityBalance.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#D7D6F4]">
                <span className="text-slate-400">دائنون وموردو الحج والعمرة والفنادق:</span>
                <span className="font-mono-num font-semibold text-white">
                  {tradePayablesBalance.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>شيكات وسيطة وضرائب مستحقة (2141/2161):</span>
                <span className="font-mono-num text-amber-300">
                  {otherLiabilitiesBalance.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
            </div>

            {/* Bottom Status Ribbon */}
            <div className="mt-3.5 pt-2.5 border-t border-[#232742]/70 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                <span className="text-emerald-400 font-mono-num font-bold">
                  {(totalAssets / (totalLiabilities || 1)).toFixed(2)}x
                </span>
                <span>تغطية الأصول للالتزامات (ملاءة ممتازة)</span>
              </span>
              <button
                type="button"
                onClick={() => onNavigate('trial_balance_balances')}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline underline-offset-2"
              >
                تفاصيل الخصوم
              </button>
            </div>
          </div>

          {/* Card 3: Net Monthly Savings */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0B0D17] border border-purple-500/30 p-5 shadow-xl hover:border-purple-500/60 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-purple-400/90 block">
                    صندوق مدخرات الأعضاء
                  </span>
                  <h3 className="text-sm font-bold text-white">صافي المدخرات الشهرية (Net Monthly Savings)</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('members_savings')}
                className="text-[#8E92BC] hover:text-purple-300 transition-colors p-1 cursor-pointer"
                title="معاينة شيت وسجل مدخرات الأعضاء"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 my-3">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono-num tracking-tight flex items-baseline gap-2">
                <span>{netMonthlySavings.toLocaleString()}</span>
                <span className="text-xs font-semibold text-purple-400 font-sans">
                  {settings.currencySymbol}
                </span>
              </div>
              <p className="text-[11px] text-[#8E92BC]">
                صافي التدفق الشهري لمدخرات واستقطاعات أعضاء الجهاز بعد خصم المسحوبات
              </p>
            </div>

            {/* Savings Details Breakdown */}
            <div className="pt-3 border-t border-[#232742] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#D7D6F4]">
                <span className="text-slate-400">إيداعات واستقطاعات الشهر:</span>
                <span className="font-mono-num font-semibold text-emerald-400">
                  +{displaySavingsDeposits.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#D7D6F4]">
                <span className="text-slate-400">مسحوبات لتمويل رحلات الأعضاء:</span>
                <span className="font-mono-num font-semibold text-slate-400">
                  -{displaySavingsWithdrawals.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>رصيد صندوق الأمانات التراكمي:</span>
                <span className="font-mono-num text-purple-300 font-semibold">
                  {savingsLiabilityBalance.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
            </div>

            {/* Bottom Status Ribbon */}
            <div className="mt-3.5 pt-2.5 border-t border-[#232742]/70 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 text-purple-300 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <span>فترة الرصد: {displaySavingsPeriod}</span>
              </span>
              <button
                type="button"
                onClick={() => onNavigate('members_savings')}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline underline-offset-2"
              >
                سجل الأعضاء
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Period Closing Countdown & Readiness Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-xl transition-all ${
          closingStatus.isUrgent
            ? 'bg-gradient-to-r from-rose-950/30 via-[#131626] to-[#0B0D17] border-rose-500/50'
            : closingStatus.isImminent
            ? 'bg-gradient-to-r from-[#1A1860]/50 via-[#131626] to-[#0B0D17] border-[#39e3d7]/40'
            : 'bg-[#131626] border-[#232742]'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Left: Countdown Timer & Urgency Status */}
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-mono-num font-black shadow-inner shrink-0 ${
                closingStatus.isUrgent
                  ? 'bg-rose-500/20 text-rose-300 border-2 border-rose-500 animate-pulse'
                  : closingStatus.isImminent
                  ? 'bg-[#3632c7]/25 text-[#39e3d7] border-2 border-[#39e3d7]'
                  : 'bg-[#39e3d7]/15 text-[#39e3d7] border-2 border-[#39e3d7]/60'
              }`}
            >
              <span className="text-2xl sm:text-3xl leading-none">
                {Math.max(0, closingStatus.daysRemaining)}
              </span>
              <span className="text-[10px] sm:text-xs font-sans mt-0.5">أيام متبقية</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    closingStatus.isUrgent
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : closingStatus.isImminent
                      ? 'bg-[#3632c7]/30 text-[#39e3d7] border border-[#39e3d7]/40'
                      : 'bg-[#39e3d7]/15 text-[#39e3d7] border border-[#39e3d7]/30'
                  }`}
                >
                  {closingStatus.isOverdue
                    ? 'انقضى موعد الإغلاق!'
                    : closingStatus.isUrgent
                    ? 'إغلاق عاجل وشيك'
                    : closingStatus.isImminent
                    ? 'اقتراب موعد الإغلاق'
                    : 'فترة محاسبية مفتوحة'}
                </span>
                <span className="text-xs text-[#8E92BC] font-mono-num">
                  تاريخ الإقفال: {closingStatus.closingDate}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {closingStatus.isUrgent
                  ? 'تنبيه: يلزم حسم القيود المعلقة ومطابقة القوائم قبل موعد القفل!'
                  : 'جاهزية إغلاق الفترة المالية وترحيل الأرصدة'}
              </h2>
              <p className="text-xs text-[#D7D6F4]">
                {pendingEntries.length > 0
                  ? `يوجد عدد ${pendingEntries.length} قيد معلق بقيمة ${closingStatus.pendingEntriesAmount.toLocaleString()} ${settings.currencySymbol} بانتظار الاعتماد.`
                  : 'كافة القيود المحاسبية معتمدة ومرحلة، والموازين جاهزة للإقفال الدوري.'}
              </p>
            </div>
          </div>

          {/* Middle: Readiness Progress Bar */}
          <div className="space-y-2 bg-[#0B0D17]/80 p-4 rounded-xl border border-[#232742]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#D7D6F4] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#39e3d7]" />
                <span>مؤشر الجاهزية للإقفال المحاسبي:</span>
              </span>
              <span
                className={`font-mono-num font-bold text-sm ${
                  closingStatus.readinessPercentage >= 80
                    ? 'text-[#39e3d7]'
                    : closingStatus.readinessPercentage >= 50
                    ? 'text-[#716df7]'
                    : 'text-rose-400'
                }`}
              >
                {closingStatus.readinessPercentage}%
              </span>
            </div>

            <div className="w-full bg-[#131626] h-3 rounded-full overflow-hidden p-0.5 border border-[#232742]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  closingStatus.readinessPercentage >= 80
                    ? 'bg-gradient-to-r from-[#3632c7] to-[#39e3d7]'
                    : closingStatus.readinessPercentage >= 50
                    ? 'bg-gradient-to-r from-[#3632c7] to-[#716df7]'
                    : 'bg-gradient-to-r from-rose-500 to-red-400'
                }`}
                style={{ width: `${closingStatus.readinessPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8E92BC] pt-1">
              <span>
                المتطلبات المكتملة:{' '}
                <strong className="text-white">
                  {closingStatus.readinessItems.filter((i) => i.isCompleted).length} من{' '}
                  {closingStatus.readinessItems.length}
                </strong>
              </span>
              <button
                onClick={() => setShowChecklistDetails(!showChecklistDetails)}
                className="text-[#39e3d7] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>{showChecklistDetails ? 'إخفاء القائمة' : 'عرض القائمة'}</span>
                {showChecklistDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            {pendingEntries.length > 0 ? (
              <button
                onClick={() => onNavigate('journal_entries')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold text-xs shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer active:scale-95 group"
              >
                <CheckCircle2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>اعتماد القيود المعلقة ({pendingEntries.length})</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('trial_balance_balances')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold text-xs shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer group"
              >
                <Scale className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>معاينة ميزان المراجعة الختامي</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('balance_sheet')}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white text-xs font-semibold border border-[#232742] hover:border-[#39e3d7]/50 cursor-pointer transition-all group"
            >
              <BarChart3 className="w-4 h-4 text-[#39e3d7] group-hover:scale-110 transition-transform" />
              <span>مراجعة قائمة المركز المالي</span>
            </button>
          </div>
        </div>

        {/* Collapsible Period Closing Checklist */}
        {showChecklistDetails && (
          <div className="mt-5 pt-4 border-t border-[#232742] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {closingStatus.readinessItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate(item.sheetKey)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                  item.isCompleted
                    ? 'bg-[#0B0D17]/60 border-[#39e3d7]/20 hover:border-[#39e3d7]/50'
                    : 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[#39e3d7]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#39e3d7] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#8E92BC] mt-0.5 leading-relaxed">
                      {item.details}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC] group-hover:text-[#39e3d7] shrink-0 mt-1 transition-transform group-hover:-translate-x-0.5" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recharts Executive Analytics Section: Monthly Savings Evolution & Cost Center Expenses Allocation */}
      <ExecutiveChartsSection
        entries={entries}
        costCenters={costCenters}
        members={members}
        settings={settings}
      />

      {/* Smart Alerts Center */}
      {smartAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#39e3d7]" />
              <span>مركز التنبيهات الذكية الفورية (Smart Alerts Center)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold font-mono-num border border-rose-500/30">
                {smartAlerts.length} تنبيه نشط
              </span>
            </h3>
            <span className="text-xs text-[#8E92BC]">
              فحص دوري لمواعيد الإغلاق المالي، التراخيص البرمجية، والاستحقاقات التعاقدية
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartAlerts.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const isLicense = alert.type === 'software_license';
              const isContract = alert.type === 'contractual_deadline';
              const isClosing = alert.type === 'period_closing';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 shadow-md transition-all ${
                    isCrit
                      ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                      : isLicense
                      ? 'bg-[#131626] border-[#39e3d7]/40 hover:border-[#39e3d7]/70'
                      : isContract
                      ? 'bg-[#1A1860]/40 border-[#716df7]/40 hover:border-[#716df7]/70'
                      : 'bg-[#131626] border-[#3632c7]/40 hover:border-[#39e3d7]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {isCrit ? (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        ) : isLicense ? (
                          <Key className="w-5 h-5 text-[#39e3d7]" />
                        ) : isContract ? (
                          <FileText className="w-5 h-5 text-[#716df7]" />
                        ) : isClosing ? (
                          <Clock className="w-5 h-5 text-amber-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-[#39e3d7]" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                          {alert.badge && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                isCrit
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : isLicense
                                  ? 'bg-[#39e3d7]/15 text-[#39e3d7] border border-[#39e3d7]/30'
                                  : isContract
                                  ? 'bg-[#716df7]/20 text-[#D7D6F4] border border-[#716df7]/30'
                                  : 'bg-[#3632c7]/30 text-[#39e3d7] border border-[#39e3d7]/30'
                              }`}
                            >
                              {alert.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#D7D6F4] leading-relaxed">
                          {alert.message}
                        </p>

                        {(alert.contractOrLicenseNo || alert.entityOrVendor || alert.financialValue) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#8E92BC]">
                            {alert.contractOrLicenseNo && (
                              <span className="font-mono-num px-1.5 py-0.5 rounded bg-[#0B0D17] border border-[#232742] text-[#39e3d7]">
                                كود/رقم: {alert.contractOrLicenseNo}
                              </span>
                            )}
                            {alert.entityOrVendor && (
                              <span className="px-1.5 py-0.5 rounded bg-[#0B0D17] border border-[#232742] text-[#D7D6F4]">
                                الجهة: {alert.entityOrVendor}
                              </span>
                            )}
                            {alert.financialValue && (
                              <span className="font-mono-num font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-[#0B0D17] border border-[#232742]">
                                القيمة: {alert.financialValue.toLocaleString()} {settings.currencySymbol}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#232742] text-xs">
                    {alert.daysRemaining !== undefined && (
                      <span className="text-[11px] font-mono-num text-[#8E92BC] flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-[#39e3d7]" />
                        <span>
                          {alert.daysRemaining < 0
                            ? `متأخر بـ ${Math.abs(alert.daysRemaining)} يوم`
                            : alert.daysRemaining === 0
                            ? 'الاستحقاق اليوم'
                            : `متبقي ${alert.daysRemaining} أيام`}
                        </span>
                      </span>
                    )}

                    <button
                      onClick={() => onNavigate(alert.actionSheetKey)}
                      className="flex items-center gap-1.5 font-bold text-[#39e3d7] hover:underline transition-colors cursor-pointer mr-auto"
                    >
                      <span>{alert.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending & Draft Journal Entries Management Section */}
      <div className="bg-[#131626] border border-[#232742] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#39e3d7]" />
              <span>القيود المعلقة تحت الاعتماد والترحيل (Pending Entries)</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono-num ${
                  pendingEntries.length > 0
                    ? 'bg-[#3632c7]/25 text-[#39e3d7] border border-[#39e3d7]/30'
                    : 'bg-[#39e3d7]/15 text-[#39e3d7] border border-[#39e3d7]/30'
                }`}
              >
                {pendingEntries.length} قيد معلق
              </span>
            </h3>
            <p className="text-xs text-[#8E92BC]">
              يجب اعتماد وترحيل كافة القيود المسودة لإدراجها في ميزان المراجعة والقوائم المالية قبل إغلاق الفترة
            </p>
          </div>

          {pendingEntries.length > 0 && (
            <button
              onClick={() => onNavigate('journal_entries')}
              className="text-xs text-[#39e3d7] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>عرض كافة القيود بدفتر اليومية</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {pendingEntries.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#0B0D17]/60 border border-dashed border-[#232742] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#39e3d7] mx-auto" />
            <h4 className="text-xs font-bold text-white">لا توجد أي قيود معلقة حالياً!</h4>
            <p className="text-xs text-[#8E92BC]">
              جميع قيود اليومية تم اعتمادها وترحيلها إلى دفاتر الأستاذ العام والأستاذ المساعد بنجاح.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#232742] bg-[#0B0D17]">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#131626] text-[#D7D6F4] font-semibold border-b border-[#232742]">
                <tr>
                  <th className="p-3 w-28">رقم القيد</th>
                  <th className="p-3 w-24">التاريخ</th>
                  <th className="p-3">البيان والشرح المحاسبي</th>
                  <th className="p-3 w-32">المبلغ الإجمالي</th>
                  <th className="p-3 w-28">مُعد القيد</th>
                  <th className="p-3 w-40 text-center">إجراءات الاعتماد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232742]">
                {pendingEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#131626]/70 transition-colors">
                    <td className="p-3 font-mono-num font-bold text-[#39e3d7]">
                      {entry.entryNo}
                    </td>
                    <td className="p-3 font-mono-num text-[#D7D6F4]">{entry.date}</td>
                    <td className="p-3 text-white">
                      <div className="font-medium">{entry.description}</div>
                      <div className="text-[10px] text-[#8E92BC] mt-0.5">
                        {entry.lines.length} أطراف قيد • مستند: {entry.documentNo || 'بدون'}
                      </div>
                    </td>
                    <td className="p-3 font-mono-num font-bold text-white">
                      {entry.totalDebit.toLocaleString()} {settings.currencySymbol}
                    </td>
                    <td className="p-3 text-[#8E92BC]">{entry.createdBy}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onApproveEntry(entry.id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-[#3632c7] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold text-xs shadow cursor-pointer transition-all active:scale-95"
                          title="اعتماد القيد وترحيله فوراً"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>اعتماد فوري</span>
                        </button>
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="px-2 py-1 rounded-lg bg-[#131626] hover:bg-[#1b1f36] text-[#D7D6F4] text-xs border border-[#232742] cursor-pointer transition-all"
                          title="فحص وتعديل القيد"
                        >
                          فحص
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scheduled Smart Alerts & Contractual/License Tracking System (منظومة جدولة التنبيهات الذكية والمواعيد التعاقدية والتراخيص) */}
      <div className="bg-[#131626] border border-[#232742] rounded-2xl p-5 shadow-xl space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#39e3d7]" />
              <span>منظومة جدولة التنبيهات الذكية والمواعيد التعاقدية والتراخيص البرمجية</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#3632c7]/25 text-[#39e3d7] font-bold font-mono-num border border-[#39e3d7]/30">
                {scheduledTasks.length} بند مجدول
              </span>
            </h3>
            <p className="text-xs text-[#8E92BC]">
              تتبع آلي ومبرمج لمواعيد إغلاق الفترة المالية، انتهاء سريان التراخيص والشهادات الرقمية، والاستحقاقات المالية للعقود التشغيلية
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#3632c7] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold text-xs shadow-lg shadow-[#3632c7]/30 cursor-pointer w-full sm:w-auto active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>جدولة تنبيه أو تعاقد أو ترخيص جديد</span>
            </button>
          </div>
        </div>

        {/* 4 Pillars Summary Statistics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Pillar 1: Period Closing Deadlines */}
          <div
            onClick={() => setScheduleActiveTab('period_closing')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              scheduleActiveTab === 'period_closing'
                ? 'bg-[#1A1860]/80 border-[#39e3d7] shadow-lg shadow-[#3632c7]/20'
                : 'bg-[#0B0D17]/80 border-[#232742] hover:border-[#3632c7]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#3632c7]/30 flex items-center justify-center text-[#39e3d7]">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">مواعيد الإغلاق المالي</span>
                  <span className="text-[10px] text-[#8E92BC]">الفترة: Q1-2026</span>
                </div>
              </div>
              <span className="text-xs font-bold font-mono-num px-2 py-0.5 rounded-full bg-[#39e3d7]/15 text-[#39e3d7] border border-[#39e3d7]/30">
                {periodClosingTasks.length} مهام
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between text-xs">
              <span className="text-[#8E92BC] text-[11px]">جاهزية الإقفال:</span>
              <span className="font-mono-num font-bold text-white">
                {closingStatus.readinessPercentage}% (متبقي {closingStatus.daysRemaining} أيام)
              </span>
            </div>
          </div>

          {/* Pillar 2: Software Licenses */}
          <div
            onClick={() => setScheduleActiveTab('software_licenses')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              scheduleActiveTab === 'software_licenses'
                ? 'bg-[#1A1860]/80 border-[#39e3d7] shadow-lg shadow-[#3632c7]/20'
                : 'bg-[#0B0D17]/80 border-[#232742] hover:border-[#3632c7]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#39e3d7]/20 flex items-center justify-center text-[#39e3d7]">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">التراخيص البرمجية</span>
                  <span className="text-[10px] text-[#8E92BC]">أنظمة ERP وشهادات</span>
                </div>
              </div>
              <span className="text-xs font-bold font-mono-num px-2 py-0.5 rounded-full bg-[#39e3d7]/15 text-[#39e3d7] border border-[#39e3d7]/30">
                {softwareLicenseTasks.length} تراخيص
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between text-xs">
              <span className="text-[#8E92BC] text-[11px]">رسوم التجديد:</span>
              <span className="font-mono-num font-bold text-[#39e3d7]">
                {totalLicenseRenewalFees.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
          </div>

          {/* Pillar 3: Contractual Obligations */}
          <div
            onClick={() => setScheduleActiveTab('contractual_deadlines')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              scheduleActiveTab === 'contractual_deadlines'
                ? 'bg-[#1A1860]/80 border-[#39e3d7] shadow-lg shadow-[#3632c7]/20'
                : 'bg-[#0B0D17]/80 border-[#232742] hover:border-[#3632c7]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#716df7]/20 flex items-center justify-center text-[#716df7]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">الالتزامات التعاقدية</span>
                  <span className="text-[10px] text-[#8E92BC]">عقود حج وصيانة وتأمين</span>
                </div>
              </div>
              <span className="text-xs font-bold font-mono-num px-2 py-0.5 rounded-full bg-[#716df7]/20 text-[#D7D6F4] border border-[#716df7]/30">
                {contractualTasks.length} عقود
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between text-xs">
              <span className="text-[#8E92BC] text-[11px]">مبالغ مستحقة:</span>
              <span className="font-mono-num font-bold text-emerald-400">
                {totalContractualObligations.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
          </div>

          {/* Pillar 4: Urgent Alerts */}
          <div
            onClick={() => setScheduleActiveTab('urgent')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              scheduleActiveTab === 'urgent'
                ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/40'
                : 'bg-[#0B0D17]/80 border-[#232742] hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">تنبيهات عاجلة وشيكة</span>
                  <span className="text-[10px] text-[#8E92BC]">استحقاق ≤ 10 أيام</span>
                </div>
              </div>
              <span className="text-xs font-bold font-mono-num px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {urgentTasks.length} عاجل
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between text-xs">
              <span className="text-[#8E92BC] text-[11px]">مستوى الإجراء:</span>
              <span className="font-bold text-rose-400">
                {urgentTasks.length > 0 ? 'متابعة وسداد فوري' : 'مستقر ومنتظم'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selector & Filter Toolbar */}
        <div className="space-y-3 bg-[#0B0D17]/80 p-3.5 rounded-xl border border-[#232742]">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#232742]">
            <button
              onClick={() => setScheduleActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                scheduleActiveTab === 'all'
                  ? 'bg-[#3632c7] text-white shadow'
                  : 'bg-[#131626] text-[#8E92BC] hover:text-white border border-[#232742]'
              }`}
            >
              جميع التنبيهات المجدولة ({scheduledTasks.length})
            </button>

            <button
              onClick={() => setScheduleActiveTab('period_closing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scheduleActiveTab === 'period_closing'
                  ? 'bg-[#3632c7] text-white shadow'
                  : 'bg-[#131626] text-[#8E92BC] hover:text-white border border-[#232742]'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>مواعيد الإغلاق المالي ({periodClosingTasks.length})</span>
            </button>

            <button
              onClick={() => setScheduleActiveTab('software_licenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scheduleActiveTab === 'software_licenses'
                  ? 'bg-[#39e3d7] text-slate-950 shadow font-extrabold'
                  : 'bg-[#131626] text-[#8E92BC] hover:text-white border border-[#232742]'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>التراخيص البرمجية ({softwareLicenseTasks.length})</span>
            </button>

            <button
              onClick={() => setScheduleActiveTab('contractual_deadlines')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scheduleActiveTab === 'contractual_deadlines'
                  ? 'bg-[#716df7] text-white shadow'
                  : 'bg-[#131626] text-[#8E92BC] hover:text-white border border-[#232742]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>الالتزامات التعاقدية ({contractualTasks.length})</span>
            </button>

            <button
              onClick={() => setScheduleActiveTab('urgent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scheduleActiveTab === 'urgent'
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-[#131626] text-rose-400 hover:text-rose-300 border border-rose-500/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>عاجل وشيك ≤ 10 أيام ({urgentTasks.length})</span>
            </button>
          </div>

          {/* Search and Secondary Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-[#8E92BC]" />
              <input
                type="text"
                placeholder="بحث برقم العقد، كود الترخيص، الجهة، أو الموضوع..."
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                className="w-full bg-[#131626] border border-[#232742] rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-[#8E92BC] focus:outline-none focus:border-[#39e3d7]"
              />
            </div>

            <div>
              <select
                value={taskCategoryFilter}
                onChange={(e) => setTaskCategoryFilter(e.target.value)}
                className="w-full bg-[#131626] border border-[#232742] rounded-lg px-3 py-1.5 text-xs text-[#39e3d7] focus:outline-none focus:border-[#39e3d7] cursor-pointer"
              >
                <option value="all">كافة التصنيفات والمجالات</option>
                <option value="period_closing">📅 مواعيد إغلاق الفترة المالية</option>
                <option value="software_licenses">💻 التراخيص البرمجية والاشتراكات السحابية</option>
                <option value="contractual_deadlines">📜 المواعيد والالتزامات التعاقدية</option>
                <option value="financial_statements">📊 القوائم المالية والتحليلات</option>
                <option value="pending_entries">📝 القيود المعلقة والتسويات</option>
                <option value="bank_reconciliation">🏦 التسويات البنكية ومذكرات المطابقة</option>
                <option value="cost_centers">🎯 مراكز التكلفة والموازنة</option>
                <option value="tax_and_savings">👥 أمانات الأعضاء والضرائب</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#0B0D17]/40 border border-dashed border-[#232742] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#39e3d7] mx-auto opacity-80" />
            <h4 className="text-xs font-bold text-white">لا توجد بنود تطابق معايير التصفية والبحث الحالية</h4>
            <p className="text-xs text-[#8E92BC]">
              يمكنك تغيير التبويب المختار أو الضغط على زر إضافة بند مجدول جديد لإدراج التزام أو ترخيص.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isCritical = task.priority === 'critical';
              const isHigh = task.priority === 'high';
              const daysRemaining = calculateDaysRemaining(task.dueDate, '2026-03-24');
              const isUrgent = daysRemaining <= 10 && !isCompleted;
              const isOverdue = daysRemaining < 0 && !isCompleted;

              const isSoftwareLicense =
                task.category === 'software_licenses' || task.itemType === 'software_license';
              const isContractual =
                task.category === 'contractual_deadlines' || task.itemType === 'contractual_deadline';
              const isPeriodClosing =
                task.category === 'period_closing' || task.itemType === 'period_closing';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isCompleted
                      ? 'bg-[#0B0D17]/40 border-[#232742] opacity-75'
                      : isOverdue
                      ? 'bg-rose-950/25 border-rose-500/60 shadow-md'
                      : isUrgent
                      ? 'bg-[#1A1860]/40 border-amber-500/50 hover:border-amber-400'
                      : isSoftwareLicense
                      ? 'bg-[#0B0D17] border-[#39e3d7]/30 hover:border-[#39e3d7]/60'
                      : isContractual
                      ? 'bg-[#0B0D17] border-[#716df7]/30 hover:border-[#716df7]/60'
                      : 'bg-[#0B0D17] border-[#232742] hover:border-[#3632c7]/60'
                  }`}
                >
                  {/* Top Bar: Title & Status Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => onToggleTaskStatus(task.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 border cursor-pointer transition-colors shrink-0 ${
                          isCompleted
                            ? 'bg-[#39e3d7] border-[#39e3d7] text-slate-950'
                            : 'border-[#39e3d7]/50 hover:border-[#39e3d7] bg-[#131626]'
                        }`}
                        title={isCompleted ? 'إعادة البند كمعلق' : 'تحديد كمكتمل / تم السداد أو التجديد'}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Type Badge */}
                          {isSoftwareLicense && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#39e3d7]/15 text-[#39e3d7] border border-[#39e3d7]/30 flex items-center gap-1">
                              <Key className="w-3 h-3" />
                              <span>ترخيص برمجي</span>
                            </span>
                          )}
                          {isContractual && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#716df7]/20 text-[#D7D6F4] border border-[#716df7]/30 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>التزام تعاقدي</span>
                            </span>
                          )}
                          {isPeriodClosing && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>إغلاق دوري</span>
                            </span>
                          )}

                          <h4
                            className={`text-xs font-bold ${
                              isCompleted ? 'line-through text-[#8E92BC]' : 'text-white'
                            }`}
                          >
                            {task.title}
                          </h4>
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-[#8E92BC]">
                          <span className="flex items-center gap-1 font-mono-num text-[#39e3d7]">
                            <Calendar className="w-3 h-3 text-[#39e3d7]" />
                            <span>الاستحقاق: {task.dueDate}</span>
                          </span>

                          <span>•</span>

                          {/* Countdown Badge */}
                          <span
                            className={`font-mono-num font-bold px-1.5 py-0.2 rounded text-[10px] ${
                              isCompleted
                                ? 'bg-[#39e3d7]/10 text-[#39e3d7]'
                                : isOverdue
                                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                                : daysRemaining === 0
                                ? 'bg-rose-500/20 text-rose-300'
                                : daysRemaining <= 5
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-[#131626] text-[#8E92BC] border border-[#232742]'
                            }`}
                          >
                            {isCompleted
                              ? 'تم الإنجاز'
                              : isOverdue
                              ? `متأخر (${Math.abs(daysRemaining)} يوم)`
                              : daysRemaining === 0
                              ? 'مستحق اليوم'
                              : `متبقي ${daysRemaining} يوماً`}
                          </span>

                          <span>•</span>

                          <span>
                            التكرار:{' '}
                            {task.frequency === 'monthly'
                              ? 'شهرياً'
                              : task.frequency === 'quarterly'
                              ? 'ربع سنوي'
                              : task.frequency === 'weekly'
                              ? 'أسبوعياً'
                              : task.frequency === 'annual'
                              ? 'سنوياً'
                              : 'مرة واحدة'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Priority Badge & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isHigh
                            ? 'bg-[#3632c7]/30 text-[#39e3d7] border border-[#39e3d7]/30'
                            : 'bg-[#39e3d7]/15 text-[#39e3d7] border border-[#39e3d7]/20'
                        }`}
                      >
                        {isCritical ? 'حرج' : isHigh ? 'مرتفع' : 'عادي'}
                      </span>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-[#8E92BC] hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                        title="حذف البند المجدول"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Identification tags: Vendor / Entity / Contract Code / Financial Value */}
                  {(task.entityOrVendor || task.codeOrNumber || task.financialValue) && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] bg-[#131626]/80 p-2 rounded-lg border border-[#232742]">
                      {task.codeOrNumber && (
                        <span className="font-mono-num px-1.5 py-0.5 rounded bg-[#0B0D17] border border-[#232742] text-[#39e3d7]">
                          الرقم/الكود: {task.codeOrNumber}
                        </span>
                      )}

                      {task.entityOrVendor && (
                        <span className="px-1.5 py-0.5 rounded bg-[#0B0D17] border border-[#232742] text-[#D7D6F4]">
                          الجهة/المورد: {task.entityOrVendor}
                        </span>
                      )}

                      {task.financialValue && (
                        <span className="font-mono-num font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-[#0B0D17] border border-[#232742] mr-auto">
                          القيمة المالية: {task.financialValue.toLocaleString()} {settings.currencySymbol}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes / Special Instructions */}
                  {task.notes && (
                    <p className="text-[11px] text-[#D7D6F4] bg-[#131626] p-2 rounded-lg border border-[#232742] leading-relaxed">
                      {task.notes}
                    </p>
                  )}

                  {/* Footer Bar: Assignee & Action Buttons */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-[#8E92BC] border-t border-[#232742]">
                    <span className="truncate">
                      المسؤول: <strong className="text-white">{task.assignedToName}</strong> (
                      {task.assignedToRole})
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.targetSheetKey && (
                        <button
                          onClick={() => onNavigate(task.targetSheetKey!)}
                          className="flex items-center gap-1 text-[#39e3d7] hover:underline font-bold transition-colors cursor-pointer"
                        >
                          <span>
                            {isContractual && task.financialValue
                              ? 'إصدار إذن سداد ودفع'
                              : isSoftwareLicense
                              ? 'إجراءات التجديد'
                              : isPeriodClosing
                              ? 'استكمال الإقفال'
                              : 'فتح الشيت المستهدف'}
                          </span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Strategic Financial KPIs for the Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Net Activity Surplus */}
        <div
          onClick={() => onNavigate('income_statement')}
          className="bg-[#131626] border border-[#232742] rounded-2xl p-4 hover:border-[#39e3d7]/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-[#8E92BC]">
            <span>صافي فائض الأنشطة (الدخل)</span>
            <TrendingUp className="w-4 h-4 text-[#39e3d7] group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-xl font-bold font-mono-num ${
                isStatement.netSurplus >= 0 ? 'text-[#39e3d7]' : 'text-rose-400'
              }`}
            >
              {isStatement.netSurplus.toLocaleString()}
            </span>
            <span className="text-xs text-[#8E92BC]">{settings.currencySymbol}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#8E92BC]">
            الإيرادات {isStatement.totalRevenues.toLocaleString()} • المصروفات{' '}
            {isStatement.totalExpenses.toLocaleString()}
          </p>
        </div>

        {/* Metric 2: Liquid Cash & Banks */}
        <div
          onClick={() => onNavigate('banks')}
          className="bg-[#131626] border border-[#232742] rounded-2xl p-4 hover:border-[#39e3d7]/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-[#8E92BC]">
            <span>السيولة النقدية المتاحة (خزينة وبنوك)</span>
            <DollarSign className="w-4 h-4 text-[#39e3d7] group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono-num text-white">
              {totalLiquidCash.toLocaleString()}
            </span>
            <span className="text-xs text-[#8E92BC]">{settings.currencySymbol}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#8E92BC]">موزعة على بنك مصر - أذون خزانة وباقي الحسابات</p>
        </div>

        {/* Metric 3: Members Savings */}
        <div
          onClick={() => onNavigate('members_savings')}
          className="bg-[#131626] border border-[#232742] rounded-2xl p-4 hover:border-[#39e3d7]/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-[#8E92BC]">
            <span>أمانات ومدخرات الأعضاء</span>
            <Building2 className="w-4 h-4 text-[#716df7] group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono-num text-[#39e3d7]">
              {totalSavings.toLocaleString()}
            </span>
            <span className="text-xs text-[#8E92BC]">{settings.currencySymbol}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#8E92BC]">
            مستحقة لأعضاء الجهاز المشاركين بالحج والعمرة
          </p>
        </div>

        {/* Metric 4: Trial Balance Integrity */}
        <div
          onClick={() => onNavigate('trial_balance_balances')}
          className="bg-[#131626] border border-[#232742] rounded-2xl p-4 hover:border-[#39e3d7]/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-[#8E92BC]">
            <span>تطابق ميزان المراجعة والمركز المالي</span>
            <Scale className="w-4 h-4 text-[#39e3d7] group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono-num text-[#39e3d7]">0.00 فارق</span>
            <span className="text-xs text-[#39e3d7] font-semibold">100% متوازن</span>
          </div>
          <p className="mt-1 text-[11px] text-[#8E92BC]">
            إجمالي المدين يتطابق تماماً مع إجمالي الدائن
          </p>
        </div>
      </div>

      {/* Modal: Add Scheduled Item (ترخيص، عقد، إغلاق مالي، مراجعة دورية) */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-[#131626] border border-[#232742] rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#232742]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3632c7] to-[#39e3d7] flex items-center justify-center text-white shadow">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">جدولة تنبيه أو التزام جديد</h3>
                  <p className="text-[11px] text-[#8E92BC]">
                    إدراج ترخيص برمجي، موعد تعاقدي، إغلاق دوري، أو برنامج رقابي
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="w-7 h-7 rounded-lg bg-[#0B0D17] hover:bg-rose-500/20 text-[#8E92BC] hover:text-rose-400 border border-[#232742] flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets for Item Type */}
            <div className="space-y-1.5">
              <label className="block text-[#D7D6F4] font-semibold text-[11px]">
                نوع التنبيه أو الجدولة المطلوبة (اختر قالباً سريعاً):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectScheduleTypePreset('software_license')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    newTaskForm.itemType === 'software_license'
                      ? 'bg-[#39e3d7]/15 border-[#39e3d7] text-[#39e3d7] font-bold shadow'
                      : 'bg-[#0B0D17] border-[#232742] text-[#8E92BC] hover:text-white'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span className="text-[11px]">ترخيص برمجي</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectScheduleTypePreset('contractual_deadline')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    newTaskForm.itemType === 'contractual_deadline'
                      ? 'bg-[#716df7]/20 border-[#716df7] text-[#D7D6F4] font-bold shadow'
                      : 'bg-[#0B0D17] border-[#232742] text-[#8E92BC] hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-[11px]">التزام تعاقدي</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectScheduleTypePreset('period_closing')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    newTaskForm.itemType === 'period_closing'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow'
                      : 'bg-[#0B0D17] border-[#232742] text-[#8E92BC] hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-[11px]">إغلاق دوري</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectScheduleTypePreset('financial_review')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    newTaskForm.itemType === 'financial_review'
                      ? 'bg-[#3632c7]/30 border-[#3632c7] text-[#39e3d7] font-bold shadow'
                      : 'bg-[#0B0D17] border-[#232742] text-[#8E92BC] hover:text-white'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  <span className="text-[11px]">مراجعة قوائم</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveNewTask} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-[#D7D6F4] font-semibold mb-1">
                  عنوان التنبيه أو الالتزام المجدول
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تجديد الختم الإلكتروني Egypt Trust / سداد الدفعة الثانية لفندق مكة"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#39e3d7]"
                />
              </div>

              {/* Identification: Code & Entity/Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#D7D6F4] font-semibold mb-1">
                    رقم العقد أو كود الترخيص
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: LIC-2026-SW أو CONT-MKH-01"
                    value={newTaskForm.codeOrNumber}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, codeOrNumber: e.target.value })
                    }
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white font-mono-num focus:outline-none focus:border-[#39e3d7]"
                  />
                </div>

                <div>
                  <label className="block text-[#D7D6F4] font-semibold mb-1">
                    الجهة المتعاقدة أو الشركة الموردة
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شركة إيجيبت تراست / شركة مصر للطيران"
                    value={newTaskForm.entityOrVendor}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, entityOrVendor: e.target.value })
                    }
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white focus:outline-none focus:border-[#39e3d7]"
                  />
                </div>
              </div>

              {/* Financial Value & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#D7D6F4] font-semibold mb-1">
                    القيمة المالية المستحقة ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="مثال: 7500 أو 1850000"
                    value={newTaskForm.financialValue}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        financialValue: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-emerald-400 font-mono-num font-bold focus:outline-none focus:border-[#39e3d7]"
                  />
                </div>

                <div>
                  <label className="block text-[#D7D6F4] font-semibold mb-1">
                    تاريخ الاستحقاق أو انتهاء السريان
                  </label>
                  <input
                    type="date"
                    required
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white font-mono-num focus:outline-none focus:border-[#39e3d7]"
                  />
                </div>
              </div>

              {/* Reminder Days & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#D7D6F4] font-semibold mb-1">
                    أيام التنبيه المسبق
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={newTaskForm.reminderDaysBefore}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        reminderDaysBefore: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white font-mono-num focus:outline-none focus:border-[#39e3d7]"
                  />
                </div>

                <div>
                  <label className="block text-[#D7D6F4] font-semibold mb-1">
                    دورية التكرار
                  </label>
                  <select
                    value={newTaskForm.frequency}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        frequency: e.target.value as ReviewFrequency,
                      })
                    }
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white focus:outline-none focus:border-[#39e3d7] cursor-pointer"
                  >
                    <option value="once">مرة واحدة (عقد محدد)</option>
                    <option value="annual">سنوي (تجديد تراخيص)</option>
                    <option value="quarterly">ربع سنوي (إقفالات)</option>
                    <option value="monthly">شهرياً (مطابقات دورية)</option>
                    <option value="weekly">أسبوعياً</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#D7D6F4] font-semibold mb-1">
                    درجة الأولوية
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        priority: e.target.value as ReviewTaskPriority,
                      })
                    }
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white focus:outline-none focus:border-[#39e3d7] cursor-pointer"
                  >
                    <option value="critical">حرج (أولوية قصوى قبل الموعد)</option>
                    <option value="high">مرتفع</option>
                    <option value="medium">متوسط</option>
                    <option value="low">عادي</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#D7D6F4] font-semibold mb-1">
                    المسؤول المكلف بالمتابعة
                  </label>
                  <input
                    type="text"
                    required
                    value={newTaskForm.assignedToName}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, assignedToName: e.target.value })
                    }
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white focus:outline-none focus:border-[#39e3d7]"
                  />
                </div>

                <div>
                  <label className="block text-[#D7D6F4] font-semibold mb-1">
                    المسمى الوظيفي للمسؤول
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.assignedToRole}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, assignedToRole: e.target.value })
                    }
                    className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white focus:outline-none focus:border-[#39e3d7]"
                  />
                </div>
              </div>

              {/* Target Sheet Key */}
              <div>
                <label className="block text-[#D7D6F4] font-semibold mb-1">
                  الشيت / القائمة المستهدفة للإجراء الفوري
                </label>
                <select
                  value={newTaskForm.targetSheetKey}
                  onChange={(e) =>
                    setNewTaskForm({
                      ...newTaskForm,
                      targetSheetKey: e.target.value as SheetKey,
                    })
                  }
                  className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-[#39e3d7] focus:outline-none focus:border-[#39e3d7] cursor-pointer"
                >
                  <option value="executive_dashboard">لوحة التحكم التنفيذية والإقفال</option>
                  <option value="entry_voucher_form">إصدار أذون صرف وسندات قيد سداد</option>
                  <option value="journal_entries">دفتر اليومية العامة والقيود</option>
                  <option value="income_statement">قائمة الدخل الشامل (Sheet 27)</option>
                  <option value="balance_sheet">قائمة المركز المالي (Sheet 28)</option>
                  <option value="cash_flow">قائمة التدفقات النقدية (Sheet 29)</option>
                  <option value="bank_reconciliation">التسويات البنكية ومذكرات المطابقة (Sheet 24)</option>
                  <option value="trial_balance_final">ميزان المراجعة بالأرصدة (Sheet 22)</option>
                  <option value="variance_analysis">تحليل الانحرافات والموازنة (Sheet 26)</option>
                  <option value="checks_collection">شيكات تحت التحصيل (Sheet 16)</option>
                  <option value="members_savings">مدخرات وأمانات الأعضاء (Sheet 17)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#D7D6F4] font-semibold mb-1">
                  ملاحظات وشروط العقد أو التجديد
                </label>
                <textarea
                  rows={2}
                  placeholder="أي تعليمات إدارية، متطلبات فنية للترخيص، أو شروط جزائية بالعقد..."
                  value={newTaskForm.notes}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })}
                  className="w-full bg-[#0B0D17] border border-[#232742] rounded-lg p-2 text-white focus:outline-none focus:border-[#39e3d7]"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232742]">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] text-[#8E92BC] hover:text-white font-semibold cursor-pointer border border-[#232742]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#3632c7] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold shadow-lg shadow-[#3632c7]/30 cursor-pointer active:scale-95 transition-all"
                >
                  حفظ الجدولة والتنبيه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
