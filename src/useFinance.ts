import { useEffect, useState } from 'react';
import { supabase } from './supabase.config';
import { useAuth } from './useAuth';
import { Transaction, Goal, CATEGORY_LIMITS, TransactionCategory } from './types';

export function useFinance() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar transações do usuário
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchTransactions();
  }, [user]);

  // Buscar metas do usuário
  useEffect(() => {
    if (!user) {
      setGoals([]);
      return;
    }

    fetchGoals();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transactionList: Transaction[] = (data || []).map((row: any) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        amount: row.amount,
        type: row.type,
        category: row.category,
        goalId: row.goal_id,
        installmentId: row.installment_id,
        installmentIndex: row.installment_index,
        installmentTotal: row.installment_total,
      }));

      setTransactions(transactionList);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const goalList: Goal[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        targetAmount: row.target_amount,
        currentAmount: row.current_amount,
        deadline: row.deadline,
      }));

      setGoals(goalList);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
    }
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
  if (!user) return;
  try {
    const { error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          goal_id: t.goalId,
          installment_id: t.installmentId ?? null,
          installment_index: t.installmentIndex ?? null,
          installment_total: t.installmentTotal ?? null,
        },
      ]);

    if (error) throw error;
    await fetchTransactions();
  } catch (error) {
    console.error('Erro ao adicionar transação:', error);
  }
};

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchTransactions();
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
    }
  };

  const deleteInstallmentGroup = async (installmentId: string) => {
  if (!user) return;
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('installment_id', installmentId)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchTransactions();
  } catch (error) {
    console.error('Erro ao deletar grupo de parcelas:', error);
  }
};

  // Redistribui uma diferença (positiva ou negativa) entre as parcelas FUTURAS de um grupo
const redistributeInstallmentDiff = async (
  installmentId: string,
  editedDate: string,
  diff: number
) => {
  if (!user) return;
  try {
    // Parcelas do grupo com data POSTERIOR à parcela editada
    const future = transactions
      .filter(
        (t) =>
          t.installmentId === installmentId &&
          t.date > editedDate
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    if (future.length === 0) return;

    // diff é o quanto sobrou (redução) ou faltou (aumento) na parcela editada.
    // Para compensar, as futuras recebem o oposto: se reduzi, futuras sobem; se aumentei, futuras descem.
    const perInstallment = Math.round((diff / future.length) * 100) / 100;

    let distributed = 0;
    for (let i = 0; i < future.length; i++) {
      const isLast = i === future.length - 1;
      // Na última, joga a sobra de centavos para fechar o total exato
      const adjust = isLast ? Math.round((diff - distributed) * 100) / 100 : perInstallment;
      distributed = Math.round((distributed + adjust) * 100) / 100;

      const newAmount = Math.round((future[i].amount + adjust) * 100) / 100;
      const { error } = await supabase
        .from('transactions')
        .update({ amount: newAmount })
        .eq('id', future[i].id)
        .eq('user_id', user.id);
      if (error) throw error;
    }

    await fetchTransactions();
  } catch (error) {
    console.error('Erro ao redistribuir parcelas:', error);
  }
};

// Cria uma parcela EXTRA no fim do grupo, com o valor da diferença
const addExtraInstallment = async (
  installmentId: string,
  diff: number
) => {
  if (!user) return;
  try {
    const group = transactions
      .filter((t) => t.installmentId === installmentId)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (group.length === 0) return;

    const last = group[group.length - 1];

    // Nome base: remove o sufixo "(NN/NN)" da descrição da última parcela
    const baseName = last.description.replace(/\s*\(\d+\/\d+\)\s*$/, '');

    // Data: um mês após a última parcela
    const lastDate = new Date(last.date + 'T12:00:00');
    lastDate.setMonth(lastDate.getMonth() + 1);
    const newDate = lastDate.toISOString().split('T')[0];

    const amount = Math.round(diff * 100) / 100;

    const { error } = await supabase.from('transactions').insert([
      {
        user_id: user.id,
        date: newDate,
        description: `${baseName} (Extra - ajuste)`,
        amount,
        type: last.type,
        category: last.category,
        goal_id: last.goalId ?? null,
        installment_id: installmentId,
        installment_index: null,
        installment_total: last.installmentTotal,
      },
    ]);
    if (error) throw error;

    await fetchTransactions();
  } catch (error) {
    console.error('Erro ao criar parcela extra:', error);
  }
};

  // Propaga descrição e/ou categoria para TODAS as parcelas do grupo
const updateInstallmentGroupFields = async (
  installmentId: string,
  fields: { description?: string; category?: TransactionCategory }
) => {
  if (!user) return;
  try {
    const group = transactions.filter((t) => t.installmentId === installmentId);
    if (group.length === 0) return;

    // Nome base: remove qualquer sufixo "(NN/NN)" ou "(Extra - ajuste)" do que foi digitado
    const baseName =
      fields.description !== undefined
        ? fields.description.replace(/\s*\(\d+\/\d+\)\s*$/, '').replace(/\s*\(Extra - ajuste\)\s*$/, '').trim()
        : undefined;

    for (const t of group) {
      const updateData: any = {};

      if (fields.category !== undefined) {
        updateData.category = fields.category;
      }

      if (baseName !== undefined) {
        // Reaplica o sufixo correto de cada parcela
        const isExtra = t.installmentIndex == null;
        if (isExtra) {
          updateData.description = `${baseName} (Extra - ajuste)`;
        } else {
          const idx = String(t.installmentIndex).padStart(2, '0');
          const total = String(t.installmentTotal).padStart(2, '0');
          updateData.description = `${baseName} (${idx}/${total})`;
        }
      }

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', t.id)
        .eq('user_id', user.id);
      if (error) throw error;
    }

    await fetchTransactions();
  } catch (error) {
    console.error('Erro ao propagar campos do grupo:', error);
  }
};

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return;
    try {
      const updateData: any = {};
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.goalId !== undefined) updateData.goal_id = updates.goalId;

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchTransactions();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
    }
  };

  const addGoal = async (g: Omit<Goal, 'id'>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('goals')
        .insert([
          {
            user_id: user.id,
            name: g.name,
            target_amount: g.targetAmount,
            current_amount: g.currentAmount,
            deadline: g.deadline,
          },
        ]);

      if (error) throw error;
      await fetchGoals();
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return;
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount;
      if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount;
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline;

      const { error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchGoals();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchGoals();
    } catch (error) {
      console.error('Erro ao deletar meta:', error);
    }
  };

  const updateMonthlyIncome = async (amount: number, targetDate?: Date) => {
    if (!user) return;
    const ref = targetDate ?? new Date();
    const currentMonth = ref.getMonth();
    const currentYear = ref.getFullYear();
    const incomeDescription = 'Renda Mensal';

    const existingIncome = transactions.find((t) => {
      const d = new Date(t.date + 'T12:00:00');
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
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      await addTransaction({
        description: incomeDescription,
        amount,
        type: 'Entrada',
        category: 'Salário',
        date: dateStr,
      });
    }
  };

  // Cálculos do mês atual
  const now = new Date();

  const currentMonthTransactions = transactions.filter((t) => {
  const d = new Date(t.date + 'T12:00:00');
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

  // Calcular progresso real das metas baseado em transações
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
    deleteInstallmentGroup,
    redistributeInstallmentDiff,
    addExtraInstallment,
    updateInstallmentGroupFields,
    updateTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    currentMonthTransactions,
    updateMonthlyIncome,
    loading,
  };
}
