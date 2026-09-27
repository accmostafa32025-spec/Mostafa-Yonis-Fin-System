import React, { useState, useMemo } from 'react';
import {
  Monitor,
  Cpu,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingDown,
  Layers,
  ArrowRightLeft,
  ShieldCheck,
  Printer,
  Sparkles,
  Info,
} from 'lucide-react';
import { FixedAssetRecord, SystemSettings, JournalEntry } from '../../types/accounting';
import * as XLSX from 'xlsx';

interface FixedAssetsDepreciationScheduleProps {
  settings: SystemSettings;
  onAddJournalEntry?: (entry: JournalEntry) => void;
  currencySymbol?: string;
}

export const INITIAL_FIXED_ASSETS: FixedAssetRecord[] = [
  {
    id: 'ast-1',
    code: 'AST-PC-01',
    name: 'خادم قواعد بيانات مركزي Dell PowerEdge وتجهيزات السيرفر',
    category: 'servers',
    categoryAr: 'خوادم وقواعد بيانات',
    acquisitionDate: '2024-07-01',
    purchaseCost: 95000,
    salvageValue: 5000,
    depreciationRate: 20,
    accumulatedDepreciationPrior: 18000, // سنة سابقة
    currentPeriodDepreciation: 18000, // 20% من (95000 - 5000)
    totalAccumulatedDepreciation: 36000,
    netBookValue: 59000,
    accountCode: '1211',
    accumulatedDepAccountCode: '1221',
    depExpenseAccountCode: '5231',
    status: 'active',
    location: 'غرفة السيرفر المركزية - مقر الجمعية',
    assignedTo: 'Mostafa Yonis (Financial Manager)',
  },
  {
    id: 'ast-2',
    code: 'AST-PC-02',
    name: 'حاسب آلي محمول عالي الأداء HP ZBook - الإدارة المالية',
    category: 'computers',
    categoryAr: 'حاسبات آلية',
    acquisitionDate: '2024-10-01',
    purchaseCost: 45000,
    salvageValue: 0,
    depreciationRate: 20,
    accumulatedDepreciationPrior: 6750, // 9 شهور
    currentPeriodDepreciation: 9000, // 20% سنوي
    totalAccumulatedDepreciation: 15750,
    netBookValue: 29250,
    accountCode: '1211',
    accumulatedDepAccountCode: '1221',
    depExpenseAccountCode: '5231',
    status: 'active',
    location: 'مكتب المدير المالي',
    assignedTo: 'Mostafa Yonis',
  },
  {
    id: 'ast-3',
    code: 'AST-PC-03',
    name: 'محطة عمل وتدقيق Dell Precision - قسم المراجعة والحسابات',
    category: 'computers',
    categoryAr: 'حاسبات آلية',
    acquisitionDate: '2025-01-15',
    purchaseCost: 38000,
    salvageValue: 0,
    depreciationRate: 20,
    accumulatedDepreciationPrior: 3800,
    currentPeriodDepreciation: 7600,
    totalAccumulatedDepreciation: 11400,
    netBookValue: 26600,
    accountCode: '1211',
    accumulatedDepAccountCode: '1221',
    depExpenseAccountCode: '5231',
    status: 'active',
    location: 'مكتب المراجعة الداخلية',
    assignedTo: 'Dina Hany (Senior Accountant)',
  },
  {
    id: 'ast-4',
    code: 'AST-PC-04',
    name: 'محطة عمل متكاملة Lenovo ThinkCentre - الرقابة المالية',
    category: 'computers',
    categoryAr: 'حاسبات آلية',
    acquisitionDate: '2025-03-01',
    purchaseCost: 35000,
    salvageValue: 0,
    depreciationRate: 20,
    accumulatedDepreciationPrior: 2333,
    currentPeriodDepreciation: 7000,
    totalAccumulatedDepreciation: 9333,
    netBookValue: 25667,
    accountCode: '1211',
    accumulatedDepAccountCode: '1221',
    depExpenseAccountCode: '5231',
    status: 'active',
    location: 'مكتب الرقابة والمطابقة',
    assignedTo: 'Ayman Abd elsalam (Senior Accountant)',
  },
  {
    id: 'ast-5',
    code: 'AST-PC-05',
    name: 'جهاز حاسب آلي مكتبي HP ProDesk - قسم القيود وإدخال البيانات',
    category: 'computers',
    categoryAr: 'حاسبات آلية',
    acquisitionDate: '2025-07-01', // بداية السنة المالية الحالية
    purchaseCost: 32000,
    salvageValue: 0,
    depreciationRate: 20,
    accumulatedDepreciationPrior: 0,
    currentPeriodDepreciation: 6400, // سنة كاملة
    totalAccumulatedDepreciation: 6400,
    netBookValue: 25600,
    accountCode: '1211',
    accumulatedDepAccountCode: '1221',
    depExpenseAccountCode: '5231',
    status: 'active',
    location: 'صالة الحسابات',
    assignedTo: 'Mostafa Abd elal (Accountant)',
  },
  {
    id: 'ast-6',
    code: 'AST-PC-06',
    name: 'طابعة ليزر شبكية ملونة وسكانر ضوئي عالي السرعة Canon ImageRunner',
    category: 'printers_scanners',
    categoryAr: 'طابعات وماسحات ضوئية',
    acquisitionDate: '2025-09-15', // اقتناء خلال السنة الحالية
    purchaseCost: 40000,
    salvageValue: 2000,
    depreciationRate: 20,
    accumulatedDepreciationPrior: 0,
    currentPeriodDepreciation: 6017, // قسط نسبي (9.5 شهور)
    totalAccumulatedDepreciation: 6017,
    netBookValue: 33983,
    accountCode: '1211',
    accumulatedDepAccountCode: '1221',
    depExpenseAccountCode: '5231',
    status: 'active',
    location: 'غرفة الأرشيف والطباعة المركزية',
    assignedTo: 'قسم المحاسبة والأرشيف',
  },
  {
    id: 'ast-7',
    code: 'AST-PC-07',
    name: 'شبكة راوترات سيسكو وموزعات سويتش وأجهزة تغذية UPS غير منقطعة',
    category: 'it_equipment',
    categoryAr: 'تجهيزات شبكية وتأمين طاقة',
    acquisitionDate: '2024-07-01',
    purchaseCost: 35000,
    salvageValue: 0,
    depreciationRate: 20,
    accumulatedDepreciationPrior: 7000,
    currentPeriodDepreciation: 7000,
    totalAccumulatedDepreciation: 14000,
    netBookValue: 21000,
    accountCode: '1211',
    accumulatedDepAccountCode: '1221',
    depExpenseAccountCode: '5231',
    status: 'active',
    location: 'مقر الجمعية',
    assignedTo: 'قسم تكنولوجيا المعلومات',
  },
];

export const FixedAssetsDepreciationSchedule: React.FC<FixedAssetsDepreciationScheduleProps> = ({
  settings,
  onAddJournalEntry,
  currencySymbol = 'ج.م',
}) => {
  const [assets, setAssets] = useState<FixedAssetRecord[]>(INITIAL_FIXED_ASSETS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Asset Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FixedAssetRecord['category']>('computers');
  const [acquisitionDate, setAcquisitionDate] = useState('2025-10-01');
  const [purchaseCost, setPurchaseCost] = useState<number>(30000);
  const [salvageValue, setSalvageValue] = useState<number>(0);
  const [location, setLocation] = useState('مقر الجمعية');
  const [assignedTo, setAssignedTo] = useState('Mostafa Abd elal');

  // Calculate annual & period depreciation dynamically based on acquisition date
  const calculateAssetDepreciation = (cost: number, salvage: number, acqDate: string) => {
    const rate = 0.20; // 20%
    const depreciableBase = Math.max(0, cost - salvage);
    const annualAmount = Math.round(depreciableBase * rate);

    // Calculate active months in the current fiscal year (from 2025-07-01 to 2026-06-30)
    const fyStart = new Date(settings.fiscalYearStartDate || '2025-07-01');
    const fyEnd = new Date(settings.fiscalYearEndDate || '2026-06-30');
    const acq = new Date(acqDate);

    let currentPeriodAmount = annualAmount;

    if (acq > fyStart && acq <= fyEnd) {
      // Acquired during current fiscal year: calculate months remaining
      const monthsActive = Math.max(1, 12 - (acq.getMonth() - fyStart.getMonth() + (acq.getFullYear() - fyStart.getFullYear()) * 12));
      currentPeriodAmount = Math.round((annualAmount * monthsActive) / 12);
    } else if (acq > fyEnd) {
      currentPeriodAmount = 0;
    }

    return { annualAmount, currentPeriodAmount };
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPeriodAmount } = calculateAssetDepreciation(purchaseCost, salvageValue, acquisitionDate);
    const code = `AST-PC-${String(assets.length + 1).padStart(2, '0')}`;

    const newAsset: FixedAssetRecord = {
      id: `ast-${Date.now()}`,
      code,
      name: name.trim(),
      category,
      categoryAr:
        category === 'computers'
          ? 'حاسبات آلية'
          : category === 'servers'
          ? 'خوادم وقواعد بيانات'
          : category === 'printers_scanners'
          ? 'طابعات وماسحات ضوئية'
          : 'تجهيزات شبكية وتقنية',
      acquisitionDate,
      purchaseCost: Number(purchaseCost) || 0,
      salvageValue: Number(salvageValue) || 0,
      depreciationRate: 20,
      accumulatedDepreciationPrior: 0,
      currentPeriodDepreciation: currentPeriodAmount,
      totalAccumulatedDepreciation: currentPeriodAmount,
      netBookValue: (Number(purchaseCost) || 0) - currentPeriodAmount,
      accountCode: '1211',
      accumulatedDepAccountCode: '1221',
      depExpenseAccountCode: '5231',
      status: 'active',
      location: location.trim(),
      assignedTo: assignedTo.trim(),
    };

    setAssets([...assets, newAsset]);
    setShowAddModal(false);
    setName('');
    setToastMessage(`تمت إضافة الأصل ${code} بنجاح وحساب قسط إهلاكه السنوي بنسبة 20%!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Totals
  const totalCost = useMemo(() => assets.reduce((s, a) => s + a.purchaseCost, 0), [assets]);
  const totalCurrentDep = useMemo(() => assets.reduce((s, a) => s + a.currentPeriodDepreciation, 0), [assets]);
  const totalAccumulatedDep = useMemo(() => assets.reduce((s, a) => s + a.totalAccumulatedDepreciation, 0), [assets]);
  const totalNetBookValue = useMemo(() => assets.reduce((s, a) => s + a.netBookValue, 0), [assets]);

  // Generate Automatic Depreciation Journal Entry
  const handleGenerateDepreciationEntry = () => {
    if (!onAddJournalEntry) {
      alert('تم توليد قسط الإهلاك السنوي بنجاح!');
      return;
    }

    const entryNumber = `DEP-2026-${Date.now().toString().slice(-4)}`;
    const newEntry: JournalEntry = {
      id: `entry-dep-${Date.now()}`,
      entryNo: entryNumber,
      date: settings.fiscalYearEndDate || '2026-06-30',
      description: `إثبات قسط إهلاك أجهزة الحاسب الآلي والتجهيزات التقنية السنوي بنسبة 20% قسط ثابت عن السنة المالية ${settings.fiscalYearDisplay || '2025 / 2026'}`,
      status: 'approved',
      entryType: 'adjustment',
      documentNo: 'SCH-DEP-PC-2026',
      documentType: 'settlement',
      fiscalYear: settings.fiscalYear || 2026,
      period: settings.activePeriod || '2026-03',
      createdBy: 'Mostafa Abd elal',
      approvedBy: 'Mostafa Yonis',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        {
          id: `line-1-${Date.now()}`,
          accountId: 'acc-5231',
          accountCode: '5231',
          accountName: 'إهلاك الأصول الثابتة السنوي (حاسبات وتجهيزات)',
          debit: totalCurrentDep,
          credit: 0,
          notes: `قسط إهلاك سنوي 20% لكافة حاسبات الجمعية عن العام المالي ${settings.fiscalYearDisplay}`,
          costCenterId: 'cc-1',
          costCenterName: 'النشاط العام والإدارة التنفيذية',
        },
        {
          id: `line-2-${Date.now()}`,
          accountId: 'acc-1221',
          accountCode: '1221',
          accountName: 'مجمع إهلاك الأصول الثابتة (حاسبات آلية)',
          debit: 0,
          credit: totalCurrentDep,
          notes: `إثبات مجمع إهلاك الحاسبات والتجهيزات لعام ${settings.fiscalYearDisplay}`,
        },
      ],
      totalDebit: totalCurrentDep,
      totalCredit: totalCurrentDep,
    };

    onAddJournalEntry(newEntry);
    setToastMessage(
      `تم إدراج وترحيل قيد الإهلاك السنوي التلقائي رقم ${entryNumber} بقيمة ${totalCurrentDep.toLocaleString()} ${currencySymbol} إلى دفتر اليومية العامة بنجاح!`
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ['جمعية تيسير الحج والعمرة للعاملين بالجهاز المركزي للمحاسبات'],
      ['جدول إهلاك الأصول الثابتة (حاسبات آلية وتجهيزات تقنية - معدل 20% سنوياً)'],
      [`الفترة: ${settings.fiscalYearRule || 'السنة المالية من 1 يوليه 2025 وحتى 30 يونيه 2026'}`],
      [''],
      [
        'كود الأصل',
        'اسم الحاسب / الخادم / الأصل',
        'التصنيف',
        'تاريخ الاقتناء',
        'التكلفة التاريخية (ج.م)',
        'القيمة التخريدية (ج.م)',
        'معدل الإهلاك السنوي (%)',
        'مجمع الإهلاك السابق (ج.م)',
        'قسط إهلاك الفترة الحالية (ج.م)',
        'إجمالي مجمع الإهلاك (ج.م)',
        'صافي القيمة الدفترية (ج.م)',
        'الموقع والمستخدم المسؤول',
      ],
      ...assets.map((a) => [
        a.code,
        a.name,
        a.categoryAr,
        a.acquisitionDate,
        a.purchaseCost,
        a.salvageValue,
        `${a.depreciationRate}%`,
        a.accumulatedDepreciationPrior,
        a.currentPeriodDepreciation,
        a.totalAccumulatedDepreciation,
        a.netBookValue,
        `${a.location || ''} - ${a.assignedTo || ''}`,
      ]),
      [''],
      [
        'الإجمالي العام للأصول والحاسبات:',
        '',
        '',
        '',
        totalCost,
        '',
        '20% قسط ثابت',
        '',
        totalCurrentDep,
        totalAccumulatedDep,
        totalNetBookValue,
        'مطابق للدليل المحاسبي',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'جدول إهلاك الحاسبات');
    XLSX.writeFile(wb, `Fixed_Assets_Depreciation_Schedule_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                جدولة إهلاك الأصول الثابتة (حاسبات آلية وتجهيزات تقنية)
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                معدل الإهلاك السنوي 20%
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                طريقة القسط الثابت
              </span>
            </div>
            <p className="text-xs text-slate-300">
              أصول الجمعية بالكامل حاسبات آلية وخوادم وشبكات - حساب الإهلاك تلقائياً بناءً على تاريخ الاقتناء
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono-num">
              <span>حساب الأصل: <strong className="text-white">1211 (أجهزة حاسب آلي وخوادم)</strong></span>
              <span>•</span>
              <span>مجمع الإهلاك: <strong className="text-amber-300">1221 (مجمع إهلاك الأصول)</strong></span>
              <span>•</span>
              <span>مصروف الإهلاك: <strong className="text-emerald-300">5231 (إهلاك سنوي)</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Post Auto Depreciation Entry */}
          <button
            onClick={handleGenerateDepreciationEntry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all cursor-pointer active:scale-95 group"
            title="إدراج قيد الإهلاك السنوي تلقائياً في دفتر اليومية العامة"
          >
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>إدراج قيد الإهلاك التلقائي باليومية</span>
          </button>

          {/* Add Asset */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#3632c7] hover:bg-[#2c28a8] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة أصل / حاسب جديد</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">تصدير إكسل</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400">التكلفة التاريخية الإجمالية (حساب 1211):</span>
          <div className="text-lg font-black text-white font-mono-num">
            {totalCost.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currencySymbol}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">إجمالي أجهزة وخوادم وشبكات الجمعية</span>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/40 p-3.5 rounded-xl space-y-1">
          <span className="text-[11px] text-amber-300 font-bold">قسط إهلاك الفترة الحالية (20% سنوياً):</span>
          <div className="text-lg font-black text-amber-400 font-mono-num">
            {totalCurrentDep.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currencySymbol}</span>
          </div>
          <span className="text-[10px] text-emerald-400 block font-semibold">محسوب بدقة حسب تاريخ الاقتناء</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400">إجمالي مجمع الإهلاك (حساب 1221):</span>
          <div className="text-lg font-black text-rose-300 font-mono-num">
            {totalAccumulatedDep.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currencySymbol}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">مجمع الإهلاك التراكمي حتى تاريخه</span>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/40 p-3.5 rounded-xl space-y-1">
          <span className="text-[11px] text-emerald-300 font-bold">صافي القيمة الدفترية للأصول:</span>
          <div className="text-lg font-black text-emerald-400 font-mono-num">
            {totalNetBookValue.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currencySymbol}</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono-num">يظهر في قائمة المركز المالي بالميزانية</span>
        </div>
      </div>

      {/* Fixed Assets Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3 w-24">كود الأصل</th>
              <th className="p-3 min-w-[220px]">اسم الأصل ومواصفاته الفنية</th>
              <th className="p-3">التصنيف</th>
              <th className="p-3">تاريخ الاقتناء</th>
              <th className="p-3 font-bold text-white">تكلفة الشراء (ج.م)</th>
              <th className="p-3 text-center">معدل الإهلاك</th>
              <th className="p-3 text-slate-400">مجمع سابق</th>
              <th className="p-3 font-bold text-amber-300">قسط الفترة الحالية</th>
              <th className="p-3 text-rose-300">إجمالي المجمع</th>
              <th className="p-3 font-bold text-emerald-400">صافي الدفترية</th>
              <th className="p-3">المسؤول والموقع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {assets.map((a) => (
              <tr key={a.id} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                <td className="p-3 font-mono-num font-bold text-amber-300 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    {a.code}
                  </span>
                </td>
                <td className="p-3 font-semibold text-white">
                  <div>{a.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal pt-0.5">
                    القيمة التخريدية: {a.salvageValue.toLocaleString()} {currencySymbol}
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 whitespace-nowrap">
                    {a.categoryAr}
                  </span>
                </td>
                <td className="p-3 font-mono-num text-slate-300 whitespace-nowrap">{a.acquisitionDate}</td>
                <td className="p-3 font-mono-num font-bold text-white whitespace-nowrap">
                  {a.purchaseCost.toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded font-mono-num font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                    {a.depreciationRate}%
                  </span>
                </td>
                <td className="p-3 font-mono-num text-slate-400 whitespace-nowrap">
                  {a.accumulatedDepreciationPrior.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num font-bold text-amber-400 text-sm whitespace-nowrap bg-amber-950/20">
                  {a.currentPeriodDepreciation.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num font-semibold text-rose-300 whitespace-nowrap">
                  {a.totalAccumulatedDepreciation.toLocaleString()}
                </td>
                <td className="p-3 font-mono-num font-bold text-emerald-400 whitespace-nowrap">
                  {a.netBookValue.toLocaleString()}
                </td>
                <td className="p-3 text-[11px] text-slate-400">
                  <div className="text-slate-200 font-medium">{a.assignedTo}</div>
                  <div className="text-[10px] text-slate-500">{a.location}</div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
            <tr>
              <td colSpan={4} className="p-3 text-left pl-6 text-slate-300">
                إجمالي أصول وحاسبات الجمعية:
              </td>
              <td className="p-3 font-mono-num font-black text-white whitespace-nowrap">
                {totalCost.toLocaleString()} {currencySymbol}
              </td>
              <td className="p-3 text-center font-mono-num">20%</td>
              <td className="p-3 font-mono-num text-slate-400 whitespace-nowrap">
                {assets.reduce((s, a) => s + a.accumulatedDepreciationPrior, 0).toLocaleString()}
              </td>
              <td className="p-3 font-mono-num font-black text-amber-400 text-sm whitespace-nowrap bg-amber-950/30">
                {totalCurrentDep.toLocaleString()} {currencySymbol}
              </td>
              <td className="p-3 font-mono-num font-bold text-rose-300 whitespace-nowrap">
                {totalAccumulatedDep.toLocaleString()} {currencySymbol}
              </td>
              <td className="p-3 font-mono-num font-black text-emerald-400 whitespace-nowrap">
                {totalNetBookValue.toLocaleString()} {currencySymbol}
              </td>
              <td className="p-3 text-slate-400 text-[11px]">مجمع معتمد</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-amber-400" />
                <span>إضافة حاسب آلي / أصل جديد لجدول الإهلاك (20%)</span>
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">اسم الأصل وتفاصيله</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: جهاز حاسب آلي مكتبي HP Core i7 مع شاشة 24 بوصة"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="computers">حاسبات آلية ومحمولة</option>
                    <option value="servers">خوادم وقواعد بيانات</option>
                    <option value="printers_scanners">طابعات وماسحات ضوئية</option>
                    <option value="it_equipment">تجهيزات شبكية وطاقة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">تاريخ الاقتناء</label>
                  <input
                    type="date"
                    required
                    value={acquisitionDate}
                    onChange={(e) => setAcquisitionDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">تكلفة الشراء التاريخية ({currencySymbol})</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono-num font-bold text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">القيمة التخريدية المتوقعة ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={salvageValue}
                    onChange={(e) => setSalvageValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">المستخدم المسؤول</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">مكان التواجد</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200">
                معدل الإهلاك مطبق تلقائياً بنسبة <strong>20% سنوياً</strong> (طريقة القسط الثابت المعتمدة لأجهزة الحاسبات بالجهاز المركزي للمحاسبات).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#3632c7] hover:bg-[#2c28a8] text-white font-bold cursor-pointer"
                >
                  إضافة وحساب الإهلاك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
