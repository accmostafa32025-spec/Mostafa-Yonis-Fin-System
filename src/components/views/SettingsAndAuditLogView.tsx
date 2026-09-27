import React, { useState } from 'react';
import {
  Settings,
  History,
  ShieldCheck,
  Building,
  Lock,
  Save,
  CheckCircle2,
  Calendar,
  DollarSign,
  UserCheck,
  Coins,
  Landmark,
  AlertTriangle,
  Activity,
  Cpu,
  Users,
  ArrowRightLeft,
  KeyRound,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { FlatIconApprove } from '../common/FlatIcons';
import { AuditLogEntry, SystemSettings, User, JournalEntry } from '../../types/accounting';
import { FixedAssetsDepreciationSchedule } from './FixedAssetsDepreciationSchedule';

interface SettingsAndAuditLogViewProps {
  mode: 'settings' | 'audit_log';
  settings: SystemSettings;
  auditLogs: AuditLogEntry[];
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onAddJournalEntry?: (entry: JournalEntry) => void;
  users?: User[];
}

export const SettingsAndAuditLogView: React.FC<SettingsAndAuditLogViewProps> = ({
  mode,
  settings,
  auditLogs,
  onUpdateSettings,
  onAddJournalEntry,
  users = [],
}) => {
  const [formData, setFormData] = useState<SystemSettings>({
    ...settings,
    insuranceNumber: settings.insuranceNumber || '1854663',
    taxRegistrationNumber: settings.taxRegistrationNumber || '706054423',
    fiscalYearDisplay: settings.fiscalYearDisplay || 'السنة المالية من 1 يوليه 2025 وحتى 30 يونيه 2026',
    cfoPassword: settings.cfoPassword || '12345',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'fixed_assets' | 'users' | 'year_end_close'>('general');

  // Year-End Closing Modal State
  const [showCloseYearModal, setShowCloseYearModal] = useState(false);
  const [cfoPasswordInput, setCfoPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [closingSuccess, setClosingSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExecuteYearEndClosing = (e: React.FormEvent) => {
    e.preventDefault();
    if (cfoPasswordInput.trim() !== '12345' && cfoPasswordInput.trim() !== formData.cfoPassword) {
      setPasswordError(true);
      return;
    }

    setPasswordError(false);
    const updatedSettings: SystemSettings = {
      ...formData,
      fiscalYear: 2027,
      fiscalYearDisplay: 'السنة المالية من 1 يوليه 2026 وحتى 30 يونيه 2027',
      fiscalYearStartDate: '2026-07-01',
      fiscalYearEndDate: '2027-06-30',
      fiscalYearRule: 'السنة المالية من 1 يوليه 2026 وحتى 30 يونيه 2027',
      activePeriod: '2026-07',
      isPeriodLocked: true,
      lockedPeriods: [
        ...(formData.lockedPeriods || []),
        '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
        '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'
      ],
    };

    setFormData(updatedSettings);
    onUpdateSettings(updatedSettings);

    // Generate Closing Journal Entry
    if (onAddJournalEntry) {
      const closingEntry: JournalEntry = {
        id: `entry-close-${Date.now()}`,
        entryNo: `CLS-2026-END`,
        date: '2026-06-30',
        description: 'إقفال حسابات الإيرادات والمصروفات وترحيل فائض النشاط للسنة المالية الجديدة 2026 / 2027',
        status: 'approved',
        entryType: 'closing',
        documentNo: 'CFO-ROLLOVER-12345',
        documentType: 'settlement',
        fiscalYear: 2026,
        period: '2026-06',
        createdBy: 'Mostafa Yonis (Financial Manager)',
        approvedBy: 'Mostafa Yonis (Financial Manager)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lines: [
          {
            id: `line-cls-1`,
            accountId: 'acc-4111',
            accountCode: '4111',
            accountName: 'إيرادات برامج الحج والعمرة والرحلات',
            debit: 5000000,
            credit: 0,
            notes: 'إقفال إيرادات البرامج بحساب الفائض المرحل',
          },
          {
            id: `line-cls-2`,
            accountId: 'acc-5111',
            accountCode: '5111',
            accountName: 'تكاليف ومصروفات خدمات الحج والعمرة المباشرة',
            debit: 0,
            credit: 4200000,
            notes: 'إقفال تكاليف ومصروفات الحج والعمرة',
          },
          {
            id: `line-cls-3`,
            accountId: 'acc-3141',
            accountCode: '3141',
            accountName: 'الفائض المرحل المتراكم (الأرباح المبقاة)',
            debit: 0,
            credit: 800000,
            notes: 'ترحيل صافي فائض الدورة المالية إلى حساب الفائض المرحل',
          },
        ],
        totalDebit: 5000000,
        totalCredit: 5000000,
      };
      onAddJournalEntry(closingEntry);
    }

    setClosingSuccess(true);
    setTimeout(() => {
      setClosingSuccess(false);
      setShowCloseYearModal(false);
      setCfoPasswordInput('');
    }, 3000);
  };

  if (mode === 'audit_log') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>سجل التغييرات ومسار المراجعة الإلكتروني (Audit Trail Log)</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
                  {auditLogs.length} سجل
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                تسجيل غير قابل للتعديل لكافة العمليات، وتعديل الحسابات ومراكز التكلفة، وإلغاء القيود
              </p>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 w-44">التاريخ والوقت</th>
                <th className="p-3">المستخدم المسؤول</th>
                <th className="p-3">طبيعة العملية</th>
                <th className="p-3 min-w-[300px]">تفاصيل الإجراء والمستند المتأثر</th>
                <th className="p-3">الحالة الرقابية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                  <td className="p-3 font-mono-num text-slate-400">{log.timestamp}</td>
                  <td className="p-3 font-semibold text-white">{log.userName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono-num text-[11px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-200">{log.details}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      مسجل وموثق
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ========================================================
  // Settings & Management View
  // ========================================================
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>إعدادات النظام المحاسبي ومعلومات الجمعية وإهلاك الأصول</span>
            </h2>
            <p className="text-xs text-slate-400">
              تحديد معايير العمل، البيانات الضريبية والتأمينية، جدولة إهلاك الحاسبات، وترحيل السنة المالية
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم حفظ وتثبيت الإعدادات بنجاح</span>
          </div>
        )}
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'general'
              ? 'bg-[#3632c7] text-white shadow'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>البيانات الأساسية والقانونية والرقابية</span>
        </button>

        <button
          onClick={() => setActiveSubTab('fixed_assets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'fixed_assets'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow'
              : 'bg-slate-950 text-amber-400 hover:text-white border border-amber-500/30'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>جدولة إهلاك الأصول الثابتة (حاسبات 20%)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-[#3632c7] text-white shadow'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>المستخدمين المعتمدين والمشرفين الماليين</span>
        </button>

        <button
          onClick={() => setActiveSubTab('year_end_close')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'year_end_close'
              ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow'
              : 'bg-slate-950 text-rose-400 hover:text-white border border-rose-500/30'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>إقفال وترحيل السنة المالية الجديدة</span>
        </button>
      </div>

      {/* Sub-Tab 1: Fixed Assets Depreciation Schedule */}
      {activeSubTab === 'fixed_assets' && (
        <FixedAssetsDepreciationSchedule
          settings={formData}
          onAddJournalEntry={onAddJournalEntry}
          currencySymbol={formData.currencySymbol || 'ج.م'}
        />
      )}

      {/* Sub-Tab 2: Approved System Users */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  المستخدمون الحاليون والمعتمدون بالنظام المحاسبي
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                4 مستخدمين معتمدين
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Financial Manager - Mostafa Yonis */}
              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white">Mostafa Yonis</div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Financial Manager (CFO)
                  </span>
                </div>
                <div className="text-xs text-slate-300">المدير المالي التنفيذي - رئيس الإدارة المالية</div>
                <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                  <p>• الصلاحية: اعتماد وترحيل القيود، تعديل الدليل، إقفال الفترات، وتجاوز القيود (كلمة السر: 12345)</p>
                  <p>• سقف الاعتماد المالي: <strong className="text-white font-mono-num">10,000,000 ج.م</strong></p>
                </div>
              </div>

              {/* Senior Accountant - Dina Hany */}
              <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white">Dina Hany</div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Senior Accountant
                  </span>
                </div>
                <div className="text-xs text-slate-300">محاسب أول / المراجعة الداخلية والتدقيق</div>
                <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                  <p>• الصلاحية: إدخال ومراجعة واعتماد القيود، تدقيق حسابات الموردين، وإعداد نماذج الضرائب</p>
                  <p>• سقف الاعتماد المالي: <strong className="text-white font-mono-num">1,500,000 ج.م</strong></p>
                </div>
              </div>

              {/* Senior Accountant - Ayman Abd elsalam */}
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white">Ayman Abd elsalam</div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Senior Accountant
                  </span>
                </div>
                <div className="text-xs text-slate-300">محاسب أول / الرقابة المالية والمطابقة</div>
                <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                  <p>• الصلاحية: تدقيق تسويات البنوك، فحص قيود المصروفات، ومراقبة الموازنة التقديرية</p>
                  <p>• سقف الاعتماد المالي: <strong className="text-white font-mono-num">1,500,000 ج.م</strong></p>
                </div>
              </div>

              {/* Accountant - Mostafa Abd elal */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white">Mostafa Abd elal</div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Accountant
                  </span>
                </div>
                <div className="text-xs text-slate-300">محاسب / الدفاتر والقيود اليومية</div>
                <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                  <p>• الصلاحية: إدخال قيود اليومية، تسجيل مقبوضات ومدخرات الأعضاء، وإعداد أذون الصرف</p>
                  <p>• سقف الاعتماد المالي: <strong className="text-white font-mono-num">250,000 ج.م</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Year-End Closing and Rollover */}
      {activeSubTab === 'year_end_close' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-rose-400" />
                  <h3 className="text-base font-bold text-white">
                    إقفال وترحيل السنة المالية إلى السنة الجديدة
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    حماية بكلمة سر المدير المالي (12345)
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  إجراء محاسبي ختامي معتمد يقوم بإقفال حسابات الإيرادات والمصروفات وترحيل الفائض وتدوير الأرصدة الافتتاحية
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-slate-400 block font-semibold">السنة المالية الحالية الجاري إقفالها:</span>
                <div className="text-sm font-bold text-amber-300 font-mono-num">
                  {formData.fiscalYearDisplay || 'السنة المالية من 1 يوليه 2025 وحتى 30 يونيه 2026'}
                </div>
                <p className="text-[11px] text-slate-500">
                  سيتم تجميد وحظر كافة قيود الفترات المنتهية لمنع أي تعديل لاحق.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                <span className="text-emerald-400 block font-semibold">السنة المالية الجديدة المستهدفة:</span>
                <div className="text-sm font-bold text-emerald-300 font-mono-num">
                  السنة المالية من 1 يوليه 2026 وحتى 30 يونيه 2027
                </div>
                <p className="text-[11px] text-slate-500">
                  فتح دفاتر 2026/2027 مع الأرصدة الافتتاحية المرحلة للأصول والالتزامات وحسابات البنوك.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/20 space-y-2 text-xs">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                <span>إجراءات الأمان والرقابة:</span>
              </h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                تنفيذاً للائحة الرقابة الداخلية بالجهاز المركزي للمحاسبات، يتطلب تنفيذ عملية الإقفال السنوي إدخال كلمة سر المدير المالي التنفيذي (CFO) المكونة من أرقام هي: <strong className="text-amber-300 font-mono">12345</strong>.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setCfoPasswordInput('');
                  setPasswordError(false);
                  setShowCloseYearModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-purple-700 hover:from-rose-500 hover:to-purple-600 text-white text-xs font-black shadow-xl shadow-rose-950/50 border border-rose-400/40 transition-all cursor-pointer active:scale-95"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>بدء إجراءات إقفال وترحيل السنة المالية الجديدة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: General Settings Form */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSave} className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5 text-xs">
          {/* Association Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">اسم الجمعية والمؤسسة</label>
              <input
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">الجهة التابعة لها</label>
              <input
                type="text"
                required
                value={formData.parentOrganization}
                onChange={(e) => setFormData({ ...formData, parentOrganization: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Legal, Tax & Social Insurance Data Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">
                  البيانات الرسمية والقانونية والتأمينية للجمعية
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                مصلحة الضرائب والتأمينات
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">الرقم التأميني للجمعية</label>
                <input
                  type="text"
                  required
                  value={formData.insuranceNumber || '1854663'}
                  onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg p-2.5 text-cyan-300 font-mono-num font-bold focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">الهيئة القومية للتأمين الاجتماعي</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">رقم التسجيل الضريبي</label>
                <input
                  type="text"
                  required
                  value={formData.taxRegistrationNumber || '706054423'}
                  onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-lg p-2.5 text-amber-300 font-mono-num font-bold focus:outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">مصلحة الضرائب (نموذج 41)</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">رقم الملف الضريبي</label>
                <input
                  type="text"
                  value={formData.taxFileNumber || '142/98/215'}
                  onChange={(e) => setFormData({ ...formData, taxFileNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono-num focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">مأمورية الضرائب المختصة</label>
                <input
                  type="text"
                  value={formData.taxAuthorityBranch || 'مأمورية ضرائب الشركات والمهن / قصر النيل'}
                  onChange={(e) => setFormData({ ...formData, taxAuthorityBranch: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Fiscal Year Configuration Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-500/30 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold text-white">
                  دورة وقواعد السنة المالية بالجهاز المركزي للمحاسبات
                </h4>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                السنة المالية من 1 يوليه 2025 وحتى 30 يونيه 2026
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">مسمى السنة المالية المعتمد</label>
                <input
                  type="text"
                  value={formData.fiscalYearDisplay || 'السنة المالية من 1 يوليه 2025 وحتى 30 يونيه 2026'}
                  onChange={(e) =>
                    setFormData({ ...formData, fiscalYearDisplay: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-300 font-mono-num font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  تُعرض بالتقارير الرسمية والميزانية
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">تاريخ بداية السنة المالية</label>
                <input
                  type="date"
                  value={formData.fiscalYearStartDate || '2025-07-01'}
                  onChange={(e) =>
                    setFormData({ ...formData, fiscalYearStartDate: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono-num focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-emerald-400 mt-1 block font-mono-num">
                  01 يوليه 2025 (افتتاح الدورة المالية)
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">تاريخ نهاية السنة المالية</label>
                <input
                  type="date"
                  value={formData.fiscalYearEndDate || '2026-06-30'}
                  onChange={(e) =>
                    setFormData({ ...formData, fiscalYearEndDate: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono-num focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-rose-400 mt-1 block font-mono-num">
                  30 يونيه 2026 (الحساب الختامي والإقفال)
                </span>
              </div>
            </div>
          </div>

          {/* CFO Override Password Configuration */}
          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>كلمة سر المدير المالي لتأكيد الترحيل والعمليات الرقابية:</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                أرقام: 12345
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              صمام أمان رقابي مطلوب إدخاله عند ترحيل وإقفال السنة المالية، وتجاوز حدود القيود وموافقة المدير المالي (Mostafa Yonis).
            </p>
            <div className="max-w-xs">
              <input
                type="text"
                required
                value={formData.cfoPassword || '12345'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cfoPassword: e.target.value,
                  })
                }
                className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold text-sm tracking-widest focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Liquidity Thresholds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>الحد الأدنى لرصيد الخزينة (1111):</span>
              </label>
              <input
                type="number"
                value={formData.minTreasuryBalanceAlert ?? 100000}
                onChange={(e) => setFormData({ ...formData, minTreasuryBalanceAlert: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num font-bold text-xs"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-cyan-400" />
                <span>الحد الأدنى لرصيد البنك (1121):</span>
              </label>
              <input
                type="number"
                value={formData.minBankBalanceAlert ?? 1000000}
                onChange={(e) => setFormData({ ...formData, minBankBalanceAlert: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono-num font-bold text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white font-bold shadow-lg shadow-[#3632c7]/30 transition-all cursor-pointer active:scale-95 text-xs"
            >
              <FlatIconApprove className="w-4 h-4" />
              <span>حفظ وتثبيت إعدادات النظام</span>
            </button>
          </div>
        </form>
      )}

      {/* Year-End Closing & Rollover Password Modal */}
      {showCloseYearModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-rose-400" />
                <span>تأكيد إقفال وترحيل السنة المالية</span>
              </h4>
              <button
                onClick={() => setShowCloseYearModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {closingSuccess ? (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                <h5 className="text-sm font-bold text-emerald-300">تم الترحيل والإقفال بنجاح!</h5>
                <p className="text-xs text-slate-300">
                  تم إقفال حسابات 2025/2026 وافتتاح دفاتر السنة المالية الجديدة (من 1 يوليه 2026 وحتى 30 يونيه 2027) وإدراج قيد الإقفال.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteYearEndClosing} className="space-y-4 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  أنت على وشك إقفال السنة المالية الحالية وترحيل الفائض وحظر القيود السابقة وافتتاح <strong>السنة المالية من 1 يوليه 2026 وحتى 30 يونيه 2027</strong>.
                </p>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-[11px]">
                  يرجى إدخال كلمة سر المدير المالي التنفيذي (CFO - Mostafa Yonis) المكونة من الأرقام: <strong>12345</strong>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">
                    كلمة سر المدير المالي (CFO Password):
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="أدخل كلمة السر (12345)..."
                    value={cfoPasswordInput}
                    onChange={(e) => {
                      setCfoPasswordInput(e.target.value);
                      setPasswordError(false);
                    }}
                    className={`w-full bg-slate-950 border rounded-lg p-2.5 text-center text-amber-300 font-mono text-base tracking-widest focus:outline-none ${
                      passwordError ? 'border-rose-500 animate-shake' : 'border-slate-700 focus:border-amber-400'
                    }`}
                  />
                  {passwordError && (
                    <span className="text-[11px] text-rose-400 font-bold mt-1 block">
                      كلمة السر غير صحيحة! كلمة سر المدير المالي تتكون من الأرقام: 12345
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCloseYearModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold shadow-md cursor-pointer"
                  >
                    تأكيد الترحيل والإقفال
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
