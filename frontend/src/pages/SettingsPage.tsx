import {
  ChevronRight,
  User,
  DollarSign,
  Wallet,
  Users,
  LogOut,
  Moon,
  Sun,
  Check,
  Sparkles,
  Trash2,
  UserMinus,
  AlertTriangle,
  Key,
  Loader2,
  X,
  Plus,
  LogIn,
  Crown,
  UserPlus,
  Copy,
  ArrowRightLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import api, { FamilyGroupStatus, IncomingRequest } from "@/api/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Базовая валюта по умолчанию, если нет счетов
const defaultCurrencies = ["USD", "UZS", "EUR", "RUB", "GBP"];
// Состояние для валют баланса (загружается с бэкенда + 'all')
const languages = ["ru", "en", "uz"] as const;

const SettingsPage = () => {
  const { t } = useTranslation();

  const {
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    selectedCurrency,
    setSelectedCurrency,
    balanceCurrency,
    setBalanceCurrency,
    darkMode,
    toggleDarkMode,
    familyMembers,
    familyEnabled,
    setFamilyEnabled,
    aiInsightEnabled,
    setAiInsightEnabled,
    resetFamilyData,
    deleteFamily,
    removeFamilyMember,
    setFamilyMembers,
    accounts,
    workspace,
    toggleAccountInBalance,
    language,
    changeLanguage,
    isLoadingData,
    logout,
    updateProfile,
    resetPassword,
    verifyCurrentPassword,
    changePassword,
    sendFamilyRequest,
  } = useApp();

  // Состояние для динамических валют из счетов
  const [currencies, setCurrencies] = useState<string[]>(defaultCurrencies);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [balanceCurrencies, setBalanceCurrencies] = useState<string[]>([]);

  const [showProfile, setShowProfile] = useState(false);
  const [showFamily, setShowFamily] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'verify' | 'new'>('verify');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Разделяем имя на firstName и lastName
  const nameParts = userName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const [editFirstName, setEditFirstName] = useState(firstName);
  const [editLastName, setEditLastName] = useState(lastName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Новое состояние для семейной группы
  const [familyGroupStatus, setFamilyGroupStatus] = useState<FamilyGroupStatus | null>(null);
  const [isLoadingGroupStatus, setIsLoadingGroupStatus] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showTransferLeadership, setShowTransferLeadership] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Загрузка статуса группы
  const loadFamilyGroupStatus = async () => {
    try {
      setIsLoadingGroupStatus(true);
      const status = await api.familyGroup.getStatus();
      setFamilyGroupStatus(status);
    } catch (error) {
      console.error('Failed to load family group status:', error);
    } finally {
      setIsLoadingGroupStatus(false);
    }
  };

  // Загрузка входящих запросов (для лидера)
  const loadIncomingRequests = async () => {
    try {
      const requests = await api.familyGroup.getIncomingRequests();
      setIncomingRequests(requests);
    } catch (error) {
      console.error('Failed to load incoming requests:', error);
    }
  };

  useEffect(() => {
    if (familyEnabled) {
      loadFamilyGroupStatus();
    }
  }, [familyEnabled]);

  useEffect(() => {
    if (familyGroupStatus?.isLeader) {
      loadIncomingRequests();
    }
  }, [familyGroupStatus?.isLeader]);

  // Загрузка валют из курсов валют (exchange_rates)
  useEffect(() => {
    const loadCurrencies = async () => {
      setIsLoadingCurrencies(true);
      try {
        // Получаем валюты из таблицы exchange_rates
        const exchangeCurrencies = await api.exchangeRates.getAvailableCurrencies();
        
        if (exchangeCurrencies && exchangeCurrencies.length > 0) {
          setCurrencies(exchangeCurrencies);
          // Для баланса добавляем опцию "all" + валюты из бэкенда
          setBalanceCurrencies(['all', ...exchangeCurrencies]);
        } else {
          // Если нет данных, используем значения по умолчанию
          setCurrencies(defaultCurrencies);
          setBalanceCurrencies(['all', ...defaultCurrencies]);
        }
      } catch (error) {
        console.error('Failed to load currencies:', error);
        setCurrencies(defaultCurrencies);
        setBalanceCurrencies(['all', ...defaultCurrencies]);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };

    loadCurrencies();
  }, []);

  // Создать группу
  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    setIsProcessing(true);
    try {
      await api.familyGroup.createGroup(groupName.trim());
      // Перезагружаем статус группы чтобы получить актуальные данные
      await loadFamilyGroupStatus();
      setShowCreateGroup(false);
      setGroupName("");
      toast({
        title: t("settings.toasts.groupCreated.title"),
        description: t("settings.toasts.groupCreated.description"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Присоединиться к группе
  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return;
    setIsProcessing(true);
    try {
      await api.familyGroup.joinGroup(inviteCode.trim());
      setShowJoinGroup(false);
      setInviteCode("");
      toast({
        title: t("settings.toasts.joinRequestSent.title"),
        description: t("settings.toasts.joinRequestSent.description"),
      });
      // Перезагружаем статус
      await loadFamilyGroupStatus();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Принять запрос
  const handleAcceptRequest = async (requestId: number) => {
    setIsProcessing(true);
    try {
      await api.familyGroup.acceptRequest(requestId);
      await loadIncomingRequests();
      await loadFamilyGroupStatus();
      toast({
        title: t("settings.toasts.requestAccepted.title"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Отклонить запрос
  const handleDeclineRequest = async (requestId: number) => {
    setIsProcessing(true);
    try {
      await api.familyGroup.declineRequest(requestId);
      await loadIncomingRequests();
      toast({
        title: t("settings.toasts.requestDeclined.title"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Удалить участника
  const handleRemoveMember = async (memberId: number) => {
    setIsProcessing(true);
    try {
      await api.familyGroup.removeMember(memberId);
      await loadFamilyGroupStatus();
      toast({
        title: t("settings.toasts.memberRemoved.title"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Передать лидерство
  const handleTransferLeadership = async (newLeaderId: number) => {
    setIsProcessing(true);
    try {
      await api.familyGroup.transferLeadership(newLeaderId);
      await loadFamilyGroupStatus();
      setShowTransferLeadership(false);
      toast({
        title: t("settings.toasts.leadershipTransferred.title"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Покинуть группу
  const handleLeaveGroup = async () => {
    setIsProcessing(true);
    try {
      await api.familyGroup.leaveGroup();
      await loadFamilyGroupStatus();
      setShowDeleteConfirm(false);
      setShowFamily(false);
      setFamilyOpen(false);
      toast({
        title: t("settings.toasts.leftGroup.title"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Копировать код приглашения
  const copyInviteCode = () => {
    if (familyGroupStatus?.inviteCode) {
      navigator.clipboard.writeText(familyGroupStatus.inviteCode);
      toast({
        title: t("settings.toasts.inviteCodeCopied.title"),
      });
    }
  };

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [balanceCurrencyOpen, setBalanceCurrencyOpen] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    const nameParts = userName.split(' ');
    setEditFirstName(nameParts[0] || '');
    setEditLastName(nameParts.slice(1).join(' ') || '');
    setEditEmail(userEmail);
  }, [userName, userEmail]);

  const getBalanceCurrencyLabel = (c: string) => {
    if (c === "all") return t("settings.balanceCurrency.all");
    return c;
  };

  const getLanguageLabel = (lang: "ru" | "en" | "uz") => {
    if (lang === "ru") return t("common.russian");
    if (lang === "en") return t("common.english");
    return t("common.uzbek");
  };

  const getAccountColor = (colorStyle: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
      'from-teal-500 to-teal-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
    ];
    return colors[colorStyle - 1] || colors[0];
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateProfile({
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
      });
      setUserName(`${editFirstName} ${editLastName}`);
      setUserEmail(editEmail);
      setShowProfile(false);
      
      toast({
        title: t("settings.toasts.profileUpdated.title"),
        description: t("settings.toasts.profileUpdated.description"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetPassword = async () => {
    setPasswordError('');
    
    if (passwordStep === 'verify') {
      // Проверяем текущий пароль
      const isValid = await verifyCurrentPassword(currentPassword);
      if (isValid) {
        setPasswordStep('new');
      } else {
        setPasswordError(t("settings.dialogs.resetPassword.invalidPassword"));
      }
    } else {
      // Меняем пароль
      if (newPassword !== confirmPassword) {
        setPasswordError(t("settings.dialogs.resetPassword.passwordMismatch"));
        return;
      }
      
      if (newPassword.length < 6) {
        setPasswordError(t("settings.dialogs.resetPassword.passwordTooShort"));
        return;
      }
      
      try {
        await changePassword(currentPassword, newPassword);
        setShowResetPassword(false);
        setPasswordStep('verify');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast({
          title: t("settings.toasts.passwordChanged.title"),
          description: t("settings.toasts.passwordChanged.description"),
        });
      } catch (error) {
        setPasswordError(error instanceof Error ? error.message : t("common.unknownError"));
      }
    }
  };

  const handleCloseResetPassword = () => {
    setShowResetPassword(false);
    setPasswordStep('verify');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsSendingInvite(true);
    try {
      // Отправляем приглашение по email через familyGroupApi
      await api.familyGroup.inviteByEmail(inviteEmail.trim());
      
      // Очищаем поле
      const invitedEmail = inviteEmail;
      setInviteEmail("");
      setShowInvite(false);

      toast({
        title: t("settings.toasts.invited.title"),
        description: t("settings.toasts.invited.description", { email: invitedEmail }),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleResetFamily = () => {
    resetFamilyData();
    setShowResetConfirm(false);

    toast({
      title: t("settings.toasts.familyReset.title"),
      description: t("settings.toasts.familyReset.description"),
    });
  };

  const handleDeleteFamily = () => {
    deleteFamily();
    setShowDeleteConfirm(false);
    setShowFamily(false);
    setFamilyOpen(false);

    toast({
      title: t("settings.toasts.familyDeleted.title"),
      description: t("settings.toasts.familyDeleted.description"),
    });
  };

  const sections = [
    {
      title: t("settings.sections.account"),
      items: [
        {
          icon: DollarSign,
          label: t("settings.items.currency"),
          desc: selectedCurrency,
          isDropdown: true,
          dropdownType: "currency" as const,
        },
        {
          icon: Wallet,
          label: t("settings.items.balanceCurrency"),
          desc: getBalanceCurrencyLabel(balanceCurrency),
          isDropdown: true,
          dropdownType: "balance" as const,
        },
        {
          icon: User,
          label: t("settings.items.language"),
          desc: getLanguageLabel(language),
          isDropdown: true,
          dropdownType: "language" as const,
        },
      ],
    },
    {
      title: t("settings.sections.preferences"),
      items: [
        {
          icon: darkMode ? Moon : Sun,
          label: t("settings.items.theme"),
          desc: darkMode ? t("settings.theme.dark") : t("settings.theme.light"),
          action: toggleDarkMode,
          isDropdown: false,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in settings-page">
      <h1 className="text-xl font-bold sm:text-lg">{t("settings.title")}</h1>

      {/* Profile Card */}
      {isLoadingData ? (
        <div className="rounded-3xl border border-border/30 overflow-hidden card-container shadow-sm">
          <div className="flex items-center gap-4 p-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/30 overflow-hidden card-container shadow-sm">
          <div
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer hover:bg-secondary/50 transition-colors card-container"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-lg sm:text-xl font-bold shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate text-sm sm:text-base">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground shrink-0 sm:size-4" />
          </div>
        </div>
      )}

      {isLoadingData ? (
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-24 mb-3" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
          <div>
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-16 w-full rounded-3xl" />
          </div>
        </div>
      ) : (
        <>
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="section-title mb-3">{section.title}</h2>
              <div className="rounded-3xl border border-border/30 overflow-hidden card-container shadow-sm">
                {section.items.map((item, i) => (
                  <div
                    key={item.label}
                    className={`${i < section.items.length - 1 ? "border-b border-border/30" : ""}`}
                  >
                    {item.isDropdown ? (
                      <DropdownMenu
                        open={
                          item.dropdownType === "balance"
                            ? balanceCurrencyOpen
                            : item.dropdownType === "language"
                            ? languageOpen
                            : currencyOpen
                        }
                        onOpenChange={
                          item.dropdownType === "balance"
                            ? setBalanceCurrencyOpen
                            : item.dropdownType === "language"
                            ? setLanguageOpen
                            : setCurrencyOpen
                        }
                      >
                        <DropdownMenuTrigger asChild>
                          <button className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-secondary/50 transition-colors">
                            <item.icon size={16} className="text-muted-foreground sm:[size:18px]" />
                            <span className="text-sm font-medium flex-1 text-left truncate">{item.label}</span>
                            <span className="text-xs text-muted-foreground font-medium truncate hidden xs:inline">{item.desc}</span>
                            <span className="text-xs text-muted-foreground font-medium xs:hidden">{item.desc.substring(0, 3)}</span>
                            <ChevronRight size={12} className="text-muted-foreground sm:size-3.5" />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="start"
                          className="w-[calc(100vw-1.5rem)] sm:w-80 border-border modal-bg rounded-xl"
                        >
                          {item.dropdownType === "balance" ? (
                            <>
                              {balanceCurrencies.map((c) => (
                                <DropdownMenuItem
                                  key={c}
                                  onClick={() => {
                                    setBalanceCurrency(c);
                                    setBalanceCurrencyOpen(false);
                                    toast({
                                      title: t("settings.toasts.balanceCurrencyUpdated.title"),
                                      description:
                                        c === "all"
                                          ? t("settings.toasts.balanceCurrencyUpdated.allDescription")
                                          : t("settings.toasts.balanceCurrencyUpdated.description", { currency: c }),
                                    });
                                  }}
                                  className="flex items-center justify-between py-3 cursor-pointer"
                                >
                                  <span className="text-sm font-medium">{getBalanceCurrencyLabel(c)}</span>
                                  {balanceCurrency === c && <Check size={18} className="text-primary" />}
                                </DropdownMenuItem>
                              ))}
                            </>
                          ) : item.dropdownType === "language" ? (
                            <>
                              {languages.map((lang) => (
                                <DropdownMenuItem
                                  key={lang}
                                  onClick={() => {
                                    changeLanguage(lang);
                                    setLanguageOpen(false);
                                    toast({
                                      title: t("settings.toasts.languageUpdated.title"),
                                      description: t("settings.toasts.languageUpdated.description", {
                                        language: getLanguageLabel(lang),
                                      }),
                                    });
                                  }}
                                  className="flex items-center justify-between py-3 cursor-pointer"
                                >
                                  <span className="text-sm font-medium">{getLanguageLabel(lang)}</span>
                                  {language === lang && <Check size={18} className="text-primary" />}
                                </DropdownMenuItem>
                              ))}
                            </>
                          ) : (
                            <>
                              {currencies.map((c) => (
                                <DropdownMenuItem
                                  key={c}
                                  onClick={() => {
                                    setSelectedCurrency(c);
                                    setCurrencyOpen(false);
                                    toast({
                                      title: t("settings.toasts.currencyUpdated.title"),
                                      description: t("settings.toasts.currencyUpdated.description", {
                                        currency: c,
                                      }),
                                    });
                                  }}
                                  className="flex items-center justify-between py-3 cursor-pointer"
                                >
                                  <span className="text-sm font-medium">{c}</span>
                                  {selectedCurrency === c && <Check size={18} className="text-primary" />}
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <button
                        onClick={item.action}
                        className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-secondary/50 transition-colors"
                      >
                        <item.icon size={16} className="text-muted-foreground sm:[size:18px]" />
                        <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                        <span className="text-xs text-muted-foreground font-medium">{item.desc}</span>
                        <ChevronRight size={12} className="text-muted-foreground sm:size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Accounts Included In Balance */}
      {isLoadingData ? (
        <div>
          <Skeleton className="h-6 w-36 mb-3" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      ) : (
        <div>
          <h2 className="section-title mb-3">{t("settings.sections.balanceAccounts")}</h2>
          <div className="rounded-3xl border border-border/30 overflow-hidden card-container shadow-sm">
            {accounts.map((account, index) => (
              <div
                key={account.id}
                className={`flex items-center justify-between px-3 sm:px-4 py-3 ${
                  index < accounts.length - 1 ? "border-b border-border/30" : ""
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br ${getAccountColor(account.colorStyle)} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{account.currency}</p>
                  </div>
                </div>

                <Switch
                  checked={account.includedInBalance !== false}
                  onCheckedChange={async () => {
                    try {
                      await toggleAccountInBalance(account.id);
                      toast({
                        title: t("settings.toasts.accountBalanceUpdated.title"),
                        description:
                          account.includedInBalance !== false
                            ? t("settings.toasts.accountBalanceUpdated.removed", { account: account.name })
                            : t("settings.toasts.accountBalanceUpdated.added", { account: account.name }),
                      });
                    } catch (error) {
                      toast({
                        title: t("common.error"),
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insight Toggle */}
      {isLoadingData ? (
        <div>
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-16 w-full rounded-3xl" />
        </div>
      ) : (
        <div>
          <h2 className="section-title mb-3">{t("settings.sections.aiFeatures")}</h2>
          <div className="rounded-3xl border border-border/30 overflow-hidden card-container shadow-sm">
            <div className="flex items-center justify-between px-3 sm:px-4 py-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Sparkles size={16} className="text-warning sm:[size:18px] shrink-0" />
                <span className="text-sm font-medium">{t("settings.items.aiInsight")}</span>
              </div>
              <Switch checked={aiInsightEnabled} onCheckedChange={setAiInsightEnabled} />
            </div>
          </div>
        </div>
      )}

      {/* Family Section */}
      {isLoadingData ? (
        <div>
          <Skeleton className="h-6 w-28 mb-3" />
          <Skeleton className="h-16 w-full rounded-3xl" />
        </div>
      ) : (
        <div>
          <h2 className="section-title mb-3">{t("settings.sections.workspace")}</h2>
          <div className="rounded-3xl border border-border/30 overflow-hidden card-container shadow-sm">
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2 sm:gap-3">
                <Users size={16} className="text-muted-foreground sm:[size:18px]" />
                <span className="text-sm font-medium">{t("settings.items.familyMode")}</span>
              </div>
              <Switch checked={familyEnabled} onCheckedChange={setFamilyEnabled} />
            </div>

            {familyEnabled && (
              <>
                {/* Если группа не создана - показать опции создать/вступить */}
                {!familyGroupStatus?.isInGroup && !isLoadingGroupStatus && (
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      {t("settings.family.chooseOption")}
                    </p>
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      {t("settings.family.createGroup")}
                    </button>
                    <button
                      onClick={() => setShowJoinGroup(true)}
                      className="w-full py-3 rounded-xl border border-border font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <LogIn size={18} />
                      {t("settings.family.joinGroup")}
                    </button>
                  </div>
                )}

                {/* Если пользователь в группе - показать информацию о группе */}
                {familyGroupStatus?.isInGroup && (
                  <DropdownMenu open={familyOpen} onOpenChange={setFamilyOpen}>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-secondary/50 transition-colors">
                        <Users size={16} className="text-muted-foreground sm:[size:18px]" />
                        <span className="text-sm font-medium flex-1 text-left truncate">
                          {familyGroupStatus.groupName}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium hidden xs:inline">
                          {familyGroupStatus.isLeader ? t("settings.family.leader") : t("settings.family.member")}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium xs:hidden">
                          {familyGroupStatus.isLeader ? "L" : "M"}
                        </span>
                        <ChevronRight size={12} className="text-muted-foreground sm:size-3.5" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="start"
                      className="w-[calc(100vw-1.5rem)] sm:w-80 border-border p-0 modal-bg rounded-xl"
                    >
                      <div className="p-4 border-b border-border">
                        <h3 className="font-semibold">{familyGroupStatus.groupName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {familyGroupStatus.isLeader 
                            ? t("settings.family.youAreLeader") 
                            : t("settings.family.youAreMember")}
                        </p>
                        {familyGroupStatus.inviteCode && (
                          <div className="mt-2 flex items-center gap-2">
                            <code className="text-xs bg-secondary px-2 py-1 rounded">
                              {familyGroupStatus.inviteCode}
                            </code>
                            <button onClick={copyInviteCode} className="p-1 hover:bg-secondary rounded">
                              <Copy size={14} className="text-muted-foreground" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Входящие запросы (для лидера) */}
                      {familyGroupStatus.isLeader && incomingRequests.length > 0 && (
                        <div className="p-3 border-b border-border bg-warning/5">
                          <p className="text-xs font-semibold text-warning mb-2">
                            {t("settings.family.pendingRequests")} ({incomingRequests.length})
                          </p>
                          {incomingRequests.map((req) => (
                            <div key={req.id} className="flex items-center justify-between py-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{req.senderName}</p>
                                <p className="text-xs text-muted-foreground truncate">{req.senderEmail}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => handleAcceptRequest(req.id)}
                                  disabled={isProcessing}
                                  className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeclineRequest(req.id)}
                                  disabled={isProcessing}
                                  className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="max-h-60 overflow-y-auto">
                        {familyGroupStatus.members?.map((m) => (
                          <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                              {m.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{m.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                            </div>
                            {m.isLeader && (
                              <span className="text-[10px] uppercase font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                <Crown size={10} />
                                {t("settings.family.leader")}
                              </span>
                            )}

                            {/* Кнопки управления для лидера */}
                            {familyGroupStatus.isLeader && !m.isLeader && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleRemoveMember(m.id)}
                                  disabled={isProcessing}
                                  className="p-1.5 rounded-xl text-destructive hover:bg-destructive/10 shrink-0"
                                  title={t("settings.family.removeMember")}
                                >
                                  <UserMinus size={14} />
                                </button>
                                <button
                                  onClick={() => handleTransferLeadership(m.id)}
                                  disabled={isProcessing}
                                  className="p-1.5 rounded-xl text-warning hover:bg-warning/10 shrink-0"
                                  title={t("settings.family.transferLeadership")}
                                >
                                  <ArrowRightLeft size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="p-4 space-y-2">
                        {/* Кнопка приглашения (для лидера) */}
                        {familyGroupStatus.isLeader && (
                          <button
                            onClick={() => {
                              setFamilyOpen(false);
                              setShowInvite(true);
                            }}
                            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
                          >
                            <UserPlus size={16} />
                            {t("settings.family.inviteMember")}
                          </button>
                        )}

                        {/* Кнопка выхода из группы */}
                        <button
                          onClick={() => {
                            setFamilyOpen(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full py-2.5 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <LogOut size={16} />
                          {familyGroupStatus.isLeader 
                            ? t("settings.family.deleteGroup") 
                            : t("settings.family.leaveGroup")}
                        </button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Загрузка статуса */}
                {isLoadingGroupStatus && (
                  <div className="p-4 flex items-center justify-center">
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Logout */}
      {!isLoadingData && (
        <button
          onClick={logout}
          className="w-full rounded-3xl border border-border/30 flex items-center justify-center gap-2 text-destructive font-semibold text-sm py-3 sm:py-3.5 hover:bg-secondary/50 transition-colors card-container shadow-sm"
        >
          <LogOut size={14} className="sm:size-4" />
          {t("settings.logout")}
        </button>
      )}

      {/* Profile Edit Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("settings.dialogs.editProfile.title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("settings.dialogs.editProfile.firstName")}
              </label>
              <input
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("settings.dialogs.editProfile.lastName")}
              </label>
              <input
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("settings.dialogs.editProfile.email")}
              </label>
              <input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                type="email"
                className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={isSavingProfile}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md disabled:opacity-50"
            >
              {isSavingProfile ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                t("settings.dialogs.editProfile.save")
              )}
            </button>

            <button
              onClick={() => setShowResetPassword(true)}
              className="w-full py-3 rounded-2xl border border-border text-foreground font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Key size={16} />
              {t("settings.dialogs.editProfile.resetPassword")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={handleCloseResetPassword}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key size={18} className="text-primary" />
              {passwordStep === 'verify' 
                ? t("settings.dialogs.resetPassword.verifyTitle") 
                : t("settings.dialogs.resetPassword.newTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {passwordStep === 'verify' ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {t("settings.dialogs.resetPassword.verifyDescription")}
                </p>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t("settings.dialogs.resetPassword.currentPassword")}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                  />
                </div>
                
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleCloseResetPassword}
                    className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-semibold text-sm"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={!currentPassword || isResettingPassword}
                    className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                  >
                    {isResettingPassword ? (
                      <Loader2 className="animate-spin mx-auto" size={20} />
                    ) : (
                      t("settings.dialogs.resetPassword.verify")
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {t("settings.dialogs.resetPassword.newDescription")}
                </p>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t("settings.dialogs.resetPassword.newPassword")}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t("settings.dialogs.resetPassword.confirmPassword")}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                  />
                </div>
                
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setPasswordStep('verify')}
                    className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-semibold text-sm"
                  >
                    {t("common.back")}
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={!newPassword || !confirmPassword || isResettingPassword}
                    className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                  >
                    {isResettingPassword ? (
                      <Loader2 className="animate-spin mx-auto" size={20} />
                    ) : (
                      t("settings.dialogs.resetPassword.change")
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={18} className="text-primary" />
              {t("settings.dialogs.createGroup.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("settings.dialogs.createGroup.description")}
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("settings.dialogs.createGroup.groupName")}
              </label>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t("settings.dialogs.createGroup.placeholder")}
                className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
              />
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || isProcessing}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                t("settings.dialogs.createGroup.create")
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={showJoinGroup} onOpenChange={setShowJoinGroup}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn size={18} className="text-primary" />
              {t("settings.dialogs.joinGroup.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("settings.dialogs.joinGroup.description")}
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("settings.dialogs.joinGroup.inviteCode")}
              </label>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder={t("settings.dialogs.joinGroup.placeholder")}
                className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm uppercase"
              />
            </div>

            <button
              onClick={handleJoinGroup}
              disabled={!inviteCode.trim() || isProcessing}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                t("settings.dialogs.joinGroup.join")
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirm */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-warning" />
              {t("settings.dialogs.resetFamily.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("settings.dialogs.resetFamily.description")}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-semibold text-sm"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleResetFamily}
                className="flex-1 py-3 rounded-2xl bg-warning text-white font-semibold text-sm"
              >
                {t("common.reset")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave/Delete Group Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" />
              {familyGroupStatus?.isLeader 
                ? t("settings.dialogs.deleteFamily.title")
                : t("settings.dialogs.leaveGroup.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {familyGroupStatus?.isLeader 
                ? t("settings.dialogs.deleteFamily.description")
                : t("settings.dialogs.leaveGroup.description")}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-semibold text-sm"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleLeaveGroup}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-2xl bg-destructive text-white font-semibold text-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : familyGroupStatus?.isLeader ? (
                  t("common.delete")
                ) : (
                  t("settings.family.leaveGroup")
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:mx-4 mx-0 sm:max-w-sm max-w-[calc(100vw-1rem)] modal-bg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={18} className="text-primary" />
              {t("settings.family.inviteMember")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("settings.dialogs.inviteMember.description")}
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("settings.dialogs.inviteMember.email")}
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t("settings.dialogs.inviteMember.emailPlaceholder")}
                className="w-full rounded-2xl input-bg text-slate-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
              />
            </div>

            <button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || isSendingInvite}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md disabled:opacity-50"
            >
              {isSendingInvite ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                t("settings.dialogs.inviteMember.send")
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;