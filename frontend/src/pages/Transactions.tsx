import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApp, Transaction } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ChevronDown } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";

type Filter = "all" | "expense" | "income" | "transfer";

const Transactions = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

const {
  transactions,
  selectedTransactionId,
  setSelectedTransactionId,
  setAddTransactionModalOpen,
  accounts,
  isLoadingData,
  refreshData,
  language,
} = useApp();

  const [filter, setFilter] = useState<Filter>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("transactions.filters.all") },
    { key: "expense", label: t("transactions.filters.expense") },
    { key: "income", label: t("transactions.filters.income") },
    { key: "transfer", label: t("transactions.filters.transfer") },
  ];

  useEffect(() => {
    refreshData();
  }, []);

  const filtered =
    filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const accountFiltered =
    selectedAccountId === "all"
      ? filtered
      : filtered.filter((t) => t.accountId === selectedAccountId);

  const sorted = [...accountFiltered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const grouped = sorted.reduce<Record<string, typeof transactions>>((acc, tx) => {
    (acc[tx.date] = acc[tx.date] || []).push(tx);
    return acc;
  }, {});

  const formatAmount = (tx: Transaction) => {
    const prefix = tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "";

    if (tx.currency === "UZS") {
      return `${prefix}${tx.amount.toLocaleString("en-US")} ${t("transactions.currency.uzs")}`;
    }

    return `${prefix}$${tx.amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`;
  };

  const formatConvertedAmount = (tx: Transaction) => {
    if (!tx.toCurrency || tx.toCurrency === tx.currency) return null;

    if (tx.toCurrency === "UZS") {
      return `→ ${tx.toAmount?.toLocaleString("en-US")} ${t("transactions.currency.uzs")}`;
    }

    return `→ ${tx.toAmount?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`;
  };

  const handleTransactionClick = (id: string) => {
    setSelectedTransactionId(id);
  };

  const getSelectedAccountLabel = () => {
    if (selectedAccountId === "all") return t("transactions.filters.allAccounts");
    return accounts.find((a) => a.id === selectedAccountId)?.name;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{t("transactions.title")}</h1>

        {!isLoadingData && (
          <button
            onClick={() => {
              if (accounts.length === 0) {
                toast({
                  title: t("common.error"),
                  description: t("dashboard.toasts.noAccounts"),
                });
                return;
              }
              // Для перевода нужно минимум 2 счёта - проверка будет в модале
              setAddTransactionModalOpen(true);
            }}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {isLoadingData ? (
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-12 flex-1 rounded-2xl" />
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Account Filter */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full btn-secondary rounded-2xl py-3 px-4 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {getSelectedAccountLabel()}
              </span>
              <ChevronDown
                size={18}
                className={`transition-transform shrink-0 ml-2 ${showFilters ? "rotate-180" : ""}`}
              />
            </button>

            {showFilters && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0d1017] border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg z-10 overflow-hidden max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedAccountId("all");
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm ${
                    selectedAccountId === "all"
                      ? "bg-primary/10 text-primary"
                      : "text-slate-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2f3c4d]"
                  }`}
                >
                  {t("transactions.filters.allAccounts")}
                </button>

                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccountId(account.id);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm ${
                      selectedAccountId === account.id
                        ? "bg-primary/10 text-primary"
                        : "text-slate-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2f3c4d]"
                    }`}
                  >
                    {account.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type Filter */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowTypeFilter(!showTypeFilter)}
              className="w-full btn-secondary rounded-2xl py-3 px-4 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                {filters.find((f) => f.key === filter)?.label}
              </span>
              <ChevronDown
                size={18}
                className={`transition-transform shrink-0 ml-2 ${showTypeFilter ? "rotate-180" : ""}`}
              />
            </button>

            {showTypeFilter && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0d1017] border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg z-10 overflow-hidden">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`w-full text-left px-4 py-2.5 text-sm capitalize ${
                      filter === f.key
                        ? "bg-primary/10 text-primary"
                        : "text-slate-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2f3c4d]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isLoadingData ? (
        <div className="space-y-5">
          <Skeleton className="h-6 w-48 mb-2" />
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">
                {new Date(date).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Tashkent",
                })}
              </p>

              <div className="space-y-2">
                {txs.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => handleTransactionClick(tx.id)}
                    className="rounded-2xl border border-border/30 flex items-center gap-3 py-3 cursor-pointer active:scale-[0.98] transition-transform px-4 card-container"
                  >
                    <CategoryIcon icon={tx.icon} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>

                      {tx.note && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {tx.note}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {tx.category} · {tx.accountName}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          tx.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : tx.type === "expense"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        {formatAmount(tx)}
                      </p>

                      {tx.toCurrency && tx.toCurrency !== tx.currency && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatConvertedAmount(tx)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoadingData && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">
            {t("transactions.noTransactions")}
          </p>
        </div>
      )}
    </div>
  );
};

export default Transactions;