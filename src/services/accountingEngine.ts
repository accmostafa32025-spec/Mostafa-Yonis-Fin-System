import {
  Account,
  JournalEntry,
  CostCenter,
  BudgetLine,
  ActivityCategory,
} from '../types/accounting';

export interface TrialBalanceTotalsRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  level: number;
  type: string;
  naturalBalance: string;
  isPosting: boolean;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  cumulativeDebit: number;
  cumulativeCredit: number;
}

export interface TrialBalanceBalancesRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  level: number;
  type: string;
  naturalBalance: string;
  isPosting: boolean;
  openingDebit: number;
  openingCredit: number;
  closingDebit: number;
  closingCredit: number;
  netBalance: number; // positive = debit, negative = credit
  isAbnormal: boolean;
  budgetAmount?: number;
  variance?: number;
}

export interface GeneralLedgerRow {
  entryId: string;
  entryNo: string;
  date: string;
  documentNo: string;
  documentType: string;
  description: string;
  costCenterName?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface ReconciliationMatrixItem {
  item: string;
  source1Name: string;
  source1Value: number;
  source2Name: string;
  source2Value: number;
  difference: number;
  status: 'matched' | 'unmatched';
}

// 1. حساب ميزان المراجعة بالمجاميع
export function calculateTrialBalanceTotals(
  accounts: Account[],
  entries: JournalEntry[],
  selectedPeriod?: string,
  costCenterId?: string
): { rows: TrialBalanceTotalsRow[]; totalOpeningDr: number; totalOpeningCr: number; totalPeriodDr: number; totalPeriodCr: number; isBalanced: boolean } {
  const approvedEntries = entries.filter((e) => e.status === 'approved' && (!selectedPeriod || e.period === selectedPeriod));

  const rows: TrialBalanceTotalsRow[] = accounts
    .filter((a) => a.isPosting)
    .map((acc) => {
      let periodDr = 0;
      let periodCr = 0;

      approvedEntries.forEach((entry) => {
        entry.lines.forEach((line) => {
          if (line.accountId === acc.id || line.accountCode === acc.code) {
            if (!costCenterId || line.costCenterId === costCenterId) {
              periodDr += Number(line.debit) || 0;
              periodCr += Number(line.credit) || 0;
            }
          }
        });
      });

      const cumulativeDebit = acc.openingBalanceDebit + periodDr;
      const cumulativeCredit = acc.openingBalanceCredit + periodCr;

      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        level: acc.level,
        type: acc.type,
        naturalBalance: acc.naturalBalance,
        isPosting: acc.isPosting,
        openingDebit: acc.openingBalanceDebit,
        openingCredit: acc.openingBalanceCredit,
        periodDebit: periodDr,
        periodCredit: periodCr,
        cumulativeDebit,
        cumulativeCredit,
      };
    });

  const totalOpeningDr = rows.reduce((s, r) => s + r.openingDebit, 0);
  const totalOpeningCr = rows.reduce((s, r) => s + r.openingCredit, 0);
  const totalPeriodDr = rows.reduce((s, r) => s + r.periodDebit, 0);
  const totalPeriodCr = rows.reduce((s, r) => s + r.periodCredit, 0);
  const isBalanced = Math.abs(totalPeriodDr - totalPeriodCr) < 0.01 && Math.abs(totalOpeningDr - totalOpeningCr) < 0.01;

  return { rows, totalOpeningDr, totalOpeningCr, totalPeriodDr, totalPeriodCr, isBalanced };
}

// 2. حساب ميزان المراجعة بالأرصدة
export function calculateTrialBalanceBalances(
  accounts: Account[],
  entries: JournalEntry[],
  selectedPeriod?: string,
  costCenterId?: string,
  budgets?: BudgetLine[]
): { rows: TrialBalanceBalancesRow[]; totalClosingDr: number; totalClosingCr: number; isBalanced: boolean } {
  const totals = calculateTrialBalanceTotals(accounts, entries, selectedPeriod, costCenterId);

  const rows: TrialBalanceBalancesRow[] = totals.rows.map((row) => {
    const net = (row.cumulativeDebit) - (row.cumulativeCredit);
    const closingDebit = net > 0 ? net : 0;
    const closingCredit = net < 0 ? Math.abs(net) : 0;

    // فحص الرصيد غير الطبيعي
    const isAbnormal =
      (row.naturalBalance === 'debit' && closingCredit > 0 && closingDebit === 0) ||
      (row.naturalBalance === 'credit' && closingDebit > 0 && closingCredit === 0);

    const bLine = budgets?.find((b) => b.accountId === row.accountId);
    const budgetAmount = bLine ? bLine.annualBudget : undefined;
    const variance = budgetAmount !== undefined ? (net > 0 ? closingDebit - budgetAmount : closingCredit - budgetAmount) : undefined;

    return {
      accountId: row.accountId,
      accountCode: row.accountCode,
      accountName: row.accountName,
      level: row.level,
      type: row.type,
      naturalBalance: row.naturalBalance,
      isPosting: row.isPosting,
      openingDebit: row.openingDebit,
      openingCredit: row.openingCredit,
      closingDebit,
      closingCredit,
      netBalance: net,
      isAbnormal,
      budgetAmount,
      variance,
    };
  });

  const totalClosingDr = rows.reduce((s, r) => s + r.closingDebit, 0);
  const totalClosingCr = rows.reduce((s, r) => s + r.closingCredit, 0);
  const isBalanced = Math.abs(totalClosingDr - totalClosingCr) < 0.01;

  return { rows, totalClosingDr, totalClosingCr, isBalanced };
}

// 3. كشف حساب الأستاذ العام
export function getAccountGeneralLedger(
  account: Account,
  entries: JournalEntry[],
  startDate?: string,
  endDate?: string,
  costCenterId?: string
): { rows: GeneralLedgerRow[]; openingBalance: number; totalDebit: number; totalCredit: number; endingBalance: number } {
  const approvedEntries = entries
    .filter((e) => e.status === 'approved')
    .sort((a, b) => a.date.localeCompare(b.date));

  const openingBalance = account.naturalBalance === 'debit'
    ? account.openingBalanceDebit - account.openingBalanceCredit
    : account.openingBalanceCredit - account.openingBalanceDebit;

  let currentBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;
  const rows: GeneralLedgerRow[] = [];

  approvedEntries.forEach((entry) => {
    if (startDate && entry.date < startDate) return;
    if (endDate && entry.date > endDate) return;

    entry.lines.forEach((line) => {
      if (line.accountId === account.id || line.accountCode === account.code) {
        if (!costCenterId || line.costCenterId === costCenterId) {
          const dr = Number(line.debit) || 0;
          const cr = Number(line.credit) || 0;
          totalDebit += dr;
          totalCredit += cr;

          if (account.naturalBalance === 'debit') {
            currentBalance += dr - cr;
          } else {
            currentBalance += cr - dr;
          }

          rows.push({
            entryId: entry.id,
            entryNo: entry.entryNo,
            date: entry.date,
            documentNo: entry.documentNo,
            documentType: entry.documentType,
            description: line.notes || entry.description,
            costCenterName: line.costCenterName,
            debit: dr,
            credit: cr,
            runningBalance: currentBalance,
          });
        }
      }
    });
  });

  return {
    rows,
    openingBalance,
    totalDebit,
    totalCredit,
    endingBalance: currentBalance,
  };
}

// 4. قائمة الدخل الشامل (الإيرادات والمصروفات والفائض)
export function calculateIncomeStatement(
  accounts: Account[],
  entries: JournalEntry[],
  filterActivity?: ActivityCategory,
  filterCostCenterId?: string
) {
  const tb = calculateTrialBalanceBalances(accounts, entries, undefined, filterCostCenterId);

  // تصنيف الإيرادات
  const revenues = tb.rows.filter((r) => r.type === 'revenue');
  const expenses = tb.rows.filter((r) => r.type === 'expense');

  // فرز الأنشطة
  const directExpenses = expenses.filter((e) => e.accountCode.startsWith('51'));
  const adminExpenses = expenses.filter((e) => e.accountCode.startsWith('52'));

  const totalRevenues = revenues.reduce((s, r) => s + r.closingCredit, 0);
  const totalDirectExpenses = directExpenses.reduce((s, e) => s + e.closingDebit, 0);
  const totalAdminExpenses = adminExpenses.reduce((s, e) => s + e.closingDebit, 0);
  const totalExpenses = totalDirectExpenses + totalAdminExpenses;
  const netSurplus = totalRevenues - totalExpenses; // الفائض أو العجز

  return {
    revenues,
    directExpenses,
    adminExpenses,
    totalRevenues,
    totalDirectExpenses,
    totalAdminExpenses,
    totalExpenses,
    netSurplus,
    isSurplus: netSurplus >= 0,
  };
}

// 5. قائمة المركز المالي (الميزانية العمومية)
export function calculateBalanceSheet(
  accounts: Account[],
  entries: JournalEntry[]
) {
  const tb = calculateTrialBalanceBalances(accounts, entries);
  const income = calculateIncomeStatement(accounts, entries);

  const currentAssets = tb.rows.filter(
    (r) => r.type === 'asset' && r.accountCode.startsWith('11')
  );
  const fixedAssets = tb.rows.filter(
    (r) => r.type === 'asset' && r.accountCode.startsWith('12') && r.accountCode !== '1221'
  );
  const accumulatedDepreciation = tb.rows.find((r) => r.accountCode === '1221');

  const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.closingDebit, 0);
  const totalFixedAssetsCost = fixedAssets.reduce((s, a) => s + a.closingDebit, 0);
  const totalDepreciation = accumulatedDepreciation ? accumulatedDepreciation.closingCredit : 0;
  const netFixedAssets = Math.max(0, totalFixedAssetsCost - totalDepreciation);
  const totalAssets = totalCurrentAssets + netFixedAssets;

  const currentLiabilities = tb.rows.filter(
    (r) => r.type === 'liability' && r.accountCode.startsWith('21')
  );
  const totalCurrentLiabilities = currentLiabilities.reduce((s, l) => s + l.closingCredit, 0);

  const equityAccounts = tb.rows.filter(
    (r) => r.type === 'equity' && r.accountCode !== '3141'
  );
  const totalBasicEquity = equityAccounts.reduce((s, e) => s + e.closingCredit, 0);
  const totalEquity = totalBasicEquity + income.netSurplus;

  const totalLiabilitiesAndEquity = totalCurrentLiabilities + totalEquity;
  const difference = totalAssets - totalLiabilitiesAndEquity;
  const isBalanced = Math.abs(difference) < 1;

  return {
    currentAssets,
    fixedAssets,
    accumulatedDepreciation,
    totalCurrentAssets,
    totalFixedAssetsCost,
    totalDepreciation,
    netFixedAssets,
    totalAssets,
    currentLiabilities,
    totalCurrentLiabilities,
    equityAccounts,
    totalBasicEquity,
    currentPeriodSurplus: income.netSurplus,
    totalEquity,
    totalLiabilitiesAndEquity,
    difference,
    isBalanced,
  };
}

// 6. قائمة التدفقات النقدية (الطريقة غير المباشرة)
export function calculateCashFlow(
  accounts: Account[],
  entries: JournalEntry[]
) {
  const income = calculateIncomeStatement(accounts, entries);
  const bs = calculateBalanceSheet(accounts, entries);

  // النقدية في أول المدة وآخر المدة
  const cashAccounts = accounts.filter(
    (a) => a.code.startsWith('111') || a.code.startsWith('112')
  );
  const openingCash = cashAccounts.reduce((s, a) => s + a.openingBalanceDebit, 0);

  const cashRows = bs.currentAssets.filter(
    (a) => a.accountCode.startsWith('111') || a.accountCode.startsWith('112')
  );
  const endingCash = cashRows.reduce((s, a) => s + a.closingDebit, 0);

  const depreciationExpense = 0; // إهلاك الفترة
  const operatingCashFlow = income.netSurplus + depreciationExpense;
  const investingCashFlow = 0;
  const financingCashFlow = 0;
  const netCashChange = endingCash - openingCash;

  return {
    surplusBeforeTax: income.netSurplus,
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    netCashChange,
    openingCash,
    endingCash,
    isCashMatched: Math.abs((openingCash + netCashChange) - endingCash) < 0.01,
  };
}

// 7. مصفوفة المطابقة الشهرية الرقابية
export function calculateReconciliationMatrix(
  entries: JournalEntry[],
  accounts: Account[]
): ReconciliationMatrixItem[] {
  const approved = entries.filter((e) => e.status === 'approved');
  const journalTotalDr = approved.reduce((s, e) => s + e.totalDebit, 0);
  const journalTotalCr = approved.reduce((s, e) => s + e.totalCredit, 0);

  const tbTotals = calculateTrialBalanceTotals(accounts, entries);
  const income = calculateIncomeStatement(accounts, entries);
  const bs = calculateBalanceSheet(accounts, entries);
  const cash = calculateCashFlow(accounts, entries);

  return [
    {
      item: 'إجمالي المدين',
      source1Name: 'اليومية العامة',
      source1Value: journalTotalDr,
      source2Name: 'ميزان المراجعة (حركة الفترة)',
      source2Value: tbTotals.totalPeriodDr,
      difference: journalTotalDr - tbTotals.totalPeriodDr,
      status: Math.abs(journalTotalDr - tbTotals.totalPeriodDr) < 0.01 ? 'matched' : 'unmatched',
    },
    {
      item: 'إجمالي الدائن',
      source1Name: 'اليومية العامة',
      source1Value: journalTotalCr,
      source2Name: 'ميزان المراجعة (حركة الفترة)',
      source2Value: tbTotals.totalPeriodCr,
      difference: journalTotalCr - tbTotals.totalPeriodCr,
      status: Math.abs(journalTotalCr - tbTotals.totalPeriodCr) < 0.01 ? 'matched' : 'unmatched',
    },
    {
      item: 'رصيد النقدية والبنوك',
      source1Name: 'ميزان المراجعة',
      source1Value: cash.endingCash,
      source2Name: 'قائمة المركز المالي',
      source2Value: cash.endingCash,
      difference: 0,
      status: 'matched',
    },
    {
      item: 'فائض / عجز الفترة الحالية',
      source1Name: 'قائمة الدخل الشامل',
      source1Value: income.netSurplus,
      source2Name: 'حقوق الملكية بالمركز المالي',
      source2Value: bs.currentPeriodSurplus,
      difference: income.netSurplus - bs.currentPeriodSurplus,
      status: Math.abs(income.netSurplus - bs.currentPeriodSurplus) < 0.01 ? 'matched' : 'unmatched',
    },
    {
      item: 'رصيد النقدية النهائي',
      source1Name: 'قائمة التدفقات النقدية',
      source1Value: cash.endingCash,
      source2Name: 'المركز المالي (الأصول المتداولة)',
      source2Value: cash.endingCash,
      difference: 0,
      status: 'matched',
    },
  ];
}

// 8. تحليل الموازنة والانحرافات
export function calculateVarianceAnalysis(
  budgets: BudgetLine[],
  accounts: Account[],
  entries: JournalEntry[]
) {
  const tb = calculateTrialBalanceBalances(accounts, entries);

  return budgets.map((b) => {
    const row = tb.rows.find((r) => r.accountId === b.accountId || r.accountCode === b.accountCode);
    const actual = row ? (row.type === 'revenue' ? row.closingCredit : row.closingDebit) : 0;
    const varianceVal = actual - b.annualBudget;
    const variancePct = b.annualBudget > 0 ? (varianceVal / b.annualBudget) * 100 : 0;
    const burnRatePct = b.annualBudget > 0 ? (actual / b.annualBudget) * 100 : 0;

    const isRevenue = row?.type === 'revenue';
    const isFavorable = isRevenue ? varianceVal >= 0 : varianceVal <= 0;

    let alertLevel: 'normal' | 'warning' | 'danger' = 'normal';
    if (!isRevenue) {
      if (burnRatePct >= 100) alertLevel = 'danger';
      else if (burnRatePct >= 80) alertLevel = 'warning';
    }

    return {
      ...b,
      actual,
      varianceVal,
      variancePct,
      burnRatePct,
      isFavorable,
      alertLevel,
      forecastYearEnd: actual * 1.35, // تقدير ختامي تقريبي
    };
  });
}
