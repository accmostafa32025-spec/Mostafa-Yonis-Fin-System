import React, { useState, useMemo } from 'react';
import {
  Home,
  Settings,
  Users,
  HelpCircle,
  FolderTree,
  Crosshair,
  UserCheck,
  Truck,
  BookOpen,
  FilePlus2,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Landmark,
  Receipt,
  Inbox,
  Clock,
  PiggyBank,
  Percent,
  Layers,
  TableProperties,
  CalendarDays,
  Calculator,
  Scale,
  ArrowLeftRight,
  LineChart,
  PieChart,
  Compass,
  FileText,
  Activity,
  FileCode2,
  ShieldCheck,
  LayoutDashboard,
  History,
  Sparkles,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  ListFilter,
  CheckCircle2,
} from 'lucide-react';
import { SheetKey } from '../types/accounting';

export interface SheetDefinition {
  key: SheetKey;
  sheetNumber: number;
  titleAr: string;
  category: string;
  icon: React.ElementType;
  badge?: string;
  shortDesc?: string;
}

export const ALL_SHEETS: SheetDefinition[] = [
  // 1. الرئيسية والتهيئة
  { key: 'home', sheetNumber: 1, titleAr: 'الرئيسية', category: 'الرئيسية والتهيئة', icon: Home, shortDesc: 'لوحة الترحيب والمؤشرات' },
  { key: 'settings', sheetNumber: 2, titleAr: 'الإعدادات', category: 'الرئيسية والتهيئة', icon: Settings, shortDesc: 'ضبط النظام والسنة المالية' },
  { key: 'users', sheetNumber: 3, titleAr: 'المستخدمون والصلاحيات', category: 'الرئيسية والتهيئة', icon: Users, shortDesc: 'إدارة أدوار المحاسبين' },
  { key: 'user_guide', sheetNumber: 35, titleAr: 'تعليمات الاستخدام', category: 'الرئيسية والتهيئة', icon: HelpCircle, shortDesc: 'دليل تشغيل النظام' },

  // 2. الأدلة والمعالم
  { key: 'chart_of_accounts', sheetNumber: 4, titleAr: 'شجرة الحسابات', category: 'الأدلة والمعالم', icon: FolderTree, shortDesc: 'الدليل المحاسبي الموحد' },
  { key: 'cost_centers', sheetNumber: 5, titleAr: 'مراكز التكلفة', category: 'الأدلة والمعالم', icon: Crosshair, shortDesc: 'أنشطة العمرة والحج' },
  { key: 'members', sheetNumber: 6, titleAr: 'دليل الأعضاء', category: 'الأدلة والمعالم', icon: UserCheck, shortDesc: 'سجل أعضاء الجهاز' },
  { key: 'suppliers', sheetNumber: 7, titleAr: 'دليل الموردين والشركات', category: 'الأدلة والمعالم', icon: Truck, shortDesc: 'شركات السياحة والطيران' },

  // 3. القيود والعمليات
  { key: 'journal_entries', sheetNumber: 8, titleAr: 'القيود اليومية', category: 'القيود والعمليات', icon: BookOpen, shortDesc: 'اليومية العامة والترحيل' },
  { key: 'entry_voucher_form', sheetNumber: 9, titleAr: 'نموذج إدخال قيد', category: 'القيود والعمليات', icon: FilePlus2, badge: 'إدخال', shortDesc: 'إنشاء سند قيد جديد' },
  { key: 'receipts', sheetNumber: 10, titleAr: 'المقبوضات', category: 'القيود والعمليات', icon: ArrowDownLeft, shortDesc: 'سندات القبض النقدي والبنكي' },
  { key: 'payments', sheetNumber: 11, titleAr: 'المدفوعات', category: 'القيود والعمليات', icon: ArrowUpRight, shortDesc: 'سندات الصرف والتحويلات' },

  // 4. النقدية والشيكات
  { key: 'treasury_cash', sheetNumber: 12, titleAr: 'حركة الخزينة', category: 'النقدية والشيكات', icon: Coins, shortDesc: 'السيولة النقدية اليومية' },
  { key: 'banks', sheetNumber: 13, titleAr: 'حسابات البنوك', category: 'النقدية والشيكات', icon: Landmark, shortDesc: 'أرصدة البنوك المعتمدة' },
  { key: 'checks_issued', sheetNumber: 14, titleAr: 'الشيكات الصادرة', category: 'النقدية والشيكات', icon: Receipt, shortDesc: 'شيكات المدفوعات للموردين' },
  { key: 'checks_received', sheetNumber: 15, titleAr: 'الشيكات الواردة', category: 'النقدية والشيكات', icon: Inbox, shortDesc: 'شيكات اشتراكات الأعضاء' },
  { key: 'checks_collection', sheetNumber: 16, titleAr: 'تتبع الشيكات المعلقة', category: 'النقدية والشيكات', icon: Clock, shortDesc: 'الشيكات تحت التحصيل' },

  // 5. الأنشطة والمعاملات
  { key: 'members_savings', sheetNumber: 17, titleAr: 'مدخرات الأعضاء', category: 'الأنشطة والمعاملات', icon: PiggyBank, shortDesc: 'صندوق الادخار والاشتراكات' },
  { key: 'savings_upload', sheetNumber: 18, titleAr: 'شيت استقطاع المدخرات والمديونيات', category: 'الأنشطة والمعاملات', icon: TableProperties, badge: 'جديد', shortDesc: 'رفع استقطاعات الرواتب والتقسيط الآلي' },
  { key: 'withholding_tax', sheetNumber: 19, titleAr: 'ضريبة كسب العمل', category: 'الأنشطة والمعاملات', icon: Percent, shortDesc: 'الاستقطاعات الضريبية' },

  // 6. الأستاذ وموازين المراجعة
  { key: 'general_ledger', sheetNumber: 19, titleAr: 'دفتر الأستاذ العام', category: 'الأستاذ والموازين', icon: Layers, shortDesc: 'أستاذ الحسابات الرئيسية' },
  { key: 'subsidiary_ledger', sheetNumber: 20, titleAr: 'الأستاذ المساعد ومراكز التكلفة', category: 'الأستاذ والموازين', icon: TableProperties, shortDesc: 'تحليلي مراكز التكلفة' },
  { key: 'monthly_review', sheetNumber: 21, titleAr: 'المراجعة الشهرية للمجاميع', category: 'الأستاذ والموازين', icon: CalendarDays, shortDesc: 'حركة الشهور المالية' },
  { key: 'trial_balance_totals', sheetNumber: 22, titleAr: 'ميزان المراجعة بالمجاميع', category: 'الأستاذ والموازين', icon: Calculator, shortDesc: 'مطابقة مجاميع الحركات' },
  { key: 'trial_balance_balances', sheetNumber: 23, titleAr: 'ميزان المراجعة بالأرصدة', category: 'الأستاذ والموازين', icon: Scale, shortDesc: 'الأرصدة الختامية' },
  { key: 'bank_reconciliation', sheetNumber: 24, titleAr: 'التسويات البنكية', category: 'الأستاذ والموازين', icon: ArrowLeftRight, shortDesc: 'مطابقة كشوف البنوك' },

  // 7. الموازنات والمؤشرات
  { key: 'budget', sheetNumber: 25, titleAr: 'الموازنة التقديرية', category: 'الموازنات والتحليلات', icon: LineChart, shortDesc: 'الاعتمادات التقديرية السنوية' },
  { key: 'variance_analysis', sheetNumber: 26, titleAr: 'مقارنة الفعلي بالموازنة', category: 'الموازنات والتحليلات', icon: PieChart, shortDesc: 'تحليل الانحرافات المالية' },
  { key: 'equity_changes', sheetNumber: 27, titleAr: 'تحليل تكلفة الحج والعمرة والأنشطة', category: 'الموازنات والتحليلات', icon: Compass, shortDesc: 'ربحية وتكلفة المواسم' },

  // 8. القوائم والتقارير المالية الختامية
  { key: 'income_statement', sheetNumber: 28, titleAr: 'قائمة الإيرادات والمصروفات', category: 'القوائم المالية الختامية', icon: FileText, shortDesc: 'نتائج النشاط والفائض' },
  { key: 'balance_sheet', sheetNumber: 29, titleAr: 'قائمة المركز المالي', category: 'القوائم المالية الختامية', icon: Scale, shortDesc: 'الميزانية العمومية' },
  { key: 'cash_flow', sheetNumber: 30, titleAr: 'قائمة التدفقات النقدية', category: 'القوائم المالية الختامية', icon: Activity, shortDesc: 'التدفق التشغيلي والاستثماري' },
  { key: 'financial_notes', sheetNumber: 31, titleAr: 'المؤشرات المالية والإيضاحات', category: 'القوائم المالية الختامية', icon: FileCode2, shortDesc: 'النسب والتحليلات والملحقات' },

  // 9. الرقابة والمراجعة
  { key: 'audit_controls', sheetNumber: 32, titleAr: 'ضوابط الرقابة والتوازن', category: 'الرقابة والمراجعة', icon: ShieldCheck, shortDesc: '25 قاعدة فحص رقابي' },
  { key: 'executive_dashboard', sheetNumber: 33, titleAr: 'لوحة التحكم للمسؤولين', category: 'الرقابة والمراجعة', icon: LayoutDashboard, badge: 'CFO', shortDesc: 'متابعة المواعيد والإقفال' },
  { key: 'audit_trail', sheetNumber: 34, titleAr: 'سجل المراجعة التاريخي', category: 'الرقابة والمراجعة', icon: History, shortDesc: 'تتبع العمليات والتعديلات' },
];

export interface CategoryInfo {
  name: string;
  icon: React.ElementType;
}

export const CATEGORIES_WITH_ICONS: CategoryInfo[] = [
  { name: 'الكل (35 ورقة عمل)', icon: Sparkles },
  { name: 'الرئيسية والتهيئة', icon: Home },
  { name: 'الأدلة والمعالم', icon: FolderTree },
  { name: 'القيود والعمليات', icon: BookOpen },
  { name: 'النقدية والشيكات', icon: Coins },
  { name: 'الأنشطة والمعاملات', icon: PiggyBank },
  { name: 'الأستاذ والموازين', icon: Scale },
  { name: 'الموازنات والتحليلات', icon: LineChart },
  { name: 'القوائم المالية الختامية', icon: FileText },
  { name: 'الرقابة والمراجعة', icon: ShieldCheck },
];

export const CATEGORIES = CATEGORIES_WITH_ICONS.map((c) => c.name);

interface SheetNavProps {
  activeSheet: SheetKey;
  onSelectSheet: (sheet: SheetKey) => void;
}

export const SheetNav: React.FC<SheetNavProps> = ({ activeSheet, onSelectSheet }) => {
  const [selectedCategory, setSelectedCategory] = useState('الكل (35 ورقة عمل)');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate sheet counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'الكل (35 ورقة عمل)': ALL_SHEETS.length,
    };
    ALL_SHEETS.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filter sheets by category and search
  const filteredSheets = useMemo(() => {
    return ALL_SHEETS.filter((s) => {
      const matchesCat =
        selectedCategory === 'الكل (35 ورقة عمل)' || s.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.titleAr.toLowerCase().includes(q) ||
        s.sheetNumber.toString().includes(q) ||
        s.key.toLowerCase().includes(q) ||
        (s.shortDesc && s.shortDesc.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Current sheet index for Prev/Next navigation
  const currentIndex = ALL_SHEETS.findIndex((s) => s.key === activeSheet);
  const currentSheetDef = ALL_SHEETS[currentIndex] || ALL_SHEETS[0];

  const handlePrevSheet = () => {
    if (currentIndex > 0) {
      onSelectSheet(ALL_SHEETS[currentIndex - 1].key);
    }
  };

  const handleNextSheet = () => {
    if (currentIndex < ALL_SHEETS.length - 1) {
      onSelectSheet(ALL_SHEETS[currentIndex + 1].key);
    }
  };

  return (
    <div className="bg-[#0B0D17] border-b border-[#232742] text-white sticky top-[68px] z-40 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Top Control Bar: Category Filters, Search, Prev/Next buttons & Shortcuts */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pb-2 border-b border-[#1b1f36]">
          {/* Categories Pill Bar in Pulvent Modern Theme with Lucide React Icons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {CATEGORIES_WITH_ICONS.map((catItem) => {
              const isSelected = selectedCategory === catItem.name;
              const CatIcon = catItem.icon;
              const count = categoryCounts[catItem.name] || 0;

              return (
                <button
                  key={catItem.name}
                  onClick={() => setSelectedCategory(catItem.name)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#3632c7] to-[#39e3d7] text-white font-bold shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/40'
                      : 'bg-[#131626] text-[#8E92BC] hover:text-[#D7D6F4] hover:bg-[#1b1f36] border border-[#232742] hover:border-[#39e3d7]/30'
                  }`}
                  title={`${catItem.name} (${count} شيت)`}
                >
                  <CatIcon
                    className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                      isSelected ? 'text-white' : 'text-[#39e3d7]'
                    }`}
                  />
                  <span>{catItem.name.replace(/ \(\d+ ورقة عمل\)/, '')}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-num font-bold ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-[#1c2038] text-[#39e3d7] border border-[#39e3d7]/20'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Direct Jumper & Sequential Navigation */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Search with Lucide icons */}
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#8E92BC] pointer-events-none" />
              <input
                type="text"
                placeholder="بحث في الـ 35 شيت..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131626] border border-[#232742] hover:border-[#3632c7]/60 rounded-xl pl-7 pr-8 py-1.5 text-xs text-white placeholder:text-[#8E92BC] focus:outline-none focus:border-[#39e3d7]/80 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-2 p-0.5 text-[#8E92BC] hover:text-white hover:bg-[#232742] rounded-full transition-colors cursor-pointer"
                  title="مسح البحث"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Direct 35-Sheet Select Dropdown with Lucide Filter Icon */}
            <div className="relative flex items-center bg-[#131626] border border-[#232742] hover:border-[#39e3d7]/50 rounded-xl px-2 py-1 transition-all">
              <ListFilter className="w-3.5 h-3.5 text-[#39e3d7] shrink-0 ml-1.5" />
              <select
                value={activeSheet}
                onChange={(e) => onSelectSheet(e.target.value as SheetKey)}
                className="bg-transparent text-[#39e3d7] text-xs font-bold focus:outline-none cursor-pointer max-w-[155px] truncate"
              >
                {ALL_SHEETS.map((s) => (
                  <option key={s.key} value={s.key} className="bg-[#131626] text-white">
                    {s.sheetNumber}. {s.titleAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Prev / Next Sheet Sequential Navigation in RTL */}
            <div className="flex items-center gap-1 bg-[#131626] border border-[#232742] p-0.5 rounded-xl shrink-0">
              <button
                onClick={handlePrevSheet}
                disabled={currentIndex <= 0}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  currentIndex > 0
                    ? 'hover:bg-[#1b1f36] text-[#8E92BC] hover:text-[#39e3d7] cursor-pointer'
                    : 'text-slate-700 cursor-not-allowed'
                }`}
                title={currentIndex > 0 ? `الشيت السابق: ${ALL_SHEETS[currentIndex - 1].titleAr}` : 'أنت في الشيت الأول'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono-num px-1 text-[#8E92BC] font-semibold">
                {currentSheetDef.sheetNumber} / 35
              </span>
              <button
                onClick={handleNextSheet}
                disabled={currentIndex >= ALL_SHEETS.length - 1}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  currentIndex < ALL_SHEETS.length - 1
                    ? 'hover:bg-[#1b1f36] text-[#8E92BC] hover:text-[#39e3d7] cursor-pointer'
                    : 'text-slate-700 cursor-not-allowed'
                }`}
                title={currentIndex < ALL_SHEETS.length - 1 ? `الشيت التالي: ${ALL_SHEETS[currentIndex + 1].titleAr}` : 'أنت في الشيت الأخير'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Quick CFO Shortcut */}
            <button
              onClick={() => onSelectSheet('executive_dashboard')}
              className={`hidden xl:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer font-semibold ${
                activeSheet === 'executive_dashboard'
                  ? 'bg-gradient-to-r from-[#3632c7] to-[#39e3d7] text-white border-[#39e3d7]'
                  : 'bg-[#131626] text-[#39e3d7] hover:text-white hover:bg-[#1b1f36] border-[#3632c7]/40'
              }`}
              title="الانتقال المباشر إلى لوحة التحكم للمسؤولين والمدير المالي"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>لوحة CFO</span>
            </button>
          </div>
        </div>

        {/* Excel Sheets Tab Strip with Lucide React Icons & Pulvent Theme */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-thin">
          {filteredSheets.map((sheet) => {
            const Icon = sheet.icon;
            const isActive = activeSheet === sheet.key;

            return (
              <button
                key={sheet.key}
                onClick={() => onSelectSheet(sheet.key)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-medium whitespace-nowrap transition-all border-b-2 cursor-pointer relative ${
                  isActive
                    ? 'bg-[#131626] text-[#39e3d7] border-[#39e3d7] shadow-inner font-bold'
                    : 'bg-transparent text-[#8E92BC] border-transparent hover:text-white hover:bg-[#131626]/70'
                }`}
                title={`ورقة عمل رقم ${sheet.sheetNumber}: ${sheet.titleAr}${sheet.shortDesc ? ` - ${sheet.shortDesc}` : ''}`}
              >
                {/* Active Top Glow Pill */}
                {isActive && (
                  <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3632c7] to-[#39e3d7] rounded-t-md" />
                )}

                {/* Sheet Number Badge */}
                <span
                  className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-mono-num font-bold transition-colors ${
                    isActive
                      ? 'bg-[#3632c7] text-white shadow-sm'
                      : 'bg-[#1b1f36] text-[#8E92BC] group-hover:bg-[#232742] group-hover:text-white'
                  }`}
                >
                  {sheet.sheetNumber}
                </span>

                {/* Lucide React Sheet Icon */}
                <Icon
                  className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                    isActive
                      ? 'text-[#39e3d7]'
                      : 'text-[#8E92BC] group-hover:text-[#39e3d7]'
                  }`}
                />

                {/* Sheet Name */}
                <span>{sheet.titleAr}</span>

                {/* Optional Status Badge */}
                {sheet.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase transition-all ${
                      isActive
                        ? 'bg-[#3632c7]/40 text-[#39e3d7] border border-[#39e3d7]/50'
                        : 'bg-[#1c2038] text-[#8E92BC] border border-[#232742]'
                    }`}
                  >
                    {sheet.badge}
                  </span>
                )}
              </button>
            );
          })}

          {filteredSheets.length === 0 && (
            <div className="py-2 px-4 text-xs text-[#8E92BC] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>لا توجد أوراق عمل تطابق كلمة البحث "{searchQuery}".</span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('الكل (35 ورقة عمل)');
                }}
                className="text-[#39e3d7] hover:underline font-semibold cursor-pointer mr-1"
              >
                إعادة ضبط البحث
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
