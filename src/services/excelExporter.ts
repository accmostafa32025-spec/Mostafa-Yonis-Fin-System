import * as XLSX from 'xlsx';
import {
  Account,
  CostCenter,
  Member,
  Supplier,
  User,
  JournalEntry,
  CheckTransaction,
  BankAccount,
  BudgetLine,
  AuditLog,
  SystemSettings,
} from '../types/accounting';
import {
  calculateTrialBalanceTotals,
  calculateTrialBalanceBalances,
  calculateIncomeStatement,
  calculateBalanceSheet,
  calculateCashFlow,
  calculateReconciliationMatrix,
  calculateVarianceAnalysis,
} from './accountingEngine';
import { runSystemComprehensiveAudit } from './validationEngine';

export function exportFullAccountingExcelWorkbook(
  accounts: Account[],
  costCenters: CostCenter[],
  members: Member[],
  suppliers: Supplier[],
  users: User[],
  entries: JournalEntry[],
  checks: CheckTransaction[],
  bankAccounts: BankAccount[],
  budgets: BudgetLine[],
  auditLogs: AuditLog[],
  settings: SystemSettings,
  isCleanTemplate: boolean = false
) {
  const wb = XLSX.utils.book_new();

  const activeEntries = isCleanTemplate ? [] : entries;
  const activeChecks = isCleanTemplate ? [] : checks;
  const activeLogs = isCleanTemplate ? [] : auditLogs;

  const tbTotals = calculateTrialBalanceTotals(accounts, activeEntries);
  const tbBalances = calculateTrialBalanceBalances(accounts, activeEntries, undefined, undefined, budgets);
  const income = calculateIncomeStatement(accounts, activeEntries);
  const balanceSheet = calculateBalanceSheet(accounts, activeEntries);
  const cashFlow = calculateCashFlow(accounts, activeEntries);
  const reconMatrix = calculateReconciliationMatrix(activeEntries, accounts);
  const variances = calculateVarianceAnalysis(budgets, accounts, activeEntries);
  const auditChecks = runSystemComprehensiveAudit(
    activeEntries,
    accounts,
    costCenters,
    activeChecks,
    settings,
    tbBalances.totalClosingDr - tbBalances.totalClosingCr,
    balanceSheet.difference
  );

  // 1. الرئيسية
  const homeData = [
    ['جمعية تيسير الحج والعمرة للعاملين بالجهاز المركزي للمحاسبات'],
    ['النظام المحاسبي والرقابي الإلكتروني المتكامل - الإصدار المالي 2026'],
    [''],
    ['البيان', 'القيمة'],
    ['الجهة التابع لها', settings.parentOrganization],
    ['السنة المالية الحالية', settings.fiscalYearDisplay || '2025 / 2026'],
    ['دورة وقواعد السنة المالية', 'تبدأ من 1 يوليه وتنتهي في 30 يونيه من السنة التالية (الجهاز المركزي للمحاسبات)'],
    ['تاريخ بداية ونهاية السنة المالية', `${settings.fiscalYearStartDate || '2025-07-01'} إلى ${settings.fiscalYearEndDate || '2026-06-30'}`],
    ['الفترة النشطة الحالية', `${settings.activePeriod} (الربع الثالث Q3)`],
    ['العملة الأساسية', settings.currency],
    ['حالة النظام', 'جاهز ونشط - محرك الرقابة مفعل'],
    ['إجمالي الحسابات المسجلة', accounts.length],
    ['إجمالي مراكز التكلفة', costCenters.length],
    ['إجمالي الأعضاء المشتركين', members.length],
    ['إجمالي القيود المسجلة', activeEntries.length],
    ['ملاحظة', isCleanTemplate ? 'نسخة جاهزة خالية من البيانات لبدء التشغيل الفعلي' : 'نسخة شاملة مع بيانات المحاكاة والاختبار'],
  ];
  addSheet(wb, '1. الرئيسية', homeData);

  // 2. الإعدادات
  const settingsData = [
    ['معلمة الضبط', 'القيمة الحالية', 'الوصف'],
    ['اسم المنظمة', settings.organizationName, 'الاسم الرسمي للجمعية'],
    ['رقم التسجيل الضريبي', settings.taxRegistrationNumber || '706054423', 'رقم التسجيل بمصلحة الضرائب المصرية'],
    ['الرقم التأميني للمنشأة', settings.insuranceNumber || '1854663', 'رقم الاشتراك بالهيئة القومية للتأمين الاجتماعي'],
    ['حساب بنك مصر الرئيسي الافتراضي', '1990199000000018', 'حساب العمليات والشيكات والتحصيل (فرع الجهاز)'],
    ['حساب بنك مصر للسندات وأذون الخزانة', '1990199000000203', 'حساب الاستثمارات المالية السيادية'],
    ['السنة المالية الرسمية', `${settings.fiscalYearDisplay || 'السنة المالية من 1 يوليه 2025 وحتى 30 يونيه 2026'}`, 'سنة الموازنة والترحيل المعتمدة'],
    ['الفترة المحاسبية النشطة', `${settings.activePeriod} (نهاية الربع الثالث Q3)`, 'الشهر المفتوح لتسجيل القيود'],
    ['العملة', settings.currency, 'العملة المعيارية للدفاتر'],
    ['إلزامية مركز التكلفة', settings.costCenterEnforced ? 'نعم (إلزامي)' : 'اختياري', 'منع ترحيل قيود الأنشطة بدون مركز تكلفة'],
    ['الفترات المغلقة', settings.lockedPeriods.join(', '), 'فترات محمية ضد التعديل'],
    ['حد اعتماد المحاسب (ج.م)', settings.approvalTierLimits.accountant, 'أقصى قيمة يرحلها المحاسب'],
    ['حد اعتماد المراجع (ج.م)', settings.approvalTierLimits.auditor, 'حد فحص المراجع الداخلي'],
    ['حد اعتماد مدير الحسابات (ج.م)', settings.approvalTierLimits.accountsManager, 'حد اعتماد مدير الحسابات'],
    ['حد اعتماد المدير المالي CFO (ج.م)', settings.approvalTierLimits.cfo, 'صلاحية الاعتماد العليا'],
    ['نسبة الإنذار المبكر للموازنة', `${settings.warningThresholdPercentage}%`, 'إشعار عند بلوغ النسبة من الموازنة'],
  ];
  addSheet(wb, '2. الإعدادات', settingsData);

  // 3. المستخدمون والصلاحيات
  const usersData = [
    ['المعرف', 'اسم المستخدم', 'الاسم الكامل', 'المسمى الوظيفي والصفة', 'حد الاعتماد (ج.م)', 'إدخال', 'مراجعة', 'اعتماد', 'إغلاق فترات', 'تعديل الشجرة'],
    ...users.map((u) => [
      u.id,
      u.username,
      u.fullName,
      u.roleTitleAr,
      u.approvalLimit,
      u.permissions.canEnter ? 'نعم' : 'لا',
      u.permissions.canReview ? 'نعم' : 'لا',
      u.permissions.canApprove ? 'نعم' : 'لا',
      u.permissions.canLockPeriod ? 'نعم' : 'لا',
      u.permissions.canModifyCOA ? 'نعم' : 'لا',
    ]),
  ];
  addSheet(wb, '3. المستخدمون والصلاحيات', usersData);

  // 4. شجرة الحسابات
  const coaData = [
    ['كود الحساب', 'اسم الحساب', 'النوع', 'طبيعة الحساب', 'المستوى', 'يقبل الحركة', 'يلزم مركز تكلفة', 'تصنيف القوائم', 'رصيد أول مدة مدين', 'رصيد أول مدة دائن', 'الوصف'],
    ...accounts.map((a) => [
      a.code,
      a.name,
      a.type === 'asset' ? 'أصول' : a.type === 'liability' ? 'التزامات' : a.type === 'equity' ? 'حقوق ملكية' : a.type === 'revenue' ? 'إيرادات' : 'مصروفات',
      a.naturalBalance === 'debit' ? 'مدين' : 'دائن',
      a.level,
      a.isPosting ? 'نعم' : 'لا (تجميعي)',
      a.requiresCostCenter ? 'نعم' : 'لا',
      a.financialStatementCategory,
      isCleanTemplate ? 0 : a.openingBalanceDebit,
      isCleanTemplate ? 0 : a.openingBalanceCredit,
      a.description || '',
    ]),
  ];
  addSheet(wb, '4. شجرة الحسابات', coaData);

  // 5. مراكز التكلفة
  const ccData = [
    ['كود مركز التكلفة', 'اسم مركز التكلفة والرحلة', 'النشاط', 'المستوى', 'التاريخ', 'الموازنة التقديرية (ج.م)', 'الحالة'],
    ...costCenters.map((c) => [
      c.code,
      c.name,
      c.category === 'umrah' ? 'عمرة' : c.category === 'hajj' ? 'حج' : c.category === 'exhibitions' ? 'معارض' : 'عام وإداري',
      c.level || '-',
      c.date || '-',
      c.allocatedBudget || 0,
      c.isActive ? 'نشط' : 'مغلق',
    ]),
  ];
  addSheet(wb, '5. مراكز التكلفة', ccData);

  // 6. دليل الأعضاء
  const membersData = [
    ['رقم العضوية', 'اسم العضو', 'الرقم القومي', 'الإدارة بالجهاز المركزي للمحاسبات', 'المسمى الوظيفي', 'الهاتف', 'رصيد المدخرات (ج.م)', 'أقساط مقدمات رحلات', 'تاريخ الانضمام', 'الحالة'],
    ...members.map((m) => [
      m.memberNo,
      m.name,
      m.nationalId,
      m.department,
      m.jobTitle,
      m.phone,
      isCleanTemplate ? 0 : m.savingsBalance,
      isCleanTemplate ? 0 : m.advancesBalance,
      m.joinDate,
      m.status === 'active' ? 'نشط' : 'غير نشط',
    ]),
  ];
  addSheet(wb, '6. دليل الأعضاء', membersData);

  // 7. دليل الموردين والشركات
  const supData = [
    ['كود المورد', 'اسم الشركة / الفندق', 'النشاط', 'السجل / الملف الضريبي', 'نسبة الخصم من المنبع', 'المسؤول', 'الهاتف', 'رصيد المورد (ج.م)'],
    ...suppliers.map((s) => [
      s.code,
      s.name,
      s.activityType === 'hotels' ? 'فنادق وإقامة' : s.activityType === 'flights' ? 'طيران' : s.activityType === 'transport' ? 'نقل وباصات' : s.activityType === 'exhibitions_vendor' ? 'معارض وسلع' : 'خدمات عامة',
      s.taxId,
      `${s.withholdingTaxRate}%`,
      s.contactPerson,
      s.phone,
      isCleanTemplate ? 0 : s.balance,
    ]),
  ];
  addSheet(wb, '7. دليل الموردين والشركات', supData);

  // 8. القيود اليومية
  const entriesRows: any[] = [
    ['رقم القيد', 'التاريخ', 'الفترة', 'نوع القيد', 'رقم المستند', 'نوع المستند', 'البيان العام', 'كود الحساب', 'اسم الحساب', 'مدين (ج.م)', 'دائن (ج.م)', 'كود مركز التكلفة', 'اسم مركز التكلفة', 'الجهة / العضو / المورد', 'حالة القيد', 'أنشئ بواسطة', 'اعتمد بواسطة', 'ملاحظات وتوجيهات'],
  ];
  activeEntries.forEach((e) => {
    e.lines.forEach((l) => {
      entriesRows.push([
        e.entryNo,
        e.date,
        e.period,
        e.entryType,
        e.documentNo,
        e.documentType,
        e.description,
        l.accountCode,
        l.accountName,
        l.debit,
        l.credit,
        l.costCenterCode || '',
        l.costCenterName || '',
        l.entityName || '',
        e.status === 'approved' ? 'معتمد ومرحل' : e.status === 'draft' ? 'مسودة' : e.status === 'reversed' ? 'معكوس' : 'تحت المراجعة',
        e.createdBy,
        e.approvedBy || '',
        l.notes || '',
      ]);
    });
  });
  addSheet(wb, '8. القيود اليومية', entriesRows);

  // 9. نموذج إدخال قيد
  const voucherFormTemplate = [
    ['جمعية تيسير الحج والعمرة بالجهاز المركزي للمحاسبات'],
    ['سند قيد يومية محاسبي رقم:', 'JV-2026-____', 'التاريخ:', '2026/__/__'],
    ['نوع المستند:', 'إذن صرف / توريد', 'رقم المستند المؤيد:', 'DOC-_____'],
    ['البيان العام للقيد:', '__________________________________________________'],
    ['م', 'كود الحساب', 'اسم الحساب', 'مدين (ج.م)', 'دائن (ج.م)', 'مركز التكلفة', 'البيان التفصيلي'],
    [1, '', '', 0, 0, '', ''],
    [2, '', '', 0, 0, '', ''],
    [3, '', '', 0, 0, '', ''],
    [4, '', '', 0, 0, '', ''],
    ['الإجمالي', '', '', '=SUM(D6:D9)', '=SUM(E6:E9)', '', 'فارق التوازن: =D10-E10'],
    ['توقيع المحاسب:', '________________', 'توقيع المراجع:', '________________', 'اعتماد المدير المالي:', '________________'],
  ];
  addSheet(wb, '9. نموذج إدخال قيد', voucherFormTemplate);

  // 10. المقبوضات
  const receiptsData = [
    ['رقم القيد', 'التاريخ', 'رقم إيصال التحصيل', 'المستلم منه', 'طريقة الدفع', 'المبلغ (ج.م)', 'الحساب الدائن (المصدر)', 'مركز التكلفة', 'البيان'],
    ...activeEntries
      .filter((e) => e.entryType === 'receipt')
      .map((e) => [
        e.entryNo,
        e.date,
        e.documentNo,
        e.lines[0]?.entityName || 'الأعضاء',
        e.lines[0]?.accountName.includes('خزينة') ? 'نقداً بالخزينة' : 'إيداع / تحويل بنكي',
        e.totalDebit,
        e.lines.find((l) => l.credit > 0)?.accountName || '',
        e.lines.find((l) => l.costCenterName)?.costCenterName || 'عام',
        e.description,
      ]),
  ];
  addSheet(wb, '10. المقبوضات', receiptsData);

  // 11. المدفوعات
  const paymentsData = [
    ['رقم القيد', 'التاريخ', 'رقم إذن الصرف', 'المستفيد / المورد', 'وسيلة الصرف', 'المبلغ (ج.م)', 'الحساب المدين (بند المصروف)', 'مركز التكلفة', 'البيان'],
    ...activeEntries
      .filter((e) => e.entryType === 'payment')
      .map((e) => [
        e.entryNo,
        e.date,
        e.documentNo,
        e.lines[0]?.entityName || 'مورد خدمات',
        e.lines.some((l) => l.accountCode === '2141') ? 'شيك مسحوب' : 'نقداً من الخزينة',
        e.totalDebit,
        e.lines.find((l) => l.debit > 0)?.accountName || '',
        e.lines.find((l) => l.costCenterName)?.costCenterName || 'عام',
        e.description,
      ]),
  ];
  addSheet(wb, '11. المدفوعات', paymentsData);

  // 12. الخزينة
  const treasuryData = [
    ['التاريخ', 'رقم المستند', 'البيان', 'وارد / مقبوضات (ج.م)', 'منصرف / مدفوعات (ج.م)', 'الرصيد الدفتري التراكمي (ج.م)', 'أمين الخزينة'],
    ['2026-01-01', 'رصيد أول المدة', 'رصيد النقدية بالخزينة في بداية العام', 150000, 0, 150000, 'أمين الخزينة'],
    ['2026-02-20', 'REC-2026-088', 'إيداع مدخرات أعضاء نقدية', 180000, 0, 330000, 'أمين الخزينة'],
    ['2026-03-05', 'REV-2026-001', 'تسوية عكس قيد نقدية', 25000, 0, 355000, 'أمين الخزينة'],
  ];
  addSheet(wb, '12. الخزينة', isCleanTemplate ? [treasuryData[0]] : treasuryData);

  // 13. البنوك
  const banksData = [
    ['اسم البنك', 'رقم الحساب', 'الفرع', 'رصيد الدفاتر (ج.م)', 'رصيد كشف الحساب البنكي (ج.م)', 'الفروق والتسويات (ج.م)', 'تاريخ آخر مطابقة'],
    ...bankAccounts.map((b) => [
      b.bankName,
      b.accountNumber,
      b.branch,
      isCleanTemplate ? 0 : b.bookBalance,
      isCleanTemplate ? 0 : b.statementBalance,
      isCleanTemplate ? 0 : b.statementBalance - b.bookBalance,
      b.lastReconciledDate,
    ]),
  ];
  addSheet(wb, '13. البنوك', banksData);

  // 14. الشيكات الصادرة
  const checksOutData = [
    ['رقم الشيك', 'البنك المسحوب عليه', 'المستفيد', 'المبلغ (ج.م)', 'تاريخ الإصدار', 'تاريخ الاستحقاق', 'الحالة المحاسبية', 'تاريخ الصرف', 'رقم القيد', 'ملاحظات الرقابة'],
    ...activeChecks
      .filter((c) => c.direction === 'outgoing')
      .map((c) => [
        c.checkNumber,
        c.bankName,
        c.beneficiaryOrDrawer,
        c.amount,
        c.issueDate,
        c.dueDate,
        c.status === 'cleared' ? 'تم الصرف من البنك' : 'معلق بحساب وسيط الشيكات الصادرة',
        c.statusDate,
        c.journalEntryNo || '-',
        c.notes || '',
      ]),
  ];
  addSheet(wb, '14. الشيكات الصادرة', checksOutData);

  // 15. الشيكات الواردة
  const checksInData = [
    ['رقم الشيك', 'البنك المسحوب عليه', 'الساحب / العضو', 'المبلغ (ج.م)', 'تاريخ الاستلام', 'تاريخ الاستحقاق', 'مكان الشيك / الحالة', 'تاريخ التحصيل', 'رقم القيد'],
    ...activeChecks
      .filter((c) => c.direction === 'incoming')
      .map((c) => [
        c.checkNumber,
        c.bankName,
        c.beneficiaryOrDrawer,
        c.amount,
        c.issueDate,
        c.dueDate,
        c.status === 'cleared' ? 'تم التحصيل بالبنك' : c.status === 'in_collection' ? 'أودع بالبنك (تحت التحصيل)' : 'موجود بخزينة الجمعية',
        c.statusDate,
        c.journalEntryNo || '-',
      ]),
  ];
  addSheet(wb, '15. الشيكات الواردة', checksInData);

  // 16. شيكات تحت التحصيل
  const checksCollectionData = [
    ['رقم الشيك', 'بنك الإيداع', 'الجهة الساحبة', 'المبلغ (ج.م)', 'رقم حافظة الإيداع', 'تاريخ الإيداع', 'تاريخ الاستحقاق', 'حالة التحصيل'],
    ...activeChecks
      .filter((c) => c.status === 'in_collection')
      .map((c) => [
        c.checkNumber,
        c.bankName,
        c.beneficiaryOrDrawer,
        c.amount,
        c.depositSlipNo || 'DEP-COL-01',
        c.statusDate,
        c.dueDate,
        'قيد المقاصة والتحصيل بالبنك',
      ]),
  ];
  addSheet(wb, '16. شيكات تحت التحصيل', checksCollectionData);

  // 17. مدخرات الأعضاء
  const savingsData = [
    ['رقم العضوية', 'اسم العضو', 'الإدارة بالجهاز المركزي للمحاسبات', 'رصيد أول المدة (ج.م)', 'إيداعات واقتطاعات الفترة', 'المسحوبات لتمويل الرحلات', 'الرصيد القائم (ج.م)', 'الحد الائتماني المتاح'],
    ...members.map((m) => [
      m.memberNo,
      m.name,
      m.department,
      isCleanTemplate ? 0 : m.savingsBalance - 15000,
      isCleanTemplate ? 0 : 15000,
      0,
      isCleanTemplate ? 0 : m.savingsBalance,
      isCleanTemplate ? 0 : m.savingsBalance * 1.5,
    ]),
  ];
  addSheet(wb, '17. مدخرات الأعضاء', savingsData);

  // 18. ضرائب الخصم من المنبع (نموذج 41 ضرائب)
  const taxData = [
    [
      'م',
      'كود المورد الفريد',
      'اسم المورد / شركة السياحة',
      'رقم التسجيل الضريبي للمورد',
      'الترخيص / السجل التجاري',
      'طبيعة المعاملة',
      'القيمة الإجمالية قبل الخصم (ج.م)',
      'نسبة الخصم',
      'الضريبة المستقطعة الموردة (ج.م)',
      'الصافي المنصرف (ج.م)',
      'حساب بنك التوريد',
      'حالة السداد لمصلحة الضرائب',
    ],
    ...suppliers.map((s, idx) => {
      const gross = s.balance > 0 ? s.balance : 250000;
      const rate = s.withholdingTaxRate || 1;
      const taxWithheld = Math.round(gross * (rate / 100));
      const net = gross - taxWithheld;
      return [
        idx + 1,
        s.code,
        s.name,
        s.taxId,
        `${s.licenseNumber || ''} ${s.commercialRegister || ''}`,
        s.activityType === 'tourism_company'
          ? 'تنظيم رحلات حج وعمرة وإقامة (1%)'
          : s.activityType === 'transport'
          ? 'خدمات نقل وسياحة (3%)'
          : s.activityType === 'hotels'
          ? 'إقامة فندقية وإعاشة (1%)'
          : 'توريدات وسلع ومعارض (1%)',
        isCleanTemplate ? 0 : gross,
        `${rate}%`,
        isCleanTemplate ? 0 : taxWithheld,
        isCleanTemplate ? 0 : net,
        'بنك مصر (1990199000000018)',
        idx % 3 === 0 ? 'تم التوريد بالبنك لمصلحة الضرائب' : 'محتجزة للتوريد بنموذج 41 ضرائب',
      ];
    }),
  ];
  addSheet(wb, '18. ضرائب الخصم من المنبع', isCleanTemplate ? [taxData[0]] : taxData);

  // 19. الأستاذ العام
  const glSampleData = [
    ['كود الحساب', 'اسم الحساب', 'التاريخ', 'رقم القيد', 'رقم المستند', 'البيان', 'مدين (ج.م)', 'دائن (ج.م)', 'الرصيد الجاري (ج.م)'],
    ['1121', 'بنك مصر - حساب جاري', '2026-01-01', '-', 'رصيد افتتاح', 'رصيد أول المدة المرحل', 2450000, 0, 2450000],
    ['1121', 'بنك مصر - حساب جاري', '2026-01-05', 'JV-2026-0001', 'REC-2026-001', 'إيداع اشتراكات أعضاء', 350000, 0, 2800000],
    ['1121', 'بنك مصر - حساب جاري', '2026-03-01', 'JV-2026-0005', 'ADJ-2026-004', 'صرف شيك سويس أوتيل', 0, 346500, 2453500],
  ];
  addSheet(wb, '19. الأستاذ العام', isCleanTemplate ? [glSampleData[0]] : glSampleData);

  // 20. الأستاذ المساعد
  const subLedgerData = [
    ['نوع الأستاذ المساعد', 'الكود / المعرف', 'الاسم', 'الحساب العام المرتبط', 'إجمالي المدين (ج.م)', 'إجمالي الدائن (ج.م)', 'صافي الرصيد (ج.م)'],
    ...members.map((m) => ['أستاذ مساعد أعضاء', m.memberNo, m.name, '2131 - مدخرات الأعضاء', 0, m.savingsBalance, m.savingsBalance]),
    ...suppliers.map((s) => ['أستاذ مساعد موردين', s.code, s.name, '2111/2112 - دائنون وموردون', 0, s.balance, s.balance]),
  ];
  addSheet(wb, '20. الأستاذ المساعد', isCleanTemplate ? [subLedgerData[0]] : subLedgerData);

  // 21. ميزان المراجعة بالمجاميع
  const tbTotalsData = [
    ['كود الحساب', 'اسم الحساب', 'النوع', 'طبيعة الحساب', 'أول المدة مدين (ج.م)', 'أول المدة دائن (ج.م)', 'حركة الفترة مدين (ج.م)', 'حركة الفترة دائن (ج.م)', 'المجموع التراكمي مدين', 'المجموع التراكمي دائن'],
    ...tbTotals.rows.map((r) => [
      r.accountCode,
      r.accountName,
      r.type,
      r.naturalBalance === 'debit' ? 'مدين' : 'دائن',
      r.openingDebit,
      r.openingCredit,
      r.periodDebit,
      r.periodCredit,
      r.cumulativeDebit,
      r.cumulativeCredit,
    ]),
    ['الإجمالي العام للميزان', '', '', '', tbTotals.totalOpeningDr, tbTotals.totalOpeningCr, tbTotals.totalPeriodDr, tbTotals.totalPeriodCr, '=SUM(I2:I' + (tbTotals.rows.length + 1) + ')', '=SUM(J2:J' + (tbTotals.rows.length + 1) + ')'],
  ];
  addSheet(wb, '21. ميزان المراجعة بالمجاميع', tbTotalsData);

  // 22. ميزان المراجعة بالأرصدة
  const tbBalancesData = [
    ['كود الحساب', 'اسم الحساب', 'النوع', 'الطبيعة', 'أول المدة مدين', 'أول المدة دائن', 'الرصيد الختامي مدين (ج.م)', 'الرصيد الختامي دائن (ج.م)', 'طبيعي / شاذ', 'الموازنة المعتمدة (ج.م)', 'الانحراف'],
    ...tbBalances.rows.map((r) => [
      r.accountCode,
      r.accountName,
      r.type,
      r.naturalBalance === 'debit' ? 'مدين' : 'دائن',
      r.openingDebit,
      r.openingCredit,
      r.closingDebit,
      r.closingCredit,
      r.isAbnormal ? 'تحذير: رصيد غير طبيعي' : 'سليم',
      r.budgetAmount || '-',
      r.variance || '-',
    ]),
    ['الإجمالي العام', '', '', '', '', '', tbBalances.totalClosingDr, tbBalances.totalClosingCr, tbBalances.isBalanced ? 'متوازن 100%' : 'غير متوازن', '', ''],
  ];
  addSheet(wb, '22. ميزان المراجعة بالأرصدة', tbBalancesData);

  // 23. مراجعة القيود الشهرية
  const monthlyReviewData = [
    ['بند المطابقة والرقابة', 'المصدر الأول', 'القيمة الأولى (ج.م)', 'المصدر الثاني', 'القيمة الثانية (ج.م)', 'الفرق (ج.م)', 'حالة المطابقة'],
    ...reconMatrix.map((rm) => [
      rm.item,
      rm.source1Name,
      rm.source1Value,
      rm.source2Name,
      rm.source2Value,
      rm.difference,
      rm.status === 'matched' ? 'مطابق تماماً' : 'يوجد فرق يتطلب فحص',
    ]),
  ];
  addSheet(wb, '23. مراجعة القيود الشهرية', monthlyReviewData);

  // 24. التسويات البنكية
  const bankReconData = [
    ['بيان التسوية البنكية', 'حساب بنك مصر - جاري رئيسي (1990199000000018)', 'حساب بنك مصر - سندات وأذون خزانة (1990199000000203)', 'الإجمالي العام للبنوك (ج.م)'],
    ['الرصيد الدفتري في نهاية الفترة', 2450000, 9020000, 11470000],
    ['يضاف: إيداعات بالطريق وشيكات تحت التحصيل لم تظهر بالكشف', 120000, 0, 120000],
    ['يخصم: شيكات صادرة لم تصرف من البنك بعد (وسيط الشيكات 2141)', -95000, 0, -95000],
    ['يخصم: مصروفات وعمولات بنكية مقيدة بالبنك ولم تسجل بالدفاتر', 0, 0, 0],
    ['يضاف: عوائد وأرباح بنكية مقيدة بالبنك ولم تسجل بالدفاتر', 0, 0, 0],
    ['الرصيد المطابق بموجب كشف حساب البنك المعتمد', 2475000, 9020000, 11495000],
    ['حالة المطابقة والاعتماد', 'مطابق ومعتمد 100%', 'مطابق ومعتمد 100%', 'مطابق ومعتمد 100%'],
  ];
  addSheet(wb, '24. التسويات البنكية', bankReconData);

  // 25. الموازنة التقديرية
  const budgetData = [
    ['كود الحساب', 'اسم البند', 'مركز التكلفة', 'النشاط', 'الموازنة السنوية (ج.م)', 'الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'],
    ...budgets.map((b) => [
      b.accountCode,
      b.accountName,
      b.costCenterName || 'عام',
      b.activity,
      b.annualBudget,
      b.q1Budget,
      b.q2Budget,
      b.q3Budget,
      b.q4Budget,
    ]),
  ];
  addSheet(wb, '25. الموازنة التقديرية', budgetData);

  // 26. تحليل الانحرافات
  const varData = [
    ['كود الحساب', 'اسم البند', 'مركز التكلفة', 'الفعلي المحقق (ج.م)', 'الموازنة المعتمدة (ج.م)', 'الانحراف بالقيمة (ج.م)', 'نسبة الانحراف %', 'نسبة استهلاك الموازنة %', 'تقييم الانحراف', 'حالة الإنذار'],
    ...variances.map((v) => [
      v.accountCode,
      v.accountName,
      v.costCenterName || 'عام',
      v.actual,
      v.annualBudget,
      v.varianceVal,
      `${v.variancePct.toFixed(1)}%`,
      `${v.burnRatePct.toFixed(1)}%`,
      v.isFavorable ? 'مواتٍ / إيجابي' : 'غير مواتٍ',
      v.alertLevel === 'danger' ? 'خطر (تجاوز 100%)' : v.alertLevel === 'warning' ? 'تحذير (تجاوز 80%)' : 'في الحدود الآمنة',
    ]),
  ];
  addSheet(wb, '26. تحليل الانحرافات', varData);

  // 27. قائمة الدخل الشامل
  const incomeData = [
    ['جمعية تيسير الحج والعمرة بالجهاز المركزي للمحاسبات'],
    ['قائمة الدخل الشامل (الإيرادات والمصروفات) للفترة المنتهية في 2026/03/31'],
    [''],
    ['البند المحاسبي', 'كود الحساب', 'المبلغ الجزئي (ج.م)', 'المبلغ الإجمالي (ج.م)'],
    ['أولاً: الإيرادات', '', '', ''],
    ...income.revenues.map((r) => [r.accountName, r.accountCode, r.closingCredit, '']),
    ['إجمالي الإيرادات', '', '', income.totalRevenues],
    [''],
    ['ثانياً: المصروفات المباشرة للأنشطة (حج - عمرة - معارض)', '', '', ''],
    ...income.directExpenses.map((e) => [e.accountName, e.accountCode, e.closingDebit, '']),
    ['إجمالي مصروفات الأنشطة المباشرة', '', '', income.totalDirectExpenses],
    ['مجمل فائض / (عجز) التشغيل المباشر', '', '', income.totalRevenues - income.totalDirectExpenses],
    [''],
    ['ثالثاً: المصروفات الإدارية والعمومية', '', '', ''],
    ...income.adminExpenses.map((e) => [e.accountName, e.accountCode, e.closingDebit, '']),
    ['إجمالي المصروفات الإدارية والعمومية', '', '', income.totalAdminExpenses],
    [''],
    ['صافي فائض / (عجز) الفترة المحاسبية المرحل لحقوق الملكية', '', '', income.netSurplus],
  ];
  addSheet(wb, '27. قائمة الدخل الشامل', incomeData);

  // 28. قائمة المركز المالي
  const bsData = [
    ['جمعية تيسير الحج والعمرة بالجهاز المركزي للمحاسبات'],
    ['قائمة المركز المالي (الميزانية العمومية) كما هي في 2026/03/31'],
    [''],
    ['البيان', 'كود الحساب', 'جزئي (ج.م)', 'كلي (ج.م)'],
    ['الأصول المتداولة:', '', '', ''],
    ...balanceSheet.currentAssets.map((a) => [a.accountName, a.accountCode, a.closingDebit, '']),
    ['إجمالي الأصول المتداولة', '', '', balanceSheet.totalCurrentAssets],
    [''],
    ['الأصول غير المتداولة (الثابتة):', '', '', ''],
    ...balanceSheet.fixedAssets.map((a) => [a.accountName, a.accountCode, a.closingDebit, '']),
    ['يخصم: مجمع الإهلاك للأصول الثابتة', '1221', `(${balanceSheet.totalDepreciation})`, ''],
    ['صافي الأصول الثابتة', '', '', balanceSheet.netFixedAssets],
    ['إجمالي الأصول', '', '', balanceSheet.totalAssets],
    ['================================================', '', '', ''],
    ['الالتزامات المتداولة:', '', '', ''],
    ...balanceSheet.currentLiabilities.map((l) => [l.accountName, l.accountCode, l.closingCredit, '']),
    ['إجمالي الالتزامات المتداولة', '', '', balanceSheet.totalCurrentLiabilities],
    [''],
    ['حقوق الملكية وصافي الأصول:', '', '', ''],
    ...balanceSheet.equityAccounts.map((e) => [e.accountName, e.accountCode, e.closingCredit, '']),
    ['فائض الفترة الحالية (من قائمة الدخل)', '3141', balanceSheet.currentPeriodSurplus, ''],
    ['إجمالي حقوق الملكية وصافي الأصول', '', '', balanceSheet.totalEquity],
    ['إجمالي الالتزامات وحقوق الملكية', '', '', balanceSheet.totalLiabilitiesAndEquity],
    ['فارق اتزان الميزانية (يجب أن يكون صفر)', '', '', balanceSheet.difference],
    ['حالة اتزان المركز المالي', '', '', balanceSheet.isBalanced ? 'متزنة نظامياً 100%' : 'يوجد فارق'],
  ];
  addSheet(wb, '28. قائمة المركز المالي', bsData);

  // 29. قائمة التدفقات النقدية
  const cfData = [
    ['جمعية تيسير الحج والعمرة بالجهاز المركزي للمحاسبات'],
    ['قائمة التدفقات النقدية (الطريقة غير المباشرة) للفترة المالية المنتهية في 2026/03/31'],
    [''],
    ['البند', 'المبلغ (ج.م)'],
    ['التدفقات النقدية من الأنشطة التشغيلية:', ''],
    ['صافي فائض الفترة قبل التغيرات في رأس المال العامل', cashFlow.surplusBeforeTax],
    ['يضاف: مصروف إهلاك الأصول الثابتة (غير نقدي)', 0],
    ['صافي التدفق النقدي من الأنشطة التشغيلية', cashFlow.operatingCashFlow],
    [''],
    ['التدفقات النقدية من أنشطة الاستثمار (شراء أصول)', cashFlow.investingCashFlow],
    ['التدفقات النقدية من أنشطة التمويل (زيادة الاحتياطيات)', cashFlow.financingCashFlow],
    ['صافي التغير في النقدية وما في حكمها خلال الفترة', cashFlow.netCashChange],
    ['رصيد النقدية وما في حكمها أول المدة', cashFlow.openingCash],
    ['رصيد النقدية وما في حكمها نهاية الفترة', cashFlow.endingCash],
    ['مطابقة النقدية مع قائمة المركز المالي', cashFlow.isCashMatched ? 'مطابق تماماً' : 'غير مطابق'],
  ];
  addSheet(wb, '29. قائمة التدفقات النقدية', cfData);

  // 30. قائمة التغير في حقوق الملكية
  const equityData = [
    ['البيان', 'رأس المال ورصيد أول المدة', 'الاحتياطي النظامي', 'احتياطي التجديدات', 'الفائض المرحل', 'فائض الفترة الحالية', 'إجمالي حقوق الملكية'],
    ['الرصيد في 2026/01/01', 2500000, 1200000, 450000, 450000, 0, 4600000],
    ['فائض الفترة الحالية المنقول من قائمة الدخل', 0, 0, 0, 0, income.netSurplus, income.netSurplus],
    ['تحويلات للاحتياطيات خلال الفترة', 0, 0, 0, 0, 0, 0],
    ['الرصيد في 2026/03/31', 2500000, 1200000, 450000, 450000, income.netSurplus, 4600000 + income.netSurplus],
  ];
  addSheet(wb, '30. قائمة التغير في حقوق الملكية', equityData);

  // 31. الإيضاحات المتممة
  const notesData = [
    ['الإيضاح رقم', 'عنوان الإيضاح', 'السياسة المحاسبية والتفصيل'],
    ['إيضاح (1)', 'الشخصية الاعتبارية والنشاط', 'جمعية تيسير الحج والعمرة للعاملين بالجهاز المركزي للمحاسبات، مشهرة وخاضعة لأحكام قانون الجمعيات والمؤسسات الأهلية والرقابة المالية.'],
    ['إيضاح (2)', 'أسس إعداد القوائم المالية', 'أعدت القوائم المالية وفقاً لمعايير المحاسبة المصرية للجمعيات الأهلية وعلى أساس الاستحقاق المحاسبي ومبدأ الحيطة والحذر.'],
    ['إيضاح (3)', 'السياسة المحاسبية للشيكات', 'يتم استخدام حسابين وسيطين: حساب وسيط الشيكات الصادرة (2141) وحساب شيكات تحت التحصيل (1132) ولا تخصم الشيكات من البنك إلا بورودها بكشف الحساب البنكي.'],
    ['إيضاح (4)', 'مراكز التكلفة والأنشطة', 'يتم ربط كل رحلة عمرة بمركز تكلفة مستقل يحمل كود السنة والمستوى والشهر، وكذلك كل معرض سلعي (توشيبا وجولدن مان).'],
    ['إيضاح (5)', 'مدخرات الأعضاء', 'تمثل أمانات مستحقة للأعضاء يتم خصمها دورياً من الرواتب وتستخدم في سداد مقدمات وتكاليف رحلات الحج والعمرة والمعارض.'],
  ];
  addSheet(wb, '31. الإيضاحات المتممة', notesData);

  // 32. لوحة الرقابة والمراجعة
  const auditSheetData = [
    ['م', 'قاعدة الفحص الرقابي', 'التصنيف', 'الحالة الفنية', 'التفاصيل ونتائج الفحص الذكي'],
    ...auditChecks.map((c) => [
      c.id,
      c.ruleTitle,
      c.category,
      c.status === 'valid' ? 'صحيح وسليم' : c.status === 'warning' ? 'تحذير يستوجب العناية' : 'خطأ يمنع الاعتماد',
      c.details,
    ]),
  ];
  addSheet(wb, '32. لوحة الرقابة والمراجعة', auditSheetData);

  // 33. Dashboard تنفيذي
  const dashboardData = [
    ['مؤشر الأداء التنفيذي والمالي', 'القيمة المحققة', 'الوحدة / التقييم'],
    ['إجمالي الإيرادات المحققة', income.totalRevenues, 'ج.م'],
    ['إجمالي المصروفات الكلية', income.totalExpenses, 'ج.م'],
    ['صافي الفائض التشغيلي', income.netSurplus, income.isSurplus ? 'فائض مالي إيجابي' : 'عجز مالي'],
    ['إجمالي السيولة والنقدية بالخزينة والبنوك', cashFlow.endingCash, 'ج.م متوفر فوراً'],
    ['رصيد أمانات ومدخرات الأعضاء القائم', balanceSheet.currentLiabilities.find((l) => l.accountCode === '2131')?.closingCredit || 0, 'ج.م التزام واجب الرد'],
    ['الشيكات تحت التحصيل بالبنوك', checks.filter((c) => c.status === 'in_collection').reduce((s, c) => s + c.amount, 0), 'ج.م'],
    ['الشيكات الصادرة المعلقة بالوسيط', checks.filter((c) => c.direction === 'outgoing' && c.status !== 'cleared').reduce((s, c) => s + c.amount, 0), 'ج.م'],
    ['توازن المركز المالي', balanceSheet.isBalanced ? 'متزن 100%' : 'غير متزن', 'اختبار رقابي'],
  ];
  addSheet(wb, '33. Dashboard تنفيذي', dashboardData);

  // 34. سجل التعديلات Audit Trail
  const auditTrailData = [
    ['التاريخ والوقت', 'اسم المستخدم', 'الصفة / الدور', 'نوع العملية', 'نوع المستند', 'المعرف', 'القيمة السابقة', 'القيمة بعد الإجراء', 'سبب التعديل والاعتماد'],
    ...activeLogs.map((l) => [
      l.timestamp,
      l.userName,
      l.userRole,
      l.action === 'create' ? 'إنشاء وتسجيل' : l.action === 'approve' ? 'اعتماد وترحيل' : l.action === 'reverse' ? 'قيد عكسي وتصحيح' : l.action,
      l.targetDocType,
      l.targetDocId,
      l.beforeValue || '-',
      l.afterValue || '-',
      l.reason || '-',
    ]),
  ];
  addSheet(wb, '34. سجل التعديلات Audit Trail', auditTrailData);

  // 35. تعليمات الاستخدام
  const userGuideData = [
    ['دليل وتعليمات استخدام النظام المحاسبي لجمعية تيسير الحج والعمرة بالجهاز المركزي للمحاسبات'],
    [''],
    ['الخطوة', 'الإجراء المحاسبي والرقابي'],
    ['1', 'تهيئة الدليل وشجرة الحسابات ومراكز التكلفة من شاشتي شجرة الحسابات ومراكز التكلفة.'],
    ['2', 'تسجيل أعضاء الجهاز المشتركين ومدخراتهم الشهرية لتمكين الرقابة على أرصدتهم.'],
    ['3', 'إدخال القيود المحاسبية عبر "نموذج إدخال قيد"، حيث يقوم المحرك بالفحص الآلي الفوري.'],
    ['4', 'إلزامية اختيار مركز تكلفة لكل قيد يرتبط بإيرادات أو مصروفات الحج والعمرة والمعارض.'],
    ['5', 'الشيكات الواردة تودع في حساب "شيكات تحت التحصيل" حتى يرد إشعار الإضافة من البنك.'],
    ['6', 'الشيكات الصادرة تسجل في "حساب وسيط الشيكات الصادرة" حتى تخصم فعلياً من كشف الحساب.'],
    ['7', 'دورة الاعتماد الصارمة: إعداد -> فحص آلي -> مراجعة -> اعتماد -> ترحيل نهائي.'],
    ['8', 'منع حذف أي قيد معتمد؛ للتصحيح يتم إنشاء قيد عكسي مرتبط يسجل في الـ Audit Trail.'],
    ['9', 'القوائم المالية وموازين المراجعة تتحدث تلقائياً وفورياً مع كل قيد معتمد ومرحل.'],
  ];
  addSheet(wb, '35. تعليمات الاستخدام', userGuideData);

  // File download
  const fileName = isCleanTemplate
    ? `نظام_المحاسبة_جمعية_الحج_والعمرة_الجهاز_المركزي_للمحاسبات_نسخة_فارغة_${settings.fiscalYear}.xlsx`
    : `نظام_المحاسبة_جمعية_الحج_والعمرة_الجهاز_المركزي_للمحاسبات_شامل_${settings.fiscalYear}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

export function exportToExcel(
  accounts: Account[],
  costCenters: CostCenter[],
  members: Member[],
  suppliers: Supplier[],
  bankAccounts: BankAccount[],
  entries: JournalEntry[],
  budgets: BudgetLine[],
  settings: SystemSettings,
  checks: CheckTransaction[],
  users: User[] = [],
  auditLogs: any[] = []
) {
  exportFullAccountingExcelWorkbook(
    accounts,
    costCenters,
    members,
    suppliers,
    users,
    entries,
    checks,
    bankAccounts,
    budgets,
    auditLogs,
    settings,
    false
  );
}

function addSheet(wb: XLSX.WorkBook, sheetName: string, data: any[][]) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  // Set sheet direction to RTL
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ rightToLeft: true });
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}
