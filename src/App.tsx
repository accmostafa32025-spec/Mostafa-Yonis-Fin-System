import React, { useState, useEffect } from 'react';
import {
  INITIAL_ACCOUNTS,
  INITIAL_COST_CENTERS,
  INITIAL_MEMBERS,
  INITIAL_SUPPLIERS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_BUDGETS,
  INITIAL_SETTINGS,
  INITIAL_CHECKS,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
  INITIAL_SAVINGS_RECORDS,
} from './data/initialData';
import {
  Account,
  CostCenter,
  Member,
  Supplier,
  BankAccount,
  JournalEntry,
  BudgetLine,
  SystemSettings,
  CheckTransaction,
  AuditLog,
  SheetKey,
  CheckStatus,
  ScheduledReviewTask,
  MonthlySavingsRecord,
  User,
} from './types/accounting';
import { INITIAL_SCHEDULED_TASKS } from './services/alertScheduleEngine';
import { Header } from './components/Header';
import { SheetNav } from './components/SheetNav';
import { HomeView } from './components/views/HomeView';
import { ChartOfAccountsView } from './components/views/ChartOfAccountsView';
import { CostCentersView } from './components/views/CostCentersView';
import { MembersAndSuppliersView } from './components/views/MembersAndSuppliersView';
import { EntryVoucherFormView } from './components/views/EntryVoucherFormView';
import { JournalEntriesView } from './components/views/JournalEntriesView';
import { ReceiptsAndPaymentsView } from './components/views/ReceiptsAndPaymentsView';
import { TreasuryAndBanksView } from './components/views/TreasuryAndBanksView';
import { ChecksLifecycleView } from './components/views/ChecksLifecycleView';
import { MembersSavingsAndTaxView } from './components/views/MembersSavingsAndTaxView';
import { SavingsUploadView } from './components/views/SavingsUploadView';
import { LedgersAndTrialBalancesView } from './components/views/LedgersAndTrialBalancesView';
import { BudgetAndVarianceView } from './components/views/BudgetAndVarianceView';
import { FinancialStatementsView } from './components/views/FinancialStatementsView';
import { AuditControlsView } from './components/views/AuditControlsView';
import { ExecutiveDashboardView } from './components/views/ExecutiveDashboardView';
import { SettingsAndAuditLogView } from './components/views/SettingsAndAuditLogView';
import { TechnicalAuditModal } from './components/common/TechnicalAuditModal';
import { DesignerBadge } from './components/common/DesignerBadge';
import { exportToExcel } from './services/excelExporter';
import { calculateTrialBalanceBalances, calculateBalanceSheet } from './services/accountingEngine';
import { runSystemComprehensiveAudit } from './services/validationEngine';
import {
  fetchSavingsFromFirestore,
  saveSavingsUploadToFirestore,
  testConnection,
  logAuditToFirestore,
} from './services/firestoreDataService';

export default function App() {
  // Master Accounting State
  const [activeSheet, setActiveSheet] = useState<SheetKey>('home');
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(INITIAL_COST_CENTERS);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);
  const [budgets, setBudgets] = useState<BudgetLine[]>(INITIAL_BUDGETS);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [checks, setChecks] = useState<CheckTransaction[]>(INITIAL_CHECKS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledReviewTask[]>(INITIAL_SCHEDULED_TASKS);
  const [savingsRecords, setSavingsRecords] = useState<MonthlySavingsRecord[]>(INITIAL_SAVINGS_RECORDS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isTechnicalAuditModalOpen, setIsTechnicalAuditModalOpen] = useState<boolean>(false);

  // Editing entry state (for editing existing vouchers)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Synchronize Firestore connection and data on launch
  useEffect(() => {
    testConnection().then(async (connected) => {
      setIsFirebaseConnected(connected);
      if (connected) {
        const remoteSavings = await fetchSavingsFromFirestore();
        if (remoteSavings && remoteSavings.length > 0) {
          setSavingsRecords(remoteSavings);
        }
      }
    });
  }, []);

  const handleSaveSavingsRecords = (updatedRecords: MonthlySavingsRecord[]) => {
    setSavingsRecords(updatedRecords);
    saveSavingsUploadToFirestore(updatedRecords);
    logAction('create', `تم تحديث وحفظ شيت استقطاعات ومدخرات الأعضاء (${updatedRecords.length} سجل)`);
  };

  // Accounting Checks & Balances Status
  const tb = calculateTrialBalanceBalances(accounts, entries);
  const bs = calculateBalanceSheet(accounts, entries);
  const auditResults = runSystemComprehensiveAudit(
    entries,
    accounts,
    costCenters,
    checks,
    settings,
    tb.totalClosingDr - tb.totalClosingCr,
    bs.difference
  );

  const errorCount = auditResults.filter((r) => r.status === 'error').length;
  const warningCount = auditResults.filter((r) => r.status === 'warning').length;
  const isSystemBalanced = tb.isBalanced && bs.isBalanced && errorCount === 0;

  // Handlers
  const handleSaveEntry = (newEntry: JournalEntry) => {
    // If updating existing
    if (editingEntry) {
      setEntries((prev) => prev.map((e) => (e.id === newEntry.id ? newEntry : e)));
      setEditingEntry(null);
      logAction('edit', `تم تعديل القيد رقم ${newEntry.entryNo} بنجاح`);
    } else {
      setEntries((prev) => [newEntry, ...prev]);
      logAction('create', `تم إنشاء القيد رقم ${newEntry.entryNo} بمبلغ ${newEntry.totalDebit} ج.م`);
    }
    setActiveSheet('journal_entries');
  };

  const handleApproveEntry = (entryId: string, overrideReason?: string, authorizedBy?: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              status: 'approved',
              approvedBy: authorizedBy || 'أ.د. إبراهيم عبد الرحمن (المدير المالي CFO)',
              cfoOverride: overrideReason ? true : e.cfoOverride,
              cfoOverrideBy: authorizedBy || e.cfoOverrideBy,
              cfoOverrideReason: overrideReason || e.cfoOverrideReason,
              cfoOverrideTimestamp: overrideReason ? new Date().toISOString() : e.cfoOverrideTimestamp,
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : e
      )
    );
    if (overrideReason) {
      logAction(
        'approve',
        `تم اعتماد وترحيل القيد رقم ${entryId} بتجاوز ومصادقة المدير المالي: ${overrideReason}`
      );
    } else {
      logAction('approve', `تم اعتماد وترحيل القيد رقم ${entryId}`);
    }
  };

  const handleReverseEntry = (entryId: string, reason: string) => {
    const orig = entries.find((e) => e.id === entryId);
    if (!orig) return;

    // Create an opposite reversal entry
    const maxNo = entries.reduce((max, e) => {
      const n = parseInt(e.entryNo.replace(/\D/g, ''), 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);

    const reversalEntry: JournalEntry = {
      id: `rev-${Date.now()}`,
      entryNo: `REV-2026-${String(maxNo + 1).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      entryType: 'reversal',
      documentNo: `عكس-${orig.entryNo}`,
      documentType: 'settlement',
      description: `قيد عكسي للقيد رقم (${orig.entryNo}) - سبب العكس: ${reason}`,
      status: 'approved',
      fiscalYear: settings.fiscalYear,
      period: `${settings.fiscalYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      totalDebit: orig.totalDebit,
      totalCredit: orig.totalCredit,
      createdBy: 'رئيس الحسابات',
      approvedBy: 'المدير المالي CFO',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lines: orig.lines.map((line, idx) => ({
        ...line,
        id: `rev-line-${idx}-${Date.now()}`,
        debit: line.credit, // Invert
        credit: line.debit,
        notes: `عكس السطر للقيد ${orig.entryNo}`,
      })),
    };

    setEntries((prev) => [reversalEntry, ...prev]);
    logAction('reverse', `تم إنشاء قيد عكسي للقيد ${orig.entryNo}`);
  };

  const handleAddAccount = (acc: Account) => {
    setAccounts((prev) => [...prev, acc]);
    logAction('edit', `إضافة حساب جديد: [${acc.code}] ${acc.name}`);
  };

  const handleAddCostCenter = (cc: CostCenter) => {
    setCostCenters((prev) => [...prev, cc]);
    logAction('edit', `إضافة مركز تكلفة جديد: [${cc.code}] ${cc.name}`);
  };

  const handleAddMember = (mem: Member) => {
    setMembers((prev) => [...prev, mem]);
    logAction('create', `تسجيل عضو جديد: [${mem.memberNo}] ${mem.name}`);
  };

  const handleAddSupplier = (sup: Supplier) => {
    setSuppliers((prev) => [...prev, sup]);
    logAction('create', `إضافة مورد جديد: [${sup.code}] ${sup.name}`);
  };

  const handleAddNewCheck = (chk: CheckTransaction) => {
    setChecks((prev) => [chk, ...prev]);
    logAction('create', `تسجيل شيك رقم ${chk.checkNumber} بمبلغ ${chk.amount} ج.م`);
  };

  const handleUpdateCheckStatus = (checkId: string, newStatus: CheckStatus, notes?: string) => {
    setChecks((prev) =>
      prev.map((c) =>
        c.id === checkId
          ? {
              ...c,
              status: newStatus,
              statusDate: new Date().toISOString().split('T')[0],
              notes: notes || c.notes,
            }
          : c
      )
    );
    logAction('edit', `تحديث حالة الشيك ${checkId} إلى: ${newStatus}`);
  };

  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    logAction('edit', 'تم تحديث سياسات وإعدادات الجمعية بنجاح');
  };

  const handleAddTask = (task: ScheduledReviewTask) => {
    setScheduledTasks((prev) => [task, ...prev]);
    logAction('create', `إضافة مهمة مراجعة دورية مجدولة: ${task.title}`);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setScheduledTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
            completedBy: nextStatus === 'completed' ? 'المدير المالي (CFO)' : undefined,
          };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setScheduledTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleUpdateLockDate = (newDate: string) => {
    setSettings((prev) => ({
      ...prev,
      lockDate: newDate,
    }));
    logAction('lock_period', `تعديل موعد إغلاق الفترة المالية إلى ${newDate}`);
  };

  const logAction = (action: AuditLog['action'], details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: 'usr-1',
      userName: 'أ.د. إبراهيم عبد الرحمن',
      userRole: 'المدير المالي (CFO)',
      action,
      targetDocType: 'journal_entry',
      targetDocId: 'JV-SYS',
      afterValue: details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    logAuditToFirestore(newLog);
  };

  // Full 35-Sheet Excel Export Handler
  const handleExportExcel = () => {
    exportToExcel(
      accounts,
      costCenters,
      members,
      suppliers,
      bankAccounts,
      entries,
      budgets,
      settings,
      checks,
      INITIAL_USERS,
      auditLogs
    );
    logAction('export', 'تم تصدير المصنف المالي الكامل (35 شيت) بصيغة Excel 365 المتوافقة');
  };

  return (
    <div className="min-h-screen bg-[#0B0D17] text-[#F1F3FF] flex flex-col font-sans selection:bg-[#3632c7] selection:text-white" dir="rtl">
      {/* Executive Header */}
      <Header
        activeSheet={activeSheet}
        settings={settings}
        entriesCount={entries.length}
        isBalanced={isSystemBalanced}
        errorCount={errorCount}
        warningCount={warningCount}
        onRunTechnicalAudit={() => setIsTechnicalAuditModalOpen(true)}
        onOpenAudit={() => setIsTechnicalAuditModalOpen(true)}
        onNewVoucher={() => {
          setEditingEntry(null);
          setActiveSheet('entry_voucher_form');
        }}
        onExportExcel={handleExportExcel}
      />

      {/* 35-Sheet Dynamic Navigation Bar */}
      <SheetNav activeSheet={activeSheet} onSelectSheet={(sheet) => setActiveSheet(sheet)} />

      {/* Main Content Workspace */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1600px] w-full mx-auto">
        {activeSheet === 'home' && (
          <HomeView
            settings={settings}
            accounts={accounts}
            costCenters={costCenters}
            members={members}
            entries={entries}
            checks={checks}
            scheduledTasks={scheduledTasks}
            onNavigate={(key) => setActiveSheet(key)}
            onOpenNewVoucher={() => {
              setEditingEntry(null);
              setActiveSheet('entry_voucher_form');
            }}
            onExportFullExcel={handleExportExcel}
            onOpenTechnicalAudit={() => setIsTechnicalAuditModalOpen(true)}
          />
        )}

        {activeSheet === 'chart_of_accounts' && (
          <ChartOfAccountsView
            accounts={accounts}
            onAddAccount={handleAddAccount}
          />
        )}

        {activeSheet === 'cost_centers' && (
          <CostCentersView
            costCenters={costCenters}
            entries={entries}
            currencySymbol={settings.currencySymbol}
            onAddCostCenter={handleAddCostCenter}
          />
        )}

        {activeSheet === 'members' && (
          <MembersAndSuppliersView
            mode="members"
            members={members}
            suppliers={suppliers}
            currencySymbol={settings.currencySymbol}
            onAddMember={handleAddMember}
            onAddSupplier={handleAddSupplier}
          />
        )}

        {activeSheet === 'suppliers' && (
          <MembersAndSuppliersView
            mode="suppliers"
            members={members}
            suppliers={suppliers}
            currencySymbol={settings.currencySymbol}
            onAddMember={handleAddMember}
            onAddSupplier={handleAddSupplier}
          />
        )}

        {activeSheet === 'entry_voucher_form' && (
          <EntryVoucherFormView
            accounts={accounts}
            costCenters={costCenters}
            members={members}
            suppliers={suppliers}
            currentUser={INITIAL_USERS[0]}
            settings={settings}
            existingEntries={entries}
            editingEntry={editingEntry}
            users={users}
            onSaveEntry={handleSaveEntry}
            onCancel={() => setActiveSheet('journal_entries')}
          />
        )}

        {activeSheet === 'journal_entries' && (
          <JournalEntriesView
            entries={entries}
            currentUser={INITIAL_USERS[0]}
            settings={settings}
            accounts={accounts}
            users={users}
            onNewVoucher={() => {
              setEditingEntry(null);
              setActiveSheet('entry_voucher_form');
            }}
            onEditEntry={(entry) => {
              setEditingEntry(entry);
              setActiveSheet('entry_voucher_form');
            }}
            onApproveEntry={handleApproveEntry}
            onReverseEntry={handleReverseEntry}
          />
        )}

        {activeSheet === 'receipts' && (
          <ReceiptsAndPaymentsView
            mode="receipts"
            entries={entries}
            settings={settings}
            onNewVoucher={() => {
              setEditingEntry(null);
              setActiveSheet('entry_voucher_form');
            }}
          />
        )}

        {activeSheet === 'payments' && (
          <ReceiptsAndPaymentsView
            mode="payments"
            entries={entries}
            settings={settings}
            onNewVoucher={() => {
              setEditingEntry(null);
              setActiveSheet('entry_voucher_form');
            }}
          />
        )}

        {activeSheet === 'treasury_cash' && (
          <TreasuryAndBanksView
            mode="treasury"
            bankAccounts={bankAccounts}
            entries={entries}
            settings={settings}
            onNavigate={(s) => setActiveSheet(s as any)}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeSheet === 'banks' && (
          <TreasuryAndBanksView
            mode="banks"
            bankAccounts={bankAccounts}
            entries={entries}
            settings={settings}
            onNavigate={(s) => setActiveSheet(s as any)}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeSheet === 'bank_reconciliation' && (
          <TreasuryAndBanksView
            mode="bank_reconciliation"
            bankAccounts={bankAccounts}
            entries={entries}
            settings={settings}
            onNavigate={(s) => setActiveSheet(s as any)}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeSheet === 'checks_issued' && (
          <ChecksLifecycleView
            initialMode="issued"
            checks={checks}
            settings={settings}
            onUpdateCheckStatus={handleUpdateCheckStatus}
            onAddNewCheck={handleAddNewCheck}
          />
        )}

        {activeSheet === 'checks_received' && (
          <ChecksLifecycleView
            initialMode="received"
            checks={checks}
            settings={settings}
            onUpdateCheckStatus={handleUpdateCheckStatus}
            onAddNewCheck={handleAddNewCheck}
          />
        )}

        {activeSheet === 'checks_collection' && (
          <ChecksLifecycleView
            initialMode="collection"
            checks={checks}
            settings={settings}
            onUpdateCheckStatus={handleUpdateCheckStatus}
            onAddNewCheck={handleAddNewCheck}
          />
        )}

        {activeSheet === 'members_savings' && (
          <MembersSavingsAndTaxView
            mode="savings"
            members={members}
            suppliers={suppliers}
            entries={entries}
            settings={settings}
          />
        )}

        {activeSheet === 'savings_upload' && (
          <SavingsUploadView
            records={savingsRecords}
            onSaveRecords={handleSaveSavingsRecords}
            settings={settings}
            isFirebaseConnected={isFirebaseConnected}
          />
        )}

        {activeSheet === 'withholding_tax' && (
          <MembersSavingsAndTaxView
            mode="tax"
            members={members}
            suppliers={suppliers}
            entries={entries}
            settings={settings}
          />
        )}

        {activeSheet === 'general_ledger' && (
          <LedgersAndTrialBalancesView
            mode="general_ledger"
            accounts={accounts}
            costCenters={costCenters}
            members={members}
            suppliers={suppliers}
            entries={entries}
            budgets={budgets}
            settings={settings}
          />
        )}

        {activeSheet === 'subsidiary_ledger' && (
          <LedgersAndTrialBalancesView
            mode="subsidiary_ledger"
            accounts={accounts}
            costCenters={costCenters}
            members={members}
            suppliers={suppliers}
            entries={entries}
            budgets={budgets}
            settings={settings}
          />
        )}

        {activeSheet === 'trial_balance_totals' && (
          <LedgersAndTrialBalancesView
            mode="trial_totals"
            accounts={accounts}
            costCenters={costCenters}
            members={members}
            suppliers={suppliers}
            entries={entries}
            budgets={budgets}
            settings={settings}
          />
        )}

        {activeSheet === 'trial_balance_balances' && (
          <LedgersAndTrialBalancesView
            mode="trial_balances"
            accounts={accounts}
            costCenters={costCenters}
            members={members}
            suppliers={suppliers}
            entries={entries}
            budgets={budgets}
            settings={settings}
          />
        )}

        {activeSheet === 'monthly_review' && (
          <LedgersAndTrialBalancesView
            mode="monthly_review"
            accounts={accounts}
            costCenters={costCenters}
            members={members}
            suppliers={suppliers}
            entries={entries}
            budgets={budgets}
            settings={settings}
          />
        )}

        {activeSheet === 'budget' && (
          <BudgetAndVarianceView
            mode="budget"
            budgets={budgets}
            accounts={accounts}
            entries={entries}
            settings={settings}
          />
        )}

        {activeSheet === 'variance_analysis' && (
          <BudgetAndVarianceView
            mode="variance"
            budgets={budgets}
            accounts={accounts}
            entries={entries}
            settings={settings}
          />
        )}

        {activeSheet === 'income_statement' && (
          <FinancialStatementsView
            mode="income"
            accounts={accounts}
            entries={entries}
            costCenters={costCenters}
            settings={settings}
          />
        )}

        {activeSheet === 'balance_sheet' && (
          <FinancialStatementsView
            mode="balance_sheet"
            accounts={accounts}
            entries={entries}
            costCenters={costCenters}
            settings={settings}
          />
        )}

        {activeSheet === 'cash_flow' && (
          <FinancialStatementsView
            mode="cash_flow"
            accounts={accounts}
            entries={entries}
            costCenters={costCenters}
            settings={settings}
          />
        )}

        {activeSheet === 'equity_changes' && (
          <FinancialStatementsView
            mode="equity"
            accounts={accounts}
            entries={entries}
            costCenters={costCenters}
            settings={settings}
          />
        )}

        {activeSheet === 'financial_notes' && (
          <FinancialStatementsView
            mode="notes"
            accounts={accounts}
            entries={entries}
            costCenters={costCenters}
            settings={settings}
          />
        )}

        {activeSheet === 'audit_controls' && (
          <AuditControlsView
            entries={entries}
            accounts={accounts}
            costCenters={costCenters}
            checks={checks}
            settings={settings}
            onNavigate={(key) => setActiveSheet(key)}
            onOpenTechnicalAudit={() => setIsTechnicalAuditModalOpen(true)}
          />
        )}

        {activeSheet === 'executive_dashboard' && (
          <ExecutiveDashboardView
            settings={settings}
            entries={entries}
            accounts={accounts}
            costCenters={costCenters}
            members={members}
            bankAccounts={bankAccounts}
            checks={checks}
            budgets={budgets}
            scheduledTasks={scheduledTasks}
            savingsRecords={savingsRecords}
            onNavigate={(key) => setActiveSheet(key)}
            onApproveEntry={handleApproveEntry}
            onEditEntry={(entry) => {
              setEditingEntry(entry);
              setActiveSheet('entry_voucher_form');
            }}
            onAddTask={handleAddTask}
            onToggleTaskStatus={handleToggleTaskStatus}
            onDeleteTask={handleDeleteTask}
            onUpdateLockDate={handleUpdateLockDate}
          />
        )}

        {activeSheet === 'audit_trail' && (
          <SettingsAndAuditLogView
            mode="audit_log"
            settings={settings}
            auditLogs={auditLogs}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {(activeSheet === 'settings' || activeSheet === 'users' || activeSheet === 'user_guide') && (
          <SettingsAndAuditLogView
            mode="settings"
            settings={settings}
            auditLogs={auditLogs}
            onUpdateSettings={handleUpdateSettings}
            onAddJournalEntry={(entry) => {
              setEntries((prev) => [entry, ...prev]);
              logAction('create', `تم إنشاء وإدراج القيد رقم ${entry.entryNo}`);
            }}
            users={users}
          />
        )}
      </main>

      {/* System Status Footer with Centered Designer Badge */}
      <footer className="border-t border-slate-900 bg-[#0B0D17]/95 backdrop-blur-md px-4 py-2.5 text-slate-400 text-[11px] flex flex-col md:flex-row items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2 order-1 md:order-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>النظام المحاسبي والرقابي - جمعية تيسير الحج والعمرة بالجهاز المركزي للمحاسبات (Excel 365 Core)</span>
        </div>

        {/* Centered Designer Badge on all pages */}
        <div className="order-3 md:order-2 my-1 md:my-0 flex justify-center">
          <DesignerBadge />
        </div>

        <div className="flex items-center gap-4 font-mono-num text-[10px] order-2 md:order-3 text-slate-500">
          <span>إصدار النظام: v365.4.2</span>
          <span>شيتات العمل: 35 شيت معتمد</span>
          <span>التشفير والرقابة: نشط 100%</span>
        </div>
      </footer>

      {/* Comprehensive Technical Audit Modal */}
      <TechnicalAuditModal
        isOpen={isTechnicalAuditModalOpen}
        onClose={() => setIsTechnicalAuditModalOpen(false)}
        entries={entries}
        accounts={accounts}
        costCenters={costCenters}
        checks={checks}
        bankAccounts={bankAccounts}
        budgets={budgets}
        settings={settings}
        onNavigate={(sheet) => setActiveSheet(sheet)}
      />
    </div>
  );
}
