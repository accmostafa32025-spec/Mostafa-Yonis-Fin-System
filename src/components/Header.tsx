import React from 'react';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  PlusCircle,
  FileSpreadsheet,
  FileDown,
  Printer,
  RotateCw,
} from 'lucide-react';
import { User, SystemSettings, SheetKey } from '../types/accounting';
import { FirebaseAuthBar } from './common/FirebaseAuthBar';

interface HeaderProps {
  settings: SystemSettings;
  currentUser?: User;
  users?: User[];
  onSelectUser?: (user: User) => void;
  onOpenNewVoucher?: () => void;
  onNewVoucher?: () => void;
  onExportFullExcel?: () => void;
  onExportExcel?: () => void;
  onExportCleanExcel?: () => void;
  onOpenAudit?: () => void;
  onRunTechnicalAudit?: () => void;
  onResetTestData?: () => void;
  isBalanced: boolean;
  activeSheet?: SheetKey;
  entriesCount?: number;
  errorCount?: number;
  warningCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  users = [],
  onSelectUser,
  onOpenNewVoucher,
  onNewVoucher,
  onExportFullExcel,
  onExportExcel,
  onExportCleanExcel,
  onOpenAudit,
  onRunTechnicalAudit,
  onResetTestData,
  isBalanced,
  activeSheet,
  entriesCount,
  errorCount,
  warningCount,
}) => {
  const triggerNewVoucher = onNewVoucher || onOpenNewVoucher;
  const triggerExport = onExportExcel || onExportFullExcel;
  const triggerTechnicalAudit = onRunTechnicalAudit || onOpenAudit;

  return (
    <header className="bg-gradient-to-r from-[#0B0D17] via-[#151347] to-[#0B0D17] border-b border-[#2A2775] text-white sticky top-0 z-50 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Logo & Title in Pulvent Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3632c7] to-[#39e3d7] p-0.5 shadow-lg shadow-[#3632c7]/40 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0B0D17] rounded-[10px] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#39e3d7]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>جمعية تيسير الحج والعمرة</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#3632c7]/25 text-[#39e3d7] border border-[#39e3d7]/30 font-semibold shadow-sm">
                    الجهاز المركزي للمحاسبات
                  </span>
                </h1>
              </div>
              <div className="text-xs text-[#8E92BC] flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-[#D7D6F4] font-medium">النظام المحاسبي والرقابي الشامل</span>
                <span className="text-[#3632c7]">•</span>
                <span
                  className="text-[#39e3d7] font-mono-num font-semibold"
                  title="السنة المالية تبدأ من 1 يوليه وتنتهي فى 30 يونيه من السنة التالية"
                >
                  السنة المالية {settings.fiscalYearDisplay || '2025 / 2026'}
                </span>
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#39e3d7]/10 text-[#39e3d7] border border-[#39e3d7]/20 hidden sm:inline-block font-mono-num">
                  (01 يوليه - 30 يونيه)
                </span>
                <span className="text-[#3632c7]">•</span>
                <span className="text-[#AACEF8] font-mono-num">
                  الفترة: {settings.activePeriod} (الربع الثالث Q3)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Technical Audit & Accounting Supervision Button */}
            <button
              onClick={triggerTechnicalAudit}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 hover:from-emerald-900/80 hover:to-emerald-800/80 text-emerald-300 hover:text-white border border-emerald-500/50 hover:border-emerald-400 shadow-md shadow-emerald-950/40 transition-all cursor-pointer group active:scale-95"
              title="إجراء عمليات المراجعة التقنية والرقابة على كافة التوجيهات المحاسبية والترحيل والترصيد"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>المراجعة التقنية والرقابة</span>
            </button>

            {/* System Status Badge */}
            <button
              onClick={onOpenAudit}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer group ${
                isBalanced
                  ? 'bg-[#131626] border-[#39e3d7]/30 text-emerald-300 hover:bg-[#1b1f36] hover:border-[#39e3d7] shadow-sm hover:shadow-[#39e3d7]/20'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-300 hover:bg-rose-900/50 hover:border-rose-400 animate-pulse'
              }`}
              title="انقر لفحص محرك الرقابة الذكي"
            >
              {isBalanced ? (
                <ShieldCheck className="w-4 h-4 text-[#39e3d7] group-hover:scale-110 transition-transform" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              )}
              <span className="font-semibold">
                {isBalanced ? 'النظام متزن ومطابق' : 'فارق رقابي غير متزن'}
              </span>
            </button>

            {/* Google Sign-In & Firebase Auth Bar */}
            <FirebaseAuthBar />

            {/* User Switcher */}
            {currentUser && users.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#131626] border border-[#232742] hover:border-[#3632c7]/60 rounded-xl px-2.5 py-1 transition-all">
                <UserCheck className="w-3.5 h-3.5 text-[#39e3d7]" />
                <span className="text-[11px] text-[#8E92BC]">المستخدم:</span>
                <select
                  value={currentUser.id}
                  onChange={(e) => {
                    const u = users.find((x) => x.id === e.target.value);
                    if (u && onSelectUser) onSelectUser(u);
                  }}
                  className="bg-transparent text-xs text-[#39e3d7] font-semibold focus:outline-none cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#131626] text-white">
                      {u.fullName} ({u.roleTitleAr})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Action: New Voucher (Pulvent Signature Gradient Button) */}
            <button
              onClick={triggerNewVoucher}
              className="flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white rounded-xl shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer active:scale-95 group"
            >
              <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
              <span>قيد جديد</span>
            </button>

            {/* Excel Download: Full 35 Sheets */}
            <button
              onClick={triggerExport}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-[#17154e] to-[#1e1a6c] hover:from-[#221e7d] hover:to-[#292494] text-[#D7D6F4] hover:text-white rounded-xl shadow-md transition-all cursor-pointer border border-[#3632c7]/70 hover:border-[#39e3d7]/50 group"
              title="تحميل ملف Excel 365 الشامل بكافة أوراق العمل الـ 35 والجداول والبيانات"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#39e3d7] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">تصدير Excel 365 (شامل)</span>
              <span className="sm:hidden">Excel</span>
            </button>

            {/* Clean Template Excel */}
            <button
              onClick={onExportCleanExcel}
              className="flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 bg-[#131626] hover:bg-[#1b1f36] text-[#8E92BC] hover:text-white rounded-xl transition-all border border-[#232742] hover:border-[#39e3d7]/40 cursor-pointer group"
              title="تحميل النسخة الفارغة الجاهزة للعمل الفعلي"
            >
              <FileDown className="w-3.5 h-3.5 text-[#8E92BC] group-hover:text-[#39e3d7] transition-colors" />
              <span className="hidden md:inline">نسخة فارغة</span>
            </button>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] text-[#8E92BC] hover:text-white transition-colors border border-[#232742] hover:border-[#39e3d7]/40 cursor-pointer group"
              title="طباعة التقرير الحالي"
            >
              <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            {/* Reset Test Data */}
            <button
              onClick={onResetTestData}
              className="p-2 rounded-xl bg-[#131626] hover:bg-[#1b1f36] text-[#8E92BC] hover:text-[#39e3d7] transition-all border border-[#232742] hover:border-[#39e3d7]/40 cursor-pointer group"
              title="استعادة / تحديث بيانات الاختبار"
            >
              <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
