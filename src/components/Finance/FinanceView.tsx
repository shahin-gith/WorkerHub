import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Send,
  TrendingUp,
  TrendingDown,
  Trash2,
  FileSpreadsheet,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Wallet,
  Landmark,
  PiggyBank,
  Smartphone,
  Filter,
} from 'lucide-react';
import {
  FinanceTransaction,
  MoneyAccount,
  MoneyAccountType,
  SavingsGoal,
  FinanceCategory,
  Language,
} from '../../types';
import { getTranslation } from '../../services/i18n';

interface FinanceViewProps {
  language: Language;
  transactions: FinanceTransaction[];
  moneyAccounts: MoneyAccount[];
  savingsGoal: SavingsGoal;
  onSaveTransaction: (tx: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSaveMoneyAccounts: (accounts: MoneyAccount[]) => void;
  onUpdateSavingsGoal: (goal: SavingsGoal) => void;
}

const ACCOUNT_TYPE_META: Record<
  MoneyAccountType,
  { label: string; colorClass: string; Icon: React.FC<{ className?: string }> }
> = {
  cash: {
    label: 'Cash',
    colorClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    Icon: Wallet,
  },
  bank: {
    label: 'Bank',
    colorClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    Icon: Landmark,
  },
  savings: {
    label: 'Savings',
    colorClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    Icon: PiggyBank,
  },
  mobile_wallet: {
    label: 'Mobile Wallet',
    colorClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    Icon: Smartphone,
  },
};

export const FinanceView: React.FC<FinanceViewProps> = ({
  language,
  transactions,
  moneyAccounts,
  savingsGoal,
  onSaveTransaction,
  onDeleteTransaction,
  onSaveMoneyAccounts,
  onUpdateSavingsGoal,
}) => {
  const t = getTranslation(language);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');

  const defaultAccountId = moneyAccounts[0]?.id || 'acc-cash';

  // Form State for new transaction
  const [formData, setFormData] = useState<{
    type: 'income' | 'expense' | 'remittance';
    category: FinanceCategory;
    accountId: string;
    amountSgd: string;
    amountForeign: string;
    foreignCurrency: string;
    exchangeRate: string;
    date: string;
    notes: string;
  }>({
    type: 'expense',
    category: 'food',
    accountId: defaultAccountId,
    amountSgd: '',
    amountForeign: '',
    foreignCurrency: 'BDT',
    exchangeRate: '91.0',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Form state for new Money Source Account
  const [accountForm, setAccountForm] = useState<{
    name: string;
    type: MoneyAccountType;
    initialBalance: string;
  }>({
    name: '',
    type: 'bank',
    initialBalance: '0',
  });

  // Compute live balance per Money Source Account (all-time)
  const accountBalances = useMemo(() => {
    const map: Record<string, number> = {};
    moneyAccounts.forEach((acc) => {
      map[acc.id] = Number(acc.initialBalance) || 0;
    });

    transactions.forEach((tx) => {
      const targetId =
        tx.accountId && map[tx.accountId] !== undefined ? tx.accountId : defaultAccountId;
      if (map[targetId] === undefined) return;
      if (tx.type === 'income') {
        map[targetId] += tx.amountSgd;
      } else {
        map[targetId] -= tx.amountSgd;
      }
    });

    return map;
  }, [moneyAccounts, transactions, defaultAccountId]);

  const totalCombinedBalance = useMemo(() => {
    return Object.values(accountBalances).reduce((sum, val) => sum + val, 0);
  }, [accountBalances]);

  // Calculate monthly summaries
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(currentMonthPrefix));
  }, [transactions, currentMonthPrefix]);

  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((acc, tx) => acc + tx.amountSgd, 0);
  }, [monthTransactions]);

  const totalExpenses = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amountSgd, 0);
  }, [monthTransactions]);

  const totalRemittances = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === 'remittance')
      .reduce((acc, tx) => acc + tx.amountSgd, 0);
  }, [monthTransactions]);

  const visibleTransactions = useMemo(() => {
    const list =
      selectedAccountFilter === 'all'
        ? transactions
        : transactions.filter((tx) => (tx.accountId || defaultAccountId) === selectedAccountFilter);
    return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [transactions, selectedAccountFilter, defaultAccountId]);

  // Remittance auto-calculator in form
  const handleSgdAmountChange = (val: string) => {
    const sgd = parseFloat(val);
    const rate = parseFloat(formData.exchangeRate);
    if (!isNaN(sgd) && !isNaN(rate) && formData.type === 'remittance') {
      setFormData((prev) => ({
        ...prev,
        amountSgd: val,
        amountForeign: Math.round(sgd * rate).toString(),
      }));
    } else {
      setFormData((prev) => ({ ...prev, amountSgd: val }));
    }
  };

  const handleRateChange = (rateVal: string) => {
    const rate = parseFloat(rateVal);
    const sgd = parseFloat(formData.amountSgd);
    if (!isNaN(sgd) && !isNaN(rate) && formData.type === 'remittance') {
      setFormData((prev) => ({
        ...prev,
        exchangeRate: rateVal,
        amountForeign: Math.round(sgd * rate).toString(),
      }));
    } else {
      setFormData((prev) => ({ ...prev, exchangeRate: rateVal }));
    }
  };

  const openTransactionModal = () => {
    setFormData({
      type: 'expense',
      category: 'food',
      accountId: selectedAccountFilter !== 'all' ? selectedAccountFilter : defaultAccountId,
      amountSgd: '',
      amountForeign: '',
      foreignCurrency: 'BDT',
      exchangeRate: '91.0',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sgd = parseFloat(formData.amountSgd);
    if (isNaN(sgd) || sgd <= 0) return;

    const chosenAccount = moneyAccounts.find((a) => a.id === formData.accountId) || moneyAccounts[0];

    const newTx: FinanceTransaction = {
      id: `fin-${Date.now()}`,
      type: formData.type,
      category: formData.type === 'remittance' ? 'remittance' : formData.category,
      accountId: chosenAccount?.id || 'acc-cash',
      accountName: chosenAccount?.name || 'Cash Wallet',
      amountSgd: sgd,
      amountForeign:
        formData.type === 'remittance' ? parseFloat(formData.amountForeign) || undefined : undefined,
      foreignCurrency: formData.type === 'remittance' ? formData.foreignCurrency : undefined,
      exchangeRate:
        formData.type === 'remittance' ? parseFloat(formData.exchangeRate) || undefined : undefined,
      date: formData.date,
      notes: formData.notes.trim(),
      createdAt: Date.now(),
    };

    onSaveTransaction(newTx);
    setIsModalOpen(false);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name.trim()) return;
    const newAccount: MoneyAccount = {
      id: `acc-${Date.now()}`,
      name: accountForm.name.trim(),
      type: accountForm.type,
      initialBalance: parseFloat(accountForm.initialBalance) || 0,
      createdAt: Date.now(),
    };
    onSaveMoneyAccounts([...moneyAccounts, newAccount]);
    setAccountForm({ name: '', type: 'bank', initialBalance: '0' });
    setIsAccountModalOpen(false);
  };

  const handleDeleteAccount = (id: string) => {
    if (moneyAccounts.length <= 1) return;
    const updated = moneyAccounts.filter((a) => a.id !== id);
    onSaveMoneyAccounts(updated);
    if (selectedAccountFilter === id) {
      setSelectedAccountFilter('all');
    }
  };

  const exportFinanceCSV = () => {
    const headers = [
      'Date',
      'Account',
      'Type',
      'Category',
      'Amount SGD',
      'Foreign Amount',
      'Currency',
      'Exchange Rate',
      'Notes',
    ];
    const rows = transactions.map((tx) => {
      const accName =
        tx.accountName ||
        moneyAccounts.find((a) => a.id === tx.accountId)?.name ||
        'Cash Wallet';
      return [
        `"${tx.date}"`,
        `"${accName.replace(/"/g, '""')}"`,
        `"${tx.type}"`,
        `"${tx.category}"`,
        tx.amountSgd,
        tx.amountForeign || '',
        `"${tx.foreignCurrency || ''}"`,
        tx.exchangeRate || '',
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WorkerHub_Finance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const savingsPercent = Math.min(
    100,
    Math.round((savingsGoal.currentSgd / Math.max(1, savingsGoal.targetSgd)) * 100)
  );

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto px-3 sm:px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-500 shrink-0" />
            {t.financeTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.financeSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportFinanceCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Money Source</span>
          </button>

          <button
            onClick={openTransactionModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addTransaction}</span>
          </button>
        </div>
      </div>

      {/* Money Source Accounts (Cash, Bank, Savings, Mobile Wallet) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-amber-500" />
            <span>Money Source Accounts</span>
          </h2>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">
            Total Balance: ${totalCombinedBalance.toFixed(2)} SGD
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {moneyAccounts.map((acc) => {
            const meta = ACCOUNT_TYPE_META[acc.type] || ACCOUNT_TYPE_META.cash;
            const IconComp = meta.Icon;
            const bal = accountBalances[acc.id] ?? 0;
            const isSelected = selectedAccountFilter === acc.id;

            return (
              <div
                key={acc.id}
                onClick={() =>
                  setSelectedAccountFilter(isSelected ? 'all' : acc.id)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedAccountFilter(isSelected ? 'all' : acc.id);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${meta.colorClass}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {acc.name}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {meta.label}
                      </div>
                    </div>
                  </div>

                  {moneyAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(acc.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 rounded"
                      title="Remove account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span
                    className={`text-lg sm:text-xl font-extrabold tabular-nums ${
                      bal >= 0
                        ? 'text-slate-900 dark:text-white'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    ${bal.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isSelected ? 'Filtered · Tap to show all' : 'Tap to filter'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Income (Month)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
            ${totalIncome.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Salary / OT</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Expenses</span>
            <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-red-600 dark:text-red-400 mt-2">
            ${totalExpenses.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Food, SIM, Transit</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Remitted</span>
            <Send className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400 mt-2">
            ${totalRemittances.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sent Home</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Net Month</span>
            <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold tabular-nums mt-2 ${
              totalIncome - totalExpenses - totalRemittances >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-red-600'
            }`}
          >
            ${(totalIncome - totalExpenses - totalRemittances).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Monthly cashflow</div>
        </div>
      </div>

      {/* Savings Goal Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {savingsGoal.title}
            </h2>
          </div>
          <button
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
          >
            {isEditingGoal ? 'Close' : 'Edit Goal'}
          </button>
        </div>

        {isEditingGoal && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <input
              type="text"
              placeholder="Goal Title"
              value={savingsGoal.title}
              onChange={(e) => onUpdateSavingsGoal({ ...savingsGoal, title: e.target.value })}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <input
              type="number"
              placeholder="Target SGD"
              value={savingsGoal.targetSgd}
              onChange={(e) =>
                onUpdateSavingsGoal({ ...savingsGoal, targetSgd: Number(e.target.value) || 0 })
              }
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <input
              type="number"
              placeholder="Saved so far SGD"
              value={savingsGoal.currentSgd}
              onChange={(e) =>
                onUpdateSavingsGoal({ ...savingsGoal, currentSgd: Number(e.target.value) || 0 })
              }
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            <span>Saved: ${savingsGoal.currentSgd.toFixed(2)} SGD</span>
            <span className="text-amber-600 dark:text-amber-400">
              {savingsPercent}% of ${savingsGoal.targetSgd.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${savingsPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Transaction History List */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Transactions & Remittances
          </h3>

          {selectedAccountFilter !== 'all' && (
            <button
              onClick={() => setSelectedAccountFilter('all')}
              className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Filter className="w-3 h-3" />
              <span>Showing: {moneyAccounts.find((a) => a.id === selectedAccountFilter)?.name} (Show All)</span>
            </button>
          )}
        </div>

        {visibleTransactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500">No transactions recorded for this selection yet.</p>
          </div>
        ) : (
          visibleTransactions.map((tx) => {
            const accName =
              tx.accountName ||
              moneyAccounts.find((a) => a.id === (tx.accountId || defaultAccountId))?.name ||
              'Cash Wallet';

            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-amber-400 dark:hover:border-amber-600/50 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                        : tx.type === 'remittance'
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                        : 'bg-red-50 dark:bg-red-950 text-red-600'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : tx.type === 'remittance' ? (
                      <Send className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                        {tx.type === 'remittance' ? 'Family Remittance' : tx.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {accName}
                      </span>
                      <span className="text-[11px] text-slate-400">{tx.date}</span>
                    </div>
                    {tx.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                        {tx.notes}
                      </p>
                    )}
                    {tx.type === 'remittance' && tx.amountForeign && (
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                        ৳{tx.amountForeign.toLocaleString()} {tx.foreignCurrency || 'BDT'} (Rate: 1 SGD = {tx.exchangeRate})
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pl-11 sm:pl-0 shrink-0">
                  <div
                    className={`text-sm font-extrabold tabular-nums ${
                      tx.type === 'income'
                        ? 'text-emerald-600'
                        : tx.type === 'remittance'
                        ? 'text-blue-600'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}${tx.amountSgd.toFixed(2)} SGD
                  </div>
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                    title={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                {t.addTransaction}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type segmented control */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.transactionType}
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {(['income', 'expense', 'remittance'] as const).map((typ) => (
                    <button
                      key={typ}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: typ })}
                      className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                        formData.type === typ
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {typ === 'remittance' ? 'Remittance' : typ}
                    </button>
                  ))}
                </div>
              </div>

              {/* Money Source Account Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Money Source Account
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {moneyAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (${(accountBalances[acc.id] ?? 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount SGD & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.amountSGD} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="100.00"
                    value={formData.amountSgd}
                    onChange={(e) => handleSgdAmountChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.date}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Remittance Fields if type === 'remittance' */}
              {formData.type === 'remittance' ? (
                <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 dark:text-blue-200 mb-1">
                        {t.exchangeRateLabel}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.exchangeRate}
                        onChange={(e) => handleRateChange(e.target.value)}
                        placeholder="91.0"
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-950 dark:text-blue-200 mb-1">
                        {t.bdtEquivalent}
                      </label>
                      <input
                        type="number"
                        value={formData.amountForeign}
                        onChange={(e) => setFormData({ ...formData, amountForeign: e.target.value })}
                        placeholder="72800"
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-bold text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as FinanceCategory })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="salary">Salary / Wages</option>
                    <option value="overtime">Overtime Payout</option>
                    <option value="food">Mess Food & Groceries</option>
                    <option value="mobile_data">SIM Card & Mobile Data</option>
                    <option value="dormitory">Dormitory & Utilities</option>
                    <option value="transport">MRT / Bus Transport</option>
                    <option value="medical">Medical & Medicine</option>
                    <option value="other">Other Expenses</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Salary credited to POSB or Mess payment"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-sm"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Source Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-500" />
                Add Money Source Account
              </h2>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'cash', label: 'Cash Wallet' },
                      { id: 'bank', label: 'Bank Account' },
                      { id: 'savings', label: 'Savings Account' },
                      { id: 'mobile_wallet', label: 'Mobile Wallet / PayNow' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAccountForm({ ...accountForm, type: opt.id })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        accountForm.type === opt.id
                          ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OCBC Savings / bKash Bangladesh"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opening Balance (SGD)
                </label>
                <input
                  type="number"
                  step="any"
                  value={accountForm.initialBalance}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, initialBalance: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-sm"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
