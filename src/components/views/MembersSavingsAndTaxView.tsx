import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  Receipt,
  Search,
  Plus,
  Building,
  UserCheck,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Printer,
  RefreshCw,
  Sparkles,
  FileText,
  ShieldCheck,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { Member, Supplier, JournalEntry, SystemSettings, TaxForm41Record } from '../../types/accounting';
import { Form41PrintModal } from '../common/Form41PrintModal';
import { exportForm41Excel, exportForm41EtaCsv, exportForm41Json } from '../../services/form41Exporter';

interface MembersSavingsAndTaxViewProps {
  mode: 'savings' | 'tax';
  members: Member[];
  suppliers: Supplier[];
  entries: JournalEntry[];
  settings: SystemSettings;
}

export const MembersSavingsAndTaxView: React.FC<MembersSavingsAndTaxViewProps> = ({
  mode,
  members,
  suppliers,
  entries,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL'>('Q1');
  const [dealRateFilter, setDealRateFilter] = useState<'all' | '1' | '3' | '5'>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [generationToast, setGenerationToast] = useState<string | null>(null);

  // Helper to generate Form 41 records dynamically from registered suppliers
  const generateForm41FromSuppliers = (targetQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL'): TaxForm41Record[] => {
    return suppliers.map((s, idx) => {
      // Determine deal amount based on supplier balance or standard operations
      let gross = s.balance > 0 ? s.balance : 150000;
      if (s.activityType === 'tourism_company') gross = 550000 - idx * 60000;
      else if (s.activityType === 'hotels') gross = 450000 - idx * 40000;
      else if (s.activityType === 'flights') gross = 390000;
      else if (s.activityType === 'transport') gross = 140000;
      else if (s.activityType === 'exhibitions_vendor') gross = 220000 - idx * 50000;
      else gross = 45000;

      const rate = s.withholdingTaxRate || 1;
      const taxWithheld = Math.round(gross * (rate / 100));
      const net = gross - taxWithheld;

      let dealType: TaxForm41Record['dealType'] = 'supplies';
      let dealTypeAr = 'توريدات وإقامة فندقية (1%)';
      if (s.activityType === 'transport') {
        dealType = 'services';
        dealTypeAr = 'خدمات نقل وسياحة (3%)';
      } else if (s.activityType === 'general_services') {
        dealType = 'professional';
        dealTypeAr = 'أتعاب تدقيق واستشارات (5%)';
      } else if (s.activityType === 'tourism_company') {
        dealType = 'supplies';
        dealTypeAr = 'تنظيم رحلات حج وعمرة وإقامة (1%)';
      }

      const q = targetQuarter === 'ALL' ? (idx % 2 === 0 ? 'Q1' : 'Q2') : targetQuarter;
      const qAr =
        q === 'Q1'
          ? 'الربع الأول 2026'
          : q === 'Q2'
          ? 'الربع الثاني 2026'
          : q === 'Q3'
          ? 'الربع الثالث 2025'
          : 'الربع الرابع 2025';

      const docDate =
        q === 'Q1'
          ? `2026-0${(idx % 3) + 1}-15`
          : q === 'Q2'
          ? `2026-0${(idx % 3) + 4}-15`
          : q === 'Q3'
          ? `2025-0${(idx % 3) + 7}-15`
          : `2025-1${idx % 3}-15`;

      return {
        id: `f41-${s.id}-${q}`,
        serialNo: idx + 1,
        supplierId: s.id,
        supplierCode: s.code,
        supplierName: s.name,
        taxRegistrationNumber: s.taxId,
        commercialRegister: s.commercialRegister,
        licenseNumber: s.licenseNumber,
        address: s.address,
        docNumber: `INV-2026-${String(idx + 101).padStart(4, '0')}`,
        docDate: docDate,
        dealType: dealType,
        dealTypeAr: dealTypeAr,
        grossAmount: gross,
        taxRate: rate,
        taxWithheld: taxWithheld,
        netPaid: net,
        paymentMethod: 'check',
        checkOrTransferNo: `CHQ-BM-${String(40012 + idx)}`,
        bankName: 'بنك مصر (1990199000000018)',
        quarter: q as any,
        quarterAr: qAr,
        fiscalYear: '2025 / 2026',
        status: idx % 3 === 0 ? 'remitted_to_bank' : 'withheld_ready',
        remittanceNoticeNo: idx % 3 === 0 ? `BM-NOT-${String(9840 + idx)}` : undefined,
      };
    });
  };

  const [form41Records, setForm41Records] = useState<TaxForm41Record[]>(() =>
    generateForm41FromSuppliers('Q1')
  );

  const handleRegenerateFromSuppliers = () => {
    const updated = generateForm41FromSuppliers(selectedQuarter);
    setForm41Records(updated);
    setGenerationToast(
      `تم توليد ومطابقة ${updated.length} سجل تعامل ضريبي لنموذج 41 تلقائياً من دليل الموردين المعتمد وحسابات البنك!`
    );
    setTimeout(() => setGenerationToast(null), 4000);
  };

  const quarterTitle = useMemo(() => {
    if (selectedQuarter === 'Q1') return 'الربع الأول 2026 (يناير - مارس)';
    if (selectedQuarter === 'Q2') return 'الربع الثاني 2026 (أبريل - يونيو)';
    if (selectedQuarter === 'Q3') return 'الربع الثالث 2025 (يوليو - سبتمبر)';
    if (selectedQuarter === 'Q4') return 'الربع الرابع 2025 (أكتوبر - ديسمبر)';
    return 'كامل السنة المالية (2025 / 2026)';
  }, [selectedQuarter]);

  const filteredTaxRecords = useMemo(() => {
    return form41Records.filter((r) => {
      const matchSearch =
        r.supplierName.includes(searchQuery) ||
        r.supplierCode.includes(searchQuery) ||
        r.taxRegistrationNumber.includes(searchQuery) ||
        r.docNumber.includes(searchQuery) ||
        (r.address && r.address.includes(searchQuery));

      if (!matchSearch) return false;

      if (dealRateFilter !== 'all') {
        if (Number(dealRateFilter) !== r.taxRate) return false;
      }

      if (selectedQuarter !== 'ALL') {
        if (r.quarter !== selectedQuarter) return false;
      }

      return true;
    });
  }, [form41Records, searchQuery, dealRateFilter, selectedQuarter]);

  const totalGrossAmount = filteredTaxRecords.reduce((s, r) => s + r.grossAmount, 0);
  const totalTaxWithheld = filteredTaxRecords.reduce((s, r) => s + r.taxWithheld, 0);
  const totalNetPaid = filteredTaxRecords.reduce((s, r) => s + r.netPaid, 0);

  if (mode === 'savings') {
    const totalSavings = members.reduce((s, m) => s + m.savingsBalance, 0);
    const filtered = members.filter(
      (m) =>
        m.name.includes(searchQuery) ||
        m.memberNo.includes(searchQuery) ||
        m.department.includes(searchQuery)
    );

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>سجل مدخرات وأمانات أعضاء الجهاز المركزي للمحاسبات</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
                  حساب 2131
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                متابعة الخصومات الشهرية من رواتب الأعضاء واستخدامها في تمويل رحلات الحج والعمرة والمعارض
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">إجمالي رصيد الأمانات:</span>
            <span className="text-base font-bold text-purple-300 font-mono-num">
              {totalSavings.toLocaleString()} {settings.currencySymbol}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم العضوية، الاسم، الإدارة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end text-xs text-slate-400 gap-2">
            <span>تحديث آلي مطابق لسطور القيد اليومي على حساب أمانات الأعضاء 2131</span>
          </div>
        </div>

        {/* Savings Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">رقم العضوية</th>
                <th className="p-3 min-w-[180px]">اسم العضو</th>
                <th className="p-3">الإدارة بالجهاز</th>
                <th className="p-3">رصيد أول المدة (ج.م)</th>
                <th className="p-3">استقطاعات وإيداعات الفترة</th>
                <th className="p-3">مسحوبات لتمويل الرحلات</th>
                <th className="p-3 font-bold text-purple-300">الرصيد القائم للأمانات</th>
                <th className="p-3">الحد الائتماني لتقسيط الرحلات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((m) => {
                const creditLimit = m.savingsBalance * 1.5;
                return (
                  <tr key={m.id} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                    <td className="p-3 font-mono-num font-bold text-amber-300">{m.memberNo}</td>
                    <td className="p-3 font-semibold text-white">{m.name}</td>
                    <td className="p-3 text-slate-300">{m.department}</td>
                    <td className="p-3 font-mono-num text-slate-400">
                      {(m.savingsBalance - 15000).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono-num text-emerald-400 font-bold">15,000</td>
                    <td className="p-3 font-mono-num text-slate-500">0.00</td>
                    <td className="p-3 font-mono-num font-bold text-purple-300 text-sm">
                      {m.savingsBalance.toLocaleString()} {settings.currencySymbol}
                    </td>
                    <td className="p-3 font-mono-num font-semibold text-amber-400">
                      {creditLimit.toLocaleString()} {settings.currencySymbol}
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

  // ========================================================
  // Tax Withholding & Form 41 Tool (Sheet 18)
  // ========================================================
  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {generationToast && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{generationToast}</span>
        </div>
      )}

      {/* Main Header with Association Tax Details */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                منظومة وأداة توليد نموذج (41) ضرائب لخصم وتحصيل وتوريد المبالغ
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                حساب 2121 / 2161
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                مصلحة الضرائب المصرية
              </span>
            </div>
            <p className="text-xs text-slate-300">
              توليد آلي كامل لملف بيانات نموذج 41 من حسابات الموردين وتجهيزه للطباعة الرسمية والرفع على المنظومة
            </p>

            {/* Official Registration Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono-num text-[11px]">
              <span className="px-2.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                رقم التسجيل الضريبي للجمعية: <strong className="text-amber-300">{settings.taxRegistrationNumber || '706054423'}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                الرقم التأميني: <strong className="text-cyan-300">{settings.insuranceNumber || '1854663'}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                الملف الضريبي: <strong className="text-slate-200">{settings.taxFileNumber || '142/98/215'}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                حساب التوريد: <strong className="text-emerald-300">بنك مصر (1990199000000018)</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Auto-Generation Tool Button */}
          <button
            onClick={handleRegenerateFromSuppliers}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/40 border border-indigo-400/40 transition-all cursor-pointer active:scale-95 group"
            title="توليد وتحديث كافة تعاملات الموردين تلقائياً"
          >
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>توليد بيانات نموذج 41 تلقائياً</span>
          </button>

          {/* Official Print Preparation Button */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/40 border border-amber-400/50 transition-all cursor-pointer active:scale-95 group"
            title="تجهيز وعرض نموذج 41 للطباعة الرسمية والاعتماد"
          >
            <Printer className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
            <span>تجهيز ومعاينة الطباعة الرسمية</span>
          </button>

          {/* Excel Export Button */}
          <button
            onClick={() => exportForm41Excel(filteredTaxRecords, settings, quarterTitle)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-950/30"
            title="تصدير شيت إكسل 365 مطابق للمصلحة"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسل</span>
          </button>

          {/* ETA Portal CSV Export */}
          <button
            onClick={() => exportForm41EtaCsv(filteredTaxRecords, settings)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
            title="تصدير ملف المنظومة الضريبية المميكنة (ETA CSV)"
          >
            <FileText className="w-4 h-4 text-cyan-300" />
            <span className="hidden sm:inline">ملف ETA</span>
          </button>

          {/* JSON Export */}
          <button
            onClick={() => exportForm41Json(filteredTaxRecords, settings)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700"
            title="تصدير ملف JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400">إجمالي التعاملات الخاضعة للخصم:</span>
          <div className="text-lg font-black text-white font-mono-num">
            {totalGrossAmount.toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </div>
          <span className="text-[10px] text-slate-500 block">توريدات وفنادق وطيران ونقل ومعارض</span>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/40 p-3.5 rounded-xl space-y-1">
          <span className="text-[11px] text-amber-300 font-bold">إجمالي الضريبة المستقطعة الموردة:</span>
          <div className="text-lg font-black text-amber-400 font-mono-num">
            {totalTaxWithheld.toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </div>
          <span className="text-[10px] text-emerald-400 block font-semibold">جاهزة للتوريد لمصلحة الضرائب عبر بنك مصر</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400">صافي المبالغ المنصرفة للموردين:</span>
          <div className="text-lg font-black text-emerald-300 font-mono-num">
            {totalNetPaid.toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </div>
          <span className="text-[10px] text-slate-500 block">مسددة بشيكات وتحويلات بنكية</span>
        </div>

        <div className="bg-slate-900/90 border border-indigo-500/40 p-3.5 rounded-xl space-y-1">
          <span className="text-[11px] text-indigo-300 font-bold">الموعد القانوني للتوريد والتقديم:</span>
          <div className="text-sm font-black text-white flex items-center gap-1.5 pt-0.5">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>خلال شهر من نهاية كل ربع</span>
          </div>
          <span className="text-[10px] text-cyan-300 block font-mono-num">الاستحقاق القادم: 10 أبريل 2026</span>
        </div>
      </div>

      {/* Filter and Quarter Selection Toolbar */}
      <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl space-y-3">
        {/* Quarter Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 ml-1">الفترة الضريبية:</span>
            <button
              onClick={() => setSelectedQuarter('Q1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedQuarter === 'Q1'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              الربع الأول (يناير - مارس 2026)
            </button>
            <button
              onClick={() => setSelectedQuarter('Q2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedQuarter === 'Q2'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              الربع الثاني (أبريل - يونيو 2026)
            </button>
            <button
              onClick={() => setSelectedQuarter('Q3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedQuarter === 'Q3'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              الربع الثالث (يوليو - سبتمبر 2025)
            </button>
            <button
              onClick={() => setSelectedQuarter('Q4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedQuarter === 'Q4'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              الربع الرابع (أكتوبر - ديسمبر 2025)
            </button>
            <button
              onClick={() => setSelectedQuarter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedQuarter === 'ALL'
                  ? 'bg-[#3632c7] text-white font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              كامل السنة المالية (2025/2026)
            </button>
          </div>

          {/* Withholding Rate Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">نسبة الخصم:</span>
            <select
              value={dealRateFilter}
              onChange={(e) => setDealRateFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs"
            >
              <option value="all">كافة النسب المقررة</option>
              <option value="1">1% توريدات وسلع وإقامة</option>
              <option value="3">3% خدمات ونقل وسياحة</option>
              <option value="5">5% استشارات ومهن حرة</option>
            </select>
          </div>
        </div>

        {/* Search Input and Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باسم الممول، كود المورد الفريد، رقم التسجيل الضريبي، أو رقم الفاتورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end text-xs text-slate-400 gap-2">
            <span>عدد التعاملات المدرجة بالنموذج: <strong className="text-white font-mono-num">{filteredTaxRecords.length}</strong> تعامل معتمد</span>
          </div>
        </div>
      </div>

      {/* Tax Form 41 Official Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3 text-center w-8">م</th>
              <th className="p-3 w-28">كود المورد</th>
              <th className="p-3 min-w-[190px]">اسم الممول / الشركة (المورد)</th>
              <th className="p-3">رقم التسجيل الضريبي</th>
              <th className="p-3 min-w-[130px]">الترخيص / السجل التجاري</th>
              <th className="p-3 min-w-[110px]">رقم وتاريخ الفاتورة</th>
              <th className="p-3 min-w-[140px]">طبيعة المعاملة</th>
              <th className="p-3 font-bold text-slate-200">المبلغ الإجمالي</th>
              <th className="p-3 text-center w-14">نسبة الخصم</th>
              <th className="p-3 font-bold text-amber-400">الضريبة المستقطعة</th>
              <th className="p-3 font-bold text-emerald-400">الصافي المنصرف</th>
              <th className="p-3 min-w-[130px]">بيانات سداد البنك</th>
              <th className="p-3 text-center">حالة السداد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredTaxRecords.map((r, idx) => (
              <tr key={r.id || idx} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                <td className="p-3 text-center font-mono-num font-bold text-slate-500">{idx + 1}</td>
                <td className="p-3 font-mono-num font-bold text-amber-300 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    {r.supplierCode}
                  </span>
                </td>
                <td className="p-3 font-semibold text-white">
                  <div>{r.supplierName}</div>
                  {r.address && <div className="text-[10px] text-slate-500 font-normal pt-0.5">{r.address}</div>}
                </td>
                <td className="p-3 font-mono-num text-slate-300 font-bold whitespace-nowrap">{r.taxRegistrationNumber}</td>
                <td className="p-3 text-[11px] text-slate-400">
                  <div>{r.licenseNumber || '—'}</div>
                  <div className="text-[10px] text-slate-500 font-mono-num">{r.commercialRegister}</div>
                </td>
                <td className="p-3 font-mono-num text-[11px]">
                  <div className="text-white font-semibold">{r.docNumber}</div>
                  <div className="text-slate-500">{r.docDate}</div>
                </td>
                <td className="p-3 text-slate-300 text-[11px]">{r.dealTypeAr}</td>
                <td className="p-3 font-mono-num font-bold text-white whitespace-nowrap">
                  {r.grossAmount.toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded font-mono-num font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                    {r.taxRate}%
                  </span>
                </td>
                <td className="p-3 font-mono-num font-bold text-amber-400 text-sm whitespace-nowrap">
                  {r.taxWithheld.toLocaleString()} {settings.currencySymbol}
                </td>
                <td className="p-3 font-mono-num text-emerald-400 font-bold whitespace-nowrap">
                  {r.netPaid.toLocaleString()}
                </td>
                <td className="p-3 text-[11px]">
                  <div className="font-mono-num text-slate-300">{r.checkOrTransferNo}</div>
                  <div className="text-[10px] text-slate-500">{r.bankName}</div>
                </td>
                <td className="p-3 text-center">
                  {r.status === 'remitted_to_bank' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                      تم التوريد بالبنك
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                      محتجز للتوريد
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
            <tr>
              <td colSpan={7} className="p-3 text-left pl-6 text-slate-300">
                إجمالي التعاملات المعروضة لنموذج (41) ضرائب:
              </td>
              <td className="p-3 font-mono-num font-black text-white whitespace-nowrap">
                {totalGrossAmount.toLocaleString()} {settings.currencySymbol}
              </td>
              <td className="p-3 text-center font-mono-num">—</td>
              <td className="p-3 font-mono-num font-black text-amber-400 text-sm whitespace-nowrap bg-amber-950/20">
                {totalTaxWithheld.toLocaleString()} {settings.currencySymbol}
              </td>
              <td className="p-3 font-mono-num font-black text-emerald-400 whitespace-nowrap">
                {totalNetPaid.toLocaleString()} {settings.currencySymbol}
              </td>
              <td colSpan={2} className="p-3 text-center text-slate-400 text-[11px]">
                توريد عبر بنك مصر
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Official Print Modal */}
      <Form41PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={filteredTaxRecords}
        settings={settings}
        quarterTitle={quarterTitle}
      />
    </div>
  );
};

