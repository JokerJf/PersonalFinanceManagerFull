import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import AppLayout from "./components/AppLayout";
import GlobalBottomSheet from "./components/GlobalBottomSheet";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";
import Debts from "./pages/Debts";
import ExchangeRates from "./pages/ExchangeRates";
import ChatBot from "./pages/ChatBot";
import NotFound from "./pages/NotFound";
import Budget from "./pages/Budget";
import Login from "./pages/Login";
import { validateAndCleanTokens } from "./api/auth";

const queryClient = new QueryClient();

// Проверка и очистка токенов при запуске
validateAndCleanTokens().catch(() => {});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <GlobalBottomSheet />
        <BrowserRouter>
          <Routes>
            {/* Публичный маршрут - страница входа */}
            <Route path="/login" element={<Login />} />
            
            {/* Защищённые маршруты - требуют авторизации */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="budget" element={<Budget />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="debts" element={<Debts />} />
                <Route path="exchange" element={<ExchangeRates />} />
                <Route path="chatbot" element={<ChatBot />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
            
            {/* Редирект всех неизвестных маршрутов на /login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
