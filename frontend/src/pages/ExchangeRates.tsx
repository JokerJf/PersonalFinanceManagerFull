import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ExchangeRates = () => {
  const { t } = useTranslation();
  const { exchangeRates, availableCurrencies, isLoadingExchangeRates, refreshExchangeRates } = useApp();
  const navigate = useNavigate();

  // Используем валюты из контекста, если они доступны, иначе - значения по умолчанию
  const currencies = availableCurrencies.length > 0 ? availableCurrencies : ["USD", "UZS", "RUB"];
  
  const [fromCurrency, setFromCurrency] = useState(currencies[0] || "USD");
  const [toCurrency, setToCurrency] = useState(currencies[1] || currencies[0] || "UZS");
  const [amount, setAmount] = useState("1");

  // Обновляем выбранные валюты при изменении доступных валют
  useEffect(() => {
    if (availableCurrencies.length > 0) {
      // Проверяем, являются ли текущие выбранные валюты доступными
      const isFromCurrencyValid = availableCurrencies.includes(fromCurrency);
      const isToCurrencyValid = availableCurrencies.includes(toCurrency);
      
      if (!isFromCurrencyValid) {
        setFromCurrency(availableCurrencies[0]);
      }
      if (!isToCurrencyValid) {
        setToCurrency(availableCurrencies[1] || availableCurrencies[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCurrencies]);

  useEffect(() => {
    refreshExchangeRates();
  }, []);

  // Debug: показать данные в консоли при изменении
  useEffect(() => {
    console.log('ExchangeRates - currencies:', currencies);
    console.log('ExchangeRates - fromCurrency:', fromCurrency);
    console.log('ExchangeRates - exchangeRates:', exchangeRates);
  }, [currencies, fromCurrency, exchangeRates]);

  const getRate = (from: string, to: string) => {
    if (from === to) return 1;
    // Ищем прямой курс
    let r = exchangeRates.find((e) => e.from === from && e.to === to && e.from !== e.to);
    if (r) return r?.rate;
    
    // Если нет прямого курса, пробуем найти обратный и инвертировать
    const reverseRate = exchangeRates.find((e) => e.from === to && e.to === from && e.from !== e.to);
    if (reverseRate && reverseRate.rate > 0) {
      return 1 / reverseRate.rate;
    }
    
    return 0;
  };

  const rate = getRate(fromCurrency, toCurrency);
  const converted = parseFloat(amount || "0") * rate;

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Получаем курсы для отображения в таблице
  // Формат: из fromCurrency в каждую другую валюту
  const baseRates = currencies
    .filter((c) => c !== fromCurrency) // исключаем текущую валюту
    .filter((c, index, self) => self.indexOf(c) === index) // убираем дубликаты
    .map((c) => ({
      currency: c,
      rate: getRate(fromCurrency, c), // Курс из fromCurrency в валюту c
    }))
    .filter((r) => r.rate > 0 && r.currency !== fromCurrency);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full secondary-bg flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold">{t("exchangeRates.title")}</h1>
      </div>

      {/* Converter */}
      {isLoadingExchangeRates ? (
        <div className="fintech-card-elevated space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-full mx-auto" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      ) : (
        <div className="fintech-card-elevated space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t("exchangeRates.from")}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 rounded-xl input-bg text-slate-900 dark:text-white px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-primary outline-none"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={swap}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            >
              <ArrowLeftRight size={18} />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t("exchangeRates.to")}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl input-bg text-slate-900 dark:text-white px-4 py-3 text-lg font-bold">
                {converted.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            1 {fromCurrency} ={" "}
            {rate.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}{" "}
            {toCurrency}
          </p>
        </div>
      )}

      {/* Rate Table */}
      {isLoadingExchangeRates ? (
        <div>
          <Skeleton className="h-6 w-36 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <div>
          <h2 className="section-title mb-3">
            {t("exchangeRates.ratesFor")} 1 {fromCurrency}
          </h2>
          <div className="space-y-2">
            {baseRates.map((r) => (
              <div key={r.currency} className="fintech-card flex items-center justify-between py-3">
                <p className="text-sm font-medium">{fromCurrency} → {r.currency}</p>
                <p className="text-sm font-semibold">
                  {r.rate.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-center text-muted-foreground">
        {t("exchangeRates.disclaimer")}
      </p>
    </div>
  );
};

export default ExchangeRates;