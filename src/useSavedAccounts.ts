import { useEffect, useState } from 'react';
import { supabase } from './supabase.config';
import { useAuth } from './useAuth';

export type SavedAccount = {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: string;
};

export function useSavedAccounts() {
  const { user } = useAuth();
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  useEffect(() => {
    if (!user) { setSavedAccounts([]); return; }
    fetchSavedAccounts();
  }, [user]);

  const fetchSavedAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedAccounts(
        (data || []).map((row: any) => ({
          id: row.id,
          description: row.description,
          amount: row.amount,
          category: row.category,
          type: row.type,
        }))
      );
    } catch (error) {
      console.error('Erro ao buscar contas salvas:', error);
    }
  };

  const addSavedAccount = async (account: Omit<SavedAccount, 'id'>) => {
    if (!user) return;
    // Evita duplicatas pela descrição
    const exists = savedAccounts.some(
      s => s.description.toLowerCase() === account.description.toLowerCase()
    );
    if (exists) return;
    try {
      const { error } = await supabase
        .from('saved_accounts')
        .insert([{ user_id: user.id, ...account }]);
      if (error) throw error;
      await fetchSavedAccounts();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    }
  };

  const deleteSavedAccount = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('saved_accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      await fetchSavedAccounts();
    } catch (error) {
      console.error('Erro ao deletar conta salva:', error);
    }
  };

  return { savedAccounts, addSavedAccount, deleteSavedAccount };
}