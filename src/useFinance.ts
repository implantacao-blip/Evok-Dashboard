import { useEffect, useState } from 'react';
import { Transaction, Goal, TransactionCategory, CATEGORY_LIMITS } from './types';

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fin_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('fin_goals');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fin_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('fin_goals', JSON.stringify(goals));
  }, [goals]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addGoal = (g: Omit<Goal, 'id'>) => {
    const newGoal = { ...g, id: crypto.randomUUID() };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const updateMonthlyIncome = (amount: number) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const incomeDescription = "Renda Mensal";

    const existingIncomeIndex = transactions.findIndex(t => {
      const d = new Date(t.date);
      return t.type === 'Entrada' && 
             t.description === incomeDescription && 
             d.getMonth() === currentMonth && 
             d.getFullYear() === currentYear;
    });

    if (existingIncomeIndex > -1) {
      const updatedTransactions = [...transactions];
      updatedTransactions[existingIncomeIndex] = {
        ...updatedTransactions[existingIncomeIndex],
        amount,
        category: 'Salário'
      };
      setTransactions(updatedTransactions);
    } else {
      addTransaction({
        description: incomeDescription,
        amount,
        type: 'Entrada',
        category: 'Salário',
        date: now.toISOString().split('T')[0]
      });
    }
  };

  // Calculations for current month
  const now = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'Entrada')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = currentMonthTransactions
    .filter(t => t.type === 'Saída')
    .reduce((acc, t) => acc + t.amount, 0);

  const expensesByCategory = {
    Necessidade: currentMonthTransactions.filter(t => t.type === 'Saída' && t.category === 'Necessidade').reduce((acc, t) => acc + t.amount, 0),
    Desejo: currentMonthTransactions.filter(t => t.type === 'Saída' && t.category === 'Desejo').reduce((acc, t) => acc + t.amount, 0),
    Sonho: currentMonthTransactions.filter(t => t.type === 'Saída' && t.category === 'Sonho').reduce((acc, t) => acc + t.amount, 0),
  };

  const idealByCategory = {
    Necessidade: totalIncome * CATEGORY_LIMITS.Necessidade,
    Desejo: totalIncome * CATEGORY_LIMITS.Desejo,
    Sonho: totalIncome * CATEGORY_LIMITS.Sonho,
  };

  const percentSpent = {
    Necessidade: totalIncome > 0 ? (expensesByCategory.Necessidade / totalIncome) * 100 : 0,
    Desejo: totalIncome > 0 ? (expensesByCategory.Desejo / totalIncome) * 100 : 0,
    Sonho: totalIncome > 0 ? (expensesByCategory.Sonho / totalIncome) * 100 : 0,
  };

  // Compute actual goal progress based on transactions
  const computedGoals = goals.map(goal => {
    const attributedAmount = transactions
      .filter(t => t.goalId === goal.id && t.type === 'Saída')
      .reduce((acc, t) => acc + t.amount, 0);
    return { ...goal, currentAmount: attributedAmount };
  });

  return {
    transactions,
    goals: computedGoals,
    totalIncome,
    totalExpense,
    expensesByCategory,
    idealByCategory,
    percentSpent,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    currentMonthTransactions,
    updateMonthlyIncome,
  };
}
