import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase.config';
import { useAuth } from './useAuth';
import { Transaction, Goal, CATEGORY_LIMITS } from './types';

export function useFinance() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to user's transactions
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionList: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        transactionList.push({
          id: doc.id,
          date: data.date,
          description: data.description,
          amount: data.amount,
          type: data.type,
          category: data.category,
          goalId: data.goalId,
        });
      });
      setTransactions(transactionList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Subscribe to user's goals
  useEffect(() => {
    if (!user) {
      setGoals([]);
      return;
    }

    const q = query(collection(db, 'goals'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalList: Goal[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        goalList.push({
          id: doc.id,
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
          deadline: data.deadline,
        });
      });
      setGoals(goalList);
    });

    return unsubscribe;
  }, [user]);

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      const data: any = {
        ...t,
        userId: user.uid,
        createdAt: Timestamp.now(),
      };
      // Remove campos undefined
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
      
      await addDoc(collection(db, 'transactions'), data);
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'transactions', id), updates);
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
    }
  };

  const addGoal = async (g: Omit<Goal, 'id'>) => {
    if (!user) return;
    try {
      const data: any = {
        ...g,
        userId: user.uid,
        createdAt: Timestamp.now(),
      };
      // Remove campos undefined
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
      
      await addDoc(collection(db, 'goals'), data);
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'goals', id), updates);
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'goals', id));
    } catch (error) {
      console.error('Erro ao deletar meta:', error);
    }
  };

  const updateMonthlyIncome = async (amount: number) => {
    if (!user) return;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const incomeDescription = 'Renda Mensal';

    const existingIncome = transactions.find((t) => {
      const d = new Date(t.date);
      return (
        t.type === 'Entrada' &&
        t.description === incomeDescription &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    });

    if (existingIncome) {
      await updateTransaction(existingIncome.id, {
        amount,
        category: 'Salário',
      });
    } else {
      await addTransaction({
        description: incomeDescription,
        amount,
        type: 'Entrada',
        category: 'Salário',
        date: now.toISOString().split('T')[0],
      });
    }
  };

  // Calculations for current month
  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === 'Entrada')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = currentMonthTransactions
    .filter((t) => t.type === 'Saída')
    .reduce((acc, t) => acc + t.amount, 0);

  const expensesByCategory = {
    Necessidade: currentMonthTransactions
      .filter((t) => t.type === 'Saída' && t.category === 'Necessidade')
      .reduce((acc, t) => acc + t.amount, 0),
    Desejo: currentMonthTransactions
      .filter((t) => t.type === 'Saída' && t.category === 'Desejo')
      .reduce((acc, t) => acc + t.amount, 0),
    Sonho: currentMonthTransactions
      .filter((t) => t.type === 'Saída' && t.category === 'Sonho')
      .reduce((acc, t) => acc + t.amount, 0),
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
  const computedGoals = goals.map((goal) => {
    const attributedAmount = transactions
      .filter((t) => t.goalId === goal.id && t.type === 'Saída')
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
    loading,
  };
}
