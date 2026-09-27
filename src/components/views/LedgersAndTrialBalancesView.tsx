import React, { useState } from 'react';
import {
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  Account,
  CostCenter,
  Member,
  Supplier,
  JournalEntry,
  BudgetLine,
  SystemSettings,
} from '../../types/accounting';
import {
  calculateTrialBalanceTotals,
  calculateTrialBalanceBalances,
  getAccountGeneralLedger,
  calculateReconciliationMatrix,
} from '../../services/accountingEngine';

interface LedgersAndTrialBalancesViewProps {
  mode: 'general_ledger' | 'subsidiary_ledger' | 'trial_totals' | 'trial_balances' | 'monthly_review';
  accounts: Account[];
  costCenters: CostCenter[];
  members: Member[];
  suppliers: Supplier[];
  entries: JournalEntry[];
  budgets: BudgetLine[];
  settings: SystemSettings;
}

export const LedgersAndTrialBalancesView: React.FC<LedgersAndTrialBalancesViewProps> = ({
  mode,
  accounts,
  costCenters,
  members,
  suppliers,
  entries,
  budgets,
  settings,
}) => {
  // General ledger state
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts.find((a) => a.code === '1121')?.id || accounts[0]?.id || ''
  );
  const [glCostCenterId, setGlCostCenterId] = useState<string>('');

  // Trial balance state
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [tbCostCenterFilter, setTbCostCenterFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const glData = selectedAccount
    ? getAccountGeneralLedger(selectedAccount, entries, undefined, undefined, glCostCenterId || undefined)
    : { rows: [], openingBalance: 0, totalDebit: 0, totalCredit: 0, endingBalance: 0 };

  const tbTotals = calculateTrialBalanceTotals(
    accounts,
    entries,
    selectedPeriod || undefined,
    tbCostCenterFilter || undefined
  );

  const tbBalances = calculateTrialBalanceBalances(
    accounts,
    entries,
    selectedPeriod || undefined,
    tbCostCenterFilter || undefined,
    budgets
  );

  const reconMatrix = calculateReconciliationMatrix(entries, accounts);

  // 1. General Ledger View (Sheet 19)
  if (mode === 'general_ledger') {
    return (
      <div className="space-y-4">
        {/* Header & Account Picker */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>دفتر الأستاذ العام التفاعلي (General Ledger)</span>
                {selectedAccount && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono-num font-bold">
                    [{selectedAccount.code}] {selectedAccount.name}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                كشف حركة تفصيلي لحظي مع حساب الرصيد التراكمي الجاري وطبيعة الحساب
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Account Selector */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-amber-300 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer min-w-[220px]"
            >
              {accounts
                .filter((a) => a.isPosting)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.code}] {a.name}
                  </option>
                ))}
            </select>

            {/* Cost Center Filter */}
            <select
              value={glCostCenterId}
              onChange={(e) => setGlCostCenterId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none cursor-pointer"
            >
              <option value="">كافة مراكز التكلفة</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] border border-[#232742] hover:border-[#39e3d7]/50 transition-colors cursor-pointer flex items-center justify-center group"
              title="طباعة كشف الحساب"
            >
              <Printer className="w-4 h-4 text-[#8E92BC] group-hover:text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Account Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs">
          <div>
            <span className="text-slate-400 block">طبيعة الحساب:</span>
            <span className="font-bold text-amber-300">
              {selectedAccount?.naturalBalance === 'debit' ? 'مدين بطبيعته (Debit)' : 'دائن بطبيعته (Credit)'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">رصيد أول المدة:</span>
            <span className="font-mono-num font-bold text-white">
              {glData.openingBalance.toLocaleString()} {settings.currencySymbol}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">إجمالي حركة الفترة (مدين / دائن):</span>
            <span className="font-mono-num font-bold text-slate-200">
              م: {glData.totalDebit.toLocaleString()} | د: {glData.totalCredit.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">الرصيد الختامي الجاري:</span>
            <span className="font-mono-num font-bold text-emerald-400 text-sm">
              {glData.endingBalance.toLocaleString()} {settings.currencySymbol}
            </span>
          </div>
        </div>

        {/* GL Movements Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">رقم القيد</th>
                <th className="p-3">رقم المستند</th>
                <th className="p-3 min-w-[240px]">البيان والتوجيه المحاسبي</th>
                <th className="p-3">مركز التكلفة</th>
                <th className="p-3 font-bold text-emerald-400">مدين (ج.م)</th>
                <th className="p-3 font-bold text-amber-400">دائن (ج.م)</th>
                <th className="p-3 font-bold text-white">الرصيد الجاري (ج.م)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {/* Opening balance row */}
              <tr className="bg-slate-900/30 text-slate-400">
                <td className="p-3 font-mono-num">2026-01-01</td>
                <td className="p-3">-</td>
                <td className="p-3 font-semibold text-white">رصيد افتتاح</td>
                <td className="p-3 text-slate-300">رصيد أول المدة المرحل من السنة السابقة</td>
                <td className="p-3">-</td>
                <td className="p-3 font-mono-num font-bold text-emerald-400">
                  {selectedAccount?.openingBalanceDebit ? selectedAccount.openingBalanceDebit.toLocaleString() : '-'}
                </td>
                <td className="p-3 font-mono-num font-bold text-amber-400">
                  {selectedAccount?.openingBalanceCredit ? selectedAccount.openingBalanceCredit.toLocaleString() : '-'}
                </td>
                <td className="p-3 font-mono-num font-bold text-white">
                  {glData.openingBalance.toLocaleString()}
                </td>
              </tr>

              {glData.rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    لا توجد حركات مرحلة على هذا الحساب خلال الفترة المحددة
                  </td>
                </tr>
              ) : (
                glData.rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                    <td className="p-3 font-mono-num text-slate-400">{r.date}</td>
                    <td className="p-3 font-mono-num font-bold text-amber-300">{r.entryNo}</td>
                    <td className="p-3 font-semibold text-white">{r.documentNo}</td>
                    <td className="p-3 text-slate-200">{r.description}</td>
                    <td className="p-3 text-slate-400">
                      {r.costCenterName ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                          {r.costCenterName}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 font-mono-num font-bold text-emerald-400">
                      {r.debit > 0 ? r.debit.toLocaleString() : '-'}
                    </td>
                    <td className="p-3 font-mono-num font-bold text-amber-400">
                      {r.credit > 0 ? r.credit.toLocaleString() : '-'}
                    </td>
                    <td className="p-3 font-mono-num font-bold text-white text-sm">
                      {r.runningBalance.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 2. Subsidiary Ledger View (Sheet 20)
  if (mode === 'subsidiary_ledger') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>دفتر الأستاذ المساعد التحليلي (Subsidiary Ledger)</span>
              </h2>
              <p className="text-xs text-slate-400">
                حسابات تفصيلية مساعدة لأعضاء الجهاز المركزي، الموردين والفنادق، ومراكز التكلفة
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Members Subledger summary */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <span>أستاذ مساعد الأعضاء (حساب أمانات 2131)</span>
              <span className="text-xs text-slate-400 font-mono-num">({members.length} عضو)</span>
            </h3>
            <div className="overflow-x-auto max-h-80 scrollbar-thin">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-2">العضو</th>
                    <th className="p-2">الإدارة</th>
                    <th className="p-2">الرصيد الدائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {members.map((m) => (
                    <tr key={m.id} className="text-slate-300">
                      <td className="p-2 font-semibold text-white">{m.name}</td>
                      <td className="p-2 text-slate-400">{m.department}</td>
                      <td className="p-2 font-mono-num font-bold text-purple-300">
                        {m.savingsBalance.toLocaleString()} {settings.currencySymbol}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suppliers Subledger summary */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <span>أستاذ مساعد الموردين والشركات (حساب 2111/2112)</span>
              <span className="text-xs text-slate-400 font-mono-num">({suppliers.length} جهة)</span>
            </h3>
            <div className="overflow-x-auto max-h-80 scrollbar-thin">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-2">الشركة / الفندق</th>
                    <th className="p-2">النشاط</th>
                    <th className="p-2">الرصيد الدائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="text-slate-300">
                      <td className="p-2 font-semibold text-white">{s.name}</td>
                      <td className="p-2 text-slate-400">{s.activityType}</td>
                      <td className="p-2 font-mono-num font-bold text-amber-300">
                        {s.balance.toLocaleString()} {settings.currencySymbol}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Trial Balance by Totals (Sheet 21)
  if (mode === 'trial_totals') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>ميزان المراجعة بالمجاميع (Trial Balance by Totals)</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    tbTotals.isBalanced
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {tbTotals.isBalanced ? 'الميزان متوازن نظامياً 100%' : 'فارق عدم اتزان بالميزان'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                مطابقة إجمالي حركة المدين والدائن التراكمية مع حركة اليومية العامة وأرصدة أول المدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-2"
            >
              <option value="">كافة الفترات (تراكمي العام)</option>
              <option value="2026-01">يناير 2026</option>
              <option value="2026-02">فبراير 2026</option>
              <option value="2026-03">مارس 2026</option>
            </select>
          </div>
        </div>

        {/* Totals Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 w-28">كود الحساب</th>
                <th className="p-3 min-w-[200px]">اسم الحساب</th>
                <th className="p-3">الطبيعة</th>
                <th className="p-3 font-semibold text-slate-300">أول المدة مدين</th>
                <th className="p-3 font-semibold text-slate-300">أول المدة دائن</th>
                <th className="p-3 font-bold text-emerald-400">حركة الفترة مدين</th>
                <th className="p-3 font-bold text-amber-400">حركة الفترة دائن</th>
                <th className="p-3 font-bold text-white">المجموع مدين</th>
                <th className="p-3 font-bold text-white">المجموع دائن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {tbTotals.rows.map((r) => (
                <tr key={r.accountId} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                  <td className="p-3 font-mono-num font-bold text-amber-400/90">{r.accountCode}</td>
                  <td className="p-3 font-semibold text-white">{r.accountName}</td>
                  <td className="p-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {r.naturalBalance === 'debit' ? 'مدين' : 'دائن'}
                    </span>
                  </td>
                  <td className="p-3 font-mono-num text-slate-400">
                    {r.openingDebit > 0 ? r.openingDebit.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 font-mono-num text-slate-400">
                    {r.openingCredit > 0 ? r.openingCredit.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 font-mono-num font-bold text-emerald-400">
                    {r.periodDebit > 0 ? r.periodDebit.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 font-mono-num font-bold text-amber-400">
                    {r.periodCredit > 0 ? r.periodCredit.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 font-mono-num font-bold text-white">
                    {r.cumulativeDebit.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono-num font-bold text-white">
                    {r.cumulativeCredit.toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-slate-900 font-bold text-white text-sm border-t-2 border-slate-700">
                <td colSpan={3} className="p-3 text-amber-300 font-bold">
                  الإجمالي العام لميزان المراجعة بالمجاميع
                </td>
                <td className="p-3 font-mono-num text-slate-200">
                  {tbTotals.totalOpeningDr.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num text-slate-200">
                  {tbTotals.totalOpeningCr.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num text-emerald-400">
                  {tbTotals.totalPeriodDr.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num text-amber-400">
                  {tbTotals.totalPeriodCr.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num text-white">
                  {(tbTotals.totalOpeningDr + tbTotals.totalPeriodDr).toLocaleString()}
                </td>
                <td className="p-3 font-mono-num text-white">
                  {(tbTotals.totalOpeningCr + tbTotals.totalPeriodCr).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 4. Trial Balance by Balances (Sheet 22)
  if (mode === 'trial_balances') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>ميزان المراجعة بالأرصدة (Trial Balance by Balances)</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    tbBalances.isBalanced
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {tbBalances.isBalanced ? 'متوازن تماماً (الفرق = 0)' : 'يوجد فارق عدم اتزان'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                الفحص الذكي للأرصدة غير الطبيعية والشاذة ومقارنتها بالموازنة المعتمدة
              </p>
            </div>
          </div>
        </div>

        {/* Balances Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 w-28">كود الحساب</th>
                <th className="p-3 min-w-[200px]">اسم الحساب</th>
                <th className="p-3">المجموعة</th>
                <th className="p-3">الطبيعة الأصلية</th>
                <th className="p-3 font-bold text-emerald-400">رصيد ختامي مدين (ج.م)</th>
                <th className="p-3 font-bold text-amber-400">رصيد ختامي دائن (ج.م)</th>
                <th className="p-3">فحص الشذوذ الرقابي</th>
                <th className="p-3">الموازنة السنوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {tbBalances.rows.map((r) => (
                <tr key={r.accountId} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                  <td className="p-3 font-mono-num font-bold text-amber-400/90">{r.accountCode}</td>
                  <td className="p-3 font-semibold text-white">{r.accountName}</td>
                  <td className="p-3 text-[11px] text-slate-400">{r.type}</td>
                  <td className="p-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {r.naturalBalance === 'debit' ? 'مدين' : 'دائن'}
                    </span>
                  </td>
                  <td className="p-3 font-mono-num font-bold text-emerald-400 text-sm">
                    {r.closingDebit > 0 ? r.closingDebit.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 font-mono-num font-bold text-amber-400 text-sm">
                    {r.closingCredit > 0 ? r.closingCredit.toLocaleString() : '-'}
                  </td>
                  <td className="p-3">
                    {r.isAbnormal ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        رصيد شاذ غير طبيعي
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        طبيعي وسليم
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono-num text-slate-400">
                    {r.budgetAmount ? `${r.budgetAmount.toLocaleString()} ج.م` : '-'}
                  </td>
                </tr>
              ))}

              {/* Total row */}
              <tr className="bg-slate-900 font-bold text-white text-sm border-t-2 border-slate-700">
                <td colSpan={4} className="p-3 text-amber-300 font-bold">
                  إجمالي ميزان المراجعة بالأرصدة
                </td>
                <td className="p-3 font-mono-num text-emerald-400 text-base">
                  {tbBalances.totalClosingDr.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num text-amber-400 text-base">
                  {tbBalances.totalClosingCr.toLocaleString()}
                </td>
                <td colSpan={2} className="p-3 text-center">
                  <span className="text-emerald-400 font-bold">
                    {tbBalances.isBalanced ? 'التوازن تام بنسبة 100%' : 'تحذير: يوجد فارق'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. Monthly Reconciliation Matrix (Sheet 23)
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>مصفوفة المطابقة والرقابة الشهرية الشاملة (Monthly Reconciliation)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                كافة البنود مطابقة 100%
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              المطابقة التلقائية بين اليومية العامة، ميزان المراجعة، قائمة الدخل، والمركز المالي
            </p>
          </div>
        </div>
      </div>

      {/* Reconciliation Grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">بند المطابقة والرقابة</th>
              <th className="p-3">المصدر الرقابي الأول</th>
              <th className="p-3">القيمة الأولى (ج.م)</th>
              <th className="p-3">المصدر الرقابي المقابل</th>
              <th className="p-3">القيمة المقابلة (ج.م)</th>
              <th className="p-3">الفرق (ج.م)</th>
              <th className="p-3">حالة المطابقة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {reconMatrix.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                <td className="p-3 font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{item.item}</span>
                </td>
                <td className="p-3 text-slate-300">{item.source1Name}</td>
                <td className="p-3 font-mono-num font-bold text-white">
                  {item.source1Value.toLocaleString()}
                </td>
                <td className="p-3 text-slate-300">{item.source2Name}</td>
                <td className="p-3 font-mono-num font-bold text-white">
                  {item.source2Value.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num font-bold text-emerald-400">
                  {item.difference.toFixed(2)}
                </td>
                <td className="p-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    مطابق تماماً
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
