import { useEffect, useState } from 'react';
import { supabase } from './supabase.config';
import { useAuth } from './useAuth';
import { RecurringTemplate } from './types';

export function useRecurring() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const list: RecurringTemplate[] = (data || []).map((row: any) => ({
        id: row.id,
        description: row.description,
        amount: row.amount,
        type: row.type,
        category: row.category,
        dueDay: row.due_day,
        active: row.active,
        paymentMethod: row.payment_method,
      }));

      setTemplates(list);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar recorrências:', error);
      setLoading(false);
    }
  };

  const addTemplate = async (t: Omit<RecurringTemplate, 'id'>) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('recurring_templates').insert([
        {
          user_id: user.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          due_day: t.dueDay,
          active: t.active,
          payment_method: t.paymentMethod ?? null,
        },
      ]);
      if (error) throw error;
      await fetchTemplates();
    } catch (error) {
      console.error('Erro ao adicionar recorrência:', error);
    }
  };

  const updateTemplate = async (id: string, updates: Partial<RecurringTemplate>) => {
    if (!user) return;
    try {
      const updateData: any = {};
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.dueDay !== undefined) updateData.due_day = updates.dueDay;
      if (updates.active !== undefined) updateData.active = updates.active;
      if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;

      const { error } = await supabase
        .from('recurring_templates')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      await fetchTemplates();
    } catch (error) {
      console.error('Erro ao atualizar recorrência:', error);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('recurring_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      await fetchTemplates();
    } catch (error) {
      console.error('Erro ao deletar recorrência:', error);
    }
  };

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    fetchTemplates,
  };
}