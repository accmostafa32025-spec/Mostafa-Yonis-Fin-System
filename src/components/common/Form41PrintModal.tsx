import React from 'react';
import { Printer, Download, X, ShieldCheck, CheckCircle2, Building, Receipt } from 'lucide-react';
import { TaxForm41Record, SystemSettings } from '../../types/accounting';
import { exportForm41Excel } from '../../services/form41Exporter';

interface Form41PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: TaxForm41Record[];
  settings: SystemSettings;
  quarterTitle: string;
}

export const Form41PrintModal: React.FC<Form41PrintModalProps> = ({
  isOpen,
  onClose,
  records,
  settings,
  quarterTitle,
}) => {
  if (!isOpen) return null;

  const totalGross = records.reduce((s, r) => s + r.grossAmount, 0);
  const totalTax = records.reduce((s, r) => s + r.taxWithheld, 0);
  const totalNet = records.reduce((s, r) => s + r.netPaid, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-auto">
        {/* Modal Toolbar - Hidden during actual print */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/90 print:hidden shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>معاينة الطباعة الرسمية لنموذج (41) ضرائب الخصم والتحصيل</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono-num font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {quarterTitle}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                مجهز للطباعة الرسمية والمطابقة مع إشعارات التوريد البنكي بمصلحة الضرائب المصرية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportForm41Excel(records, settings, quarterTitle)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تحميل إكسل 365</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة النموذج الرسمي</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Sheet Container */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-950/60 print:bg-white print:p-0 print:overflow-visible">
          {/* A4 Printable Paper */}
          <div
            id="official-form41-paper"
            className="max-w-[1000px] mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-xl shadow-2xl border border-slate-300 print:border-none print:shadow-none print:p-4 print:max-w-none text-right font-sans"
            dir="rtl"
          >
            {/* Government Official Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-start justify-between">
                {/* Right Header */}
                <div className="space-y-1 text-xs font-bold leading-relaxed text-slate-900">
                  <p className="text-sm font-black">جمهورية مصر العربية</p>
                  <p>وزارة المالية - مصلحة الضرائب المصرية</p>
                  <p>قطاع شؤون المناطق والمنافذ الضريبية</p>
                  <p>الإدارة المركزية لنماذج الخصم والتحصيل</p>
                </div>

                {/* Center Title */}
                <div className="text-center px-4">
                  <div className="inline-block border-2 border-slate-900 px-6 py-2 rounded-lg bg-slate-50 mb-1.5">
                    <h1 className="text-base sm:text-lg font-black tracking-wide text-slate-900">
                      نموذج رقم (41) ضرائب
                    </h1>
                    <p className="text-[11px] font-bold text-slate-700">
                      إشعار بخصم وتوريد مبالغ تحت حساب الضريبة
                    </p>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-600">
                    وفقاً لأحكام المادة (59) من القانون رقم 91 لسنة 2005 وتعديلاته ولائحته التنفيذية
                  </p>
                </div>

                {/* Left Ministry Details */}
                <div className="text-left text-xs font-mono-num font-bold text-slate-800 space-y-1">
                  <div className="border border-slate-400 p-1.5 rounded bg-slate-50 text-[10px]">
                    <p>رقم إشعار البنك: <span className="font-bold text-slate-950">BM-TAX-2026-904</span></p>
                    <p>تاريخ السداد: <span className="font-bold text-slate-950">{new Date().toLocaleDateString('ar-EG')}</span></p>
                    <p>البنك المورد له: <span className="font-bold text-slate-950">بنك مصر (1990199000000018)</span></p>
                  </div>
                </div>
              </div>

              {/* Organization Identification Box */}
              <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/80 p-3 rounded-lg border border-slate-300 text-xs">
                <div>
                  <span className="text-slate-600 block text-[10px]">الجهة الملتزمة بالخصم والتوريد:</span>
                  <span className="font-bold text-slate-900">{settings.organizationName}</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">الجهة التابع لها:</span>
                  <span className="font-bold text-slate-900">{settings.parentOrganization}</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">رقم التسجيل الضريبي:</span>
                  <span className="font-bold text-slate-950 font-mono text-sm tracking-wider">
                    {settings.taxRegistrationNumber || '706054423'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">الرقم التأميني للمنشأة:</span>
                  <span className="font-bold text-slate-950 font-mono text-sm tracking-wider">
                    {settings.insuranceNumber || '1854663'}
                  </span>
                </div>

                <div className="pt-1">
                  <span className="text-slate-600 block text-[10px]">رقم الملف الضريبي:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {settings.taxFileNumber || '142/98/215'}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-600 block text-[10px]">مأمورية الضرائب المختصة:</span>
                  <span className="font-semibold text-slate-900">
                    {settings.taxAuthorityBranch || 'مأمورية ضرائب الشركات والمهن / قصر النيل'}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-600 block text-[10px]">الفترة الضريبية المقدم عنها:</span>
                  <span className="font-bold text-emerald-800">
                    {quarterTitle} (2025/2026)
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-600 block text-[10px]">السنة المالية:</span>
                  <span className="font-semibold text-slate-900">
                    {settings.fiscalYearRule || 'من 1 يوليه 2025 وحتى 30 يونيه 2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Transactions Table */}
            <div className="my-4">
              <h4 className="text-xs font-black text-slate-900 mb-2">
                بيان التعاملات الخاضعة للخصم تحت حساب الضريبة المسددة خلال الفترة:
              </h4>

              <table className="w-full text-right border-collapse border border-slate-800 text-[10px]">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-800">
                    <th className="border border-slate-600 p-1.5 text-center w-7">م</th>
                    <th className="border border-slate-600 p-1.5">كود المورد</th>
                    <th className="border border-slate-600 p-1.5 min-w-[140px]">اسم الممول / الشركة (المورد)</th>
                    <th className="border border-slate-600 p-1.5">رقم التسجيل الضريبي</th>
                    <th className="border border-slate-600 p-1.5">الترخيص / السجل التجاري</th>
                    <th className="border border-slate-600 p-1.5">رقم وتاريخ الفاتورة</th>
                    <th className="border border-slate-600 p-1.5">طبيعة المعاملة</th>
                    <th className="border border-slate-600 p-1.5 text-center">المبلغ الإجمالي</th>
                    <th className="border border-slate-600 p-1.5 text-center w-12">نسبة الخصم</th>
                    <th className="border border-slate-600 p-1.5 text-center font-bold">الضريبة المقتطعة</th>
                    <th className="border border-slate-600 p-1.5 text-center">صافي المنصرف</th>
                    <th className="border border-slate-600 p-1.5">وسيلة السداد</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr key={r.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-400 p-1.5 text-center font-mono-num font-bold">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-mono text-[9px] font-bold text-slate-900">
                        {r.supplierCode}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-bold text-slate-950">
                        {r.supplierName}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-mono text-center font-bold text-slate-900">
                        {r.taxRegistrationNumber}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-[9px] text-slate-700">
                        {r.licenseNumber || r.commercialRegister || '—'}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-mono text-[9px]">
                        <div>{r.docNumber}</div>
                        <div className="text-slate-500">{r.docDate}</div>
                      </td>
                      <td className="border border-slate-400 p-1.5 text-slate-800">
                        {r.dealTypeAr}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-mono-num text-center font-semibold">
                        {r.grossAmount.toLocaleString()}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-mono-num text-center font-bold">
                        {r.taxRate}%
                      </td>
                      <td className="border border-slate-400 p-1.5 font-mono-num text-center font-bold text-slate-950 bg-slate-100">
                        {r.taxWithheld.toLocaleString()}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-mono-num text-center font-semibold">
                        {r.netPaid.toLocaleString()}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-[9px]">
                        {r.paymentMethod === 'check'
                          ? `شيك بنك مصر: ${r.checkOrTransferNo || 'معتمد'}`
                          : `تحويل بنكي: ${r.checkOrTransferNo || '1990199000000018'}`}
                      </td>
                    </tr>
                  ))}

                  {/* Grand Totals Summary Row */}
                  <tr className="bg-slate-200 text-slate-950 font-black border-t-2 border-slate-900">
                    <td colSpan={7} className="border border-slate-600 p-2 text-left pl-4">
                      الإجمالي العام لتعاملات الفترة والضريبة المستقطعة الموردة:
                    </td>
                    <td className="border border-slate-600 p-2 text-center font-mono-num text-xs font-black">
                      {totalGross.toLocaleString()} ج.م
                    </td>
                    <td className="border border-slate-600 p-2 text-center font-mono-num text-xs">
                      —
                    </td>
                    <td className="border border-slate-600 p-2 text-center font-mono-num text-xs font-black bg-slate-300">
                      {totalTax.toLocaleString()} ج.م
                    </td>
                    <td className="border border-slate-600 p-2 text-center font-mono-num text-xs font-black">
                      {totalNet.toLocaleString()} ج.م
                    </td>
                    <td className="border border-slate-600 p-2 text-center text-[9px]">
                      موردة بالكامل
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Remittance & Bank Settlement Box */}
            <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 border border-slate-400 rounded-lg text-xs leading-relaxed">
              <div>
                <h5 className="font-bold text-slate-900 mb-1">بيانات السداد والتوريد للبنك:</h5>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                  <li>المبلغ الإجمالي المورد لمصلحة الضرائب: <strong>{totalTax.toLocaleString()} ج.م</strong></li>
                  <li>البنك المسحوب عليه: <strong>بنك مصر - حساب جاري رقم (1990199000000018)</strong></li>
                  <li>تاريخ وتوقيت التوريد: <strong>{new Date().toLocaleDateString('ar-EG')}</strong></li>
                  <li>حالة المطابقة مع ميزان المراجعة: <strong>مطابق 100% لحساب أمانات الضرائب (2161 / 2121)</strong></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-slate-900 mb-1">إقرار صحة البيانات:</h5>
                <p className="text-[10px] text-slate-600 leading-normal text-justify">
                  نقر نحن الموقعين أدناه بصفتنا المسؤولين الماليين عن جمعية تيسير الحج والعمرة للعاملين بالجهاز المركزي للمحاسبات، بصحة وسلامة كافة البيانات والمبالغ المدونة بهذا النموذج، وأن المبالغ الموضحة تم استقطاعها بالفعل وتوريدها لحساب مصلحة الضرائب المصرية في المواعيد القانونية المقررة دون أي تأخير.
                </p>
              </div>
            </div>

            {/* Official Signatures Box - Matching System Users */}
            <div className="mt-8 pt-4 border-t-2 border-slate-800">
              <div className="grid grid-cols-4 gap-4 text-center text-xs">
                {/* Preparer */}
                <div className="space-y-4">
                  <p className="font-bold text-slate-700">إعداد المحاسب المختص</p>
                  <p className="font-black text-slate-950">Mostafa Abd elal</p>
                  <p className="text-[10px] text-slate-500">Accountant</p>
                  <div className="text-[10px] text-slate-400 pt-2">التوقيع: .....................</div>
                </div>

                {/* Senior Auditor */}
                <div className="space-y-4">
                  <p className="font-bold text-slate-700">مراجعة أولى</p>
                  <p className="font-black text-slate-950">Dina Hany</p>
                  <p className="text-[10px] text-slate-500">Senior Accountant</p>
                  <div className="text-[10px] text-slate-400 pt-2">التوقيع: .....................</div>
                </div>

                {/* Senior Financial Control */}
                <div className="space-y-4">
                  <p className="font-bold text-slate-700">مراجعة ورقابة مالية</p>
                  <p className="font-black text-slate-950">Ayman Abd elsalam</p>
                  <p className="text-[10px] text-slate-500">Senior Accountant</p>
                  <div className="text-[10px] text-slate-400 pt-2">التوقيع: .....................</div>
                </div>

                {/* Financial Manager (CFO) */}
                <div className="space-y-4 border-r border-slate-300 pr-2">
                  <p className="font-bold text-slate-900">اعتماد المدير المالي</p>
                  <p className="font-black text-emerald-950 text-sm">Mostafa Yonis</p>
                  <p className="text-[10px] text-slate-600 font-bold">Financial Manager (CFO)</p>
                  <div className="text-[10px] text-slate-400 pt-2">التوقيع: .....................</div>
                </div>
              </div>

              {/* Official Stamp Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-6 mt-4 border-t border-slate-200">
                <span>جمعية تيسير الحج والعمرة - الجهاز المركزي للمحاسبات</span>
                <span className="font-bold text-slate-700">خاتم شعار الجمعية والجهاز المركزي للمحاسبات (معتمد)</span>
                <span>تاريخ الطباعة: {new Date().toLocaleString('ar-EG')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
