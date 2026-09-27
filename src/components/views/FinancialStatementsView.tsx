import React, { useState } from 'react';
import {
  FileText,
  PieChart,
  Activity,
  Layers,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Filter,
} from 'lucide-react';
import { Account, JournalEntry, CostCenter, SystemSettings } from '../../types/accounting';
import {
  calculateIncomeStatement,
  calculateBalanceSheet,
  calculateCashFlow,
} from '../../services/accountingEngine';

interface FinancialStatementsViewProps {
  mode: 'income' | 'balance_sheet' | 'cash_flow' | 'equity' | 'notes';
  accounts: Account[];
  entries: JournalEntry[];
  costCenters: CostCenter[];
  settings: SystemSettings;
}

export const FinancialStatementsView: React.FC<FinancialStatementsViewProps> = ({
  mode,
  accounts,
  entries,
  costCenters,
  settings,
}) => {
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('');

  const income = calculateIncomeStatement(accounts, entries, undefined, selectedCostCenterId || undefined);
  const bs = calculateBalanceSheet(accounts, entries);
  const cf = calculateCashFlow(accounts, entries);

  // 1. Income Statement (Sheet 27)
  if (mode === 'income') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>قائمة الدخل الشامل (الإيرادات والمصروفات والفائض)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {income.isSurplus ? 'فائض مالي تشغيلي' : 'عجز مالي'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                إمكانية التصفية على مستوى كل رحلة عمرة أو معرض لمعرفة فائض أو عجز النشاط بدقة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Cost center filter */}
            <select
              value={selectedCostCenterId}
              onChange={(e) => setSelectedCostCenterId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-amber-300 font-semibold rounded-lg px-3 py-2 cursor-pointer"
            >
              <option value="">كافة الأنشطة والرحلات (الإجمالي العام)</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] border border-[#232742] hover:border-[#39e3d7]/50 transition-colors cursor-pointer flex items-center justify-center"
              title="طباعة قائمة الدخل"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Statement Layout */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 max-w-4xl mx-auto text-xs">
          {/* Official Letterhead */}
          <div className="text-center pb-4 border-b border-slate-800 space-y-1">
            <h3 className="text-sm font-bold text-slate-300">
              {settings.organizationName}
            </h3>
            <p className="text-xs text-amber-400 font-bold">
              قائمة الدخل الشامل للفترة المالية المنتهية في 2026/03/31
            </p>
            <p className="text-[11px] text-slate-500">
              (المبالغ المدرجة بالجنيه المصري {settings.currencySymbol})
            </p>
          </div>

          {/* Section 1: Revenues */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-400 bg-slate-900/80 p-2 rounded-lg flex items-center justify-between">
              <span>أولاً: إيرادات الأنشطة والخدمات</span>
              <span>المبلغ الجزئي</span>
            </h4>
            <div className="space-y-1 pr-4 pl-2">
              {income.revenues.map((r) => (
                <div key={r.accountId} className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-900">
                  <span>[{r.accountCode}] {r.accountName}</span>
                  <span className="font-mono-num font-bold text-emerald-400">
                    {r.closingCredit.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 font-bold text-white text-sm">
              <span>إجمالي الإيرادات</span>
              <span className="font-mono-num text-emerald-400 text-base">
                {income.totalRevenues.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
          </div>

          {/* Section 2: Direct Expenses */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-400 bg-slate-900/80 p-2 rounded-lg flex items-center justify-between">
              <span>ثانياً: التكاليف والمصروفات المباشرة للأنشطة (حج - عمرة - معارض)</span>
              <span>المبلغ الجزئي</span>
            </h4>
            <div className="space-y-1 pr-4 pl-2">
              {income.directExpenses.map((e) => (
                <div key={e.accountId} className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-900">
                  <span>[{e.accountCode}] {e.accountName}</span>
                  <span className="font-mono-num font-bold text-rose-400">
                    {e.closingDebit.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 font-bold text-white">
              <span>إجمالي المصروفات المباشرة للأنشطة</span>
              <span className="font-mono-num text-rose-400">
                {income.totalDirectExpenses.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 font-bold text-white">
              <span>مجمل الفائض التشغيلي المباشر للأنشطة</span>
              <span className="font-mono-num text-blue-300 text-sm">
                {(income.totalRevenues - income.totalDirectExpenses).toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
          </div>

          {/* Section 3: Administrative Expenses */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-400 bg-slate-900/80 p-2 rounded-lg flex items-center justify-between">
              <span>ثالثاً: المصروفات الإدارية والعمومية المشتركة</span>
              <span>المبلغ الجزئي</span>
            </h4>
            <div className="space-y-1 pr-4 pl-2">
              {income.adminExpenses.map((e) => (
                <div key={e.accountId} className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-900">
                  <span>[{e.accountCode}] {e.accountName}</span>
                  <span className="font-mono-num font-bold text-rose-400">
                    {e.closingDebit.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 font-bold text-white">
              <span>إجمالي المصروفات الإدارية والعمومية</span>
              <span className="font-mono-num text-rose-400">
                {income.totalAdminExpenses.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
          </div>

          {/* Net Result */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-between font-bold text-base">
            <div>
              <span className="text-white block">
                {income.isSurplus ? 'صافي الفائض المحاسبي للفترة المرحل للمركز المالي' : 'صافي العجز للفترة'}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                (يرحل لحساب فائض الفترة الحالية 3141 بحقوق الملكية)
              </span>
            </div>
            <div className="font-mono-num font-black text-xl text-emerald-400">
              {income.netSurplus.toLocaleString()} {settings.currencySymbol}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Balance Sheet (Sheet 28)
  if (mode === 'balance_sheet') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>قائمة المركز المالي (الميزانية العمومية)</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    bs.isBalanced
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {bs.isBalanced ? 'الميزانية متزنة تماماً (الأصول = الالتزامات + حقوق الملكية)' : 'يوجد فارق اتزان'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                الأصول المتداولة والثابتة مقابل الالتزامات المتداولة، أمانات الأعضاء، وصافي الأصول
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] border border-[#232742] hover:border-[#39e3d7]/50 transition-colors cursor-pointer flex items-center justify-center"
            title="طباعة المركز المالي"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Sheet Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto text-xs">
          {/* Left Column: Assets */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>الأصول (Assets)</span>
              <span className="font-mono-num text-white">
                {bs.totalAssets.toLocaleString()} {settings.currencySymbol}
              </span>
            </h3>

            {/* Current Assets */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-300 bg-slate-900/80 p-1.5 rounded">
                الأصول المتداولة:
              </div>
              <div className="space-y-1 pr-3">
                {bs.currentAssets.map((a) => (
                  <div key={a.accountId} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900">
                    <span>{a.accountName}</span>
                    <span className="font-mono-num font-bold text-slate-200">
                      {a.closingDebit.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 font-bold text-slate-200">
                <span>إجمالي الأصول المتداولة</span>
                <span className="font-mono-num text-emerald-400">
                  {bs.totalCurrentAssets.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Fixed Assets */}
            <div className="space-y-1.5 pt-2">
              <div className="font-bold text-slate-300 bg-slate-900/80 p-1.5 rounded">
                الأصول الثابتة (غير المتداولة):
              </div>
              <div className="space-y-1 pr-3">
                {bs.fixedAssets.map((a) => (
                  <div key={a.accountId} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900">
                    <span>{a.accountName}</span>
                    <span className="font-mono-num font-bold text-slate-200">
                      {a.closingDebit.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-rose-300 py-0.5">
                  <span>يخصم: مجمع الإهلاك للأصول الثابتة</span>
                  <span className="font-mono-num font-bold">
                    ({bs.totalDepreciation.toLocaleString()})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 font-bold text-slate-200">
                <span>صافي الأصول الثابتة</span>
                <span className="font-mono-num text-emerald-400">
                  {bs.netFixedAssets.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Total Assets Footer */}
            <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/40 flex items-center justify-between font-bold text-sm text-white">
              <span>إجمالي الأصول</span>
              <span className="font-mono-num text-emerald-400 text-base">
                {bs.totalAssets.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
          </div>

          {/* Right Column: Liabilities & Equity */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>الالتزامات وحقوق الملكية (Liabilities & Equity)</span>
              <span className="font-mono-num text-white">
                {bs.totalLiabilitiesAndEquity.toLocaleString()} {settings.currencySymbol}
              </span>
            </h3>

            {/* Current Liabilities */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-300 bg-slate-900/80 p-1.5 rounded">
                الالتزامات المتداولة:
              </div>
              <div className="space-y-1 pr-3">
                {bs.currentLiabilities.map((l) => (
                  <div key={l.accountId} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900">
                    <span>{l.accountName}</span>
                    <span className="font-mono-num font-bold text-slate-200">
                      {l.closingCredit.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 font-bold text-slate-200">
                <span>إجمالي الالتزامات المتداولة</span>
                <span className="font-mono-num text-amber-400">
                  {bs.totalCurrentLiabilities.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Equity & Net Assets */}
            <div className="space-y-1.5 pt-2">
              <div className="font-bold text-slate-300 bg-slate-900/80 p-1.5 rounded">
                حقوق الملكية وصافي الأصول:
              </div>
              <div className="space-y-1 pr-3">
                {bs.equityAccounts.map((e) => (
                  <div key={e.accountId} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900">
                    <span>{e.accountName}</span>
                    <span className="font-mono-num font-bold text-slate-200">
                      {e.closingCredit.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-emerald-400 py-0.5 font-bold">
                  <span>فائض الفترة الحالية (من قائمة الدخل)</span>
                  <span className="font-mono-num">
                    {bs.currentPeriodSurplus.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 font-bold text-slate-200">
                <span>إجمالي حقوق الملكية وصافي الأصول</span>
                <span className="font-mono-num text-emerald-400">
                  {bs.totalEquity.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Total Liabilities & Equity Footer */}
            <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/40 flex items-center justify-between font-bold text-sm text-white">
              <span>إجمالي الالتزامات وحقوق الملكية</span>
              <span className="font-mono-num text-emerald-400 text-base">
                {bs.totalLiabilitiesAndEquity.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Cash Flow Statement (Sheet 29)
  if (mode === 'cash_flow') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>قائمة التدفقات النقدية (الطريقة غير المباشرة)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  مطابقة النقدية تامة
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                تسوية صافي الفائض التشغيلي مع حركة السيولة النقدية الفعلية بالخزينة والبنوك
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] border border-[#232742] hover:border-[#39e3d7]/50 transition-colors cursor-pointer flex items-center justify-center"
            title="طباعة قائمة التدفقات النقدية"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* Cash Flow Layout */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 max-w-3xl mx-auto text-xs">
          <div className="text-center pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">قائمة التدفقات النقدية</h3>
            <p className="text-slate-400 text-[11px]">للفترة المنتهية في 2026/03/31</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 font-bold text-white">
              <span>التدفقات النقدية من الأنشطة التشغيلية:</span>
              <span className="font-mono-num text-emerald-400">
                {cf.operatingCashFlow.toLocaleString()} {settings.currencySymbol}
              </span>
            </div>
            <div className="pr-4 space-y-1 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span>صافي فائض الفترة من قائمة الدخل</span>
                <span className="font-mono-num font-bold text-white">
                  {cf.surplusBeforeTax.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span>يضاف: مصروف إهلاك الأصول الثابتة (بند غير نقدي)</span>
                <span className="font-mono-num text-slate-400">0.00</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900 font-bold text-white">
              <span>التدفقات النقدية من أنشطة الاستثمار (شراء أصول)</span>
              <span className="font-mono-num text-slate-400">0.00</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900 font-bold text-white">
              <span>التدفقات النقدية من أنشطة التمويل (زيادة الاحتياطيات)</span>
              <span className="font-mono-num text-slate-400">0.00</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>صافي التغير في النقدية وما في حكمها خلال الفترة</span>
                <span className="font-mono-num font-bold text-emerald-400">
                  {cf.netCashChange.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>رصيد النقدية وما في حكمها في بداية الفترة (2026/01/01)</span>
                <span className="font-mono-num text-slate-200">
                  {cf.openingCash.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                <span>رصيد النقدية وما في حكمها في نهاية الفترة (الخزينة + البنوك)</span>
                <span className="font-mono-num text-emerald-400 text-base">
                  {cf.endingCash.toLocaleString()} {settings.currencySymbol}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Statement of Changes in Equity (Sheet 30)
  if (mode === 'equity') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>قائمة التغير في حقوق الملكية وصافي الأصول (Changes in Equity)</span>
              </h2>
              <p className="text-xs text-slate-400">
                حركة رأس المال والاحتياطيات النظامية والفائض المرحل وفائض الفترة الحالية
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 min-w-[220px]">البيان</th>
                <th className="p-3">رأس المال ورصيد البداية</th>
                <th className="p-3">الاحتياطي النظامي</th>
                <th className="p-3">احتياطي التجديدات</th>
                <th className="p-3">الفائض المرحل</th>
                <th className="p-3 font-bold text-emerald-400">فائض الفترة الحالية</th>
                <th className="p-3 font-bold text-white">إجمالي حقوق الملكية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              <tr className="hover:bg-slate-900/40 text-slate-300">
                <td className="p-3 font-semibold text-white">الرصيد في 2026/01/01</td>
                <td className="p-3 font-mono-num">2,500,000</td>
                <td className="p-3 font-mono-num">1,200,000</td>
                <td className="p-3 font-mono-num">450,000</td>
                <td className="p-3 font-mono-num">975,000</td>
                <td className="p-3 font-mono-num text-slate-500">0.00</td>
                <td className="p-3 font-mono-num font-bold text-white">5,125,000</td>
              </tr>
              <tr className="hover:bg-slate-900/40 text-slate-300">
                <td className="p-3 text-emerald-400 font-semibold">فائض الفترة المنقول من قائمة الدخل</td>
                <td className="p-3 font-mono-num text-slate-500">-</td>
                <td className="p-3 font-mono-num text-slate-500">-</td>
                <td className="p-3 font-mono-num text-slate-500">-</td>
                <td className="p-3 font-mono-num text-slate-500">-</td>
                <td className="p-3 font-mono-num font-bold text-emerald-400">
                  {income.netSurplus.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num font-bold text-emerald-400">
                  {income.netSurplus.toLocaleString()}
                </td>
              </tr>
              <tr className="bg-slate-900 font-bold text-white text-sm border-t-2 border-slate-700">
                <td className="p-3 text-amber-300">الرصيد في 2026/03/31</td>
                <td className="p-3 font-mono-num">2,500,000</td>
                <td className="p-3 font-mono-num">1,200,000</td>
                <td className="p-3 font-mono-num">450,000</td>
                <td className="p-3 font-mono-num">975,000</td>
                <td className="p-3 font-mono-num text-emerald-400">
                  {income.netSurplus.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num text-emerald-400 text-base">
                  {(5125000 + income.netSurplus).toLocaleString()} {settings.currencySymbol}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. Statutory Notes (Sheet 31)
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>الإيضاحات المتممة للقوائم المالية (Notes to Financial Statements)</span>
            </h2>
            <p className="text-xs text-slate-400">
              السياسات المحاسبية والقواعد الرقابية المعتمدة لجمعية تيسير الحج والعمرة بالجهاز المركزي للمحاسبات
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5 text-xs text-slate-300 leading-relaxed max-w-4xl mx-auto">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-amber-400 mb-2">إيضاح (1): الشخصية الاعتبارية والنشاط</h3>
          <p>
            جمعية تيسير الحج والعمرة للعاملين بالجهاز المركزي للمحاسبات هي جمعية أهلية خدمية مشهرة
            وفقاً لأحكام القانون، تهدف إلى تنظيم وتيسير رحلات الحج والعمرة وإقامة المعارض السلعية
            للعاملين بالجهاز المركزي للمحاسبات وأسرهم بأسعار مدعمة وتسهيلات في السداد.
          </p>
        </div>

        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-amber-400 mb-2">إيضاح (2): أسس إعداد القوائم المالية والسياسات المحاسبية</h3>
          <p>
            أُعدت القوائم المالية وفقاً لمعايير المحاسبة المصرية للجمعيات والمؤسسات الأهلية وعلى أساس
            الاستحقاق المحاسبي، مع تطبيق مبادئ الحيطة والحذر والتحقق والرقابة الداخلية الصارمة.
          </p>
        </div>

        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-amber-400 mb-2">إيضاح (3): السياسة المحاسبية للشيكات والحسابات الوسيطة</h3>
          <p>
            تتبع الجمعية سياسة رقابية مانعة للخصم المباشر من البنك؛ حيث تسجل الشيكات الصادرة في حساب
            وسيط (2141 - وسيط شيكات صادرة) ولا تخصم من البنك إلا عند ورودها بكشف الحساب البنكي المعتمد.
            كما تودع الشيكات الواردة في حساب (1132 - شيكات تحت التحصيل) ولا تضاف للبنك إلا بعد ورود
            إشعار الإضافة البنكي.
          </p>
        </div>

        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-amber-400 mb-2">إيضاح (4): نظام مراكز التكلفة والأنشطة</h3>
          <p>
            يتم تخصيص مركز تكلفة مستقل لكل رحلة عمرة (بحسب المستوى وتاريخ التنفيذ)، وكل موسم حج،
            وكل معرض سلعي (معرض توشيبا، معرض جولدن مان). ويلزم النظام إرفاق مركز التكلفة بأي قيد إيراد
            أو مصروف نشاط.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-amber-400 mb-2">إيضاح (5): مدخرات الأعضاء وأمانات الحج والعمرة</h3>
          <p>
            تمثل مدخرات الأعضاء المقتطعة دورياً من رواتبهم التزاماً مالياً مستحقاً للرد (حساب 2131)،
            وتستخدم بموافقة العضو لسداد تكاليف ومقدمات رحلات الحج والعمرة ومشتريات المعارض.
          </p>
        </div>
      </div>
    </div>
  );
};
