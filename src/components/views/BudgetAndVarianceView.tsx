import React, { useState } from 'react';
import {
  Calculator,
  LineChart,
  Search,
  Filter,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Bell,
  Sparkles,
  Flame,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { BudgetLine, Account, JournalEntry, SystemSettings } from '../../types/accounting';
import { calculateVarianceAnalysis } from '../../services/accountingEngine';

interface BudgetAndVarianceViewProps {
  mode: 'budget' | 'variance';
  budgets: BudgetLine[];
  accounts: Account[];
  entries: JournalEntry[];
  settings: SystemSettings;
}

export const BudgetAndVarianceView: React.FC<BudgetAndVarianceViewProps> = ({
  mode,
  budgets,
  accounts,
  entries,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [thresholdFilter, setThresholdFilter] = useState<'all' | 'over90' | 'warning' | 'safe'>('all');

  // Real-time calculation of variances & burn rates from approved journal entries
  const varianceData = calculateVarianceAnalysis(budgets, accounts, entries);

  // Filter items
  const filtered = varianceData.filter((item) => {
    const matchesSearch =
      item.accountCode.includes(searchQuery) ||
      item.accountName.includes(searchQuery) ||
      (item.costCenterName && item.costCenterName.includes(searchQuery));
    const matchesActivity = activityFilter === 'all' || item.activity === activityFilter;
    
    let matchesThreshold = true;
    if (thresholdFilter === 'over90') {
      matchesThreshold = item.burnRatePct >= 90;
    } else if (thresholdFilter === 'warning') {
      matchesThreshold = item.burnRatePct >= 80 && item.burnRatePct < 90;
    } else if (thresholdFilter === 'safe') {
      matchesThreshold = item.burnRatePct < 80;
    }

    return matchesSearch && matchesActivity && matchesThreshold;
  });

  const totalBudget = budgets.reduce((s, b) => s + b.annualBudget, 0);
  const totalActual = varianceData.reduce((s, v) => s + v.actual, 0);
  const totalRemaining = Math.max(0, totalBudget - totalActual);
  const overallBurnRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  // Real-time monitoring metrics for items exceeding 90%
  const over90Items = varianceData.filter((item) => item.burnRatePct >= 90);
  const warningItems = varianceData.filter((item) => item.burnRatePct >= 80 && item.burnRatePct < 90);
  const safeItems = varianceData.filter((item) => item.burnRatePct < 80);

  // Common Real-time Expense Monitoring Panel
  const renderRealtimeMonitoringHeader = () => (
    <div className="space-y-3">
      {/* Real-Time KPIs Top Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#12162B] via-[#0E1020] to-[#17143A] border border-[#2B3158] shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-rose-600 p-0.5 flex items-center justify-center shadow-lg shadow-rose-900/30">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>منظومة الرصد اللحظي لمصروفات الميزانية التقديرية</span>
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  رصد لحظي فوري
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
                  {settings.fiscalYearDisplay || '2025 / 2026'}
                </span>
              </div>
              <p className="text-xs text-slate-400 pt-0.5">
                مقارنة فورية بين المصروفات الفعلية المعتمدة بالدفاتر والميزانية التقديرية (BudgetLines)، مع تلوين فوري باللون الأحمر لأي بند يتجاوز 90% من مخصصاته المعتمدة.
              </p>
            </div>
          </div>

          {/* Quick Threshold Counts */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setThresholdFilter(thresholdFilter === 'over90' ? 'all' : 'over90')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                thresholdFilter === 'over90'
                  ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/40 ring-2 ring-rose-400'
                  : over90Items.length > 0
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>تجاوز 90% (خطر):</span>
              <span className="font-mono-num font-black text-sm px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200">
                {over90Items.length}
              </span>
            </button>

            <button
              onClick={() => setThresholdFilter(thresholdFilter === 'warning' ? 'all' : 'warning')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                thresholdFilter === 'warning'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/40'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>إنذار (80% - 89%):</span>
              <span className="font-mono-num font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">
                {warningItems.length}
              </span>
            </button>

            <button
              onClick={() => setThresholdFilter(thresholdFilter === 'safe' ? 'all' : 'safe')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                thresholdFilter === 'safe'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/40'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>نطاق آمن (&lt;80%):</span>
              <span className="font-mono-num font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200">
                {safeItems.length}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px]">الموازنة التقديرية المعتمدة:</span>
            <span className="text-sm sm:text-base font-bold text-amber-400 font-mono-num">
              {totalBudget.toLocaleString()} {settings.currencySymbol}
            </span>
            <div className="text-[10px] text-slate-500">لكافة الأنشطة ومراكز التكلفة</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px]">المصروفات الفعلية المحققة:</span>
            <span className="text-sm sm:text-base font-bold text-cyan-300 font-mono-num">
              {totalActual.toLocaleString()} {settings.currencySymbol}
            </span>
            <div className="text-[10px] text-slate-500">حسب القيود المعتمدة بالدفاتر</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px]">المتبقي من الموازنة:</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono-num">
              {totalRemaining.toLocaleString()} {settings.currencySymbol}
            </span>
            <div className="text-[10px] text-emerald-400/80">سيولة اعتمادات متاحة</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 block text-[11px]">معدل الاستهلاك الإجمالي:</span>
              <span className={`font-mono-num font-bold text-xs ${overallBurnRate >= 90 ? 'text-rose-400' : overallBurnRate >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {overallBurnRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallBurnRate >= 90 ? 'bg-rose-500' : overallBurnRate >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, overallBurnRate)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 pt-0.5">
              {overallBurnRate >= 90 ? 'حرج: تجاوز 90%' : overallBurnRate >= 80 ? 'تنبيه: اقتراب من الحد' : 'استهلاك مستقر وطبيعي'}
            </div>
          </div>
        </div>

        {/* High-Visibility Red Alert Banner if any budget lines exceeded 90% */}
        {over90Items.length > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-slate-950 to-rose-950/70 border-2 border-rose-500/80 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center animate-bounce shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-rose-200">
                    تنبيه رقابي حرج: تجاوز ({over90Items.length}) بند من بنود الميزانية 90% من مخصصاتها المعتمدة!
                  </h4>
                  <p className="text-[11px] text-rose-300/90">
                    تم تلوين هذه البنود باللون الأحمر داخل الجدول أدناه. يوصى بوقف إصدار أذون الصرف الإضافية أو إجراء مناقلة مالية بين البنود.
                  </p>
                </div>
              </div>

              {thresholdFilter !== 'over90' && (
                <button
                  onClick={() => setThresholdFilter('over90')}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-rose-100 text-xs font-bold border border-rose-400/50 transition-colors cursor-pointer shrink-0"
                >
                  عزل وعرض المتجاوزين فقط
                </button>
              )}
            </div>

            {/* Badges of affected lines */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-rose-500/30">
              {over90Items.map((item) => (
                <span
                  key={item.id}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-900/60 border border-rose-400/60 text-white font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span className="font-mono-num text-rose-300 font-bold">[{item.accountCode}]</span>
                  <span>{item.accountName}:</span>
                  <span className="font-mono-num font-bold text-rose-200">
                    استهلاك {item.burnRatePct.toFixed(1)}% ({item.actual.toLocaleString()} من {item.annualBudget.toLocaleString()} ج.م)
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بكود الحساب أو اسم البند أو مركز التكلفة..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">تصفية النشاط:</span>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="all">كافة الأنشطة</option>
            <option value="حج">نشاط الحج</option>
            <option value="عمرة">نشاط العمرة</option>
            <option value="معارض">نشاط المعارض والملابس</option>
            <option value="إداري وعمومي">مصروفات إدارية وعمومية</option>
          </select>

          {thresholdFilter !== 'all' && (
            <button
              onClick={() => setThresholdFilter('all')}
              className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
            >
              إلغاء التصفية ({filtered.length} بند معروض)
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (mode === 'budget') {
    return (
      <div className="space-y-4">
        {/* Real-time Monitoring Header & KPIs */}
        {renderRealtimeMonitoringHeader()}

        {/* Table Title Bar */}
        <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">
              جدول الموازنة التقديرية السنوية والربع سنوية مع الرصد اللحظي للإنفاق الفعلي
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              تظليل أحمر = تجاوز 90% من المخصص
            </span>
            <span className="text-slate-400">إجمالي البنود: {filtered.length}</span>
          </div>
        </div>

        {/* Budget Table with Real-time Actual and >90% Red Highlight */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 w-24">كود الحساب</th>
                <th className="p-3 min-w-[180px]">اسم البند المحاسبي</th>
                <th className="p-3">النشاط المرتبط</th>
                <th className="p-3">مركز التكلفة</th>
                <th className="p-3 font-bold text-amber-400">الموازنة السنوية (ج.م)</th>
                <th className="p-3 font-bold text-cyan-300 bg-cyan-950/20">الفعلي المحقق (لحظي)</th>
                <th className="p-3 font-bold text-rose-300 bg-rose-950/20">نسبة الاستهلاك %</th>
                <th className="p-3 font-mono-num">
                  <span>الربع الأول Q1</span>
                  <span className="block text-[10px] text-slate-400 font-normal">01/07 - 30/09</span>
                </th>
                <th className="p-3 font-mono-num">
                  <span>الربع الثاني Q2</span>
                  <span className="block text-[10px] text-slate-400 font-normal">01/10 - 31/12</span>
                </th>
                <th className="p-3 font-mono-num bg-amber-500/10 text-amber-300">
                  <span>الربع الثالث Q3</span>
                  <span className="block text-[10px] text-amber-400 font-normal">01/01 - 31/03 (حالي)</span>
                </th>
                <th className="p-3 font-mono-num">
                  <span>الربع الرابع Q4</span>
                  <span className="block text-[10px] text-rose-400 font-normal">01/04 - 30/06</span>
                </th>
                <th className="p-3">حالة الرصد اللحظي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((item) => {
                const isOver90 = item.burnRatePct >= 90;
                const isWarning = item.burnRatePct >= 80 && item.burnRatePct < 90;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isOver90
                        ? 'bg-rose-950/60 hover:bg-rose-900/60 border-l-4 border-l-rose-500 text-rose-100 font-semibold'
                        : isWarning
                        ? 'bg-amber-950/30 hover:bg-amber-900/40 border-l-4 border-l-amber-500 text-slate-200'
                        : 'hover:bg-slate-900/40 text-slate-300'
                    }`}
                  >
                    <td className="p-3 font-mono-num font-bold">
                      <span className={isOver90 ? 'text-rose-300' : 'text-amber-300'}>
                        {item.accountCode}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        {isOver90 && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />}
                        <span>{item.accountName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-[11px] text-slate-300">{item.activity}</td>
                    <td className="p-3 text-slate-400">{item.costCenterName || 'عام'}</td>
                    <td className="p-3 font-mono-num font-bold text-amber-400 text-sm">
                      {item.annualBudget.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono-num font-bold text-cyan-300 bg-cyan-950/10">
                      {item.actual.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono-num font-bold bg-rose-950/10">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            isOver90
                              ? 'bg-rose-600 text-white font-black animate-pulse shadow'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.burnRatePct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-mono-num text-slate-300">{item.q1Budget.toLocaleString()}</td>
                    <td className="p-3 font-mono-num text-slate-300">{item.q2Budget.toLocaleString()}</td>
                    <td className="p-3 font-mono-num text-slate-300">{item.q3Budget.toLocaleString()}</td>
                    <td className="p-3 font-mono-num text-slate-300">{item.q4Budget.toLocaleString()}</td>
                    <td className="p-3">
                      {isOver90 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-md shadow-rose-900/40">
                          <Flame className="w-3 h-3" />
                          تجاوز 90% (خطر)
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Bell className="w-3 h-3" />
                          إنذار (80%+)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          آمن ومستقر
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Variance Analysis (Sheet 26)
  return (
    <div className="space-y-4">
      {/* Real-time Monitoring Header & KPIs */}
      {renderRealtimeMonitoringHeader()}

      {/* Variance Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3 w-28">كود الحساب</th>
              <th className="p-3 min-w-[200px]">اسم البند المحاسبي</th>
              <th className="p-3 font-bold text-white">الفعلي المحقق (ج.م)</th>
              <th className="p-3 font-bold text-amber-400">الموازنة المعتمدة (ج.م)</th>
              <th className="p-3">الانحراف بالقيمة</th>
              <th className="p-3">نسبة الانحراف %</th>
              <th className="p-3 min-w-[170px]">معدل استهلاك الموازنة (الرصد اللحظي)</th>
              <th className="p-3">تقييم الأداء</th>
              <th className="p-3">توقع ختام العام</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map((v) => {
              const isOver90 = v.burnRatePct >= 90;
              const isWarning = v.burnRatePct >= 80 && v.burnRatePct < 90;

              return (
                <tr
                  key={v.id}
                  className={`transition-colors ${
                    isOver90
                      ? 'bg-rose-950/60 hover:bg-rose-900/60 border-l-4 border-l-rose-500 text-rose-100 font-semibold'
                      : isWarning
                      ? 'bg-amber-950/30 hover:bg-amber-900/40 border-l-4 border-l-amber-500 text-slate-200'
                      : 'hover:bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <td className="p-3 font-mono-num font-bold">
                    <span className={isOver90 ? 'text-rose-300 font-black' : 'text-amber-300'}>
                      {v.accountCode}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      {isOver90 && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />}
                      <span>{v.accountName}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono-num font-bold text-white text-sm">
                    {v.actual.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono-num font-bold text-amber-400">
                    {v.annualBudget.toLocaleString()}
                  </td>
                  <td
                    className={`p-3 font-mono-num font-bold ${
                      v.isFavorable ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {v.varianceVal > 0 ? `+${v.varianceVal.toLocaleString()}` : v.varianceVal.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono-num font-bold text-slate-300">
                    {v.variancePct.toFixed(1)}%
                  </td>
                  <td className="p-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-mono-num font-bold ${isOver90 ? 'text-rose-300 font-black' : 'text-slate-200'}`}>
                          {v.burnRatePct.toFixed(1)}%
                        </span>
                        {isOver90 ? (
                          <span className="text-rose-300 font-black flex items-center gap-1 bg-rose-500/30 px-1.5 py-0.2 rounded border border-rose-500/50 animate-pulse text-[10px]">
                            <Flame className="w-3 h-3 text-rose-400" /> تجاوز 90% (خطر)
                          </span>
                        ) : isWarning ? (
                          <span className="text-amber-400 font-bold flex items-center gap-0.5 text-[10px]">
                            <Bell className="w-3 h-3" /> تنبيه (80%+)
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold text-[10px]">
                            آمن (&lt;80%)
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver90
                              ? 'bg-rose-500 shadow-sm shadow-rose-500/60'
                              : isWarning
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, v.burnRatePct)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isOver90
                          ? 'bg-rose-500 text-white font-black shadow'
                          : v.isFavorable
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      {isOver90 ? 'تجاوز حرج' : v.isFavorable ? 'مواتٍ / إيجابي' : 'غير مواتٍ'}
                    </span>
                  </td>
                  <td className="p-3 font-mono-num text-slate-400">
                    {v.forecastYearEnd.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

