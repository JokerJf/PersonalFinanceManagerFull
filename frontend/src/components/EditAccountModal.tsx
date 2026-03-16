import { useState, useEffect } from "react";
import { Account } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditAccountModalProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (account: Account) => void;
}

// 8 цветовых стилей для карт (номер стиля -> описание)
// Стиль 1 - День/Ночь (динамический)
const CARD_COLOR_STYLES = [
  { id: 1, name: "День/Ночь", isDayNight: true },
  { id: 2, name: "Синий", from: "#1a1f71", to: "#2d4aa8" },      // Visa
  { id: 3, name: "Красный", from: "#eb001b", to: "#f79e1b" },     // Mastercard
  { id: 4, name: "Зелёный", from: "#00a651", to: "#4fc978" },     // Humo
  { id: 5, name: "Голубой", from: "#0066b3", to: "#00a0e3" },    // Uzcard
  { id: 6, name: "Фиолетовый", from: "#7c3aed", to: "#a855f7" },
  { id: 7, name: "Изумрудный", from: "#059669", to: "#10b981" },
  { id: 8, name: "Серый", from: "#64748b", to: "#94a3b8" },
];

// Форматирует номер карты для отображения с пробелами
const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : "";
};

// Форматирует дату
const formatExpiryDate = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
};

const EditAccountModal = ({ account, open, onOpenChange, onSave }: EditAccountModalProps) => {
  const [formData, setFormData] = useState<Partial<Account>>({});
  const [errors, setErrors] = useState<{
    name?: string;
    cardNumber?: string;
    expiryDate?: string;
    balance?: string;
  }>({});

  useEffect(() => {
    if (account) {
      // Форматируем номер карты при загрузке
      const formattedCardNumber = account.cardNumberFull 
        ? formatCardNumber(account.cardNumberFull) 
        : "";
      setFormData({
        ...account,
        cardNumberFull: formattedCardNumber
      });
    }
  }, [account]);

  const handleChange = (field: keyof Account, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    const newErrors: typeof errors = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Введите название счёта";
    }

    if (formData.type === "card") {
      const cardDigits = (formData.cardNumberFull || "").replace(/\s/g, "");
      if (!cardDigits || cardDigits.length !== 16) {
        newErrors.cardNumber = "Введите 16 цифр номера карты";
      }

      if (!formData.expiryDate || formData.expiryDate.length !== 5) {
        newErrors.expiryDate = "Введите срок в формате ММ/ГГ";
      }
    }

    if (formData.balance === undefined || formData.balance === null || isNaN(formData.balance)) {
      newErrors.balance = "Введите баланс";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    if (formData.id && formData.name) {
      onSave(formData as Account);
      onOpenChange(false);
    }
  };

  if (!account) return null;

  const isCardType = formData.type === "card";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">Редактировать счёт</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Name */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">Название счёта</label>
            <input 
              value={formData.name || ""} 
              onChange={(e) => {
                handleChange("name", e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }} 
              placeholder="Например: Моя Visa карта" 
              className={`w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm ${errors.name ? "border-red-500 border-2" : ""}`} 
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">Тип</label>
            <div className="grid grid-cols-3 gap-2">
              {(["card", "cash", "bank"] as const).map(t => (
                <button 
                  key={t} 
                  type="button"
                  onClick={() => handleChange("type", t)} 
                  className={`py-2.5 rounded-2xl text-xs font-semibold capitalize transition-colors shadow-sm ${formData.type === t ? "bg-primary text-white" : "btn-secondary"}`}
                >
                  {t === "card" ? "Карта" : t === "cash" ? "Наличные" : "Банк"}
                </button>
              ))}
            </div>
          </div>

          {/* Card Number and Expiry Date - in one row (75% / 25%) */}
          {isCardType && (
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">Номер карты</label>
                <input 
                  value={formData.cardNumberFull || ""} 
                  onChange={(e) => {
                    const val = formatCardNumber(e.target.value);
                    if (val.replace(/\s/g, "").length <= 16) {
                      handleChange("cardNumberFull", val);
                      if (errors.cardNumber) setErrors({ ...errors, cardNumber: undefined });
                    }
                  }} 
                  placeholder="1234 5678 9012 3456" 
                  maxLength={19}
                  className={`w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm ${errors.cardNumber ? "border-red-500 border-2" : ""}`} 
                />
                {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
              </div>
              <div className="col-span-1">
                <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">Срок</label>
                <input 
                  value={formData.expiryDate || ""} 
                  onChange={(e) => {
                    const val = formatExpiryDate(e.target.value);
                    if (/^[\d/]*$/.test(val)) {
                      handleChange("expiryDate", val);
                      if (errors.expiryDate) setErrors({ ...errors, expiryDate: undefined });
                    }
                  }} 
                  placeholder="MM/YY" 
                  maxLength={5}
                  className={`w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm ${errors.expiryDate ? "border-red-500 border-2" : ""}`} 
                />
                {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
              </div>
            </div>
          )}

          {/* Card Network - dropdown (only for card type) */}
          {isCardType && (
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">Платёжная сеть</label>
              <Select 
                value={formData.cardNetwork || "visa"} 
                onValueChange={(value) => handleChange("cardNetwork", value as "visa" | "mastercard" | "humo" | "uzcard")}
              >
                <SelectTrigger className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm">
                  <SelectValue placeholder="Выберите сеть" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="humo">HUMO</SelectItem>
                  <SelectItem value="uzcard">UzCard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Currency - dropdown (only for cash and bank types) */}
          {!isCardType && (
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">Валюта</label>
              <Select 
                value={formData.currency || "USD"} 
                onValueChange={(value) => handleChange("currency", value)}
              >
                <SelectTrigger className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm">
                  <SelectValue placeholder="Выберите валюту" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="UZS">UZS</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Card Style - only for card type */}
          {isCardType && (
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">Стиль карты</label>
              <div className="flex flex-wrap gap-2 justify-start">
                {CARD_COLOR_STYLES.map((style) => {
                  const isDayNight = style.isDayNight;
                  const isSelected = formData.colorStyle === style.id;
                  
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => handleChange("colorStyle", style.id)}
                      className={`flex-shrink-0 w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 ${
                        isSelected 
                          ? "ring-2 ring-primary scale-110" 
                          : "opacity-70 hover:opacity-100"
                      }`}
                      style={{
                        background: isDayNight
                          ? "linear-gradient(135deg, #ffffff 50%, #1e293b 50%)"
                          : `linear-gradient(135deg, ${style.from}, ${style.to})`
                      }}
                      title={style.name}
                    >
                      {isSelected && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isDayNight ? "bg-slate-900" : "bg-white"}`} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Balance */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">Баланс</label>
            <input 
              type="number" 
              value={formData.balance || 0} 
              onChange={(e) => {
                handleChange("balance", Number(e.target.value) || 0);
                if (errors.balance) setErrors({ ...errors, balance: undefined });
              }} 
              placeholder="0.00" 
              className={`w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm ${errors.balance ? "border-red-500 border-2" : ""}`} 
            />
            {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance}</p>}
          </div>

          {/* Include in Balance */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700 dark:text-white/70">
              Включить в общий баланс
            </label>
            <button
              type="button"
              onClick={() => handleChange("includedInBalance", !formData.includedInBalance)}
              className={`w-10 h-5 rounded-full transition-colors ${formData.includedInBalance ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white ml-1 transition-transform ${formData.includedInBalance ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Submit Button */}
          <button type="submit" className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm shadow-md">
            Сохранить изменения
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountModal;
