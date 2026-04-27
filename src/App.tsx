import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Wallet, Target, LayoutDashboard, History, Calendar, Menu, X, Pencil, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinance } from './useFinance';
import { TransactionCategory, TransactionType } from './types';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Cell, AreaChart, Area } from 'recharts';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export default function App() {
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'transactions' | 'yearly' | 'goals'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState('');
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const finance = useFinance();

  const handleIncomeSubmit = () => {
    if (tempIncome !== '' && !isNaN(parseFloat(tempIncome))) {
      finance.updateMonthlyIncome(parseFloat(tempIncome));
    }
    setIsEditingIncome(false);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-zinc-800">
      {/* Mobile Toggle */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 right-4 z-50 md:hidden bg-green-600 p-2 rounded-lg shadow-sm border border-black"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-zinc-800 border-black border-r flex flex-col transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static
      `}>
        {/* Logo Container */}
        <div className="p-8 flex items-center gap-3">
          <div className="w-40 h-14 rounded-xl overflow-hidden shadow-sm group transition-transform hover:scale-105 active:scale-95 flex-shrink-0">
            <img
              src="img/LOGO-EVOK-EF01.png"
              alt="Logo Evok"
              className="w-full h-full object-cover"
            />
          </div>
      </div>

        <nav className="flex-1 mt-4">
          <SidebarItem 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
          />
          <SidebarItem 
            active={activeTab === 'transactions'} 
            onClick={() => { setActiveTab('transactions'); setIsSidebarOpen(false); }} 
            icon={<History size={18} />} 
            label="Lançamentos" 
          />
          <SidebarItem 
            active={activeTab === 'yearly'} 
            onClick={() => { setActiveTab('yearly'); setIsSidebarOpen(false); }} 
            icon={<Calendar size={18} />} 
            label="Consolidado Anual" 
          />
          <SidebarItem 
            active={activeTab === 'goals'} 
            onClick={() => { setActiveTab('goals'); setIsSidebarOpen(false); }} 
            icon={<Target size={18} />} 
            label="Metas (Sonhos)" 
          />
        </nav>

        <div className="p-6 mt-auto border-t border-black">
          <div className="bg-green-600 rounded-xl p-4">
            <p className="text-[10px] text-white font-bold uppercase tracking-wider mb-1">Saldo Total</p>
            <p className={`text-xl font-bold ${finance.totalIncome - finance.totalExpense >= 0 ? 'text-white' : 'text-finance-red'}`}>
              {formatCurrency(finance.totalIncome - finance.totalExpense)}</p>
          </div>
        </div>
      </aside>

      {/* Background Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-8">
        <header className="-mx-4 -mt-4 md:-mx-8 md:-mt-8">
          <div 
            className="px-4 pt-12 pb-8 md:px-8 md:pt-12 md:pb-10 bg-cover bg-center"
            style={{ backgroundImage: "url(img/Gemini_Generated_Image_s2wbins2wbins2wb.png)" }}
          >
            <h2 className="text-4xl font-bold text-white">
              {activeTab === 'dashboard' ? 'Visão Geral' :
              activeTab === 'transactions' ? 'Movimentações' :
              activeTab === 'yearly' ? 'Financeiro Anual' : 'Metas de Sonho'}
            </h2>
            <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
              {isEditingIncome ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1">
                <span className="text-white/60">R$</span>
                <input
                autoFocus
                type="number"
                value={tempIncome}
                onChange={(e) => setTempIncome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleIncomeSubmit();
                  if (e.key === 'Escape') setIsEditingIncome(false);
                }}
                onBlur={handleIncomeSubmit}
                className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-blue-400 text-white font-semibold"
              />
            </div>
          ) : (
            <>
              <p>
                Renda mensal: <span className="font-semibold text-white">{formatCurrency(finance.totalIncome)}</span>
              </p>
              <button
                onClick={() => {
                  setTempIncome(finance.totalIncome.toString());
                  setIsEditingIncome(true);
                }}
                className="p-1 hover:bg-slate-700 rounded-md transition-colors text-white/70 hover:text-white active:scale-95"
                title="Editar renda mensal"
              >
                <Pencil size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CategoryCard 
                  category="Necessidade" 
                  limit={50} 
                  current={finance.expensesByCategory.Necessidade} 
                  ideal={finance.idealByCategory.Necessidade}
                  percent={finance.percentSpent.Necessidade}
                />
                <CategoryCard 
                  category="Desejo" 
                  limit={30} 
                  current={finance.expensesByCategory.Desejo} 
                  ideal={finance.idealByCategory.Desejo}
                  percent={finance.percentSpent.Desejo}
                />
                <CategoryCard 
                  category="Sonho" 
                  limit={20} 
                  current={finance.expensesByCategory.Sonho} 
                  ideal={finance.idealByCategory.Sonho}
                  percent={finance.percentSpent.Sonho}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 card-minimal overflow-hidden flex flex-col min-h-[450px]">
                  <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-white text-base">Evolução Financeira</h3>
                      <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">Entradas vs Saídas • {new Date().getFullYear()}</p>
                    </div>
                    <div className="flex gap-4 self-end sm:self-auto">
                       <div className="flex items-center gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-sm bg-finance-blue" />
                         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Entradas</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-sm bg-finance-red" />
                         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Saídas</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex-1 p-2 sm:p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={(() => {
                          const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                          const currentYear = new Date().getFullYear();
                          return months.map((m, i) => {
                            const monthTransactions = finance.transactions.filter(t => {
                              const d = new Date(t.date + 'T12:00:00');
                              return d.getMonth() === i && d.getFullYear() === currentYear;
                            });
                            const income = monthTransactions.filter(t => t.type === 'Entrada').reduce((acc, t) => acc + t.amount, 0);
                            const expense = monthTransactions.filter(t => t.type === 'Saída').reduce((acc, t) => acc + t.amount, 0);
                            return { name: m, Entrada: income, Saída: expense };
                          });
                        })()}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        barGap={4}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#d3d3d3', fontSize: 9, fontWeight: 700 }}
                          dy={10}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#d3d3d3', fontSize: 10, fontWeight: 500 }}
                          tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc', radius: 4 }}
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            padding: '12px'
                          }}
                          itemStyle={{ fontWeight: '700', padding: '2px 0' }}
                          formatter={(value: number) => [formatCurrency(value), '']}
                        />
                        <Bar 
                          dataKey="Entrada" 
                          fill="#4057d4" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={35}
                        />
                        <Bar 
                          dataKey="Saída" 
                          fill="#EF4444" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={35}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="card-minimal">
                    <h3 className="font-bold text-white mb-6">Minhas Metas</h3>
                    <div className="space-y-6">
                      {finance.goals.slice(0, 2).map(goal => (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">{goal.name}</span>
                            <span className="text-slate-800 font-bold">{((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-fill bg-finance-blue" style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}></div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">Acumulado: {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}</p>
                        </div>
                      ))}
                      {finance.goals.length === 0 && <p className="text-xs text-slate-300 italic">Sem metas registradas.</p>}
                      <button onClick={() => setActiveTab('goals')} className="w-full mt-2 py-2 border border-green-600 text-green-600 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors">
                        Gerenciar Metas
                      </button>
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl shadow-lg transition-all duration-500 ${
                    finance.totalExpense > finance.totalIncome 
                      ? 'bg-gradient-to-br from-red-600 to-rose-700 shadow-red-100' 
                      : finance.totalExpense > finance.totalIncome * 0.85
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-100'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-100'
                  } text-white`}>
                    <h3 className="font-bold mb-1">Resumo Mensal</h3>
                    <p className="text-white/80 text-[10px] mb-4 uppercase font-bold tracking-wider">
                      Status da Saúde Financeira
                    </p>
                    <div className="flex items-start gap-4 bg-white/10 p-4 rounded-xl border border-white/10">
                      <div className="text-2xl mt-0.5">
                        {finance.totalExpense > finance.totalIncome ? '🚨' : finance.totalExpense > finance.totalIncome * 0.85 ? '⚠️' : '✅'}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold leading-tight">
                          {finance.totalExpense > finance.totalIncome 
                            ? 'ALERTA DE GASTOS!' 
                            : finance.totalExpense > finance.totalIncome * 0.85 
                              ? 'AVISO DE LIMITE' 
                              : 'PARABÉNS!'}
                        </p>
                        <p className="text-[11px] font-medium leading-relaxed opacity-90">
                          {finance.totalExpense > finance.totalIncome 
                            ? 'Você ultrapassou sua renda mensal! Reduza gastos imediatamente para evitar dívidas.'
                            : finance.totalExpense > finance.totalIncome * 0.85
                              ? 'Você atingiu mais de 85% da sua renda. Cuidado para não usar a reserva dos seus sonhos.'
                              : 'Seu orçamento está saudável e sob controle. Continue mantendo o foco nos 20% para seus sonhos!'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div 
              key="transactions"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              <TransactionForm onAdd={finance.addTransaction} goals={finance.goals} />
              <div className="card-minimal px-0 py-0 overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                  <h3 className="font-bold text-white">Histórico de Lançamentos</h3>
                </div>
                
                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr className="text-[10px] uppercase font-bold text-white">
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Descrição</th>
                        <th className="px-6 py-4">Categoria</th>
                        <th className="px-6 py-4 text-right">Valor</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {finance.transactions.slice(0, visibleTransactions).map(t => (
                        <tr key={t.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-white font-mono text-xs">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-4 font-medium text-slate-300">{t.description}</td>
                          <td className="px-6 py-4">
                            <CategoryBadge category={t.category} isType={t.type === 'Entrada' ? 'Entrada' : undefined} />
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${t.type === 'Entrada' ? 'text-blue-500' : 'text-finance-red'}`}>
                            {t.type === 'Entrada' ? '+' : '-'} {formatCurrency(t.amount)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => finance.deleteTransaction(t.id)} className="p-1 hover:text-finance-red text-slate-300 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View (Card List) */}
                <div className="md:hidden divide-y divide-slate-50">
                  {finance.transactions.slice(0, visibleTransactions).map(t => (
                    <div key={t.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 leading-tight mb-1">{t.description}</h4>
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-[10px] font-mono text-slate-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            <CategoryBadge category={t.category} isType={t.type === 'Entrada' ? 'Entrada' : undefined} />
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className={`text-sm font-bold whitespace-nowrap ${t.type === 'Entrada' ? 'text-finance-green' : 'text-finance-red'}`}>
                            {t.type === 'Entrada' ? '+' : '-'} {formatCurrency(t.amount)}
                          </span>
                          <button 
                            onClick={() => finance.deleteTransaction(t.id)} 
                            className="p-1.5 bg-slate-50 text-slate-400 rounded-md hover:text-finance-red transition-colors active:scale-95"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {finance.transactions.length > visibleTransactions && (
                  <div className="p-6 border-t border-slate-50 flex justify-center">
                    <button 
                      onClick={() => setVisibleTransactions(prev => prev + 10)}
                      className="px-6 py-2 text-sm font-bold text-finance-green hover:bg-green-900 rounded-lg transition-all border border-green-100"
                    >
                      Ver mais lançamentos
                    </button>
                  </div>
                )}

                {finance.transactions.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <History size={40} className="mb-4 opacity-20" />
                    <p className="italic">Nenhum lançamento registrado.</p>
                  </div>
                )}
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
               />
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div key="goals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <GoalsManager 
                 goals={finance.goals} 
                 onAdd={finance.addGoal} 
                 onDelete={finance.deleteGoal}
                 onUpdate={finance.updateGoal}
                 dreamSavings={finance.expensesByCategory.Sonho}
               />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button (FAB) - Standardized Size/Style */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab('transactions')}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 bg-white p-2 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:text-finance-blue hover:bg-slate-50 transition-all"
        title="Novo Lançamento"
      >
        <Plus size={20} />
      </motion.button>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <div 
      onClick={onClick}
      className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </div>
  );
}

function CategoryCard({ category, limit, current, ideal, percent }: { category: TransactionCategory, limit: number, current: number, ideal: number, percent: number }) {
  const isOver = percent > limit;
  const progressPercent = Math.min(percent, 100);
  
  const progressColors = {
    Necessidade: 'bg-blue-600',
    Desejo: 'bg-amber-400',
    Sonho: 'bg-purple-600'
  };

  return (
    <div className="card-minimal">
      <div className="flex justify-between items-start mb-4">
        <span className="bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{category} ({limit}%)</span>
        <span className={`${isOver ? 'text-finance-red font-bold animate-pulse' : 'text-slate-100 font-medium'} text-xs`}>
          Ideal: {formatCurrency(ideal)}
        </span>
      </div>
      
      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-bold text-white">{formatCurrency(current).split(',')[0]}</span>
        <span className="text-slate-300 pb-1 text-sm">/ mês</span>
      </div>

      <div className="progress-bar-bg mb-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          className={`progress-fill ${isOver ? 'bg-finance-red' : progressColors[category]}`} 
        />
      </div>

      <p className={`text-xs font-medium ${isOver ? 'text-finance-red' : 'text-slate-400'}`}>
        {isOver 
          ? `⚠️ Ultrapassou o ideal em ${formatCurrency(current - ideal)}` 
          : `Utilizado: ${percent.toFixed(1)}% do orçamento`}
      </p>
    </div>
  );
}

function CategoryBadge({ category, isType }: { category: string, isType?: string }) {
  const styles: any = {
    'Necessidade': 'bg-blue-50 text-blue-500',
    'Desejo': 'bg-amber-50 text-amber-400',
    'Sonho': 'bg-purple-50 text-purple-600',
    'Entrada': 'bg-indigo-50 text-indigo-800',
    'Salário': 'bg-slate-900 text-white font-bold',
    'Extra': 'bg-teal-50 text-teal-700 font-medium'
  };
  return (
    <span className={`${styles[isType || category] || 'bg-slate-100 text-slate-600'} px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium`}>
      {isType || category}
    </span>
  );
}

function TransactionForm({ onAdd, goals }: { onAdd: (t: any) => void, goals: any[] }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('Saída');
  const [category, setCategory] = useState<TransactionCategory>('Necessidade');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [goalId, setGoalId] = useState<string>('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [numInstallments, setNumInstallments] = useState('2');

  // Handle category auto-assignment based on type
  useEffect(() => {
    if (type === 'Entrada') {
      setCategory('Extra');
      setIsInstallment(false); // Reset installment for income
    } else if (category === 'Extra' || category === 'Salário') {
      // Reset to a valid expense category if switching back to Saída
      setCategory('Necessidade');
    }
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    const baseAmount = parseFloat(amount);
    const startDate = new Date(date + 'T12:00:00'); // Use noon to avoid timezone shift issues

    if (isInstallment && ['Necessidade', 'Desejo', 'Sonho'].includes(category)) {
      const installmentsCount = parseInt(numInstallments);
      const installmentAmount = baseAmount / installmentsCount;

      for (let i = 0; i < installmentsCount; i++) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);
        
        onAdd({ 
          description: `${description} (${String(i + 1).padStart(2, '0')}/${String(installmentsCount).padStart(2, '0')})`, 
          amount: installmentAmount, 
          type, 
          category, 
          date: currentDate.toISOString().split('T')[0],
          goalId: category === 'Sonho' ? goalId : undefined 
        });
      }
    } else {
      onAdd({ 
        description, 
        amount: baseAmount, 
        type, 
        category, 
        date,
        goalId: category === 'Sonho' ? goalId : undefined 
      });
    }

    setDescription(''); setAmount(''); setGoalId(''); setIsInstallment(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card-minimal">
      <h3 className="font-bold mb-6 text-white">Novo Lançamento</h3>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${category === 'Sonho' ? 'xl:grid-cols-6' : 'xl:grid-cols-5'} gap-6 transition-all duration-300`}>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" 
            placeholder="Ex: Jantar Japonês" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" 
            placeholder="R$ 0,00" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</label>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value as any)}
            disabled={type === 'Entrada'}
            className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all ${type === 'Entrada' ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'hover:bg-slate-100 cursor-pointer'}`}>
            {type === 'Entrada' ? (
              <option value="Extra">Extra</option>
            ) : (
              <>
                <option value="Necessidade">Necessidade (50%)</option>
                <option value="Desejo">Desejo (30%)</option>
                <option value="Sonho">Sonho (20%)</option>
              </>
            )}
          </select>
        </div>

        {/* Goal Selector - only visible for Sonho category */}
        {category === 'Sonho' && (
          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vincular Meta</label>
            <select 
              value={goalId} 
              onChange={e => setGoalId(e.target.value)}
              className="w-full bg-slate-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 hover:bg-slate-100 transition-all cursor-pointer">
              <option value="">Selecione...</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</label>
          <div className="flex bg-slate-100 p-1 rounded-lg h-[42px]">
            <button type="button" onClick={() => setType('Entrada')}
              className={`flex-1 rounded-md text-[10px] font-bold transition-all ${type === 'Entrada' ? 'bg-white shadow-sm text-finance-green' : 'text-slate-400'}`}>ENTRADA</button>
            <button type="button" onClick={() => setType('Saída')}
              className={`flex-1 rounded-md text-[10px] font-bold transition-all ${type === 'Saída' ? 'bg-white shadow-sm text-finance-red' : 'text-slate-400'}`}>SAÍDA</button>
          </div>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-minimal-primary w-full h-[42px] flex items-center justify-center gap-2">
            <Plus size={18} /> Adicionar
          </button>
        </div>
      </div>

      {/* Installment Options */}
      {type === 'Saída' && ['Necessidade', 'Desejo', 'Sonho'].includes(category) && (
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 animate-in fade-in slide-in-from-top-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              onClick={() => setIsInstallment(!isInstallment)}
              className={`w-10 h-5 rounded-full transition-all relative ${isInstallment ? 'bg-finance-green' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isInstallment ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-slate-400 transition-colors">Compra Parcelada?</span>
          </label>

          {isInstallment && (
            <div className="flex items-center gap-3 animate-in zoom-in-95 duration-200">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nº de Parcelas</label>
              <input 
                type="number" 
                min="2" 
                max="72"
                value={numInstallments} 
                onChange={e => setNumInstallments(e.target.value)}
                className="w-16 bg-slate-50 border border-slate-200 rounded px-3 py-1 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />
              <span className="text-xs text-slate-400 italic">
                (Serão gerados {numInstallments} lançamentos mensais)
              </span>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

function YearlyManager({ transactions, onAddTransaction, onDeleteTransaction, goals }: { transactions: any[], onAddTransaction: any, onDeleteTransaction: any, goals: any[] }) {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [isAddingInMonth, setIsAddingInMonth] = useState(false);

  // Form state for month-specific addition
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [cat, setCat] = useState<TransactionCategory>('Necessidade');
  const [typ, setTyp] = useState<TransactionType>('Saída');
  const [gId, setGId] = useState('');

  // Reset form when changing month or opening form
  useEffect(() => {
    if (isAddingInMonth) {
      setDesc(''); setVal(''); setGId('');
      if (typ === 'Entrada') setCat('Extra');
    }
  }, [isAddingInMonth, selectedMonthIndex]);

  useEffect(() => {
    if (typ === 'Entrada') setCat('Extra');
    else if (cat === 'Extra' || cat === 'Salário') setCat('Necessidade');
  }, [typ]);

  // Generate a list of years from currentYear - 5 to currentYear + 5
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const annualData = months.map((m, i) => {
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return d.getMonth() === i && d.getFullYear() === selectedYear;
    });
    const income = monthTransactions.filter(t => t.type === 'Entrada').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'Saída').reduce((acc, t) => acc + t.amount, 0);
    return { month: m, income, expense, balance: income - expense, index: i };
  });

  const getMonthlyTransactions = () => {
    if (selectedMonthIndex === null) return [];
    return transactions
      .filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        return d.getMonth() === selectedMonthIndex && d.getFullYear() === selectedYear;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleAddInMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !val || selectedMonthIndex === null) return;
    
    // Set date to the 1st of the selected month/year
    const dateStr = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}-01`;
    
    onAddTransaction({
      description: desc,
      amount: parseFloat(val),
      type: typ,
      category: cat,
      date: dateStr,
      goalId: cat === 'Sonho' ? gId : undefined
    });

    setIsAddingInMonth(false);
  };

  if (selectedMonthIndex !== null) {
    const monthlyTransactions = getMonthlyTransactions();
    const monthName = months[selectedMonthIndex];

    return (
      <div className="card-minimal px-0 py-0 overflow-hidden text-sm">
        <div className="p-6 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setSelectedMonthIndex(null); setIsAddingInMonth(false); }}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h3 className="font-bold text-slate-800">Detalhes de {monthName} / {selectedYear}</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Lançamentos do mês</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddingInMonth(!isAddingInMonth)}
            className={`btn-minimal-primary flex items-center gap-2 ${isAddingInMonth ? 'bg-slate-500 hover:bg-slate-600' : ''}`}
          >
            {isAddingInMonth ? <X size={18} /> : <Plus size={18} />}
            {isAddingInMonth ? 'Cancelar' : 'Novo Lançamento'}
          </button>
        </div>

        {isAddingInMonth && (
          <div className="p-6 bg-slate-50 border-b border-slate-100 animate-in fade-in slide-in-from-top-2">
            <form onSubmit={handleAddInMonth} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-300 uppercase">Descrição</label>
                <input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500" placeholder="Ex: Conta de Luz" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-300 uppercase">Valor</label>
                <input type="number" step="0.01" value={val} onChange={e => setVal(e.target.value)} className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500" placeholder="R$ 0,00" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-300 uppercase">Categoria</label>
                <select value={cat} onChange={e => setCat(e.target.value as any)} disabled={typ === 'Entrada'} className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500">
                  {typ === 'Entrada' ? <option value="Extra">Extra</option> : (
                    <>
                      <option value="Necessidade">Necessidade</option>
                      <option value="Desejo">Desejo</option>
                      <option value="Sonho">Sonho</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-300 uppercase">Tipo</label>
                <div className="flex bg-slate-200 p-0.5 rounded gap-0.5">
                  <button type="button" onClick={() => setTyp('Entrada')} className={`flex-1 text-[9px] font-bold py-1 rounded ${typ === 'Entrada' ? 'bg-white text-finance-green shadow-sm' : 'text-slate-500'}`}>ENTRADA</button>
                  <button type="button" onClick={() => setTyp('Saída')} className={`flex-1 text-[9px] font-bold py-1 rounded ${typ === 'Saída' ? 'bg-white text-finance-red shadow-sm' : 'text-slate-500'}`}>SAÍDA</button>
                </div>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full py-1.5 bg-green-600 text-white rounded font-bold text-[10px] hover:bg-green-900 transition-colors">ADICIONAR</button>
              </div>
              {cat === 'Sonho' && typ === 'Saída' && (
                <div className="lg:col-span-5 space-y-1 mt-2">
                  <label className="text-[9px] font-bold text-slate-300 uppercase">Vincular Meta</label>
                  <select value={gId} onChange={e => setGId(e.target.value)} className="w-full max-w-xs bg-white border border-slate-200 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500">
                    <option value="">Selecione a meta...</option>
                    {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              )}
            </form>
          </div>
        )}

        <div className="divide-y divide-slate-50">
          {monthlyTransactions.map(t => (
            <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="font-bold text-slate-700">{t.description}</p>
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-[10px] font-mono text-slate-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <CategoryBadge category={t.category} isType={t.type === 'Entrada' ? 'Entrada' : undefined} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-right font-mono font-bold ${t.type === 'Entrada' ? 'text-finance-green' : 'text-finance-red'}`}>
                  {t.type === 'Entrada' ? '+' : '-'} {formatCurrency(t.amount)}
                </div>
                <button 
                  onClick={() => onDeleteTransaction(t.id)}
                  className="p-1.5 text-slate-300 hover:text-finance-red transition-colors"
                  title="Excluir lançamento"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {monthlyTransactions.length === 0 && (
            <div className="py-20 text-center text-slate-400 italic">
              Nenhum lançamento encontrado para este mês.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card-minimal px-0 py-0 overflow-hidden text-sm">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-white">Consolidado do Ano</h3>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Clique no mês para ver detalhes</p>
        </div>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      
      {/* Desktop View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr className="text-[10px] uppercase font-bold text-white">
              <th className="px-6 py-4">Mês</th>
              <th className="px-6 py-4">Entradas</th>
              <th className="px-6 py-4">Saídas</th>
              <th className="px-6 py-4">Balanço</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {annualData.map(data => (
              <tr 
                key={data.month} 
                onClick={() => setSelectedMonthIndex(data.index)}
                className="border-t border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-medium text-slate-300 group-hover:text-green-600 flex items-center gap-2">
                  {data.month}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-blue-500">{formatCurrency(data.income)}</td>
                <td className="px-6 py-4 font-mono text-xs text-finance-red">{formatCurrency(data.expense)}</td>
                <td className={`px-6 py-4 font-bold font-mono text-xs ${data.balance >= 0 ? 'text-blue-500' : 'text-finance-red'}`}>
                  {formatCurrency(data.balance)}
                </td>
                <td className="px-6 py-4 text-center text-slate-300 group-hover:text-blue-500">
                  <ChevronRight size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View (Card List) */}
      <div className="md:hidden divide-y divide-slate-50">
        {annualData.map(data => (
          <div 
            key={data.month} 
            onClick={() => setSelectedMonthIndex(data.index)}
            className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 text-base flex items-center gap-2">
                {data.month}
                <ChevronRight size={14} className="text-slate-300" />
              </span>
              <span className={`text-base font-bold font-mono ${data.balance >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                {formatCurrency(data.balance)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Entradas</p>
                <p className="font-mono text-xs text-finance-green font-bold">{formatCurrency(data.income)}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Saídas</p>
                <p className="font-mono text-xs text-finance-red font-bold">{formatCurrency(data.expense)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsManager({ goals, onAdd, onDelete, onUpdate, dreamSavings }: { goals: any[], onAdd: any, onDelete: any, onUpdate: any, dreamSavings: number }) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    onAdd({ name, targetAmount: parseFloat(targetAmount), currentAmount: 0 });
    setName(''); setTargetAmount('');
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="card-minimal">
        <h3 className="font-bold mb-6 text-white">Nova Meta de Sonho</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nome do Sonho</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:bg-white" 
              placeholder="Ex: Viagem para o Japão" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Valor Objetivo</label>
            <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:bg-white" 
              placeholder="R$ 0,00" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-minimal-primary w-full h-[42px]">CRIAR META</button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <div key={goal.id} className="card-minimal flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{goal.name}</h3>
                  <p className="text-xs text-slate-400">Total acumulado: {formatCurrency(goal.currentAmount)}</p>
                </div>
                <button onClick={() => onDelete(goal.id)} className="p-1 text-slate-300 hover:text-finance-red transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Progresso</span>
                  <span className="text-slate-800 font-bold">{progress.toFixed(0)}%</span>
                </div>
                <div className="progress-bar-bg">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-finance-blue rounded-full" />
                </div>
                <p className="text-[10px] text-slate-400">Meta final: {formatCurrency(goal.targetAmount)}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded text-center italic">
                  O progresso é atualizado automaticamente ao adicionar lançamentos na categoria "Sonho".
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {goals.length === 0 && <p className="text-center py-20 text-slate-400 italic">Planeje seus sonhos!</p>}
    </div>
  );
}
