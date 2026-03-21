import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
    ru: {
        translation: {
            common: {
                russian: "Русский",
                english: "English",
                uzbek: "O'zbekcha",
                cancel: "Отмена",
                delete: "Удалить",
                reset: "Сбросить",
                back: "Назад",
                error: "Ошибка",
                unknownError: "Неизвестная ошибка",
            },
            shared: {
                seeAll: "Смотреть все",
                loading: "Загрузка...",
                uzs: "сум",
                cancel: "Отмена",
                delete: "Удалить",
                reset: "Сбросить"
            },
            settings: {
                title: "Настройки",
                logout: "Выйти",

                sections: {
                    account: "Настройка общего баланса",
                    preferences: "Предпочтения",
                    balanceAccounts: "Счета в балансе",
                    aiFeatures: "AI функции",
                    workspace: "Рабочее пространство",
                },

                items: {
                    currency: "Закреплённая валюта",
                    balanceCurrency: "Фильтр валюты",
                    language: "Язык",
                    theme: "Тема",
                    aiInsight: "AI Insight",
                    familyMode: "Семейный режим",
                    familyManagement: "Управление семьёй",
                },

                theme: {
                    dark: "Тёмная",
                    light: "Светлая",
                },

                balanceCurrency: {
                    all: "Все валюты",
                },

                family: {
                    membersCount_one: "{{count}} участник",
                    membersCount_few: "{{count}} участника",
                    membersCount_many: "{{count}} участников",
                    chooseOption: "Выберите действие:",
                    createGroup: "Создать семейную группу",
                    joinGroup: "Вступить в группу",
                    leader: "Лидер",
                    member: "Участник",
                    youAreLeader: "Вы являетесь лидером",
                    youAreMember: "Вы являетесь участником",
                    pendingRequests: "Ожидающие запросы",
                    removeMember: "Удалить участника",
                    transferLeadership: "Передать лидерство",
                    deleteGroup: "Удалить группу",
                    leaveGroup: "Покинуть группу",
                    inviteMember: "Пригласить участника",
                },

                dialogs: {
                    createGroup: {
                        title: "Создать семейную группу",
                        description: "Введите название для вашей семейной группы.",
                        groupName: "Название группы",
                        placeholder: "Например, Семья Иванова",
                        create: "Создать",
                    },
                    joinGroup: {
                        title: "Вступить в группу",
                        description: "Введите код приглашения, чтобы присоединиться к группе.",
                        inviteCode: "Код приглашения",
                        placeholder: "XXXXXX",
                        join: "Присоединиться",
                    },
                    leaveGroup: {
                        title: "Покинуть группу?",
                        description: "Вы покинете семейную группу. Для повторного входа потребуется новое приглашение.",
                    },
                    editProfile: {
                        title: "Редактировать профиль",
                        firstName: "Имя",
                        lastName: "Фамилия",
                        email: "Email",
                        save: "Сохранить изменения",
                        resetPassword: "Сбросить пароль",
                    },
                    resetPassword: {
                        title: "Сброс пароля",
                        verifyTitle: "Проверка пароля",
                        newTitle: "Новый пароль",
                        verifyDescription: "Введите текущий пароль для подтверждения.",
                        newDescription: "Введите новый пароль.",
                        currentPassword: "Текущий пароль",
                        newPassword: "Новый пароль",
                        confirmPassword: "Подтвердите пароль",
                        verify: "Проверить",
                        change: "Изменить пароль",
                        invalidPassword: "Неверный пароль",
                        passwordMismatch: "Пароли не совпадают",
                        passwordTooShort: "Пароль должен быть не менее 6 символов",
                    },
                    invite: {
                        title: "Пригласить участника",
                        email: "Email",
                        send: "Отправить приглашение",
                    },
                    inviteMember: {
                        title: "Пригласить участника",
                        description: "Введите email пользователя, которого хотите пригласить в группу.",
                        email: "Email пользователя",
                        emailPlaceholder: "user@example.com",
                        send: "Отправить приглашение"
                    },
                    resetFamily: {
                        title: "Сбросить семейные данные?",
                        description: "Все семейные счета, транзакции и связанные данные будут очищены.",
                    },
                    deleteFamily: {
                        title: "Удалить семью?",
                        description: "Это действие удалит семейное пространство и его нельзя будет отменить.",
                    },
                },

                toasts: {
                    profileUpdated: {
                        title: "Профиль обновлён",
                        description: "Изменения профиля сохранены.",
                    },
                    passwordChanged: {
                        title: "Пароль изменён",
                        description: "Ваш пароль успешно изменён.",
                    },
                    passwordReset: {
                        title: "Сброс пароля",
                        description: "Ссылка для сброса пароля отправлена на вашу почту.",
                    },
                    invited: {
                        title: "Приглашение отправлено",
                        description: "{{email}} был приглашён.",
                    },
                    familyReset: {
                        title: "Семейные данные сброшены",
                        description: "Все семейные данные очищены.",
                    },
                    familyDeleted: {
                        title: "Семья удалена",
                        description: "Семейное пространство было удалено.",
                    },
                    logout: {
                        title: "Выход",
                        description: "Вы вышли из аккаунта.",
                    },
                    currencyUpdated: {
                        title: "Закреплённая валюта обновлена",
                        description: "Закреплённая валюта установлена: {{currency}}.",
                    },
                    balanceCurrencyUpdated: {
                        title: "Фильтр валюты обновлён",
                        description: "Баланс теперь отображается в {{currency}}.",
                        allDescription: "В балансе будут учитываться все валюты.",
                    },
                    languageUpdated: {
                        title: "Язык обновлён",
                        description: "Текущий язык: {{language}}.",
                    },
                    memberRemoved: {
                        title: "Участник удалён",
                        description: "{{name}} удалён из семьи.",
                    },
                    accountBalanceUpdated: {
                        title: "Баланс обновлён",
                        added: "Счёт {{account}} добавлен в баланс.",
                        removed: "Счёт {{account}} исключён из баланса.",
                    },
                    groupCreated: {
                        title: "Группа создана",
                        description: "Теперь вы можете приглашать участников.",
                    },
                    joinRequestSent: {
                        title: "Запрос отправлен",
                        description: "Ожидайте одобрения от лидера группы.",
                    },
                    requestAccepted: {
                        title: "Запрос принят",
                    },
                    requestDeclined: {
                        title: "Запрос отклонён",
                    },
                    leadershipTransferred: {
                        title: "Лидерство передано",
                    },
                    leftGroup: {
                        title: "Вы покинули группу",
                    },
                    inviteCodeCopied: {
                        title: "Код скопирован",
                    },
                },
            },
            debts: {
                title: "Долги и кредиты",
                debtsTab: "Долги",
                creditsTab: "Кредиты",
                iOwe: "Я должен",
                owedToMe: "Мне должны",
                open: "Открытые",
                closed: "Закрытые",
                noDebts: "Пока нет долгов",
                noCredits: "Пока нет кредитов или рассрочек",
                addDebt: "Добавить долг",
                addCredit: "Добавить кредит / рассрочку",
                editDebt: "Редактировать долг",
                debtClosed: "Долг закрыт",
                debtClosedDesc: "Запись помечена как закрытая.",
                debtAdded: "Долг добавлен",
                debtUpdated: "Долг обновлён",
                debtDeleted: "Долг удалён",
                error: "Ошибка",
                fillDebtFields: "Заполни имя и корректную сумму.",
                fillCreditFields: "Заполни название, сумму, срок и дату начала.",
                createdPaymentPlan: "График платежей создан.",
                totalIOwe: "Всего я должен",
                totalOwedToMe: "Всего должны мне",
                active: "Активные",
                period: "Период",
                monthlyPayment: "Ежемесячный платёж",
                paid: "Оплачено",
                removePayment: "Убрать платёж",
                markPayment: "Отметить платёж",
                closedStatus: "Закрыт",
                personName: "Имя",
                amount: "Сумма",
                currency: "Валюта",
                description: "Описание",
                optionalDescription: "Описание",
                titleLabel: "Название",
                totalAmount: "Общая сумма",
                startDate: "Дата начала",
                months: "Срок в месяцах",
                preview: "Предпросмотр",
                endDate: "Конец срока",
                credit: "Кредит",
                installment: "Рассрочка"
            },
            transactions: {
                title: "Транзакции",
                noTransactions: "Пока нет транзакций",
                filters: {
                    all: "Все",
                    expense: "Расход",
                    income: "Доход",
                    transfer: "Перевод",
                    allAccounts: "Все счета"
                },
                currency: {
                    uzs: "сум"
                }
            },
            transactionForm: {
                title: "Добавить транзакцию",
                editTitle: "Редактировать транзакцию",
                amount: "Сумма",
                amountToSend: "Сумма отправки",
                amountToReceive: "Сумма получения",
                category: "Категория",
                account: "Счёт",
                fromAccount: "Со счёта",
                toAccount: "На счёт",
                createAccount: "Создать счёт",
                save: "Сохранить изменения",
                add: "Добавить транзакцию",
                expense: "Расход",
                income: "Доход",
                transfer: "Перевод",
                rateLabel: "Курс",
                tabs: {
                    date: "Дата и время",
                    description: "Описание",
                    note: "Заметка"
                },
                placeholders: {
                    amount: "0.00",
                    description: "Введите описание...",
                    note: "Дополнительные детали...",
                    selectCategory: "Выбрать"
                },
                categories: {
                    foodDining: "Еда и рестораны",
                    transport: "Транспорт",
                    shopping: "Покупки",
                    entertainment: "Развлечения",
                    health: "Здоровье",
                    housing: "Жильё",
                    salary: "Зарплата",
                    freelance: "Фриланс",
                    investment: "Инвестиции",
                    gift: "Подарок",
                    transfer: "Перевод",
                    other: "Другое"
                },
                errors: {
                    enterAmount: "Введите сумму",
                    selectCategory: "Выберите категорию",
                    selectAccount: "Выберите счёт",
                    selectFromAccount: "Выберите счёт отправки",
                    selectToAccount: "Выберите счёт получения"
                },
                toasts: {
                    created: {
                        title: "Транзакция добавлена",
                        description: "Новая транзакция успешно создана."
                    },
                    updated: {
                        title: "Транзакция обновлена",
                        description: "Изменения транзакции сохранены."
                    },
                    error: {
                        title: "Ошибка",
                        description: "Заполни обязательные поля.",
                        needTwoAccounts: "Для перевода необходимо иметь как минимум два счёта"
                    }
                }
            },
            accounts: {
                title: "Счета",
                cardsSection: "Карты",
                otherAccountsSection: "Другие счета",
                addNewAccount: "Добавить новый счёт",
                currency: {
                    uzs: "сум"
                },
                types: {
                    card: "карта",
                    cash: "наличные",
                    bank: "банк"
                },
                toasts: {
                    accountAdded: {
                        title: "Счёт добавлен",
                        description: "{{name}} был создан."
                    },
                    copied: {
                        title: "Скопировано",
                        description: "Номер карты скопирован в буфер обмена."
                    }
                }
            },
            accountForm: {
                title: "Добавить счёт",
                accountName: "Название счёта",
                type: "Тип",
                currency: "Валюта",
                cardNetwork: "Платёжная система",
                cardNumber: "Номер карты",
                expiryDate: "Срок действия",
                cardStyle: "Стиль карты",
                initialBalance: "Начальный баланс",
                includeInBalance: "Включать в баланс",
                add: "Добавить счёт",
                placeholders: {
                    accountName: "Например, моя Visa карта",
                    cardNumber: "0000 0000 0000 0000",
                    expiryDate: "MM/YY",
                    balance: "0.00"
                }
            },
            dashboard: {
                brand: "FinWallet",
                totalBalance: "Общий баланс",
                tapToSwitch: "Нажмите для смены",
                accountsCount_one: "{{count}} счёт",
                accountsCount_few: "{{count}} счёта",
                accountsCount_many: "{{count}} счетов",
                accountsCount_other: "{{count}} счетов",
                myCards: "Мои карты",
                quickActions: {
                    title: "Быстрые действия",
                    expense: "Расход",
                    income: "Доход",
                    transfer: "Перевод",
                    debt: "Долг",
                    budget: "Бюджет"
                },
                exchangeRates: {
                    title: "Курсы валют",
                    subtitle: "Конвертер валют"
                },
                aiAssistant: {
                    title: "AI помощник",
                    subtitle: "Спроси что угодно"
                },
                aiInsight: {
                    title: "AI Insight",
                    description: "В этом месяце вы потратили на 20% больше на еду по сравнению с прошлым месяцем. Попробуйте установить лимит бюджета."
                },
                recentTransactions: {
                    title: "Последние транзакции"
                },
                toasts: {
                    noAccounts: "Сначала добавьте счёт (карту, наличные или банк)",
                    needTwoAccounts: "Для перевода необходимо иметь как минимум два счёта"
                }
            },
            analytics: {
                title: "Аналитика",
                income: "Факт дохода",
                expense: "Факт расходов",
                balance: "Фактический итог",
                incomeVsExpense: "Доходы vs Расходы",
                byCategory: "Расходы по категориям",
                balanceTrend: "Динамика баланса",
                noData: "Недостаточно данных",
                allAccounts: "Все счета",
                selectAccount: "Выберите счёт",
                card: "Карта",
                cash: "Наличные",
                bank: "Банк",
                transaction: "транзакция",
                transactions: "транзакций",
                period: {
                    day: "День",
                    week: "Неделя",
                    month: "Месяц",
                    year: "Год"
                }
            },
            exchangeRates: {
                title: "Курсы валют",
                from: "Из",
                to: "В",
                ratesFor: "Курсы для",
                disclaimer: "Курсы примерные и приведены только для демонстрации."
            },

            navigation: {
                dashboard: "Главная",
                accounts: "Счета",
                transactions: "Транзакции",
                analytics: "Аналитика",
                settings: "Настройки"
            },

            transactionDetails: {
                type: "Тип",
                category: "Категория",
                account: "Счёт",
                toAccount: "На счёт",
                date: "Дата",
                description: "Описание",
                note: "Заметка",
                edit: "Редактировать",
                delete: "Удалить",
                expand: "Подробнее",
                collapse: "Свернуть",
                cardDetails: "Детали карты",
                recentTransactions: "Последние транзакции",
                inBalance: "В балансе",
                offBalance: "Вне баланса",
                editAccount: "Редактировать счёт",
                deleteAccount: "Удалить счёт"
            },
            chatbot: {
                title: "AI помощник",
                placeholder: "Напиши сообщение...",
                send: "Отправить",
                empty: "Задай вопрос ассистенту"
            },

            notifications: {
                title: "Уведомления",
                markAllRead: "Прочитать все",
                noNotifications: "Уведомлений пока нет",
                accept: "Принять",
                decline: "Отклонить",
                familyRequest: "Запрос в семью",
                invitationAccepted: "Приглашение принято",
                invitationDeclined: "Приглашение отклонено",
                types: {
                    info: "Информация",
                    warning: "Предупреждение",
                    success: "Успешно",
                    family: "Семья"
                }
            },

            budget: {
                title: "Бюджет",
                subtitle: "Планирование и сравнение с фактом",
                period: "Период",
                accountCard: "Счёт / Карта",
                selectAccount: "Выберите счёт",
                incomePlan: "План дохода",
                incomeFact: "Факт дохода",
                expenseLimit: "Лимит расходов",
                expenseFact: "Факт расходов",
                plannedRemainder: "Плановый остаток",
                actualResult: "Фактический итог",
                budgetParameters: "Параметры бюджета",
                planIncome: "План доходов",
                planExpenses: "План расходов",
                incomePlanByCategory: "План доходов по категориям",
                expenseLimits: "Лимиты расходов",
                noLimitsSet: "Лимиты пока не заданы",
                edit: "Редактировать",
                delete: "Удалить",
                limit: "Лимит",
                fact: "Факт",
                used: "Использовано",
                category: "Категория",
                amount: "Сумма",
                save: "Сохранить",
                incomePlanByCategoryTitle: "План дохода по категории",
                expenseLimitByCategoryTitle: "Лимит расходов по категории"
            },

        },
    },

    en: {
        translation: {
            common: {
                russian: "Russian",
                english: "English",
                uzbek: "Uzbek",
                cancel: "Cancel",
                delete: "Delete",
                reset: "Reset",
                back: "Back",
                error: "Error",
                unknownError: "Unknown error",
            },
            shared: {
                seeAll: "See all",
                loading: "Loading...",
                uzs: "UZS",
                cancel: "Cancel",
                delete: "Delete",
                reset: "Reset"
            },
            settings: {
                title: "Settings",
                logout: "Logout",

                sections: {
                    account: "Total Balance Settings",
                    preferences: "Preferences",
                    balanceAccounts: "Balance Accounts",
                    aiFeatures: "AI Features",
                    workspace: "Workspace",
                },

                items: {
                    currency: "Pinned Currency",
                    balanceCurrency: "Currency Filter",
                    language: "Language",
                    theme: "Theme",
                    aiInsight: "AI Insight",
                    familyMode: "Family Mode",
                    familyManagement: "Family Management",
                },

                theme: {
                    dark: "Dark",
                    light: "Light",
                },

                balanceCurrency: {
                    all: "All currencies",
                },

                family: {
                    membersCount_one: "{{count}} member",
                    membersCount_few: "{{count}} members",
                    membersCount_many: "{{count}} members",
                    chooseOption: "Choose an option:",
                    createGroup: "Create family group",
                    joinGroup: "Join group",
                    leader: "Leader",
                    member: "Member",
                    youAreLeader: "You are the leader",
                    youAreMember: "You are a member",
                    pendingRequests: "Pending requests",
                    removeMember: "Remove member",
                    transferLeadership: "Transfer leadership",
                    deleteGroup: "Delete group",
                    leaveGroup: "Leave group",
                    inviteMember: "Invite member",
                },

                dialogs: {
                    createGroup: {
                        title: "Create family group",
                        description: "Enter a name for your family group.",
                        groupName: "Group name",
                        placeholder: "e.g., Ivanov Family",
                        create: "Create",
                    },
                    joinGroup: {
                        title: "Join group",
                        description: "Enter the invitation code to join the group.",
                        inviteCode: "Invitation code",
                        placeholder: "XXXXXX",
                        join: "Join",
                    },
                    leaveGroup: {
                        title: "Leave group?",
                        description: "You will leave the family group. A new invitation will be required to rejoin.",
                    },
                    editProfile: {
                        title: "Edit profile",
                        firstName: "First name",
                        lastName: "Last name",
                        email: "Email",
                        save: "Save changes",
                        resetPassword: "Reset password",
                    },
                    resetPassword: {
                        title: "Reset password",
                        verifyTitle: "Verify password",
                        newTitle: "New password",
                        verifyDescription: "Enter your current password to verify.",
                        newDescription: "Enter your new password.",
                        currentPassword: "Current password",
                        newPassword: "New password",
                        confirmPassword: "Confirm password",
                        verify: "Verify",
                        change: "Change password",
                        invalidPassword: "Invalid password",
                        passwordMismatch: "Passwords do not match",
                        passwordTooShort: "Password must be at least 6 characters",
                    },
                    invite: {
                        title: "Invite member",
                        email: "Email",
                        send: "Send invitation",
                    },
                    inviteMember: {
                        title: "Invite member",
                        description: "Enter the email of the user you want to invite to the group.",
                        email: "User email",
                        emailPlaceholder: "user@example.com",
                        send: "Send invitation"
                    },
                    resetFamily: {
                        title: "Reset family data?",
                        description: "All family accounts, transactions, and related data will be cleared.",
                    },
                    deleteFamily: {
                        title: "Delete family?",
                        description: "This action will delete the family workspace and cannot be undone.",
                    },
                },

                toasts: {
                    profileUpdated: {
                        title: "Profile updated",
                        description: "Profile changes have been saved.",
                    },
                    passwordChanged: {
                        title: "Password changed",
                        description: "Your password has been successfully changed.",
                    },
                    passwordReset: {
                        title: "Password reset",
                        description: "Password reset link has been sent to your email.",
                    },
                    invited: {
                        title: "Invitation sent",
                        description: "{{email}} has been invited.",
                    },
                    familyReset: {
                        title: "Family data reset",
                        description: "All family data has been cleared.",
                    },
                    familyDeleted: {
                        title: "Family deleted",
                        description: "Family workspace has been deleted.",
                    },
                    logout: {
                        title: "Logout",
                        description: "You have logged out.",
                    },
                    currencyUpdated: {
                        title: "Default currency updated",
                        description: "Default currency set to {{currency}}.",
                    },
                    balanceCurrencyUpdated: {
                        title: "Currency accounted in total balance updated",
                        description: "Total balance now accounts for {{currency}}.",
                        allDescription: "All currencies will be included in the total balance.",
                    },
                    languageUpdated: {
                        title: "Language updated",
                        description: "Current language: {{language}}.",
                    },
                    memberRemoved: {
                        title: "Member removed",
                        description: "{{name}} has been removed from the family.",
                    },
                    accountBalanceUpdated: {
                        title: "Balance updated",
                        added: "Account {{account}} added to balance.",
                        removed: "Account {{account}} removed from balance.",
                    },
                    groupCreated: {
                        title: "Group created",
                        description: "You can now invite members.",
                    },
                    joinRequestSent: {
                        title: "Request sent",
                        description: "Wait for approval from the group leader.",
                    },
                    requestAccepted: {
                        title: "Request accepted",
                    },
                    requestDeclined: {
                        title: "Request declined",
                    },
                    leadershipTransferred: {
                        title: "Leadership transferred",
                    },
                    leftGroup: {
                        title: "You left the group",
                    },
                    inviteCodeCopied: {
                        title: "Code copied",
                    },
                },
            },
            debts: {
                title: "Debts and Credits",
                debtsTab: "Debts",
                creditsTab: "Credits",
                iOwe: "I owe",
                owedToMe: "Owed to me",
                open: "Open",
                closed: "Closed",
                noDebts: "No debts yet",
                noCredits: "No credits or installments yet",
                addDebt: "Add debt",
                addCredit: "Add credit / installment",
                editDebt: "Edit debt",
                debtClosed: "Debt closed",
                debtClosedDesc: "Record marked as closed.",
                debtAdded: "Debt added",
                debtUpdated: "Debt updated",
                debtDeleted: "Debt deleted",
                error: "Error",
                fillDebtFields: "Fill in name and correct amount.",
                fillCreditFields: "Fill in name, amount, term, and start date.",
                createdPaymentPlan: "Payment schedule created.",
                totalIOwe: "Total I owe",
                totalOwedToMe: "Total owed to me",
                active: "Active",
                period: "Period",
                monthlyPayment: "Monthly payment",
                paid: "Paid",
                removePayment: "Remove payment",
                markPayment: "Mark payment",
                closedStatus: "Closed",
                personName: "Name",
                amount: "Amount",
                currency: "Currency",
                description: "Description",
                optionalDescription: "Description",
                titleLabel: "Title",
                totalAmount: "Total amount",
                startDate: "Start date",
                months: "Term in months",
                preview: "Preview",
                endDate: "End date",
                credit: "Credit",
                installment: "Installment"
            },
            transactions: {
                title: "Transactions",
                noTransactions: "No transactions yet",
                filters: {
                    all: "All",
                    expense: "Expense",
                    income: "Income",
                    transfer: "Transfer",
                    allAccounts: "All accounts"
                },
                currency: {
                    uzs: "UZS"
                }
            },
            transactionForm: {
                title: "Add transaction",
                editTitle: "Edit transaction",
                amount: "Amount",
                amountToSend: "Amount to send",
                amountToReceive: "Amount to receive",
                category: "Category",
                account: "Account",
                fromAccount: "From account",
                toAccount: "To account",
                createAccount: "Create account",
                save: "Save changes",
                add: "Add transaction",
                expense: "Expense",
                income: "Income",
                transfer: "Transfer",
                rateLabel: "Rate",
                tabs: {
                    date: "Date and time",
                    description: "Description",
                    note: "Note"
                },
                placeholders: {
                    amount: "0.00",
                    description: "Enter description...",
                    note: "Additional details...",
                    selectCategory: "Select"
                },
                categories: {
                    foodDining: "Food and dining",
                    transport: "Transport",
                    shopping: "Shopping",
                    entertainment: "Entertainment",
                    health: "Health",
                    housing: "Housing",
                    salary: "Salary",
                    freelance: "Freelance",
                    investment: "Investment",
                    gift: "Gift",
                    transfer: "Transfer",
                    other: "Other"
                },
                errors: {
                    enterAmount: "Enter amount",
                    selectCategory: "Select category",
                    selectAccount: "Select account",
                    selectFromAccount: "Select sending account",
                    selectToAccount: "Select receiving account"
                },
                toasts: {
                    created: {
                        title: "Transaction added",
                        description: "New transaction successfully created."
                    },
                    updated: {
                        title: "Transaction updated",
                        description: "Transaction changes have been saved."
                    },
                    error: {
                        title: "Error",
                        description: "Please fill in required fields.",
                        needTwoAccounts: "You need at least two accounts to make a transfer"
                    }
                }
            },
            accounts: {
                title: "Accounts",
                cardsSection: "Cards",
                otherAccountsSection: "Other accounts",
                addNewAccount: "Add new account",
                currency: {
                    uzs: "UZS"
                },
                types: {
                    card: "card",
                    cash: "cash",
                    bank: "bank"
                },
                toasts: {
                    accountAdded: {
                        title: "Account added",
                        description: "{{name}} was created."
                    },
                    copied: {
                        title: "Copied",
                        description: "Card number copied to clipboard."
                    }
                }
            },
            accountForm: {
                title: "Add account",
                accountName: "Account name",
                type: "Type",
                currency: "Currency",
                cardNetwork: "Payment system",
                cardNumber: "Card number",
                expiryDate: "Expiry date",
                cardStyle: "Card style",
                initialBalance: "Initial balance",
                includeInBalance: "Include in balance",
                add: "Add account",
                placeholders: {
                    accountName: "e.g., My Visa card",
                    cardNumber: "0000 0000 0000 0000",
                    expiryDate: "MM/YY",
                    balance: "0.00"
                }
            },
            dashboard: {
                brand: "FinWallet",
                totalBalance: "Total balance",
                tapToSwitch: "Tap to switch",
                accountsCount_one: "{{count}} account",
                accountsCount_few: "{{count}} accounts",
                accountsCount_many: "{{count}} accounts",
                accountsCount_other: "{{count}} accounts",
                myCards: "My cards",
                quickActions: {
                    title: "Quick actions",
                    expense: "Expense",
                    income: "Income",
                    transfer: "Transfer",
                    debt: "Debt",
                    budget: "Budget"
                },
                exchangeRates: {
                    title: "Exchange rates",
                    subtitle: "Currency converter"
                },
                aiAssistant: {
                    title: "AI assistant",
                    subtitle: "Ask anything"
                },
                aiInsight: {
                    title: "AI Insight",
                    description: "This month you spent 20% more on food compared to last month. Consider setting a budget limit."
                },
                recentTransactions: {
                    title: "Recent transactions"
                },
                toasts: {
                    noAccounts: "First add an account (card, cash, or bank)",
                    needTwoAccounts: "You need at least two accounts to make a transfer"
                }
            },
            analytics: {
                title: "Analytics",
                income: "Actual income",
                expense: "Actual expenses",
                balance: "Actual result",
                incomeVsExpense: "Income vs Expenses",
                byCategory: "Expenses by category",
                balanceTrend: "Balance trend",
                noData: "Not enough data",
                allAccounts: "All accounts",
                selectAccount: "Select account",
                card: "Card",
                cash: "Cash",
                bank: "Bank",
                transaction: "transaction",
                transactions: "transactions",
                period: {
                    day: "Day",
                    week: "Week",
                    month: "Month",
                    year: "Year"
                }
            },
            exchangeRates: {
                title: "Exchange rates",
                from: "From",
                to: "To",
                ratesFor: "Rates for",
                disclaimer: "Rates are approximate and shown for demonstration purposes only."
            },

            navigation: {
                dashboard: "Dashboard",
                accounts: "Accounts",
                transactions: "Transactions",
                analytics: "Analytics",
                settings: "Settings"
            },

            transactionDetails: {
                type: "Type",
                category: "Category",
                account: "Account",
                toAccount: "To Account",
                date: "Date",
                description: "Description",
                note: "Note",
                edit: "Edit",
                delete: "Delete",
                expand: "Expand",
                collapse: "Collapse",
                cardDetails: "Card Details",
                recentTransactions: "Recent Transactions",
                inBalance: "In Balance",
                offBalance: "Off Balance",
                editAccount: "Edit Account",
                deleteAccount: "Delete Account"
            },
            chatbot: {
                title: "AI assistant",
                placeholder: "Write a message...",
                send: "Send",
                empty: "Ask the assistant a question"
            },

            notifications: {
                title: "Notifications",
                markAllRead: "Mark all as read",
                noNotifications: "No notifications yet",
                accept: "Accept",
                decline: "Decline",
                familyRequest: "Family request",
                invitationAccepted: "Invitation accepted",
                invitationDeclined: "Invitation declined",
                types: {
                    info: "Information",
                    warning: "Warning",
                    success: "Success",
                    family: "Family"
                }
            },

            budget: {
                title: "Budget",
                subtitle: "Planning and comparison with actual",
                period: "Period",
                accountCard: "Account / Card",
                selectAccount: "Select account",
                incomePlan: "Income plan",
                incomeFact: "Income actual",
                expenseLimit: "Expense limit",
                expenseFact: "Expenses actual",
                plannedRemainder: "Planned remainder",
                actualResult: "Actual result",
                budgetParameters: "Budget parameters",
                planIncome: "Plan income",
                planExpenses: "Plan expenses",
                incomePlanByCategory: "Income plan by category",
                expenseLimits: "Expense limits",
                noLimitsSet: "No limits set yet",
                edit: "Edit",
                delete: "Delete",
                limit: "Limit",
                fact: "Actual",
                used: "Used",
                category: "Category",
                amount: "Amount",
                save: "Save",
                incomePlanByCategoryTitle: "Income plan by category",
                expenseLimitByCategoryTitle: "Expense limit by category"
            },

        },
    },

    uz: {
        translation: {
            common: {
                russian: "Ruscha",
                english: "Inglizcha",
                uzbek: "O'zbekcha",
                cancel: "Bekor qilish",
                delete: "O'chirish",
                reset: "Tiklash",
                back: "Orqaga",
                error: "Xatolik",
                unknownError: "Noma'lum xatolik",
            },
            shared: {
                seeAll: "Hammasi",
                loading: "Yuklanmoqda...",
                uzs: "so'm",
                cancel: "Bekor qilish",
                delete: "O'chirish",
                reset: "Tiklash"
            },
            settings: {
                title: "Sozlamalar",
                logout: "Chiqish",

                sections: {
                    account: "Umumiy balans sozlamalari",
                    preferences: "Afzalliklar",
                    balanceAccounts: "Balansdagi hisoblar",
                    aiFeatures: "AI funksiyalar",
                    workspace: "Ish maydoni",
                },

                items: {
                    currency: "Biriktirilgan valyuta",
                    balanceCurrency: "Valyuta filtr",
                    language: "Til",
                    theme: "Mavzu",
                    aiInsight: "AI Insight",
                    familyMode: "Oilaviy rejim",
                    familyManagement: "Oilani boshqarish",
                },

                theme: {
                    dark: "Qorong'i",
                    light: "Yorug'",
                },

                balanceCurrency: {
                    all: "Barcha valyutalar",
                },

                family: {
                    membersCount_one: "{{count}} a'zo",
                    membersCount_few: "{{count}} a'zo",
                    membersCount_many: "{{count}} a'zo",
                    chooseOption: "Harakatni tanlang:",
                    createGroup: "Oilaviy guruh yaratish",
                    joinGroup: "Guruhga qo'shilish",
                    leader: "Rahbar",
                    member: "A'zo",
                    youAreLeader: "Siz rahbarsiz",
                    youAreMember: "Siz a'zosiz",
                    pendingRequests: "Kutilayotgan so'rovlar",
                    removeMember: "A'zoni olib tashlash",
                    transferLeadership: "Rahbarlikni topshirish",
                    deleteGroup: "Guruhni o'chirish",
                    leaveGroup: "Guruhdan chiqish",
                    inviteMember: "A'zo taklif qilish",
                },

                dialogs: {
                    createGroup: {
                        title: "Oilaviy guruh yaratish",
                        description: "Oilaviy guruhingiz uchun nom kiriting.",
                        groupName: "Guruh nomi",
                        placeholder: "Masalan, Ivanov oilasi",
                        create: "Yaratish",
                    },
                    joinGroup: {
                        title: "Guruhga qo'shilish",
                        description: "Guruhga qo'shilish uchun taklif kodini kiriting.",
                        inviteCode: "Taklif kodi",
                        placeholder: "XXXXXX",
                        join: "Qo'shilish",
                    },
                    leaveGroup: {
                        title: "Guruhdan chiqish?",
                        description: "Siz oilaviy guruhdan chiqasiz. Qayta kirish uchun yangi taklif kerak bo'ladi.",
                    },
                    editProfile: {
                        title: "Profilni tahrirlash",
                        firstName: "Ism",
                        lastName: "Familiya",
                        email: "Email",
                        save: "O'zgarishlarni saqlash",
                        resetPassword: "Parolni tiklash",
                    },
                    resetPassword: {
                        title: "Parolni tiklash",
                        verifyTitle: "Parolni tekshirish",
                        newTitle: "Yangi parol",
                        verifyDescription: "Tasdiqlash uchun joriy parolingizni kiriting.",
                        newDescription: "Yangi parolingizni kiriting.",
                        currentPassword: "Joriy parol",
                        newPassword: "Yangi parol",
                        confirmPassword: "Parolni tasdiqlang",
                        verify: "Tekshirish",
                        change: "Parolni o'zgartirish",
                        invalidPassword: "Noto'g'ri parol",
                        passwordMismatch: "Parollar mos kelmaydi",
                        passwordTooShort: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
                    },
                    invite: {
                        title: "A'zo taklif qilish",
                        email: "Email",
                        send: "Taklif yuborish",
                    },
                    inviteMember: {
                        title: "A'zo taklif qilish",
                        description: "Guruhga taklif qilmoqchi bo'lgan foydalanuvchining emailini kiriting.",
                        email: "Foydalanuvchi emaili",
                        emailPlaceholder: "user@example.com",
                        send: "Taklif yuborish"
                    },
                    resetFamily: {
                        title: "Oilaviy ma'lumotlar tiklansinmi?",
                        description: "Barcha oilaviy hisoblar, tranzaksiyalar va bog'liq ma'lumotlar tozalanadi.",
                    },
                    deleteFamily: {
                        title: "Oilani o'chirish kerakmi?",
                        description: "Bu amal oilaviy ish maydonini o'chiradi va uni ortga qaytarib bo'lmaydi.",
                    },
                },

                toasts: {
                    profileUpdated: {
                        title: "Profil yangilandi",
                        description: "Profil o'zgarishlari saqlandi.",
                    },
                    passwordChanged: {
                        title: "Parol o'zgartirildi",
                        description: "Parolingiz muvaffaqiyatli o'zgartirildi.",
                    },
                    passwordReset: {
                        title: "Parolni tiklash",
                        description: "Parolni tiklash havolasi emailingizga yuborildi.",
                    },
                    invited: {
                        title: "Taklif yuborildi",
                        description: "{{email}} taklif qilindi.",
                    },
                    familyReset: {
                        title: "Oilaviy ma'lumotlar tiklandi",
                        description: "Barcha oilaviy ma'lumotlar tozalandi.",
                    },
                    familyDeleted: {
                        title: "Oila o'chirildi",
                        description: "Oilaviy ish maydoni o'chirildi.",
                    },
                    logout: {
                        title: "Chiqish",
                        description: "Siz akkauntdan chiqdingiz.",
                    },
                    currencyUpdated: {
                        title: "Asosiy valyuta yangilandi",
                        description: "Asosiy valyuta {{currency}} ga o'rnatildi.",
                    },
                    balanceCurrencyUpdated: {
                        title: "Umumiy balansda hisobga olinadigan valyuta yangilandi",
                        description: "Umumiy balansda endi {{currency}} hisobga olinadi.",
                        allDescription: "Umumiy balansda barcha valyutalar hisobga olinadi.",
                    },
                    languageUpdated: {
                        title: "Til yangilandi",
                        description: "Joriy til: {{language}}.",
                    },
                    memberRemoved: {
                        title: "A'zo olib tashlandi",
                        description: "{{name}} oiladan olib tashlandi.",
                    },
                    accountBalanceUpdated: {
                        title: "Balans yangilandi",
                        added: "{{account}} hisobi balansga qo'shildi.",
                        removed: "{{account}} hisobi balansdan chiqarildi.",
                    },
                    groupCreated: {
                        title: "Guruh yaratildi",
                        description: "Endi a'zolarni taklif qilishingiz mumkin.",
                    },
                    joinRequestSent: {
                        title: "So'rov yuborildi",
                        description: "Guruh rahbarining tasdig'ini kuting.",
                    },
                    requestAccepted: {
                        title: "So'rov qabul qilindi",
                    },
                    requestDeclined: {
                        title: "So'rov rad etildi",
                    },
                    leadershipTransferred: {
                        title: "Rahbarlik topshirildi",
                    },
                    leftGroup: {
                        title: "Siz guruhdan chiqdingiz",
                    },
                    inviteCodeCopied: {
                        title: "Kod nusxalandi",
                    },
                },
            },
            debts: {
                title: "Qarzlar va kreditlar",
                debtsTab: "Qarzlar",
                creditsTab: "Kreditlar",
                iOwe: "Men qarzdorman",
                owedToMe: "Menga qarzdor",
                open: "Ochiq",
                closed: "Yopilgan",
                noDebts: "Hozircha qarzlar yo'q",
                noCredits: "Hozircha kredit yoki muddatli to'lovlar yo'q",
                addDebt: "Qarz qo'shish",
                addCredit: "Kredit / muddatli to'lov qo'shish",
                debtClosed: "Qarz yopildi",
                debtClosedDesc: "Yozuv yopilgan deb belgilandi.",
                debtAdded: "Qarz qo'shildi",
                debtUpdated: "Qarz yangilandi",
                debtDeleted: "Qarz o'chirildi",
                error: "Xatolik",
                fillDebtFields: "Ism va to'g'ri summani kiriting.",
                fillCreditFields: "Nom, summa, muddat va boshlanish sanasini kiriting.",
                createdPaymentPlan: "To'lov jadvali yaratildi.",
                totalIOwe: "Jami qarzim",
                totalOwedToMe: "Menga jami qarzdor",
                active: "Faol",
                period: "Davr",
                monthlyPayment: "Oylik to'lov",
                paid: "To'langan",
                removePayment: "To'lovni olib tashlash",
                markPayment: "To'lovni belgilash",
                closedStatus: "Yopilgan",
                personName: "Ism",
                amount: "Summa",
                currency: "Valyuta",
                description: "Tavsif",
                optionalDescription: "Tavsif",
                titleLabel: "Nomi",
                totalAmount: "Umumiy summa",
                startDate: "Boshlanish sanasi",
                months: "Oylar soni",
                preview: "Oldindan ko'rish",
                endDate: "Tugash sanasi",
                credit: "Kredit",
                installment: "Muddatli to'lov"
            },
            transactions: {
                title: "Tranzaksiyalar",
                noTransactions: "Hozircha tranzaksiyalar yo'q",
                filters: {
                    all: "Barchasi",
                    expense: "Xarajat",
                    income: "Daromad",
                    transfer: "O'tkazma",
                    allAccounts: "Barcha hisoblar"
                },
                currency: {
                    uzs: "so'm"
                }
            },
            transactionForm: {
                title: "Tranzaksiya qo'shish",
                editTitle: "Tranzaksiyani tahrirlash",
                amount: "Summa",
                amountToSend: "Yuboriladigan summa",
                amountToReceive: "Qabul qilinadigan summa",
                category: "Kategoriya",
                account: "Hisob",
                fromAccount: "Hisobdan",
                toAccount: "Hisobga",
                createAccount: "Hisob yaratish",
                save: "O'zgarishlarni saqlash",
                add: "Tranzaksiya qo'shish",
                expense: "Xarajat",
                income: "Daromad",
                transfer: "O'tkazma",
                rateLabel: "Kurs",
                tabs: {
                    date: "Sana va vaqt",
                    description: "Tavsif",
                    note: "Izoh"
                },
                placeholders: {
                    amount: "0.00",
                    description: "Tavsif kiriting...",
                    note: "Qo'shimcha tafsilotlar...",
                    selectCategory: "Tanlang"
                },
                categories: {
                    foodDining: "Ovqat va restoranlar",
                    transport: "Transport",
                    shopping: "Xaridlar",
                    entertainment: "Ko'ngilochar",
                    health: "Sog'liq",
                    housing: "Uy-joy",
                    salary: "Maosh",
                    freelance: "Frilans",
                    investment: "Investitsiya",
                    gift: "Sovg'a",
                    transfer: "O'tkazma",
                    other: "Boshqa"
                },
                errors: {
                    enterAmount: "Summani kiriting",
                    selectCategory: "Kategoriyani tanlang",
                    selectAccount: "Hisobni tanlang",
                    selectFromAccount: "Yuborish hisobini tanlang",
                    selectToAccount: "Qabul hisobini tanlang"
                },
                toasts: {
                    created: {
                        title: "Tranzaksiya qo'shildi",
                        description: "Yangi tranzaksiya muvaffaqiyatli yaratildi."
                    },
                    updated: {
                        title: "Tranzaksiya yangilandi",
                        description: "Tranzaksiya o'zgarishlari saqlandi."
                    },
                    error: {
                        title: "Xatolik",
                        description: "Majburiy maydonlarni to'ldiring.",
                        needTwoAccounts: "O'tkazma qilish uchun kamida ikkita hisob kerak"
                    }
                }
            },
            accounts: {
                title: "Hisoblar",
                cardsSection: "Kartalar",
                otherAccountsSection: "Boshqa hisoblar",
                addNewAccount: "Yangi hisob qo'shish",
                currency: {
                    uzs: "so'm"
                },
                types: {
                    card: "karta",
                    cash: "naqd pul",
                    bank: "bank"
                },
                toasts: {
                    accountAdded: {
                        title: "Hisob qo'shildi",
                        description: "{{name}} yaratildi."
                    },
                    copied: {
                        title: "Nusxa olindi",
                        description: "Karta raqami clipboard ga nusxalandi."
                    }
                }
            },
            accountForm: {
                title: "Hisob qo'shish",
                accountName: "Hisob nomi",
                type: "Turi",
                currency: "Valyuta",
                cardNetwork: "To'lov tizimi",
                cardNumber: "Karta raqami",
                expiryDate: "Amal qilish muddati",
                cardStyle: "Karta uslubi",
                initialBalance: "Boshlang'ich balans",
                includeInBalance: "Balansga kiritilsin",
                add: "Hisob qo'shish",
                placeholders: {
                    accountName: "Masalan, mening Visa kartam",
                    cardNumber: "0000 0000 0000 0000",
                    expiryDate: "MM/YY",
                    balance: "0.00"
                }
            },
            dashboard: {
                brand: "FinWallet",
                totalBalance: "Umumiy balans",
                tapToSwitch: "Almashtirish uchun bosing",
                accountsCount_one: "{{count}} hisob",
                accountsCount_few: "{{count}} hisob",
                accountsCount_many: "{{count}} hisob",
                accountsCount_other: "{{count}} hisob",
                myCards: "Mening kartalarim",
                quickActions: {
                    title: "Tezkor amallar",
                    expense: "Xarajat",
                    income: "Daromad",
                    transfer: "O'tkazma",
                    debt: "Qarz",
                    budget: "Budjet"
                },
                exchangeRates: {
                    title: "Valyuta kurslari",
                    subtitle: "Valyuta konvertori"
                },
                aiAssistant: {
                    title: "AI yordamchi",
                    subtitle: "Istalgan narsani so'rang"
                },
                aiInsight: {
                    title: "AI Insight",
                    description: "Bu oy siz o'tgan oyga nisbatan ovqatga 20% ko'proq sarfladingiz. Budjet limiti qo'yishni o'ylab ko'ring."
                },
                recentTransactions: {
                    title: "So'nggi tranzaksiyalar"
                },
                toasts: {
                    noAccounts: "Avval hisob qo'shing (karta, naqd pul yoki bank)",
                    needTwoAccounts: "O'tkazma qilish uchun kamida ikkita hisob kerak"
                }
            },
            analytics: {
                title: "Analitika",
                income: "Daromad haqiqiy",
                expense: "Xarajat haqiqiy",
                balance: "Haqiqiy natija",
                incomeVsExpense: "Daromad va Xarajat",
                byCategory: "Kategoriya bo'yicha xarajatlar",
                balanceTrend: "Balans dinamikasi",
                noData: "Ma'lumot yetarli emas",
                allAccounts: "Hammasi",
                selectAccount: "Hisobni tanlang",
                card: "Karta",
                cash: "Naqd pul",
                bank: "Bank",
                transaction: "tranzaksiya",
                transactions: "tranzaksiyalar",
                period: {
                    day: "Kun",
                    week: "Hafta",
                    month: "Oy",
                    year: "Yil"
                }
            },
            exchangeRates: {
                title: "Valyuta kurslari",
                from: "Dan",
                to: "Ga",
                ratesFor: "Kurslar",
                disclaimer: "Kurslar taxminiy bo'lib, faqat namoyish uchun berilgan."
            },

            navigation: {
                dashboard: "Bosh sahifa",
                accounts: "Hisoblar",
                transactions: "Tranzaksiyalar",
                analytics: "Analitika",
                settings: "Sozlamalar"
            },

            transactionDetails: {
                type: "Turi",
                category: "Kategoriya",
                account: "Hisob",
                toAccount: "Hisobga",
                date: "Sana",
                description: "Tavsif",
                note: "Izoh",
                edit: "Tahrirlash",
                delete: "O'chirish",
                expand: "Ko'proq",
                collapse: "Yig'ish",
                cardDetails: "Karta tafsilotlari",
                recentTransactions: "So'nggi tranzaksiyalar",
                inBalance: "Balansda",
                offBalance: "Balansda emas",
                editAccount: "Hisobni tahrirlash",
                deleteAccount: "Hisobni o'chirish"
            },
            chatbot: {
                title: "AI yordamchi",
                placeholder: "Xabar yozing...",
                send: "Yuborish",
                empty: "Yordamchiga savol bering"
            },

            notifications: {
                title: "Bildirishnomalar",
                markAllRead: "Hammasini o'qilgan deb belgilash",
                noNotifications: "Hozircha bildirishnomalar yo'q",
                accept: "Qabul qilish",
                decline: "Rad etish",
                familyRequest: "Oilaviy so'rov",
                invitationAccepted: "Taklif qabul qilindi",
                invitationDeclined: "Taklif rad etildi",
                types: {
                    info: "Ma'lumot",
                    warning: "Ogohlantirish",
                    success: "Muvaffaqiyat",
                    family: "Oila"
                }
            },

            budget: {
                title: "Byudjet",
                subtitle: "Rejalashtirish va haqiqiy natijalar bilan solishtirish",
                period: "Davr",
                accountCard: "Hisob / Karta",
                selectAccount: "Hisobni tanlang",
                incomePlan: "Daromad rejasi",
                incomeFact: "Daromad haqiqiy",
                expenseLimit: "Xarajat limiti",
                expenseFact: "Xarajat haqiqiy",
                plannedRemainder: "Rejalashtirilgan qoldiq",
                actualResult: "Haqiqiy natija",
                budgetParameters: "Byudjet parametrlari",
                planIncome: "Daromad rejasi",
                planExpenses: "Xarajat rejasi",
                incomePlanByCategory: "Kategoriyalar bo'yicha daromad rejasi",
                expenseLimits: "Xarajat limitlari",
                noLimitsSet: "Hozircha limitlar o'rnatilmagan",
                edit: "Tahrirlash",
                delete: "O'chirish",
                limit: "Limit",
                fact: "Haqiqiy",
                used: "Ishlatilgan",
                category: "Kategoriya",
                amount: "Summa",
                save: "Saqlash",
                incomePlanByCategoryTitle: "Kategoriya bo'yicha daromad rejasi",
                expenseLimitByCategoryTitle: "Kategoriya bo'yicha xarajat limiti"
            },

        },
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "ru",
        supportedLngs: ["ru", "en", "uz"],
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
        },
    });

export default i18n;
