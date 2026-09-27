import * as XLSX from 'xlsx';
import { BankAccount, JournalEntry, SystemSettings } from '../types/accounting';
import {
  BankStatementDraftRow,
  BANK_TRANSACTION_CATEGORIES,
  BankTransactionCategory,
  BankReconciliationMonthSummary,
} from '../types/bankReconciliation';

export interface MonthInfo {
  key: string; // e.g. '2026-01'
  labelAr: string; // e.g. 'يناير 2026'
  quarterAr: string; // e.g. 'الربع الأول'
}

export const FISCAL_MONTHS_2026: MonthInfo[] = [
  { key: '2026-01', labelAr: 'يناير 2026', quarterAr: 'الربع الأول' },
  { key: '2026-02', labelAr: 'فبراير 2026', quarterAr: 'الربع الأول' },
  { key: '2026-03', labelAr: 'مارس 2026', quarterAr: 'الربع الأول' },
  { key: '2026-04', labelAr: 'أبريل 2026', quarterAr: 'الربع الثاني' },
  { key: '2026-05', labelAr: 'مايو 2026', quarterAr: 'الربع الثاني' },
  { key: '2026-06', labelAr: 'يونيو 2026', quarterAr: 'الربع الثاني' },
  { key: '2026-07', labelAr: 'يوليو 2026', quarterAr: 'الربع الثالث' },
  { key: '2026-08', labelAr: 'أغسطس 2026', quarterAr: 'الربع الثالث' },
  { key: '2026-09', labelAr: 'سبتمبر 2026', quarterAr: 'الربع الثالث' },
  { key: '2026-10', labelAr: 'أكتوبر 2026', quarterAr: 'الربع الرابع' },
  { key: '2026-11', labelAr: 'نوفمبر 2026', quarterAr: 'الربع الرابع' },
  { key: '2026-12', labelAr: 'ديسمبر 2026', quarterAr: 'الربع الرابع - إقفال مالي' },
];

/**
 * Generates official Master Draft Template rows for a given fiscal month.
 * This represents the standardized monthly bank movement draft used for reconciliation.
 */
export function generateMasterDraftTemplateForMonth(
  month: string,
  bankAccounts: BankAccount[]
): BankStatementDraftRow[] {
  const bnk1Id = bankAccounts[0]?.id || 'bnk-1';
  const bnk2Id = bankAccounts[1]?.id || 'bnk-2';
  const monthParts = month.split('-');
  const y = monthParts[0] || '2026';
  const m = monthParts[1] || '03';

  return [
    {
      id: `drf-${month}-1`,
      month,
      date: `${y}-${m}-02`,
      documentNo: `REC-DEP-${y}${m}-01`,
      checkNumber: '',
      category: 'اشتراكات اعضاء',
      description: `تحصيل اشتراكات أعضاء الجهاز المركزي الدورية عن شهر ${m}`,
      depositAmount: 145000,
      withdrawalAmount: 0,
      bankAccountId: bnk1Id,
      notes: 'تحويل مجمع من إدارة مرتبات الجهاز المركزي للمحاسبات',
      isReconciled: true,
    },
    {
      id: `drf-${month}-2`,
      month,
      date: `${y}-${m}-05`,
      documentNo: `DEP-BM-${m}09`,
      checkNumber: `CHQ-88${m}91`,
      category: 'مقدمات عمرة',
      description: 'إيداع شيك دفعة حجز رحلات العمرة ومقدمات المشتركين',
      depositAmount: 85000,
      withdrawalAmount: 0,
      bankAccountId: bnk1Id,
      notes: 'تمت مقاصته وإضافته بكشف الحساب',
      isReconciled: true,
    },
    {
      id: `drf-${month}-3`,
      month,
      date: `${y}-${m}-08`,
      documentNo: `DEB-PAY-${m}14`,
      checkNumber: `OUT-99${m}01`,
      category: 'مقدمات عمرة',
      description: 'صرف شيك فنادق مكة المكرمة وسويس أوتيل وأبراج البيت',
      depositAmount: 0,
      withdrawalAmount: 350000,
      bankAccountId: bnk1Id,
      notes: 'خصم من كشف الحساب بموجب الشيك',
      isReconciled: true,
    },
    {
      id: `drf-${month}-4`,
      month,
      date: `${y}-${m}-10`,
      documentNo: `BNK-FEE-${m}`,
      checkNumber: '',
      category: 'مصاريف بنكية',
      description: 'عمولات مصرفية ومصاريف دفاتر شيكات ومصادقات كشف الحساب الدوري',
      depositAmount: 0,
      withdrawalAmount: 1250,
      bankAccountId: bnk1Id,
      notes: 'مقيدة بكشف البنك وجار إثباتها بدفتر اليومية',
      isReconciled: false,
    },
    {
      id: `drf-${month}-5`,
      month,
      date: `${y}-${m}-12`,
      documentNo: `REC-${y}-${m}15`,
      checkNumber: '',
      category: 'مقدمات عمرة',
      description: 'تحصيل مقدمات رحلات عمرة العاملين بالجهاز المستوى الاقتصادي والمميز',
      depositAmount: 480000,
      withdrawalAmount: 0,
      bankAccountId: bnk2Id,
      notes: 'إيداع مباشر بحساب بنك مصر - أذون خزانة وعمليات',
      isReconciled: true,
    },
    {
      id: `drf-${month}-6`,
      month,
      date: `${y}-${m}-15`,
      documentNo: `DEP-BM-TB-${m}2`,
      checkNumber: `CHQ-55${m}01`,
      category: 'مقدمات حج',
      description: 'شيك مقدم رحلة الحج استثمار أذون خزانة للمقاصة',
      depositAmount: 120000,
      withdrawalAmount: 0,
      bankAccountId: bnk2Id,
      notes: 'إيداع بالطريق لم يظهر بكشف البنك حتى تاريخه (معلق)',
      isReconciled: false,
    },
    {
      id: `drf-${month}-7`,
      month,
      date: `${y}-${m}-16`,
      documentNo: `YLD-TB-${m}`,
      checkNumber: '',
      category: 'عوائد بنكية',
      description: 'عوائد وأرباح استحقاق أذون خزانة بنك مصر والودائع لأجل',
      depositAmount: 325000,
      withdrawalAmount: 0,
      bankAccountId: bnk2Id,
      notes: 'مقيدة بإشعار إضافة معتمد من البنك',
      isReconciled: true,
    },
    {
      id: `drf-${month}-8`,
      month,
      date: `${y}-${m}-18`,
      documentNo: `PAY-SAL-${m}`,
      checkNumber: `OUT-99${m}05`,
      category: 'مرتبات شهرية',
      description: 'صرف رواتب الجهاز الإداري والتنفيذي لجمعية الحج والعمرة',
      depositAmount: 0,
      withdrawalAmount: 65000,
      bankAccountId: bnk1Id,
      notes: 'تحويل رواتب لحسابات العاملين بالبنك',
      isReconciled: true,
    },
    {
      id: `drf-${month}-9`,
      month,
      date: `${y}-${m}-19`,
      documentNo: `PAY-INC-${m}`,
      checkNumber: `OUT-99${m}06`,
      category: 'حوافز شهرية',
      description: 'صرف حوافز موسم العمرة ولجان التنظيم والمراجعة والمتابعة',
      depositAmount: 0,
      withdrawalAmount: 28000,
      bankAccountId: bnk1Id,
      notes: 'معتمدة بموجب محضر مجلس الإدارة',
      isReconciled: true,
    },
    {
      id: `drf-${month}-10`,
      month,
      date: `${y}-${m}-20`,
      documentNo: `PAY-REW-${m}`,
      checkNumber: `OUT-99${m}07`,
      category: 'مكافأة شهرية',
      description: 'مكافآت الإشراف الإداري والميداني لرحلات العمرة والمواسم',
      depositAmount: 0,
      withdrawalAmount: 18500,
      bankAccountId: bnk1Id,
      notes: `شيك مصرفي رقم OUT-99${m}07`,
      isReconciled: true,
    },
    {
      id: `drf-${month}-11`,
      month,
      date: `${y}-${m}-21`,
      documentNo: `AID-CAO-${m}`,
      checkNumber: `CHQ-CAO-99${m}`,
      category: 'اعانة الجهاز',
      description: 'شيك إعانة الدعم السنوي من الجهاز المركزي للمحاسبات لدعم رحلات الحج',
      depositAmount: 250000,
      withdrawalAmount: 0,
      bankAccountId: bnk1Id,
      notes: 'إيداع رسمي بموجب موافقة معالي رئيس الجهاز',
      isReconciled: true,
    },
    {
      id: `drf-${month}-12`,
      month,
      date: `${y}-${m}-22`,
      documentNo: `TND-BK-${m}`,
      checkNumber: '',
      category: 'ايرادات كراسات شروط',
      description: 'متحصلات بيع كراسات شروط مزايدة حجز فنادق مكة والمدينة لموسم الحج',
      depositAmount: 35000,
      withdrawalAmount: 0,
      bankAccountId: bnk1Id,
      notes: 'تحصيل مباشر بإشعارات توريد بنكية',
      isReconciled: true,
    },
    {
      id: `drf-${month}-13`,
      month,
      date: `${y}-${m}-23`,
      documentNo: `INS-TND-${m}`,
      checkNumber: `LG-BM-77${m}`,
      category: 'تأمينات مناقصات',
      description: 'تأمين ابتدائي لدخول مناقصة خدمات النقل والتغذية لموسم الحج',
      depositAmount: 75000,
      withdrawalAmount: 0,
      bankAccountId: bnk1Id,
      notes: 'تأمين مؤقت مسترد بموجب خطاب ضمان',
      isReconciled: true,
    },
    {
      id: `drf-${month}-14`,
      month,
      date: `${y}-${m}-24`,
      documentNo: `PUB-REL-${m}`,
      checkNumber: '',
      category: 'ايراد مبيعات كتب دينية',
      description: 'حصيلة مبيعات كتب ومطويات فقه مناسك الحج والعمرة والكتيبات الإرشادية',
      depositAmount: 14200,
      withdrawalAmount: 0,
      bankAccountId: bnk1Id,
      notes: 'توريد دوري لحساب البنك',
      isReconciled: true,
    },
    {
      id: `drf-${month}-15`,
      month,
      date: `${y}-${m}-24`,
      documentNo: `ADV-SETT-${m}`,
      checkNumber: `REC-S-4${m}`,
      category: 'تسوية سلف',
      description: 'توريد باقي سلفة نفقات معاينة مساكن الحجاج بمكة المكرمة',
      depositAmount: 22000,
      withdrawalAmount: 0,
      bankAccountId: bnk1Id,
      notes: 'إيداع بنكي صادر بعد اعتماد فاتورة التسوية',
      isReconciled: true,
    },
    {
      id: `drf-${month}-16`,
      month,
      date: `${y}-${m}-26`,
      documentNo: `CHQ-OUT-PEND-${m}`,
      checkNumber: `OUT-8812${m}`,
      category: 'شيكات منصرفة',
      description: 'شيك مسحوب لشركة مصر للسياحة عن تذاكر طيران معلق لم يصرف بعد',
      depositAmount: 0,
      withdrawalAmount: 95000,
      bankAccountId: bnk1Id,
      notes: 'شيك مسحوب لم يقدم للبنك حتى تاريخ إقفال الكشف',
      isReconciled: false,
    },
  ];
}

/**
 * Returns the default initial draft rows for the application (March 2026).
 */
export function getInitialBankDraftRows(bankAccounts: BankAccount[]): BankStatementDraftRow[] {
  return generateMasterDraftTemplateForMonth('2026-03', bankAccounts);
}

/**
 * Parses user-uploaded Excel file (.xlsx, .xls) or CSV file into BankStatementDraftRow array.
 * Intelligently recognizes Arabic and English column headers.
 */
export async function parseBankDraftExcelFile(
  file: File,
  bankAccounts: BankAccount[],
  targetMonth: string
): Promise<{ rows: BankStatementDraftRow[]; rowCount: number; sheetName: string }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Locate the appropriate sheet (matching draft, تسوية, or first sheet)
  const targetSheetName =
    workbook.SheetNames.find(
      (s) =>
        s.includes('درافت') ||
        s.includes('تسوية') ||
        s.includes('بنك') ||
        s.includes('Draft') ||
        s.includes('Reconcil')
    ) || workbook.SheetNames[0];

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    throw new Error('لم يتم العثور على أوراق عمل صالحة في ملف الإكسيل المرفق.');
  }

  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!rawData || rawData.length === 0) {
    throw new Error('ورقة العمل المحددة فارغة ولا تحتوي على بيانات.');
  }

  // Detect header row index and column mappings
  let headerIndex = -1;
  let dateIdx = -1;
  let docIdx = -1;
  let chqIdx = -1;
  let catIdx = -1;
  let descIdx = -1;
  let depIdx = -1;
  let withIdx = -1;
  let bankIdx = -1;
  let recIdx = -1;
  let notesIdx = -1;

  for (let i = 0; i < Math.min(12, rawData.length); i++) {
    const row = rawData[i];
    if (!Array.isArray(row)) continue;
    const strRow = row.map((cell) => String(cell || '').trim().toLowerCase());

    const hasDate = strRow.some((c) => c.includes('تاريخ') || c.includes('date'));
    const hasDocOrDesc = strRow.some(
      (c) => c.includes('مستند') || c.includes('إشعار') || c.includes('بيان') || c.includes('desc')
    );
    const hasMoney = strRow.some(
      (c) =>
        c.includes('وارد') ||
        c.includes('متحصل') ||
        c.includes('إيداع') ||
        c.includes('منصرف') ||
        c.includes('مسحوب') ||
        c.includes('deposit') ||
        c.includes('withdrawal')
    );

    if (hasDate && (hasDocOrDesc || hasMoney)) {
      headerIndex = i;
      row.forEach((cell, colIdx) => {
        const c = String(cell || '').trim().toLowerCase();
        if (c.includes('تاريخ') || c.includes('date')) dateIdx = colIdx;
        else if (c.includes('مستند') || c.includes('إشعار') || c.includes('doc')) docIdx = colIdx;
        else if (c.includes('شيك') || c.includes('check') || c.includes('chq')) chqIdx = colIdx;
        else if (c.includes('بند') || c.includes('category') || c.includes('تصنيف')) catIdx = colIdx;
        else if (c.includes('بيان') || c.includes('شرح') || c.includes('وصف') || c.includes('desc'))
          descIdx = colIdx;
        else if (
          c.includes('متحصل') ||
          c.includes('وارد') ||
          c.includes('إيداع') ||
          c.includes('مدين') ||
          c.includes('deposit') ||
          c.includes('credit')
        )
          depIdx = colIdx;
        else if (
          c.includes('منصرف') ||
          c.includes('مسحوب') ||
          c.includes('صرف') ||
          c.includes('دائن') ||
          c.includes('withdrawal') ||
          c.includes('debit')
        )
          withIdx = colIdx;
        else if (c.includes('بنك') || c.includes('حساب') || c.includes('bank')) bankIdx = colIdx;
        else if (c.includes('تسوية') || c.includes('مطابقة') || c.includes('reconcil'))
          recIdx = colIdx;
        else if (c.includes('ملاحظ') || c.includes('note')) notesIdx = colIdx;
      });
      break;
    }
  }

  // Fallback to standard columns if header is not found
  if (headerIndex === -1) {
    headerIndex = 0;
    dateIdx = 2;
    docIdx = 3;
    chqIdx = 4;
    catIdx = 5;
    descIdx = 6;
    depIdx = 7;
    withIdx = 8;
    bankIdx = 9;
    recIdx = 10;
    notesIdx = 11;
  }

  const parsedRows: BankStatementDraftRow[] = [];
  const defaultBankId = bankAccounts[0]?.id || 'bnk-1';

  for (let r = headerIndex + 1; r < rawData.length; r++) {
    const row = rawData[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rawDate = dateIdx >= 0 ? row[dateIdx] : null;
    const rawDoc = docIdx >= 0 ? String(row[docIdx] || '').trim() : '';
    const rawChq = chqIdx >= 0 ? String(row[chqIdx] || '').trim() : '';
    const rawCat = catIdx >= 0 ? String(row[catIdx] || '').trim() : '';
    const rawDesc = descIdx >= 0 ? String(row[descIdx] || '').trim() : '';
    const rawDep = depIdx >= 0 ? Number(row[depIdx]) || 0 : 0;
    const rawWith = withIdx >= 0 ? Number(row[withIdx]) || 0 : 0;
    const rawBank = bankIdx >= 0 ? String(row[bankIdx] || '').trim() : '';
    const rawRec = recIdx >= 0 ? String(row[recIdx] || '').trim() : '';
    const rawNotes = notesIdx >= 0 ? String(row[notesIdx] || '').trim() : '';

    // Ignore completely empty rows or total summary lines
    if (!rawDesc && !rawDoc && rawDep === 0 && rawWith === 0) continue;
    if (rawDesc.includes('الإجمالي') || rawDoc.includes('الإجمالي') || rawCat.includes('الإجمالي'))
      continue;

    // Normalize date
    let formattedDate = `${targetMonth}-15`;
    if (rawDate) {
      if (typeof rawDate === 'number') {
        // Excel serial date number
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const dateObj = new Date(excelEpoch.getTime() + rawDate * 86400000);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      } else {
        const dStr = String(rawDate).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
          formattedDate = dStr;
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dStr)) {
          const [d, m, y] = dStr.split('/');
          formattedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }
    }

    // Match Bank Account
    let matchedBankId = defaultBankId;
    if (rawBank) {
      const foundBank = bankAccounts.find(
        (b) =>
          b.bankName.includes(rawBank) ||
          rawBank.includes(b.bankName) ||
          b.accountNumber.includes(rawBank)
      );
      if (foundBank) matchedBankId = foundBank.id;
    }

    // Match Category
    let matchedCategory: BankTransactionCategory = 'أخرى / تسوية عامة';
    const foundCat = BANK_TRANSACTION_CATEGORIES.find(
      (cat) => rawCat.includes(cat) || cat.includes(rawCat)
    );
    if (foundCat) {
      matchedCategory = foundCat;
    } else if (rawDesc.includes('حج')) matchedCategory = 'مقدمات حج';
    else if (rawDesc.includes('عمرة')) matchedCategory = 'مقدمات عمرة';
    else if (rawDesc.includes('راتب') || rawDesc.includes('مرتب')) matchedCategory = 'مرتبات شهرية';
    else if (rawDesc.includes('حافز') || rawDesc.includes('حوافز')) matchedCategory = 'حوافز شهرية';
    else if (rawDesc.includes('مكافأ')) matchedCategory = 'مكافأة شهرية';
    else if (rawDesc.includes('اشتراك')) matchedCategory = 'اشتراكات اعضاء';
    else if (rawDesc.includes('مصاريف') || rawDesc.includes('عمول')) matchedCategory = 'مصاريف بنكية';
    else if (rawDesc.includes('عائد') || rawDesc.includes('أذون')) matchedCategory = 'عوائد بنكية';

    const isReconciled =
      rawRec.includes('مطابق') ||
      rawRec.includes('مسوى') ||
      rawRec.includes('نعم') ||
      rawRec.includes('yes') ||
      rawRec.includes('true') ||
      rawRec === '1';

    parsedRows.push({
      id: `imported-${Date.now()}-${r}`,
      month: targetMonth,
      date: formattedDate,
      documentNo: rawDoc || `DOC-${targetMonth}-${String(parsedRows.length + 1).padStart(3, '0')}`,
      checkNumber: rawChq,
      category: matchedCategory,
      description: rawDesc || 'حركة بنكية مستوردة من الشيت المرفق',
      depositAmount: rawDep,
      withdrawalAmount: rawWith,
      bankAccountId: matchedBankId,
      notes: rawNotes,
      isReconciled,
    });
  }

  return {
    rows: parsedRows,
    rowCount: parsedRows.length,
    sheetName: targetSheetName,
  };
}

/**
 * Exports the official Master Bank Reconciliation Draft Sheet template (.xlsx)
 * with approved accounting structure, guidelines, formulas, and formatting.
 */
export function exportBankReconciliationDraftTemplate(
  bankAccounts: BankAccount[],
  existingDraftRows: BankStatementDraftRow[],
  targetBankId?: string,
  targetMonth: string = '2026-03'
) {
  const wb = XLSX.utils.book_new();

  const selectedBank = bankAccounts.find((b) => b.id === targetBankId) || bankAccounts[0];

  // 1. Instructions Sheet (إرشادات الاستخدام المعتمدة)
  const instructionsData = [
    ['جمعية تيسير الحج والعمرة للعاملين بالجهاز المركزي للمحاسبات'],
    ['الشيت الرئيسي لدرافت حركة المتحصل والمنصرف بالبنك والتسوية الشهرية'],
    [''],
    [
      'الحساب المصرفي المستهدف:',
      selectedBank
        ? `${selectedBank.bankName} - (${selectedBank.accountNumber})`
        : 'كافة الحسابات البنكية المعتمدة',
    ],
    ['الشهر المالي المستهدف:', targetMonth],
    ['تاريخ التصدير:', new Date().toISOString().split('T')[0]],
    [''],
    ['قواعد وضوابط تعبئة الشيت الرئيسي:'],
    ['1. يتم تعبئة تاريخ الحركة بصيغة (YYYY-MM-DD) ورقم المستند الدفتري أو إشعار الإضافة/الخصم البنكي.'],
    ['2. كتابة رقم الشيك البنكي إن كانت العملية تمت بموجب شيك مسحوب أو تحت التحصيل.'],
    ['3. اختيار أحد البنود المعتمدة في النظام المحاسبي للجمعية:'],
    ...BANK_TRANSACTION_CATEGORIES.map((cat, idx) => [`   ${idx + 1}. ${cat}`]),
    [''],
    [
      '4. كتابة المبلغ في عمود "المتحصل / الوارد" إذا كان إيداعاً/تحصيلاً، أو في عمود "المنصرف / المسحوب" إذا كان صرفاً/خصماً.',
    ],
    ['5. عمود "حالة التسوية بالكشف": كتابة (مطابق ومقيد بالكشف) أو (معلق بالطريق للتسوية).'],
    ['6. يمكن إعادة استيراد هذا الشيت مباشرة إلى النظام في أي وقت عبر زر "استيراد ملف إكسيل الشيت".'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'تعليمات وضوابط الشيت');

  // 2. Draft Data Sheet (شيت درافت التسوية البنكية)
  const filterRows = existingDraftRows.filter(
    (r) =>
      (!targetBankId || r.bankAccountId === targetBankId) &&
      (!targetMonth || r.month === targetMonth)
  );

  const draftHeaders = [
    'م',
    'الشهر المالي',
    'تاريخ العملية',
    'رقم المستند / الإشعار',
    'رقم الشيك',
    'بند الحركة المحدد',
    'البيان والشرح التفصيلي',
    'المتحصل / الوارد بالبنك (ج.م)',
    'المنصرف / المسحوب بالبنك (ج.م)',
    'اسم الحساب البنكي',
    'حالة التسوية بالكشف',
    'ملاحظات المراجعة والرقابة',
  ];

  const rowsData = filterRows.map((r, index) => {
    const bank = bankAccounts.find((b) => b.id === r.bankAccountId);
    return [
      index + 1,
      r.month,
      r.date,
      r.documentNo,
      r.checkNumber || '',
      r.category,
      r.description,
      r.depositAmount,
      r.withdrawalAmount,
      bank ? bank.bankName : '',
      r.isReconciled ? 'مطابق ومقيد بالكشف' : 'معلق / بالطريق للتسوية',
      r.notes || '',
    ];
  });

  // Append empty rows for data entry
  for (let i = 1; i <= 10; i++) {
    rowsData.push([
      filterRows.length + i,
      targetMonth,
      `${targetMonth}-${String(20 + (i % 8)).padStart(2, '0')}`,
      `DOC-${targetMonth}-${String(200 + i).padStart(3, '0')}`,
      '',
      i === 1 ? 'مقدمات حج' : i === 2 ? 'مقدمات عمرة' : i === 3 ? 'مرتبات شهرية' : 'اشتراكات اعضاء',
      'سطر جديد لإدخال حركة بنكية إضافية...',
      0,
      0,
      selectedBank ? selectedBank.bankName : 'بنك مصر - جاري رئيسي',
      'معلق / لم يسو بعد',
      '',
    ]);
  }

  // Summary row
  const totalDep = filterRows.reduce((s, r) => s + r.depositAmount, 0);
  const totalWith = filterRows.reduce((s, r) => s + r.withdrawalAmount, 0);
  const totalRow = [
    'الإجمالي',
    '',
    '',
    '',
    '',
    '',
    'إجمالي الحركات الحالية',
    totalDep,
    totalWith,
    `الصافي: ${(totalDep - totalWith).toLocaleString()} ج.م`,
    '',
    '',
  ];

  const wsDraft = XLSX.utils.aoa_to_sheet([draftHeaders, ...rowsData, totalRow]);

  wsDraft['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 26 },
    { wch: 42 },
    { wch: 22 },
    { wch: 22 },
    { wch: 25 },
    { wch: 22 },
    { wch: 32 },
  ];

  XLSX.utils.book_append_sheet(wb, wsDraft, 'شيت درافت التسوية البنكية');

  const filename = `الشيت_الرئيسي_لدرافت_التسوية_البنكية_${selectedBank ? selectedBank.bankName.replace(/\s+/g, '_') : 'كافة_البنوك'}_${targetMonth}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exports official Bank Statement Sheet (شيت كشف حساب البنك) for accounting archive and reconciliation.
 */
export function exportOfficialBankSheet(
  bankAccount: BankAccount,
  entries: JournalEntry[],
  draftRows: BankStatementDraftRow[],
  targetMonth: string = '2026-03'
) {
  const wb = XLSX.utils.book_new();

  const relevantDrafts = draftRows.filter(
    (r) => r.bankAccountId === bankAccount.id && (!targetMonth || r.month === targetMonth)
  );

  const totalDeposits = relevantDrafts.reduce((sum, r) => sum + r.depositAmount, 0);
  const totalWithdrawals = relevantDrafts.reduce((sum, r) => sum + r.withdrawalAmount, 0);

  const headerInfo = [
    ['جمعية تيسير الحج والعمرة للعاملين بالجهاز المركزي للمحاسبات'],
    [`كشف حساب بنكي تحليلي رسمي - ${bankAccount.bankName}`],
    [''],
    ['اسم البنك:', bankAccount.bankName, 'الفرع:', bankAccount.branch],
    [
      'رقم الحساب المصرفي:',
      bankAccount.accountNumber,
      'كود الحساب الدفتري:',
      bankAccount.glAccountId,
    ],
    ['الشهر المالي:', targetMonth, 'العملة:', bankAccount.currency],
    [
      'الرصيد الدفتري الحالي (ج.م):',
      bankAccount.bookBalance,
      'رصيد كشف الحساب المعتمد (ج.م):',
      bankAccount.statementBalance,
    ],
    [
      'إجمالي المقبوضات/الإيداعات (ج.م):',
      totalDeposits,
      'إجمالي المدفوعات/المنصرف (ج.م):',
      totalWithdrawals,
    ],
    [''],
  ];

  const tableHeaders = [
    'م',
    'تاريخ القيد بالبنك',
    'رقم المستند / الإشعار',
    'رقم الشيك',
    'بند المعاملة',
    'البيان والشرح',
    'مدين / مقبوضات (ج.م)',
    'دائن / مدفوعات (ج.م)',
    'حالة التسوية والمطابقة',
    'ملاحظات المراجع الداخلي',
  ];

  const rows = relevantDrafts.map((r, i) => [
    i + 1,
    r.date,
    r.documentNo,
    r.checkNumber || '-',
    r.category,
    r.description,
    r.depositAmount,
    r.withdrawalAmount,
    r.isReconciled ? 'مطابق ومسوى' : 'معلق بالطريق',
    r.notes || '',
  ]);

  const summaryRow = [
    'الإجمالي العام',
    '',
    '',
    '',
    '',
    '',
    totalDeposits,
    totalWithdrawals,
    `فارق التسوية: ${(bankAccount.statementBalance - bankAccount.bookBalance).toLocaleString()} ج.م`,
    '',
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headerInfo, tableHeaders, ...rows, summaryRow]);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 25 },
    { wch: 40 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'كشف حساب البنك');

  const filename = `كشف_حساب_${bankAccount.bankName.replace(/\s+/g, '_')}_${targetMonth}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Calculates accurate bank reconciliation summary from the active draft rows for a specific bank and month.
 */
export function calculateReconciliationFromDraft(
  month: string,
  bankAccountId: string,
  bankAccount: BankAccount,
  draftRows: BankStatementDraftRow[]
): BankReconciliationMonthSummary {
  const bankRows = draftRows.filter(
    (r) => r.bankAccountId === bankAccountId && r.month === month
  );

  // Unreconciled deposits (شيكات وإيداعات بالطريق لم تظهر بكشف البنك)
  const depositsInTransit = bankRows
    .filter((r) => !r.isReconciled && r.depositAmount > 0)
    .reduce((sum, r) => sum + r.depositAmount, 0);

  // Unreconciled withdrawals (شيكات منصرفة لم تصرف بعد من البنك)
  const outstandingChecks = bankRows
    .filter((r) => !r.isReconciled && r.withdrawalAmount > 0 && r.category !== 'مصاريف بنكية')
    .reduce((sum, r) => sum + r.withdrawalAmount, 0);

  // Unrecorded bank fees / charges (مصاريف بنكية مقيدة بالكشف ولم تسجل بالدفاتر)
  const bankChargesUnrecorded = bankRows
    .filter((r) => !r.isReconciled && r.category === 'مصاريف بنكية')
    .reduce((sum, r) => sum + r.withdrawalAmount, 0);

  // Unrecorded bank interest (عوائد بنكية)
  const bankInterestUnrecorded = bankRows
    .filter((r) => !r.isReconciled && r.category === 'عوائد بنكية')
    .reduce((sum, r) => sum + r.depositAmount, 0);

  const bookBalance = bankAccount.bookBalance;
  const statementBalance = bankAccount.statementBalance;

  // Adjusted Balance = Statement Balance + Deposits in Transit - Outstanding Checks
  const adjustedBalance = statementBalance + depositsInTransit - outstandingChecks;
  const difference = adjustedBalance - (bookBalance - bankChargesUnrecorded + bankInterestUnrecorded);

  return {
    month,
    bankAccountId,
    bookBalance,
    statementBalance,
    depositsInTransit,
    outstandingChecks,
    bankChargesUnrecorded,
    bankInterestUnrecorded,
    adjustedBalance,
    difference,
    status: Math.abs(difference) < 1 ? 'balanced' : 'unbalanced',
  };
}
