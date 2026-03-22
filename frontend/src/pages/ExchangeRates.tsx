import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Символы валют для отображения флагов/иконок
const CURRENCY_META: Record<string, { symbol: string; flag: string; name: string }> = {
  USD: { symbol: "$",    flag: "🇺🇸", name: "US Dollar"       },
  EUR: { symbol: "€",    flag: "🇪🇺", name: "Euro"            },
  RUB: { symbol: "₽",    flag: "🇷🇺", name: "Российский рубль"},
  GBP: { symbol: "£",    flag: "🇬🇧", name: "British Pound"   },
  UZS: { symbol: "сум", flag: "🇺🇿", name: "Ўзбек сўм"       },
  KZT: { symbol: "₸",    flag: "🇰🇿", name: "Қазақ теңгесі"  },
  TRY: { symbol: "₺",    flag: "🇹🇷", name: "Türk lirası"     },
  JPY: { symbol: "¥",    flag: "🇯🇵", name: "Japanese Yen"    },
  CNY: { symbol: "¥",    flag: "🇨🇳", name: "Chinese Yuan"    },
  AED: { symbol: "د.إ",  flag: "🇦🇪", name: "UAE Dirham"      },
};

const getCurrencyMeta = (code: string) =>
  CURRENCY_META[code] ?? { symbol: code, flag: "💱", name: code };

const formatRate = (rate: number, toCurrency: string): string => {
  const meta = getCurrencyMeta(toCurrency);
  if (toCurrency === "UZS") {
    return `${Math.round(rate).toLocaleString("en-US")} сум`;
  }
  return `${rate.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })} ${meta.symbol}`;
};

const ExchangeRates = () => {
  const { t } = useTranslation();
  const { exchangeRates, availableCurrencies, isLoadingExchangeRates, refreshExchangeRates } = useApp();
  const navigate = useNavigate();

  const currencies = availableCurrencies.length > 0 ? availableCurrencies : ["USD", "UZS", "RUB"];

  const [fromCurrency, setFromCurrency] = useState(currencies[0] || "USD");
  const [toCurrency, setToCurrency]     = useState(currencies[1] || currencies[0] || "UZS");
  const [amount, setAmount]             = useState("1");
  const [refreshing, setRefreshing]     = useState(false);

  useEffect(() => {
    if (availableCurrencies.length > 0) {
      if (!availableCurrencies.includes(fromCurrency)) setFromCurrency(availableCurrencies[0]);
      if (!availableCurrencies.includes(toCurrency))   setToCurrency(availableCurrencies[1] || availableCurrencies[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCurrencies]);

  useEffect(() => { refreshExchangeRates(); }, []);

  const getRate = (from: string, to: string): number => {
    if (from === to) return 1;
    const direct = exchangeRates.find(e => e.from === from && e.to === to && e.from !== e.to);
    if (direct) return direct.rate;
    const reverse = exchangeRates.find(e => e.from === to && e.to === from && e.from !== e.to);
    if (reverse && reverse.rate > 0) return 1 / reverse.rate;
    return 0;
  };

  const rate      = getRate(fromCurrency, toCurrency);
  const converted = parseFloat(amount || "0") * rate;

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshExchangeRates();
    setRefreshing(false);
  };

  const baseRates = currencies
    .filter((c, i, self) => c !== fromCurrency && self.indexOf(c) === i)
    .map(c => ({ currency: c, rate: getRate(fromCurrency, c) }))
    .filter(r => r.rate > 0);

  const fromMeta = getCurrencyMeta(fromCurrency);
  const toMeta   = getCurrencyMeta(toCurrency);

  return (
    <div className="space-y-4 animate-fade-in px-0">

      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full secondary-bg flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-base font-bold leading-tight truncate">
          {t("exchangeRates.title")}
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing || isLoadingExchangeRates}
          className="ml-auto w-8 h-8 rounded-full secondary-bg flex items-center justify-center shrink-0 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Converter card */}
      {isLoadingExchangeRates ? (
        <div className="fintech-card-elevated space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-full mx-auto" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      ) : (
        <div className="fintech-card-elevated space-y-3">

          {/* FROM row */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              {t("exchangeRates.from")}
            </label>
            <div className="flex gap-2 items-stretch">
              {/* Amount input */}
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="min-w-0 flex-1 rounded-xl input-bg text-slate-900 dark:text-white
                           px-3 py-3 text-base font-bold focus:ring-2 focus:ring-primary
                           outline-none w-0"
                placeholder="0"
              />
              {/* Currency select */}
              <select
                value={fromCurrency}
                onChange={e => setFromCurrency(e.target.value)}
                className="rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0
                           px-2 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary
                           outline-none shrink-0 max-w-[72px]"
              >
                {currencies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {/* Currency label under input */}
            <p className="text-[10px] text-muted-foreground mt-1 ml-1">
              {fromMeta.flag} {fromMeta.name}
            </p>
          </div>

          {/* Swap button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border/40" />
            <button
              onClick={swap}
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center
                         text-primary hover:bg-primary/20 active:scale-95 transition-all shrink-0"
            >
              <ArrowLeftRight size={14} />
            </button>
            <div className="flex-1 h-px bg-border/40" />
          </div>

          {/* TO row */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              {t("exchangeRates.to")}
            </label>
            <div className="flex gap-2 items-stretch">
              {/* Result display */}
              <div className="min-w-0 flex-1 rounded-xl input-bg text-slate-900 dark:text-white
                              px-3 py-3 text-base font-bold w-0 overflow-hidden">
                <span className="block truncate">
                  {converted.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {/* Currency select */}
              <select
                value={toCurrency}
                onChange={e => setToCurrency(e.target.value)}
                className="rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0
                           px-2 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary
                           outline-none shrink-0 max-w-[72px]"
              >
                {currencies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {/* Currency label under result */}
            <p className="text-[10px] text-muted-foreground mt-1 ml-1">
              {toMeta.flag} {toMeta.name}
            </p>
          </div>

          {/* Rate hint */}
          <div className="rounded-xl bg-primary/5 px-3 py-2 text-center">
            <p className="text-[11px] text-muted-foreground leading-snug">
              1 {fromCurrency}{" "}
              <span className="text-muted-foreground/60">=</span>{" "}
              <span className="font-semibold text-foreground">
                {formatRate(rate, toCurrency)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Rate table */}
      {isLoadingExchangeRates ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div>
          <h2 className="section-title mb-2">
            {t("exchangeRates.ratesFor")} 1 {fromCurrency}
          </h2>

          <div className="space-y-2">
            {baseRates.map(r => {
              const meta = getCurrencyMeta(r.currency);
              return (
                <div
                  key={r.currency}
                  className="fintech-card flex items-center gap-2 py-2.5 cursor-pointer
                             active:scale-[0.98] transition-transform"
                  onClick={() => { setToCurrency(r.currency); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  {/* Flag */}
                  <span className="text-xl shrink-0 w-7 text-center">{meta.flag}</span>

                  {/* Currency info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-none truncate">{r.currency}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{meta.name}</p>
                  </div>

                  {/* Rate */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold leading-none">
                      {formatRate(r.rate, r.currency)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      1 {fromCurrency}
                    </p>
                  </div>
                </div>
              );
            })}

            {baseRates.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-xs">
                {t("exchangeRates.noRates") ?? "Нет данных о курсах"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-muted-foreground pb-2 leading-relaxed">
        {t("exchangeRates.disclaimer")}
      </p>
    </div>
  );
};

export default ExchangeRates;
