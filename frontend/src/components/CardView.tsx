import { Account, useApp } from "@/context/AppContext";
import CardNetworkLogo from "@/components/CardNetworkLogo";
import { Wifi, Eye, EyeOff, Copy, Check } from "lucide-react";

interface CardViewProps {
  account: Account;
  revealed?: boolean;
  onToggleReveal?: () => void;
  onCopy?: () => void;
  copied?: boolean;
  className?: string;
}

// Карта стилей - номер стиля -> CSS класс градиента
// Стиль 1 - День/Ночь (динамический)
const CARD_STYLES: Record<number, string> = {
  1: "",    // День/Ночь - динамический стиль (обрабатывается отдельно)
  2: "from-[#1a1f71] to-[#2d4aa8]",    // Синий (Visa)
  3: "from-[#eb001b] to-[#f79e1b]",     // Красный/Оранжевый (Mastercard)
  4: "from-[#00a651] to-[#4fc978]",     // Зелёный (Humo)
  5: "from-[#0066b3] to-[#00a0e3]",     // Голубой (Uzcard)
  6: "from-[#7c3aed] to-[#a855f7]",    // Фиолетовый
  7: "from-[#059669] to-[#10b981]",    // Изумрудный
  8: "from-[#64748b] to-[#94a3b8]",    // Серый
};

// Получить класс стиля карты по номеру
const getCardStyle = (colorStyle: number | undefined, isDarkMode: boolean): string => {
  if (!colorStyle) return "from-[#1a1f71] to-[#2d4aa8]";
  
  // Стиль 1 - День/Ночь - динамический
  if (colorStyle === 1) {
    return isDarkMode 
      ? "from-slate-800 to-slate-900"  // Ночь - тёмный градиент
      : "from-white to-gray-100";    // День - светлый градиент
  }
  
  return CARD_STYLES[colorStyle] || "from-[#1a1f71] to-[#2d4aa8]";
};

// Форматирует номер карты в формат XXXX •••• •••• XXXX
const formatCardNumber = (number: string): string => {
  if (!number) return "";
  const digits = number.replace(/\D/g, "");
  if (digits.length === 16) {
    return `${digits.slice(0, 4)} •••• •••• ${digits.slice(12, 16)}`;
  }
  return digits;
};

// Форматирует полный номер карты с пробелами для отображения
const formatFullCardNumber = (number: string): string => {
  if (!number) return "";
  const digits = number.replace(/\D/g, "");
  if (digits.length === 16) {
    return digits.replace(/(\d{4})/g, "$1 ").trim();
  }
  return number;
};

const CardView = ({ 
  account, 
  revealed = false, 
  onToggleReveal, 
  onCopy,
  copied = false,
  className = "" 
}: CardViewProps) => {
  const { darkMode } = useApp();
  
  // Получаем класс стиля по номеру с учётом темы
  const cardStyle = getCardStyle(account.colorStyle, darkMode);
  
  // Для стиля день/ночь нужно особое оформление текста
  const isDayNightStyle = account.colorStyle === 1;
  
  return (
    <div 
      className={`h-48 rounded-3xl p-5 bg-gradient-to-br ${cardStyle} ${isDayNightStyle ? (darkMode ? "text-white" : "text-slate-900") : "text-white"} relative overflow-hidden shadow-lg ${className}`}
    >
      {/* Decorative elements */}
      <div className={`absolute top-0 right-0 w-28 h-28 rounded-full ${isDayNightStyle ? (darkMode ? "bg-white/5" : "bg-black/5") : "bg-white/5"} -translate-y-1/3 translate-x-1/3`} />
      <div className={`absolute bottom-0 left-0 w-20 h-20 rounded-full ${isDayNightStyle ? (darkMode ? "bg-white/5" : "bg-black/5") : "bg-white/5"} translate-y-1/3 -translate-x-1/3`} />
      <div className={`absolute -bottom-2 -left-2 w-16 h-16 rounded-full ${isDayNightStyle ? (darkMode ? "bg-white/10" : "bg-black/10") : "bg-white/10"} blur-xl`} />
      
      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi size={18} className={`opacity-40 rotate-90 ${isDayNightStyle ? (darkMode ? "text-white/40" : "text-slate-900/40") : "text-white/40"}`} />
            <span className={`text-xs opacity-60 font-semibold tracking-wider ${isDayNightStyle ? (darkMode ? "text-white/60" : "text-slate-900/60") : "text-white/60"}`}>{account.name}</span>
          </div>
          {account.cardNetwork && (
            <div className="w-16 h-8 flex items-center justify-end">
              <CardNetworkLogo network={account.cardNetwork} className={`h-7 w-auto ${isDayNightStyle ? (darkMode ? "opacity-70" : "opacity-50") : "opacity-70"}`} />
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className={`text-sm opacity-60 font-mono tracking-widest ${isDayNightStyle ? (darkMode ? "text-white/60" : "text-slate-900/60") : "text-white/60"}`}>
              {revealed ? formatFullCardNumber(account.cardNumberFull || "") : formatCardNumber(account.cardNumberFull || "")}
            </p>
            {onToggleReveal && (
              <button onClick={(e) => { e.stopPropagation(); onToggleReveal(); }} className={`p-1.5 rounded-xl transition-colors ${isDayNightStyle ? (darkMode ? "bg-white/10 hover:bg-white/20" : "bg-slate-900/10 hover:bg-slate-900/20") : "bg-white/10 hover:bg-white/20"}`}>
                {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            )}
            {onCopy && (
              <button onClick={(e) => { e.stopPropagation(); onCopy(); }} className={`p-1.5 rounded-xl transition-colors ${isDayNightStyle ? (darkMode ? "bg-white/10 hover:bg-white/20" : "bg-slate-900/10 hover:bg-slate-900/20") : "bg-white/10 hover:bg-white/20"}`}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            )}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-[10px] opacity-40 uppercase font-semibold tracking-wider ${isDayNightStyle ? (darkMode ? "text-white/40" : "text-slate-900/40") : "text-white/40"}`}>Balance</p>
              <p className="text-xl font-bold">
                {account.currency === "UZS" 
                  ? `${account.balance.toLocaleString("en-US")} сум` 
                  : account.currency === "USD"
                    ? `$${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    : account.currency === "EUR"
                      ? `€${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                      : `${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${account.currency}`
                }
              </p>
            </div>
            {account.expiryDate && (
              <div className="text-right">
                <p className={`text-[10px] opacity-40 uppercase font-semibold ${isDayNightStyle ? (darkMode ? "text-white/40" : "text-slate-900/40") : "text-white/40"}`}>Valid Thru</p>
                <p className={`text-xs opacity-60 font-mono ${isDayNightStyle ? (darkMode ? "text-white/60" : "text-slate-900/60") : "text-white/60"}`}>{account.expiryDate}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardView;
