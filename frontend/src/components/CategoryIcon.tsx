import {
  UtensilsCrossed, Car, ShoppingBag, Film, HeartPulse, Home,
  ShoppingCart, Briefcase, Laptop, TrendingUp, Gift,
  ArrowLeftRight, CircleDot, type LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  "utensils-crossed": UtensilsCrossed,
  "car": Car,
  "shopping-bag": ShoppingBag,
  "film": Film,
  "heart-pulse": HeartPulse,
  "home": Home,
  "shopping-cart": ShoppingCart,
  "briefcase": Briefcase,
  "laptop": Laptop,
  "trending-up": TrendingUp,
  "gift": Gift,
  "arrow-left-right": ArrowLeftRight,
  "circle-dot": CircleDot,
};

const colorMap: Record<string, string> = {
  "utensils-crossed": "text-orange-400 bg-orange-400/10",
  "car": "text-blue-400 bg-blue-400/10",
  "shopping-bag": "text-pink-400 bg-pink-400/10",
  "film": "text-purple-400 bg-purple-400/10",
  "heart-pulse": "text-red-400 bg-red-400/10",
  "home": "text-teal-400 bg-teal-400/10",
  "shopping-cart": "text-green-400 bg-green-400/10",
  "briefcase": "text-indigo-400 bg-indigo-400/10",
  "laptop": "text-cyan-400 bg-cyan-400/10",
  "trending-up": "text-emerald-400 bg-emerald-400/10",
  "gift": "text-rose-400 bg-rose-400/10",
  "arrow-left-right": "text-primary bg-primary/10",
  "circle-dot": "text-muted-foreground bg-secondary",
};

interface CategoryIconProps {
  icon: string;
  size?: number;
  className?: string;
}

const CategoryIcon = ({ icon, size = 18, className = "w-10 h-10" }: CategoryIconProps) => {
  const IconComponent = iconMap[icon];
  const colors = colorMap[icon] || "text-muted-foreground bg-secondary";

  if (!IconComponent) {
    // Fallback for old emoji icons
    return (
      <div className={`${className} rounded-2xl bg-secondary flex items-center justify-center text-lg`}>
        {icon}
      </div>
    );
  }

  return (
    <div className={`${className} rounded-2xl flex items-center justify-center ${colors}`}>
      <IconComponent size={size} />
    </div>
  );
};

export default CategoryIcon;
