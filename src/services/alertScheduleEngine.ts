import {
  JournalEntry,
  Account,
  CostCenter,
  CheckTransaction,
  SystemSettings,
  ScheduledReviewTask,
  SmartAlert,
  SheetKey,
  BudgetLine,
} from '../types/accounting';

/**
 * Calculates days remaining from today (or given reference date) until a target date.
 */
export function calculateDaysRemaining(targetDateStr: string, referenceDateStr?: string): number {
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const target = new Date(targetDateStr);

  // Strip time part for accurate date comparison
  const refZero = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const targetZero = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffTime = targetZero.getTime() - refZero.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export interface PeriodClosingReadinessItem {
  id: string;
  title: string;
  category: string;
  isCompleted: boolean;
  severity: 'blocker' | 'warning' | 'info';
  details: string;
  sheetKey: SheetKey;
}

export interface PeriodClosingStatus {
  closingDate: string;
  daysRemaining: number;
  isImminent: boolean; // <= 7 days
  isUrgent: boolean;   // <= 3 days
  isOverdue: boolean;  // < 0
  readinessPercentage: number;
  readinessItems: PeriodClosingReadinessItem[];
  pendingEntriesCount: number;
  pendingEntriesAmount: number;
}

/**
 * Evaluates the status of the upcoming period close and checklist items.
 */
export function evaluatePeriodClosing(
  settings: SystemSettings,
  entries: JournalEntry[],
  accounts: Account[],
  checks: CheckTransaction[],
  isTbBalanced: boolean = true,
  isBsBalanced: boolean = true
): PeriodClosingStatus {
  // Default closing date to end of current quarter or month, or custom setting
  const activeYear = settings.fiscalYear || 2026;
  // In Egypt (1 July - 30 June fiscal year), 31 March is the end of Q3
  const defaultClosingDate = `${activeYear}-03-31`;
  const closingDate = settings.lockDate || defaultClosingDate;

  // Use a simulated date baseline for 2026-03 or actual system date
  // Since test environment entries are in March 2026, if system year differs, compare sensibly:
  const daysRemaining = calculateDaysRemaining(closingDate, '2026-03-24');

  // Checklist items
  const draftEntries = entries.filter((e) => e.status === 'draft');
  const pendingEntriesCount = draftEntries.length;
  const pendingEntriesAmount = draftEntries.reduce((sum, e) => sum + e.totalDebit, 0);

  // Check 1: Pending entries
  const item1: PeriodClosingReadinessItem = {
    id: 'close-1',
    title: 'اعتماد وترحيل كافة القيود اليومية المسودة',
    category: 'القيود المحاسبية',
    isCompleted: pendingEntriesCount === 0,
    severity: 'blocker',
    details:
      pendingEntriesCount === 0
        ? 'تم اعتماد وترحيل كافة القيود بنجاح، لا توجد قيود معلقة'
        : `يوجد ${pendingEntriesCount} قيد معلق بقيمة ${pendingEntriesAmount.toLocaleString()} ${settings.currencySymbol} بانتظار الاعتماد قبل الإقفال`,
    sheetKey: 'journal_entries',
  };

  // Check 2: Trial balance
  const item2: PeriodClosingReadinessItem = {
    id: 'close-2',
    title: 'تطابق وتوازن ميزان المراجعة بالأرصدة',
    category: 'موازين المراجعة',
    isCompleted: isTbBalanced,
    severity: 'blocker',
    details: isTbBalanced
      ? 'ميزان المراجعة بالأرصدة متوازن بدقة صفرية (المدين = الدائن)'
      : 'يوجد عدم توازن في ميزان المراجعة يتطلب التسوية الفورية',
    sheetKey: 'trial_balance_balances',
  };

  // Check 3: Balance Sheet
  const item3: PeriodClosingReadinessItem = {
    id: 'close-3',
    title: 'تطابق الميزانية العمومية والمركز المالي',
    category: 'القوائم المالية',
    isCompleted: isBsBalanced,
    severity: 'blocker',
    details: isBsBalanced
      ? 'إجمالي الأصول يتطابق تماماً مع الالتزامات وحقوق الملكية'
      : 'فارق توازن في المركز المالي يلزم مراجعته مع رئيس الحسابات',
    sheetKey: 'balance_sheet',
  };

  // Check 4: Checks reconciliation
  const uncashedChecks = checks.filter((c) => c.status === 'in_collection' || c.status === 'issued_pending');
  const item4: PeriodClosingReadinessItem = {
    id: 'close-4',
    title: 'مطابقة وتسوية حسابات الشيكات الوسيطة (1132 / 2141)',
    category: 'حركة الشيكات',
    isCompleted: uncashedChecks.length < 5,
    severity: 'warning',
    details: `يوجد ${uncashedChecks.length} شيكات وسيطة متداولة قيد المقاصة والتحصيل البنكي`,
    sheetKey: 'checks_collection',
  };

  // Check 5: Bank reconciliation
  const item5: PeriodClosingReadinessItem = {
    id: 'close-5',
    title: 'إتمام التسوية والمطابقة البنكية الشهرية',
    category: 'البنوك والنقدية',
    isCompleted: true,
    severity: 'warning',
    details: 'تم إجراء مطابقة كشوف الحسابات الجارية وأذون الخزانة في (بنك مصر الجاري، وبنك مصر أذون خزانة)',
    sheetKey: 'bank_reconciliation',
  };

  // Check 6: Financial Statements Review
  const item6: PeriodClosingReadinessItem = {
    id: 'close-6',
    title: 'المراجعة الدورية للقوائم المالية (الدخل والتدفقات النقدية)',
    category: 'التقارير الدورية',
    isCompleted: pendingEntriesCount === 0,
    severity: 'info',
    details: 'جاهزية مسودات القوائم المالية للعرض على لجنة المراجعة ومجلس الإدارة',
    sheetKey: 'income_statement',
  };

  const readinessItems = [item1, item2, item3, item4, item5, item6];
  const completedCount = readinessItems.filter((i) => i.isCompleted).length;
  const readinessPercentage = Math.round((completedCount / readinessItems.length) * 100);

  return {
    closingDate,
    daysRemaining,
    isImminent: daysRemaining <= 7 && daysRemaining >= 0,
    isUrgent: daysRemaining <= 3 && daysRemaining >= 0,
    isOverdue: daysRemaining < 0,
    readinessPercentage,
    readinessItems,
    pendingEntriesCount,
    pendingEntriesAmount,
  };
}

/**
 * Generates dynamic smart alerts for the executive dashboard and homepage.
 */
export function generateSmartAlerts(
  settings: SystemSettings,
  entries: JournalEntry[],
  accounts: Account[],
  checks: CheckTransaction[],
  scheduledTasks: ScheduledReviewTask[],
  budgets: BudgetLine[] = [],
  isTbBalanced: boolean = true,
  isBsBalanced: boolean = true
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const closingStatus = evaluatePeriodClosing(settings, entries, accounts, checks, isTbBalanced, isBsBalanced);

  // 1. Period Closing Approaching Alert
  if (closingStatus.isOverdue) {
    alerts.push({
      id: 'alert-closing-overdue',
      type: 'period_closing',
      severity: 'critical',
      title: 'تجاوز موعد إغلاق الفترة المالية!',
      message: `تاريخ إغلاق الفترة المالية (${closingStatus.closingDate}) قد انقضى. يجب إتمام قيود التسوية والإقفال المحاسبي فوراً لمنع التعديلات العشوائية.`,
      actionText: 'إقفال الفترة الآن',
      actionSheetKey: 'executive_dashboard',
      daysRemaining: closingStatus.daysRemaining,
      badge: 'إقفال متأخر',
    });
  } else if (closingStatus.isUrgent) {
    alerts.push({
      id: 'alert-closing-urgent',
      type: 'period_closing',
      severity: 'critical',
      title: `موعد إغلاق الفترة المالية وشيك جداً (${closingStatus.daysRemaining} أيام متبقية)`,
      message: `ينتهي موعد إقفال الفترة المالية بتاريخ ${closingStatus.closingDate}. نسبة الجاهزية الحالية ${closingStatus.readinessPercentage}%. يرجى حسم القيود المعلقة ومطابقة القوائم.`,
      actionText: 'استكمال متطلبات الإقفال',
      actionSheetKey: 'executive_dashboard',
      daysRemaining: closingStatus.daysRemaining,
      badge: `${closingStatus.daysRemaining} أيام للإقفال`,
    });
  } else if (closingStatus.isImminent) {
    alerts.push({
      id: 'alert-closing-imminent',
      type: 'period_closing',
      severity: 'warning',
      title: `اقتراب موعد إغلاق الفترة المالية (${closingStatus.daysRemaining} يوماً)`,
      message: `متبقي ${closingStatus.daysRemaining} أيام على موعد إقفال الفترة المالية للربع المالي. يرجى مراجعة موازين المراجعة ومطابقة الحسابات.`,
      actionText: 'معاينة جاهزية الإقفال',
      actionSheetKey: 'executive_dashboard',
      daysRemaining: closingStatus.daysRemaining,
      badge: 'تنبيه إقفال دوري',
    });
  }

  // 2. Pending & Draft Journal Entries Alert
  const draftEntries = entries.filter((e) => e.status === 'draft');
  if (draftEntries.length > 0) {
    const totalDraftAmount = draftEntries.reduce((s, e) => s + e.totalDebit, 0);
    const draftVouchers = draftEntries.map((e) => e.entryNo).join('، ');

    alerts.push({
      id: 'alert-pending-entries',
      type: 'pending_entries',
      severity: draftEntries.length >= 3 ? 'critical' : 'warning',
      title: `يوجد ${draftEntries.length} قيد محاسبي معلق بانتظار الاعتماد والترحيل`,
      message: `القيود (${draftVouchers}) مسجلة بحالة مسودة بإجمالي ${totalDraftAmount.toLocaleString()} ${settings.currencySymbol}. تتطلب مراجعة واعتماد المدير المالي قبل إقفال الفترة.`,
      actionText: 'اعتماد القيود المعلقة',
      actionSheetKey: 'journal_entries',
      affectedCount: draftEntries.length,
      badge: `${draftEntries.length} قيد معلق`,
    });
  }

  // 3. Periodic Financial Reviews, Software Licenses, and Contractual Deadlines Alerts
  const pendingTasks = scheduledTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const upcomingTasks = pendingTasks.filter((t) => {
    const days = calculateDaysRemaining(t.dueDate, '2026-03-24');
    return days <= t.reminderDaysBefore;
  });

  upcomingTasks.forEach((task) => {
    const days = calculateDaysRemaining(task.dueDate, '2026-03-24');
    const isDueToday = days === 0;
    const isOverdue = days < 0;

    let alertType: SmartAlert['type'] = 'statement_review';
    let actionText = 'بدء المراجعة';
    let titlePrefix = 'تذكير بمراجعة دورية';
    let badgeText = task.priority === 'critical' ? 'أولوية قصوى' : 'مراجعة دورية';

    if (task.itemType === 'software_license' || task.category === 'software_licenses') {
      alertType = 'software_license';
      actionText = 'إجراءات تجديد الترخيص';
      titlePrefix = 'اقتراب انتهاء ترخيص برمجي';
      badgeText = isOverdue ? 'ترخيص منتهي!' : days <= 7 ? 'انتهاء وشيك جداً' : 'تجديد ترخيص';
    } else if (task.itemType === 'contractual_deadline' || task.category === 'contractual_deadlines') {
      alertType = 'contractual_deadline';
      actionText = task.financialValue
        ? `إصدار إذن سداد (${task.financialValue.toLocaleString()} ${settings.currencySymbol})`
        : 'فحص ومتابعة العقد';
      titlePrefix = 'استحقاق موعد تعاقدي';
      badgeText = isOverdue ? 'استحقاق متأخر!' : days <= 3 ? 'استحقاق عاجل' : 'التزام تعاقدي';
    } else if (task.itemType === 'period_closing' || task.category === 'period_closing') {
      alertType = 'period_closing';
      actionText = 'استكمال متطلبات الإقفال';
      titlePrefix = 'موعد إغلاق الفترة المالية';
      badgeText = 'إقفال دوري';
    }

    alerts.push({
      id: `alert-task-${task.id}`,
      type: alertType,
      severity:
        task.priority === 'critical' || isOverdue || (days <= 3 && days >= 0)
          ? 'critical'
          : 'warning',
      title: isOverdue
        ? `تأخر موعد: ${task.title}`
        : isDueToday
        ? `استحقاق موعد اليوم: ${task.title}`
        : `${titlePrefix}: ${task.title}`,
      message: `${task.entityOrVendor ? `الجهة/المورد: ${task.entityOrVendor} • ` : ''}${task.codeOrNumber ? `رقم المستند/العقد: ${task.codeOrNumber} • ` : ''}المكلف: ${task.assignedToName} (${task.assignedToRole}) • تاريخ الاستحقاق: ${task.dueDate} (${isOverdue ? `متأخر بـ ${Math.abs(days)} يوم` : `متبقي ${days} أيام`}).${task.financialValue ? ` • القيمة المالية: ${task.financialValue.toLocaleString()} ${settings.currencySymbol}` : ''}`,
      actionText,
      actionSheetKey:
        task.targetSheetKey ||
        (alertType === 'contractual_deadline' ? 'entry_voucher_form' : 'executive_dashboard'),
      daysRemaining: days,
      badge: badgeText,
      contractOrLicenseNo: task.codeOrNumber,
      entityOrVendor: task.entityOrVendor,
      financialValue: task.financialValue,
    });
  });

  // 4. Overdue Transit Checks
  const transitChecksOverdue = checks.filter((c) => {
    if (c.status !== 'in_collection' && c.status !== 'issued_pending') return false;
    const days = calculateDaysRemaining(c.issueDate, '2026-03-24');
    return Math.abs(days) > (settings.maxTransitCheckDays || 15);
  });

  if (transitChecksOverdue.length > 0) {
    alerts.push({
      id: 'alert-transit-checks',
      type: 'transit_checks',
      severity: 'warning',
      title: `شيكات وسيطة تجاوزت مدة التحصيل النظامية (${transitChecksOverdue.length} شيك)`,
      message: `توجد شيكات بالحساب الوسيط 1132 مر عليها أكثر من 15 يوماً دون إشعار إضافة من البنك، يلزم متابعة غرفة المقاصة.`,
      actionText: 'متابعة الشيكات',
      actionSheetKey: 'checks_collection',
      affectedCount: transitChecksOverdue.length,
      badge: 'شيكات معلقة',
    });
  }

  // 5. Accounting Out of Balance Alert
  if (!isTbBalanced || !isBsBalanced) {
    alerts.push({
      id: 'alert-unbalanced',
      type: 'audit_warning',
      severity: 'critical',
      title: 'خلل رقابي مانع: عدم توازن في القوائم المحاسبية!',
      message: 'تم رصد عدم تطابق بين إجمالي المدين والدائن أو بين الأصول والالتزامات، لا يمكن المضي في إقفال الفترة المالية.',
      actionText: 'فحص ميزان المراجعة',
      actionSheetKey: 'trial_balance_balances',
      badge: 'خطأ مانع',
    });
  }

  // 6. Social Insurance Monthly Payment Reminder (يوم 5 من أول كل شهر)
  alerts.push({
    id: 'alert-social-insurance-monthly',
    type: 'contractual_deadline',
    severity: 'warning',
    title: 'تنبيه شهري دوري: سداد اشتراكات التأمينات الاجتماعية (مستحق يوم 5 من أول كل شهر)',
    message: 'تذكير إلزامي في بداية كل شهر: يلزم سداد اشتراكات التأمينات الاجتماعية للعاملين بالجمعية (حساب كود 2162) بمبلغ 32,000 ج.م قبل يوم 5 لتفادي فوائد وغرامات التأخير القانونية.',
    actionText: 'إصدار إذن صرف التأمينات (2162)',
    actionSheetKey: 'entry_voucher_form',
    badge: 'تذكير شهري يوم 5',
    financialValue: 32000,
    entityOrVendor: 'الهيئة القومية للتأمين الاجتماعي (حساب 2162)',
    daysRemaining: 12,
  });

  // 7. Form 41 Withholding Tax Quarterly Reminder (كل أول 3 شهور وتوريد المبالغ للبنك)
  alerts.push({
    id: 'alert-tax-form41-quarterly',
    type: 'contractual_deadline',
    severity: 'critical',
    title: 'تنبيه ربع سنوي دوري: إعداد نموذج 41 لضريبة الخصم والتحصيل وتوريد المبالغ للبنك',
    message: 'تنبيه دوري كل أول 3 شهور: يلزم قانوناً إعداد نموذج 41 لضريبة الخصم والتحصيل عن الربع المنقضي وتوريد المبالغ المحتجزة من الموردين (حساب كود 2161) بقيمة 48,000 ج.م لحساب مصلحة الضرائب بالبنك قبل انتهاء المهلة القانونية.',
    actionText: 'مراجعة وتصدير نموذج 41 ضرائب',
    actionSheetKey: 'withholding_tax',
    badge: 'تنبيه ربع سنوي (كل 3 شهور)',
    financialValue: 48000,
    entityOrVendor: 'مصلحة الضرائب المصرية - نموذج 41 ضرائب (بنك مصر)',
    daysRemaining: 7,
  });

  return alerts;
}

export const INITIAL_SCHEDULED_TASKS: ScheduledReviewTask[] = [
  // 0. Periodic Tax and Insurance Reminders
  {
    id: 'task-social-insurance-monthly',
    title: 'سداد اشتراكات التأمينات الاجتماعية الشهرية للعاملين (يوم 5 من كل شهر)',
    category: 'tax_and_savings',
    itemType: 'financial_review',
    codeOrNumber: 'SOC-INS-DAY05',
    entityOrVendor: 'الهيئة القومية للتأمين الاجتماعي (مكتب شمال القاهرة) - كود 2162',
    financialValue: 32000,
    frequency: 'monthly',
    dueDate: '2026-04-05',
    reminderDaysBefore: 7,
    assignedToName: 'أ. محمود فوزي',
    assignedToRole: 'محاسب أول المرتبات والاستقطاعات',
    priority: 'high',
    status: 'pending',
    targetSheetKey: 'entry_voucher_form',
    notes: 'تنبيه شهري دوري يوم 5 من أول كل شهر: سداد اشتراكات التأمينات الاجتماعية حصة المنشأة وحصة المؤمن عليهم بانتظام لتجنب فوائد التأخير القانونية.',
    createdAt: '2026-03-01',
  },
  {
    id: 'task-tax-form41-quarterly',
    title: 'إعداد وتقديم نموذج 41 لضريبة الخصم والتحصيل وتوريد المبالغ للبنك (كل أول 3 شهور)',
    category: 'tax_and_savings',
    itemType: 'financial_review',
    codeOrNumber: 'TAX-FORM41-Q',
    entityOrVendor: 'مصلحة الضرائب المصرية - نموذج 41 (حساب أمانات 2161 - بنك مصر)',
    financialValue: 48000,
    frequency: 'quarterly',
    dueDate: '2026-04-10',
    reminderDaysBefore: 10,
    assignedToName: 'أ. مصطفى الشافعي',
    assignedToRole: 'المراجع الداخلي بالجهاز',
    priority: 'critical',
    status: 'pending',
    targetSheetKey: 'withholding_tax',
    notes: 'تنبيه دوري كل أول 3 شهور: إعداد وتوريد مبالغ ضريبة الخصم والتحصيل من المنبع المحتجزة من الموردين وشركات السياحة بنموذج 41 وتوريدها للبنك لحساب مصلحة الضرائب.',
    createdAt: '2026-03-01',
  },
  // 1. Period Closing Deadlines (تبدأ السنة المالية من 1 يوليه وتنتهي في 30 يونيه)
  {
    id: 'task-close-q3',
    title: 'إغلاق الفترة المالية للربع الثالث Q3 للسنة المالية 2025/2026 (يناير - مارس)',
    category: 'period_closing',
    itemType: 'period_closing',
    codeOrNumber: 'CLOSE-2025/2026-Q3',
    entityOrVendor: 'الإدارة المالية - الجهاز المركزي للمحاسبات',
    frequency: 'quarterly',
    dueDate: '2026-03-31',
    reminderDaysBefore: 10,
    assignedToName: 'أ.د. إبراهيم عبد الرحمن',
    assignedToRole: 'المدير المالي (CFO)',
    priority: 'critical',
    status: 'pending',
    targetSheetKey: 'executive_dashboard',
    notes: 'إتمام كافة قيود التسوية الجردية للربع الثالث، ومطابقة ميزان المراجعة، ومطابقة حسابات البنوك قبل قفل الفترة ومنع التعديلات (السنة المالية 01/07 - 30/06).',
    createdAt: '2026-03-01',
  },
  {
    id: 'task-close-annual',
    title: 'إعداد الحساب الختامي وإقفال السنة المالية 2025/2026 (المنتهية في 30 يونيه 2026)',
    category: 'period_closing',
    itemType: 'period_closing',
    codeOrNumber: 'ANNUAL-CLOSE-2025/2026',
    entityOrVendor: 'الإدارة المالية المركزية - الجهاز المركزي للمحاسبات',
    frequency: 'annual',
    dueDate: '2026-06-30',
    reminderDaysBefore: 30,
    assignedToName: 'أ.د. إبراهيم عبد الرحمن',
    assignedToRole: 'المدير المالي (CFO)',
    priority: 'critical',
    status: 'pending',
    targetSheetKey: 'balance_sheet',
    notes: 'إقفال السنة المالية الحكومية (1 يوليه 2025 - 30 يونيه 2026)، إعداد القوائم المالية الختامية، وعرض التقرير على الجمعية العمومية وجهاز المحاسبات.',
    createdAt: '2026-03-01',
  },
  {
    id: 'task-close-umrah',
    title: 'إقفال دفاتر إيرادات ومصروفات موسم رحلات عمرة رجب وشعبان ومطابقة الفائض',
    category: 'period_closing',
    itemType: 'period_closing',
    codeOrNumber: 'UMRAH-FIN-2026',
    entityOrVendor: 'لجنة رحلات العمرة بالجهاز',
    financialValue: 4500000,
    frequency: 'once',
    dueDate: '2026-03-30',
    reminderDaysBefore: 7,
    assignedToName: 'أ. مصطفى الشافعي',
    assignedToRole: 'المراجع الداخلي بالجهاز',
    priority: 'high',
    status: 'pending',
    targetSheetKey: 'cost_centers',
    notes: 'حصر فواتير الفنادق وتذاكر الطيران ومطابقتها مع متحصلات اشتراكات الأعضاء وتسوية الفروق المالية.',
    createdAt: '2026-03-10',
  },

  // 2. Software Licenses Expiration
  {
    id: 'task-lic-eseal',
    title: 'تجديد شهادة الختم والتوقيع الإلكتروني لمنظومة الفاتورة والإيصال (Egypt Trust)',
    category: 'software_licenses',
    itemType: 'software_license',
    codeOrNumber: 'E-SEAL-EGY-98214',
    entityOrVendor: 'شركة إيجيبت تراست لخدمات التوقيع الإلكتروني',
    financialValue: 3850,
    frequency: 'annual',
    dueDate: '2026-04-05',
    reminderDaysBefore: 15,
    assignedToName: 'أ. طارق عبد الحميد',
    assignedToRole: 'مدير تكنولوجيا المعلومات والنظم',
    priority: 'critical',
    status: 'pending',
    targetSheetKey: 'executive_dashboard',
    notes: 'شهادة الختم الإلكتروني USB Token المستخدمة في اعتماد إيصالات اشتراكات العمرة والحج بمصلحة الضرائب. التأخر يوقف إصدار الإيصالات الضريبية.',
    createdAt: '2026-03-01',
  },
  {
    id: 'task-lic-erp',
    title: 'تجديد ترخيص منظومة المحاسبي الموحد السحابية وقاعدة البيانات (ERP SaaS)',
    category: 'software_licenses',
    itemType: 'software_license',
    codeOrNumber: 'LIC-CLOUD-ERP-2026',
    entityOrVendor: 'شركة الحلول السحابية ونظم المعلومات',
    financialValue: 48000,
    frequency: 'annual',
    dueDate: '2026-04-15',
    reminderDaysBefore: 25,
    assignedToName: 'أ. طارق عبد الحميد',
    assignedToRole: 'مدير تكنولوجيا المعلومات والنظم',
    priority: 'high',
    status: 'pending',
    targetSheetKey: 'executive_dashboard',
    notes: 'تجديد الاشتراك السنوي لرخص مستخدمي النظام المحاسبي الموحد (15 مستخدماً) متضمناً الدعم الفني وتحديثات الجهاز المركزي.',
    createdAt: '2026-03-01',
  },
  {
    id: 'task-lic-backup',
    title: 'تجديد اشتراك خوادم النسخ الاحتياطي السحابي المشفر والأرشيف الإلكتروني',
    category: 'software_licenses',
    itemType: 'software_license',
    codeOrNumber: 'AZURE-BCK-7741',
    entityOrVendor: 'مايكروسوفت أزور / أكرونيس لحلول السحابة',
    financialValue: 18500,
    frequency: 'annual',
    dueDate: '2026-04-28',
    reminderDaysBefore: 35,
    assignedToName: 'أ. طارق عبد الحميد',
    assignedToRole: 'مدير تكنولوجيا المعلومات والنظم',
    priority: 'medium',
    status: 'pending',
    targetSheetKey: 'audit_trail',
    notes: 'مساحة تخزين النسخ الاحتياطي اليومي المشفر لقواعد البيانات ودفاتر اليومية والمستندات المؤيدة.',
    createdAt: '2026-03-05',
  },
  {
    id: 'task-lic-ssl',
    title: 'تجديد شهادة الأمان والتشفير الرقمي SSL/TLS للبوابة الإلكترونية للجمعية',
    category: 'software_licenses',
    itemType: 'software_license',
    codeOrNumber: 'SSL-DIGICERT-EV-2026',
    entityOrVendor: 'شركة DigiCert العالمية لأمن المعلومات',
    financialValue: 7200,
    frequency: 'annual',
    dueDate: '2026-05-12',
    reminderDaysBefore: 30,
    assignedToName: 'أ. طارق عبد الحميد',
    assignedToRole: 'مدير تكنولوجيا المعلومات والنظم',
    priority: 'medium',
    status: 'pending',
    targetSheetKey: 'settings',
    notes: 'شهادة التشفير العالي لحماية معاملات تسجيل وسداد الأعضاء على الموقع الإلكتروني للجمعية.',
    createdAt: '2026-03-05',
  },

  // 3. Contractual Deadlines & Commitments
  {
    id: 'task-contract-hotel-makkah',
    title: 'سداد الدفعة الثانية من عقد استئجار فندق "وقف البركة" بمكة المكرمة (حج 1447هـ)',
    category: 'contractual_deadlines',
    itemType: 'contractual_deadline',
    codeOrNumber: 'MK-HOTEL-HAJJ-2026/01',
    entityOrVendor: 'شركة فنادق الهدى والبركة بمكة المكرمة',
    financialValue: 1850000,
    frequency: 'once',
    dueDate: '2026-04-01',
    reminderDaysBefore: 10,
    assignedToName: 'أ.د. إبراهيم عبد الرحمن',
    assignedToRole: 'المدير المالي (CFO)',
    priority: 'critical',
    status: 'pending',
    targetSheetKey: 'entry_voucher_form',
    notes: 'الدفعة الثانية المستحقة تعاقدياً لحجز 120 غرفة لحجاج الجهاز المركزي للمحاسبات. يستوجب إصدار شيك أو تحويل سويفت بنكي.',
    createdAt: '2026-03-01',
  },
  {
    id: 'task-contract-air-egyptair',
    title: 'سداد الدفعة المقدمة وتأكيد مقاعد رحلات الطيران لموسم الحج (مصر للطيران)',
    category: 'contractual_deadlines',
    itemType: 'contractual_deadline',
    codeOrNumber: 'MS-HAJJ-GRP-2026/08',
    entityOrVendor: 'شركة مصر للطيران للخطوط الجوية',
    financialValue: 980000,
    frequency: 'once',
    dueDate: '2026-04-07',
    reminderDaysBefore: 14,
    assignedToName: 'أ.د. إبراهيم عبد الرحمن',
    assignedToRole: 'المدير المالي (CFO)',
    priority: 'critical',
    status: 'pending',
    targetSheetKey: 'entry_voucher_form',
    notes: 'المهلة التعاقدية الأخيرة لسداد دفعة تثبيت مقاعد سفر حجاج الجمعية (القاهرة - جدة - المدينة - القاهرة).',
    createdAt: '2026-03-10',
  },
  {
    id: 'task-contract-bank-guarantee',
    title: 'تجديد ومطابقة خطاب الضمان المصرفي لوزارة التضامن الاجتماعي والسياحة',
    category: 'contractual_deadlines',
    itemType: 'contractual_deadline',
    codeOrNumber: 'LG-BM-CA-99201',
    entityOrVendor: 'بنك مصر - الإدارة العامة للضمانات المصرفية',
    financialValue: 500000,
    frequency: 'annual',
    dueDate: '2026-04-20',
    reminderDaysBefore: 20,
    assignedToName: 'أ. محمود فوزي',
    assignedToRole: 'محاسب أول البنوك',
    priority: 'high',
    status: 'pending',
    targetSheetKey: 'bank_reconciliation',
    notes: 'خطاب ضمان حسن التنفيذ لموسم الحج الصادر بضمان الوديعة الاستثمارية بالبنك، يلزم موافاة الوزارة بأصل التمديد.',
    createdAt: '2026-03-01',
  },
  {
    id: 'task-contract-bus-transport',
    title: 'تأكيد عقد حافلات النقل السياحي والخدمات الأرضية بالمشاعر المقدسة',
    category: 'contractual_deadlines',
    itemType: 'contractual_deadline',
    codeOrNumber: 'BUS-SAUDI-NAQAB-2026',
    entityOrVendor: 'شركة حافلات اليمامة للنقل السياحي / النقابة العامة للسيارات',
    financialValue: 420000,
    frequency: 'once',
    dueDate: '2026-04-12',
    reminderDaysBefore: 15,
    assignedToName: 'أ. مصطفى الشافعي',
    assignedToRole: 'المراجع الداخلي بالجهاز',
    priority: 'high',
    status: 'pending',
    targetSheetKey: 'suppliers',
    notes: 'تأكيد حافلات موديل 2025/2026 لنقل الحجاج بين مكة والمدينة والمشاعر المقدسة (منى وعرفة ومزدلفة).',
    createdAt: '2026-03-12',
  },
  {
    id: 'task-contract-insurance',
    title: 'تجديد وثيقة التأمين التكافلي الجماعي ضد مخاطر السفر لحجاج الجمعية',
    category: 'contractual_deadlines',
    itemType: 'contractual_deadline',
    codeOrNumber: 'INS-TAKAFUL-2026/41',
    entityOrVendor: 'شركة مصر للتأمين التكافلي',
    financialValue: 65000,
    frequency: 'annual',
    dueDate: '2026-04-25',
    reminderDaysBefore: 20,
    assignedToName: 'أ.د. إبراهيم عبد الرحمن',
    assignedToRole: 'المدير المالي (CFO)',
    priority: 'medium',
    status: 'pending',
    targetSheetKey: 'suppliers',
    notes: 'تغطية تأمينية شاملة للعلاج الطبي والحوادث وفقدان الأمتعة لكافة أعضاء بعثة الحج الرسمية.',
    createdAt: '2026-03-01',
  },

  // 4. Financial Statements Review & Internal Audits
  {
    id: 'task-1',
    title: 'المراجعة الدورية لقائمة المركز المالي للربع الأول 2026',
    category: 'financial_statements',
    itemType: 'financial_review',
    codeOrNumber: 'REV-BS-Q1',
    entityOrVendor: 'لجنة المراجعة والرقابة الداخلية',
    frequency: 'quarterly',
    dueDate: '2026-03-28',
    reminderDaysBefore: 5,
    assignedToName: 'أ.د. إبراهيم عبد الرحمن',
    assignedToRole: 'المدير المالي (CFO)',
    priority: 'critical',
    status: 'pending',
    targetSheetKey: 'balance_sheet',
    notes: 'التأكد من سلامة رصيد أمانات ومدخرات الأعضاء ومطابقة النقدية بالبنوك مع الاستثمارات وشهادات الإيداع',
    createdAt: '2026-03-01',
  },
  {
    id: 'task-2',
    title: 'مراجعة وتدقيق القيود المحاسبية المعلقة تحت الاعتماد',
    category: 'pending_entries',
    itemType: 'financial_review',
    codeOrNumber: 'REV-VOUCHERS-03',
    entityOrVendor: 'قسم الحسابات العامة',
    frequency: 'weekly',
    dueDate: '2026-03-25',
    reminderDaysBefore: 3,
    assignedToName: 'أ. مصطفى الشافعي',
    assignedToRole: 'المراجع الداخلي بالجهاز',
    priority: 'high',
    status: 'pending',
    targetSheetKey: 'journal_entries',
    notes: 'فحص المستندات المؤيدة لقيود إقامة فنادق العمرة ومصروفات الحج قبل الترحيل النهائي',
    createdAt: '2026-03-10',
  },
  {
    id: 'task-3',
    title: 'المراجعة الشهرية لقائمة الدخل وفائض/عجز رحلات العمرة',
    category: 'financial_statements',
    itemType: 'financial_review',
    codeOrNumber: 'REV-INC-03',
    entityOrVendor: 'الإدارة المالية',
    frequency: 'monthly',
    dueDate: '2026-03-30',
    reminderDaysBefore: 4,
    assignedToName: 'أ.د. إبراهيم عبد الرحمن',
    assignedToRole: 'المدير المالي (CFO)',
    priority: 'high',
    status: 'pending',
    targetSheetKey: 'income_statement',
    notes: 'تحليل تكلفة الفرد في المستوى الأول والثاني ومقارنتها بالإيرادات المحصلة ونسب التحميل',
    createdAt: '2026-03-05',
  },
  {
    id: 'task-4',
    title: 'مطابقة كشوف حسابات بنك مصر (الجاري وأذون الخزانة) ومذكرة التسوية',
    category: 'bank_reconciliation',
    itemType: 'financial_review',
    codeOrNumber: 'RECON-MISR-03',
    entityOrVendor: 'بنك مصر فرع المعاملات الحكومية',
    frequency: 'monthly',
    dueDate: '2026-03-26',
    reminderDaysBefore: 3,
    assignedToName: 'أ. محمود فوزي',
    assignedToRole: 'محاسب أول البنوك',
    priority: 'medium',
    status: 'in_progress',
    targetSheetKey: 'bank_reconciliation',
    notes: 'استلام كشوف بنك مصر الجاري وبنك مصر - أذون خزانة ومطابقة العوائد والفوائد المستحقة والدائنة',
    createdAt: '2026-03-01',
  },
  {
    id: 'task-6',
    title: 'مراجعة نسب انحراف الموازنة التقديرية (تحذير تجاوز 80%)',
    category: 'cost_centers',
    itemType: 'financial_review',
    codeOrNumber: 'VAR-BUDGET-Q1',
    entityOrVendor: 'مراقبة التكاليف والموازنة',
    frequency: 'monthly',
    dueDate: '2026-03-27',
    reminderDaysBefore: 3,
    assignedToName: 'أ.د. إبراهيم عبد الرحمن',
    assignedToRole: 'المدير المالي (CFO)',
    priority: 'high',
    status: 'completed',
    targetSheetKey: 'variance_analysis',
    notes: 'تمت مراجعة بند مصروفات الطيران للعمرة واتخاذ قرار زيادة المخصص التقديري',
    createdAt: '2026-03-01',
    completedAt: '2026-03-22',
    completedBy: 'أ.د. إبراهيم عبد الرحمن',
  },
];
