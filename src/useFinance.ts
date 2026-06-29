import { useEffect, useState } from 'react';
import { supabase } from './supabase.config';
import { useAuth } from './useAuth';
import { Transaction, Goal, CATEGORY_LIMITS, TransactionCategory, PaymentMethod } from './types';

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
        installmentInterval: row.installment_interval,
        status: row.status,
        dueDate: row.due_date,
        paidDate: row.paid_date,
        recurringId: row.recurring_id,
        paymentMethod: row.payment_method,
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
        autoCreated: row.auto_created,
      }));

      setGoals(goalList);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
    }
  };

  // Mapeia um Transaction (camelCase) para a linha do banco (snake_case), aplicando a regra de status
  const toRow = (t: Omit<Transaction, 'id'>) => {
    const status = t.status ?? getStatusForDate(t.date);
    return {
      user_id: user!.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      goal_id: t.goalId,
      installment_id: t.installmentId ?? null,
      installment_index: t.installmentIndex ?? null,
      installment_total: t.installmentTotal ?? null,
      installment_interval: t.installmentInterval ?? 1,
      status,
      due_date: t.dueDate ?? null,
      paid_date: t.paidDate ?? (status === 'pago' ? t.date : null),
      recurring_id: t.recurringId ?? null,
      payment_method: t.paymentMethod ?? null,
    };
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('transactions').insert([toRow(t)]);
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
    // Antes de apagar, descobre se há uma meta auto-criada vinculada a este grupo
    const groupGoalIds = Array.from(new Set(
      transactions
        .filter((t) => t.installmentId === installmentId && t.goalId)
        .map((t) => t.goalId as string)
    ));

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('installment_id', installmentId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Para cada meta vinculada que seja auto-criada E não tenha mais nenhum lançamento, apaga a meta
    for (const gId of groupGoalIds) {
      const goal = goals.find((g) => g.id === gId);
      if (!goal || !goal.autoCreated) continue;

      // Confere se ainda resta algum lançamento vinculado a essa meta (fora os que acabamos de apagar)
      const stillUsed = transactions.some(
        (t) => t.goalId === gId && t.installmentId !== installmentId
      );
      if (stillUsed) continue;

      const { error: goalError } = await supabase
        .from('goals')
        .delete()
        .eq('id', gId)
        .eq('user_id', user.id);
      if (goalError) throw goalError;
    }

    await fetchTransactions();
    await fetchGoals();
  } catch (error) {
    console.error('Erro ao deletar grupo de parcelas:', error);
  }
};

  // Desloca as parcelas PENDENTES seguintes a uma parcela editada, mantendo o intervalo.
  // Parcelas pagas são puladas (ficam fixas). A posição conta só entre as pendentes movidas.
  const shiftInstallmentsAfter = async (
    installmentId: string,
    editedIndex: number,
    newBaseDate: string,
    interval: number
  ) => {
    if (!user) return;
    try {
      const following = transactions
        .filter(
          (t) =>
            t.installmentId === installmentId &&
            t.installmentIndex != null &&
            t.installmentIndex > editedIndex
        )
        .sort((a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0));

      if (following.length === 0) return;

      const base = new Date(newBaseDate + 'T12:00:00');
      let pendingPos = 0;

      for (const t of following) {
        if ((t.status ?? 'pago') === 'pago') continue;

        pendingPos += 1;
        const d = new Date(base);
        d.setMonth(base.getMonth() + pendingPos * interval);
        const newDate = d.toISOString().split('T')[0];

        const { error } = await supabase
          .from('transactions')
          .update({ date: newDate })
          .eq('id', t.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }

      await fetchTransactions();
    } catch (error) {
      console.error('Erro ao deslocar parcelas:', error);
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
    // Parcelas do grupo com data POSTERIOR à parcela editada E ainda pendentes.
    // Parcelas pagas nunca recebem redistribuição (são fatos consumados).
    const future = transactions
      .filter(
        (t) =>
          t.installmentId === installmentId &&
          t.date > editedDate &&
          (t.status ?? 'pago') === 'pendente'
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

// Adiciona N parcelas a um parcelamento existente.
// Redistribui o total entre pendentes+novas (pagas intocadas), continua as datas pelo intervalo, e renumera tudo.
const addInstallmentsToGroup = async (installmentId: string, addCount: number) => {
  if (!user || addCount < 1) return;
  try {
    const group = transactions
      .filter((t) => t.installmentId === installmentId)
      .sort((a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0));

    if (group.length === 0) return;

    const ref = group[0]; // referência para tipo, categoria, intervalo, etc.
    const interval = ref.installmentInterval ?? 1;

    // Total original do parcelamento = soma de TODAS as parcelas atuais
    const originalTotal = group.reduce((acc, t) => acc + t.amount, 0);

    // Soma das pagas (ficam intocadas)
    const paid = group.filter((t) => (t.status ?? 'pago') === 'pago');
    const paidSum = paid.reduce((acc, t) => acc + t.amount, 0);

    // Pendentes existentes
    const pending = group.filter((t) => (t.status ?? 'pago') === 'pendente');

    // Nome base (sem o sufixo de numeração)
    const baseName = ref.description.replace(/\s*\(\d+\/\d+\)\s*$/, '').replace(/\s*\(Extra - ajuste\)\s*$/, '').trim();

    // Novo total de parcelas e valor a distribuir entre (pendentes + novas)
    const newTotalCount = group.length + addCount;
    const toDistributeCount = pending.length + addCount;
    const remaining = Math.round((originalTotal - paidSum) * 100) / 100;
    const perInstallment = toDistributeCount > 0 ? Math.round((remaining / toDistributeCount) * 100) / 100 : 0;

    // Data base para as novas parcelas: a partir da ÚLTIMA parcela existente
    const lastDate = new Date(group[group.length - 1].date + 'T12:00:00');

    // 1) Atualiza as pendentes existentes: novo valor + renumeração
    let runningIndex = 0;
    for (const t of group) {
      runningIndex += 1;
      const idxStr = String(runningIndex).padStart(2, '0');
      const totStr = String(newTotalCount).padStart(2, '0');
      const updateData: any = {
        description: `${baseName} (${idxStr}/${totStr})`,
        installment_index: runningIndex,
        installment_total: newTotalCount,
      };
      // Só ajusta valor das PENDENTES (pagas mantêm valor)
      if ((t.status ?? 'pago') === 'pendente') {
        updateData.amount = perInstallment;
      }
      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', t.id)
        .eq('user_id', user.id);
      if (error) throw error;
    }

    // 2) Cria as novas parcelas, continuando datas e numeração
    for (let i = 1; i <= addCount; i++) {
      const d = new Date(lastDate);
      d.setMonth(lastDate.getMonth() + i * interval);
      const newDate = d.toISOString().split('T')[0];
      const newIndex = group.length + i;
      const idxStr = String(newIndex).padStart(2, '0');
      const totStr = String(newTotalCount).padStart(2, '0');

      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          date: newDate,
          description: `${baseName} (${idxStr}/${totStr})`,
          amount: perInstallment,
          type: ref.type,
          category: ref.category,
          goal_id: ref.goalId ?? null,
          installment_id: installmentId,
          installment_index: newIndex,
          installment_total: newTotalCount,
          installment_interval: interval,
          status: 'pendente',
          due_date: null,
          paid_date: null,
        },
      ]);
      if (error) throw error;
    }

    await fetchTransactions();
  } catch (error) {
    console.error('Erro ao adicionar parcelas ao grupo:', error);
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
  fields: { description?: string; category?: TransactionCategory; paymentMethod?: PaymentMethod }
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

      if (fields.paymentMethod !== undefined) {
        updateData.payment_method = fields.paymentMethod;
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
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.paidDate !== undefined) updateData.paid_date = updates.paidDate ?? null;
      if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;

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

  // Marca uma transação como paga: status 'pago' + registra a data de efetivação (hoje)
  const markAsPaid = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    await updateTransaction(id, { status: 'pago', paidDate: today });
  };

  // Reverte para pendente: status 'pendente' + limpa a data de efetivação (null no banco)
  const markAsPending = async (id: string) => {
    await updateTransaction(id, { status: 'pendente', paidDate: null });
  };

  const addGoal = async (g: Omit<Goal, 'id'>): Promise<string | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([
          {
            user_id: user.id,
            name: g.name,
            target_amount: g.targetAmount,
            current_amount: g.currentAmount,
            deadline: g.deadline,
            auto_created: g.autoCreated ?? false,
          },
        ])
        .select('id')
        .single();

      if (error) throw error;
      await fetchGoals();
      return data?.id ?? null;
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
      return null;
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

  // Regra de nascimento: hoje ou antes = pago; só futuro = pendente
  const getStatusForDate = (dateStr: string): 'pago' | 'pendente' => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr > today ? 'pendente' : 'pago';
  };

  const currentMonthTransactions = transactions.filter((t) => {
  const d = new Date(t.date + 'T12:00:00');
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
});

  // Apenas transações efetivadas ('pago') entram nos cálculos de saldo.
  // Pendentes ficam de fora (são previsões, não movem o saldo realizado).
  const paidMonthTransactions = currentMonthTransactions.filter(
    (t) => (t.status ?? 'pago') === 'pago'
  );

  const totalIncome = paidMonthTransactions
    .filter((t) => t.type === 'Entrada')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = paidMonthTransactions
    .filter((t) => t.type === 'Saída')
    .reduce((acc, t) => acc + t.amount, 0);

  const expensesByCategory = {
    Necessidade: paidMonthTransactions
      .filter((t) => t.type === 'Saída' && t.category === 'Necessidade')
      .reduce((acc, t) => acc + t.amount, 0),
    Desejo: paidMonthTransactions
      .filter((t) => t.type === 'Saída' && t.category === 'Desejo')
      .reduce((acc, t) => acc + t.amount, 0),
    Sonho: paidMonthTransactions
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

  // Calcular progresso real das metas baseado em transações.
  // Lançamentos simples contam sempre; parcelas contam só quando pagas (compromisso vs. realizado).
  const computedGoals = goals.map((goal) => {
    const attributedAmount = transactions
      .filter((t) => {
        if (t.goalId !== goal.id || t.type !== 'Saída') return false;
        // Parcela: só conta se paga. Lançamento simples: conta sempre.
        if (t.installmentId) return (t.status ?? 'pago') === 'pago';
        return true;
      })
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
    shiftInstallmentsAfter,
    addInstallmentsToGroup,
    addExtraInstallment,
    updateInstallmentGroupFields,
    updateTransaction,
    markAsPaid,
    markAsPending,
    addGoal,
    updateGoal,
    deleteGoal,
    currentMonthTransactions,
    updateMonthlyIncome,
    loading,
  };
}
