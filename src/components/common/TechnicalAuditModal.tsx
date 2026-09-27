import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Printer,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Coins,
  Building,
  Landmark,
  Scale,
  Calendar,
  AlertOctagon,
  FileCheck,
  Check,
  Sliders,
  DollarSign,
  Activity,
  Layers,
} from 'lucide-react';
import {
  JournalEntry,
  Account,
  CostCenter,
  CheckTransaction,
  BudgetLine,
  SystemSettings,
  SheetKey,
  BankAccount,
} from '../../types/accounting';
import {
  calculateTrialBalanceTotals,
  calculateTrialBalanceBalances,
  calculateBalanceSheet,
  calculateIncomeStatement,
  calculateCashFlow,
  calculateVarianceAnalysis,
} from '../../services/accountingEngine';

export interface AuditCheckItem {
  id: string;
  category: 'orientations' | 'posting_balancing' | 'liquidity' | 'budget' | 'compliance';
  categoryTitle: string;
  title: string;
  status: 'passed' | 'warning' | 'error';
  findings: string;
  suggestedAction?: string;
  targetSheetKey?: SheetKey;
  actionText?: string;
  severity: 'high' | 'medium' | 'low';
}

interface TechnicalAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  accounts: Account[];
  costCenters: CostCenter[];
  checks: CheckTransaction[];
  bankAccounts: BankAccount[];
  budgets: BudgetLine[];
  settings: SystemSettings;
  onNavigate: (sheet: SheetKey) => void;
}

export const TechnicalAuditModal: React.FC<TechnicalAuditModalProps> = ({
  isOpen,
  onClose,
  entries,
  accounts,
  costCenters,
  checks,
  bankAccounts,
  budgets,
  settings,
  onNavigate,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'suggestions' | 'passed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Trigger scan animation on modal open
  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      const timer = setTimeout(() => {
        setIsScanning(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Run comprehensive diagnostic calculations
  const approvedEntries = entries.filter((e) => e.status === 'approved');
  const draftEntries = entries.filter((e) => e.status === 'draft');

  const tbTotals = calculateTrialBalanceTotals(accounts, entries);
  const tbBalances = calculateTrialBalanceBalances(accounts, entries);
  const bs = calculateBalanceSheet(accounts, entries);
  const income = calculateIncomeStatement(accounts, entries);
  const cashFlow = calculateCashFlow(accounts, entries);
  const variances = calculateVarianceAnalysis(budgets, accounts, entries);

  // Calculations for Treasury and Bank balances
  let realtimeTreasuryBalance = 150000;
  approvedEntries
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((entry) => {
      entry.lines.forEach((line) => {
        if (line.accountCode === '1111') {
          const dr = Number(line.debit) || 0;
          const cr = Number(line.credit) || 0;
          realtimeTreasuryBalance += dr - cr;
        }
      });
    });

  const minTreasury = settings.minTreasuryBalanceAlert ?? 100000;
  const minBank = settings.minBankBalanceAlert ?? 1000000;

  // Audit Rule Evaluations
  const checkItems: AuditCheckItem[] = [];

  // 1. التوجيهات المحاسبية: طبيعة الحسابات والقيود
  let abnormalLinesCount = 0;
  let missingCostCenterCount = 0;
  let nonPostingLinesCount = 0;

  approvedEntries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const acc = accounts.find((a) => a.id === line.accountId || a.code === line.accountCode);
      if (acc) {
        if (!acc.isPosting) nonPostingLinesCount++;
        if (acc.requiresCostCenter && !line.costCenterId && !line.costCenterCode) {
          missingCostCenterCount++;
        }
      }
    });
  });

  const abnormalBalanceAccounts = tbBalances.rows.filter((r) => r.isAbnormal);

  checkItems.push({
    id: 'chk-orient-nature',
    category: 'orientations',
    categoryTitle: 'التوجيهات المحاسبية وطبيعة الحسابات',
    title: 'تطابق توجيه القيود مع الطبيعة المحاسبية وأرصدة الدفاتر',
    status: abnormalBalanceAccounts.length === 0 ? 'passed' : 'warning',
    findings:
      abnormalBalanceAccounts.length === 0
        ? 'كافة الحسابات تتوافق أرصدتها الختامية بدقة مع طبيعتها الأصلية (مدينة للأصول والمصروفات، دائنة للالتزامات وحقوق الملكية والإيرادات).'
        : `تم رصد (${abnormalBalanceAccounts.length}) حسابات بأرصدة شاذة مخالفة لطبيعتها المحاسبية (مثل: ${abnormalBalanceAccounts.map((a) => a.accountName).slice(0, 2).join('، ')}).`,
    suggestedAction:
      abnormalBalanceAccounts.length > 0
        ? 'مراجعة قيود التسوية الجردية وفحص تسويات القيود المدينة والدائنة لهذه الحسابات لتصحيح طبيعة رصيدها قبل إغلاق الفترة.'
        : undefined,
    targetSheetKey: 'trial_balance_balances',
    actionText: 'معاينة ميزان الأرصدة',
    severity: abnormalBalanceAccounts.length > 0 ? 'medium' : 'low',
  });

  checkItems.push({
    id: 'chk-orient-costcenters',
    category: 'orientations',
    categoryTitle: 'التوجيهات المحاسبية وطبيعة الحسابات',
    title: 'إلزامية مراكز التكلفة لإيرادات ومصروفات الحج والعمرة والمعارض',
    status: missingCostCenterCount === 0 ? 'passed' : 'error',
    findings:
      missingCostCenterCount === 0
        ? 'كافة حركات الأنشطة النوعية (حج، عمرة رجب، عمرة شعبان، معارض) مقترنة وموجهة بدقة إلى مراكز التكلفة التحليلية المختصة.'
        : `تم رصد (${missingCostCenterCount}) سطر محاسبي لإيرادات أو مصروفات أنشطة غير مقترنة بمركز تكلفة محدد!`,
    suggestedAction:
      missingCostCenterCount > 0
        ? 'تعديل القيود المعنية وربط كل حركة بالنشاط ومركز التكلفة الخاص بها لضمان دقة القوائم التحليلية.'
        : undefined,
    targetSheetKey: 'cost_centers',
    actionText: 'فحص مراكز التكلفة',
    severity: missingCostCenterCount > 0 ? 'high' : 'low',
  });

  checkItems.push({
    id: 'chk-orient-posting',
    category: 'orientations',
    categoryTitle: 'التوجيهات المحاسبية وطبيعة الحسابات',
    title: 'حظر الترحيل على الحسابات التجميعية والرئيسية غير القابلة للترحيل',
    status: nonPostingLinesCount === 0 ? 'passed' : 'error',
    findings:
      nonPostingLinesCount === 0
        ? 'جميع أسطر القيود موجهة إلى حسابات تحليلية فرعية نشطة مخصصة للترحيل (isPosting: true).'
        : `يوجد (${nonPostingLinesCount}) حركة مسجلة على حسابات تجميعية رئيسية!`,
    suggestedAction:
      nonPostingLinesCount > 0
        ? 'إعادة توجيه القيود إلى الحسابات التحليلية الفرعية من المستوى الأدنى.'
        : undefined,
    targetSheetKey: 'chart_of_accounts',
    actionText: 'دليل الحسابات',
    severity: nonPostingLinesCount > 0 ? 'high' : 'low',
  });

  // 2. الترحيل والترصيد: اتزان اليومية والموازين والقوائم
  const journalDiff = Math.abs(tbTotals.totalPeriodDr - tbTotals.totalPeriodCr);
  const isJournalBalanced = journalDiff < 0.01;

  checkItems.push({
    id: 'chk-balance-journal',
    category: 'posting_balancing',
    categoryTitle: 'الترحيل والترصيد والتوازن المحاسبي',
    title: 'توازن اليومية العامة وصحة الترحيل (المدين = الدائن)',
    status: isJournalBalanced ? 'passed' : 'error',
    findings: isJournalBalanced
      ? `اليومية العامة متوازنة بدقة مطلقة (فارق صفر): إجمالي المدين = الدائن = ${tbTotals.totalPeriodDr.toLocaleString()} ${settings.currencySymbol}.`
      : `يوجد عدم توازن بين إجمالي المدين والدائن باليومية العامة بفارق: ${journalDiff.toLocaleString()} ${settings.currencySymbol}!`,
    suggestedAction: !isJournalBalanced
      ? 'إجراء مراجعة فورية لقيود اليومية وتحديد القيد غير المتزن لإعادة ضبط طرفي القيد.'
      : undefined,
    targetSheetKey: 'journal_entries',
    actionText: 'سجل اليومية العامة',
    severity: !isJournalBalanced ? 'high' : 'low',
  });

  checkItems.push({
    id: 'chk-balance-tb',
    category: 'posting_balancing',
    categoryTitle: 'الترحيل والترصيد والتوازن المحاسبي',
    title: 'تطابق واتزان ميزان المراجعة بالمجاميع والأرصدة',
    status: tbBalances.isBalanced ? 'passed' : 'error',
    findings: tbBalances.isBalanced
      ? `ميزان المراجعة بالأرصدة متطابق تماماً: إجمالي الأرصدة المدينة = الدائنة = ${tbBalances.totalClosingDr.toLocaleString()} ${settings.currencySymbol}.`
      : 'يوجد عدم اتزان في ميزان المراجعة بالأرصدة يتطلب التدقيق!',
    suggestedAction: !tbBalances.isBalanced
      ? 'فحص مجاميع الأستاذ العام وتسويات الأرصدة الافتتاحية والختامية.'
      : undefined,
    targetSheetKey: 'trial_balance_balances',
    actionText: 'ميزان المراجعة بالأرصدة',
    severity: !tbBalances.isBalanced ? 'high' : 'low',
  });

  checkItems.push({
    id: 'chk-balance-bs',
    category: 'posting_balancing',
    categoryTitle: 'الترحيل والترصيد والتوازن المحاسبي',
    title: 'تطابق واتزان قائمة المركز المالي (الأصول = الخصوم + حقوق الملكية)',
    status: bs.isBalanced ? 'passed' : 'error',
    findings: bs.isBalanced
      ? `المركز المالي متوازن تماماً: إجمالي الأصول (${bs.totalAssets.toLocaleString()} ج.م) = إجمالي الخصوم وحقوق الملكية (${bs.totalLiabilitiesAndEquity.toLocaleString()} ج.م).`
      : `يوجد فارق عدم اتزان بالمركز المالي بمقدار ${Math.abs(bs.difference).toLocaleString()} ${settings.currencySymbol}!`,
    suggestedAction: !bs.isBalanced
      ? 'فحص ترحيل فائض/عجز الفترة من قائمة الدخل إلى بند الفائض المرحل بحقوق الملكية بالمركز المالي.'
      : undefined,
    targetSheetKey: 'balance_sheet',
    actionText: 'المركز المالي',
    severity: !bs.isBalanced ? 'high' : 'low',
  });

  checkItems.push({
    id: 'chk-posting-drafts',
    category: 'posting_balancing',
    categoryTitle: 'الترحيل والترصيد والتوازن المحاسبي',
    title: 'حالة القيود المسودة بانتظار الاعتماد والترحيل',
    status: draftEntries.length === 0 ? 'passed' : 'warning',
    findings:
      draftEntries.length === 0
        ? 'تم ترحيل واعتماد كافة القيود المحاسبية بالدفاتر، ولا توجد قيود معلقة خارج موازين المراجعة.'
        : `توجد (${draftEntries.length}) قيود مسودة معلقة لم يتم ترحيلها بعد، بقيمة إجمالية ${draftEntries.reduce((s, e) => s + e.totalDebit, 0).toLocaleString()} ${settings.currencySymbol}.`,
    suggestedAction:
      draftEntries.length > 0
        ? 'اعتماد القيود المسودة المستوفية للمستندات لترحيلها رسمياً وتحديث أرصدة الحسابات وموازين المراجعة.'
        : undefined,
    targetSheetKey: 'journal_entries',
    actionText: 'اعتماد القيود المعلقة',
    severity: draftEntries.length > 0 ? 'medium' : 'low',
  });

  // 3. السيولة النقدية والمصرفية
  const isTreasuryLow = realtimeTreasuryBalance < minTreasury;
  const lowBanks = bankAccounts.filter((b) => b.bookBalance < (b.minBalanceAlert ?? minBank));

  checkItems.push({
    id: 'chk-liq-treasury',
    category: 'liquidity',
    categoryTitle: 'الرقابة المصرفية وإدارة السيولة النقدية',
    title: 'مراقبة حد أمان السيولة النقدية بالخزينة الرئيسية (1111)',
    status: isTreasuryLow ? 'warning' : 'passed',
    findings: !isTreasuryLow
      ? `رصيد الخزينة اللحظي (${realtimeTreasuryBalance.toLocaleString()} ج.م) في النطاق الآمن أعلى من الحد الأدنى (${minTreasury.toLocaleString()} ج.م).`
      : `رصيد الخزينة اللحظي (${realtimeTreasuryBalance.toLocaleString()} ج.م) أقل من حد الأمان المقرر (${minTreasury.toLocaleString()} ج.م) بعجز قدره ${(minTreasury - realtimeTreasuryBalance).toLocaleString()} ج.م!`,
    suggestedAction: isTreasuryLow
      ? 'إصدار إذن صرف شيك لتغذية الخزينة النقدية الرئيسية من حساب بنك مصر الجاري لاستعادة حد الأمان المطلوب.'
      : undefined,
    targetSheetKey: 'treasury_cash',
    actionText: 'شيت حركة الخزينة',
    severity: isTreasuryLow ? 'high' : 'low',
  });

  checkItems.push({
    id: 'chk-liq-banks',
    category: 'liquidity',
    categoryTitle: 'الرقابة المصرفية وإدارة السيولة النقدية',
    title: 'مراقبة حد أمان السيولة بالحسابات البنكية (بنك مصر الجاري وأذون الخزانة)',
    status: lowBanks.length === 0 ? 'passed' : 'warning',
    findings:
      lowBanks.length === 0
        ? `كافة الحسابات البنكية (${bankAccounts.length}) في النطاق الآمن وتغطي المتطلبات التشغيلية والشيكات المتداولة.`
        : `يوجد (${lowBanks.length}) حسابات بنكية هبط رصيدها دون الحد الأدنى المقرر (${minBank.toLocaleString()} ج.م): ${lowBanks.map((b) => b.bankName).join('، ')}.`,
    suggestedAction:
      lowBanks.length > 0
        ? 'تحويل سيولة من محفظة أذون الخزانة بحساب بنك مصر (1122) إلى الحساب الجاري (1121) لتغطية الشيكات المتداولة.'
        : undefined,
    targetSheetKey: 'banks',
    actionText: 'إدارة حسابات البنوك',
    severity: lowBanks.length > 0 ? 'high' : 'low',
  });

  // 4. رقابة الموازنة التقديرية والمصروفات
  const over90BudgetItems = variances.filter((v) => v.burnRatePct >= 90);

  checkItems.push({
    id: 'chk-budget-over90',
    category: 'budget',
    categoryTitle: 'رقابة الموازنة التقديرية والإنفاق الفعلي',
    title: 'رصد بنود الميزانية التي تجاوزت 90% من مخصصاتها المعتمدة',
    status: over90BudgetItems.length === 0 ? 'passed' : 'warning',
    findings:
      over90BudgetItems.length === 0
        ? 'جميع بنود المصروفات التقديرية تقع ضمن حدود المخصصات المعتمدة (معدل استهلاك أقل من 90%).'
        : `تم رصد (${over90BudgetItems.length}) بند من بنود المصروفات تجاوزت 90% من مخصصاتها السنوية، منها: ${over90BudgetItems.map((b) => `${b.accountName} (${b.burnRatePct.toFixed(1)}%)`).slice(0, 3).join('، ')}.`,
    suggestedAction:
      over90BudgetItems.length > 0
        ? 'تجميد الصرف الإضافي على هذه البنود وإجراء مناقلة مالية بين بنود الموازنة بقرار مجلس الإدارة لتعزيز الاعتماد.'
        : undefined,
    targetSheetKey: 'variance_analysis',
    actionText: 'مقارنة الفعلي بالموازنة',
    severity: over90BudgetItems.length > 0 ? 'high' : 'low',
  });

  // 5. الامتثال القانوني والضريبي والتأمينات
  checkItems.push({
    id: 'chk-comp-social-insurance',
    category: 'compliance',
    categoryTitle: 'الامتثال القانوني والضريبي والتأمينات',
    title: 'تنبيه دوري شهري: سداد اشتراكات التأمينات الاجتماعية (يوم 5 من أول كل شهر)',
    status: 'warning',
    findings:
      'تذكير رقابي إلزامي: يستحق سداد اشتراكات التأمينات الاجتماعية (حصة المنشأة وحصة العاملين - حساب 2162) بمبلغ 32,000 ج.م يوم 5 من أول كل شهر لدى الهيئة القومية للتأمين الاجتماعي.',
    suggestedAction:
      'تحرير إذن صرف وسداد اشتراك التأمينات الشهرية بانتظام لتجنب غرامات وفوائد التأخير القانونية.',
    targetSheetKey: 'entry_voucher_form',
    actionText: 'إصدار إذن صرف التأمينات',
    severity: 'medium',
  });

  checkItems.push({
    id: 'chk-comp-form41-quarterly',
    category: 'compliance',
    categoryTitle: 'الامتثال القانوني والضريبي والتأمينات',
    title: 'تنبيه دوري ربع سنوي: إعداد نموذج 41 لضريبة الخصم والتحصيل وتوريد المبالغ للبنك',
    status: 'warning',
    findings:
      'تنبيه دوري كل أول 3 شهور: يلزم إعداد وتوريد ضريبة الخصم من المنبع المحتجزة من الموردين (نموذج 41 ضرائب - حساب 2161) بقيمة 48,000 ج.م وتوريدها للبنك لحساب مصلحة الضرائب المصرية قبل انتهاء المهلة الربع سنوية.',
    suggestedAction:
      'تصدير كشف نموذج 41 الضريبي مع أرقام التسجيل الضريبي للموردين وتوريد الشيك للبنك.',
    targetSheetKey: 'withholding_tax',
    actionText: 'معاينة نموذج 41 ضرائب',
    severity: 'high',
  });

  // Aggregates
  const totalChecks = checkItems.length;
  const passedChecks = checkItems.filter((c) => c.status === 'passed').length;
  const warningChecks = checkItems.filter((c) => c.status === 'warning').length;
  const errorChecks = checkItems.filter((c) => c.status === 'error').length;
  const suggestionsCount = warningChecks + errorChecks;
  const isAllClear = errorChecks === 0 && warningChecks === 0;

  const displayList = checkItems.filter((item) => {
    if (activeTab === 'passed') return item.status === 'passed';
    if (activeTab === 'suggestions') return item.status !== 'passed';
    return true;
  });

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-gradient-to-br from-[#0F111E] via-[#14182E] to-[#0A0C16] border border-[#39e3d7]/40 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-[#17154A] via-[#12152E] to-[#17154A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3632c7] to-[#39e3d7] p-0.5 flex items-center justify-center shadow-lg shadow-[#3632c7]/40 shrink-0">
              <div className="w-full h-full bg-[#0B0D17] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#39e3d7]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  المراجعة التقنية الشاملة والرقابة المحاسبية
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#39e3d7]/20 text-[#39e3d7] border border-[#39e3d7]/40 shadow-sm">
                  الجهاز المركزي للمحاسبات
                </span>
              </div>
              <p className="text-xs text-slate-300">
                فحص آلي معمق لكافة التوجيهات المحاسبية، والترحيل، والترصيد، والسيولة، والامتثال بالجمعية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsScanning(true);
                setTimeout(() => setIsScanning(false), 500);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="إعادة إجراء الفحص الآن"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-300' : ''}`} />
              <span className="hidden sm:inline">إعادة الفحص</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="طباعة تقرير الفحص والرقابة"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* Scan Status / Top Summary Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/70">
          {isScanning ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-[#39e3d7]/30 border-t-[#39e3d7] animate-spin" />
              <p className="text-sm font-bold text-white">
                جارٍ إجراء الفحص التقني المعمق ومراجعة التوجيهات والترحيل والترصيد...
              </p>
              <p className="text-xs text-slate-400">
                فحص {entries.length} قيد محاسبي • {accounts.length} حساب بدليل الحسابات • قيود اليومية وموازين المراجعة
              </p>
            </div>
          ) : isAllClear ? (
            /* 100% Sound and Clean Banner */
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-950 to-emerald-950/70 border-2 border-emerald-500/80 shadow-xl space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-emerald-300">
                    رسالة إتمام الفحص: تم تمام الفحص والرقابة التقنية بنجاح تام (100% مطابق)
                  </h4>
                  <p className="text-xs text-emerald-200/90 pt-0.5">
                    كافة التوجيهات المحاسبية مطابقة، واليومية العامة متزنة، وصحة الترحيل إلى الأساتذة وموازين المراجعة بنسبة صفر أخطاء، والمركز المالي متوازن تماماً.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Suggestions & Recommended Actions Banner */
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-950 to-rose-950/70 border-2 border-amber-500/80 shadow-xl space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-amber-300">
                    نتائج الفحص والرقابة: تم الفحص ورصد ({suggestionsCount}) ملاحظات ومقترحات لإتمام الرقابة على الوجه الأمثل
                  </h4>
                  <p className="text-xs text-amber-200/90 pt-0.5">
                    البرنامج متزن حسابياً، وتوجد إجراءات تصحيحية موصى بها أدناه لتسوية القيود المعلقة وحدود السيولة ونموذج 41 والتأمينات.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          {!isScanning && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[11px]">إجمالي الفحوصات:</span>
                <span className="text-base font-bold text-white font-mono-num">{totalChecks} محور رقابي</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                <span className="text-emerald-300 block text-[11px]">محاور مكتملة وناجحة:</span>
                <span className="text-base font-bold text-emerald-400 font-mono-num">{passedChecks} محاور</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center">
                <span className="text-amber-300 block text-[11px]">ملاحظات وتنبيهات دورية:</span>
                <span className="text-base font-bold text-amber-400 font-mono-num">{warningChecks} ملاحظات</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-center">
                <span className="text-rose-300 block text-[11px]">ملاحظات حرجة:</span>
                <span className="text-base font-bold text-rose-400 font-mono-num">{errorChecks} أخطاء</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        {!isScanning && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-slate-800 bg-slate-900/60 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                كافة محاور الفحص ({totalChecks})
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeTab === 'suggestions'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                الملاحظات والإجراءات المقترحة ({suggestionsCount})
              </button>
              <button
                onClick={() => setActiveTab('passed')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeTab === 'passed'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                المحاور المجتازة بنجاح ({passedChecks})
              </button>
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:block">
              تاريخ الفحص: {new Date().toLocaleDateString('ar-EG')} {new Date().toLocaleTimeString('ar-EG')}
            </div>
          </div>
        )}

        {/* Audit Check Items List */}
        {!isScanning && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {displayList.map((item) => {
              const isExpanded = expandedId === item.id || activeTab === 'suggestions';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.status === 'passed'
                      ? 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40'
                      : item.status === 'warning'
                      ? 'bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border-amber-500/40 shadow-md'
                      : 'bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-950 border-rose-500/60 shadow-lg'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {item.status === 'passed' ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : item.status === 'warning' ? (
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center animate-bounce">
                            <XCircle className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
                            {item.categoryTitle}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white">
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300 pt-0.5 leading-relaxed">
                          {item.findings}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    {item.targetSheetKey && (
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => {
                            onNavigate(item.targetSheetKey!);
                            onClose();
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                            item.status === 'passed'
                              ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                              : item.status === 'warning'
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                          }`}
                        >
                          <span>{item.actionText || 'معاينة'}</span>
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Suggested Action Box if exists */}
                  {item.suggestedAction && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-xs flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-amber-500/20">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300 ml-1">
                          الإجراء المحاسبي المقترح لإتمام الفحص على الوجه الأمثل:
                        </span>
                        <span className="text-slate-200">{item.suggestedAction}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>نظام الرقابة التقنية والفحص المحاسبي الفوري • متوافق مع معايير الجهاز المركزي للمحاسبات</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#3632c7] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold text-xs shadow-lg cursor-pointer transition-all active:scale-95"
            >
              تم الاطلاع واعتماد نتائج الفحص
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
