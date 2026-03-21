import { useState } from "react";
import { ArrowLeft, Send, Bot, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  text: string;
  from: "user" | "bot";
  time: string;
}

const defaultMessages: Message[] = [
  { id: "1", text: "Hello! I'm your financial assistant. I can help you with budgeting, spending analysis, and financial tips. How can I help you today?", from: "bot", time: "Now" },
];

const ChatBot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, text: input, from: "user", time: "Now" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Fake bot response
    setTimeout(() => {
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        text: "This is a demo response. The AI assistant feature is coming soon! Connect to a backend API to enable real AI conversations about your finances.",
        from: "bot",
        time: "Now",
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <button onClick={() => navigate(-1)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-secondary dark:bg-[rgba(28,32,44,0.3)] flex items-center justify-center">
          <ArrowLeft size={16} sm:size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot size={16} sm:size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold">AI Assistant</p>
            <p className="text-[9px] sm:text-[10px] text-success">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pb-3 sm:pb-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${msg.from === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary dark:bg-[rgba(28,32,44,0.3)] rounded-bl-md"}`}>
              <p className="text-xs sm:text-sm">{msg.text}</p>
              <p className={`text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 ${msg.from === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-1.5 sm:gap-2 pt-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask about your finances..."
          className="flex-1 rounded-xl bg-secondary dark:bg-[rgba(28,32,44,0.3)] border-0 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:ring-2 focus:ring-primary outline-none"
        />
        <button onClick={sendMessage} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
          <Send size={14} sm:size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
