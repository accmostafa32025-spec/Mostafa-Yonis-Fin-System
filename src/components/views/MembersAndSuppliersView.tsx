import React, { useState } from 'react';
import {
  UserCheck,
  Truck,
  Search,
  Plus,
  Building,
  Phone,
  CreditCard,
  Receipt,
  PiggyBank,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import { Member, Supplier } from '../../types/accounting';

interface MembersAndSuppliersViewProps {
  mode: 'members' | 'suppliers';
  members: Member[];
  suppliers: Supplier[];
  currencySymbol: string;
  onAddMember: (m: Member) => void;
  onAddSupplier: (s: Supplier) => void;
}

export const MembersAndSuppliersView: React.FC<MembersAndSuppliersViewProps> = ({
  mode,
  members,
  suppliers,
  currencySymbol,
  onAddMember,
  onAddSupplier,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Member form state
  const [memNo, setMemNo] = useState(`MEM-${String(members.length + 1).padStart(4, '0')}`);
  const [memName, setMemName] = useState('');
  const [memNationalId, setMemNationalId] = useState('');
  const [memDept, setMemDept] = useState('الإدارة المركزية للرقابة المالية الأولى');
  const [memJob, setMemJob] = useState('عضو رقابي بالجهاز');
  const [memPhone, setMemPhone] = useState('01000000000');
  const [memSavings, setMemSavings] = useState(15000);

  // Supplier form state
  const [supCode, setSupCode] = useState(`TR-2026-${String(suppliers.length + 1).padStart(4, '0')}`);
  const [supName, setSupName] = useState('');
  const [supActivity, setSupActivity] = useState<Supplier['activityType']>('tourism_company');
  const [supLicense, setSupLicense] = useState('');
  const [supCommercialRegister, setSupCommercialRegister] = useState('');
  const [supBankAccount, setSupBankAccount] = useState('');
  const [supBankName, setSupBankName] = useState('بنك مصر');
  const [supTaxId, setSupTaxId] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supTaxRate, setSupTaxRate] = useState<1 | 3 | 5>(1);
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supBalance, setSupBalance] = useState(0);
  const [supplierTab, setSupplierTab] = useState<'all' | 'tourism' | 'hotels' | 'flights_transport' | 'exhibitions'>('all');

  const generateUniqueCode = (activity: Supplier['activityType'] = supActivity) => {
    const prefix = activity === 'tourism_company' ? 'TR-2026' : 'SUP-2026';
    const existing = new Set(suppliers.map((s) => s.code));
    let count = suppliers.length + 1;
    let candidate = `${prefix}-${String(count).padStart(4, '0')}`;
    while (existing.has(candidate)) {
      count++;
      candidate = `${prefix}-${String(count).padStart(4, '0')}`;
    }
    return candidate;
  };

  const handleOpenAddSupplierModal = () => {
    setSupCode(generateUniqueCode('tourism_company'));
    setSupActivity('tourism_company');
    setSupTaxRate(1);
    setSupName('');
    setSupLicense('');
    setSupCommercialRegister('');
    setSupBankAccount('');
    setSupTaxId('');
    setSupAddress('');
    setSupContact('');
    setSupPhone('');
    setSupBalance(0);
    setShowModal(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName.trim() || !memNationalId.trim()) {
      alert('يرجى كتابة اسم العضو ورقمه القومي');
      return;
    }
    const newM: Member = {
      id: `mem-${Date.now()}`,
      memberNo: memNo,
      name: memName.trim(),
      nationalId: memNationalId.trim(),
      department: memDept.trim(),
      jobTitle: memJob.trim(),
      phone: memPhone.trim(),
      savingsBalance: Number(memSavings) || 0,
      advancesBalance: 0,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    onAddMember(newM);
    setShowModal(false);
    setMemName('');
    setMemNationalId('');
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supCode.trim()) {
      alert('يرجى كتابة كود واسم المورد/الشركة');
      return;
    }
    const newS: Supplier = {
      id: `sup-${Date.now()}`,
      code: supCode.trim(),
      name: supName.trim(),
      activityType: supActivity,
      taxId: supTaxId.trim() || '300-000-000',
      withholdingTaxRate: supTaxRate,
      contactPerson: supContact.trim(),
      phone: supPhone.trim(),
      balance: Number(supBalance) || 0,
      licenseNumber: supLicense.trim() || undefined,
      commercialRegister: supCommercialRegister.trim() || undefined,
      bankAccountNumber: supBankAccount.trim() || undefined,
      bankName: supBankName.trim() || undefined,
      address: supAddress.trim() || undefined,
      isTourismCompany: supActivity === 'tourism_company',
    };
    onAddSupplier(newS);
    setShowModal(false);
    setSupName('');
    setSupContact('');
    setSupLicense('');
    setSupCommercialRegister('');
    setSupBankAccount('');
    setSupAddress('');
  };

  if (mode === 'members') {
    const filteredMembers = members.filter((m) =>
      m.name.includes(searchQuery) ||
      m.memberNo.includes(searchQuery) ||
      m.department.includes(searchQuery) ||
      m.nationalId.includes(searchQuery)
    );

    const totalSavings = members.reduce((s, m) => s + m.savingsBalance, 0);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>دليل أعضاء الجهاز المركزي للمحاسبات المشتركين بالجمعية</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
                {members.length} عضو
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              متابعة أرصدة مدخرات الأعضاء (حساب أمانات 2131) ومطابقة الأقساط الشهرية المقتطعة
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer active:scale-95 group"
            >
              <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
              <span>إضافة عضو جديد</span>
            </button>
          </div>
        </div>

        {/* Filter and Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم العضوية، الاسم، الرقم القومي، الإدارة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <PiggyBank className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">إجمالي مدخرات الأعضاء القائمة:</span>
            <span className="text-xs font-mono-num font-bold text-white">
              {totalSavings.toLocaleString()} {currencySymbol}
            </span>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-400">
            <span>جميع الأعضاء خاضعون للخصم الشهري المنتظم</span>
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 w-28">رقم العضوية</th>
                <th className="p-3 min-w-[180px]">اسم العضو</th>
                <th className="p-3">الرقم القومي</th>
                <th className="p-3 min-w-[200px]">الإدارة بالجهاز المركزي للمحاسبات</th>
                <th className="p-3">الوظيفة</th>
                <th className="p-3">رصيد المدخرات (ج.م)</th>
                <th className="p-3">أقساط مقدمات الرحلات</th>
                <th className="p-3">تاريخ الاشتراك</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                  <td className="p-3 font-mono-num font-bold text-amber-300">{m.memberNo}</td>
                  <td className="p-3 font-semibold text-white">{m.name}</td>
                  <td className="p-3 font-mono-num text-slate-400">{m.nationalId}</td>
                  <td className="p-3 text-slate-300">{m.department}</td>
                  <td className="p-3 text-slate-400">{m.jobTitle}</td>
                  <td className="p-3 font-mono-num font-bold text-purple-300">
                    {m.savingsBalance.toLocaleString()} {currencySymbol}
                  </td>
                  <td className="p-3 font-mono-num text-slate-400">
                    {m.advancesBalance > 0 ? `${m.advancesBalance.toLocaleString()} ${currencySymbol}` : '-'}
                  </td>
                  <td className="p-3 font-mono-num text-slate-400">{m.joinDate}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      نشط
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Member Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  <span>تسجيل عضو جديد بالجهاز المركزي للمحاسبات</span>
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveMember} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">رقم العضوية</label>
                    <input
                      type="text"
                      value={memNo}
                      onChange={(e) => setMemNo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono-num font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">الرقم القومي (14 رقم)</label>
                    <input
                      type="text"
                      required
                      placeholder="28501010101010"
                      value={memNationalId}
                      onChange={(e) => setMemNationalId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">اسم العضو بالكامل</label>
                  <input
                    type="text"
                    required
                    placeholder="الاسم الثلاثي أو الرباعي..."
                    value={memName}
                    onChange={(e) => setMemName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">الإدارة بالجهاز</label>
                    <input
                      type="text"
                      value={memDept}
                      onChange={(e) => setMemDept(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">المسمى الوظيفي</label>
                    <input
                      type="text"
                      value={memJob}
                      onChange={(e) => setMemJob(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">رقم الهاتف</label>
                    <input
                      type="text"
                      value={memPhone}
                      onChange={(e) => setMemPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">رصيد أول المدة للمدخرات (ج.م)</label>
                    <input
                      type="number"
                      value={memSavings}
                      onChange={(e) => setMemSavings(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold hover:brightness-110 cursor-pointer shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 active:scale-95 transition-all group"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    <span>حفظ العضو</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Suppliers view
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.includes(searchQuery) ||
      s.code.includes(searchQuery) ||
      s.contactPerson.includes(searchQuery) ||
      s.taxId.includes(searchQuery) ||
      (s.licenseNumber && s.licenseNumber.includes(searchQuery)) ||
      (s.commercialRegister && s.commercialRegister.includes(searchQuery)) ||
      (s.address && s.address.includes(searchQuery));

    if (!matchesSearch) return false;

    if (supplierTab === 'tourism') {
      return s.activityType === 'tourism_company' || s.isTourismCompany;
    }
    if (supplierTab === 'hotels') {
      return s.activityType === 'hotels';
    }
    if (supplierTab === 'flights_transport') {
      return s.activityType === 'flights' || s.activityType === 'transport';
    }
    if (supplierTab === 'exhibitions') {
      return s.activityType === 'exhibitions_vendor';
    }
    return true;
  });

  const tourismCount = suppliers.filter((s) => s.activityType === 'tourism_company' || s.isTourismCompany).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>سجل ودليل الموردين وشركات السياحة والفنادق والطيران</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
              {suppliers.length} جهة
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {tourismCount} شركة سياحة مرخصة
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            تكويد تلقائي فريد (Unique Codes) وحفظ بيانات التراخيص، السجل التجاري، الحسابات البنكية، والخصم الضريبي
          </p>
        </div>

        <button
          onClick={handleOpenAddSupplierModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer active:scale-95 group"
        >
          <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
          <span>إضافة شركة سياحة / مورد جديد (تكويد تلقائي)</span>
        </button>
      </div>

      {/* Filter and Category Switcher */}
      <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSupplierTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              supplierTab === 'all'
                ? 'bg-[#3632c7] text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            كافة الموردين والشركات ({suppliers.length})
          </button>
          <button
            onClick={() => setSupplierTab('tourism')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              supplierTab === 'tourism'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                : 'bg-slate-950 text-emerald-400 hover:text-white border border-emerald-500/30'
            }`}
          >
            <span>شركات السياحة والحج والعمرة</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-200 border border-emerald-500/40">
              {tourismCount}
            </span>
          </button>
          <button
            onClick={() => setSupplierTab('hotels')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              supplierTab === 'hotels'
                ? 'bg-[#3632c7] text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            فنادق وإقامة مكة والمدينة
          </button>
          <button
            onClick={() => setSupplierTab('flights_transport')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              supplierTab === 'flights_transport'
                ? 'bg-[#3632c7] text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            طيران ونقل وباصات
          </button>
          <button
            onClick={() => setSupplierTab('exhibitions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              supplierTab === 'exhibitions'
                ? 'bg-[#3632c7] text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            معارض وسلع بالتقسيط
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، الكود، الترخيص، السجل التجاري، رقم الحساب البنكي، أو الملف الضريبي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end text-xs text-slate-400 gap-4">
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300">
              نسب الخصم: 1% توريدات ومقاولات وإقامة | 3% خدمات ونقل | 5% مهن حرة
            </span>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3 w-28">كود فريد (Unique)</th>
              <th className="p-3 min-w-[200px]">اسم الشركة / المورد</th>
              <th className="p-3">نوع النشاط</th>
              <th className="p-3">بيانات الترخيص والسجل التجاري</th>
              <th className="p-3">رقم حساب البنك</th>
              <th className="p-3">رقم التسجيل الضريبي</th>
              <th className="p-3 min-w-[160px]">العنوان والمقر</th>
              <th className="p-3">نسبة الخصم</th>
              <th className="p-3">الرصيد الدائن القائم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredSuppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                <td className="p-3 font-mono-num font-bold text-amber-300 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    {s.code}
                  </span>
                </td>
                <td className="p-3 font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    <span>{s.name}</span>
                    {(s.activityType === 'tourism_company' || s.isTourismCompany) && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                        سياحة معتمدة
                      </span>
                    )}
                  </div>
                  {s.contactPerson && (
                    <div className="text-[11px] text-slate-400 font-normal pt-0.5">
                      المسؤول: {s.contactPerson} ({s.phone})
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 whitespace-nowrap">
                    {s.activityType === 'tourism_company'
                      ? 'شركة سياحة ورحلات'
                      : s.activityType === 'hotels'
                      ? 'فنادق وإقامة'
                      : s.activityType === 'flights'
                      ? 'طيران'
                      : s.activityType === 'transport'
                      ? 'نقل وباصات'
                      : s.activityType === 'exhibitions_vendor'
                      ? 'معارض وسلع تقسيط'
                      : 'خدمات عامة'}
                  </span>
                </td>
                <td className="p-3 text-[11px] space-y-0.5">
                  <div className="text-slate-300 font-medium">
                    {s.licenseNumber || '—'}
                  </div>
                  <div className="text-slate-500 font-mono-num text-[10px]">
                    {s.commercialRegister || ''}
                  </div>
                </td>
                <td className="p-3 font-mono-num text-[11px]">
                  <div className="text-slate-200 font-semibold">{s.bankAccountNumber || '—'}</div>
                  {s.bankName && <div className="text-[10px] text-slate-500">{s.bankName}</div>}
                </td>
                <td className="p-3 font-mono-num text-slate-300 font-bold whitespace-nowrap">{s.taxId}</td>
                <td className="p-3 text-[11px] text-slate-400">{s.address || '—'}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded font-mono-num font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                    {s.withholdingTaxRate}%
                  </span>
                </td>
                <td className="p-3 font-mono-num font-bold text-amber-300 whitespace-nowrap">
                  {s.balance.toLocaleString()} {currencySymbol}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <span>إضافة شركة سياحة أو مورد جديد (تكويد تلقائي فريد)</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-xs">
              {/* Unique Code & Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-bold">كود المورد الفريد (Unique Code)</label>
                    <button
                      type="button"
                      onClick={() => setSupCode(generateUniqueCode(supActivity))}
                      className="text-[10px] text-cyan-300 hover:underline cursor-pointer"
                    >
                      توليد تلقائي
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={supCode}
                    onChange={(e) => setSupCode(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-lg p-2 text-amber-300 font-mono-num font-bold"
                  />
                  <span className="text-[10px] text-slate-500">كود مميز غير قابل للتكرار</span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">تصنيف النشاط</label>
                  <select
                    value={supActivity}
                    onChange={(e) => {
                      const newAct = e.target.value as Supplier['activityType'];
                      setSupActivity(newAct);
                      setSupCode(generateUniqueCode(newAct));
                      if (newAct === 'transport') setSupTaxRate(3);
                      else setSupTaxRate(1);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="tourism_company">شركة سياحة ورحلات حج وعمرة (مرخصة)</option>
                    <option value="hotels">فنادق وإقامة</option>
                    <option value="flights">طيران</option>
                    <option value="transport">نقل وسيارات وباصات</option>
                    <option value="exhibitions_vendor">معارض وسلع تقسيط</option>
                    <option value="services">خدمات عامة واستشارات</option>
                  </select>
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-slate-400 mb-1 font-bold">اسم الشركة / المورد</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة النيل الدولية للسياحة وتنظيم رحلات الحج والعمرة"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-medium"
                />
              </div>

              {/* Tourism License & Commercial Register */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">رقم الترخيص السياحي / التجاري</label>
                  <input
                    type="text"
                    placeholder="مثال: ترخيص سياحي رقم 1850 - فئة (أ)"
                    value={supLicense}
                    onChange={(e) => setSupLicense(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">رقم السجل التجاري</label>
                  <input
                    type="text"
                    placeholder="مثال: سجل تجاري رقم 129480"
                    value={supCommercialRegister}
                    onChange={(e) => setSupCommercialRegister(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num"
                  />
                </div>
              </div>

              {/* Bank Account & Bank Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">رقم حساب البنك للمورد</label>
                  <input
                    type="text"
                    placeholder="مثال: 1990199000000018 أو رقم الحساب المعتمد"
                    value={supBankAccount}
                    onChange={(e) => setSupBankAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">اسم البنك المعتمد والفرع</label>
                  <input
                    type="text"
                    placeholder="مثال: بنك مصر - فرع طلعت حرب"
                    value={supBankName}
                    onChange={(e) => setSupBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* Tax ID & Withholding Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">رقم التسجيل الضريبي (Tax ID)</label>
                  <input
                    type="text"
                    placeholder="مثال: 700-123-456 أو 9 أرقام"
                    value={supTaxId}
                    onChange={(e) => setSupTaxId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num font-bold text-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">نسبة الخصم من المنبع (نموذج 41)</label>
                  <select
                    value={supTaxRate}
                    onChange={(e) => setSupTaxRate(Number(e.target.value) as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value={1}>1% (توريدات، سلع، إقامة فندقية)</option>
                    <option value={3}>3% (خدمات، نقل وسياحة)</option>
                    <option value={5}>5% (استشارات ومهن حرة)</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-400 mb-1">العنوان والمقر الرئيسي للشركة</label>
                <input
                  type="text"
                  placeholder="مثال: 15 شارع قصر النيل - وسط البلد - القاهرة"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              {/* Contact & Phone & Opening Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">الشخص المسؤول</label>
                  <input
                    type="text"
                    placeholder="اسم المسؤول..."
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="010..."
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">الرصيد الدائن الافتتاحي (ج.م)</label>
                  <input
                    type="number"
                    value={supBalance}
                    onChange={(e) => setSupBalance(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono-num font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold hover:brightness-110 cursor-pointer shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 active:scale-95 transition-all group"
                >
                  <CheckCircle2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span>حفظ وتثبيت الشركة بالسجل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
