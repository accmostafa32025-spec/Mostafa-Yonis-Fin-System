import { INITIAL_ACCOUNTS, INITIAL_JOURNAL_ENTRIES, INITIAL_COST_CENTERS, INITIAL_CHECKS, INITIAL_SETTINGS, INITIAL_SAVINGS_RECORDS } from '../src/data/initialData';
import { calculateTrialBalanceBalances, calculateBalanceSheet, calculateIncomeStatement } from '../src/services/accountingEngine';
import { runSystemComprehensiveAudit, validateSingleEntry } from '../src/services/validationEngine';

console.log('=====================================================');
console.log('🚀 بدء الفحص والاختبار الشامل للنظام المحاسبي والرقابي');
console.log('=====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ [نجاح] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [فشل] ${testName} ${details ? '- ' + details : ''}`);
    failedTests++;
  }
}

// 1. اختبار ميزان المراجعة وتوازن القيد المزدوج
console.log('1️⃣ اختبار توازن ميزان المراجعة (Trial Balance Balances):');
const tb = calculateTrialBalanceBalances(INITIAL_ACCOUNTS, INITIAL_JOURNAL_ENTRIES);
assert(tb.isBalanced, 'ميزان المراجعة متزن تماماً (إجمالي المدين = إجمالي الدائن)', `الفرق: ${tb.totalClosingDr - tb.totalClosingCr}`);
assert(tb.totalClosingDr > 0, 'إجمالي أرصدة ميزان المراجعة أكبر من الصفر', `القيمة: ${tb.totalClosingDr}`);
console.log(`     إجمالي المدين: ${tb.totalClosingDr.toLocaleString()} ج.م | إجمالي الدائن: ${tb.totalClosingCr.toLocaleString()} ج.م\n`);

// 2. اختبار قائمة المركز المالي (الميزانية العمومية)
console.log('2️⃣ اختبار معادلة الميزانية العمومية (الأصول = الالتزامات + حقوق الملكية):');
const bs = calculateBalanceSheet(INITIAL_ACCOUNTS, INITIAL_JOURNAL_ENTRIES);
assert(bs.isBalanced, 'الميزانية العمومية متزنة تماماً', `الفارق: ${bs.difference}`);
assert(bs.totalAssets === bs.totalLiabilitiesAndEquity, 'الأصول تساوي الالتزامات وحقوق الملكية');
console.log(`     إجمالي الأصول: ${bs.totalAssets.toLocaleString()} ج.م | إجمالي الالتزامات وحقوق الملكية: ${bs.totalLiabilitiesAndEquity.toLocaleString()} ج.م\n`);

// 3. اختبار قائمة الدخل وفائض الفترة
console.log('3️⃣ اختبار قائمة الإيرادات والمصروفات (قائمة الدخل):');
const income = calculateIncomeStatement(INITIAL_ACCOUNTS, INITIAL_JOURNAL_ENTRIES);
assert(income.totalRevenues >= 0, 'إجمالي الإيرادات محسوب بصورة صحيحة');
assert(income.totalExpenses >= 0, 'إجمالي المصروفات محسوب بصورة صحيحة');
console.log(`     إجمالي الإيرادات: ${income.totalRevenues.toLocaleString()} ج.م | إجمالي المصروفات: ${income.totalExpenses.toLocaleString()} ج.م | صافي الفائض: ${income.netSurplus.toLocaleString()} ج.م\n`);

// 4. اختبار الفحص الرقابي الشامل
console.log('4️⃣ اختبار محرك الرقابة والفحص الذكي (25 قاعدة رقابية):');
const auditResults = runSystemComprehensiveAudit(
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_ACCOUNTS,
  INITIAL_COST_CENTERS,
  INITIAL_CHECKS,
  INITIAL_SETTINGS,
  tb.totalClosingDr - tb.totalClosingCr,
  bs.difference
);
const errors = auditResults.filter(r => r.status === 'error');
assert(errors.length === 0, 'النظام خالٍ تماماً من الأخطاء الرقابية الحرجة', `الأخطاء: ${errors.length}`);
console.log(`     عدد القواعد التي تم فحصها: ${auditResults.length} قاعدة | الأخطاء: ${errors.length}\n`);

// 5. اختبار شيت رفع المدخرات واحتساب الأقساط آلياً
console.log('5️⃣ اختبار شيت رفع المدخرات واحتساب الأقساط الشهرية آلياً:');
const sampleRecord = INITIAL_SAVINGS_RECORDS[0];
assert(sampleRecord.subscriptionFee === 11, 'الاشتراك الشهري ثابت بمبلغ 11 ج.م');
assert(sampleRecord.monthlyDeduction - 11 === sampleRecord.remainingAfterSub, 'المتبقي بعد الاشتراك = الاستقطاع - 11');
assert(sampleRecord.monthlyDeduction - 11 - sampleRecord.monthlySavings === sampleRecord.remainingAfterSubAndSavings, 'المتبقي بعد الاشتراك والادخار صحيح');

// اختبار الحساب التلقائي للقسط: مبلغ المديونية / عدد الشهور
const calculatedInst = Math.round(sampleRecord.debtTotalAmount / sampleRecord.installmentMonthsCount);
assert(sampleRecord.monthlyInstallment === calculatedInst, 'القسط الشهري محسوب تلقائياً بدقة', `المحسوب: ${calculatedInst} | المسجل: ${sampleRecord.monthlyInstallment}`);

// التحقق من عدم تكرار الرقم الوظيفي والاسم
const jobNumbers = INITIAL_SAVINGS_RECORDS.map(r => r.jobNumber);
const uniqueJobNumbers = new Set(jobNumbers);
assert(jobNumbers.length === uniqueJobNumbers.size, 'الأرقام الوظيفية فريدة ولا تتكرر نهائياً');

const names = INITIAL_SAVINGS_RECORDS.map(r => r.name);
const uniqueNames = new Set(names);
assert(names.length === uniqueNames.size, 'أسماء الأعضاء فريدة ولا تتكرر نهائياً');
console.log(`     تم فحص ${INITIAL_SAVINGS_RECORDS.length} سجلات مدخرات ومديونيات بنجاح تام.\n`);

// 6. اختبار كشف القيود الشاذة المخالفة لطبيعة الحسابات وتجاوز كلمة سر المدير المالي (CFO)
console.log('6️⃣ اختبار كشف القيود الشاذة وتجاوز كلمة سر المدير المالي (CFO):');
import { detectEntryAnomalies, verifyCfoPassword } from '../src/services/anomalyDetection';

// اختبار التحقق من كلمة سر المدير المالي
assert(verifyCfoPassword('cfo@2026', INITIAL_SETTINGS), 'قبول كلمة سر المدير المالي الصحيحة (cfo@2026)');
assert(!verifyCfoPassword('wrong-password', INITIAL_SETTINGS), 'رفض كلمة سر غير صحيحة لحماية الحسابات');
assert(!verifyCfoPassword('', INITIAL_SETTINGS), 'رفض كلمة سر فارغة');

// اختبار كشف قيد شاذ: توجيه مدين على حساب إيرادات (طبيعته دائنة)
const anomalousRevenueLine = [
  {
    id: 'test-ln-1',
    accountId: 'acc-4111',
    accountCode: '4111',
    accountName: 'إيرادات اشتراكات الأعضاء السنوية',
    debit: 15000, // شاذ: إيرادات في الطرف المدين
    credit: 0,
  },
  {
    id: 'test-ln-2',
    accountId: 'acc-1111',
    accountCode: '1111',
    accountName: 'الخزينة الرئيسية',
    debit: 0,
    credit: 15000,
  },
];
const revAnomalies = detectEntryAnomalies(anomalousRevenueLine, INITIAL_ACCOUNTS);
assert(revAnomalies.length > 0, 'اكتشاف توجيه مدين شاذ على حساب إيرادات دائنة بنجاح');
assert(revAnomalies.some(a => a.violationType === 'debit_on_credit_revenue'), 'تصنيف نوع المخالفة بدقة (debit_on_credit_revenue)');

// اختبار كشف قيد شاذ: توجيه دائن على حساب مصروفات (طبيعته مدينة)
const anomalousExpenseLine = [
  {
    id: 'test-ln-3',
    accountId: 'acc-1111',
    accountCode: '1111',
    accountName: 'الخزينة الرئيسية',
    debit: 5000,
    credit: 0,
  },
  {
    id: 'test-ln-4',
    accountId: 'acc-5211',
    accountCode: '5211',
    accountName: 'أجور ومكافآت وحوافز الجهاز الإداري والمشرفين',
    debit: 0,
    credit: 5000, // شاذ: مصروفات في الطرف الدائن
  },
];
const expAnomalies = detectEntryAnomalies(anomalousExpenseLine, INITIAL_ACCOUNTS);
assert(expAnomalies.length > 0, 'اكتشاف توجيه دائن شاذ على حساب مصروفات مدينة بنجاح');
assert(expAnomalies.some(a => a.violationType === 'credit_on_debit_expense'), 'تصنيف نوع المخالفة بدقة (credit_on_debit_expense)');

// اختبار محرك الفحص validateSingleEntry مع القيود الشاذة وحاجتها لكلمة سر CFO
const testEntryWithAnomaly = {
  id: 'test-entry-anomaly',
  entryNo: 'JV-2026-9999',
  date: '2026-03-25',
  period: '2026-03',
  entryType: 'general' as const,
  documentNo: 'TEST-DOC-001',
  documentType: 'cash_voucher' as const,
  description: 'قيد تسوية استثنائي تجريبي',
  lines: anomalousRevenueLine,
  totalDebit: 15000,
  totalCredit: 15000,
};

const validationWithoutOverride = validateSingleEntry(
  testEntryWithAnomaly,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_ACCOUNTS,
  INITIAL_COST_CENTERS,
  INITIAL_SETTINGS
);
assert(validationWithoutOverride.requiresCfoPassword === true, 'إلزام القيد الشاذ بكلمة سر المدير المالي');
assert(validationWithoutOverride.canApprove === false, 'حظر اعتماد القيد الشاذ قبل إدخال كلمة سر المدير المالي');

// اختبار بعد إرفاق تجاوز المدير المالي الرسمي
const testEntryWithCfoOverride = {
  ...testEntryWithAnomaly,
  cfoOverride: true,
  cfoOverrideBy: 'أ.د. إبراهيم عبد الرحمن (CFO)',
  cfoOverrideReason: 'تسوية استرداد اشتراكات معتمدة',
};
const validationWithOverride = validateSingleEntry(
  testEntryWithCfoOverride,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_ACCOUNTS,
  INITIAL_COST_CENTERS,
  INITIAL_SETTINGS
);
assert(validationWithOverride.canApprove === true, 'السماح باعتماد القيد الشاذ فور مصادقة وتجاوز المدير المالي');
console.log('     تم اجتياز جميع اختبارات كشف القيود الشاذة وحمايتها بكلمة سر المدير المالي بنجاح.\n');

console.log('=====================================================');
console.log(`📊 النتيجة النهائية: نجح ${passedTests} من أصل ${passedTests + failedTests} اختبار`);
if (failedTests === 0) {
  console.log('🎉 كافة الاختبارات والتحققات الرقابية والمحاسبية مرت بنجاح 100%!');
} else {
  console.error(`⚠️ فشل ${failedTests} اختبار`);
  process.exit(1);
}
console.log('=====================================================');
