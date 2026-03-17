import { useApp, Account, Transaction } from "@/context/AppContext";
import CardView from "./CardView";
import CategoryIcon from "@/components/CategoryIcon";
import EditAccountModal from "./EditAccountModal";
import AddAccountModal from "./AddAccountModal";
import AddTransactionModal from "./AddTransactionModal";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, EyeOff, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const GlobalBottomSheet = () => {
  const { 
    selectedCardId, 
    setSelectedCardId, 
    selectedTransactionId, 
    setSelectedTransactionId,
    accounts,
    transactions,
    toggleAccountInBalance,
    updateAccount,
    addAccount,
    addAccountModalOpen,
    setAddAccountModalOpen,
    addTransactionModalOpen,
    setAddTransactionModalOpen,
    addTransactionDefaultType,
    updateTransaction,
    deleteTransaction,
    deleteAccount
  } = useApp();

  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTransactionModalOpen, setEditTransactionModalOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);

  const selectedCard = selectedCardId ? accounts.find(a => a.id === selectedCardId) : null;
  const selectedTx = selectedTransactionId ? transactions.find(t => t.id === selectedTransactionId) : null;

  // Get transactions for selected card
  const cardTransactions = selectedCard 
    ? transactions.filter(t => t.accountId === selectedCard.id).slice(0, 5)
    : [];

  const isOpen = !!selectedCard || !!selectedTx;
  const mode = selectedCard ? "card" : selectedTx ? "transaction" : null;

  const handleClose = () => {
    if (selectedCardId) setSelectedCardId(null);
    if (selectedTransactionId) setSelectedTransactionId(null);
  };

  const toggleReveal = (id: string) => {
    setRevealedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyCardNumber = (acc: Account) => {
    const num = acc.cardNumberFull || acc.cardNumber || "";
    navigator.clipboard.writeText(num.replace(/\s/g, ""));
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied", description: "Card number copied to clipboard." });
  };

  const formatAmount = (tx: Transaction) => {
    if (tx.currency === "UZS") {
      return `${tx.amount.toLocaleString("en-US")} сум`;
    }
    return `${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  // Handle switching from card to transaction
  const handleTransactionClick = (txId: string) => {
    setSelectedCardId(null);
    setSelectedTransactionId(txId);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(o) => !o && handleClose()}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 overflow-hidden max-h-[85vh] w-full max-w-[420px] mx-auto left-0 right-0 modal-bg">
          {mode === "card" && selectedCard && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Card View */}
              <div className="p-4">
                {selectedCard.type === "card" ? (
                  <CardView 
                    account={selectedCard}
                    revealed={revealedCards.has(selectedCard.id)}
                    onToggleReveal={() => toggleReveal(selectedCard.id)}
                    onCopy={() => copyCardNumber(selectedCard)}
                    copied={copiedId === selectedCard.id}
                    className="w-full"
                  />
                ) : (
                  <div className="rounded-2xl p-4 card-bg">
                    <p className="font-semibold text-lg text-slate-900 dark:text-white">{selectedCard.name}</p>
                    <p className="text-sm text-slate-500 dark:text-white/60 capitalize">{selectedCard.type} · {selectedCard.currency}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                      {selectedCard.currency === "UZS" ? `${selectedCard.balance.toLocaleString("en-US")} сум` : `${selectedCard.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Header with Actions */}
              <div className="px-4 pb-4 flex items-center justify-between shrink-0">
                <button 
                  onClick={async () => {
                    try {
                      await toggleAccountInBalance(selectedCard.id);
                    } catch (error) {
                      toast({ title: "Error", description: "Failed to update account.", variant: "destructive" });
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-colors shadow-sm ${selectedCard.includedInBalance !== false ? "bg-warning/20 text-warning" : "btn-secondary"}`}
                >
                  {selectedCard.includedInBalance !== false ? (
                    <>
                      <Eye size={18} />
                      <span className="text-sm font-semibold">In Balance</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={18} />
                      <span className="text-sm font-semibold">Off Balance</span>
                    </>
                  )}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-3 w-12 h-12 rounded-2xl btn-secondary flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#2a2f3c4d]/80 transition-colors text-slate-900 dark:text-white shadow-sm">
                      <MoreHorizontal size={20} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#0d1017] border border-gray-200 dark:border-slate-700">
                    <DropdownMenuItem 
                      className="flex items-center gap-3 text-slate-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2f3c4d] cursor-pointer"
                      onClick={() => setEditModalOpen(true)}
                    >
                      <Pencil size={16} />
                      <span>Edit Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-3 text-destructive focus:bg-red-100 dark:focus:bg-red-900/30 cursor-pointer"
                      onClick={async () => {
                        try {
                          await deleteAccount(selectedCard.id);
                          setSelectedCardId(null);
                          toast({ title: "Deleted", description: "Account has been deleted." });
                        } catch (error) {
                          toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
                        }
                      }}
                    >
                      <Trash2 size={16} />
                      <span>Delete Account</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Recent Transactions */}
              {cardTransactions.length > 0 && (
                <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 overflow-hidden">
                  <h3 className="text-sm font-semibold mb-3 text-slate-500 dark:text-white/60 shrink-0">Recent Transactions</h3>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {cardTransactions.map(tx => (
                      <div 
                        key={tx.id} 
                        onClick={() => handleTransactionClick(tx.id)}
                        className="rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 py-3 cursor-pointer card-bg px-4 shadow-sm"
                      >
                        <CategoryIcon icon={tx.icon} size={16} className="w-8 h-8" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-slate-900 dark:text-white">{tx.description}</p>
                          <p className="text-xs text-slate-500 dark:text-white/60">{tx.category}</p>
                        </div>
                        <p className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : tx.type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                          {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                          {tx.currency === "UZS" ? `${tx.amount.toLocaleString("en-US")} сум` : `${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === "transaction" && selectedTx && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-5 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl card-bg flex items-center justify-center">
                    <CategoryIcon icon={selectedTx.icon} className="w-6 h-6" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base text-slate-900 dark:text-white truncate">{selectedTx.category}</p>
                    <p className="text-xs text-slate-500 dark:text-white/60">{selectedTx.accountName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${selectedTx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : selectedTx.type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                      {formatAmount(selectedTx)}
                    </p>
                    {selectedTx.toCurrency && selectedTx.toCurrency !== selectedTx.currency && (
                      <p className="text-xs text-slate-500 dark:text-white/50">
                        → {selectedTx.toCurrency === "UZS" ? `${selectedTx.toAmount?.toLocaleString("en-US")} сум` : `${selectedTx.toAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 space-y-0 pb-5">
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-slate-500 text-sm">Type</span>
                  <span className="font-medium text-slate-700 dark:text-white capitalize">{selectedTx.type}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-slate-500 text-sm">Category</span>
                  <span className="font-medium text-slate-700 dark:text-white">{selectedTx.category}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-slate-500 text-sm">Account</span>
                  <span className="font-medium text-slate-700 dark:text-white">{selectedTx.accountName}</span>
                </div>
                {selectedTx.toAccountName && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-slate-700">
                    <span className="text-slate-500 text-sm">To Account</span>
                    <span className="font-medium text-slate-700 dark:text-white">{selectedTx.toAccountName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-slate-500 text-sm">Date</span>
                  <span className="font-medium text-slate-700 dark:text-white">{new Date(selectedTx.date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" })}</span>
                </div>
                {selectedTx.description && (
                  <div className="py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-500 text-sm">Description</p>
                      {selectedTx.description.length > 30 && (
                        <button 
                          onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                          className="text-primary text-xs font-medium flex items-center gap-1"
                        >
                          {descriptionExpanded ? (
                            <><ChevronUp size={14} /> Collapse</>
                          ) : (
                            <><ChevronDown size={14} /> Expand</>
                          )}
                        </button>
                      )}
                    </div>
                    {descriptionExpanded ? (
                      <p className="text-sm card-bg rounded-2xl p-3 text-slate-700 dark:text-white shadow-sm whitespace-pre-wrap break-words">
                        {selectedTx.description}
                      </p>
                    ) : (
                      <p className="text-sm card-bg rounded-2xl p-3 text-slate-700 dark:text-white shadow-sm truncate">
                        {selectedTx.description}
                      </p>
                    )}
                  </div>
                )}
                {selectedTx.note && (
                  <div className="py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-500 text-sm">Note</p>
                      {selectedTx.note.length > 30 && (
                        <button 
                          onClick={() => setNoteExpanded(!noteExpanded)}
                          className="text-primary text-xs font-medium flex items-center gap-1"
                        >
                          {noteExpanded ? (
                            <><ChevronUp size={14} /> Collapse</>
                          ) : (
                            <><ChevronDown size={14} /> Expand</>
                          )}
                        </button>
                      )}
                    </div>
                    {noteExpanded ? (
                      <p className="text-sm card-bg rounded-2xl p-3 text-slate-700 dark:text-white shadow-sm whitespace-pre-wrap break-words">
                        {selectedTx.note}
                      </p>
                    ) : (
                      <p className="text-sm card-bg rounded-2xl p-3 text-slate-700 dark:text-white shadow-sm truncate">
                        {selectedTx.note}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 px-5 pb-5 shrink-0">
                <button
                  onClick={() => {
                    setEditTransactionModalOpen(true);
                  }}
                  className="flex-1 py-3 rounded-2xl card-bg flex items-center justify-center gap-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-[#2a2f3c4d]/80 transition-colors text-slate-900 dark:text-white shadow-sm"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deleteTransaction(selectedTx.id);
                      setSelectedTransactionId(null);
                      toast({ title: "Deleted", description: "Transaction has been deleted." });
                    } catch (error) {
                      toast({ title: "Error", description: "Failed to delete transaction.", variant: "destructive" });
                    }
                  }}
                  className="flex-1 py-3 rounded-2xl bg-destructive/20 dark:bg-[#2a2f3c4d] text-destructive flex items-center justify-center gap-2 text-sm font-semibold hover:bg-destructive/30 transition-colors shadow-sm"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Account Modal */}
      <EditAccountModal
        account={selectedCard}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={updateAccount}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        open={addAccountModalOpen}
        onOpenChange={setAddAccountModalOpen}
        onAdd={addAccount}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        modalOpen={addTransactionModalOpen}
        openChange={setAddTransactionModalOpen}
        defaultType={addTransactionDefaultType}
      />

      {/* Edit Transaction Modal */}
      <AddTransactionModal
        modalOpen={editTransactionModalOpen}
        openChange={(open) => {
          setEditTransactionModalOpen(open);
        }}
        onClose={() => setSelectedTransactionId(null)}
        editTransaction={selectedTx}
      />
    </>
  );
};

export default GlobalBottomSheet;
