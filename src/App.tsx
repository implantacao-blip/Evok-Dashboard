import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Target, LayoutDashboard, History, Calendar, Menu, X, Pencil, ArrowLeft, ChevronRight, ChevronLeft, Check, LogOut, Star, Wallet } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { useFinance } from './useFinance';
import { useAuth } from './useAuth';
import { LoginPage } from './LoginPage';
import { Transaction, TransactionCategory, TransactionType } from './types';
import { useSavedAccounts } from './useSavedAccounts';
import { FinanceAgent } from './FinanceAgent';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line, PieChart, Pie, Cell } from 'recharts';

import evokLogo from './assets/evokmif_logo0.png';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'yearly' | 'goals'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState('');
  const [historyDate, setHistoryDate] = useState(new Date());
  const [filterMode, setFilterMode] = useState<'day' | 'month'>('month');
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [chartView, setChartView] = useState<'bars' | 'donut'>('bars');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [diffModal, setDiffModal] = useState<{ original: Transaction; diff: number } | null>(null);
  const [groupEditModal, setGroupEditModal] = useState<{ original: Transaction; fields: { description?: string; category?: TransactionCategory } } | null>(null);
  const finance = useFinance();
  const savedAccounts = useSavedAccounts();
  const { user, logout, loading } = useAuth();

  if (loading) {
  return (
    <div className="w-full h-screen bg-zinc-800 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );
}

if (!user) return <LoginPage />;

const displayedIncome = (() => {
  const ref = activeTab === 'transactions' ? historyDate : new Date();
  return finance.transactions
    .filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return t.type === 'Entrada' && d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
    })
    .reduce((acc, t) => acc + t.amount, 0);
})();

  const handleIncomeSubmit = () => {
    if (tempIncome !== '' && !isNaN(parseFloat(tempIncome))) {
      const targetDate = activeTab === 'transactions' ? historyDate : new Date();
      finance.updateMonthlyIncome(parseFloat(tempIncome), targetDate);
    }
    setIsEditingIncome(false);
  };

  const startEdit = (t: Transaction) => {
  setEditingId(t.id);
  setEditForm({ description: t.description, amount: t.amount, date: t.date, category: t.category, type: t.type });
};

  const saveEdit = async () => {
    if (!editingId) return;

    const original = finance.transactions.find(t => t.id === editingId);

    // Salva a edição da parcela individual primeiro
    await finance.updateTransaction(editingId, editForm);

    if (original && original.installmentId) {
      // 1) Diferença de valor → modal de ajuste
      if (editForm.amount !== undefined) {
        const valueDiff = Math.round((original.amount - editForm.amount) * 100) / 100;
        if (valueDiff !== 0) {
          setEditingId(null);
          setDiffModal({ original, diff: valueDiff });
          return;
        }
      }

      // 2) Mudança de descrição/categoria → modal de propagação em grupo
      const changedFields: { description?: string; category?: TransactionCategory } = {};
      if (editForm.description !== undefined && editForm.description !== original.description) {
        changedFields.description = editForm.description;
      }
      if (editForm.category !== undefined && editForm.category !== original.category) {
        changedFields.category = editForm.category;
      }
      if (changedFields.description || changedFields.category) {
        setEditingId(null);
        setGroupEditModal({ original, fields: changedFields });
        return;
      }
    }

    setEditingId(null);
  };

  const handleDeleteClick = (t: Transaction) => {
    if (t.installmentId) {
      setDeleteTarget(t);
    } else {
      finance.deleteTransaction(t.id);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans" style={{ background: 'radial-gradient(circle at 75% 10%, rgba(34,197,94,0.14) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(34,197,94,0.06) 0%, transparent 45%), linear-gradient(160deg, #1c1c20 0%, #0d0d10 100%)' }}>
      <button onClick={toggleSidebar} className="fixed top-4 right-4 z-50 md:hidden bg-green-600 p-2 rounded-lg shadow-sm border border-black">
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside style={{ background: 'linear-gradient(180deg, #18181b 0%, #0f0f12 100%)' }} className={`fixed inset-y-0 left-0 z-40 w-64 border-black border-r flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="p-6 flex items-center justify-center">
          <img 
          src={evokLogo} 
          alt="Logo Evok" 
          className="mx-auto transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          style={{ width: '250px', maxWidth: '100%' }}
          />
        </div>
        <nav className="flex-1 mt-4">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => { setActiveTab('transactions'); setIsSidebarOpen(false); }} icon={<History size={18} />} label="Lançamentos" />
          <SidebarItem active={activeTab === 'yearly'} onClick={() => { setActiveTab('yearly'); setIsSidebarOpen(false); }} icon={<Calendar size={18} />} label="Consolidado Anual" />
          <SidebarItem active={activeTab === 'goals'} onClick={() => { setActiveTab('goals'); setIsSidebarOpen(false); }} icon={<Target size={18} />} label="Metas (Sonhos)" />
        </nav>
        <div className="p-6 mt-auto border-t border-black space-y-4">
          <div className="bg-evok-surface border border-finance-green/30 rounded-xl p-4 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Saldo Total</p>
            <AnimatedCurrency
              value={finance.totalIncome - finance.totalExpense}
              className={`text-xl font-bold block ${finance.totalIncome - finance.totalExpense >= 0 ? 'text-finance-green' : 'text-finance-red'}`}
            />
          </div>
          <button onClick={() => logout()} className="w-full flex items-center justify-center gap-2 border border-finance-red/40 text-finance-red hover:bg-finance-red/10 hover:border-finance-red font-bold py-2 px-4 rounded-lg transition active:scale-[0.98]">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm" />}

      <main className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-8">
        <header className="-mx-4 -mt-4 md:-mx-8 md:-mt-8">
          <div className="px-4 pt-12 pb-8 md:px-8 md:pt-12 md:pb-10" style={{ backgroundColor: '#0d0d10', backgroundImage: 'linear-gradient(to right, rgba(136,136,136,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(136,136,136,0.08) 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <ShutterTitle
                key={activeTab}
                text={activeTab === 'dashboard' ? 'Visão Geral' : activeTab === 'transactions' ? 'Movimentações' : activeTab === 'yearly' ? 'Financeiro Anual' : 'Metas de Sonho'}
              />
              <div className="bg-finance-green/10 border border-finance-green/30 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.08)] shrink-0">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-finance-green/15 text-finance-green shrink-0">
                  <Wallet size={18} />
                </span>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">Renda Mensal</p>
                  {isEditingIncome ? (
                    <div className="flex items-center gap-1 animate-in fade-in">
                      <span className="text-finance-green text-sm font-bold">R$</span>
                      <input autoFocus type="number" value={tempIncome}
                        onChange={(e) => setTempIncome(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleIncomeSubmit(); if (e.key === 'Escape') setIsEditingIncome(false); }}
                        onBlur={handleIncomeSubmit}
                        className="w-24 bg-white/10 border border-white/20 rounded px-2 py-0.5 outline-none focus:border-finance-green text-white font-bold text-sm" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-finance-green font-bold text-lg leading-none">{formatCurrency(displayedIncome)}</span>
                      <button onClick={() => { setTempIncome(displayedIncome.toString()); setIsEditingIncome(true); }}
                        className="p-0.5 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white active:scale-95" title="Editar renda mensal">
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>  
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CategoryCard category="Necessidade" limit={50} current={finance.expensesByCategory.Necessidade} ideal={finance.idealByCategory.Necessidade} percent={finance.percentSpent.Necessidade} />
                <CategoryCard category="Desejo" limit={30} current={finance.expensesByCategory.Desejo} ideal={finance.idealByCategory.Desejo} percent={finance.percentSpent.Desejo} />
                <CategoryCard category="Sonho" limit={20} current={finance.expensesByCategory.Sonho} ideal={finance.idealByCategory.Sonho} percent={finance.percentSpent.Sonho} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 card-minimal overflow-hidden flex flex-col min-h-112.5">
                  <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-white text-base">{chartView === 'bars' ? 'Evolução Financeira' : 'Distribuição por Categoria'}</h3>
                      <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">{chartView === 'bars' ? `Entradas vs Saídas • ${chartYear}` : 'Método 50/30/20 • mês atual'}</p>
                    </div>
                    <div className="flex flex-row flex-wrap items-center gap-3 sm:gap-4">
                      <div className="flex bg-white/5 border border-white/10 p-1 rounded-lg">
                        <button onClick={() => setChartView('bars')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${chartView === 'bars' ? 'bg-finance-green/20 text-finance-green' : 'text-slate-400 hover:text-slate-200'}`}>Barras</button>
                        <button onClick={() => setChartView('donut')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${chartView === 'donut' ? 'bg-finance-green/20 text-finance-green' : 'text-slate-400 hover:text-slate-200'}`}>Donut</button>
                      </div>
                      <YearSelector year={chartYear} onChange={setChartYear} />
                      {chartView === 'bars' ? (
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-finance-blue" /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Entradas</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-finance-red" /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Saídas</span></div>
                      </div>
                      ) : (
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#4057d4' }} /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Necessidade</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#f59e0b' }} /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Desejo</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#8b5cf6' }} /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Sonho</span></div>
                      </div>
                      )}
                    </div>
                  </div>
                  {(() => {
                    const yearTx = finance.transactions.filter(t => new Date(t.date + 'T12:00:00').getFullYear() === chartYear);
                    const totalIn = yearTx.filter(t => t.type === 'Entrada').reduce((a, t) => a + t.amount, 0);
                    const totalOut = yearTx.filter(t => t.type === 'Saída').reduce((a, t) => a + t.amount, 0);
                    const yearBalance = totalIn - totalOut;
                    const savingsRate = totalIn > 0 ? (yearBalance / totalIn) * 100 : 0;
                    return (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-white/5">
                        <div className="bg-white/3 rounded-lg p-3">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Entradas (ano)</p>
                          <p className="text-blue-300 font-bold text-sm">{formatCurrency(totalIn)}</p>
                        </div>
                        <div className="bg-white/3 rounded-lg p-3">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Saídas (ano)</p>
                          <p className="text-red-300 font-bold text-sm">{formatCurrency(totalOut)}</p>
                        </div>
                        <div className="bg-white/3 rounded-lg p-3">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Saldo do ano</p>
                          <p className={`font-bold text-sm ${yearBalance >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>{formatCurrency(yearBalance)}</p>
                        </div>
                        <div className="bg-white/3 rounded-lg p-3">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Taxa de economia</p>
                          <p className={`font-bold text-sm ${savingsRate >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>{savingsRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex-1 p-2 sm:p-4">
                    {chartView === 'bars' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={(() => {
                        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                        return months.map((m, i) => {
                          const mt = finance.transactions.filter(t => { const d = new Date(t.date + 'T12:00:00'); return d.getMonth() === i && d.getFullYear() === chartYear; });
                          const entrada = mt.filter(t => t.type === 'Entrada').reduce((a, t) => a + t.amount, 0);
                          const saida = mt.filter(t => t.type === 'Saída').reduce((a, t) => a + t.amount, 0);
                          return { name: m, Entrada: entrada, Saída: saida, Saldo: entrada - saida };
                        });
                      })()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#d3d3d3', fontSize: 9, fontWeight: 700 }} dy={10} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#d3d3d3', fontSize: 10, fontWeight: 500 }} tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.06)', radius: 4 }} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1d', boxShadow: '0 10px 25px -3px rgba(0,0,0,0.5)', fontSize: '12px', padding: '12px' }} itemStyle={{ fontWeight: '700', padding: '2px 0' }} labelStyle={{ color: '#fff', fontWeight: '700', marginBottom: '4px' }} formatter={(value: any, name: any) => [formatCurrency(typeof value === 'number' ? value : 0), name]} />
                        <Line type="monotone" dataKey="Saldo" stroke="#22c55e" strokeWidth={1.5} strokeOpacity={0.5} dot={false} activeDot={{ r: 4 }} />
                        <Bar dataKey="Entrada" fill="#4057d4" radius={[4, 4, 0, 0]} maxBarSize={35} />
                        <Bar dataKey="Saída" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={35} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    )}
                    {chartView === 'donut' && (() => {
                      const data = [
                        { name: 'Necessidade', value: finance.expensesByCategory.Necessidade, ideal: 50, color: '#4057d4' },
                        { name: 'Desejo', value: finance.expensesByCategory.Desejo, ideal: 30, color: '#f59e0b' },
                        { name: 'Sonho', value: finance.expensesByCategory.Sonho, ideal: 20, color: '#8b5cf6' },
                      ];
                      const totalSpent = data.reduce((a, d) => a + d.value, 0);
                      return (
                        <div className="flex flex-col lg:flex-row items-center gap-6 h-full">
                          <div className="w-full lg:w-1/2 h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={totalSpent > 0 ? data : [{ name: 'Sem gastos', value: 1, color: '#3f3f46' }]} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={totalSpent > 0 ? 3 : 0} stroke="none">
                                  {(totalSpent > 0 ? data : [{ color: '#3f3f46' }]).map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1d', fontSize: '12px', padding: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : 0)} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-full lg:w-1/2 space-y-3">
                            {data.map(d => {
                              const realPct = totalSpent > 0 ? (d.value / totalSpent) * 100 : 0;
                              const isOver = realPct > d.ideal;
                              return (
                                <div key={d.name} className="bg-white/3 rounded-lg p-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="flex items-center gap-2 text-xs font-bold text-white"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />{d.name}</span>
                                    <span className="text-xs font-mono text-slate-300">{formatCurrency(d.value)}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] font-bold">
                                    <span className={isOver ? 'text-finance-red' : 'text-finance-green'}>Real: {realPct.toFixed(1)}%</span>
                                    <span className="text-slate-500">Ideal: {d.ideal}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="card-minimal">
                    <h3 className="font-bold text-white mb-6">Minhas Metas</h3>
                    <div className="space-y-6">
                      {finance.goals.slice(0, 2).map(goal => (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white font-medium">{goal.name}</span>
                            <span className="text-slate-300 font-bold">{((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-fill bg-finance-blue" style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}></div>
                          </div>
                          <p className="text-[12px] text-slate-400 font-mono">Acumulado: {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}</p>
                        </div>
                      ))}
                      {finance.goals.length === 0 && <p className="text-xs text-slate-300 italic">Sem metas registradas.</p>}
                      <button onClick={() => setActiveTab('goals')} className="w-full mt-2 py-2 border border-finance-green text-finance-green rounded-lg text-sm font-semibold hover:bg-finance-green/10 transition-colors active:scale-[0.98]">Gerenciar Metas</button>
                    </div>
                  </div>

                  <div className={`card-minimal shadow-lg transition-all duration-500 border-l-4 ${finance.totalExpense > finance.totalIncome ? 'border-l-finance-red' : finance.totalExpense > finance.totalIncome * 0.85 ? 'border-l-finance-yellow' : 'border-l-finance-green'} text-white`}>
                    <h3 className="font-bold mb-1">Resumo Mensal</h3>
                    <p className="text-white/80 text-[10px] mb-4 uppercase font-bold tracking-wider">Status da Saúde Financeira</p>
                    <div className="flex items-start gap-4 bg-white/10 p-4 rounded-xl border border-white/10">
                      <div className="text-2xl mt-0.5">{finance.totalExpense > finance.totalIncome ? '🚨' : finance.totalExpense > finance.totalIncome * 0.85 ? '⚠️' : '✅'}</div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold leading-tight">{finance.totalExpense > finance.totalIncome ? 'ALERTA DE GASTOS!' : finance.totalExpense > finance.totalIncome * 0.85 ? 'AVISO DE LIMITE' : 'PARABÉNS!'}</p>
                        <p className="text-[11px] font-medium leading-relaxed opacity-90">
                          {finance.totalExpense > finance.totalIncome ? 'Você ultrapassou sua renda mensal! Reduza gastos imediatamente para evitar dívidas.' : finance.totalExpense > finance.totalIncome * 0.85 ? 'Você atingiu mais de 85% da sua renda. Cuidado para não usar a reserva dos seus sonhos.' : 'Seu orçamento está saudável e sob controle. Continue mantendo o foco nos 20% para seus sonhos!'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div key="transactions" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
              <TransactionForm
                onAdd={finance.addTransaction}
                goals={finance.goals}
                transactions={finance.transactions}
                savedAccounts={savedAccounts.savedAccounts}
                onSaveAccount={savedAccounts.addSavedAccount}
                onDeleteSavedAccount={savedAccounts.deleteSavedAccount}
              />

              <div className="card-minimal px-0 py-0 overflow-visible">
                <div className="p-6 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-bold text-white">Histórico de Lançamentos</h3>
                  <MonthNavigator 
                    date={historyDate} 
                    filterMode={filterMode}
                    onSelectDay={(d) => { setHistoryDate(d); setFilterMode('day'); setEditingId(null); }}
                    onSelectMonth={(d) => { setHistoryDate(d); setFilterMode('month'); setEditingId(null); }}
                  />
                </div>

                {(() => {
                  const filtered = finance.transactions.filter(t => {
                  const d = new Date(t.date + 'T12:00:00');
                    if (filterMode === 'day') {
                    return d.getDate() === historyDate.getDate() && d.getMonth() === historyDate.getMonth() && d.getFullYear() === historyDate.getFullYear();
                }
                    return d.getMonth() === historyDate.getMonth() && d.getFullYear() === historyDate.getFullYear();
                  }).sort((a, b) => new Date(b.date + 'T12:00:00').getTime() - new Date(a.date + 'T12:00:00').getTime());

                  return (
                    <TransactionList
                      transactions={filtered}
                      editingId={editingId}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      startEdit={startEdit}
                      saveEdit={saveEdit}
                      setEditingId={setEditingId}
                      handleDeleteClick={handleDeleteClick}
                      emptyMessage="Nenhum lançamento neste mês."
                    />
                  );

                })()}
              </div>
            </motion.div>
          )}

          {activeTab === 'yearly' && (
            <motion.div key="yearly" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <YearlyManager
                transactions={finance.transactions}
                onAddTransaction={finance.addTransaction}
                onDeleteTransaction={finance.deleteTransaction}
                goals={finance.goals}
                editingId={editingId}
                editForm={editForm}
                setEditForm={setEditForm}
                startEdit={startEdit}
                saveEdit={saveEdit}
                setEditingId={setEditingId}
                handleDeleteClick={handleDeleteClick}
              />
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div key="goals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GoalsManager goals={finance.goals} onAdd={finance.addGoal} onDelete={finance.deleteGoal} onUpdate={finance.updateGoal} dreamSavings={finance.expensesByCategory.Sonho} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
        {diffModal && (() => {
          const { original, diff } = diffModal;
          const hasFuture = finance.transactions.some(
            t => t.installmentId === original.installmentId && t.date > original.date
          );
          const isReduction = diff > 0; // sobrou valor (pagou menos)
          const absDiff = Math.abs(diff);

          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDiffModal(null)}
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'linear-gradient(160deg, #1a1a1e 0%, #232328 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="p-5 border-b border-white/5">
                  <h3 className="text-white font-bold text-base">Ajuste de parcela</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {isReduction
                      ? `Você reduziu esta parcela. Sobraram ${formatCurrency(absDiff)} para realocar. O que deseja fazer?`
                      : `Você aumentou esta parcela em ${formatCurrency(absDiff)}. Como deseja compensar?`}
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  {/* Opção A — Redistribuir (só se houver futuras) */}
                  {hasFuture && (
                    <button
                      onClick={async () => {
                        await finance.redistributeInstallmentDiff(original.installmentId!, original.date, diff);
                        setDiffModal(null);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                    >
                      <p className="text-white text-sm font-semibold">Redistribuir nas parcelas futuras</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {isReduction
                          ? 'O valor que sobrou é somado às próximas parcelas.'
                          : 'O valor extra é abatido das próximas parcelas.'}
                      </p>
                    </button>
                  )}

                  {/* Opção B — Criar parcela extra (só em reduções) */}
                  {isReduction && (
                    <button
                      onClick={async () => {
                        await finance.addExtraInstallment(original.installmentId!, absDiff);
                        setDiffModal(null);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                    >
                      <p className="text-white text-sm font-semibold">Criar uma nova parcela</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Adiciona uma parcela extra de {formatCurrency(absDiff)} ao final.
                      </p>
                    </button>
                  )}

                  {/* Caso não haja nenhuma opção aplicável */}
                  {!hasFuture && !isReduction && (
                    <p className="text-slate-400 text-xs text-center py-2">
                      Não há parcelas futuras para compensar. A alteração foi aplicada apenas nesta parcela.
                    </p>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setDiffModal(null)}
                    className="w-full px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
                  >
                    {(!hasFuture && !isReduction) ? 'Entendi' : 'Não fazer nada'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
      </main>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteTarget(null)}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'linear-gradient(160deg, #1a1a1e 0%, #232328 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="p-5 border-b border-white/5">
                <h3 className="text-white font-bold text-base">Excluir lançamento parcelado</h3>
                <p className="text-slate-400 text-xs mt-1">"{deleteTarget.description}" faz parte de um parcelamento. O que deseja excluir?</p>
              </div>
              <div className="p-4 space-y-2">
                <button
                  onClick={() => { finance.deleteTransaction(deleteTarget.id); setDeleteTarget(null); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  <p className="text-white text-sm font-semibold">Apenas esta parcela</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Remove só este mês, as demais continuam.</p>
                </button>
                <button
                  onClick={() => { if (deleteTarget.installmentId) finance.deleteInstallmentGroup(deleteTarget.installmentId); setDeleteTarget(null); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-finance-red/10 hover:bg-finance-red/20 border border-finance-red/20 transition-all"
                >
                  <p className="text-finance-red text-sm font-semibold">Todas as parcelas</p>
                  <p className="text-finance-red/70 text-[11px] mt-0.5">Remove o parcelamento inteiro ({deleteTarget.installmentTotal} parcelas).</p>
                </button>
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {groupEditModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setGroupEditModal(null)}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'linear-gradient(160deg, #1a1a1e 0%, #232328 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="p-5 border-b border-white/5">
                <h3 className="text-white font-bold text-base">Editar parcelamento</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Esta alteração ({groupEditModal.fields.description && 'descrição'}{groupEditModal.fields.description && groupEditModal.fields.category && ' e '}{groupEditModal.fields.category && 'categoria'}) pode valer para todas as parcelas. O que deseja?
                </p>
              </div>
              <div className="p-4 space-y-2">
                <button
                  onClick={() => setGroupEditModal(null)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  <p className="text-white text-sm font-semibold">Apenas esta parcela</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">A mudança fica só neste mês.</p>
                </button>
                <button
                  onClick={async () => {
                    await finance.updateInstallmentGroupFields(groupEditModal.original.installmentId!, groupEditModal.fields);
                    setGroupEditModal(null);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-finance-green/10 hover:bg-finance-green/20 border border-finance-green/20 transition-all"
                >
                  <p className="text-finance-green text-sm font-semibold">Todas as parcelas</p>
                  <p className="text-finance-green/70 text-[11px] mt-0.5">Aplica a mudança em todo o parcelamento.</p>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FinanceAgent
        transactions={finance.transactions}
        goals={finance.goals}
        totalIncome={finance.totalIncome}
        totalExpense={finance.totalExpense}
        expensesByCategory={finance.expensesByCategory}
        idealByCategory={finance.idealByCategory}
        percentSpent={finance.percentSpent}
      />
    </div>
  );
}

function MonthNavigator({ date, filterMode, onSelectDay, onSelectMonth }: { 
  date: Date; 
  filterMode: 'day' | 'month';
  onSelectDay: (d: Date) => void; 
  onSelectMonth: (d: Date) => void;
}) {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const now = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [calYear, setCalYear] = useState(date.getFullYear());
  const [calMonth, setCalMonth] = useState(date.getMonth());

  const handleCalPrev = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };

  const handleCalNext = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const handleDayClick = (day: number) => {
    onSelectDay(new Date(calYear, calMonth, day));
    setIsOpen(false);
  };

  const handleMonthClick = () => {
    onSelectMonth(new Date(calYear, calMonth, 1));
    setIsOpen(false);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const label = filterMode === 'day'
    ? `${String(date.getDate()).padStart(2, '0')} ${monthsShort[date.getMonth()]} ${date.getFullYear()}`
    : `${months[date.getMonth()]} ${date.getFullYear()}`;

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => { setCalYear(date.getFullYear()); setCalMonth(date.getMonth()); setIsOpen(!isOpen); }}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-1.5 text-sm font-bold text-slate-200 outline-none hover:border-finance-green transition-colors cursor-pointer flex items-center gap-2">
      <Calendar size={14} className="text-finance-green" />
        {label}
    </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed sm:absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 sm:left-auto sm:translate-x-0 sm:right-0 sm:top-10 sm:translate-y-0 z-50 rounded-2xl shadow-2xl overflow-hidden w-[calc(100vw-2rem)] sm:w-70"
              style={{
                background: 'linear-gradient(160deg, #1a1a1e 0%, #232328 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <button onClick={handleCalPrev} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-white font-bold text-sm">
                  {monthsShort[calMonth]} {calYear}
                </span>
                <button onClick={handleCalNext} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                {weekDays.map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-slate-500 uppercase py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
                {blanks.map((_, i) => <div key={`b-${i}`} />)}
                {days.map(day => {
                  const isSelectedDay = filterMode === 'day' && day === date.getDate() && calMonth === date.getMonth() && calYear === date.getFullYear();
                  const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`
                        w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all flex items-center justify-center
                        ${isSelectedDay ? 'bg-finance-green text-white font-bold' : ''}
                        ${isToday && !isSelectedDay ? 'border border-finance-green text-finance-green' : ''}
                        ${!isSelectedDay && !isToday ? 'text-slate-300 hover:bg-white/10 hover:text-white' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="px-3 pb-3 flex gap-2">
                <button
                  onClick={() => { onSelectDay(new Date()); setIsOpen(false); }}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-bold text-finance-green hover:bg-finance-green/10 transition-colors border border-finance-green/20"
                >
                  Hoje
                </button>
                <button
                  onClick={handleMonthClick}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-bold text-blue-400 hover:bg-blue-500/10 transition-colors border border-blue-500/20"
                >
                  Mês inteiro
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function TransactionList({
  transactions,
  editingId,
  editForm,
  setEditForm,
  startEdit,
  saveEdit,
  setEditingId,
  handleDeleteClick,
  emptyMessage = 'Nenhum lançamento neste período.',
}: {
  transactions: Transaction[];
  editingId: string | null;
  editForm: Partial<Transaction>;
  setEditForm: (f: Partial<Transaction>) => void;
  startEdit: (t: Transaction) => void;
  saveEdit: () => void;
  setEditingId: (id: string | null) => void;
  handleDeleteClick: (t: Transaction) => void;
  emptyMessage?: string;
}) {
  return (
    <>
      <div className="hidden md:block overflow-x-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/3">
            <tr className="text-[10px] uppercase font-bold text-slate-400">
              <th className="px-6 py-4">Data</th><th className="px-6 py-4">Descrição</th><th className="px-6 py-4">Categoria</th><th className="px-6 py-4 text-right">Valor</th><th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {transactions.map(t => (
              editingId === t.id ? (
                <tr key={t.id} className="border-t border-white/5 bg-white/3">
                  <td className="px-3 py-2"><input type="date" value={editForm.date} disabled={!!t.installmentId} onChange={e => setEditForm({ ...editForm, date: e.target.value })} title={t.installmentId ? 'A data de parcelas não pode ser alterada' : ''} className={`bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-finance-green w-full ${t.installmentId ? 'opacity-40 cursor-not-allowed' : ''}`} /></td>
                  <td className="px-3 py-2"><input type="text" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-finance-green w-full" /></td>
                  <td className="px-3 py-2">
                    <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value as TransactionCategory })} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-finance-green">
                      <option value="Necessidade">Necessidade</option><option value="Desejo">Desejo</option><option value="Sonho">Sonho</option><option value="Extra">Extra</option><option value="Salário">Salário</option>
                    </select>
                  </td>
                  <td className="px-3 py-2"><input type="number" step="0.01" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-finance-green w-full text-right" /></td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={saveEdit} className="p-1.5 text-slate-400 hover:text-finance-green transition-colors" title="Salvar"><Check size={16} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-finance-red transition-colors" title="Cancelar"><X size={16} /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={t.id} className="border-t border-white/5 hover:bg-white/5 transition-all group">
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs group-hover:text-white transition-colors">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-medium text-slate-200 group-hover:text-white transition-all group-hover:translate-x-1">{t.description}</td>
                  <td className="px-6 py-4"><CategoryBadge category={t.category} isType={t.type === 'Entrada' ? 'Entrada' : undefined} /></td>
                  <td className={`px-6 py-4 text-right font-bold transition-all ${t.type === 'Entrada' ? 'text-blue-300 group-hover:text-blue-200' : 'text-red-300 group-hover:text-red-200'}`}>{t.type === 'Entrada' ? '+' : '-'} {formatCurrency(t.amount)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => startEdit(t)} className="p-1 hover:text-finance-green text-slate-400 transition-colors" title="Editar"><Pencil size={15} /></button>
                      <button onClick={() => handleDeleteClick(t)} className="p-1 hover:text-finance-red text-slate-400 transition-colors" title="Excluir"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-slate-50">
        {transactions.map(t => (
          editingId === t.id ? (
            <div key={t.id} className="p-4 bg-white/5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[9px] text-slate-400 uppercase font-bold">Data {t.installmentId && <span className="text-slate-500 normal-case">(travada)</span>}</label><input type="date" value={editForm.date} disabled={!!t.installmentId} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className={`w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-finance-green ${t.installmentId ? 'opacity-40 cursor-not-allowed' : ''}`} /></div>
                <div className="space-y-1"><label className="text-[9px] text-slate-400 uppercase font-bold">Valor</label><input type="number" step="0.01" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-finance-green" /></div>
              </div>
              <div className="space-y-1"><label className="text-[9px] text-slate-400 uppercase font-bold">Descrição</label><input type="text" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-finance-green" /></div>
              <div className="space-y-1"><label className="text-[9px] text-slate-400 uppercase font-bold">Categoria</label><select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value as TransactionCategory })} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-finance-green"><option value="Necessidade">Necessidade</option><option value="Desejo">Desejo</option><option value="Sonho">Sonho</option><option value="Extra">Extra</option><option value="Salário">Salário</option></select></div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveEdit} className="flex-1 py-1.5 bg-finance-green text-white text-xs font-bold rounded flex items-center justify-center gap-1"><Check size={14} /> Salvar</button>
                <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 bg-white/10 text-slate-200 text-xs font-bold rounded hover:bg-white/15 transition-colors">Cancelar</button>
              </div>
            </div>
          ) : (
            <div key={t.id} className="p-4 flex flex-col gap-3 hover:bg-white/5 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-200 leading-tight mb-1">{t.description}</h4>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-mono text-slate-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    <CategoryBadge category={t.category} isType={t.type === 'Entrada' ? 'Entrada' : undefined} />
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`text-sm font-bold whitespace-nowrap ${t.type === 'Entrada' ? 'text-blue-300' : 'text-red-300'}`}>{t.type === 'Entrada' ? '+' : '-'} {formatCurrency(t.amount)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(t)} className="p-1.5 bg-white/5 text-slate-300 rounded-md hover:text-finance-green transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => handleDeleteClick(t)} className="p-1.5 bg-white/5 text-slate-300 rounded-md hover:text-finance-red transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <History size={40} className="mb-4 opacity-20" />
          <p className="italic">{emptyMessage}</p>
        </div>
      )}
    </>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <div onClick={onClick} className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}>
      <span className="mr-3">{icon}</span>{label}
    </div>
  );
}

function ShutterTitle({ text }: { text: string }) {
  const characters = text.split("");
  return (
    <div className="flex flex-wrap items-center">
      {characters.map((char, i) => (
        <div key={i} className="relative overflow-hidden">
          <motion.span
            initial={{ opacity: 0, filter: "blur(10px)", y: 8 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ delay: i * 0.04 + 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl font-extrabold text-white tracking-tight inline-block"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>

          <motion.span
            initial={{ x: "-110%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 0.7, delay: i * 0.04, ease: "easeInOut" }}
            className="absolute inset-0 text-5xl md:text-6xl font-extrabold text-finance-green tracking-tight pointer-events-none"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>

          <motion.span
            initial={{ x: "110%" }}
            animate={{ x: "-120%" }}
            transition={{ duration: 0.7, delay: i * 0.04 + 0.15, ease: "easeInOut" }}
            className="absolute inset-0 text-5xl md:text-6xl font-extrabold text-white tracking-tight pointer-events-none"
            style={{ clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

function AnimatedCurrency({ value, className }: { value: number; className?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => formatCurrency(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [value]);

  return <motion.span className={className}>{rounded}</motion.span>;
}

function CategoryCard({ category, limit, current, ideal, percent }: { category: TransactionCategory; limit: number; current: number; ideal: number; percent: number }) {
  const isOver = percent > limit;
  const progressColors: Record<string, string> = { Necessidade: 'bg-emerald-400', Desejo: 'bg-amber-400', Sonho: 'bg-violet-400' };
  return (
    <div className="card-minimal hover:border-finance-green/40 hover:shadow-[0_4px_32px_rgba(34,197,94,0.12)] hover:-translate-y-0.5">
      <div className="flex justify-between items-start mb-4">
        <span className="bg-finance-green/15 text-finance-green text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">{category} ({limit}%)</span>
        <span className={`${isOver ? 'text-finance-red font-bold animate-pulse' : 'text-slate-400 font-medium'} text-xs`}>Ideal: {formatCurrency(ideal)}</span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <AnimatedCurrency value={current} className="text-4xl font-extrabold text-white tracking-tight" />
        <span className="text-slate-500 pb-1.5 text-sm">/ mês</span>
      </div>
      <div className="progress-bar-bg mb-2.5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(percent, 100)}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className={`rounded-full h-2 ${isOver ? 'bg-finance-red' : progressColors[category]}`} />
      </div>
      <p className={`text-xs font-medium ${isOver ? 'text-finance-red' : 'text-slate-500'}`}>
        {isOver ? `⚠️ Ultrapassou o ideal em ${formatCurrency(current - ideal)}` : `Utilizado: ${percent.toFixed(1)}% do orçamento`}
      </p>
    </div>
  );
}

function CategoryBadge({ category, isType }: { category: string; isType?: string }) {
  const styles: Record<string, string> = { Necessidade: 'bg-blue-500/15 text-blue-300', Desejo: 'bg-amber-500/15 text-amber-300', Sonho: 'bg-violet-500/15 text-violet-300', Entrada: 'bg-indigo-500/15 text-indigo-300', Salário: 'bg-finance-green/15 text-finance-green font-bold', Extra: 'bg-teal-500/15 text-teal-300 font-medium' };
  return <span className={`${styles[isType || category] || 'bg-white/10 text-slate-300'} px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium`}>{isType || category}</span>;
}

function TransactionForm({ onAdd, goals, transactions = [], savedAccounts = [], onSaveAccount, onDeleteSavedAccount }: {
  onAdd: (t: any) => void; goals: any[]; transactions?: any[]; savedAccounts?: any[];
  onSaveAccount?: (a: any) => void; onDeleteSavedAccount?: (id: string) => void;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('Saída');
  const [category, setCategory] = useState<TransactionCategory>('Necessidade');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [goalId, setGoalId] = useState<string>('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [numInstallments, setNumInstallments] = useState('2');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (type === 'Entrada') { setCategory('Extra'); setIsInstallment(false); }
    else if (category === 'Extra' || category === 'Salário') setCategory('Necessidade');
  }, [type, category]);

  const historicDescriptions = Array.from(new Set(transactions.map(t => t.description))).filter(d => d !== 'Renda Mensal');
  const favoritedDescriptions = savedAccounts.map((s: any) => s.description);

  const suggestions = description.length >= 1 ? [
    ...savedAccounts.filter((s: any) => s.description.toLowerCase().includes(description.toLowerCase())).map((s: any) => ({ ...s, isFavorite: true })),
    ...historicDescriptions.filter(d => d.toLowerCase().includes(description.toLowerCase()) && !favoritedDescriptions.includes(d)).map(d => ({ description: d, isFavorite: false, id: null, amount: 0 })),
  ].slice(0, 7) : [];

  const isFavorited = savedAccounts.some((s: any) => s.description.toLowerCase() === description.toLowerCase());

  const applySelection = (s: any) => {
    setDescription(s.description);
    if (s.isFavorite) { if (s.amount) setAmount(s.amount.toString()); if (s.category) setCategory(s.category); if (s.type) setType(s.type); }
    setShowSuggestions(false);
  };

  const toggleFavorite = () => {
    if (!description) return;
    if (isFavorited) { const acc = savedAccounts.find((s: any) => s.description.toLowerCase() === description.toLowerCase()); if (acc && onDeleteSavedAccount) onDeleteSavedAccount(acc.id); }
    else { if (onSaveAccount) onSaveAccount({ description, amount: parseFloat(amount) || 0, category, type }); }
  };

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!description || !amount) return;
  const baseAmount = parseFloat(amount);
  const startDate = new Date(date + 'T12:00:00');
  if (isInstallment && ['Necessidade', 'Desejo', 'Sonho'].includes(category)) {
    const n = parseInt(numInstallments);
    const installmentId = crypto.randomUUID();
    for (let i = 0; i < n; i++) {
      const d = new Date(startDate); d.setMonth(startDate.getMonth() + i);
      onAdd({ description: `${description} (${String(i + 1).padStart(2, '0')}/${String(n).padStart(2, '0')})`, amount: baseAmount / n, type, category, date: d.toISOString().split('T')[0], goalId: category === 'Sonho' ? goalId : undefined, installmentId, installmentIndex: i + 1, installmentTotal: n });
    }
  } else {
    onAdd({ description, amount: baseAmount, type, category, date, goalId: category === 'Sonho' ? goalId : undefined });
  }
  setDescription(''); setAmount(''); setGoalId(''); setIsInstallment(false);
  setDate(new Date().toISOString().split('T')[0]);
};

  return (
    <form onSubmit={handleSubmit} className="card-minimal">
      <h3 className="font-bold mb-6 text-white">Novo Lançamento</h3>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${category === 'Sonho' ? 'xl:grid-cols-7' : 'xl:grid-cols-6'} gap-6 transition-all duration-300`}>

        <div className="space-y-2 relative">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</label>
          <div className="flex gap-1.5">
            <input type="text" value={description}
              onChange={e => { setDescription(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-finance-green focus:bg-white/10 transition-all"
              placeholder="Ex: Jantar Japonês" autoComplete="off" />
            <button type="button" onClick={toggleFavorite}
              title={isFavorited ? 'Remover dos favoritos' : 'Salvar como favorito'}
              className={`shrink-0 px-2.5 rounded-lg border transition-all ${isFavorited ? 'bg-amber-400/20 border-amber-400 text-amber-400 hover:bg-amber-400/30' : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-400 hover:border-amber-400/40'} ${!description ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <Star size={15} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg shadow-xl overflow-hidden" style={{ background: 'linear-gradient(160deg, #1a1a1e 0%, #232328 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {suggestions.map((s: any, i: number) => (
                <div key={i} onMouseDown={() => applySelection(s)} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    {s.isFavorite && <Star size={11} className="text-amber-400 shrink-0" fill="currentColor" />}
                    <span className="text-sm text-white truncate">{s.description}</span>
                  </div>
                  {s.isFavorite && s.amount > 0 && <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">{formatCurrency(s.amount)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-finance-green focus:bg-white/10 transition-all" placeholder="R$ 0,00" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-finance-green focus:bg-white/10 transition-all cursor-pointer" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value as any)} disabled={type === 'Entrada'} className={`w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-finance-green transition-all ${type === 'Entrada' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer'}`}>
            {type === 'Entrada' ? <option value="Extra">Extra</option> : (<><option value="Necessidade">Necessidade (50%)</option><option value="Desejo">Desejo (30%)</option><option value="Sonho">Sonho (20%)</option></>)}
          </select>
        </div>

        {category === 'Sonho' && (
          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vincular Meta</label>
            <select value={goalId} onChange={e => setGoalId(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-finance-green hover:bg-white/10 transition-all cursor-pointer">
              <option value="">Selecione...</option>
              {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</label>
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-lg h-10.5">
            <button type="button" onClick={() => setType('Entrada')} className={`flex-1 rounded-md text-[10px] font-bold transition-all ${type === 'Entrada' ? 'bg-finance-green/20 text-finance-green' : 'text-slate-400 hover:text-slate-200'}`}>ENTRADA</button>
            <button type="button" onClick={() => setType('Saída')} className={`flex-1 rounded-md text-[10px] font-bold transition-all ${type === 'Saída' ? 'bg-finance-red/20 text-finance-red' : 'text-slate-400 hover:text-slate-200'}`}>SAÍDA</button>
          </div>
        </div>

        <div className="flex items-end">
          <button type="submit" className="w-full h-10.5 flex items-center justify-center gap-2 border border-finance-green text-finance-green rounded-lg text-sm font-semibold hover:bg-finance-green/10 transition-colors active:scale-[0.98]"><Plus size={18} /> Adicionar</button>
        </div>
      </div>

      {type === 'Saída' && ['Necessidade', 'Desejo', 'Sonho'].includes(category) && (
        <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap items-center gap-6 animate-in fade-in slide-in-from-top-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div onClick={() => setIsInstallment(!isInstallment)} className={`w-10 h-5 rounded-full transition-all relative ${isInstallment ? 'bg-finance-green' : 'bg-white/15'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isInstallment ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-slate-400 transition-colors">Compra Parcelada?</span>
          </label>
          {isInstallment && (
            <div className="flex items-center gap-3 animate-in zoom-in-95 duration-200">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nº de Parcelas</label>
              <input type="number" min="2" max="72" value={numInstallments} onChange={e => setNumInstallments(e.target.value)} className="w-16 bg-white/5 border border-white/10 text-white rounded px-3 py-1 text-sm outline-none focus:border-finance-green" />
              <span className="text-xs text-slate-400 italic">(Serão gerados {numInstallments} lançamentos mensais)</span>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

function YearSelector({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [isOpen, setIsOpen] = useState(false);
  const [decadeStart, setDecadeStart] = useState(Math.floor(year / 12) * 12);

  const handleYearClick = (y: number) => {
    onChange(y);
    setIsOpen(false);
  };

  const yearsGrid = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  return (
    <div className="relative">
      <button
        onClick={() => { setDecadeStart(Math.floor(year / 12) * 12); setIsOpen(!isOpen); }}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-1.5 text-sm font-bold text-slate-200 outline-none hover:border-finance-green transition-colors cursor-pointer flex items-center gap-2"
      >
        <Calendar size={14} className="text-finance-green" />
        {year}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed sm:absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 sm:left-auto sm:translate-x-0 sm:right-0 sm:top-10 sm:translate-y-0 z-50 rounded-2xl shadow-2xl overflow-hidden w-[calc(100vw-2rem)] sm:w-[280px]"
              style={{
                background: 'linear-gradient(160deg, #1a1a1e 0%, #232328 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <button onClick={() => setDecadeStart(d => d - 12)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-white font-bold text-sm">
                  {decadeStart} – {decadeStart + 11}
                </span>
                <button onClick={() => setDecadeStart(d => d + 12)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3">
                {yearsGrid.map(y => {
                  const isSelected = y === year;
                  const isCurrent = y === currentYear;
                  return (
                    <button
                      key={y}
                      onClick={() => handleYearClick(y)}
                      className={`
                        py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center
                        ${isSelected ? 'bg-finance-green text-white font-bold' : ''}
                        ${isCurrent && !isSelected ? 'border border-finance-green text-finance-green' : ''}
                        ${!isSelected && !isCurrent ? 'text-slate-300 hover:bg-white/10 hover:text-white' : ''}
                      `}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>

              <div className="px-3 pb-3">
                <button
                  onClick={() => { onChange(currentYear); setIsOpen(false); }}
                  className="w-full py-1.5 rounded-lg text-[11px] font-bold text-finance-green hover:bg-finance-green/10 transition-colors border border-finance-green/20"
                >
                  Ano atual
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function YearlyManager({ transactions, onAddTransaction, onDeleteTransaction, goals, editingId, editForm, setEditForm, startEdit, saveEdit, setEditingId, handleDeleteClick }: {
  transactions: any[]; onAddTransaction: any; onDeleteTransaction: any; goals: any[];
  editingId: string | null;
  editForm: Partial<Transaction>;
  setEditForm: (f: Partial<Transaction>) => void;
  startEdit: (t: Transaction) => void;
  saveEdit: () => void;
  setEditingId: (id: string | null) => void;
  handleDeleteClick: (t: Transaction) => void;
}) {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [isAddingInMonth, setIsAddingInMonth] = useState(false);
  const [desc, setDesc] = useState(''); const [val, setVal] = useState(''); const [cat, setCat] = useState<TransactionCategory>('Necessidade'); const [typ, setTyp] = useState<TransactionType>('Saída'); const [gId, setGId] = useState('');

  useEffect(() => { if (isAddingInMonth) { setDesc(''); setVal(''); setGId(''); if (typ === 'Entrada') setCat('Extra'); } }, [isAddingInMonth, selectedMonthIndex]);
  useEffect(() => { if (typ === 'Entrada') setCat('Extra'); else if (cat === 'Extra' || cat === 'Salário') setCat('Necessidade'); }, [typ]);

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const annualData = months.map((m, i) => {
    const mt = transactions.filter(t => { const d = new Date(t.date + 'T12:00:00'); return d.getMonth() === i && d.getFullYear() === selectedYear; });
    return { month: m, income: mt.filter(t => t.type === 'Entrada').reduce((a, t) => a + t.amount, 0), expense: mt.filter(t => t.type === 'Saída').reduce((a, t) => a + t.amount, 0), balance: mt.filter(t => t.type === 'Entrada').reduce((a, t) => a + t.amount, 0) - mt.filter(t => t.type === 'Saída').reduce((a, t) => a + t.amount, 0), index: i };
  });

  const getMonthlyTransactions = () => selectedMonthIndex === null ? [] : transactions.filter(t => { const d = new Date(t.date + 'T12:00:00'); return d.getMonth() === selectedMonthIndex && d.getFullYear() === selectedYear; }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddInMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !val || selectedMonthIndex === null) return;
    onAddTransaction({ description: desc, amount: parseFloat(val), type: typ, category: cat, date: `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}-01`, goalId: cat === 'Sonho' ? gId : undefined });
    setIsAddingInMonth(false);
  };

  if (showAll) {
    const allTransactions = [...transactions].sort((a, b) => new Date(b.date + 'T12:00:00').getTime() - new Date(a.date + 'T12:00:00').getTime());
    return (
      <div className="card-minimal px-0 py-0 overflow-visible text-sm">
        <div className="p-6 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => { setShowAll(false); setEditingId(null); }} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
            <div><h3 className="font-bold text-white">Histórico Geral</h3><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Todos os lançamentos</p></div>
          </div>
        </div>
        <TransactionList
          transactions={allTransactions}
          editingId={editingId}
          editForm={editForm}
          setEditForm={setEditForm}
          startEdit={startEdit}
          saveEdit={saveEdit}
          setEditingId={setEditingId}
          handleDeleteClick={handleDeleteClick}
          emptyMessage="Nenhum lançamento registrado ainda."
        />
      </div>
    );
  }

  if (selectedMonthIndex !== null) {
    const monthlyTransactions = getMonthlyTransactions();

    return (
      <div className="card-minimal px-0 py-0 overflow-hidden text-sm">
        <div className="p-6 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedMonthIndex(null); setIsAddingInMonth(false); }} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
            <div><h3 className="font-bold text-white">Detalhes de {months[selectedMonthIndex]} / {selectedYear}</h3><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Lançamentos do mês</p></div>
          </div>
          <button onClick={() => setIsAddingInMonth(!isAddingInMonth)} className={`btn-minimal-primary flex items-center gap-2 ${isAddingInMonth ? 'bg-slate-500 hover:bg-slate-600' : ''}`}>
            {isAddingInMonth ? <X size={18} /> : <Plus size={18} />}{isAddingInMonth ? 'Cancelar' : 'Novo Lançamento'}
          </button>
        </div>
        {isAddingInMonth && (
          <div className="p-6 bg-white/3 border-b border-white/5 animate-in fade-in slide-in-from-top-2">
            <form onSubmit={handleAddInMonth} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Descrição</label><input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded px-3 py-1.5 text-xs outline-none focus:border-finance-green" placeholder="Ex: Conta de Luz" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Valor</label><input type="number" step="0.01" value={val} onChange={e => setVal(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded px-3 py-1.5 text-xs outline-none focus:border-finance-green" placeholder="R$ 0,00" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Categoria</label><select value={cat} onChange={e => setCat(e.target.value as any)} disabled={typ === 'Entrada'} className="w-full bg-white/5 border border-white/10 text-white rounded px-3 py-1.5 text-xs outline-none focus:border-finance-green">{typ === 'Entrada' ? <option value="Extra">Extra</option> : (<><option value="Necessidade">Necessidade</option><option value="Desejo">Desejo</option><option value="Sonho">Sonho</option></>)}</select></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Tipo</label><div className="flex bg-white/5 border border-white/10 p-0.5 rounded gap-0.5"><button type="button" onClick={() => setTyp('Entrada')} className={`flex-1 text-[9px] font-bold py-1 rounded ${typ === 'Entrada' ? 'bg-finance-green/20 text-finance-green' : 'text-slate-400'}`}>ENTRADA</button><button type="button" onClick={() => setTyp('Saída')} className={`flex-1 text-[9px] font-bold py-1 rounded ${typ === 'Saída' ? 'bg-finance-red/20 text-finance-red' : 'text-slate-400'}`}>SAÍDA</button></div></div>
              <div className="flex items-end"><button type="submit" className="w-full py-1.5 bg-finance-green text-white rounded font-bold text-[10px] hover:bg-green-500 transition-colors">ADICIONAR</button></div>
              {cat === 'Sonho' && typ === 'Saída' && (<div className="lg:col-span-5 space-y-1 mt-2"><label className="text-[9px] font-bold text-slate-400 uppercase">Vincular Meta</label><select value={gId} onChange={e => setGId(e.target.value)} className="w-full max-w-xs bg-white/5 border border-white/10 text-white rounded px-3 py-1.5 text-xs outline-none focus:border-finance-green"><option value="">Selecione a meta...</option>{goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>)}
            </form>
          </div>
        )}
        <TransactionList
          transactions={monthlyTransactions}
          editingId={editingId}
          editForm={editForm}
          setEditForm={setEditForm}
          startEdit={startEdit}
          saveEdit={saveEdit}
          setEditingId={setEditingId}
          handleDeleteClick={handleDeleteClick}
          emptyMessage="Nenhum lançamento encontrado para este mês."
        />
      </div>
    );
  }

  return (
    <div className="card-minimal px-0 py-0 overflow-visible text-sm">
      <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div><h3 className="font-bold text-white">Consolidado do Ano</h3><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Clique no mês para ver detalhes</p></div>
        <div className="flex items-center gap-2 shrink-0">
          <YearSelector year={selectedYear} onChange={setSelectedYear} />
          <button
            onClick={() => { setShowAll(true); setEditingId(null); }}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-1.5 text-sm font-bold text-slate-200 outline-none hover:border-finance-green transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <History size={14} className="text-finance-green shrink-0" />
            Histórico Geral
          </button>
        </div>
      </div>
      <div className="hidden md:block overflow-x-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/3"><tr className="text-[10px] uppercase font-bold text-slate-400"><th className="px-6 py-4">Mês</th><th className="px-6 py-4">Entradas</th><th className="px-6 py-4">Saídas</th><th className="px-6 py-4">Balanço</th><th className="px-6 py-4 text-center">Ações</th></tr></thead>
          <tbody className="text-sm">
            {annualData.map(data => (
              <tr key={data.month} onClick={() => setSelectedMonthIndex(data.index)} className="border-t border-white/5 hover:bg-white/5 transition-all cursor-pointer group">
                <td className="px-6 py-4 font-medium text-slate-200 group-hover:text-white transition-all group-hover:translate-x-1">{data.month}</td>
                <td className="px-6 py-4 font-mono text-xs text-blue-300">{formatCurrency(data.income)}</td>
                <td className="px-6 py-4 font-mono text-xs text-red-300">{formatCurrency(data.expense)}</td>
                <td className={`px-6 py-4 font-bold font-mono text-xs transition-all ${data.balance >= 0 ? 'text-blue-300 group-hover:text-blue-200' : 'text-red-300 group-hover:text-red-200'}`}>{formatCurrency(data.balance)}</td>
                <td className="px-6 py-4 text-center text-slate-400 group-hover:text-white transition-all group-hover:translate-x-1"><ChevronRight size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-white/5">
        {annualData.map(data => (
          <div key={data.month} onClick={() => setSelectedMonthIndex(data.index)} className="p-4 flex flex-col gap-3 hover:bg-white/5 transition-colors cursor-pointer">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200 text-base flex items-center gap-2">{data.month}<ChevronRight size={14} className="text-slate-400" /></span>
              <span className={`text-base font-bold font-mono ${data.balance >= 0 ? 'text-blue-300' : 'text-red-300'}`}>{formatCurrency(data.balance)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Entradas</p><p className="font-mono text-xs text-blue-300 font-bold">{formatCurrency(data.income)}</p></div>
              <div className="space-y-1 text-right"><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Saídas</p><p className="font-mono text-xs text-red-300 font-bold">{formatCurrency(data.expense)}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsManager({ goals, onAdd, onDelete, onUpdate, dreamSavings }: { goals: any[]; onAdd: any; onDelete: any; onUpdate: any; dreamSavings: number }) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!name || !targetAmount) return; onAdd({ name, targetAmount: parseFloat(targetAmount), currentAmount: 0 }); setName(''); setTargetAmount(''); };
  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="card-minimal">
        <h3 className="font-bold mb-4 text-white">Nova Meta de Sonho</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome do Sonho</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-finance-green focus:bg-white/10" placeholder="Ex: Viagem para o Japão" /></div>
          <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Objetivo</label><input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-finance-green focus:bg-white/10" placeholder="R$ 0,00" /></div>
          <div className="flex items-end"><button type="submit" className="w-full h-10.5 border border-finance-green text-finance-green rounded-lg text-sm font-semibold hover:bg-finance-green/10 transition-colors active:scale-[0.98]">Criar Meta</button></div>
        </div>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <div key={goal.id} className="card-minimal flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div><h3 className="font-bold text-lg text-white">{goal.name}</h3><p className="text-xs text-slate-400">Total acumulado: {formatCurrency(goal.currentAmount)}</p></div>
                <button onClick={() => onDelete(goal.id)} className="p-1 text-slate-400 hover:text-finance-red transition-colors"><Trash2 size={18} /></button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest"><span>Progresso</span><span className="text-slate-200 font-bold">{progress.toFixed(0)}%</span></div>
                <div className="progress-bar-bg"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-finance-green rounded-full" /></div>
                <p className="text-[10px] text-slate-400">Meta final: {formatCurrency(goal.targetAmount)}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-white/5"><p className="text-[10px] text-slate-400 bg-white/5 p-2 rounded text-center italic">O progresso é atualizado automaticamente ao adicionar lançamentos na categoria "Sonho".</p></div>
            </div>
          );
        })}
      </div>
      {goals.length === 0 && <p className="text-center py-20 text-slate-400 italic">Planeje seus sonhos!</p>}
    </div>
  );
}
