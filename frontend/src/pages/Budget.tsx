import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Pencil,
  Calculator, Trash2, MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, BudgetPlanData } from "@/api/api";

// Ключи категорий — совпадают с тем что сохраняется в транзакциях
const incomeCategories = ["salary", "freelance", "investment", "gift", "other"];
const expenseCategories = [
  "foodDining",
  "transport",
  "shopping",
  "entertainment",
  "health",
  "housing",
  "other",
];

// Перевод ключа категории в читаемое название через i18n
const getCategoryLabel = (key: string, tFn: (k: string) => string): string => {
  return tFn(`transactionForm.categories.${key}`);
};

// Маппинг старых английских названий (сохранённых на бэкенде) → camelCase ключи
const legacyCategoryMap: Record<string, string> = {
  "food & dining": "foodDining",
  "food and dining": "foodDining",
  "transport": "transport",
  "shopping": "shopping",
  "entertainment": "entertainment",
  "health": "health",
  "housing": "housing",
  "groceries": "other",
  "other": "other",
  "salary": "salary",
  "freelance": "freelance",
  "investment": "investment",
  "gift": "gift",
};

// Нормализуем ключ категории — приводим старые английские названия к camelCase
const normalizeCategoryKey = (cat: string): string => {
  const lower = cat.toLowerCase();
  return legacyCategoryMap[lower] ?? cat;
};

const formatMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthLabel = (monthKey: string, locale: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(locale === "uz" ? "uz-UZ" : "ru-RU", {
    month: "long",
    year: "numeric",
  });
};

const formatMoney = (amount: number, currency: string) => {
  if (currency === "UZS") {
    return `${Math.round(amount).toLocaleString("en-US")} сум`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getStatusColor = (progress: number) => {
  if (progress >= 100) return "bg-destructive";
  if (progress >= 80) return "bg-warning";
  return "bg-success";
};

// ─── Типы для лимитов ────────────────────────────────────────────────────────
type CategoryLimitItem = { category: string; limitAmount: number };

// ─── Основной компонент ───────────────────────────────────────────────────────
const Budget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { language, selectedCurrency, transactions, accounts, refreshData } = useApp();

  useEffect(() => { refreshData(); }, []);

  const [selectedMonth, setSelectedMonth] = useState(formatMonthKey(new Date()));

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() =>
    accounts.length > 0 ? accounts[0].id : ""
  );

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // ── Бюджет с бэкенда (Параметры бюджета + доходы по категориям) ──────────
  const [backendBudget, setBackendBudget] = useState<BudgetPlanData | null>(null);

  // ── Лимиты расходов (отдельно, по accountId + monthKey) ──────────────────
  // Хранятся локально после загрузки с сервера для текущей пары (account, month)
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimitItem[]>([]);
  const [limitsLoading, setLimitsLoading] = useState(false);

  // ── Диалоги ───────────────────────────────────────────────────────────────
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [editingLimit, setEditingLimit] = useState<{ category: string; amount: number } | null>(null);

  // ── Загрузка бюджета при смене месяца / аккаунта ─────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const budget = await api.budgets.getBudgetByMonth(selectedMonth, selectedAccountId);
        setBackendBudget(budget);
        // Синхронизируем лимиты из ответа сервера
        setCategoryLimits(budget?.categoryLimits ?? []);
      } catch (err) {
        console.error("Error loading budget:", err);
        setBackendBudget(null);
        setCategoryLimits([]);
      }
    };
    if (selectedAccountId) load();
  }, [selectedMonth, selectedAccountId]);

  // ── Транзакции за выбранный месяц по выбранному аккаунту ─────────────────
  // Нормализуем тип транзакции в нижний регистр (бэкенд отдаёт EXPENSE/INCOME/TRANSFER)
  const monthTransactions = useMemo(() => {
    if (!selectedAccountId) return [];
    return transactions
      .filter((tx) => tx.accountId === selectedAccountId || tx.toAccountId === selectedAccountId)
      .filter((tx) => {
        // Поддерживаем оба формата даты: "2026-03-15" и "2026-03-15T10:30:00.000Z"
        const txMonth = tx.date.substring(0, 7); // берём первые 7 символов "2026-03"
        return txMonth === selectedMonth;
      })
      .map((tx) => ({
        ...tx,
        // Нормализуем тип в нижний регистр на случай если бэкенд вернул EXPENSE/INCOME
        type: (tx.type as string).toLowerCase() as typeof tx.type,
      }));
  }, [transactions, selectedMonth, selectedAccountId]);

  const selectedAccount = useMemo(() =>
    accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null,
    [accounts, selectedAccountId]
  );

  const currency = selectedAccount?.currency || selectedCurrency || "USD";

  // ── Фактический доход / расход ────────────────────────────────────────────
  const actualIncome = useMemo(() => {
    const regular = monthTransactions
      .filter((tx) => tx.type === "income" && tx.accountId === selectedAccountId && tx.category.toLowerCase() !== "transfer")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const transfersIn = monthTransactions
      .filter((tx) => tx.type === "transfer" && tx.toAccountId === selectedAccountId)
      .reduce((sum, tx) => sum + Number(tx.toAmount || tx.amount), 0);
    const incomingTransfers = monthTransactions
      .filter((tx) => tx.type === "income" && tx.category.toLowerCase() === "transfer" && tx.accountId === selectedAccountId)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    return regular + transfersIn + incomingTransfers;
  }, [monthTransactions, selectedAccountId]);

  const actualExpenses = useMemo(() => {
    const regular = monthTransactions
      .filter((tx) => tx.type === "expense" && tx.accountId === selectedAccountId && tx.category.toLowerCase() !== "transfer")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const transfersOut = monthTransactions
      .filter((tx) => tx.type === "transfer" && tx.accountId === selectedAccountId)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const outgoing = monthTransactions
      .filter((tx) => tx.type === "expense" && tx.category.toLowerCase() === "transfer" && tx.accountId === selectedAccountId)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    return regular + transfersOut + outgoing;
  }, [monthTransactions, selectedAccountId]);

  // ── Расходы по категориям за месяц (для лимитов расходов) ────────────────
  // monthTransactions уже отфильтрован по аккаунту и месяцу.
  // Здесь берём только расходы (type === "expense"), исключая переводы.
  // Тип нормализован в нижний регистр ещё при формировании monthTransactions.
  const actualExpenseByCategory = useMemo(() => {
    const result: Record<string, number> = {};
    for (const tx of monthTransactions) {
      const txType = String(tx.type).toLowerCase();
      const txCategory = String(tx.category);
      if (txType === "expense" && txCategory.toLowerCase() !== "transfer") {
        // Нормализуем ключ: "Food & Dining" -> "foodDining", "foodDining" -> "foodDining"
        const normalizedKey = normalizeCategoryKey(txCategory);
        result[normalizedKey] = (result[normalizedKey] || 0) + Number(tx.amount);
      }
    }
    return result;
  }, [monthTransactions]);

  // ── Доходы по категориям ──────────────────────────────────────────────────
  const actualIncomeByCategory = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === "income")
      .reduce<Record<string, number>>((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + Number(tx.amount);
        return acc;
      }, {});
  }, [monthTransactions]);

  // ── Параметры бюджета (из backendBudget) ──────────────────────────────────
  const totalIncomePlan = backendBudget?.totalIncomePlan ?? 0;
  const totalExpensePlan = backendBudget?.totalExpensePlan ?? 0;
  // "Плановый остаток" = из параметров бюджета
  const plannedRemainder = totalIncomePlan - totalExpensePlan;
  // "Фактический результат" = реальный доход - реальный расход
  const actualNet = actualIncome - actualExpenses;

  // ── Доходы по категориям (план) ───────────────────────────────────────────
  const currentIncomeItems = useMemo(() => {
    if (!backendBudget?.incomePlanItems) return [];
    return backendBudget.incomePlanItems.map((item, i) => ({
      id: `income-${i}`,
      category: item.category,
      plannedAmount: item.plannedAmount,
    }));
  }, [backendBudget]);

  const incomeRows = useMemo(() => {
    return incomeCategories.map((category) => {
      const planned = currentIncomeItems.find((i) => i.category === category)?.plannedAmount ?? 0;
      const actual = actualIncomeByCategory[category] ?? 0;
      return { category, planned, actual, diff: actual - planned };
    });
  }, [currentIncomeItems, actualIncomeByCategory]);

  // ── Строки таблицы "Лимиты расходов" ─────────────────────────────────────
  // Только категории с лимитом. Траты ищем регистронезависимо —
  // бэкенд может вернуть "food & dining" или "Food & Dining".
  const expenseRows = useMemo(() => {
    return categoryLimits
      .filter((limitItem) => limitItem.limitAmount > 0)
      .map((limitItem) => {
        // Нормализуем категорию лимита (старые записи могут быть "Food & Dining")
        const limitCategory = normalizeCategoryKey(limitItem.category);

        // actualExpenseByCategory уже нормализован, просто берём по ключу
        const actual = actualExpenseByCategory[limitCategory] ?? 0;

        const limit = limitItem.limitAmount;
        const remaining = limit - actual;
        const progress = limit > 0 ? Math.min((actual / limit) * 100, 100) : 0;

        return { category: limitCategory, limit, actual, remaining, progress };
      })
      .sort((a, b) => b.progress - a.progress); // самые критичные первыми
  }, [categoryLimits, actualExpenseByCategory]);

  // ── Debug: выводим в консоль для диагностики ─────────────────────────────
  useEffect(() => {
    console.group('[Budget] Диагностика лимитов расходов');
    console.log('selectedMonth:', selectedMonth);
    console.log('selectedAccountId:', selectedAccountId);
    console.log('Всего транзакций в контексте:', transactions.length);
    console.log('monthTransactions (за месяц, по аккаунту):', monthTransactions.length, monthTransactions.map(tx => ({
      id: tx.id, type: tx.type, category: tx.category, amount: tx.amount,
      accountId: tx.accountId, date: tx.date
    })));
    console.log('actualExpenseByCategory:', actualExpenseByCategory);
    console.log('categoryLimits:', categoryLimits);
    console.log('expenseRows:', expenseRows);
    console.groupEnd();
  }, [monthTransactions, actualExpenseByCategory, categoryLimits, expenseRows, selectedMonth, selectedAccountId]);

  // ── Навигация по месяцам ──────────────────────────────────────────────────
  const goPrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    setSelectedMonth(formatMonthKey(new Date(y, m - 2, 1)));
  };
  const goNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    setSelectedMonth(formatMonthKey(new Date(y, m, 1)));
  };

  // ── Сохранение "Параметры бюджета" ───────────────────────────────────────
  const savePlan = async (plannedIncome: number, plannedExpense: number): Promise<boolean> => {
    try {
      if (plannedIncome === 0 && plannedExpense === 0 && backendBudget?.id) {
        await api.budgets.deleteBudget(backendBudget.id);
        setBackendBudget(null);
        return true;
      }
      await api.budgets.saveBudget({
        id: backendBudget?.id,
        monthKey: selectedMonth,
        accountId: selectedAccountId || undefined,
        totalIncomePlan: plannedIncome,
        totalExpensePlan: plannedExpense,
      });
      const refreshed = await api.budgets.getBudgetByMonth(selectedMonth, selectedAccountId);
      setBackendBudget(refreshed);
      if (refreshed?.categoryLimits) setCategoryLimits(refreshed.categoryLimits);
      return true;
    } catch (err) {
      console.error("Error saving plan:", err);
      return false;
    }
  };

  // ── Сохранение дохода по категории ───────────────────────────────────────
  const handleSaveIncomeItem = async (category: string, amount: number): Promise<boolean> => {
    if (!backendBudget?.id) return false;
    try {
      await api.budgets.saveBudget({
        id: backendBudget.id,
        monthKey: selectedMonth,
        accountId: selectedAccountId || undefined,
        totalIncomePlan: backendBudget.totalIncomePlan || 0,
        totalExpensePlan: backendBudget.totalExpensePlan || 0,
        incomePlanItems: [
          ...(backendBudget.incomePlanItems || []).filter((i) => i.category !== category),
          { category, plannedAmount: amount },
        ],
      });
      const refreshed = await api.budgets.getBudgetByMonth(selectedMonth, selectedAccountId);
      setBackendBudget(refreshed);
      if (refreshed?.categoryLimits) setCategoryLimits(refreshed.categoryLimits);
      return true;
    } catch (err) {
      console.error("Error saving income item:", err);
      return false;
    }
  };

  // ── Сохранение лимита расходов ────────────────────────────────────────────
  // Лимиты НЕ связаны с "Параметрами бюджета".
  // Если BudgetPlan не существует — создаётся автоматически как контейнер.
  const handleSaveExpenseLimit = async (category: string, amount: number): Promise<boolean> => {
    setLimitsLoading(true);
    try {
      let budgetId = backendBudget?.id;

      // Создаём budget-контейнер если его нет
      if (!budgetId) {
        const newBudget = await api.budgets.saveBudget({
          monthKey: selectedMonth,
          accountId: selectedAccountId || undefined,
          totalIncomePlan: 0,
          totalExpensePlan: 0,
        });
        if (!newBudget?.id) return false;
        budgetId = newBudget.id;
        setBackendBudget(newBudget);
      }

      // Ищем существующий лимит с нормализацией — бэкенд мог сохранить старое
      // название ("Food & Dining"), а category сюда приходит уже нормализованным ("foodDining")
      const exists = categoryLimits.find(
        (l) => normalizeCategoryKey(l.category) === normalizeCategoryKey(category)
      );
      if (exists) {
        // При обновлении передаём оригинальный ключ как он хранится на бэкенде
        await api.budgets.updateCategoryLimit(budgetId!, exists.category, amount);
      } else {
        await api.budgets.addCategoryLimit(budgetId!, category, amount);
      }

      // Обновляем лимиты локально сразу (оптимистично)
      // Фильтруем с нормализацией — убираем и старый "Food & Dining" и новый "foodDining"
      const updatedLimits = [
        ...categoryLimits.filter(
          (l) => normalizeCategoryKey(l.category) !== normalizeCategoryKey(category)
        ),
        { category: exists ? exists.category : category, limitAmount: amount },
      ];
      setCategoryLimits(updatedLimits);

      // Синхронизируем с сервером
      const refreshed = await api.budgets.getBudgetByMonth(selectedMonth, selectedAccountId);
      if (refreshed?.categoryLimits) setCategoryLimits(refreshed.categoryLimits);
      if (refreshed) setBackendBudget(refreshed);

      setEditingLimit(null);
      return true;
    } catch (err) {
      console.error("Error saving expense limit:", err);
      return false;
    } finally {
      setLimitsLoading(false);
    }
  };

  // ── Удаление лимита расходов ──────────────────────────────────────────────
  const handleDeleteExpenseLimit = async (category: string): Promise<boolean> => {
    if (!backendBudget?.id) return false;
    setLimitsLoading(true);
    try {
      await api.budgets.deleteCategoryLimit(backendBudget.id, category);

      const updatedLimits = categoryLimits.filter((l) => l.category !== category);
      setCategoryLimits(updatedLimits);

      const refreshed = await api.budgets.getBudgetByMonth(selectedMonth, selectedAccountId);

      if (refreshed) {
        setBackendBudget(refreshed);
        setCategoryLimits(refreshed.categoryLimits ?? []);

        // Удаляем budget если он совсем пустой
        const isEmpty =
          (!refreshed.categoryLimits || refreshed.categoryLimits.length === 0) &&
          (!refreshed.incomePlanItems || refreshed.incomePlanItems.length === 0) &&
          (refreshed.totalIncomePlan ?? 0) === 0 &&
          (refreshed.totalExpensePlan ?? 0) === 0;

        if (isEmpty) {
          await api.budgets.deleteBudget(refreshed.id!);
          setBackendBudget(null);
          setCategoryLimits([]);
        }
      } else {
        setBackendBudget(null);
        setCategoryLimits([]);
      }

      return true;
    } catch (err) {
      console.error("Error deleting expense limit:", err);
      return false;
    } finally {
      setLimitsLoading(false);
    }
  };

  const handleEditExpenseLimit = (category: string, amount: number) => {
    setEditingLimit({ category, amount });
    setShowLimitDialog(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full secondary-bg flex items-center justify-center"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold">{t("budget.title")}</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{t("budget.subtitle")}</p>
        </div>
      </div>

      {/* Month + Account selector */}
      <div className="rounded-2xl sm:rounded-3xl border border-border/30 p-3 sm:p-4 card-container shadow-sm">
        <div className="flex items-center justify-between">
          <button onClick={goPrevMonth} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl secondary-bg flex items-center justify-center">
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{t("budget.period")}</p>
            <p className="text-base sm:text-lg font-bold capitalize">{formatMonthLabel(selectedMonth, language)}</p>
          </div>
          <button onClick={goNextMonth} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl secondary-bg flex items-center justify-center">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/30">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">{t("budget.accountCard")}</p>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-primary outline-none">
              <SelectValue placeholder={t("budget.selectAccount")} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{account.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">{account.currency}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Overview карточки ─────────────────────────────────────────────── */}
      {/* "Лимит расходов" и "Плановый остаток" берутся из Параметров бюджета */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* План дохода — из Параметров бюджета */}
        <div className="rounded-2xl sm:rounded-3xl border border-border/30 p-3 sm:p-4 card-container shadow-sm">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t("budget.incomePlan")}</p>
          <p className="text-base sm:text-lg font-bold text-success">{formatMoney(totalIncomePlan, currency)}</p>
        </div>

        {/* Факт дохода */}
        <div className="rounded-2xl sm:rounded-3xl border border-border/30 p-3 sm:p-4 card-container shadow-sm">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t("budget.incomeFact")}</p>
          <p className="text-base sm:text-lg font-bold text-success">{formatMoney(actualIncome, currency)}</p>
        </div>

        {/* Лимит расходов — из Параметров бюджета (totalExpensePlan) */}
        <div className="rounded-2xl sm:rounded-3xl border border-border/30 p-3 sm:p-4 card-container shadow-sm">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t("budget.expenseLimit")}</p>
          <p className="text-base sm:text-lg font-bold text-warning">{formatMoney(totalExpensePlan, currency)}</p>
        </div>

        {/* Факт расходов */}
        <div className="rounded-2xl sm:rounded-3xl border border-border/30 p-3 sm:p-4 card-container shadow-sm">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t("budget.expenseFact")}</p>
          <p className="text-base sm:text-lg font-bold text-destructive">{formatMoney(actualExpenses, currency)}</p>
        </div>

        {/* Плановый остаток — из Параметров бюджета */}
        <div className="rounded-2xl sm:rounded-3xl border border-border/30 p-3 sm:p-4 card-container shadow-sm">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t("budget.plannedRemainder")}</p>
          <p className="text-base sm:text-lg font-bold">{formatMoney(plannedRemainder, currency)}</p>
        </div>

        {/* Фактический результат */}
        <div className="rounded-2xl sm:rounded-3xl border border-border/30 p-3 sm:p-4 card-container shadow-sm">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t("budget.actualResult")}</p>
          <p className={`text-base sm:text-lg font-bold ${actualNet >= 0 ? "text-success" : "text-destructive"}`}>
            {formatMoney(actualNet, currency)}
          </p>
        </div>
      </div>

      {/* ── Параметры бюджета ─────────────────────────────────────────────── */}
      {/* Меняет: План дохода, Лимит расходов, Плановый остаток */}
      <div className="rounded-2xl sm:rounded-3xl border border-border/30 p-3 sm:p-4 card-container shadow-sm">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Calculator size={16} className="text-primary" />
            <h2 className="section-title">{t("budget.budgetParameters")}</h2>
          </div>
          <button
            onClick={() => setShowPlanDialog(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          >
            <Pencil size={14} />
          </button>
        </div>

        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("budget.planIncome")}</span>
            <span className="font-semibold">{formatMoney(totalIncomePlan, currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("budget.planExpenses")}</span>
            <span className="font-semibold">{formatMoney(totalExpensePlan, currency)}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/20">
            <span className="text-muted-foreground">{t("budget.plannedRemainder")}</span>
            <span className={`font-semibold ${plannedRemainder >= 0 ? "text-success" : "text-destructive"}`}>
              {formatMoney(plannedRemainder, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Доходы по категориям ──────────────────────────────────────────── */}
      <div className="rounded-2xl sm:rounded-3xl border border-border/30 p-3 sm:p-4 card-container shadow-sm">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="section-title">{t("budget.incomePlanByCategory")}</h2>
          <button
            onClick={() => setShowIncomeDialog(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          {incomeRows.map((row) => (
            <div
              key={row.category}
              className="rounded-xl sm:rounded-2xl border border-border/30 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium truncate">{getCategoryLabel(row.category, t)}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {t("budget.limit")}: {formatMoney(row.planned, currency)} · {t("budget.fact")}: {formatMoney(row.actual, currency)}
                </p>
              </div>
              <p className={`text-xs sm:text-sm font-semibold shrink-0 ${row.diff >= 0 ? "text-success" : "text-destructive"}`}>
                {row.diff >= 0 ? "+" : ""}{formatMoney(row.diff, currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Лимиты расходов ───────────────────────────────────────────────── */}
      {/* ПОЛНОСТЬЮ отдельная таблица — не связана с Параметрами бюджета.     */}
      {/* Показывает реальные траты за месяц и сравнивает с установленным лимитом. */}
      <div className="rounded-2xl sm:rounded-3xl border border-border/30 p-3 sm:p-4 card-container shadow-sm">
        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
          <h2 className="section-title">{t("budget.expenseLimits")}</h2>
          <button
            onClick={() => { setEditingLimit(null); setShowLimitDialog(true); }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
            disabled={limitsLoading}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Подзаголовок с картой и месяцем */}
        <p className="text-[10px] text-muted-foreground mb-2 sm:mb-3">
          {selectedAccount?.name} · {formatMonthLabel(selectedMonth, language)}
        </p>

        <div className="space-y-2 sm:space-y-3">
          {expenseRows.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
              Лимиты пока не заданы
            </div>
          ) : (
            expenseRows.map((row) => (
              <div key={row.category} className="rounded-xl sm:rounded-2xl border border-border/30 p-3 sm:p-4">
                {/* Заголовок строки */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium">{getCategoryLabel(row.category, t)}</p>
                  <div className="flex items-center gap-2">
                    {/* Процент использования */}
                    <span className={`text-[10px] sm:text-xs font-semibold ${
                      row.progress >= 100 ? "text-destructive" :
                      row.progress >= 80 ? "text-warning" : "text-success"
                    }`}>
                      {row.limit > 0 ? Math.round(row.progress) : 0}%
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <MoreVertical size={12} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditExpenseLimit(row.category, row.limit)}>
                          <Pencil size={14} className="mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteExpenseLimit(row.category)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Прогресс-бар */}
                <div className="w-full h-2 sm:h-2.5 rounded-full bg-secondary overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-300 ${getStatusColor(row.progress)}`}
                    style={{ width: `${Math.min(row.progress, 100)}%` }}
                  />
                </div>

                {/* Суммы: потрачено / лимит */}
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                  <span>
                    Потрачено: <span className={`font-semibold ${row.progress >= 100 ? "text-destructive" : "text-foreground"}`}>
                      {formatMoney(row.actual, currency)}
                    </span>
                  </span>
                  <span>
                    Лимит: <span className="font-semibold text-foreground">{formatMoney(row.limit, currency)}</span>
                  </span>
                </div>

                {/* Остаток или перерасход */}
                {row.limit > 0 && (
                  <div className="mt-1 text-[10px] sm:text-xs">
                    {row.remaining >= 0 ? (
                      <span className="text-success">Остаток: {formatMoney(row.remaining, currency)}</span>
                    ) : (
                      <span className="text-destructive">Перерасход: {formatMoney(Math.abs(row.remaining), currency)}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Диалоги ───────────────────────────────────────────────────────── */}
      <PlanDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
        initialIncome={totalIncomePlan}
        initialExpense={totalExpensePlan}
        onSave={savePlan}
      />

      <IncomeDialog
        open={showIncomeDialog}
        onOpenChange={setShowIncomeDialog}
        incomeItems={currentIncomeItems}
        onSave={handleSaveIncomeItem}
      />

      <ExpenseLimitDialog
        open={showLimitDialog}
        onOpenChange={(open) => {
          setShowLimitDialog(open);
          if (!open) setEditingLimit(null);
        }}
        categoryLimits={categoryLimits}
        editingLimit={editingLimit}
        actualExpensesByCategory={actualExpenseByCategory}
        currency={currency}
        onSave={handleSaveExpenseLimit}
      />
    </div>
  );
};

// ─── PlanDialog — Параметры бюджета ──────────────────────────────────────────
const PlanDialog = ({
  open, onOpenChange, initialIncome, initialExpense, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIncome: number;
  initialExpense: number;
  onSave: (income: number, expense: number) => Promise<boolean>;
}) => {
  const { t } = useTranslation();
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIncome(initialIncome > 0 ? initialIncome.toString() : "");
    setExpense(initialExpense > 0 ? initialExpense.toString() : "");
  }, [initialIncome, initialExpense, open]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    onOpenChange(false);
    try {
      await onSave(Number(income || 0), Number(expense || 0));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("budget.budgetParameters")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("budget.incomePlan")}</label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="0"
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("budget.planExpenses")}</label>
            <input
              type="number"
              value={expense}
              onChange={(e) => setExpense(e.target.value)}
              placeholder="0"
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
            />
          </div>
          <button onClick={handleSave} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm">
            {t("budget.save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── IncomeDialog ─────────────────────────────────────────────────────────────
const IncomeDialog = ({
  open, onOpenChange, incomeItems, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeItems: { category: string; plannedAmount: number }[];
  onSave: (category: string, amount: number) => Promise<boolean>;
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState(incomeCategories[0]);
  const [amount, setAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const item = incomeItems.find((i) => i.category === category);
    setAmount(item ? item.plannedAmount.toString() : "");
  }, [incomeItems, category]);

  const handleSave = async () => {
    if (!amount || Number(amount) < 0 || isSaving) return;
    setIsSaving(true);
    onOpenChange(false);
    try {
      await onSave(category, Number(amount));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("budget.incomePlanByCategoryTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("budget.category")}</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                const item = incomeItems.find((i) => i.category === e.target.value);
                setAmount(item ? item.plannedAmount.toString() : "");
              }}
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
            >
              {incomeCategories.map((cat) => <option key={cat} value={cat}>{getCategoryLabel(cat, t)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("budget.amount")}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
            />
          </div>
          <button onClick={handleSave} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm">
            {t("budget.save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── ExpenseLimitDialog ───────────────────────────────────────────────────────
const ExpenseLimitDialog = ({
  open, onOpenChange, categoryLimits, editingLimit,
  actualExpensesByCategory, currency, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryLimits: CategoryLimitItem[];
  editingLimit?: { category: string; amount: number } | null;
  actualExpensesByCategory?: Record<string, number>;
  currency?: string;
  onSave: (category: string, amount: number) => Promise<boolean>;
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState(expenseCategories[0]);
  const [amount, setAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingLimit) {
      setCategory(editingLimit.category);
      setAmount(editingLimit.amount.toString());
    } else if (open) {
      setCategory(expenseCategories[0]);
      setAmount("");
    }
    setError(null);
  }, [editingLimit, open]);

  const activeCategory = editingLimit ? editingLimit.category : category;
  const actualSpent = actualExpensesByCategory?.[activeCategory] ?? 0;
  const existingLimit = categoryLimits.find((l) => l.category === activeCategory);

  const handleSave = async () => {
    if (amount === "") { setError("Введите сумму лимита"); return; }
    const num = Number(amount);
    if (isNaN(num) || num < 0) { setError("Введите корректную сумму"); return; }
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const ok = await onSave(activeCategory, num);
      if (ok) { onOpenChange(false); }
      else { setError("Не удалось сохранить лимит"); }
    } catch {
      setError("Произошла ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("budget.expenseLimitByCategoryTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("budget.category")}</label>
            <select
              value={activeCategory}
              onChange={(e) => {
                if (editingLimit) return;
                setCategory(e.target.value);
                const ex = categoryLimits.find((l) => l.category === e.target.value);
                setAmount(ex ? ex.limitAmount.toString() : "");
              }}
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
              disabled={!!editingLimit}
            >
              {expenseCategories.map((cat) => <option key={cat} value={cat}>{getCategoryLabel(cat, t)}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("budget.limit")}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
            />

            {/* Информация о фактических тратах */}
            {currency && (
              <div className="mt-2 rounded-xl bg-secondary/50 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Потрачено в этом месяце:</span>
                  <span className="font-semibold text-foreground">{formatMoney(actualSpent, currency)}</span>
                </div>
                {existingLimit && (
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Текущий лимит:</span>
                    <span className="font-semibold text-foreground">{formatMoney(existingLimit.limitAmount, currency)}</span>
                  </div>
                )}
                {amount && Number(amount) > 0 && (
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Остаток при новом лимите:</span>
                    <span className={`font-semibold ${Number(amount) - actualSpent >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatMoney(Number(amount) - actualSpent, currency)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="text-destructive text-xs bg-destructive/10 p-2 rounded-lg">{error}</div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
          >
            {isSaving ? "Сохранение..." : t("budget.save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Budget;
