import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  PlusCircle,
  Coins,
  FileCheck2,
  Printer,
  Calendar,
  Building,
} from 'lucide-react';
import { JournalEntry, SystemSettings } from '../../types/accounting';

interface ReceiptsAndPaymentsViewProps {
  mode: 'receipts' | 'payments';
  entries: JournalEntry[];
  settings: SystemSettings;
  onNewVoucher: () => void;
}

export const ReceiptsAndPaymentsView: React.FC<ReceiptsAndPaymentsViewProps> = ({
  mode,
  entries,
  settings,
  onNewVoucher,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const targetType = mode === 'receipts' ? 'receipt' : 'payment';
  const filtered = entries.filter((e) => {
    const matchesType = e.entryType === targetType;
    const matchesSearch =
      e.entryNo.includes(searchQuery) ||
      e.description.includes(searchQuery) ||
      e.documentNo.includes(searchQuery) ||
      e.lines.some((l) => l.accountName.includes(searchQuery) || (l.entityName && l.entityName.includes(searchQuery)));
    return matchesType && matchesSearch;
  });

  const totalAmount = filtered.reduce((s, e) => s + e.totalDebit, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              mode === 'receipts'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {mode === 'receipts' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{mode === 'receipts' ? 'سجل المقبوضات وإيصالات التحصيل' : 'سجل المدفوعات وأذون الصرف'}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono-num font-bold">
                {filtered.length} عملية
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'receipts'
                ? 'متابعة المقبوضات النقدية والبنكية والشيكات الواردة من أعضاء الجهاز المركزي'
                : 'متابعة أوامر الصرف المعتمدة لموردي الفنادق والطيران وشركات المعارض مع استقطاع الخصم الضريبي'}
            </p>
          </div>
        </div>

        <button
          onClick={onNewVoucher}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3632c7] via-[#2f2ba8] to-[#39e3d7] hover:from-[#2c28a8] hover:to-[#2bc9bd] text-white text-xs font-bold shadow-lg shadow-[#3632c7]/35 border border-[#39e3d7]/30 transition-all cursor-pointer active:scale-95 group"
        >
          {mode === 'receipts' ? (
            <ArrowDownLeft className="w-4 h-4 text-[#39e3d7] group-hover:scale-110 transition-transform" />
          ) : (
            <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
          )}
          <span>{mode === 'receipts' ? 'إصدار إيصال قبض جديد' : 'إصدار إذن صرف جديد'}</span>
        </button>
      </div>

      {/* Filter and Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الإيصال، السند، العضو، المورد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">إجمالي قيمة العمليات:</span>
          <span className={`font-mono-num font-bold text-sm ${mode === 'receipts' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalAmount.toLocaleString()} {settings.currencySymbol}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">رقم القيد</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">رقم الإيصال / المستند</th>
              <th className="p-3 min-w-[160px]">{mode === 'receipts' ? 'المستلم منه' : 'المستفيد / المورد'}</th>
              <th className="p-3">{mode === 'receipts' ? 'طريقة التحصيل' : 'وسيلة الصرف'}</th>
              <th className="p-3">{mode === 'receipts' ? 'حساب الإيراد / المصدر' : 'بند المصروف / المورد'}</th>
              <th className="p-3 min-w-[180px]">مركز التكلفة</th>
              <th className="p-3">المبلغ الإجمالي</th>
              <th className="p-3 min-w-[200px]">البيان التفصيلي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  لا توجد عمليات مسجلة في هذا السجل حالياً
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const entityLine = entry.lines.find((l) => l.entityName);
                const costLine = entry.lines.find((l) => l.costCenterName);
                const counterLine = entry.lines.find((l) =>
                  mode === 'receipts' ? l.credit > 0 : l.debit > 0
                );

                return (
                  <tr key={entry.id} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                    <td className="p-3 font-mono-num font-bold text-amber-300">{entry.entryNo}</td>
                    <td className="p-3 font-mono-num text-slate-400">{entry.date}</td>
                    <td className="p-3 font-semibold text-white">{entry.documentNo}</td>
                    <td className="p-3 text-slate-200">
                      {entityLine?.entityName || (mode === 'receipts' ? 'أعضاء الجمعية' : 'مورد خدمات')}
                    </td>
                    <td className="p-3">
                      {mode === 'receipts' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                          {entry.lines.some((l) => l.accountCode.startsWith('111')) ? 'نقداً بالخزينة' : 'إيداع / تحويل بنكي'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                          {entry.lines.some((l) => l.accountCode === '2141') ? 'شيك مسحوب' : 'نقداً من الخزينة'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">{counterLine?.accountName || '-'}</td>
                    <td className="p-3">
                      {costLine?.costCenterName ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                          {costLine.costCenterName}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-3 font-mono-num font-bold text-white text-sm">
                      {entry.totalDebit.toLocaleString()} {settings.currencySymbol}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{entry.description}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
