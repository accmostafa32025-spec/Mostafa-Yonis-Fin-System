import React from 'react';

interface FlatIconProps {
  className?: string;
  size?: number;
}

/**
 * Authentic Flaticon-style multi-color vector symbols
 * Designed specifically for financial systems, Excel sheets, auditing, and Pulvent UI branding.
 */

// 1. Flaticon Excel / Spreadsheet Icon
export const FlatIconExcel: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Base Document */}
    <rect x="5" y="3" width="22" height="26" rx="3" fill="#107C41" />
    <path d="M19 3H24C25.6569 3 27 4.34315 27 6V11L19 3Z" fill="#1F9A55" />
    <rect x="8" y="7" width="16" height="18" rx="1.5" fill="#FFFFFF" />
    {/* Grid Lines */}
    <rect x="10" y="9" width="12" height="3" rx="0.5" fill="#107C41" />
    <rect x="10" y="14" width="5" height="2.5" rx="0.5" fill="#33C481" opacity="0.4" />
    <rect x="17" y="14" width="5" height="2.5" rx="0.5" fill="#33C481" opacity="0.4" />
    <rect x="10" y="18" width="5" height="2.5" rx="0.5" fill="#33C481" opacity="0.25" />
    <rect x="17" y="18" width="5" height="2.5" rx="0.5" fill="#33C481" opacity="0.25" />
    {/* Excel "X" Green Badge */}
    <circle cx="9" cy="23" r="6" fill="#185C37" stroke="#FFFFFF" strokeWidth="1.5" />
    <path
      d="M7 21L11 25M11 21L7 25"
      stroke="#39E3D7"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

// 2. Flaticon New Voucher / Accounting Entry Document
export const FlatIconNewEntry: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Paper Sheet */}
    <path
      d="M6 5C6 3.89543 6.89543 3 8 3H19L26 10V27C26 28.1046 25.1046 29 24 29H8C6.89543 29 6 28.1046 6 27V5Z"
      fill="#F1F5F9"
    />
    <path d="M19 3V8C19 9.10457 19.8954 10 21 10H26L19 3Z" fill="#CBD5E1" />
    {/* Ledger lines */}
    <rect x="9" y="13" width="9" height="2" rx="1" fill="#94A3B8" />
    <rect x="9" y="17" width="12" height="2" rx="1" fill="#94A3B8" />
    <rect x="9" y="21" width="7" height="2" rx="1" fill="#94A3B8" />
    {/* Floating Plus Badge */}
    <circle cx="23" cy="23" r="7" fill="#3632C7" stroke="#0B0D17" strokeWidth="1.5" />
    <path
      d="M23 19.5V26.5M19.5 23H26.5"
      stroke="#39E3D7"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

// 3. Flaticon Printer
export const FlatIconPrint: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Paper in Tray (top) */}
    <path d="M9 4H23V11H9V4Z" fill="#E2E8F0" rx="1" />
    <rect x="12" y="6" width="8" height="1.5" fill="#94A3B8" rx="0.5" />
    <rect x="12" y="8.5" width="6" height="1.5" fill="#94A3B8" rx="0.5" />
    {/* Printer Body */}
    <rect x="4" y="10" width="24" height="14" rx="3.5" fill="#3632C7" />
    <rect x="6" y="12" width="20" height="10" rx="2" fill="#201C8E" />
    {/* Power / Status Light */}
    <circle cx="8" cy="15" r="1.2" fill="#39E3D7" />
    <circle cx="11.5" cy="15" r="1.2" fill="#F59E0B" />
    {/* Output Paper */}
    <rect x="8" y="18" width="16" height="10" rx="1.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
    <rect x="11" y="21" width="10" height="1.5" fill="#3632C7" rx="0.5" />
    <rect x="11" y="23.5" width="7" height="1.5" fill="#39E3D7" rx="0.5" />
  </svg>
);

// 4. Flaticon Bank / Vault Icon
export const FlatIconBank: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Pediment (Triangle Roof) */}
    <path d="M16 2L3 8V10H29V8L16 2Z" fill="#3632C7" />
    <path d="M16 4.5L6.5 8.5H25.5L16 4.5Z" fill="#39E3D7" />
    {/* Columns */}
    <rect x="5" y="11" width="3.5" height="12" rx="1" fill="#716DF7" />
    <rect x="11" y="11" width="3.5" height="12" rx="1" fill="#716DF7" />
    <rect x="17.5" y="11" width="3.5" height="12" rx="1" fill="#716DF7" />
    <rect x="23.5" y="11" width="3.5" height="12" rx="1" fill="#716DF7" />
    {/* Steps / Base */}
    <rect x="3" y="23" width="26" height="3" rx="1" fill="#201C8E" />
    <rect x="1.5" y="26" width="29" height="3.5" rx="1" fill="#3632C7" />
    {/* Central Gold Emblem */}
    <circle cx="16" cy="17" r="3.5" fill="#F59E0B" />
    <text x="16" y="19" textAnchor="middle" fill="#0B0D17" fontSize="5" fontWeight="900" fontFamily="sans-serif">
      E£
    </text>
  </svg>
);

// 5. Flaticon Scales / Reconciliation Balance
export const FlatIconScales: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Central Pillar & Base */}
    <rect x="15" y="6" width="2" height="20" rx="1" fill="#3632C7" />
    <path d="M10 28C10 26.8954 10.8954 26 12 26H20C21.1046 26 22 26.8954 22 28H10Z" fill="#201C8E" />
    <circle cx="16" cy="6" r="3" fill="#39E3D7" />
    {/* Cross Beam */}
    <path d="M4 8.5C4 7.67157 4.67157 7 5.5 7H26.5C27.3284 7 28 7.67157 28 8.5V9.5H4V8.5Z" fill="#39E3D7" />
    {/* Left Pan */}
    <path d="M5 9.5L2 17H12L9 9.5" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M1 17C1 19.7614 3.68629 22 7 22C10.3137 22 13 19.7614 13 17H1Z" fill="#F59E0B" />
    {/* Right Pan */}
    <path d="M23 9.5L20 17H30L27 9.5" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M19 17C19 19.7614 21.6863 22 25 22C28.3137 22 31 19.7614 31 17H19Z" fill="#F59E0B" />
  </svg>
);

// 6. Flaticon Cash / Treasury Stack
export const FlatIconCash: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Lower Banknote */}
    <rect x="2" y="10" width="22" height="13" rx="2" fill="#0D9488" />
    {/* Main Banknote */}
    <rect x="5" y="7" width="22" height="13" rx="2" fill="#10B981" stroke="#047857" strokeWidth="0.8" />
    <rect x="7" y="9" width="18" height="9" rx="1.5" stroke="#A7F3D0" strokeWidth="0.8" strokeDasharray="2 1" />
    <circle cx="16" cy="13.5" r="3" fill="#047857" />
    <circle cx="16" cy="13.5" r="2" fill="#34D399" />
    {/* Golden Coin Overlay */}
    <circle cx="23" cy="21" r="6" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2" />
    <circle cx="23" cy="21" r="4.2" fill="#FBBF24" />
    <text x="23" y="23" textAnchor="middle" fill="#78350F" fontSize="5.5" fontWeight="900" fontFamily="sans-serif">
      ج
    </text>
  </svg>
);

// 7. Flaticon Audit Shield
export const FlatIconAudit: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Outer Shield with Gradient Style */}
    <path
      d="M16 2L28 6.5V14C28 21.5 22.8 28.2 16 30C9.2 28.2 4 21.5 4 14V6.5L16 2Z"
      fill="#3632C7"
    />
    <path
      d="M16 4.5L25.5 8V14C25.5 20.2 21.4 25.8 16 27.5C10.6 25.8 6.5 20.2 6.5 14V8L16 4.5Z"
      fill="#201C8E"
    />
    {/* Inner Turquoise Accent */}
    <path
      d="M16 7L23 9.8V14C23 18.8 19.9 23.3 16 24.8C12.1 23.3 9 18.8 9 14V9.8L16 7Z"
      fill="#131626"
    />
    {/* Verified Checkmark */}
    <path
      d="M12.5 14.5L15 17L19.5 11.5"
      stroke="#39E3D7"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 8. Flaticon Download / Export
export const FlatIconDownload: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Tray */}
    <path
      d="M4 20V24C4 26.2091 5.79086 28 8 28H24C26.2091 28 28 26.2091 28 24V20"
      stroke="#3632C7"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Download Arrow */}
    <path
      d="M16 4V19M16 19L10 13M16 19L22 13"
      stroke="#39E3D7"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 9. Flaticon Calendar / Schedule
export const FlatIconCalendar: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Calendar Body */}
    <rect x="4" y="6" width="24" height="22" rx="3.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
    {/* Header Banner */}
    <path d="M4 9.5C4 7.567 5.567 6 7.5 6H24.5C26.433 6 28 7.567 28 9.5V12H4V9.5Z" fill="#3632C7" />
    {/* Rings / Spirals */}
    <rect x="8" y="3" width="2.5" height="5" rx="1.2" fill="#39E3D7" />
    <rect x="15" y="3" width="2.5" height="5" rx="1.2" fill="#39E3D7" />
    <rect x="22" y="3" width="2.5" height="5" rx="1.2" fill="#39E3D7" />
    {/* Date Dots Grid */}
    <circle cx="9" cy="16" r="1.5" fill="#94A3B8" />
    <circle cx="16" cy="16" r="1.5" fill="#94A3B8" />
    <circle cx="23" cy="16" r="1.5" fill="#94A3B8" />
    <circle cx="9" cy="21" r="1.5" fill="#94A3B8" />
    <circle cx="16" cy="21" r="2" fill="#39E3D7" />
    <circle cx="23" cy="21" r="1.5" fill="#94A3B8" />
  </svg>
);

// 10. Flaticon Chart / Financial Analytics
export const FlatIconChart: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Background Plate */}
    <rect x="3" y="3" width="26" height="26" rx="4" fill="#131626" stroke="#232742" strokeWidth="1.2" />
    {/* Bars */}
    <rect x="7" y="17" width="3.5" height="8" rx="1" fill="#716DF7" />
    <rect x="12.5" y="12" width="3.5" height="13" rx="1" fill="#3632C7" />
    <rect x="18" y="8" width="3.5" height="17" rx="1" fill="#39E3D7" />
    <rect x="23.5" y="14" width="3.5" height="11" rx="1" fill="#F59E0B" />
    {/* Trend Line with Indicator */}
    <path d="M8 15L14 10L20 6L25 11" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="20" cy="6" r="1.8" fill="#39E3D7" stroke="#FFFFFF" strokeWidth="0.8" />
  </svg>
);

// 11. Flaticon Checkbook / Bank Check
export const FlatIconCheckBook: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Cheque Body */}
    <rect x="3" y="6" width="26" height="20" rx="3" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
    <rect x="3" y="6" width="6" height="20" rx="2" fill="#3632C7" />
    {/* Check lines */}
    <rect x="12" y="10" width="8" height="1.5" fill="#64748B" rx="0.5" />
    <rect x="22" y="10" width="5" height="1.5" fill="#39E3D7" rx="0.5" />
    <rect x="12" y="14" width="14" height="1.5" fill="#64748B" rx="0.5" />
    <rect x="12" y="18" width="10" height="1.5" fill="#64748B" rx="0.5" />
    {/* Signature Line */}
    <path d="M19 22C21 21 23 23 25 21" stroke="#3632C7" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
export const FlatIconCheckbook = FlatIconCheckBook;

// 12. Flaticon Approve / Success Checkmark
export const FlatIconApprove: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="16" cy="16" r="14" fill="#10B981" />
    <circle cx="16" cy="16" r="11" fill="#047857" />
    <path
      d="M10.5 16L14.5 20L21.5 12"
      stroke="#FFFFFF"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 13. Flaticon Refresh / Sync
export const FlatIconRefresh: React.FC<FlatIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    <path
      d="M26 16C26 21.5228 21.5228 26 16 26C11.5 26 7.7 23 6.4 19M6 16C6 10.4772 10.4772 6 16 6C20.5 6 24.3 9 25.6 13"
      stroke="#39E3D7"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    <path d="M26 8V14H20" stroke="#3632C7" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 24V18H12" stroke="#3632C7" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
