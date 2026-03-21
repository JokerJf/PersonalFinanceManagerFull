import { LayoutDashboard, Wallet, ArrowLeftRight, BarChart3, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: "/", icon: LayoutDashboard, labelKey: "navigation.dashboard" },
    { path: "/accounts", icon: Wallet, labelKey: "navigation.accounts" },
    { path: "/transactions", icon: ArrowLeftRight, labelKey: "navigation.transactions" },
    { path: "/analytics", icon: BarChart3, labelKey: "navigation.analytics" },
    { path: "/settings", icon: Settings, labelKey: "navigation.settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-1 sm:px-2 py-1.5 sm:py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={active ? "bottom-nav-item-active" : "bottom-nav-item"}
            >
              <tab.icon size={20} sm:size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[9px] sm:text-[10px] font-medium">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
