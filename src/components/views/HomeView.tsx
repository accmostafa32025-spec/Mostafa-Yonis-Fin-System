import React from 'react';
import {
  Building2,
  TrendingUp,
  Coins,
  PiggyBank,
  CheckCircle2,
  BookOpen,
  Scale,
  PieChart,
  ArrowRight,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Bell,
  Clock,
  AlertTriangle,
  Calendar,
  PlusCircle,
  FileSpreadsheet,
  LayoutDashboard,
} from 'lucide-react';
import {
  Account,
  CostCenter,
  Member,
  JournalEntry,
  CheckTransaction,
  SystemSettings,
  SheetKey,
  ScheduledReviewTask,
} from '../../types/accounting';
import { ALL_SHEETS } from '../SheetNav';
import {
  evaluatePeriodClosing,
  generateSmartAlerts,
} from '../../services/alertScheduleEngine';

interface HomeViewProps {
  settings: SystemSettings;
  accounts: Account[];
  costCenters: CostCenter[];
  members: Member[];
  entries: JournalEntry[];
  checks: CheckTransaction[];
  scheduledTasks?: ScheduledReviewTask[];
  onNavigate: (key: SheetKey) => void;
  onOpenNewVoucher: () => void;
  onExportFullExcel: () => void;
  onOpenTechnicalAudit?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  settings,
  accounts,
  costCenters,
  members,
  entries,
  checks,
  scheduledTasks = [],
  onNavigate,
  onOpenNewVoucher,
  onExportFullExcel,
  onOpenTechnicalAudit,
}) => {
  const approvedEntries = entries.filter((e) => e.status === 'approved');
  const draftEntries = entries.filter((e) => e.status === 'draft');
  const totalSavings = members.reduce((s, m) => s + m.savingsBalance, 0);
  const totalChecksInCollection = checks
    .filter((c) => c.status === 'in_collection')
    .reduce((s, c) => s + c.amount, 0);

  // Period closing & smart alerts evaluation
  const closingStatus = evaluatePeriodClosing(settings, entries, accounts, checks);
  const smartAlerts = generateSmartAlerts(settings, entries, accounts, checks, scheduledTasks);
  const urgentAlerts = smartAlerts.filter((a) => a.severity === 'critical' || a.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner in Pulvent Brand Identity */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171647] via-[#0B0D17] to-[#131626] border border-[#2A2775] p-6 md:p-8 shadow-2xl">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#39e3d7]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#3632c7]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3632c7]/25 border border-[#39e3d7]/30 text-[#39e3d7] text-xs font-semibold shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-[#39e3d7]" />
              <span>الجهاز المركزي للمحاسبات - جمهورية مصر العربية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              جمعية تيسير الحج والعمرة للعاملين بالجهاز
            </h1>
            <p className="text-sm text-[#D7D6F4] max-w-2xl leading-relaxed">
              نظام محاسبي عربي متكامل ومؤتمت يعمل ببيئة Microsoft Excel 365 والويب، يغطي الدورة
              المستندية والمالية بالكامل من إدخال القيد والرقابة الذكية حتى إعداد موازين المراجعة
              والقوائم المالية والداشبورد التنفيذي.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#8E92BC]">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#39e3d7]" />
                <span className="text-white font-medium">الدورة المحاسبية الكاملة</span> (35 ورقة عمل)
              </span>
              <span className="text-[#3632c7]">•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#39e3d7]" />
                <span className="text-white font-medium">محرك الفحص الرقابي الذكي</span> (25 قاعدة)
              </span>
              <span className="text-[#3632c7]">•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#39e3d7]" />
                <span className="text-white font-medium">تصدير Excel 365</span> احترافي شامل
              </span>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={onOpenNewVoucher}
              className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold shadow-xl shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all text-sm cursor-pointer active:scale-95 group"
            >
              <PlusCircle className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
              <span>تسجيل قيد محاسبي جديد</span>
            </button>
            <button
              onClick={onExportFullExcel}
              className="flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#131626] hover:bg-[#1b1f36] text-[#39e3d7] hover:text-white font-semibold shadow transition-all text-xs border border-[#39e3d7]/40 hover:border-[#39e3d7] cursor-pointer group"
            >
              <FileSpreadsheet className="w-5 h-5 text-[#39e3d7] group-hover:scale-110 transition-transform" />
              <span>تحميل مصنف Excel 365 الشامل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Smart Alerts & Period Closing Ticker Widget */}
      {(urgentAlerts.length > 0 || closingStatus.isImminent || closingStatus.isUrgent) && (
        <div
          className={`rounded-xl border p-4 shadow-lg transition-all ${
            closingStatus.isUrgent
              ? 'bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-900 border-rose-500/40'
              : 'bg-gradient-to-r from-[#1A1860]/40 via-[#131626] to-[#0B0D17] border-[#39e3d7]/40'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  closingStatus.isUrgent
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'bg-[#3632c7]/25 text-[#39e3d7] border border-[#39e3d7]/40'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    تنبيه تنفيذي: اقتراب موعد إغلاق الفترة المالية (متبقي {closingStatus.daysRemaining} أيام)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#3632c7]/25 text-[#39e3d7] border border-[#39e3d7]/30">
                    تاريخ الإقفال: {closingStatus.closingDate}
                  </span>
                  {draftEntries.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {draftEntries.length} قيد معلق
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 max-w-3xl">
                  {draftEntries.length > 0
                    ? `يتطلب إقفال الفترة اعتماد وترحيل القيود المعلقة بقيمة ${closingStatus.pendingEntriesAmount.toLocaleString()} ${settings.currencySymbol}، ومراجعة القوائم المالية.`
                    : `جاهزية إغلاق الفترة بلغت ${closingStatus.readinessPercentage}%، يرجى متابعة مراجعة القوائم المالية الختامية واعتمادها.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              {onOpenTechnicalAudit && (
                <button
                  onClick={onOpenTechnicalAudit}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>المراجعة التقنية والرقابة</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('executive_dashboard')}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#3632c7] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold text-xs shadow-lg shadow-[#3632c7]/30 cursor-pointer transition-all active:scale-95 group"
              >
                <LayoutDashboard className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>فتح الداشبورد التنفيذي</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Periodic Compliance & Statutory Reminders: Social Insurance (Day 5) & Tax Form 41 (Quarterly) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#111327] via-[#0E1020] to-[#151336] border border-[#2B3158] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  التنبيهات الدورية القانونية والضريبية والتأمينات (الرقابة الإلزامية)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  تذكير دوري مؤتمت
                </span>
              </div>
              <p className="text-xs text-slate-400 pt-0.5">
                تذكيرات مواعيد السداد القانونية الإلزامية لتجنب غرامات التأخير وحماية أموال الجمعية
              </p>
            </div>
          </div>

          {onOpenTechnicalAudit && (
            <button
              onClick={onOpenTechnicalAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>فحص الرقابة والترصيد</span>
            </button>
          )}
        </div>

        {/* The 2 High-Priority Periodic Reminder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Reminder 1: Monthly Social Insurance on Day 5 */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/40 hover:border-amber-400 transition-all space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded font-black bg-amber-500 text-slate-950">
                    تنبيه شهري دوري
                  </span>
                  <span className="text-[11px] font-mono-num font-bold text-amber-300">
                    مستحق يوم 5 من أول كل شهر
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  سداد اشتراكات التأمينات الاجتماعية للعاملين بالجمعية
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تذكير دوري في بداية كل شهر: يلزم سداد اشتراكات التأمينات الاجتماعية (حصة المنشأة وحصة العاملين - كود 2162) قبل يوم 5 لتفادي احتساب فوائد وغرامات التأخير القانونية.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">الجهة المستحقة:</span>
                <span className="text-slate-200 font-semibold">الهيئة القومية للتأمين الاجتماعي</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">المبلغ الشهري المستحق:</span>
                <span className="font-mono-num font-bold text-amber-400 text-xs">32,000 ج.م</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-mono-num">
                حساب الأستاذ: 2162 (مصلحة التأمينات الاجتماعية)
              </span>
              <button
                onClick={() => onNavigate('entry_voucher_form')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                <span>إصدار إذن صرف التأمينات</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </div>

          {/* Reminder 2: Quarterly Tax Form 41 at Start of Every 3 Months */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/40 hover:border-indigo-400 transition-all space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded font-black bg-indigo-500 text-white">
                    تنبيه ربع سنوي دوري
                  </span>
                  <span className="text-[11px] font-mono-num font-bold text-cyan-300">
                    كل أول 3 شهور (يناير - أبريل - يوليو - أكتوبر)
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  عمل نموذج 41 لضريبة الخصم والتحصيل وتوريد المبالغ المحصلة للبنك
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تنبيه دوري كل أول 3 شهور: يلزم إعداد وتقديم نموذج 41 لضريبة الخصم والتحصيل من المنبع وتوريد المبالغ المحتجزة من الموردين (حساب 2161) لمصلحة الضرائب عبر البنك.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">الجهة / البنك المورد إليه:</span>
                <span className="text-slate-200 font-semibold">مصلحة الضرائب المصرية (عبر بنك مصر)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">إجمالي المبالغ المحتجزة:</span>
                <span className="font-mono-num font-bold text-cyan-400 text-xs">48,000 ج.م</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-mono-num">
                حساب الأمانات: 2161 (مصلحة الضرائب - خصم وإضافة)
              </span>
              <button
                onClick={() => onNavigate('withholding_tax')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <span>مراجعة وتوريد نموذج 41</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Journal Entries */}
        <div
          onClick={() => onNavigate('journal_entries')}
          className="bg-[#131626] border border-[#232742] rounded-xl p-4 hover:border-[#39e3d7]/50 hover:shadow-lg hover:shadow-[#3632c7]/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8E92BC] font-medium">القيود المسجلة</span>
            <div className="w-8 h-8 rounded-lg bg-[#3632c7]/20 text-[#39e3d7] flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono-num">{entries.length}</span>
            <span className="text-xs text-[#39e3d7] font-semibold">{approvedEntries.length} معتمد</span>
          </div>
          <p className="mt-1 text-[11px] text-[#8E92BC]">
            {draftEntries.length > 0 ? `${draftEntries.length} قيود مسودة تحت المراجعة` : 'جميع القيود معتمدة ومرحلة'}
          </p>
        </div>

        {/* Card 2: Cost Centers */}
        <div
          onClick={() => onNavigate('cost_centers')}
          className="bg-[#131626] border border-[#232742] rounded-xl p-4 hover:border-[#39e3d7]/50 hover:shadow-lg hover:shadow-[#3632c7]/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8E92BC] font-medium">مراكز التكلفة والرحلات</span>
            <div className="w-8 h-8 rounded-lg bg-[#3632c7]/20 text-[#716df7] flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono-num">{costCenters.length}</span>
            <span className="text-xs text-[#716df7] font-semibold">عمرة / حج / معارض</span>
          </div>
          <p className="mt-1 text-[11px] text-[#8E92BC]">ترميز ديناميكي (UMR / HAJ / EXH)</p>
        </div>

        {/* Card 3: Members Savings */}
        <div
          onClick={() => onNavigate('members_savings')}
          className="bg-[#131626] border border-[#232742] rounded-xl p-4 hover:border-[#39e3d7]/50 hover:shadow-lg hover:shadow-[#3632c7]/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8E92BC] font-medium">أمانات ومدخرات الأعضاء</span>
            <div className="w-8 h-8 rounded-lg bg-[#3632c7]/20 text-[#39e3d7] flex items-center justify-center group-hover:scale-110 transition-transform">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-bold text-white font-mono-num">
              {totalSavings.toLocaleString()}
            </span>
            <span className="text-xs text-[#39e3d7] font-semibold">{settings.currencySymbol}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#8E92BC]">{members.length} عضو مسجل بالجهاز</p>
        </div>

        {/* Card 4: Checks In Collection */}
        <div
          onClick={() => onNavigate('checks_collection')}
          className="bg-[#131626] border border-[#232742] rounded-xl p-4 hover:border-[#39e3d7]/50 hover:shadow-lg hover:shadow-[#3632c7]/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8E92BC] font-medium">شيكات تحت التحصيل</span>
            <div className="w-8 h-8 rounded-lg bg-[#3632c7]/20 text-[#39e3d7] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-bold text-white font-mono-num">
              {totalChecksInCollection.toLocaleString()}
            </span>
            <span className="text-xs text-[#39e3d7] font-semibold">{settings.currencySymbol}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#8E92BC]">الحساب الوسيط 1132 قيد المقاصة</p>
        </div>
      </div>

      {/* The 7 Core Workflow Portals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>بوابات النظام وأوراق العمل (35 موديول متكامل ومترابط)</span>
          </h2>
          <span className="text-xs text-slate-400">انقر على أي موديول للانتقال الفوري</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Portal 1: Dictionaries */}
          <div className="bg-[#131626] border border-[#232742] rounded-xl p-4 hover:border-[#39e3d7]/40 transition-all">
            <h3 className="text-xs font-bold text-[#39e3d7] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39e3d7]" />
              الأدلة والتهيئة المعيارية
            </h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => onNavigate('chart_of_accounts')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>4. شجرة الحسابات (شاملة حسابات الشيكات الوسيطة)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('cost_centers')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>5. مراكز التكلفة (عمرة مستويات، حج، معارض)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('members')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>6. دليل أعضاء الجهاز المركزي للمحاسبات</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('savings_upload')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#39e3d7] font-bold transition-colors text-right cursor-pointer border border-[#39e3d7]/30 bg-[#161a35]"
              >
                <span>18. شيت رفع استقطاع المدخرات والمديونيات (جديد)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#39e3d7]" />
              </button>
              <button
                onClick={() => onNavigate('suppliers')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>7. دليل الموردين وفنادق مكة والمدينة والشركات</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
            </div>
          </div>

          {/* Portal 2: Journal & Operations */}
          <div className="bg-[#131626] border border-[#232742] rounded-xl p-4 hover:border-[#39e3d7]/40 transition-all">
            <h3 className="text-xs font-bold text-[#716df7] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#716df7]" />
              دورة القيود اليومية والمستندات
            </h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => onNavigate('entry_voucher_form')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#39e3d7] font-semibold transition-colors text-right cursor-pointer"
              >
                <span>9. نموذج إدخال قيد مع محرك الفحص الفوري</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#39e3d7]" />
              </button>
              <button
                onClick={() => onNavigate('journal_entries')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>8. دفتر اليومية العامة وسجل الترحيل</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('receipts')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>10. سجل المقبوضات وإيصالات التحصيل</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('payments')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>11. سجل المدفوعات وأذون الصرف</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
            </div>
          </div>

          {/* Portal 3: Cash & Checks */}
          <div className="bg-[#131626] border border-[#232742] rounded-xl p-4 hover:border-[#39e3d7]/40 transition-all">
            <h3 className="text-xs font-bold text-[#39e3d7] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39e3d7]" />
              الخزينة وحسابات البنوك والتسوية
            </h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => onNavigate('treasury_cash')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>12. يومية حركة الخزينة النقدية الرئيسية (1111)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('banks')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#39e3d7] font-semibold transition-colors text-right cursor-pointer"
              >
                <span>13. حسابات بنك مصر (جاري 1121 وأذون خزانة 1122)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#39e3d7]" />
              </button>
              <button
                onClick={() => onNavigate('bank_reconciliation')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>24. التسويات البنكية وشيت درافت الإكسيل</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('checks_issued')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>14. الشيكات الصادرة وحسابها الوسيط (2141)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
            </div>
          </div>

          {/* Portal 4: Ledgers & Trial Balances */}
          <div className="bg-[#131626] border border-[#232742] rounded-xl p-4 hover:border-[#39e3d7]/40 transition-all">
            <h3 className="text-xs font-bold text-[#716df7] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#716df7]" />
              الأساتذة وموازين المراجعة
            </h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => onNavigate('general_ledger')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>19. دفتر الأستاذ العام التفاعلي</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('trial_balance_totals')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>22. ميزان المراجعة بالمجاميع</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('trial_balance_balances')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>23. ميزان المراجعة بالأرصدة</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('variance_analysis')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>26. مقارنة الفعلي بالموازنة التقديرية</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
            </div>
          </div>

          {/* Portal 5: Financial Statements */}
          <div className="bg-[#131626] border border-[#232742] rounded-xl p-4 hover:border-[#39e3d7]/40 transition-all">
            <h3 className="text-xs font-bold text-[#39e3d7] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39e3d7]" />
              القوائم المالية والتحليلات
            </h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => onNavigate('income_statement')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>28. قائمة الإيرادات والمصروفات (الدخل)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('balance_sheet')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>29. قائمة المركز المالي (الميزانية العمومية)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('cash_flow')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>30. قائمة التدفقات النقدية</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('financial_notes')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>31. المؤشرات والنسب المالية المتقدمة</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
            </div>
          </div>

          {/* Portal 6: Audit & Executive Dashboard */}
          <div className="bg-[#131626] border border-[#232742] rounded-xl p-4 hover:border-[#39e3d7]/40 transition-all">
            <h3 className="text-xs font-bold text-[#39e3d7] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39e3d7]" />
              الرقابة الداخلية والداشبورد التنفيذي
            </h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => onNavigate('executive_dashboard')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#39e3d7] font-semibold transition-colors text-right cursor-pointer"
              >
                <span>33. Dashboard تنفيذي لدعم مجلس الإدارة</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#39e3d7]" />
              </button>
              <button
                onClick={() => onNavigate('audit_controls')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#39e3d7] hover:text-white font-medium transition-colors text-right cursor-pointer"
              >
                <span>32. التحليلات والرسوم الرقابية والفحص الذكي (Recharts)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#39e3d7]" />
              </button>
              <button
                onClick={() => onNavigate('audit_trail')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>34. سجل المراجعة التاريخي Audit Trail</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
              <button
                onClick={() => onNavigate('user_guide')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b1f36] text-[#D7D6F4] hover:text-white transition-colors text-right cursor-pointer"
              >
                <span>35. دليل الاستخدام وقاموس البيانات والمعادلات</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E92BC]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
