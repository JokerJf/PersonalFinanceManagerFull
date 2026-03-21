import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApp, Debt, Credit } from "@/context/AppContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Check, CreditCard, CalendarDays, Minus, Pencil, Trash2, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { debtsApi, creditsApi } from "@/api/api";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DebtTab = "owe" | "owed";
type MainTab = "debts" | "credits";

const formatMoney = (amount: number, currency: string) => {
  if (currency === "UZS") {
    return `${Math.round(amount).toLocaleString("en-US")} сум`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Получить локальную дату в формате YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split("T")[0];
};

// Формат даты и времени для DateTimePicker
const formatLocalDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const addMonthsToDate = (dateString: string, months: number) => {
  if (!dateString) return "";
  // Извлекаем только дату из формата YYYY-MM-DDTHH:mm
  const datePart = dateString.split("T")[0];
  const date = new Date(datePart);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
};

const calcMonthlyPayment = (totalAmount: number, months: number) => {
  if (!months || months <= 0) return 0;
  return totalAmount / months;
};

const Debts = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { debts, setDebts, credits, setCredits, isLoadingData, workspace, refreshData } = useApp();

  useEffect(() => {
    refreshData();
  }, []);

  const [mainTab, setMainTab] = useState<MainTab>("debts");
  const [debtTab, setDebtTab] = useState<DebtTab>("owe");

  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddCredit, setShowAddCredit] = useState(false);

  // debt form
  const [debtName, setDebtName] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtCurrency, setDebtCurrency] = useState("USD");
  const [debtType, setDebtType] = useState<"owe" | "owed">("owe");
  const [debtDesc, setDebtDesc] = useState("");

  // edit debt state
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [showEditDebt, setShowEditDebt] = useState(false);
  const [editDebtName, setEditDebtName] = useState("");
  const [editDebtAmount, setEditDebtAmount] = useState("");
  const [editDebtCurrency, setEditDebtCurrency] = useState("USD");
  const [editDebtType, setEditDebtType] = useState<"owe" | "owed">("owe");
  const [editDebtDesc, setEditDebtDesc] = useState("");

  // credit form
  const [creditTitle, setCreditTitle] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditCurrency, setCreditCurrency] = useState("USD");
  const [creditKind, setCreditKind] = useState<"credit" | "installment">("credit");
  const [creditMonths, setCreditMonths] = useState("5");
  const [creditStartDate, setCreditStartDate] = useState(formatLocalDateTime(new Date()));
  const [creditDesc, setCreditDesc] = useState("");

  // edit credit state
  const [editCredit, setEditCredit] = useState<Credit | null>(null);
  const [showEditCredit, setShowEditCredit] = useState(false);
  const [editCreditTitle, setEditCreditTitle] = useState("");
  const [editCreditAmount, setEditCreditAmount] = useState("");
  const [editCreditCurrency, setEditCreditCurrency] = useState("USD");
  const [editCreditKind, setEditCreditKind] = useState<"credit" | "installment">("credit");
  const [editCreditMonths, setEditCreditMonths] = useState("");
  const [editCreditStartDate, setEditCreditStartDate] = useState("");
  const [editCreditDesc, setEditCreditDesc] = useState("");

  const filteredDebts = debts.filter((d) => d.type === debtTab);
  const openDebts = filteredDebts.filter((d) => d.status === "open");
  const closedDebts = filteredDebts.filter((d) => d.status === "closed");
  
  // Группировка сумм по валюте для отображения без конвертации
  const totalByCurrency = openDebts.reduce((acc, d) => {
    if (!acc[d.currency]) {
      acc[d.currency] = 0;
    }
    acc[d.currency] += d.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const totalOpenDebts = openDebts.reduce((sum, d) => sum + d.amount, 0);

  const activeCredits = credits.filter((c) => c.status === "active");
  const closedCredits = credits.filter((c) => c.status === "closed");

  // Группировка сумм кредитов по валюте
  const creditBalanceByCurrency = activeCredits.reduce((acc, credit) => {
    const monthlyPayment = calcMonthlyPayment(credit.totalAmount, credit.months);
    const remainingPayments = Math.max(credit.months - credit.paidInstallments, 0);
    const remainingAmount = monthlyPayment * remainingPayments;
    
    if (!acc[credit.currency]) {
      acc[credit.currency] = 0;
    }
    acc[credit.currency] += remainingAmount;
    return acc;
  }, {} as Record<string, number>);

  const totalCreditBalance = useMemo(() => {
    return activeCredits.reduce((sum, credit) => {
      const monthlyPayment = calcMonthlyPayment(credit.totalAmount, credit.months);
      const remainingPayments = Math.max(credit.months - credit.paidInstallments, 0);
      return sum + monthlyPayment * remainingPayments;
    }, 0);
  }, [activeCredits]);

  const openEditDebt = (debt: Debt) => {
    setEditDebt(debt);
    setEditDebtName(debt.name);
    setEditDebtAmount(String(debt.amount));
    setEditDebtCurrency(debt.currency);
    setEditDebtType(debt.type);
    setEditDebtDesc(debt.description || "");
    setShowEditDebt(true);
  };

  const handleEditDebt = async () => {
    if (!editDebt) return;
    if (!editDebtName.trim() || !editDebtAmount || Number(editDebtAmount) <= 0) {
      toast({
        title: t("debts.error"),
        description: t("debts.fillDebtFields"),
      });
      return;
    }

    try {
      const updatedDebtData = {
        name: editDebtName.trim(),
        amount: Number(editDebtAmount),
        currency: editDebtCurrency,
        type: editDebtType,
        description: editDebtDesc.trim() || undefined,
      };

      const updatedDebt = await debtsApi.updateDebt(String(editDebt.id), updatedDebtData, workspace);
      
      const debtWithStringId: Debt = {
        ...updatedDebt,
        id: String(updatedDebt.id),
        status: editDebt.status,
        date: editDebt.date,
      };

      setDebts(debts.map(d => d.id === editDebt.id ? debtWithStringId : d));
      setShowEditDebt(false);
      setEditDebt(null);

      toast({
        title: t("debts.debtUpdated"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteDebt = async (id: string) => {
    try {
      await debtsApi.deleteDebt(id, workspace);
      setDebts(debts.filter(d => d.id !== id));
      toast({
        title: t("debts.debtDeleted"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const markDebtClosed = async (id: string) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    
    try {
      const updatedDebt = await debtsApi.updateDebt(String(id), { status: "closed" }, workspace);
      const debtWithStringId: Debt = {
        ...updatedDebt,
        id: String(updatedDebt.id),
        type: debt.type,
        currency: debt.currency,
        date: debt.date,
      };
      setDebts(debts.map(d => d.id === id ? debtWithStringId : d));

      toast({
        title: t("debts.debtClosed"),
        description: t("debts.debtClosedDesc"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleAddDebt = async () => {
    if (!debtName.trim() || !debtAmount || Number(debtAmount) <= 0) {
      toast({
        title: t("debts.error"),
        description: t("debts.fillDebtFields"),
      });
      return;
    }

    try {
      const newDebtData = {
        name: debtName.trim(),
        amount: Number(debtAmount),
        currency: debtCurrency,
        type: debtType,
        status: "open" as const,
        date: getLocalDateString(),
        description: debtDesc.trim() || undefined,
      };

      const createdDebt = await debtsApi.createDebt(newDebtData, workspace);
      
      // Convert numeric id to string for frontend
      const debtWithStringId: Debt = {
        ...createdDebt,
        id: String(createdDebt.id),
      };

      setDebts([debtWithStringId, ...debts]);
      setShowAddDebt(false);
      setDebtName("");
      setDebtAmount("");
      setDebtDesc("");

      toast({
        title: t("debts.debtAdded"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleAddCredit = async () => {
    const totalAmount = Number(creditAmount);
    const months = Number(creditMonths);

    if (!creditTitle.trim() || !totalAmount || totalAmount <= 0 || !months || months <= 0 || !creditStartDate) {
      toast({
        title: t("debts.error"),
        description: t("debts.fillCreditFields"),
      });
      return;
    }

    try {
      const newCreditData = {
        title: creditTitle.trim(),
        totalAmount,
        currency: creditCurrency,
        kind: creditKind,
        startDate: creditStartDate.split("T")[0], // Отправляем только дату
        endDate: addMonthsToDate(creditStartDate, months),
        months,
        paidInstallments: 0,
        status: "active" as const,
        description: creditDesc.trim() || undefined,
      };

      const createdCredit = await creditsApi.createCredit(newCreditData);
      
      // Convert numeric id to string for frontend
      const creditWithStringId: Credit = {
        ...createdCredit,
        id: String(createdCredit.id),
      };

      setCredits([creditWithStringId, ...credits]);
      setShowAddCredit(false);

      setCreditTitle("");
      setCreditAmount("");
      setCreditCurrency("USD");
      setCreditKind("credit");
      setCreditMonths("5");
      setCreditStartDate(formatLocalDateTime(new Date()));
      setCreditDesc("");

      toast({
        title: t("debts.addCredit"),
        description: t("debts.createdPaymentPlan"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const updatePaidInstallments = async (id: string, delta: number) => {
    const credit = credits.find(c => c.id === id);
    if (!credit) return;

    const nextPaid = Math.min(Math.max(credit.paidInstallments + delta, 0), credit.months);
    const newStatus = nextPaid >= credit.months ? "closed" : "active";

    try {
      await creditsApi.updateCredit(String(id), {
        paidInstallments: nextPaid,
        status: newStatus,
      });

      setCredits(
        credits.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            paidInstallments: nextPaid,
            status: newStatus,
          };
        })
      );
    } catch (error) {
      // Fallback: обновляем локально даже при ошибке
      setCredits(
        credits.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            paidInstallments: nextPaid,
            status: newStatus,
          };
        })
      );
    }
  };

  const openEditCredit = (credit: Credit) => {
    setEditCredit(credit);
    setEditCreditTitle(credit.title);
    setEditCreditAmount(String(credit.totalAmount));
    setEditCreditCurrency(credit.currency);
    setEditCreditKind(credit.kind);
    setEditCreditMonths(String(credit.months));
    // Форматируем дату для DateTimePicker
    if (credit.startDate) {
      const date = new Date(credit.startDate);
      setEditCreditStartDate(formatLocalDateTime(date));
    } else {
      setEditCreditStartDate(formatLocalDateTime(new Date()));
    }
    setEditCreditDesc(credit.description || "");
    setShowEditCredit(true);
  };

  const handleEditCredit = async () => {
    if (!editCredit) return;
    if (!editCreditTitle.trim() || !editCreditAmount || Number(editCreditAmount) <= 0) {
      toast({
        title: t("debts.error"),
        description: t("debts.fillCreditFields"),
      });
      return;
    }

    try {
      const months = Number(editCreditMonths);
      const updatedCreditData = {
        title: editCreditTitle.trim(),
        totalAmount: Number(editCreditAmount),
        currency: editCreditCurrency,
        kind: editCreditKind,
        months: months,
        startDate: editCreditStartDate.split("T")[0], // Отправляем только дату
        endDate: addMonthsToDate(editCreditStartDate, months),
        description: editCreditDesc.trim() || undefined,
      };

      const updatedCredit = await creditsApi.updateCredit(String(editCredit.id), updatedCreditData);
      
      const creditWithStringId: Credit = {
        ...updatedCredit,
        id: String(updatedCredit.id),
        paidInstallments: editCredit.paidInstallments,
        status: editCredit.status,
      };

      setCredits(credits.map(c => c.id === editCredit.id ? creditWithStringId : c));
      setShowEditCredit(false);
      setEditCredit(null);

      toast({
        title: t("debts.creditUpdated"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteCredit = async (id: string) => {
    try {
      await creditsApi.deleteCredit(id);
      setCredits(credits.filter(c => c.id !== id));
      toast({
        title: t("debts.creditDeleted"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: String(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{t("debts.title")}</h1>
        </div>

        {!isLoadingData && (
          <button
            onClick={() => {
              if (mainTab === "debts") {
                // Устанавливаем тип долга в зависимости от текущего таба
                setDebtType(debtTab);
                setDebtName("");
                setDebtAmount("");
                setDebtDesc("");
                setDebtCurrency("USD");
                setShowAddDebt(true);
              } else {
                // Для кредитов - сбрасываем форму и открываем модальное окно
                setCreditTitle("");
                setCreditAmount("");
                setCreditCurrency("USD");
                setCreditKind("credit");
                setCreditMonths("5");
                setCreditStartDate(formatLocalDateTime(new Date()));
                setCreditDesc("");
                setShowAddCredit(true);
              }
            }}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* main tabs */}
      {isLoadingData ? (
        <Skeleton className="h-12 w-full rounded-2xl" />
      ) : (
        <div className="flex rounded-2xl p-1 gap-1 shadow-sm">
          {[
            { key: "debts" as MainTab, label: t("debts.debtsTab") },
            { key: "credits" as MainTab, label: t("debts.creditsTab") },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                mainTab === tab.key ? "tab-active" : "tab-inactive"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* DEBTS */}
      {mainTab === "debts" && (
        <>
          {isLoadingData ? (
            <Skeleton className="h-12 w-full rounded-2xl" />
          ) : (
            <div className="flex rounded-2xl p-1 gap-1 shadow-sm">
              {[
                { key: "owe" as DebtTab, label: t("debts.iOwe") },
                { key: "owed" as DebtTab, label: t("debts.owedToMe") },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDebtTab(tab.key)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    debtTab === tab.key ? "tab-active" : "tab-inactive"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {isLoadingData ? (
            <Skeleton className="h-24 w-full rounded-3xl" />
          ) : (
            <div className="fintech-card-elevated text-center py-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {debtTab === "owe" ? t("debts.totalIOwe") : t("debts.totalOwedToMe")}
              </p>
              <div className="space-y-1">
                {Object.entries(totalByCurrency).length > 0 ? (
                  Object.entries(totalByCurrency).map(([currency, amount]) => (
                    <p key={currency} className={`text-2xl font-bold ${debtTab === "owe" ? "text-destructive" : "text-success"}`}>
                      {formatMoney(amount, currency)}
                    </p>
                  ))
                ) : (
                  <p className={`text-2xl font-bold ${debtTab === "owe" ? "text-destructive" : "text-success"}`}>
                    {formatMoney(0, "USD")}
                  </p>
                )}
              </div>
            </div>
          )}

          {isLoadingData ? (
            <div>
              <Skeleton className="h-6 w-16 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            </div>
          ) : openDebts.length > 0 ? (
            <div>
              <h2 className="section-title mb-3">{t("debts.open")}</h2>
              <div className="space-y-2">
                {openDebts.map((d) => (
                  <div key={d.id} className="fintech-card flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-xl secondary-bg flex items-center justify-center text-lg font-bold text-primary">
                      {d.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.date}
                        {d.description ? ` · ${d.description}` : ""}
                      </p>
                    </div>

                    <p className={`text-sm font-semibold ${debtTab === "owe" ? "text-destructive" : "text-success"}`}>
                      {formatMoney(d.amount, d.currency)}
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDebt(d)}
                        className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-primary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(d.id)}
                        className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => markDebtClosed(d.id)}
                        className="p-1.5 rounded-lg bg-success/10 text-success"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!isLoadingData && closedDebts.length > 0 && (
            <div>
              <h2 className="section-title mb-3">{t("debts.closed")}</h2>
              <div className="space-y-2">
                {closedDebts.map((d) => (
                  <div key={d.id} className="fintech-card flex items-center gap-3 py-3 opacity-50">
                    <div className="w-10 h-10 rounded-xl secondary-bg flex items-center justify-center text-lg font-bold">
                      {d.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-through">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.date}
                        {d.description ? ` · ${d.description}` : ""}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-muted-foreground">
                      {formatMoney(d.amount, d.currency)}
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDebt(d)}
                        className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-primary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(d.id)}
                        className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoadingData && openDebts.length === 0 && closedDebts.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">{t("debts.noDebts")}</p>
            </div>
          )}
        </>
      )}

      {/* CREDITS */}
      {mainTab === "credits" && (
        <>
          {isLoadingData ? (
            <Skeleton className="h-24 w-full rounded-3xl" />
          ) : (
            <div className="fintech-card-elevated py-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={18} className="text-primary" />
                <p className="text-sm font-semibold">{t("debts.active")}</p>
              </div>

              <div className="space-y-1">
                {Object.entries(creditBalanceByCurrency).length > 0 ? (
                  Object.entries(creditBalanceByCurrency).map(([currency, amount]) => (
                    <p key={currency} className="text-2xl font-bold text-destructive">
                      {formatMoney(amount, currency)}
                    </p>
                  ))
                ) : (
                  <p className="text-2xl font-bold text-destructive">
                    {formatMoney(0, "USD")}
                  </p>
                )}
              </div>
            </div>
          )}

          {!isLoadingData && activeCredits.length > 0 && (
            <div>
              <h2 className="section-title mb-3">{t("debts.active")}</h2>
              <div className="space-y-3">
                {activeCredits.map((credit) => {
                  const monthlyPayment = calcMonthlyPayment(credit.totalAmount, credit.months);
                  const remainingPayments = Math.max(credit.months - credit.paidInstallments, 0);
                  const remainingAmount = monthlyPayment * remainingPayments;
                  const progress = (credit.paidInstallments / credit.months) * 100;

                  return (
                    <div key={credit.id} className="fintech-card space-y-3 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl secondary-bg flex items-center justify-center text-primary">
                          <CalendarDays size={18} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{credit.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {credit.kind === "credit" ? t("debts.credit") : t("debts.installment")}
                                {credit.description ? ` · ${credit.description}` : ""}
                              </p>
                            </div>

                            <p className="text-sm font-semibold text-destructive">
                              {formatMoney(remainingAmount, credit.currency)}
                            </p>
                          </div>

                          <div className="mt-2 text-xs text-muted-foreground space-y-1">
                            <p>
                              {t("debts.period")}: {credit.startDate} → {credit.endDate}
                            </p>
                            <p>
                              {t("debts.monthlyPayment")}: {formatMoney(monthlyPayment, credit.currency)}
                            </p>
                            <p>
                              {t("debts.paid")}: {credit.paidInstallments} / {credit.months}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditCredit(credit)}
                            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-primary"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCredit(credit.id)}
                            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => updatePaidInstallments(credit.id, -1)}
                            className="flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl secondary-bg text-[10px] sm:text-sm whitespace-nowrap"
                          >
                            <Minus size={12} sm:size={14} />
                            <span className="hidden xs:inline">{t("debts.removePayment")}</span>
                          </button>

                          <button
                            onClick={() => updatePaidInstallments(credit.id, 1)}
                            className="flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-primary text-primary-foreground text-[10px] sm:text-sm font-semibold whitespace-nowrap"
                          >
                            <Check size={12} sm:size={14} />
                            <span className="hidden xs:inline">{t("debts.markPayment")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isLoadingData && closedCredits.length > 0 && (
            <div>
              <h2 className="section-title mb-3">{t("debts.closed")}</h2>
              <div className="space-y-2">
                {closedCredits.map((credit) => (
                  <div key={credit.id} className="fintech-card py-3 opacity-60">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium line-through">{credit.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {credit.kind === "credit" ? t("debts.credit") : t("debts.installment")} · {credit.months}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-success">{t("debts.closedStatus")}</p>
                        <button
                          onClick={() => openEditCredit(credit)}
                          className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-primary"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCredit(credit.id)}
                          className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoadingData && activeCredits.length === 0 && closedCredits.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">{t("debts.noCredits")}</p>
            </div>
          )}
        </>
      )}

      {/* ADD DEBT MODAL */}
      <Dialog open={showAddDebt} onOpenChange={setShowAddDebt}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)]">
          <DialogHeader>
            <DialogTitle>{t("debts.addDebt")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex rounded-2xl p-1 gap-1 shadow-sm">
              {(["owe", "owed"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDebtType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    debtType === type ? "tab-active" : "tab-inactive"
                  }`}
                >
                  {type === "owe" ? t("debts.iOwe") : t("debts.owedToMe")}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.personName")}
              </label>
              <input
                value={debtName}
                onChange={(e) => setDebtName(e.target.value)}
                placeholder={t("debts.personName")}
                className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.amount")}
              </label>
              <input
                type="number"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.currency")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["USD", "UZS", "EUR"].map((currency) => (
                  <button
                    key={currency}
                    onClick={() => setDebtCurrency(currency)}
                    className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                      debtCurrency === currency
                        ? "bg-primary text-primary-foreground"
                        : "secondary-bg text-muted-foreground"
                    }`}
                  >
                    {currency}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.optionalDescription")}
              </label>
              <input
                value={debtDesc}
                onChange={(e) => setDebtDesc(e.target.value)}
                placeholder={t("debts.description")}
                className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <button
              onClick={handleAddDebt}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              {t("debts.addDebt")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD CREDIT MODAL */}
      <Dialog open={showAddCredit} onOpenChange={setShowAddCredit}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)]">
          <DialogHeader>
            <DialogTitle>{t("debts.addCredit")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex rounded-2xl p-1 gap-1 shadow-sm">
              {(["credit", "installment"] as const).map((kind) => (
                <button
                  key={kind}
                  onClick={() => setCreditKind(kind)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    creditKind === kind ? "tab-active" : "tab-inactive"
                  }`}
                >
                  {kind === "credit" ? t("debts.credit") : t("debts.installment")}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.titleLabel")}
              </label>
              <input
                value={creditTitle}
                onChange={(e) => setCreditTitle(e.target.value)}
                placeholder={t("debts.titleLabel")}
                className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Валюта (слева) и Сумма (справа) в одной строке */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {t("debts.currency")}
                </label>
                <Select 
                  value={creditCurrency} 
                  onValueChange={(value) => setCreditCurrency(value)}
                >
                  <SelectTrigger className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
                    <SelectValue placeholder="Валюта" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="UZS">UZS</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {t("debts.totalAmount")}
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {/* Дата начала (слева) и Срок в месяцах (справа) в одной строке */}
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
              <div className="col-span-7">
                <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 block">
                  {t("debts.startDate")}
                </label>
                <DateTimePicker
                  value={creditStartDate}
                  onChange={setCreditStartDate}
                />
              </div>
              <div className="col-span-3">
                <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 block">
                  {t("debts.months")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={creditMonths}
                  onChange={(e) => setCreditMonths(e.target.value)}
                  placeholder="5"
                  className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-primary outline-none h-[38px] sm:h-[42px]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.optionalDescription")}
              </label>
              <input
                value={creditDesc}
                onChange={(e) => setCreditDesc(e.target.value)}
                placeholder={t("debts.description")}
                className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <button
              onClick={handleAddCredit}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              {t("debts.addCredit")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT DEBT MODAL */}
      <Dialog open={showEditDebt} onOpenChange={setShowEditDebt}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)]">
          <DialogHeader>
            <DialogTitle>{t("debts.editDebt")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex rounded-2xl p-1 gap-1 shadow-sm">
              {(["owe", "owed"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setEditDebtType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    editDebtType === type ? "tab-active" : "tab-inactive"
                  }`}
                >
                  {type === "owe" ? t("debts.iOwe") : t("debts.owedToMe")}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.personName")}
              </label>
              <input
                value={editDebtName}
                onChange={(e) => setEditDebtName(e.target.value)}
                placeholder={t("debts.personName")}
                className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.amount")}
              </label>
              <input
                type="number"
                value={editDebtAmount}
                onChange={(e) => setEditDebtAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.currency")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["USD", "UZS", "EUR"].map((currency) => (
                  <button
                    key={currency}
                    onClick={() => setEditDebtCurrency(currency)}
                    className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                      editDebtCurrency === currency
                        ? "bg-primary text-primary-foreground"
                        : "secondary-bg text-muted-foreground"
                    }`}
                  >
                    {currency}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.optionalDescription")}
              </label>
              <input
                value={editDebtDesc}
                onChange={(e) => setEditDebtDesc(e.target.value)}
                placeholder={t("debts.description")}
                className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowEditDebt(false);
                  setEditDebt(null);
                }}
                className="flex-1 py-3 rounded-xl secondary-bg font-semibold text-sm"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleEditDebt}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT CREDIT MODAL */}
      <Dialog open={showEditCredit} onOpenChange={setShowEditCredit}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)]">
          <DialogHeader>
            <DialogTitle>{t("debts.editCredit")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex rounded-2xl p-1 gap-1 shadow-sm">
              {(["credit", "installment"] as const).map((kind) => (
                <button
                  key={kind}
                  onClick={() => setEditCreditKind(kind)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    editCreditKind === kind ? "tab-active" : "tab-inactive"
                  }`}
                >
                  {kind === "credit" ? t("debts.credit") : t("debts.installment")}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.titleLabel")}
              </label>
              <input
                value={editCreditTitle}
                onChange={(e) => setEditCreditTitle(e.target.value)}
                placeholder={t("debts.titleLabel")}
                className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Валюта (слева) и Сумма (справа) в одной строке */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {t("debts.currency")}
                </label>
                <Select 
                  value={editCreditCurrency} 
                  onValueChange={(value) => setEditCreditCurrency(value)}
                >
                  <SelectTrigger className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
                    <SelectValue placeholder="Валюта" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="UZS">UZS</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {t("debts.totalAmount")}
                </label>
                <input
                  type="number"
                  value={editCreditAmount}
                  onChange={(e) => setEditCreditAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {/* Дата начала (слева) и Срок в месяцах (справа) в одной строке */}
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
              <div className="col-span-7">
                <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 block">
                  {t("debts.startDate")}
                </label>
                <DateTimePicker
                  value={editCreditStartDate}
                  onChange={setEditCreditStartDate}
                />
              </div>
              <div className="col-span-3">
                <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 block">
                  {t("debts.months")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={editCreditMonths}
                  onChange={(e) => setEditCreditMonths(e.target.value)}
                  placeholder="5"
                  className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-primary outline-none h-[38px] sm:h-[42px]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("debts.optionalDescription")}
              </label>
              <input
                value={editCreditDesc}
                onChange={(e) => setEditCreditDesc(e.target.value)}
                placeholder={t("debts.description")}
                className="w-full rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowEditCredit(false);
                  setEditCredit(null);
                }}
                className="flex-1 py-3 rounded-xl secondary-bg font-semibold text-sm"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleEditCredit}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debts;