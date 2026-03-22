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

// Категории на английском (для внутреннего использования)
const categoriesKeys = {
  expense: ["foodDining", "transport", "shopping", "entertainment", "health", "housing", "other"],
  income: ["salary", "freelance", "investment", "gift", "other"],
};

// Map categories to icons (using new keys)
const categoryIcons: Record<string, string> = {
  "foodDining": "utensils-crossed",
  "transport": "car",
  "shopping": "shopping-bag",
  "entertainment": "film",
  "health": "heart-pulse",
  "housing": "home",
  "salary": "briefcase",
  "freelance": "laptop",
  "investment": "trending-up",
  "gift": "gift",
  "transfer": "arrow-left-right",
  "other": "circle-dot",
  // Legacy English names for backward compatibility
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
  const seconds = date.getSeconds().toString().padStart(2, "0");
  // Формат ISO 8601 с timezone offset (+05:00 для Ташкента)
  const timezoneOffset = -date.getTimezoneOffset();
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60).toString().padStart(2, "0");
  const offsetMinutes = Math.abs(timezoneOffset % 60).toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
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
    setAddAccountModalOpen,
    refreshData,
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

  // При открытии модала обновляем список счетов с сервера —
  // пользователь мог только что создать новую карту и нам нужны актуальные данные
  useEffect(() => {
    if (modalOpen && !editTransaction) {
      refreshData();
    }
  }, [modalOpen]);

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

  // Устанавливаем toAccountId при первом рендере если есть 2+ счёта и тип transfer

  // Устанавливаем toAccountId при изменении accounts или типа транзакции
  useEffect(() => {
    if (txType === "transfer" && accounts.length >= 2) {
      // Если toAccountId ещё не установлен или равен fromAccountId - устанавливаем другой счёт
      if (!toAccountId || toAccountId === fromAccountId) {
        const otherAccount = accounts.find(a => a.id !== fromAccountId);
        if (otherAccount) {
          setToAccountId(String(otherAccount.id));
        } else if (accounts[1]) {
          // Если fromAccountId ещё не выбран, устанавливаем второй счёт по умолчанию
          setToAccountId(String(accounts[1].id));
        }
      }
    }
  }, [txType, fromAccountId, accounts, toAccountId]);

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
    // Если это ключ (foodDining) - переводим
    if (categoryKey === categoryKey.toLowerCase()) {
      return t(`transactionForm.categories.${categoryKey}`);
    }
    // Если это английское название (Food & Dining) - маппим на ключ
    const keyMap: Record<string, string> = {
      "Food & Dining": "foodDining",
      "Transport": "transport",
      "Shopping": "shopping",
      "Entertainment": "entertainment",
      "Health": "health",
      "Housing": "housing",
      "Salary": "salary",
      "Freelance": "freelance",
      "Investment": "investment",
      "Gift": "gift",
      "Transfer": "transfer",
      "Other": "other",
    };
    const key = keyMap[categoryKey] || categoryKey;
    return t(`transactionForm.categories.${key}`);
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

    // Дополнительная проверка: аккаунт должен существовать в списке.
    // Если не найден — возможно счета ещё не загрузились (race condition после
    // создания новой карты). Показываем понятную ошибку.
    const fromAccountCheck = accounts.find((a) => a.id === fromAccountId);
    if (!fromAccountCheck && fromAccountId) {
      setErrors({ fromAccount: t("transactionForm.errors.selectAccount") });
      // Принудительно обновляем данные чтобы подтянуть новую карту
      refreshData();
      return;
    }

    setErrors({});

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
      // Бэкенд ожидает type в верхнем регистре — нормализуем здесь и в api.ts
      const updatedTx: Transaction = {
        ...editTransaction,
        type: txType, // api.ts.updateTransaction конвертирует в UPPERCASE перед отправкой
        amount: amountNum,
        currency: fromAccount?.currency || editTransaction.currency || "USD",
        category: txType === "transfer" ? "Transfer" : category,
        description: description || "",
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
          categoryIcons[txType === "transfer" ? "Transfer" : category] ||
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
        
        handleClose();
        if (onClose) onClose();
      } catch (error) {
        console.error("Error updating transaction:", error);
        // Показываем ошибку, полученную от сервера
        let errorMessage = t("transactionForm.toasts.error.updateFailed");
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
            // Если есть ошибки валидации, показываем их
            if (axiosError.response.data.errors) {
              const validationErrors = Object.entries(axiosError.response.data.errors)
                .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                .join('; ');
              errorMessage = `${errorMessage} (${validationErrors})`;
            }
          }
        }
        toast({
          title: t("common.error"),
          description: errorMessage,
          variant: "destructive",
        });
        // Не закрываем форму при ошибке
      }
      return;
    }

    const tx: Omit<Transaction, "id"> = {
      type: txType.toUpperCase() as Transaction["type"],
      amount: amountNum,
      currency: fromAccount?.currency || "USD",
      category: txType === "transfer" ? "Transfer" : category,
      description: description || "",
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

    // Сохраняем транзакцию через API
    try {
      const newTx = await addTransaction(tx);
      
      // Обновляем балансы только после успешного ответа от сервера
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
      
      // Обрабатываем массив транзакций (для переводов) или одиночную транзакцию
      if (Array.isArray(newTx)) {
        // Для переводов - добавляем обе транзакции
        const txsToAdd = newTx.map(tx => ({
          ...tx,
          type: (tx.type as string).toLowerCase() as Transaction["type"]
        }));
        setTransactions([...txsToAdd, ...transactions]);
      } else {
        // Для обычных транзакций
        const savedTx = {
          ...newTx,
          type: (newTx.type as string).toLowerCase() as Transaction["type"]
        };
        setTransactions([savedTx, ...transactions]);
      }

      toast({
        title: t("transactionForm.toasts.created.title"),
        description: t("transactionForm.toasts.created.description"),
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      // Показываем ошибку, полученную от сервера
      let errorMessage = t("transactionForm.toasts.error.createFailed");
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
          // Если есть ошибки валидации, показываем их
          if (axiosError.response.data.errors) {
            const validationErrors = Object.entries(axiosError.response.data.errors)
              .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
              .join('; ');
            errorMessage = `${errorMessage} (${validationErrors})`;
          }
        }
      }
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
      // Не обновляем список транзакций и не закрываем форму при ошибке
      return;
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

        <div className="space-y-3 sm:space-y-4">
          {/* Transaction Type */}
          <div className="flex rounded-xl sm:rounded-2xl p-0.5 sm:p-1 gap-0.5 sm:gap-1">
            {(["expense", "income", "transfer"] as TxType[]).map((tType) => (
              <button
                key={tType}
                type="button"
                onClick={() => setTxType(tType)}
                className={`flex-1 py-2 rounded-lg sm:py-2.5 sm:rounded-xl text-[10px] sm:text-xs font-semibold capitalize transition-colors shadow-sm ${
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
              className={`w-full rounded-xl sm:rounded-2xl input-bg text-slate-900 dark:text-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm ${errors.amount ? "border-red-500 border-2" : ""}`}
            />
            {errors.amount && <p className="text-red-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{errors.amount}</p>}
          </div>

          {/* Category + Account Row for expense/income */}
          {txType !== "transfer" && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                    className={`w-full btn-secondary text-slate-900 dark:text-white rounded-xl sm:rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3 text-xs sm:text-sm appearance-none pr-7 sm:pr-8 ${errors.category ? "border-red-500 border-2" : ""}`}
                  >
                    <option value="">{t("transactionForm.placeholders.selectCategory")}</option>
                    {categoriesKeys[txType].map((c) => (
                      <option key={c} value={c}>
                        {t(`transactionForm.categories.${c}`)}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{errors.category}</p>}
                  <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      width="10" sm:width={12}
                      height="10" sm:height={12}
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
                    className={`w-full btn-secondary text-slate-900 dark:text-white rounded-xl sm:rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3 text-xs sm:text-sm appearance-none pr-7 sm:pr-8 ${errors.fromAccount ? "border-red-500 border-2" : ""}`}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {errors.fromAccount && <p className="text-red-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{errors.fromAccount}</p>}
                  <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      width="10" sm:width={12}
                      height="10" sm:height={12}
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
            <div className="space-y-2 sm:space-y-3">
              {/* From Account + To Account Row */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                      className={`w-full btn-secondary text-slate-900 dark:text-white rounded-xl sm:rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3 text-xs sm:text-sm appearance-none pr-7 sm:pr-8 ${errors.fromAccount ? "border-red-500 border-2" : ""}`}
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    {errors.fromAccount && <p className="text-red-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{errors.fromAccount}</p>}
                    <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        width="10" sm:width={12}
                        height="10" sm:height={12}
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
                  {accounts.length < 2 ? (
                    <button
                      onClick={() => setAddAccountModalOpen(true)}
                      className="w-full btn-secondary text-slate-900 dark:text-white rounded-xl sm:rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                      <svg
                        width="12" sm:width={16}
                        height="12" sm:height={16}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      {t("transactionForm.createAccount")}
                    </button>
                  ) : (
                    <div className="relative">
                      <select
                        value={toAccountId}
                        onChange={(e) => {
                          setToAccountId(e.target.value);
                          if (errors.toAccount) setErrors({ ...errors, toAccount: undefined });
                        }}
                        className={`w-full btn-secondary text-slate-900 dark:text-white rounded-xl sm:rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3 text-xs sm:text-sm appearance-none pr-7 sm:pr-8 ${errors.toAccount ? "border-red-500 border-2" : ""}`}
                      >
                        {accounts
                          .filter((a) => a.id !== fromAccountId)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </select>
                      {errors.toAccount && <p className="text-red-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{errors.toAccount}</p>}
                      <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          width="10" sm:width={12}
                          height="10" sm:height={12}
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
                  )}
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
                    className="w-full rounded-xl sm:rounded-2xl input-bg text-slate-900 dark:text-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                  />
                  {fromAccount.currency !== toAccount.currency && (
                    <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-white/50 mt-0.5 sm:mt-1">
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
            <div className="flex rounded-xl sm:rounded-2xl p-0.5 sm:p-1 gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setActiveDetailTab("date")}
                className={`flex-1 py-2 rounded-lg sm:py-2.5 sm:rounded-xl text-[10px] sm:text-xs font-medium transition-colors shadow-sm ${
                  activeDetailTab === "date" ? "tab-active" : "tab-inactive"
                }`}
              >
                {t("transactionForm.tabs.date")}
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab("description")}
                className={`flex-1 py-2 rounded-lg sm:py-2.5 sm:rounded-xl text-[10px] sm:text-xs font-medium transition-colors shadow-sm ${
                  activeDetailTab === "description" ? "tab-active" : "tab-inactive"
                }`}
              >
                {t("transactionForm.tabs.description")}
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab("note")}
                className={`flex-1 py-2 rounded-lg sm:py-2.5 sm:rounded-xl text-[10px] sm:text-xs font-medium transition-colors shadow-sm ${
                  activeDetailTab === "note" ? "tab-active" : "tab-inactive"
                }`}
              >
                {t("transactionForm.tabs.note")}
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-2 sm:mt-3">
              {activeDetailTab === "date" && (
                <DateTimePicker value={date} onChange={setDate} />
              )}

              {activeDetailTab === "description" && (
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("transactionForm.placeholders.description")}
                  className="w-full rounded-xl sm:rounded-2xl input-bg text-slate-900 dark:text-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                />
              )}

              {activeDetailTab === "note" && (
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("transactionForm.placeholders.note")}
                  className="w-full rounded-xl sm:rounded-2xl input-bg text-slate-900 dark:text-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={txType === "transfer" && accounts.length < 2}
            className={`w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-primary text-white font-semibold text-xs sm:text-sm shadow-md ${txType === "transfer" && accounts.length < 2 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isEditMode ? t("transactionForm.save") : t("transactionForm.add")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddTransactionModal;
