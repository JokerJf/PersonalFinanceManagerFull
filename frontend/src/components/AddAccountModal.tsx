import { useState } from "react";
import { useTranslation } from "react-i18next";
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

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (account: Omit<Account, "id">) => void;
}

// Сетевые цвета по умолчанию (номер стиля)
const networkColors: Record<string, number> = {
  visa: 2,
  mastercard: 3,
  humo: 4,
  uzcard: 5,
  none: 2,
};

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

// Валюты для различных сетей карт
const networkCurrencies: Record<string, string> = {
  visa: "USD",
  mastercard: "USD",
  humo: "UZS",
  uzcard: "UZS",
};

const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
};

const formatExpiryDate = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
};

const AddAccountModal = ({ open, onOpenChange, onAdd }: AddAccountModalProps) => {
  const { t } = useTranslation();

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"card" | "cash" | "bank">("card");
  const [newCurrency, setNewCurrency] = useState("USD");
  const [newBalance, setNewBalance] = useState("");
  const [newNetwork, setNewNetwork] = useState<"visa" | "mastercard" | "humo" | "uzcard">("visa");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [newColorStyle, setNewColorStyle] = useState<number>(2); // По умолчанию стиль для Visa
  const [includedInBalance, setIncludedInBalance] = useState(true);
  const [errors, setErrors] = useState<{
    name?: string;
    cardNumber?: string;
    expiryDate?: string;
    balance?: string;
  }>({});

  const getTypeLabel = (type: "card" | "cash" | "bank") => {
    if (type === "card") return t("accounts.types.card");
    if (type === "cash") return t("accounts.types.cash");
    return t("accounts.types.bank");
  };

  const handleAdd = () => {
    // Валидация
    const newErrors: typeof errors = {};

    if (!newName.trim()) {
      newErrors.name = "Введите название счёта";
    }

    if (newType === "card") {
      const cardDigits = newCardNumber.replace(/\s/g, "");
      if (!cardDigits || cardDigits.length !== 16) {
        newErrors.cardNumber = "Введите 16 цифр номера карты";
      }

      if (!newExpiryDate || newExpiryDate.length !== 5) {
        newErrors.expiryDate = "Введите срок в формате ММ/ГГ";
      }
    }

    if (!newBalance || newBalance.trim() === "") {
      newErrors.balance = "Введите начальный баланс";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const acc: Omit<Account, "id"> = {
      name: newName,
      type: newType,
      currency: newType === "card" ? networkCurrencies[newNetwork] : newCurrency,
      balance: parseFloat(newBalance),
      colorStyle: newColorStyle,
      includedInBalance,
      ...(newType === "card" && {
        cardNetwork: newNetwork,
        cardNumberFull: newCardNumber.replace(/\s/g, ""),
        expiryDate: newExpiryDate,
      }),
    };

    onAdd(acc);
    onOpenChange(false);

    setNewName("");
    setNewBalance("");
    setNewCardNumber("");
    setNewExpiryDate("");
    setNewCurrency("USD");
    setNewNetwork("visa");
    setNewColorStyle(2); // По умолчанию стиль для Visa
    setIncludedInBalance(true);
    setErrors({});
  };

  const handleNetworkChange = (network: "visa" | "mastercard" | "humo" | "uzcard") => {
    setNewNetwork(network);
    // Устанавливаем цвет по умолчанию для сети
    setNewColorStyle(networkColors[network]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl sm:rounded-lg sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">
            {t("accountForm.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Account Name */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">
              {t("accountForm.accountName")}
            </label>
            <input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder={t("accountForm.placeholders.accountName")}
              className={`w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm ${errors.name ? "border-red-500 border-2" : ""}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">
              {t("accountForm.type")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["card", "cash", "bank"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewType(type)}
                  className={`py-2 rounded-2xl text-xs font-semibold capitalize transition-colors shadow-sm ${newType === type ? "bg-primary text-white" : "btn-secondary"
                    }`}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Card Number and Expiry Date - in one row (75% / 25%) */}
          {newType === "card" && (
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  {t("accountForm.cardNumber")}
                </label>
                <input
                  value={newCardNumber}
                  onChange={(e) => {
                    const val = formatCardNumber(e.target.value);
                    if (val.replace(/\s/g, "").length <= 16) {
                      setNewCardNumber(val);
                      if (errors.cardNumber) setErrors({ ...errors, cardNumber: undefined });
                    }
                  }}
                  placeholder={t("accountForm.placeholders.cardNumber")}
                  maxLength={19}
                  inputMode="numeric"
                  className={`w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm ${errors.cardNumber ? "border-red-500 border-2" : ""}`}
                />
                {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
              </div>
              <div className="col-span-1">
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Срок
                </label>
                <input
                  value={newExpiryDate}
                  onChange={(e) => {
                    const val = formatExpiryDate(e.target.value);
                    setNewExpiryDate(val);
                    if (errors.expiryDate) setErrors({ ...errors, expiryDate: undefined });
                  }}
                  placeholder={t("accountForm.placeholders.expiryDate")}
                  maxLength={5}
                  inputMode="numeric"
                  className={`w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm ${errors.expiryDate ? "border-red-500 border-2" : ""}`}
                />
                {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
              </div>
            </div>
          )}

          {/* Card Network - dropdown */}
          {newType === "card" && (
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                {t("accountForm.cardNetwork")}
              </label>
              <Select 
                value={newNetwork} 
                onValueChange={(value) => handleNetworkChange(value as "visa" | "mastercard" | "humo" | "uzcard")}
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

          {/* Currency - dropdown (only for cash and bank) */}
          {newType !== "card" && (
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                {t("accountForm.currency")}
              </label>
              <Select 
                value={newCurrency} 
                onValueChange={(value) => setNewCurrency(value)}
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

          {/* Card Style */}
          {newType === "card" && (
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                {t("accountForm.cardStyle")}
              </label>
              <div className="flex flex-wrap gap-2 justify-start">
                {CARD_COLOR_STYLES.map((style) => {
                  const isDayNight = style.isDayNight;
                  const isSelected = newColorStyle === style.id;

                  return (
                    <button
                      key={style.id}
                      onClick={() => setNewColorStyle(style.id)}
                      className={`flex-shrink-0 w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 ${isSelected
                          ? "ring-2 ring-primary scale-110"
                          : "opacity-70 hover:opacity-100"
                        }`}
                      style={{
                        background: isDayNight
                          ? "linear-gradient(135deg, #ffffff 50%, #1e293b 50%)"
                          : `linear-gradient(135deg, ${style.from}, ${style.to})`,
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

          {/* Initial Balance */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-white/70 mb-1 block">
              {t("accountForm.initialBalance")}
            </label>
            <input
              type="number"
              value={newBalance}
              onChange={(e) => {
                setNewBalance(e.target.value);
                if (errors.balance) setErrors({ ...errors, balance: undefined });
              }}
              placeholder={t("accountForm.placeholders.balance")}
              className={`w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm ${errors.balance ? "border-red-500 border-2" : ""}`}
            />
            {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance}</p>}
          </div>

          {/* Included in Balance */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700 dark:text-white/70">
              {t("accountForm.includeInBalance")}
            </label>
            <button
              onClick={() => setIncludedInBalance(!includedInBalance)}
              className={`w-10 h-5 rounded-full transition-colors ${includedInBalance ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
                }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white ml-1 transition-transform ${includedInBalance ? "translate-x-5" : "translate-x-0"
                  }`}
              />
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleAdd}
            className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm shadow-md"
          >
            {t("accountForm.add")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountModal;
