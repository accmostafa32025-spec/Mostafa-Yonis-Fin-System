import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Building2,
  FileCheck,
  Sparkles,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import {
  JournalEntry,
  Account,
  CostCenter,
  CheckTransaction,
  SystemSettings,
  AuditCheckResult,
  SheetKey,
} from '../../types/accounting';
import { runSystemComprehensiveAudit } from '../../services/validationEngine';
import { calculateTrialBalanceBalances, calculateBalanceSheet } from '../../services/accountingEngine';
import { AuditAnalyticsView } from './AuditAnalyticsView';

interface AuditControlsViewProps {
  entries: JournalEntry[];
  accounts: Account[];
  costCenters: CostCenter[];
  checks: CheckTransaction[];
  settings: SystemSettings;
  onNavigate: (key: SheetKey) => void;
  onOpenTechnicalAudit?: () => void;
}

export const AuditControlsView: React.FC<AuditControlsViewProps> = ({
  entries,
  accounts,
  costCenters,
  checks,
  settings,
  onNavigate,
  onOpenTechnicalAudit,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'rules'>('analytics');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tb = calculateTrialBalanceBalances(accounts, entries);
  const bs = calculateBalanceSheet(accounts, entries);

  const auditResults = runSystemComprehensiveAudit(
    entries,
    accounts,
    costCenters,
    checks,
    settings,
    tb.totalClosingDr - tb.totalClosingCr,
    bs.difference
  );

  const validCount = auditResults.filter((r) => r.status === 'valid').length;
  const warningCount = auditResults.filter((r) => r.status === 'warning').length;
  const errorCount = auditResults.filter((r) => r.status === 'error').length;
  const cfoOverriddenCount = entries.filter((e) => e.cfoOverride).length;

  const filtered = auditResults.filter((r) => {
    const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch =
      r.ruleTitle.includes(searchQuery) ||
      r.details.includes(searchQuery) ||
      r.category.includes(searchQuery);

    return matchesCat && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-[#3632c7] to-[#39e3d7] text-white shadow-lg shadow-[#3632c7]/30 border border-[#39e3d7]/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-300" />
            <span>لوحة التحليلات والرسوم البيانية الرقابية (Recharts Analytics)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 font-bold border border-emerald-500/30">
              تفاعلي
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-gradient-to-r from-[#3632c7] to-[#39e3d7] text-white shadow-lg shadow-[#3632c7]/30 border border-[#39e3d7]/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>قائمة فحص قواعد الرقابة التفصيلية (25 قاعدة)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-bold">
              {auditResults.length} قاعدة
            </span>
          </button>

          {onOpenTechnicalAudit && (
            <button
              onClick={onOpenTechnicalAudit}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/50 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>إجراء المراجعة التقنية والرقابة المحاسبية الشاملة</span>
            </button>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 pl-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>منظومة الرقابة الذكية بالجهاز المركزي للمحاسبات</span>
        </div>
      </div>

      {/* Render Dedicated Analytics Page or Rules Checklist */}
      {activeTab === 'analytics' ? (
        <AuditAnalyticsView
          entries={entries}
          accounts={accounts}
          costCenters={costCenters}
          checks={checks}
          settings={settings}
          auditResults={auditResults}
          onNavigate={onNavigate}
          onSwitchToRulesTab={() => setActiveTab('rules')}
        />
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>لوحة الرقابة والمراجعة الداخلية الذكية (Internal Audit Engine)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold font-mono-num">
                25 قاعدة فحص
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              فحص شامل وتلقائي لصحة الدورة المحاسبية والأرصدة الشاذة وتوازن المركز المالي
            </p>
          </div>
        </div>

        {/* Audit Score Stats */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{validCount} سليم</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/30 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{warningCount} تنبيه</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/30 font-bold">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>{errorCount} خطأ مانع</span>
          </div>
          {cfoOverriddenCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/30 font-bold">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>{cfoOverriddenCount} مصادق بكلمة سر CFO</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في قواعد الفحص الـ 25..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كافة مجالات الفحص الرقابي</option>
            <option value="التوازن المحاسبي">التوازن المحاسبي</option>
            <option value="مراكز التكلفة">مراكز التكلفة والأنشطة</option>
            <option value="الدورة المستندية">الدورة المستندية والترحيل</option>
            <option value="البنوك والشيكات">البنوك والشيكات الوسيطة</option>
            <option value="الأرصدة والموازنة">الأرصدة الشاذة والموازنة</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كافة الحالات (سليم / تنبيه / خطأ)</option>
            <option value="valid">السليم فقط (صحيح)</option>
            <option value="warning">التنبيهات والملاحظات فقط</option>
            <option value="error">الأخطاء والمخالفات فقط</option>
          </select>
        </div>
      </div>

      {/* 25 Audit Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((check) => {
          const isValid = check.status === 'valid';
          const isWarning = check.status === 'warning';
          const isError = check.status === 'error';

          return (
            <div
              key={check.id}
              className={`p-4 rounded-xl border transition-all space-y-2 bg-slate-950/80 ${
                isValid
                  ? 'border-emerald-500/30 hover:border-emerald-500/50'
                  : isWarning
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-rose-500/50 bg-rose-950/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono-num font-bold text-amber-400/90">
                        #{check.id}
                      </span>
                      <h3 className="text-xs font-bold text-white">{check.ruleTitle}</h3>
                    </div>
                    <span className="text-[10px] text-slate-400">{check.category}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                    isValid
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : isWarning
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  {isValid ? 'سليم' : isWarning ? 'تنبيه' : 'خطأ مانع'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pr-6">
                {check.details}
              </p>
            </div>
          );
        })}
          </div>
        </div>
      )}
    </div>
  );
};
