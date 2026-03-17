import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApp, Transaction } from "@/context/AppContext";
import { api } from "@/api/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { DateTimePicker } from "@/components/ui/date-time-picker";

type TxType = "expense" | "income" | "transfer";
type DetailTab = "date" | "description" | "note";

const categories = {
  expense: ["Food & Dining", "Transport", "Shopping", "Entertainment", "Health", "Housing", "Other"],
  income: ["Salary", "Freelance", "Investment", "Gift", "Other"],
};

// Map categories to icons
const categoryIcons: Record<string, string> = {
  "Food & Dining": "utensils-crossed",
  "Transport": "car",
  "Shopping": "shopping-bag",
  "Entertainment": "film",
  "Health": "heart-pulse",
  "Housing": "home",
  "Salary": "briefcase",
  "Freelance": "laptop",
  "Investment": "trending-up",
  "Gift": "gift",
  "Transfer": "arrow-left-right",
  "Other": "circle-dot",
};

interface AddTransactionModalProps {
  onClose?: () => void;
  defaultType?: TxType;
  modalOpen?: boolean;
  openChange?: (open: boolean) => void;
  editTransaction?: Transaction | null;
}

function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function AddTransactionModal({
  onClose,
  defaultType,
  modalOpen,
  openChange,
  editTransaction,
}: AddTransactionModalProps) {
  const { t } = useTranslation();

  const isEditMode = !!editTransaction;

  const {
    accounts,
    setAccounts,
    transactions,
    setTransactions,
    exchangeRates,
    addTransaction,
    updateTransaction,
    workspace,
  } = useApp();

  const [txType, setTxType] = useState<TxType>(defaultType || editTransaction?.type || "expense");
  const [amount, setAmount] = useState(editTransaction?.amount?.toString() || "");
  const [toAmount, setToAmount] = useState(editTransaction?.toAmount?.toString() || "");
  const [category, setCategory] = useState(editTransaction?.category || "");
  const [description, setDescription] = useState(editTransaction?.description || "");
  const [fromAccountId, setFromAccountId] = useState<string>(editTransaction?.accountId ? String(editTransaction.accountId) : "");
  const [toAccountId, setToAccountId] = useState<string>(editTransaction?.toAccountId ? String(editTransaction.toAccountId) : "");
  const [date, setDate] = useState(
    formatLocalDateTime(new Date())
  );
  const [note, setNote] = useState(editTransaction?.note || "");
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("date");
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
    fromAccount?: string;
    toAccount?: string;
  }>({});

  // Функция сброса формы
  const resetForm = () => {
    setAmount("");
    setToAmount("");
    setCategory("");
    setDescription("");
    setNote("");
    setDate(formatLocalDateTime(new Date()));
    setActiveDetailTab("date");
    setErrors({});
    if (accounts.length > 0) {
      setFromAccountId(String(accounts[0].id));
      if (accounts.length > 1) {
        setToAccountId(String(accounts[1].id));
      }
    }
  };

  // Обновляем тип транзакции при изменении defaultType
  useEffect(() => {
    if (defaultType && !editTransaction) {
      setTxType(defaultType);
    }
  }, [defaultType, editTransaction]);

  // Сброс формы при закрытии модального окна
  useEffect(() => {
    if (modalOpen === false && !editTransaction) {
      resetForm();
    }
  }, [modalOpen, editTransaction]);

  // Устанавливаем значения по умолчанию при изменении editTransaction
  useEffect(() => {
    if (editTransaction) {
      // Режим редактирования - используем данные из editTransaction
      setTxType(editTransaction.type as TxType || 'expense');
      setAmount(editTransaction.amount?.toString() || '');
      setToAmount(editTransaction.toAmount?.toString() || '');
      setCategory(editTransaction.category || '');
      setDescription(editTransaction.description || '');
      setNote(editTransaction.note || '');
      setFromAccountId(String(editTransaction.accountId));
      if (editTransaction.toAccountId) {
        setToAccountId(String(editTransaction.toAccountId));
      }
      // Устанавливаем дату
      if (editTransaction.date) {
        const dateStr = editTransaction.date.length > 16 
          ? editTransaction.date.slice(0, 16) 
          : editTransaction.date;
        setDate(dateStr);
      }
    } else if (accounts.length > 0 && !fromAccountId) {
      // Режим создания - используем первый счёт
      setFromAccountId(String(accounts[0].id));
      // Устанавливаем второй счёт для перевода по умолчанию
      if (accounts.length > 1) {
        setToAccountId(String(accounts[1].id));
      }
    }
  }, [editTransaction, accounts]);

  // Устанавливаем счёт "To" при изменении счёта "From" для переводов
  useEffect(() => {
    if (txType === "transfer" && fromAccountId && accounts.length > 1) {
      // Находим счёт, который не равен fromAccountId
      const otherAccount = accounts.find(a => a.id !== fromAccountId);
      if (otherAccount && (!toAccountId || toAccountId === fromAccountId)) {
        setToAccountId(String(otherAccount.id));
      }
    }
  }, [txType, fromAccountId, accounts, toAccountId]);

  // Проверка при переводе - если только 1 счёт
  useEffect(() => {
    if (txType === "transfer" && accounts.length < 2) {
      // Показываем уведомление, но не сразу при монтировании
      if (amount || toAccountId) {
        toast({
          title: t("transactionForm.toasts.error.needTwoAccounts"),
          description: t("dashboard.toasts.needTwoAccounts"),
        });
      }
    }
  }, [txType, accounts.length, amount, toAccountId, t]);

  if (modalOpen === false) {
    return null;
  }

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const getExchangeRate = (from: string, to: string): number => {
    if (from === to) return 1;
    const rate = exchangeRates.find((r) => r.from === from && r.to === to);
    return rate?.rate || 1;
  };

  const formatRate = (rate: number): string => {
    if (rate >= 1000) {
      return rate.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else if (rate >= 1) {
      return rate.toFixed(4);
    } else {
      return rate.toFixed(6);
    }
  };

  const getCategoryLabel = (categoryKey: string) => {
    const map: Record<string, string> = {
      "Food & Dining": t("transactionForm.categories.foodDining"),
      "Transport": t("transactionForm.categories.transport"),
      "Shopping": t("transactionForm.categories.shopping"),
      "Entertainment": t("transactionForm.categories.entertainment"),
      "Health": t("transactionForm.categories.health"),
      "Housing": t("transactionForm.categories.housing"),
      "Salary": t("transactionForm.categories.salary"),
      "Freelance": t("transactionForm.categories.freelance"),
      "Investment": t("transactionForm.categories.investment"),
      "Gift": t("transactionForm.categories.gift"),
      "Transfer": t("transactionForm.categories.transfer"),
      "Other": t("transactionForm.categories.other"),
    };

    return map[categoryKey] || categoryKey;
  };

  const convertedAmount =
    txType === "transfer" && fromAccount && toAccount && amount
      ? parseFloat(amount) * getExchangeRate(fromAccount.currency, toAccount.currency)
      : null;

  const handleClose = () => {
    if (openChange) {
      openChange(false);
    } else if (onClose) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    // Валидация
    const newErrors: typeof errors = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = t("transactionForm.errors.enterAmount");
    }

    if (txType !== "transfer") {
      if (!category) {
        newErrors.category = t("transactionForm.errors.selectCategory");
      }
      if (!fromAccountId) {
        newErrors.fromAccount = t("transactionForm.errors.selectAccount");
      }
    } else {
      // Для перевода
      if (!fromAccountId) {
        newErrors.fromAccount = t("transactionForm.errors.selectFromAccount");
      }
      if (!toAccountId) {
        newErrors.toAccount = t("transactionForm.errors.selectToAccount");
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (txType === "transfer" && accounts.length < 2) {
      toast({
        title: t("transactionForm.toasts.error.needTwoAccounts"),
        description: t("dashboard.toasts.needTwoAccounts"),
      });
      return;
    }

    if (txType === "transfer" && accounts.length < 2) {
      // Валидация уже прошла выше
    }

    if (!amount || (!category && txType !== "transfer")) {
      // Валидация уже прошла выше
    }

    const amountNum = parseFloat(amount);
    let finalToAmount: number | undefined = undefined;

    if (txType === "transfer" && fromAccount && toAccount && amount) {
      if (fromAccount.currency !== toAccount.currency) {
        finalToAmount = toAmount
          ? parseFloat(toAmount)
          : amountNum * getExchangeRate(fromAccount.currency, toAccount.currency);
      } else {
        finalToAmount = amountNum;
      }
    }

    // If editing, update existing transaction instead of creating new one
    if (isEditMode && editTransaction) {
      // Обновляем транзакцию
      const updatedTx: Transaction = {
        ...editTransaction,
        type: txType,
        amount: amountNum,
        currency: fromAccount?.currency || "USD",
        category: txType === "transfer" ? "Transfer" : category,
        description: description || (txType === "transfer" ? `To ${toAccount?.name || ""}` : ""),
        accountId: fromAccountId,
        accountName: fromAccount?.name || "",
        ...(txType === "transfer"
          ? {
              toAccountId,
              toAccountName: toAccount?.name || "",
              toCurrency: toAccount?.currency,
              toAmount: finalToAmount,
            }
          : {}),
        date,
        icon:
          editTransaction?.icon ||
          (txType === "expense" ? "💸" : txType === "income" ? "💰" : "🔄"),
        note: note || undefined,
      };

      // Обновляем через API - сервер вернёт транзакцию с правильным балансом
      try {
        const savedTx = await api.transactions.updateTransaction(updatedTx.id, updatedTx);
        // Используем данные с сервера, преобразуя тип в нижний регистр
        const serverTx = {
          ...savedTx,
          type: (savedTx.type as string).toLowerCase() as Transaction["type"],
          id: String(savedTx.id),
          accountId: String(savedTx.accountId),
          toAccountId: savedTx.toAccountId ? String(savedTx.toAccountId) : undefined
        };
        
        // Обновляем список транзакций данными от сервера
        const updatedTransactions = transactions.map((t) =>
          t.id === editTransaction.id ? serverTx : t
        );
        setTransactions(updatedTransactions);
        
        // Обновляем счёта с сервера для получения актуального баланса
        const updatedAccounts = await api.accounts.getAllAccounts(workspace);
        setAccounts(updatedAccounts);

        toast({
          title: t("transactionForm.toasts.updated.title"),
          description: t("transactionForm.toasts.updated.description"),
        });
      } catch (error) {
        console.error("Error updating transaction:", error);
        toast({
          title: t("common.error"),
          description: t("transactionForm.toasts.error.updateFailed"),
          variant: "destructive",
        });
      }

      handleClose();
      if (onClose) onClose();
      return;
    }

    const tx: Omit<Transaction, "id"> = {
      type: txType.toUpperCase() as Transaction["type"],
      amount: amountNum,
      currency: fromAccount?.currency || "USD",
      category: txType === "transfer" ? "Transfer" : category,
      description: description || (txType === "transfer" ? `To ${toAccount?.name || ""}` : ""),
      accountId: fromAccountId,
      accountName: fromAccount?.name || "",
      ...(txType === "transfer"
        ? {
            toAccountId,
            toAccountName: toAccount?.name || "",
            toCurrency: toAccount?.currency,
            toAmount: finalToAmount,
          }
        : {}),
      date,
      icon:
        categoryIcons[txType === "transfer" ? "Transfer" : category] ||
        (txType === "expense" ? "💸" : txType === "income" ? "💰" : "🔄"),
      note: note || undefined,
    };

    const updateAccountBalances = () => {
      const newAccounts = accounts.map((account) => {
        if (account.id === fromAccountId) {
          if (txType === "expense" || txType === "transfer") {
            return { ...account, balance: account.balance - amountNum };
          }
        }

        if (txType === "transfer" && account.id === toAccountId) {
          return { ...account, balance: account.balance + (finalToAmount || amountNum) };
        }

        if (txType === "income" && account.id === fromAccountId) {
          return { ...account, balance: account.balance + amountNum };
        }

        return account;
      });

      setAccounts(newAccounts);
    };

    updateAccountBalances();

    // Сохраняем транзакцию через API
    try {
      const newTx = await addTransaction(tx);
      // Используем данные с сервера, но преобразуем тип обратно в нижний регистр
      const savedTx = {
        ...newTx,
        type: (newTx.type as string).toLowerCase() as Transaction["type"]
      };
      setTransactions([savedTx, ...transactions]);

      toast({
        title: t("transactionForm.toasts.created.title"),
        description: t("transactionForm.toasts.created.description"),
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      // Fallback: используем локальную транзакцию
      const localTx: Transaction = { ...tx, id: `tx-${Date.now()}` };
      setTransactions([localTx, ...transactions]);
      toast({
        title: t("common.error"),
        description: t("transactionForm.toasts.error.createFailed"),
        variant: "destructive",
      });
    }

    handleClose();
    if (onClose) onClose();
  };

  return (
    <Dialog
      open={modalOpen !== undefined ? modalOpen : true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">
            {isEditMode ? t("transactionForm.editTitle") : t("transactionForm.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Type */}
          <div className="flex rounded-2xl p-1 gap-1">
            {(["expense", "income", "transfer"] as TxType[]).map((tType) => (
              <button
                key={tType}
                type="button"
                onClick={() => setTxType(tType)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-colors shadow-sm ${
                  txType === tType ? "tab-active" : "tab-inactive"
                }`}
              >
                {t(`transactionForm.${tType}`)}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">
              {txType === "transfer"
                ? t("transactionForm.amountToSend")
                : t("transactionForm.amount")}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors({ ...errors, amount: undefined });
              }}
              placeholder={t("transactionForm.placeholders.amount")}
              className={`w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm ${errors.amount ? "border-red-500 border-2" : ""}`}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Category + Account Row for expense/income */}
          {txType !== "transfer" && (
            <div className="grid grid-cols-2 gap-3">
              {/* Category */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">
                  {t("transactionForm.category")}
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (errors.category) setErrors({ ...errors, category: undefined });
                    }}
                    className={`w-full btn-secondary text-slate-900 dark:text-white rounded-2xl py-2.5 px-3 text-sm appearance-none pr-8 ${errors.category ? "border-red-500 border-2" : ""}`}
                  >
                    <option value="">{t("transactionForm.placeholders.selectCategory")}</option>
                    {categories[txType].map((c) => (
                      <option key={c} value={c}>
                        {getCategoryLabel(c)}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="text-slate-900 dark:text-white"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Account */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">
                  {t("transactionForm.account")}
                </label>
                <div className="relative">
                  <select
                    value={fromAccountId}
                    onChange={(e) => {
                      setFromAccountId(e.target.value);
                      if (errors.fromAccount) setErrors({ ...errors, fromAccount: undefined });
                    }}
                    className={`w-full btn-secondary text-slate-900 dark:text-white rounded-2xl py-2.5 px-3 text-sm appearance-none pr-8 ${errors.fromAccount ? "border-red-500 border-2" : ""}`}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {errors.fromAccount && <p className="text-red-500 text-xs mt-1">{errors.fromAccount}</p>}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="text-slate-900 dark:text-white"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Section */}
          {txType === "transfer" && (
            <div className="space-y-3">
              {/* From Account + To Account Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* From Account */}
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">
                    {t("transactionForm.fromAccount")}
                  </label>
                  <div className="relative">
                    <select
                      value={fromAccountId}
                      onChange={(e) => {
                        setFromAccountId(e.target.value);
                        if (errors.fromAccount) setErrors({ ...errors, fromAccount: undefined });
                      }}
                      className={`w-full btn-secondary text-slate-900 dark:text-white rounded-2xl py-2.5 px-3 text-sm appearance-none pr-8 ${errors.fromAccount ? "border-red-500 border-2" : ""}`}
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    {errors.fromAccount && <p className="text-red-500 text-xs mt-1">{errors.fromAccount}</p>}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="text-slate-900 dark:text-white"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* To Account */}
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">
                    {t("transactionForm.toAccount")}
                  </label>
                  <div className="relative">
                    <select
                      value={toAccountId}
                      onChange={(e) => {
                        setToAccountId(e.target.value);
                        if (errors.toAccount) setErrors({ ...errors, toAccount: undefined });
                      }}
                      className={`w-full btn-secondary text-slate-900 dark:text-white rounded-2xl py-2.5 px-3 text-sm appearance-none pr-8 ${errors.toAccount ? "border-red-500 border-2" : ""}`}
                    >
                      {accounts
                        .filter((a) => a.id !== fromAccountId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                    {errors.toAccount && <p className="text-red-500 text-xs mt-1">{errors.toAccount}</p>}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="text-slate-900 dark:text-white"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount to Receive - show for all transfers */}
              {txType === "transfer" && fromAccount && toAccount && (
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">
                    {t("transactionForm.amountToReceive")}
                  </label>
                  <input
                    type="number"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    placeholder={
                      convertedAmount
                        ? convertedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })
                        : t("transactionForm.placeholders.amount")
                    }
                    className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                  />
                  {fromAccount.currency !== toAccount.currency && (
                    <p className="text-[10px] text-slate-500 dark:text-white/50 mt-1">
                      {t("transactionForm.rateLabel")}: 1 {fromAccount.currency} ={" "}
                      {formatRate(getExchangeRate(fromAccount.currency, toAccount.currency))}{" "}
                      {toAccount.currency}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Detail Tabs: Date & Time, Description, Note */}
          <div>
            <div className="flex rounded-2xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveDetailTab("date")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors shadow-sm ${
                  activeDetailTab === "date" ? "tab-active" : "tab-inactive"
                }`}
              >
                {t("transactionForm.tabs.date")}
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab("description")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors shadow-sm ${
                  activeDetailTab === "description" ? "tab-active" : "tab-inactive"
                }`}
              >
                {t("transactionForm.tabs.description")}
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab("note")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors shadow-sm ${
                  activeDetailTab === "note" ? "tab-active" : "tab-inactive"
                }`}
              >
                {t("transactionForm.tabs.note")}
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-3">
              {activeDetailTab === "date" && (
                <DateTimePicker value={date} onChange={setDate} />
              )}

              {activeDetailTab === "description" && (
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("transactionForm.placeholders.description")}
                  className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                />
              )}

              {activeDetailTab === "note" && (
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("transactionForm.placeholders.note")}
                  className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm shadow-md"
          >
            {isEditMode ? t("transactionForm.save") : t("transactionForm.add")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddTransactionModal;
