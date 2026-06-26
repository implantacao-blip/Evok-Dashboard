import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ──────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
};

export type FinanceAgentProps = {
  transactions: any[];
  goals: any[];
  totalIncome: number;
  totalExpense: number;
  expensesByCategory: { Necessidade: number; Desejo: number; Sonho: number };
  idealByCategory: { Necessidade: number; Desejo: number; Sonho: number };
  percentSpent: { Necessidade: number; Desejo: number; Sonho: number };
};

// ── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || '';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

function buildSystemPrompt(props: FinanceAgentProps): string {
  const { transactions, goals, totalIncome, totalExpense, expensesByCategory, idealByCategory, percentSpent } = props;

  const now = new Date();
  const currentMonth = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const balance = totalIncome - totalExpense;

  const recentTransactions = transactions
    .slice(0, 30)
    .map(t =>
      `• ${new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')} | ${t.type} | ${t.category} | ${t.description}: ${formatCurrency(t.amount)}`
    )
    .join('\n');

  const goalsInfo =
    goals.length > 0
      ? goals
          .map(
            g =>
              `• ${g.name}: ${formatCurrency(g.currentAmount)} de ${formatCurrency(g.targetAmount)} (${Math.min(((g.currentAmount / g.targetAmount) * 100), 100).toFixed(0)}%)`
          )
          .join('\n')
      : 'Nenhuma meta cadastrada ainda.';

  const overBudget = (cat: 'Necessidade' | 'Desejo' | 'Sonho', limit: number) =>
    percentSpent[cat] > limit ? `⚠️ ACIMA DO IDEAL (${percentSpent[cat].toFixed(1)}%)` : `✅ OK (${percentSpent[cat].toFixed(1)}%)`;

  return `Você é a **Evok AI**, assistente financeira pessoal integrada ao aplicativo Evok de controle de finanças. Você é especialista no método 50/30/20 e tem acesso completo e em tempo real aos dados financeiros do usuário.

━━━ DADOS FINANCEIROS — ${currentMonth.toUpperCase()} ━━━

📊 RESUMO GERAL:
• Renda do mês: ${formatCurrency(totalIncome)}
• Total gasto: ${formatCurrency(totalExpense)}
• Saldo atual: ${formatCurrency(balance)} ${balance >= 0 ? '✅ positivo' : '🚨 NEGATIVO'}

📐 MÉTODO 50/30/20 — ANÁLISE:
• Necessidade (limite 50%): ${formatCurrency(expensesByCategory.Necessidade)} / ideal ${formatCurrency(idealByCategory.Necessidade)} → ${overBudget('Necessidade', 50)}
• Desejo (limite 30%): ${formatCurrency(expensesByCategory.Desejo)} / ideal ${formatCurrency(idealByCategory.Desejo)} → ${overBudget('Desejo', 30)}
• Sonho (limite 20%): ${formatCurrency(expensesByCategory.Sonho)} / ideal ${formatCurrency(idealByCategory.Sonho)} → ${overBudget('Sonho', 20)}

🎯 METAS DE SONHO:
${goalsInfo}

📋 ÚLTIMAS TRANSAÇÕES:
${recentTransactions || 'Nenhuma transação registrada ainda.'}

━━━ COMO VOCÊ DEVE AGIR ━━━

ESTILO E TOM:
1. Sempre responda em português brasileiro, de forma clara e acessível
2. Seja empática, direta e motivadora — como um coach financeiro de confiança
3. Respostas concisas e bem organizadas. Use emojis com moderação
4. Nunca julgue os gastos do usuário — oriente com positividade

FORMATAÇÃO (use para deixar as respostas claras e escaneáveis):
- Destaque valores, percentuais e pontos-chave com **negrito** (ex: **R$ 1.500,00**, **30%**)
- Para agrupar tópicos, use um título curto numa linha começando com "### " (ex: "### Seus gastos")
- Para listar itens, comece a linha com "- " (um item por linha)
- Separe blocos de assunto com uma linha em branco
- Mantenha parágrafos curtos (2-3 linhas). Evite blocos longos de texto corrido

USO DOS DADOS:
5. Use SEMPRE os dados reais acima ao dar qualquer conselho — NUNCA invente números
6. Se perguntada sobre um gasto específico, busque nas transações acima
7. Celebre conquistas reais: saldo positivo, metas próximas, categorias dentro do orçamento

CONSELHOS ACIONÁVEIS:
8. Ao identificar um problema (categoria acima do ideal, saldo negativo), não apenas aponte — sugira AÇÕES CONCRETAS baseadas nos números reais. Ex: "Você está R$ X acima no Desejo; cortar Y traria de volta ao ideal de 30%"
9. Quando sugerir metas ou cortes, baseie-se na realidade dos números do usuário, com valores específicos

EDUCAÇÃO FINANCEIRA E INVESTIMENTOS:
10. Você PODE explicar conceitos financeiros de forma educativa: reserva de emergência, o que priorizar antes de investir, diferença entre renda fixa e variável, juros compostos, como funciona o método 50/30/20, etc.
11. Você NÃO recomenda ativos, produtos ou investimentos específicos (não diga "compre tal ação/fundo/cripto"). Foque em educar o usuário para que ele decida — e tome decisões com um profissional
12. Em temas de investimento ou decisões financeiras relevantes, inclua uma nota breve de que você é uma assistente educativa e não substitui um profissional certificado (consultor financeiro, CFP, etc.)

ESCOPO:
13. Seu foco é EXCLUSIVAMENTE as finanças do usuário e educação financeira. Se perguntarem sobre assuntos não relacionados (notícias, receitas, código, etc.), redirecione gentilmente: você é a assistente financeira do app Evok e está ali para ajudar com o dinheiro dele`;
}

// ── Render markdown bold ───────────────────────────────────────────────────

function renderInline(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, pi) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={pi} className="font-bold text-white">{part.slice(2, -2)}</strong>
    ) : (
      <span key={pi}>{part}</span>
    )
  );
}

function RenderMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, li) => {
        const trimmed = line.trim();

        // Título: linha começando com "### "
        if (trimmed.startsWith('### ')) {
          return (
            <p key={li} className="font-bold text-finance-green text-[13px] mt-1">
              {renderInline(trimmed.slice(4))}
            </p>
          );
        }

        // Bullet: linha começando com "- " ou "• "
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return (
            <div key={li} className="flex gap-2">
              <span className="text-finance-green shrink-0">•</span>
              <span className="flex-1">{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Linha vazia: espaço
        if (trimmed === '') {
          return <div key={li} className="h-1" />;
        }

        // Parágrafo normal
        return <p key={li}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

// ── Quick Suggestion Chips ─────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  { label: 'Como estão meus gastos?', icon: <TrendingUp size={11} /> },
  { label: 'Estou dentro do 50/30/20?', icon: <AlertCircle size={11} /> },
  { label: 'Como estão minhas metas?', icon: <Target size={11} /> },
];

// ── Main Component ─────────────────────────────────────────────────────────

export function FinanceAgent(props: FinanceAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const balance = props.totalIncome - props.totalExpense;
      const greeting =
        balance < 0
          ? `Olá! 👋 Sou a **Evok AI**, sua assistente financeira. Percebi que seu saldo está **negativo** este mês — vamos trabalhar juntos para resolver isso. Como posso te ajudar?`
          : props.totalExpense > props.totalIncome * 0.85
          ? `Olá! 👋 Sou a **Evok AI**, sua assistente financeira. Você já usou mais de 85% da sua renda este mês — bom momento para conversarmos! Como posso ajudar?`
          : `Olá! 👋 Sou a **Evok AI**, sua assistente financeira pessoal. Tenho acesso aos seus dados e posso te ajudar a entender seus gastos, planejar suas metas e melhorar sua saúde financeira. O que gostaria de saber?`;

      setMessages([
        {
          id: 'greeting',
          role: 'model',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history excluding greeting (not in Gemini format)
      const history = messages
        .filter(m => m.id !== 'greeting')
        .map(m => ({ role: m.role, parts: [{ text: m.content }] }));

      history.push({ role: 'user', parts: [{ text }] });

      const requestBody = {
        system_instruction: { parts: [{ text: buildSystemPrompt(props) }] },
        contents: history,
        generationConfig: { temperature: 0.75, maxOutputTokens: 1200 },
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`HTTP ${res.status}: ${errData?.error?.message ?? 'Unknown'}`);
      }

      const data = await res.json();
      const aiText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        'Desculpe, não consegui processar sua mensagem. Tente novamente.';

      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'model', content: aiText, timestamp: new Date() },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: '⚠️ Ocorreu um erro ao conectar com a IA. Verifique sua conexão e tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <>
      {/* ── Popup Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-20 right-4 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: '370px',
              maxHeight: '580px',
              background: 'linear-gradient(160deg, #1a1a1e 0%, #232328 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}>
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-finance-green rounded-full border-2 border-zinc-900" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">Evok AI</p>
                  <p className="text-finance-green text-[10px] tracking-widest uppercase font-semibold mt-0.5">
                    Assistente Financeira
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={15} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: '280px', maxHeight: '400px' }}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                      msg.role === 'user'
                        ? 'bg-blue-600'
                        : 'bg-[linear-gradient(135deg,#22c55e,#15803d)]'
                    }`}
                  >
                    {msg.role === 'user' ? <User size={13} className="text-white" /> : <Sparkles size={13} className="text-white" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-white rounded-2xl rounded-tr-sm'
                        : 'text-zinc-100 rounded-2xl rounded-tl-sm'
                    }`}
                    style={
                      msg.role === 'user'
                        ? { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }
                        : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)' }
                    }
                  >
                    <RenderMessage content={msg.content} />
                  </div>
                </motion.div>
              ))}

              {/* Loading dots */}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-[linear-gradient(135deg,#22c55e,#15803d)] flex items-center justify-center shrink-0">
                    <Sparkles size={13} className="text-white" />
                  </div>
                  <div
                    className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {[0, 150, 300].map(delay => (
                      <div
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-2 flex flex-wrap gap-1.5"
                >
                  {QUICK_SUGGESTIONS.map(({ label, icon }) => (
                    <button
                      key={label}
                      onMouseDown={() => sendMessage(label)}
                      className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: 'rgba(34, 197, 94, 0.12)',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                        color: '#22c55e',
                      }}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div
              className="px-3 py-3 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)' }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte sobre suas finanças..."
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                  style={{ '::placeholder': { color: '#52525b' } } as any}
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                >
                  <Send size={13} className="text-white" />
                </button>
              </div>
              <p className="text-center text-[9px] text-zinc-600 mt-1.5 tracking-wide">
                Evok AI · Powered by Gemini
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB Button ── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full shadow-xl flex items-center justify-center"
        style={
          isOpen
            ? { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }
            : { background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 24px rgba(34,197,94,0.4)' }
        }
        title="Evok AI — Assistente Financeira"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={18} className="text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles size={18} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
