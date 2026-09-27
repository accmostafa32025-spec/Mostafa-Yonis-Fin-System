// Bank Reconciliation & Statement Draft Types and Predefined Categories
// مصنفة وفق المتطلبات المحاسبية والرقابية لجمعية الجهاز المركزي للمحاسبات

export interface BankStatementDraftRow {
  id: string;
  month: string; // e.g. '2026-03'
  date: string; // YYYY-MM-DD
  documentNo: string; // رقم المستند / رقم الإشعار البنكي
  checkNumber: string; // رقم الشيك إن وجد
  category: BankTransactionCategory;
  description: string;
  depositAmount: number; // المبلغ المحصل / الوارد (ج.م)
  withdrawalAmount: number; // المبلغ المنصرف / المسحوب (ج.م)
  bankAccountId: string; // معرف الحساب البنكي
  notes?: string;
  isReconciled?: boolean; // هل تمت تسويته ومطابقته
}

export const BANK_TRANSACTION_CATEGORIES = [
  'مقدمات حج',
  'مقدمات عمرة',
  'مرتبات شهرية',
  'حوافز شهرية',
  'مكافأة شهرية',
  'مديونيات نهاية الخدمة',
  'اعانة الجهاز',
  'مصاريف بنكية',
  'عوائد بنكية',
  'ايرادات كراسات شروط',
  'تأمينات مناقصات',
  'ايراد مبيعات كتب دينية',
  'اشتراكات اعضاء',
  'تسوية سلف',
  'شيكات تحت التحصيل',
  'شيكات منصرفة',
  'أخرى / تسوية عامة',
] as const;

export type BankTransactionCategory = typeof BANK_TRANSACTION_CATEGORIES[number];

export interface BankReconciliationMonthSummary {
  month: string;
  bankAccountId: string;
  bookBalance: number;
  statementBalance: number;
  depositsInTransit: number; // شيكات وإيداعات بالطريق (+)
  outstandingChecks: number; // شيكات منصرفة لم تصرف بعد (-)
  bankChargesUnrecorded: number; // مصاريف بنكية (-)
  bankInterestUnrecorded: number; // عوائد بنكية (+)
  adjustedBalance: number; // الرصيد المعدل
  difference: number; // الفرق (صفر عند التطابق)
  status: 'balanced' | 'unbalanced';
}
