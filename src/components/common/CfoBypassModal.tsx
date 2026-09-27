import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { AccountingAnomaly, SystemSettings, User } from '../../types/accounting';
import { verifyCfoPassword } from '../../services/anomalyDetection';

interface CfoBypassModalProps {
  isOpen: boolean;
  anomalies: AccountingAnomaly[];
  entryNo?: string;
  documentNo?: string;
  settings: SystemSettings;
  users?: User[];
  targetActionName?: string; // e.g. "حفظ القيد كمسودة" | "إرسال للمراجعة" | "اعتماد وترحيل القيد"
  onConfirmBypass: (overrideReason: string, authorizedBy: string) => void;
  onCancel: () => void;
}

export const CfoBypassModal: React.FC<CfoBypassModalProps> = ({
  isOpen,
  anomalies,
  entryNo,
  documentNo,
  settings,
  users,
  targetActionName = 'اعتماد وترحيل القيد',
  onConfirmBypass,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [overrideReason, setOverrideReason] = useState(
    'تسوية وتوجيه محاسبي استثنائي تمت مراجعته والمصادقة عليه رسمياً من المدير المالي'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const defaultCfo = users?.find((u) => u.role === 'cfo') || {
    fullName: 'أ.د. إبراهيم عبد الرحمن',
    roleTitleAr: 'المدير المالي التنفيذي (CFO)',
  };

  const handleVerifyAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsVerifying(true);

    setTimeout(() => {
      const isValid = verifyCfoPassword(password, settings, users);
      setIsVerifying(false);

      if (isValid) {
        onConfirmBypass(
          overrideReason.trim() || 'تسوية محاسبية استثنائية بتوجيه معتمد من المدير المالي',
          defaultCfo.fullName
        );
        setPassword('');
        setErrorMessage(null);
      } else {
        setErrorMessage(
          'كلمة مرور المدير المالي غير صحيحة! تم حظر التجاوز لحماية دقة التوجيهات والتسويات المحاسبية.'
        );
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-[#0f1222] border-2 border-rose-500/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 p-5 border-b border-rose-500/30 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-7 h-7 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
                رقابة داخلية مشددة
              </span>
              <span className="text-xs text-slate-400">
                الجهاز المركزي للمحاسبات
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              رسالة تحذيرية: اكتشاف قيود وتوجيهات شاذة تخالف طبيعة نوع الحساب
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {entryNo && `القيد رقم: ${entryNo} `}
              {documentNo && `| مستند رقم: ${documentNo} `}
              - يتطلب المتابعة ولا يمكن إتمام ({targetActionName}) إلا بتجاوز مصادق عليه بكلمة سر المدير المالي (CFO).
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Anomaly Cards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>تفاصيل التوجيهات الشاذة المرصودة ({anomalies.length}):</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                مخالفة معايير الرقابة والتسويات
              </span>
            </div>

            {anomalies.map((anom, idx) => (
              <div
                key={anom.lineId || idx}
                className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-3.5 space-y-2 hover:border-rose-400/50 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono font-bold flex items-center justify-center">
                      {anom.lineNumber}
                    </span>
                    <span className="text-xs font-bold text-white">
                      [الحساب: {anom.accountCode} - {anom.accountName}]
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      طبيعة الحساب الأصلية:{' '}
                      <strong className="text-amber-300">
                        {anom.naturalBalance === 'debit' ? 'مدينة (Debit)' : 'دائنة (Credit)'}
                      </strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                      الحركة الشاذة: {anom.direction === 'debit' ? 'مدين' : 'دائن'} بمبلغ {anom.amount.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed">
                  <span className="text-rose-400 font-bold ml-1">سبب التحذير:</span>
                  {anom.explanation}
                </div>

                <div className="text-[11px] bg-slate-950/70 p-2 rounded-lg text-slate-400 border border-slate-800/80 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{anom.accountingRule}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CFO Bypass Form */}
          <form onSubmit={handleVerifyAndSubmit} className="space-y-4 pt-2">
            <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    مصادقة وتجاوز المدير المالي التنفيذي (CFO Authorization)
                  </span>
                </div>
                <span className="text-[11px] text-amber-300 font-semibold">
                  {defaultCfo.fullName}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  مبررات وتوجيهات التسوية المحاسبية (Audit Justification):
                </label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="أدخل مبررات التسوية الاستثنائية التي سيتم توثيقها في سجل التدقيق..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>أدخل كلمة سر المدير المالي للتجاوز:</span>
                  </label>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    (كلمة السر الافتراضية: {settings.cfoPassword || 'cfo@2026'})
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="أدخل كلمة مرور المدير المالي..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pr-3 pl-10 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errorMessage && (
                  <div className="mt-2 p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                    <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء والعودة لتصحيح أطراف القيد
              </button>

              <button
                type="submit"
                disabled={isVerifying || !password}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isVerifying ? 'جارٍ التحقق...' : `تأكيد التجاوز وإتمام (${targetActionName})`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
