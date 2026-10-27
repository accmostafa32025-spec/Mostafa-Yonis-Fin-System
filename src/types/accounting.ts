export type SheetKey =
  | 'home'
  | 'settings'
  | 'users'
  | 'chart_of_accounts'
  | 'cost_centers'
  | 'members'
  | 'suppliers'
  | 'journal_entries'
  | 'entry_voucher_form'
  | 'receipts'
  | 'payments'
  | 'treasury_cash'
  | 'banks'
  | 'checks_issued'
  | 'checks_received'
  | 'checks_collection'
  | 'members_savings'
  | 'savings_upload'
  | 'withholding_tax'
  | 'general_ledger'
  | 'subsidiary_ledger'
  | 'trial_balance_totals'
  | 'trial_balance_balances'
  | 'monthly_review'
  | 'bank_reconciliation'
  | 'budget'
  | 'variance_analysis'
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'equity_changes'
  | 'financial_notes'
  | 'audit_controls'
  | 'executive_dashboard'
  | 'audit_trail'
  | 'user_guide';

export type DebtCategory =
  | 'umrah'
  | 'hajj'
  | 'loan_medical'
  | 'loan_hajj'
  | 'loan_marriage'
  | 'loan_high_school';

export interface MonthlySavingsRecord {
  id: string;
  jobNumber: string; // الرقم الوظيفي / لا يكرر نهائياً
  name: string; // الاسم / لا يكرر نهائياً
  openingSavingsBalance: number; // رصيد أول المدة من المدخرات
  monthlyDeduction: number; // إجمالي الاستقطاع الشهري
  subscriptionFee: number; // اشتراك شهري ثابت (11 جنيه)
  monthlySavings: number; // ادخار شهري
  remainingAfterSub: number; // ما تبقى بعد الاشتراك الشهري
  monthlyInstallment: number; // القسط الشهري
  remainingAfterSubAndSavings: number; // ما تبقى بعد الاشتراك والادخار الشهري
  debtTotalAmount: number; // مبالغ المديونية التي تقسط بالخصم من الاستقطاع
  installmentMonthsCount: number; // مدة التقسيط (عدد الشهور التي تقسم عليها المديونية)
  installmentStartDate: string; // عامود بداية مدة التقسيط
  installmentEndDate: string; // عامود نهاية مدة التقسيط
  debtCategory: DebtCategory; // بند التقسيط
  debtDetail: string; // تفاصيل البند (تاريخ العمرة، نوع الحج، نوع القرض)
  notes?: string;
  monthYear?: string; // الشهر والسنة
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NaturalBalance = 'debit' | 'credit';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  naturalBalance: NaturalBalance;
  level: number; // 1: رئيسي, 2: فرعي, 3: تحليلي/حركي
  parentId?: string;
  isPosting: boolean; // يسمح بالحركة أم رئيسي فقط
  requiresCostCenter?: boolean; // إلزامي مع إيرادات ومصروفات الحج والعمرة والمعارض
  financialStatementCategory:
    | 'current_asset'
    | 'non_current_asset'
    | 'current_liability'
    | 'non_current_liability'
    | 'equity'
    | 'operating_revenue'
    | 'other_revenue'
    | 'operating_expense'
    | 'admin_expense';
  openingBalanceDebit: number;
  openingBalanceCredit: number;
  description?: string;
}

export type ActivityCategory = 'umrah' | 'hajj' | 'exhibitions' | 'members_services' | 'general_admin';

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  category: ActivityCategory;
  level?: string; // مستوى أول، ثان، ثالث (للعمرة)
  year?: number;
  date?: string;
  isActive: boolean;
  allocatedBudget?: number;
  description?: string;
}

export interface Member {
  id: string;
  memberNo: string;
  name: string;
  nationalId: string;
  department: string; // الإدارة بالجهاز المركزي للمحاسبات
  jobTitle: string;
  phone: string;
  savingsBalance: number;
  advancesBalance: number;
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  activityType: 'hotels' | 'flights' | 'transport' | 'exhibitions_vendor' | 'general_services' | 'tourism_company';
  taxId: string;
  withholdingTaxRate: number; // 1% توريدات، 3% خدمات، 5% مهن
  contactPerson: string;
  phone: string;
  balance: number; // دائن
  // بيانات شركات السياحة والتسجيل
  licenseNumber?: string; // رقم الترخيص
  commercialRegister?: string; // رقم السجل التجاري
  bankAccountNumber?: string; // رقم حساب البنك
  bankName?: string; // اسم البنك
  address?: string; // العنوان
  isTourismCompany?: boolean; // هل شركة سياحة
}

export type UserRole =
  | 'data_entry'
  | 'accountant'
  | 'auditor'
  | 'accounts_manager'
  | 'cfo'
  | 'admin'
  | 'view_only';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  roleTitleAr: string;
  approvalLimit: number; // الحد المالي للاعتماد
  permissions: {
    canEnter: boolean;
    canEdit: boolean;
    canReview: boolean;
    canApprove: boolean;
    canLockPeriod: boolean;
    canModifyCOA: boolean;
    canModifyCostCenters: boolean;
    canViewPayroll: boolean;
  };
}

export type EntryStatus = 'draft' | 'under_review' | 'approved' | 'rejected' | 'reversed';

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  costCenterCode?: string;
  costCenterName?: string;
  entityType?: 'member' | 'supplier' | 'bank' | 'general';
  entityId?: string;
  entityName?: string;
  notes?: string;
}

export interface AccountingAnomaly {
  lineId: string;
  lineNumber: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  naturalBalance: NaturalBalance;
  violationType:
    | 'debit_on_credit_revenue'
    | 'credit_on_debit_expense'
    | 'negative_balance_asset'
    | 'negative_balance_liability'
    | 'equity_direct_debit'
    | 'unusual_contra_settlement';
  severity: 'critical' | 'warning';
  direction: 'debit' | 'credit';
  amount: number;
  currentBalance?: number;
  projectedBalance?: number;
  title: string;
  explanation: string;
  accountingRule: string;
}

export interface JournalEntry {
  id: string;
  entryNo: string; // auto-increment sequential
  date: string;
  period: string; // e.g. 2026-01
  fiscalYear?: number;
  entryType: 'general' | 'receipt' | 'payment' | 'closing' | 'adjustment' | 'reversal';
  documentNo: string;
  documentType: 'cash_voucher' | 'bank_voucher' | 'invoice' | 'settlement' | 'check_voucher' | 'internal_memo';
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: EntryStatus;
  createdBy: string;
  createdByUid?: string;
  reviewedBy?: string;
  reviewedByUid?: string;
  approvedBy?: string;
  approvedByUid?: string;
  rejectedBy?: string;
  reversalOfEntryNo?: string;
  reversalReason?: string;
  reviewerNotes?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  hasAnomalies?: boolean;
  anomaliesSummary?: string[];
  cfoOverride?: boolean;
  cfoOverrideBy?: string;
  cfoOverrideReason?: string;
  cfoOverrideTimestamp?: string;
}

export type CheckStatus =
  | 'received'
  | 'in_collection'
  | 'cleared'
  | 'bounced'
  | 'cancelled'
  | 'issued_pending'
  | 'received_in_safe';
export type CheckDirection = 'incoming' | 'outgoing';

export interface CheckTransaction {
  id: string;
  checkNumber: string;
  bankName: string;
  direction: CheckDirection;
  amount: number;
  issueDate: string;
  dueDate: string;
  beneficiaryOrDrawer: string; // المستفيد أو الساحب
  status: CheckStatus;
  statusDate: string;
  journalEntryNo?: string;
  depositSlipNo?: string;
  notes?: string;
  clearingReference?: string;
  intermediateAccountCode?: string;
}

export interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  currency: string;
  glAccountId: string;
  bookBalance: number;
  statementBalance: number;
  lastReconciledDate: string;
  minBalanceAlert?: number; // الحد الأدنى المخصص لرصيد هذا الحساب البنكي للتنبيه بانخفاض السيولة
  isDefault?: boolean; // ضبط كحساب بنكي افتراضي معتمد بالنظام
  accountRole?: 'current_operations' | 'treasury_bonds' | string; // الدور الوظيفي للحساب
  accountRoleAr?: string; // التوصيف الوظيفي بالعربية
}

export interface BudgetLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  costCenterId?: string;
  costCenterName?: string;
  activity: ActivityCategory;
  annualBudget: number;
  q1Budget: number;
  q2Budget: number;
  q3Budget: number;
  q4Budget: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole?: string;
  action: 'create' | 'edit' | 'review' | 'approve' | 'reject' | 'reverse' | 'lock_period' | 'export';
  targetDocType?: 'journal_entry' | 'check' | 'settings' | 'member' | 'budget';
  targetDocId?: string;
  beforeValue?: string;
  afterValue?: string;
  details?: string;
  reason?: string;
}

export interface SystemSettings {
  organizationName: string;
  parentOrganization: string; // الجهاز المركزي للمحاسبات
  fiscalYear: number;
  fiscalYearDisplay?: string; // 2025 / 2026
  fiscalYearStartDate?: string; // 2025-07-01
  fiscalYearEndDate?: string; // 2026-06-30
  fiscalYearStartMonth?: number; // 7 (يوليه)
  fiscalYearEndMonth?: number; // 6 (يونيه)
  fiscalYearRule?: string; // السنة المالية تبدأ من 1 يوليه وتنتهي في 30 يونيه من السنة التالية
  activePeriod: string; // 2026-03
  currency: string;
  currencySymbol: string;
  isPeriodLocked: boolean;
  lockedPeriods: string[];
  autoReverseAllowed: boolean;
  costCenterEnforced: boolean;
  approvalTierLimits: {
    accountant: number;
    auditor: number;
    accountsManager: number;
    cfo: number;
  };
  warningThresholdPercentage: number; // 80%
  dangerThresholdPercentage: number; // 95%
  maxTransitCheckDays: number; // 15 days
  lockDate?: string;
  registrationNumber?: string;
  taxRegistrationNo?: string;
  requireCostCenterForRevenuesAndExpenses?: boolean;
  allowDirectBankDisbursement?: boolean;
  preventUnbalancedEntries?: boolean;
  cfoPassword?: string; // كلمة سر المدير المالي لتجاوز القيود الشاذة المخالفة لطبيعة الحسابات
  // إعدادات وضوابط رصد السيولة النقدية والمصرفية
  minTreasuryBalanceAlert?: number; // الحد الأدنى لرصيد الخزينة للتنبيه بانخفاض السيولة (افتراضي: 100,000 ج.م)
  minBankBalanceAlert?: number; // الحد الأدنى لرصيد الحساب البنكي للتنبيه بانخفاض السيولة (افتراضي: 1,000,000 ج.م)
  enableLiquidityAlerts?: boolean; // تفعيل خاصية الرصد اللحظي والتنبيه عند انخفاض السيولة
  bankMinBalances?: Record<string, number>; // حدود دنيا مخصصة لكل بنك على حدة
  // الحسابات البنكية الافتراضية
  defaultCurrentBankAccountId?: string; // حساب بنك مصر الجاري الافتراضي (1990199000000018)
  defaultBondsBankAccountId?: string; // حساب بنك مصر للسندات وأذون الخزانة الافتراضي (1990199000000203)
  // البيانات القانونية والضريبية والتأمينية للجمعية
  insuranceNumber?: string; // الرقم التأميني للجمعية (1854663)
  taxRegistrationNumber?: string; // رقم التسجيل الضريبي للجمعية (706054423)
  taxFileNumber?: string; // رقم الملف الضريبي للجمعية
  taxAuthorityBranch?: string; // مأمورية الضرائب المختصة
}

export interface FixedAssetRecord {
  id: string;
  code: string; // كود الأصل مثل AST-PC-01
  name: string; // اسم الحاسب / الخادم / التجهيزات التقنية
  category: 'computers' | 'servers' | 'it_equipment' | 'printers_scanners';
  categoryAr: string;
  acquisitionDate: string; // تاريخ اقتناء الأصل
  purchaseCost: number; // تكلفة الشراء التاريخية (ج.م)
  salvageValue: number; // القيمة التخريدية (الخردة)
  depreciationRate: number; // معدل الإهلاك السنوي (20% قسط ثابت)
  accumulatedDepreciationPrior: number; // مجمع الإهلاك حتى بداية الفترة
  currentPeriodDepreciation: number; // قسط إهلاك الفترة الحالية
  totalAccumulatedDepreciation: number; // إجمالي مجمع الإهلاك
  netBookValue: number; // صافي القيمة الدفترية للأصل
  accountCode: string; // كود الأصل (1221 - حاسبات آلية وتجهيزات)
  accumulatedDepAccountCode: string; // كود مجمع الإهلاك (1231)
  depExpenseAccountCode: string; // كود مصروف الإهلاك (5231)
  status: 'active' | 'fully_depreciated' | 'disposed';
  location?: string;
  assignedTo?: string;
}

export interface TaxForm41Record {
  id: string;
  serialNo: number;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  taxRegistrationNumber: string;
  commercialRegister?: string;
  licenseNumber?: string;
  address?: string;
  docNumber: string; // رقم إذن الصرف أو الفاتورة
  docDate: string; // تاريخ المعاملة
  dealType: 'supplies' | 'services' | 'professional' | 'other';
  dealTypeAr: string; // توريدات (1%)، خدمات ونقل (3%)، مهن حرة (5%)
  grossAmount: number; // المبلغ الإجمالي قبل الخصم
  taxRate: number; // 1 | 3 | 5
  taxWithheld: number; // الضريبة المحتجزة الموردة
  netPaid: number; // صافي المبلغ المنصرف
  paymentMethod: 'bank_transfer' | 'check' | 'cash';
  checkOrTransferNo?: string;
  bankName?: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  quarterAr: string; // الربع الأول، الربع الثاني، الربع الثالث، الربع الرابع
  fiscalYear: string; // 2025 / 2026
  status: 'withheld_ready' | 'remitted_to_bank' | 'filed_with_eta';
  remittanceNoticeNo?: string; // رقم إشعار توريد البنك لمصلحة الضرائب
  remittanceDate?: string;
}

export interface ValidationRuleCheck {
  id: number;
  ruleTitle: string;
  category: 'structure' | 'accounting' | 'policy' | 'internal_control';
  status: 'valid' | 'warning' | 'error';
  details: string;
  affectedEntriesCount?: number;
}

export type ReviewFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'once';
export type ReviewTaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type ReviewTaskStatus = 'pending' | 'in_progress' | 'completed' | 'snoozed';
export type ReviewCategory =
  | 'financial_statements'
  | 'pending_entries'
  | 'bank_reconciliation'
  | 'cost_centers'
  | 'tax_and_savings'
  | 'general_audit'
  | 'period_closing'
  | 'software_licenses'
  | 'contractual_deadlines';

export type ScheduleItemType =
  | 'period_closing'
  | 'software_license'
  | 'contractual_deadline'
  | 'financial_review';

export interface ScheduledReviewTask {
  id: string;
  title: string;
  category: ReviewCategory;
  itemType?: ScheduleItemType;
  codeOrNumber?: string; // رقم العقد / كود الترخيص / رقم الاعتماد
  entityOrVendor?: string; // الجهة / الشركة الموردة / المقاول
  financialValue?: number; // قيمة العقد أو رسوم التجديد (ج.م)
  frequency: ReviewFrequency;
  dueDate: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD
  reminderDaysBefore: number;
  assignedToName: string;
  assignedToRole: string;
  priority: ReviewTaskPriority;
  status: ReviewTaskStatus;
  targetSheetKey?: SheetKey;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  autoRenew?: boolean;
  attachmentRef?: string;
}

export interface SmartAlert {
  id: string;
  type:
    | 'period_closing'
    | 'pending_entries'
    | 'statement_review'
    | 'budget_threshold'
    | 'transit_checks'
    | 'audit_warning'
    | 'software_license'
    | 'contractual_deadline';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  actionText: string;
  actionSheetKey: SheetKey;
  daysRemaining?: number;
  badge?: string;
  timestamp?: string;
  affectedCount?: number;
  contractOrLicenseNo?: string;
  entityOrVendor?: string;
  financialValue?: number;
}

export type AuditLogEntry = AuditLog;
export type AuditCheckResult = ValidationRuleCheck;
