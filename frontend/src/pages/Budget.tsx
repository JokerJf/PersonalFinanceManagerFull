import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Pencil, Calculator, Trash2, MoreVertical } from "lucide-react";
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

const incomeCategories = ["Salary", "Freelance", "Investment", "Gift", "Other"];
const expenseCategories = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Housing",
  "Groceries",
  "Other",
];

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

const getProgressTextColor = (progress: number) => {
  if (progress >= 100) return "text-destructive";
  if (progress >= 80) return "text-warning";
  return "text-success";
};

const Budget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    language,
    selectedCurrency,
    transactions,
    accounts,
    refreshData,
  } = useApp();

  useEffect(() => {
    refreshData();
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(formatMonthKey(new Date()));
  
  // По умолчанию выбираем первую карту
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return accounts.length > 0 ? accounts[0].id : "";
  });

  // Обновляем выбранный аккаунт когда загружаются аккаунты
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Состояние для бюджета с бэкенда
  const [backendBudget, setBackendBudget] = useState<BudgetPlanData | null>(null);

  // Загружаем бюджет при изменении месяца или аккаунта
  useEffect(() => {
    const loadBudget = async () => {
      try {
        const budget = await api.budgets.getBudgetByMonth(selectedMonth, selectedAccountId);
        setBackendBudget(budget);
      } catch (error) {
        console.error('Error loading budget:', error);
        setBackendBudget(null);
      }
    };
    loadBudget();
  }, [selectedMonth, selectedAccountId]);

  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  
  // Состояние для редактирования лимита
  const [editingLimit, setEditingLimit] = useState<{ category: string; amount: number } | null>(null);

  const currentPlanId = backendBudget?.id ?? null;

  const currentIncomeItems = useMemo(() => {
    if (!backendBudget?.incomePlanItems) return [];
    return backendBudget.incomePlanItems.map((item, index) => ({
      id: `income-${index}`,
      budgetPlanId: backendBudget.id!,
      category: item.category,
      plannedAmount: item.plannedAmount
    }));
  }, [backendBudget]);

  const currentCategoryLimits = useMemo(() => {
    if (!backendBudget?.categoryLimits) return [];
    return backendBudget.categoryLimits.map((item, index) => ({
      id: `limit-${index}`,
      budgetPlanId: backendBudget.id!,
      category: item.category,
      limitAmount: item.limitAmount
    }));
  }, [backendBudget]);

  const monthTransactions = useMemo(() => {
    if (!selectedAccountId) return [];
    
    // Фильтруем транзакции по аккаунту (accountId или toAccountId)
    return transactions.filter((tx) => 
      tx.accountId === selectedAccountId || tx.toAccountId === selectedAccountId
    ).filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth, selectedAccountId]);

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return accounts[0] || null;
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;
  }, [accounts, selectedAccountId]);

  // Фактический доход: INCOME (пополнения) + TRANSFER (переводы НА выбранный счёт)
  const actualIncome = useMemo(() => {
    let income = monthTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Number(tx.amount) || 0, 0);
    
    // Добавляем переводы на выбранный аккаунт
    const transfersIn = monthTransactions
      .filter((tx) => tx.type === "transfer" && tx.toAccountId === selectedAccountId)
      .reduce((sum, tx) => sum + Number(tx.toAmount || tx.amount) || 0, 0);
    income += transfersIn;
    
    return income;
  }, [monthTransactions, selectedAccountId]);

  // Фактический расход: EXPENSE (траты) + TRANSFER (переводы С выбранного счёта)
  const actualExpenses = useMemo(() => {
    let expenses = monthTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Number(tx.amount) || 0, 0);
    
    // Добавляем переводы с выбранного аккаунта
    const transfersOut = monthTransactions
      .filter((tx) => tx.type === "transfer" && tx.accountId === selectedAccountId)
      .reduce((sum, tx) => sum + Number(tx.amount) || 0, 0);
    expenses += transfersOut;
    
    return expenses;
  }, [monthTransactions, selectedAccountId]);

  const actualIncomeByCategory = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === "income")
      .reduce<Record<string, number>>((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {});
  }, [monthTransactions]);

  const actualExpenseByCategory = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === "expense")
      .reduce<Record<string, number>>((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {});
  }, [monthTransactions]);

  const totalPlannedIncome = useMemo(() => {
    if (currentIncomeItems.length > 0) {
      return currentIncomeItems.reduce((sum, item) => sum + item.plannedAmount, 0);
    }
    return backendBudget?.totalIncomePlan ?? 0;
  }, [currentIncomeItems, backendBudget]);

  const totalExpenseLimit = useMemo(() => {
    if (currentCategoryLimits.length === 0) return backendBudget?.totalExpensePlan ?? 0;
    return currentCategoryLimits.reduce((sum, item) => sum + item.limitAmount, 0);
  }, [currentCategoryLimits, backendBudget]);

  const incomeRows = useMemo(() => {
    return incomeCategories.map((category) => {
      const planned =
        currentIncomeItems.find((item) => item.category === category)?.plannedAmount ?? 0;
      const actual = actualIncomeByCategory[category] ?? 0;
      const diff = actual - planned;

      return {
        category,
        planned,
        actual,
        diff,
      };
    });
  }, [currentIncomeItems, actualIncomeByCategory]);

  const expenseRows = useMemo(() => {
    return expenseCategories
      .map((category) => {
        const limit =
          currentCategoryLimits.find((item) => item.category === category)?.limitAmount ?? 0;
        const actual = actualExpenseByCategory[category] ?? 0;
        const remaining = limit - actual;
        const progress = limit > 0 ? (actual / limit) * 100 : 0;

        return {
          category,
          limit,
          actual,
          remaining,
          progress,
        };
      })
      .filter((row) => row.limit > 0 || row.actual > 0);
  }, [currentCategoryLimits, actualExpenseByCategory]);

  const goPrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(year, month - 2, 1);
    setSelectedMonth(formatMonthKey(nextDate));
  };

  const goNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    setSelectedMonth(formatMonthKey(nextDate));
  };

  const savePlan = async (plannedIncome: number, plannedExpense: number) => {
    try {
      // Если оба значения 0 и есть бюджет - удаляем его
      if (plannedIncome === 0 && plannedExpense === 0 && backendBudget?.id) {
        await api.budgets.deleteBudget(backendBudget.id);
        setBackendBudget(null);
        return;
      }

      // Сохраняем бюджет
      const savedBudget = await api.budgets.saveBudget({
        id: backendBudget?.id,
        monthKey: selectedMonth,
        accountId: selectedAccountId,
        totalIncomePlan: plannedIncome,
        totalExpensePlan: plannedExpense
      });
      
      setBackendBudget(savedBudget);
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleSaveIncomeItem = async (category: string, amount: number) => {
    if (!backendBudget?.id) return;
    try {
      const savedBudget = await api.budgets.saveBudget({
        id: backendBudget.id,
        monthKey: selectedMonth,
        accountId: selectedAccountId,
        totalIncomePlan: backendBudget.totalIncomePlan || 0,
        totalExpensePlan: backendBudget.totalExpensePlan || 0,
        incomePlanItems: [...(backendBudget.incomePlanItems || []).filter(i => i.category !== category), { category, plannedAmount: amount }]
      });
      setBackendBudget(savedBudget);
    } catch (error) {
      console.error('Error saving income item:', error);
    }
  };

  const handleSaveExpenseLimit = async (category: string, amount: number) => {
    if (!backendBudget?.id) return;
    try {
      let savedBudget;
      
      // Если редактируем существующий лимит - используем отдельный API
      const existingLimit = backendBudget.categoryLimits?.find(c => c.category === category);
      if (existingLimit) {
        savedBudget = await api.budgets.updateCategoryLimit(backendBudget.id, category, amount);
      } else {
        savedBudget = await api.budgets.addCategoryLimit(backendBudget.id, category, amount);
      }
      
      setBackendBudget(savedBudget);
      setEditingLimit(null);
    } catch (error) {
      console.error('Error saving expense limit:', error);
    }
  };

  const handleDeleteExpenseLimit = async (category: string) => {
    if (!backendBudget?.id) return;
    try {
      const savedBudget = await api.budgets.deleteCategoryLimit(backendBudget.id, category);
      setBackendBudget(savedBudget);
    } catch (error) {
      console.error('Error deleting expense limit:', error);
    }
  };

  const handleEditExpenseLimit = (category: string, amount: number) => {
    setEditingLimit({ category, amount });
    setShowLimitDialog(true);
  };

  const projectedSavings = totalPlannedIncome - totalExpenseLimit;
  const actualNet = actualIncome - actualExpenses;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full secondary-bg flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{t("budget.title")}</h1>
          <p className="text-xs text-muted-foreground">
            {t("budget.subtitle")}
          </p>
        </div>
      </div>

      {/* Month switcher */}
      <div className="rounded-3xl border border-border/30 p-4 card-container shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={goPrevMonth}
            className="w-10 h-10 rounded-2xl secondary-bg flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {t("budget.period")}
            </p>
            <p className="text-lg font-bold capitalize">
              {formatMonthLabel(selectedMonth, language)}
            </p>
          </div>

          <button
            onClick={goNextMonth}
            className="w-10 h-10 rounded-2xl secondary-bg flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Account selector */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-2">{t("budget.accountCard")}</p>
          <Select
            value={selectedAccountId}
            onValueChange={(value) => setSelectedAccountId(value)}
          >
            <SelectTrigger className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
              <SelectValue placeholder={t("budget.selectAccount")} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{account.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {account.currency}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border/30 p-4 card-container shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t("budget.incomePlan")}</p>
          <p className="text-lg font-bold text-success">
            {formatMoney(totalPlannedIncome, selectedAccount?.currency || selectedCurrency || "USD")}
          </p>
        </div>

        <div className="rounded-3xl border border-border/30 p-4 card-container shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t("budget.incomeFact")}</p>
          <p className="text-lg font-bold text-success">
            {formatMoney(actualIncome, selectedAccount?.currency || selectedCurrency || "USD")}
          </p>
        </div>

        <div className="rounded-3xl border border-border/30 p-4 card-container shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t("budget.expenseLimit")}</p>
          <p className="text-lg font-bold text-warning">
            {formatMoney(totalExpenseLimit, selectedAccount?.currency || selectedCurrency || "USD")}
          </p>
        </div>

        <div className="rounded-3xl border border-border/30 p-4 card-container shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t("budget.expenseFact")}</p>
          <p className="text-lg font-bold text-destructive">
            {formatMoney(actualExpenses, selectedAccount?.currency || selectedCurrency || "USD")}
          </p>
        </div>

        <div className="rounded-3xl border border-border/30 p-4 card-container shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t("budget.plannedRemainder")}</p>
          <p className="text-lg font-bold">
            {formatMoney(projectedSavings, selectedAccount?.currency || selectedCurrency || "USD")}
          </p>
        </div>

        <div className="rounded-3xl border border-border/30 p-4 card-container shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t("budget.actualResult")}</p>
          <p className={`text-lg font-bold ${actualNet >= 0 ? "text-success" : "text-destructive"}`}>
            {formatMoney(actualNet, selectedAccount?.currency || selectedCurrency || "USD")}
          </p>
        </div>
      </div>

      {/* Budget setup */}
      <div className="rounded-3xl border border-border/30 p-4 card-container shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-primary" />
            <h2 className="section-title">{t("budget.budgetParameters")}</h2>
          </div>

          <button
            onClick={() => setShowPlanDialog(true)}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          >
            <Pencil size={16} />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("budget.planIncome")}</span>
            <span className="font-semibold">{formatMoney(totalPlannedIncome, selectedAccount?.currency || selectedCurrency || "USD")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("budget.planExpenses")}</span>
            <span className="font-semibold">{formatMoney(totalExpenseLimit, selectedAccount?.currency || selectedCurrency || "USD")}</span>
          </div>
        </div>
      </div>

      {/* Income plan */}
      <div className="rounded-3xl border border-border/30 p-4 card-container shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">{t("budget.incomePlanByCategory")}</h2>
          <button
            onClick={() => setShowIncomeDialog(true)}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {incomeRows.map((row) => (
            <div
              key={row.category}
              className="rounded-2xl border border-border/30 px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium">{row.category}</p>
                <p className="text-xs text-muted-foreground">
                  {t("budget.limit")}: {formatMoney(row.planned, selectedAccount?.currency || selectedCurrency || "USD")} · {t("budget.fact")}:{" "}
                  {formatMoney(row.actual, selectedAccount?.currency || selectedCurrency || "USD")}
                </p>
              </div>

              <p
                className={`text-sm font-semibold ${
                  row.diff >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {row.diff >= 0 ? "+" : ""}
                {formatMoney(row.diff, selectedAccount?.currency || selectedCurrency || "USD")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Expense limits */}
      <div className="rounded-3xl border border-border/30 p-4 card-container shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">{t("budget.expenseLimits")}</h2>
          <button
            onClick={() => setShowLimitDialog(true)}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {expenseRows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Лимиты пока не заданы
            </div>
          ) : (
            expenseRows.map((row) => (
              <div key={row.category} className="rounded-2xl border border-border/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{row.category}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                            <MoreVertical size={14} />
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Лимит: {formatMoney(row.limit, selectedAccount?.currency || selectedCurrency || "USD")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Факт: {formatMoney(row.actual, selectedAccount?.currency || selectedCurrency || "USD")}
                    </p>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full transition-all ${getStatusColor(row.progress)}`}
                    style={{ width: `${Math.min(row.progress, 100)}%` }}
                  />
                </div>

                <p className="text-[10px] text-muted-foreground mt-1">
                  Использовано {row.limit > 0 ? Math.round(row.progress) : 0}%
                </p>
              </div>
            ))
          )}
        </div>
      </div>


      {/* Dialogs */}
      <PlanDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
        initialIncome={backendBudget?.totalIncomePlan ?? 0}
        initialExpense={backendBudget?.totalExpensePlan ?? 0}
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
        expenseLimits={currentCategoryLimits}
        editingLimit={editingLimit}
        onSave={handleSaveExpenseLimit}
      />
    </div>
  );
};

const PlanDialog = ({
  open,
  onOpenChange,
  initialIncome,
  initialExpense,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIncome: number;
  initialExpense: number;
  onSave: (income: number, expense: number) => void;
}) => {
  const { t } = useTranslation();
  const [income, setIncome] = useState(initialIncome.toString());
  const [expense, setExpense] = useState(initialExpense.toString());

  // Обновляем значения при открытии диалога
  useEffect(() => {
    if (open) {
      setIncome(initialIncome > 0 ? initialIncome.toString() : "");
      setExpense(initialExpense > 0 ? initialExpense.toString() : "");
    }
  }, [open, initialIncome, initialExpense]);

  const handleSave = () => {
    onSave(Number(income || 0), Number(expense || 0));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("budget.budgetParameters")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t("budget.incomePlan")}
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t("budget.planExpenses")}
            </label>
            <input
              type="number"
              value={expense}
              onChange={(e) => setExpense(e.target.value)}
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            Сохранить
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const IncomeDialog = ({
  open,
  onOpenChange,
  incomeItems,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeItems: { category: string; plannedAmount: number }[];
  onSave: (category: string, amount: number) => void;
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState(incomeCategories[0]);
  const [amount, setAmount] = useState("");

  // Обновляем значения при открытии диалога
  useEffect(() => {
    if (open) {
      const existingItem = incomeItems.find(item => item.category === category);
      setAmount(existingItem ? existingItem.plannedAmount.toString() : "");
    }
  }, [open, category, incomeItems]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const existingItem = incomeItems.find(item => item.category === newCategory);
    setAmount(existingItem ? existingItem.plannedAmount.toString() : "");
  };

  const handleSave = () => {
    if (!amount || Number(amount) < 0) return;
    onSave(category, Number(amount));
    setAmount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("budget.incomePlanByCategoryTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t("budget.category")}
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
            >
              {incomeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t("budget.amount")}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            {t("budget.save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ExpenseLimitDialog = ({
  open,
  onOpenChange,
  expenseLimits,
  editingLimit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseLimits: { category: string; limitAmount: number }[];
  editingLimit?: { category: string; amount: number } | null;
  onSave: (category: string, amount: number) => void;
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState(expenseCategories[0]);
  const [amount, setAmount] = useState("");

  // Обновляем значения при открытии диалога
  useEffect(() => {
    if (open) {
      // Если редактируем существующий лимит - используем его значения
      if (editingLimit) {
        setCategory(editingLimit.category);
        setAmount(editingLimit.amount.toString());
      } else {
        setCategory(expenseCategories[0]);
        setAmount("");
      }
    }
  }, [open, editingLimit]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const existingItem = expenseLimits.find(item => item.category === newCategory);
    setAmount(existingItem ? existingItem.limitAmount.toString() : "");
  };

  const handleSave = () => {
    if (!amount || Number(amount) < 0) return;
    onSave(category, Number(amount));
    setAmount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("budget.expenseLimitByCategoryTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t("budget.category")}
            </label>
            <select
              value={editingLimit ? editingLimit.category : category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
              disabled={!!editingLimit}
            >
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t("budget.limit")}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-2xl input-bg px-4 py-3 text-sm outline-none"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            {t("budget.save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Budget;
