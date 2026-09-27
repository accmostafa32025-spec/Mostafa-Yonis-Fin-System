import React, { useState, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Search,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  Database,
  Calendar,
  DollarSign,
  UserCheck,
  RefreshCw,
  Eye,
  FileText,
  BadgePercent,
  Check,
} from 'lucide-react';
import { MonthlySavingsRecord, DebtCategory, SystemSettings } from '../../types/accounting';
import { saveSavingsUploadToFirestore } from '../../services/firestoreDataService';

interface SavingsUploadViewProps {
  records: MonthlySavingsRecord[];
  onSaveRecords: (records: MonthlySavingsRecord[]) => void;
  settings: SystemSettings;
  isFirebaseConnected?: boolean;
}

export const SavingsUploadView: React.FC<SavingsUploadViewProps> = ({
  records,
  onSaveRecords,
  settings,
  isFirebaseConnected = false,
}) => {
  const [data, setData] = useState<MonthlySavingsRecord[]>(records);
  const [searchJobNumber, setSearchJobNumber] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-03');
  const [activeTab, setActiveTab] = useState<'upload_sheet' | 'debt_query' | 'new_entry'>('upload_sheet');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Record Form State
  const [newRow, setNewRow] = useState<Partial<MonthlySavingsRecord>>({
    jobNumber: '',
    name: '',
    openingSavingsBalance: 25000,
    monthlyDeduction: 611,
    subscriptionFee: 11,
    monthlySavings: 100,
    debtTotalAmount: 6000,
    installmentMonthsCount: 12,
    installmentStartDate: '2026-01',
    installmentEndDate: '2026-12',
    debtCategory: 'umrah',
    debtDetail: 'عمرة شهر رجب 1447هـ - مستوى أول',
    notes: '',
  });

  // Calculate Month Count between two YYYY-MM dates
  const calculateMonths = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const [startYear, startMonth] = start.split('-').map(Number);
    const [endYear, endMonth] = end.split('-').map(Number);
    const diff = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    return diff > 0 ? diff : 1;
  };

  // Auto-calculated fields for new row
  const calculatedInstallment = useMemo(() => {
    const total = Number(newRow.debtTotalAmount) || 0;
    const months = newRow.installmentStartDate && newRow.installmentEndDate
      ? calculateMonths(newRow.installmentStartDate, newRow.installmentEndDate)
      : Number(newRow.installmentMonthsCount) || 1;
    return months > 0 ? Math.round(total / months) : 0;
  }, [newRow.debtTotalAmount, newRow.installmentStartDate, newRow.installmentEndDate, newRow.installmentMonthsCount]);

  const calculatedMonthsCount = useMemo(() => {
    if (newRow.installmentStartDate && newRow.installmentEndDate) {
      return calculateMonths(newRow.installmentStartDate, newRow.installmentEndDate);
    }
    return Number(newRow.installmentMonthsCount) || 12;
  }, [newRow.installmentStartDate, newRow.installmentEndDate, newRow.installmentMonthsCount]);

  const calculatedRemAfterSub = useMemo(() => {
    const deduction = Number(newRow.monthlyDeduction) || 0;
    return Math.max(0, deduction - 11);
  }, [newRow.monthlyDeduction]);

  const calculatedRemAfterSubAndSavings = useMemo(() => {
    const deduction = Number(newRow.monthlyDeduction) || 0;
    const savings = Number(newRow.monthlySavings) || 0;
    return Math.max(0, deduction - 11 - savings);
  }, [newRow.monthlyDeduction, newRow.monthlySavings]);

  // Handle Add New Member / Row
  const handleAddNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const job = (newRow.jobNumber || '').trim();
    const name = (newRow.name || '').trim();

    if (!job || !name) {
      setErrorMessage('يرجى إدخال الرقم الوظيفي واسم العضو');
      return;
    }

    // Constraint: Unique Job Number & Name
    const jobExists = data.some((r) => r.jobNumber === job);
    if (jobExists) {
      setErrorMessage(`الرقم الوظيفي (${job}) مسجل مسبقاً! الشرط الرقابي: لا يتكرر نهائياً.`);
      return;
    }

    const nameExists = data.some((r) => r.name.toLowerCase() === name.toLowerCase());
    if (nameExists) {
      setErrorMessage(`اسم العضو (${name}) مسجل مسبقاً! الشرط الرقابي: لا يتكرر نهائياً.`);
      return;
    }

    const recordToAdd: MonthlySavingsRecord = {
      id: `sav-${Date.now()}-${job}`,
      jobNumber: job,
      name,
      openingSavingsBalance: Number(newRow.openingSavingsBalance) || 0,
      monthlyDeduction: Number(newRow.monthlyDeduction) || 0,
      subscriptionFee: 11,
      monthlySavings: Number(newRow.monthlySavings) || 0,
      remainingAfterSub: calculatedRemAfterSub,
      monthlyInstallment: calculatedInstallment,
      remainingAfterSubAndSavings: calculatedRemAfterSubAndSavings,
      debtTotalAmount: Number(newRow.debtTotalAmount) || 0,
      installmentMonthsCount: calculatedMonthsCount,
      installmentStartDate: newRow.installmentStartDate || '2026-01',
      installmentEndDate: newRow.installmentEndDate || '2026-12',
      debtCategory: newRow.debtCategory || 'umrah',
      debtDetail: newRow.debtDetail || '',
      notes: newRow.notes || '',
      monthYear: selectedMonth,
    };

    const updated = [recordToAdd, ...data];
    setData(updated);
    onSaveRecords(updated);
    saveSavingsUploadToFirestore(updated);

    // Reset form
    setNewRow({
      jobNumber: '',
      name: '',
      openingSavingsBalance: 20000,
      monthlyDeduction: 611,
      subscriptionFee: 11,
      monthlySavings: 100,
      debtTotalAmount: 6000,
      installmentMonthsCount: 12,
      installmentStartDate: '2026-01',
      installmentEndDate: '2026-12',
      debtCategory: 'umrah',
      debtDetail: '',
      notes: '',
    });

    setSaveSuccessMsg(`تمت إضافة واستقطاع العضو [${name}] وتحديث قاعدة البيانات بنجاح.`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
    setActiveTab('upload_sheet');
  };

  // Virtual Default Upload simulation ("شيت افتراضي لرفع مدخرات الأعضاء شهرياً")
  const handleVirtualDefaultUpload = async () => {
    setErrorMessage(null);
    const virtualBatch: MonthlySavingsRecord[] = [
      {
        id: `sav-${Date.now()}-2001`,
        jobNumber: '2001',
        name: 'عماد الدين سامي مرسي',
        openingSavingsBalance: 48000,
        monthlyDeduction: 1111,
        subscriptionFee: 11,
        monthlySavings: 300,
        remainingAfterSub: 1100,
        monthlyInstallment: 800,
        remainingAfterSubAndSavings: 800,
        debtTotalAmount: 19200,
        installmentMonthsCount: 24,
        installmentStartDate: '2025-09',
        installmentEndDate: '2027-08',
        debtCategory: 'hajj',
        debtDetail: 'حج سياحي فندقي 5 نجوم موسم 1447هـ',
        notes: 'تم الرفع بالدفعة الافتراضية المعتمدة',
        monthYear: selectedMonth,
      },
      {
        id: `sav-${Date.now()}-2002`,
        jobNumber: '2002',
        name: 'سحر عبد العظيم إبراهيم',
        openingSavingsBalance: 31500,
        monthlyDeduction: 761,
        subscriptionFee: 11,
        monthlySavings: 150,
        remainingAfterSub: 750,
        monthlyInstallment: 600,
        remainingAfterSubAndSavings: 600,
        debtTotalAmount: 7200,
        installmentMonthsCount: 12,
        installmentStartDate: '2026-01',
        installmentEndDate: '2026-12',
        debtCategory: 'umrah',
        debtDetail: 'عمرة شعبان 1447هـ - برج الساعة مكة',
        notes: 'تم الرفع بالدفعة الافتراضية المعتمدة',
        monthYear: selectedMonth,
      },
      {
        id: `sav-${Date.now()}-2003`,
        jobNumber: '2003',
        name: 'أشرف كمال عبد الجواد',
        openingSavingsBalance: 22000,
        monthlyDeduction: 561,
        subscriptionFee: 11,
        monthlySavings: 150,
        remainingAfterSub: 550,
        monthlyInstallment: 400,
        remainingAfterSubAndSavings: 400,
        debtTotalAmount: 4800,
        installmentMonthsCount: 12,
        installmentStartDate: '2026-03',
        installmentEndDate: '2027-02',
        debtCategory: 'loan_marriage',
        debtDetail: 'قرض زواج أبناء العاملين بالجهاز',
        notes: 'تمت مراجعة الشروط والمستندات',
        monthYear: selectedMonth,
      },
    ];

    // Merge avoiding duplicated job numbers
    const newItems = virtualBatch.filter(
      (vb) => !data.some((d) => d.jobNumber === vb.jobNumber || d.name === vb.name)
    );

    if (newItems.length === 0) {
      setSaveSuccessMsg('الشيت الافتراضي محمل بالفعل بالكامل في النظام.');
      return;
    }

    const merged = [...newItems, ...data];
    setData(merged);
    onSaveRecords(merged);
    await saveSavingsUploadToFirestore(merged);

    setSaveSuccessMsg(`تم رفع الشيت الافتراضي (${newItems.length} أعضاء جدد) بنجاح وحفظه في Firestore!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    const filtered = data.filter((r) => r.id !== id);
    setData(filtered);
    onSaveRecords(filtered);
    saveSavingsUploadToFirestore(filtered);
  };

  // Search Results for Job Number Debt Query
  const searchedMember = useMemo(() => {
    if (!searchJobNumber.trim()) return null;
    return data.find(
      (r) =>
        r.jobNumber.trim() === searchJobNumber.trim() ||
        r.name.includes(searchJobNumber.trim())
    );
  }, [data, searchJobNumber]);

  // Aggregate Calculations
  const totals = useMemo(() => {
    return data.reduce(
      (acc, r) => ({
        totalOpeningSavings: acc.totalOpeningSavings + (r.openingSavingsBalance || 0),
        totalDeduction: acc.totalDeduction + (r.monthlyDeduction || 0),
        totalSubscriptions: acc.totalSubscriptions + (r.subscriptionFee || 11),
        totalSavings: acc.totalSavings + (r.monthlySavings || 0),
        totalInstallments: acc.totalInstallments + (r.monthlyInstallment || 0),
        totalDebts: acc.totalDebts + (r.debtTotalAmount || 0),
      }),
      {
        totalOpeningSavings: 0,
        totalDeduction: 0,
        totalSubscriptions: 0,
        totalSavings: 0,
        totalInstallments: 0,
        totalDebts: 0,
      }
    );
  }, [data]);

  const debtCategoryLabel: Record<DebtCategory, string> = {
    umrah: 'عمرة (بتاريخها ومستواها)',
    hajj: 'الحج (بنوعه: سياحي، اقتصادي، قرعة)',
    loan_medical: 'قرض حسن مرضي',
    loan_hajj: 'قرض حسن حج وعمرة',
    loan_marriage: 'قرض حسن زواج',
    loan_high_school: 'قرض حسن ثانوية عامة وجامعات',
  };

  return (
    <div className="space-y-5 font-bold" dir="rtl">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-[#12172f] to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  شيت رفع مدخرات واستقطاعات الأعضاء والمديونيات
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono-num font-bold">
                  Excel 365 Dynamic
                </span>
                {isFirebaseConnected && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-bold">
                    <Database className="w-3 h-3" /> مزامنة Firestore نشطة
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                إدارة استقطاعات الرواتب الشهرية (اشتراك 11 ج.م + ادخار + أقساط مديونية الراتب) وحساب الأقساط آلياً وفق بداية ونهاية مدة التقسيط
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Virtual Upload Button */}
            <button
              onClick={handleVirtualDefaultUpload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              title="رفع دفعة افتراضية معتمدة إلى النظام"
            >
              <UploadCloud className="w-4 h-4" />
              <span>رفع شيت افتراضي للسيستم</span>
            </button>

            {/* Switch Tabs */}
            <button
              onClick={() => setActiveTab('new_entry')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'new_entry'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عضو جديد</span>
            </button>

            <button
              onClick={() => setActiveTab('debt_query')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'debt_query'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>استعلام مديونية عضو بالرقم الوظيفي</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-fadeIn font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-slate-400 block mb-1">إجمالي الأعضاء بالشيت</span>
          <span className="text-xl font-black text-white font-mono-num">{data.length}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-bold">أعضاء نشطين</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-amber-400 block mb-1">رصيد أول المدة (مدخرات)</span>
          <span className="text-lg font-black text-amber-300 font-mono-num">
            {totals.totalOpeningSavings.toLocaleString()} {settings.currencySymbol}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-bold">حساب أمانات 2131</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-emerald-400 block mb-1">إجمالي الاستقطاع الشهري</span>
          <span className="text-lg font-black text-emerald-300 font-mono-num">
            {totals.totalDeduction.toLocaleString()} {settings.currencySymbol}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-bold">مخصوم من المرتبات</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-blue-400 block mb-1">الاشتراكات الشهرية (11 ج.م)</span>
          <span className="text-lg font-black text-blue-300 font-mono-num">
            {totals.totalSubscriptions.toLocaleString()} {settings.currencySymbol}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-bold">إيراد اشتراكات 4111</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-indigo-400 block mb-1">الادخار الشهري المضاف</span>
          <span className="text-lg font-black text-indigo-300 font-mono-num">
            {totals.totalSavings.toLocaleString()} {settings.currencySymbol}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-bold">تعزيز رصيد المدخرات</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-rose-400 block mb-1">أقساط المديونيات المحصلة</span>
          <span className="text-lg font-black text-rose-300 font-mono-num">
            {totals.totalInstallments.toLocaleString()} {settings.currencySymbol}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-bold">سداد مديونيات الراتب</span>
        </div>
      </div>

      {/* VIEW TAB 1: ADD NEW MEMBER DEDUCTION FORM */}
      {activeTab === 'new_entry' && (
        <form onSubmit={handleAddNewRecord} className="bg-slate-950 border border-blue-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              <span>إضافة عضو جديد إلى شيت الاستقطاعات والمدخرات</span>
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('upload_sheet')}
              className="text-xs text-slate-400 hover:text-white"
            >
              إلغاء والعودة للجدول
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Job Number (Unique) */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold flex items-center justify-between">
                <span>الرقم الوظيفي (لا يكرر نهائياً) *</span>
                <span className="text-[10px] text-amber-400 font-mono-num font-bold">UNIQUE ID</span>
              </label>
              <input
                type="text"
                required
                value={newRow.jobNumber || ''}
                onChange={(e) => setNewRow({ ...newRow, jobNumber: e.target.value })}
                placeholder="مثال: 1450"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Member Name (Unique) */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold flex items-center justify-between">
                <span>اسم العضو بالكامل (لا يكرر نهائياً) *</span>
                <span className="text-[10px] text-amber-400 font-bold">فريد</span>
              </label>
              <input
                type="text"
                required
                value={newRow.name || ''}
                onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                placeholder="مثال: حسام الدين محمود أحمد"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Opening Savings Balance */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold">رصيد أول المدة من المدخرات (ج.م) *</label>
              <input
                type="number"
                min="0"
                required
                value={newRow.openingSavingsBalance ?? ''}
                onChange={(e) => setNewRow({ ...newRow, openingSavingsBalance: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Total Monthly Deduction */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold">إجمالي الاستقطاع الشهري (ج.م) *</label>
              <input
                type="number"
                min="11"
                required
                value={newRow.monthlyDeduction ?? ''}
                onChange={(e) => setNewRow({ ...newRow, monthlyDeduction: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Subscription Fee (11 EGP fixed) */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold flex items-center justify-between">
                <span>اشتراك شهري (11 جنيه نظامي)</span>
                <span className="text-[10px] text-emerald-400 font-bold">ثابت</span>
              </label>
              <input
                type="text"
                readOnly
                value="11 ج.م"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono-num font-bold cursor-not-allowed"
              />
            </div>

            {/* Monthly Savings */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold">ادخار شهري (ج.م) *</label>
              <input
                type="number"
                min="0"
                required
                value={newRow.monthlySavings ?? ''}
                onChange={(e) => setNewRow({ ...newRow, monthlySavings: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Auto-calculated Deduction Verification Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-900/70 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ما تبقى بعد الاشتراك الشهري:</span>
              <span className="font-mono-num text-amber-300 font-bold">{calculatedRemAfterSub.toLocaleString()} ج.م</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">القسط الشهري المحسوب:</span>
              <span className="font-mono-num text-rose-300 font-bold">{calculatedInstallment.toLocaleString()} ج.م</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ما تبقى بعد الاشتراك والادخار:</span>
              <span className="font-mono-num text-emerald-300 font-bold">{calculatedRemAfterSubAndSavings.toLocaleString()} ج.م</span>
            </div>
          </div>

          {/* Debt & Installment Specification Section */}
          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <BadgePercent className="w-4 h-4" />
              <span>بيانات مديونية الراتب وتحديد الأقساط آلياً</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">مبلغ المديونية الإجمالي (ج.م)</label>
                <input
                  type="number"
                  min="0"
                  value={newRow.debtTotalAmount ?? ''}
                  onChange={(e) => setNewRow({ ...newRow, debtTotalAmount: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">بداية مدة التقسيط</label>
                <input
                  type="month"
                  value={newRow.installmentStartDate || '2026-01'}
                  onChange={(e) => setNewRow({ ...newRow, installmentStartDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">نهاية مدة التقسيط</label>
                <input
                  type="month"
                  value={newRow.installmentEndDate || '2026-12'}
                  onChange={(e) => setNewRow({ ...newRow, installmentEndDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">مدة التقسيط المحسوبة (شهور)</label>
                <input
                  type="text"
                  readOnly
                  value={`${calculatedMonthsCount} شهر (${calculatedInstallment} ج.م/شهر)`}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-rose-300 font-mono-num font-bold cursor-not-allowed"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-slate-300 font-bold">بند التقسيط والمديونية</label>
                <select
                  value={newRow.debtCategory || 'umrah'}
                  onChange={(e) => setNewRow({ ...newRow, debtCategory: e.target.value as DebtCategory })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="umrah">عمرة (بتاريخها ومستواها)</option>
                  <option value="hajj">الحج (بنوعه: سياحي، اقتصادي، قرعة)</option>
                  <option value="loan_medical">قرض حسن مرضي</option>
                  <option value="loan_hajj">قرض حسن حج وعمرة</option>
                  <option value="loan_marriage">قرض حسن زواج</option>
                  <option value="loan_high_school">قرض حسن ثانوية عامة وجامعات</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-slate-300 font-bold">تفاصيل البند (تاريخ الرحلة / نوع الحج / تفاصيل القرض)</label>
                <input
                  type="text"
                  value={newRow.debtDetail || ''}
                  onChange={(e) => setNewRow({ ...newRow, debtDetail: e.target.value })}
                  placeholder="مثال: عمرة رجب 1447هـ - فندق الصفوة رويال أوركيد"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload_sheet')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>حفظ العضو وتحديث الشيت وقاعدة البيانات</span>
            </button>
          </div>
        </form>
      )}

      {/* VIEW TAB 2: DEBT QUERY BY JOB NUMBER ("شيت المدينين الشهري بزر استعلام") */}
      {activeTab === 'debt_query' && (
        <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                <span>شاشة الاستعلام بالرقم الوظيفي لمديونية الأعضاء وبنود التقسيط</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                استعلام فوري وتفصيلي عن مديونية العضو، بند التقسيط (عمرة بتاريخها / حج بنوعه / قرض بنوعه)، والمبالغ المتبقية
              </p>
            </div>

            <button
              onClick={() => setActiveTab('upload_sheet')}
              className="text-xs text-slate-400 hover:text-white"
            >
              العودة للشيت الكامل
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="max-w-xl mx-auto flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5 focus-within:border-purple-500 transition-colors">
            <Search className="w-5 h-5 text-purple-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchJobNumber}
              onChange={(e) => setSearchJobNumber(e.target.value)}
              placeholder="أدخل الرقم الوظيفي (مثال: 1042 أو 1088 أو 1150) أو اسم العضو..."
              className="w-full bg-transparent border-none text-white text-xs sm:text-sm font-bold placeholder-slate-500 focus:outline-none"
            />
            {searchJobNumber && (
              <button
                onClick={() => setSearchJobNumber('')}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                مسح
              </button>
            )}
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 font-bold">أرقام وظيفية سريعة للتجربة:</span>
            {data.slice(0, 5).map((rec) => (
              <button
                key={rec.id}
                onClick={() => setSearchJobNumber(rec.jobNumber)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/50 text-slate-300 font-mono-num font-bold transition-colors cursor-pointer"
              >
                {rec.jobNumber} ({rec.name.split(' ')[0]})
              </button>
            ))}
          </div>

          {/* Query Result Card */}
          {searchedMember ? (
            <div className="bg-slate-900/90 border-2 border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-5 animate-fadeIn">
              {/* Member Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center text-lg font-black font-mono-num">
                    {searchedMember.jobNumber}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{searchedMember.name}</h4>
                    <p className="text-xs text-slate-400">
                      الرقم الوظيفي المعتمد: <span className="text-purple-300 font-mono-num font-bold">{searchedMember.jobNumber}</span> | الجهاز المركزي للمحاسبات
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-xs text-slate-400 block">رصيد أول المدة من المدخرات</span>
                  <span className="text-xl font-black text-amber-400 font-mono-num">
                    {searchedMember.openingSavingsBalance.toLocaleString()} {settings.currencySymbol}
                  </span>
                </div>
              </div>

              {/* Debt & Deductions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Debt Category & Detail */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">بند المديونية والتقسيط</span>
                  <span className="text-sm font-black text-purple-300 block">
                    {debtCategoryLabel[searchedMember.debtCategory] || searchedMember.debtCategory}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium bg-slate-900/80 p-1.5 rounded">
                    {searchedMember.debtDetail || 'لا توجد ملاحظات إضافية'}
                  </p>
                </div>

                {/* Total Debt & Installment Months */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">إجمالي مديونية الراتب</span>
                  <span className="text-lg font-black text-rose-400 font-mono-num block">
                    {searchedMember.debtTotalAmount.toLocaleString()} {settings.currencySymbol}
                  </span>
                  <div className="text-[11px] text-slate-300 flex items-center justify-between font-mono-num">
                    <span>مدة التقسيط:</span>
                    <span className="font-bold text-amber-300">{searchedMember.installmentMonthsCount} شهر</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono-num">
                    من: {searchedMember.installmentStartDate} إلى: {searchedMember.installmentEndDate}
                  </div>
                </div>

                {/* Monthly Installment Amount */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">قيمة القسط الشهري (آلي)</span>
                  <span className="text-lg font-black text-emerald-400 font-mono-num block">
                    {searchedMember.monthlyInstallment.toLocaleString()} {settings.currencySymbol}
                  </span>
                  <span className="text-[10px] text-emerald-500/80 font-bold block">
                    يخصم تلقائياً من الاستقطاع الشهري
                  </span>
                </div>

                {/* Monthly Deduction Breakdown */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 font-mono-num text-[11px]">
                  <span className="text-slate-400 block font-sans">توزيع الاستقطاع الشهري</span>
                  <div className="flex justify-between py-0.5 border-b border-slate-900">
                    <span className="text-slate-400 font-sans">إجمالي الاستقطاع:</span>
                    <span className="font-bold text-white">{searchedMember.monthlyDeduction} ج.م</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-900">
                    <span className="text-slate-400 font-sans">اشتراك شهري:</span>
                    <span className="font-bold text-blue-400">{searchedMember.subscriptionFee} ج.م</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-900">
                    <span className="text-slate-400 font-sans">ادخار شهري:</span>
                    <span className="font-bold text-indigo-400">{searchedMember.monthlySavings} ج.م</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-amber-300 font-bold">
                    <span className="font-sans">متبقي بعد الاشتراك والادخار:</span>
                    <span>{searchedMember.remainingAfterSubAndSavings} ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          ) : searchJobNumber ? (
            <div className="text-center py-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-300">
                لم يتم العثور على عضو مسجل بالرقم الوظيفي "{searchJobNumber}"
              </p>
              <p className="text-xs text-slate-500 mt-1">
                تأكد من كتابة الرقم الوظيفي بشكل صحيح، أو قم بإضافته من زر "إضافة عضو جديد"
              </p>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-400">
              <Search className="w-10 h-10 text-purple-400/50 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-300">
                أدخل الرقم الوظيفي لأي عضو للاستعلام الفوري عن كامل مديونيته وبنود التقسيط
              </p>
              <p className="text-xs text-slate-500 mt-1">
                يعرض النظام تفاصيل عمرة رجب، حج القرعة والسياحي، وقروض العلاج والزواج والثانوية العامة
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 3: COMPLETE MASTER SAVINGS & DEDUCTIONS SHEET TABLE */}
      {activeTab === 'upload_sheet' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  جدول استقطاعات ومدخرات ومديونيات الأعضاء المعتمد ({data.length} عضو)
                </h3>
                <span className="text-[11px] text-slate-400">
                  الأعمدة مطابقة للاشتراطات الرقابية (الرقم والاسم فريدان - توزيع الاستقطاع - مدد المديونية)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold">شهر الاستقطاع:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono-num text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* The 35-Sheet Excel Compliant Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#101426] text-slate-300 font-bold border-b border-slate-800 select-none">
                <tr className="border-b border-slate-800/80">
                  <th className="p-3 text-center w-12 text-slate-500">م</th>
                  <th className="p-3 min-w-[110px] text-amber-400">الرقم الوظيفي (لا يكرر)</th>
                  <th className="p-3 min-w-[180px] text-white">الاسم (لا يكرر)</th>
                  <th className="p-3 min-w-[130px] text-amber-300">رصيد أول المدة (مدخرات)</th>
                  <th className="p-3 min-w-[120px] text-emerald-400">إجمالي الاستقطاع</th>
                  <th className="p-3 min-w-[100px] text-blue-400">اشتراك (11 ج.م)</th>
                  <th className="p-3 min-w-[100px] text-indigo-400">ادخار شهري</th>
                  <th className="p-3 min-w-[120px] text-slate-300">ما تبقى بعد الاشتراك</th>
                  <th className="p-3 min-w-[110px] text-rose-400">القسط الشهري</th>
                  <th className="p-3 min-w-[130px] text-emerald-300">ما تبقى بعد الاشتراك والادخار</th>
                  <th className="p-3 min-w-[120px] text-rose-300">إجمالي مديونية الراتب</th>
                  <th className="p-3 min-w-[100px] text-slate-300">مدة التقسيط (شهور)</th>
                  <th className="p-3 min-w-[140px] text-slate-400">فترة التقسيط (من - إلى)</th>
                  <th className="p-3 min-w-[180px] text-purple-300">بند التقسيط وتفاصيله</th>
                  <th className="p-3 text-center w-16 text-slate-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {data.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3 text-center text-slate-500 font-mono-num">{idx + 1}</td>
                    <td className="p-3 font-mono-num font-black text-amber-400">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {row.jobNumber}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{row.name}</td>
                    <td className="p-3 font-mono-num text-amber-300 font-bold">
                      {row.openingSavingsBalance.toLocaleString()} {settings.currencySymbol}
                    </td>
                    <td className="p-3 font-mono-num font-bold text-emerald-400">
                      {row.monthlyDeduction.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono-num text-blue-400 font-bold">
                      {row.subscriptionFee} ج.م
                    </td>
                    <td className="p-3 font-mono-num text-indigo-300 font-bold">
                      {row.monthlySavings.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono-num text-slate-300">
                      {row.remainingAfterSub.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono-num font-bold text-rose-400">
                      {row.monthlyInstallment.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono-num font-bold text-emerald-300">
                      {row.remainingAfterSubAndSavings.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono-num text-rose-300">
                      {row.debtTotalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono-num text-center text-slate-300">
                      {row.installmentMonthsCount} شهر
                    </td>
                    <td className="p-3 font-mono-num text-[11px] text-slate-400">
                      {row.installmentStartDate} ⬅ {row.installmentEndDate}
                    </td>
                    <td className="p-3">
                      <div className="text-purple-300 font-bold text-[11px]">
                        {debtCategoryLabel[row.debtCategory] || row.debtCategory}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={row.debtDetail}>
                        {row.debtDetail}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                        title="حذف السطر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
                <tr>
                  <td colSpan={3} className="p-3 text-left font-black text-amber-400">
                    الإجماليات العامة للمصنف:
                  </td>
                  <td className="p-3 font-mono-num text-amber-300">
                    {totals.totalOpeningSavings.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono-num text-emerald-400">
                    {totals.totalDeduction.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono-num text-blue-400">
                    {totals.totalSubscriptions.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono-num text-indigo-300">
                    {totals.totalSavings.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono-num text-slate-400">-</td>
                  <td className="p-3 font-mono-num text-rose-400">
                    {totals.totalInstallments.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono-num text-emerald-300">-</td>
                  <td className="p-3 font-mono-num text-rose-300">
                    {totals.totalDebts.toLocaleString()}
                  </td>
                  <td colSpan={4} className="p-3 text-left text-slate-400 text-[11px]">
                    معادلات الاستقطاع والتقسيط محسوبة آلياً 100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
