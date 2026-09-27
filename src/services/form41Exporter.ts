import * as XLSX from 'xlsx';
import { TaxForm41Record, SystemSettings } from '../types/accounting';

export function exportForm41Excel(
  records: TaxForm41Record[],
  settings: SystemSettings,
  quarterTitle: string = 'الربع الأول 2026'
) {
  const wb = XLSX.utils.book_new();

  const totalGross = records.reduce((s, r) => s + r.grossAmount, 0);
  const totalTax = records.reduce((s, r) => s + r.taxWithheld, 0);
  const totalNet = records.reduce((s, r) => s + r.netPaid, 0);

  const headerRows = [
    ['جمهورية مصر العربية - وزارة المالية - مصلحة الضرائب المصرية'],
    ['الإدارة المركزية لتجميع نماذج الخصم والتحصيل تحت حساب الضريبة'],
    ['نموذج رقم (41) ضرائب - إشعار بخصم وتوريد مبالغ تحت حساب الضريبة (وفقاً للمادة 59 من القانون 91 لسنة 2005)'],
    [''],
    ['اسم الجهة الملتزمة بالخصم:', settings.organizationName],
    ['الجهة التابعة لها:', settings.parentOrganization],
    ['رقم التسجيل الضريبي:', settings.taxRegistrationNumber || '706054423'],
    ['الرقم التأميني:', settings.insuranceNumber || '1854663'],
    ['رقم الملف الضريبي:', settings.taxFileNumber || '142/98/215'],
    ['مأمورية الضرائب المختصة:', settings.taxAuthorityBranch || 'مأمورية ضرائب الشركات والمهن / قصر النيل'],
    ['الفترة الضريبية:', `${quarterTitle} - ${settings.fiscalYearRule || 'السنة المالية 2025/2026'}`],
    ['تاريخ التوليد والاستخراج:', new Date().toLocaleDateString('ar-EG')],
    ['حساب بنك مصر لتوريد الضريبة:', '1990199000000018 - فرع الجهاز المركزي للمحاسبات'],
    [''],
    [
      'م',
      'كود المورد الفريد',
      'اسم الممول / الشركة (المورد)',
      'رقم التسجيل الضريبي',
      'رقم الترخيص / السجل التجاري',
      'عنوان الممول',
      'رقم الفاتورة / إذن الصرف',
      'تاريخ التعامل',
      'طبيعة المعاملة',
      'القيمة الإجمالية قبل الخصم (ج.م)',
      'نسبة الخصم المقررة (%)',
      'قيمة الضريبة المحتجزة (ج.م)',
      'صافي المبلغ المنصرف (ج.م)',
      'طريقة الدفع ورقم الشيك/التحويل',
      'البنك المسحوب عليه',
      'حالة السداد للمصلحة',
    ],
  ];

  const dataRows = records.map((r, i) => [
    i + 1,
    r.supplierCode,
    r.supplierName,
    r.taxRegistrationNumber,
    `${r.licenseNumber || ''} / ${r.commercialRegister || ''}`,
    r.address || '',
    r.docNumber,
    r.docDate,
    r.dealTypeAr,
    r.grossAmount,
    `${r.taxRate}%`,
    r.taxWithheld,
    r.netPaid,
    `${r.paymentMethod === 'check' ? 'شيك رقم: ' : 'تحويل بنكي: '}${r.checkOrTransferNo || ''}`,
    r.bankName || 'بنك مصر (1990199000000018)',
    r.status === 'remitted_to_bank'
      ? `تم التوريد بالبنك - إشعار: ${r.remittanceNoticeNo || 'مكتمل'}`
      : 'محتجز للتوريد بالبنك',
  ]);

  const summaryRows = [
    [''],
    [
      'الإجمالي العام للتعاملات الخاضعة للخصم',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalGross,
      '',
      totalTax,
      totalNet,
      '',
      '',
      '',
    ],
    [''],
    ['إقرار صحة البيانات:'],
    ['نقر نحن الموقعين أدناه بصحة البيانات الواردة بهذا النموذج وأن الضريبة المستقطعة تم توريدها لحساب مصلحة الضرائب عبر البنك.'],
    ['إعداد المحاسب المختص:', 'Mostafa Abd elal', 'مراجع الحسابات:', 'Dina Hany / Ayman Abd elsalam', 'اعتماد المدير المالي (CFO):', 'Mostafa Yonis'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows, ...summaryRows]);
  XLSX.utils.book_append_sheet(wb, ws, 'نموذج 41 ضرائب معتمد');

  XLSX.writeFile(wb, `Form_41_Tax_Withholding_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportForm41EtaCsv(records: TaxForm41Record[], settings: SystemSettings) {
  const header = [
    'م',
    'كود_المورد',
    'اسم_الممول',
    'رقم_التسجيل_الضريبي_للمورد',
    'السجل_التجاري',
    'رقم_الفاتورة',
    'تاريخ_التعامل',
    'طبيعة_التعامل',
    'المبلغ_الإجمالي',
    'نسبة_الخصم',
    'قيمة_الضريبة',
    'الصافي_المنصرف',
    'رقم_التسجيل_الضريبي_للجمعية',
  ].join(',');

  const rows = records.map((r, i) =>
    [
      i + 1,
      `"${r.supplierCode}"`,
      `"${r.supplierName}"`,
      `"${r.taxRegistrationNumber}"`,
      `"${r.commercialRegister || ''}"`,
      `"${r.docNumber}"`,
      r.docDate,
      `"${r.dealTypeAr}"`,
      r.grossAmount,
      r.taxRate,
      r.taxWithheld,
      r.netPaid,
      `"${settings.taxRegistrationNumber || '706054423'}"`,
    ].join(',')
  );

  const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ETA_Form41_Declaration_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportForm41Json(records: TaxForm41Record[], settings: SystemSettings) {
  const data = {
    declarationType: 'FORM_41_TAX_WITHHOLDING',
    submissionDate: new Date().toISOString(),
    organization: {
      name: settings.organizationName,
      taxRegistrationNumber: settings.taxRegistrationNumber || '706054423',
      insuranceNumber: settings.insuranceNumber || '1854663',
      taxFileNumber: settings.taxFileNumber || '142/98/215',
      authorityBranch: settings.taxAuthorityBranch || 'مأمورية ضرائب الشركات والمهن / قصر النيل',
      bankAccount: '1990199000000018',
    },
    officials: {
      financialManager: 'Mostafa Yonis',
      seniorAccountants: ['Dina Hany', 'Ayman Abd elsalam'],
      accountant: 'Mostafa Abd elal',
    },
    totals: {
      dealCount: records.length,
      totalGrossAmount: records.reduce((s, r) => s + r.grossAmount, 0),
      totalTaxWithheld: records.reduce((s, r) => s + r.taxWithheld, 0),
      totalNetPaid: records.reduce((s, r) => s + r.netPaid, 0),
    },
    records: records,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ETA_Form41_Payload_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
