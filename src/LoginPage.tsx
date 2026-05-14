import { useState } from 'react';
import { useAuth } from './useAuth';
import { Mail, Lock, LogOut, Key, CheckCircle } from 'lucide-react';
import { supabase } from './supabase.config';
import evokLogo from './assets/evok_logo.png';

export function LoginPage() {
  const { login, signup, logout, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // ✅ novo: feedback de sucesso
  const [inviteCode, setInviteCode] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);

  try {
    if (isSignup) {
      // 1. Valida o código de convite
      const { data: isValid, error: codeError } = await supabase
        .rpc('verify_invite_code', { p_code: inviteCode });

      if (codeError || !isValid) {
        setError('Código de convite inválido ou já utilizado.');
        return;
      }

      // 2. Cadastra passando o inviteCode no metadata
      await signup(email, password, inviteCode);

      // ✅ Mensagem orientando a confirmar o email
      setSuccess(
        '✅ Conta criada! Enviamos um link de confirmação para ' + email + 
        '. Verifique sua caixa de entrada (e o spam) para ativar sua conta.'
      );
      setIsSignup(false);
      setEmail('');
      setPassword('');
      setInviteCode('');

    } else {
      await login(email, password);
    }
  } catch (err: any) {
    // Trata o erro específico de email não confirmado
    if (err.message?.includes('Email not confirmed')) {
      setError('Seu email ainda não foi confirmado. Verifique sua caixa de entrada.');
    } else {
      setError(err.message || 'Erro ao autenticar. Tente novamente.');
    }
  } finally {
    setLoading(false);
  }
};

  if (user) {
    return (
      <div className="w-full h-screen bg-linear-to-br from-zinc-900 via-zinc-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <img src={evokLogo} alt="Logo Evok" className="w-40 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo! 👋</h1>
          <p className="text-zinc-400 mb-6">{user.email}</p>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 mx-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-linear-to-br from-zinc-900 via-zinc-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <img src={evokLogo} alt="Logo Evok" className="w-100 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">Controle Inteligente!</h1>
          <p className="text-xs text-zinc-400">Gestão financeira baseada na regra 50/30/20.</p>
        </div>

        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isSignup ? 'Criar Conta' : 'Entrar'}
          </h2>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* ✅ Mensagem de sucesso */}
          {success && (
            <div className="bg-green-900/30 border border-green-600 text-green-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-zinc-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-zinc-700 text-white pl-10 pr-4 py-3 rounded-lg border border-zinc-600 focus:border-green-600 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-zinc-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-700 text-white pl-10 pr-4 py-3 rounded-lg border border-zinc-600 focus:border-green-600 focus:outline-none transition"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Código de convite
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 text-zinc-500" size={20} />
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Código fornecido pela empresa"
                    className="w-full bg-zinc-700 text-white pl-10 pr-4 py-3 rounded-lg border border-zinc-600 focus:border-green-600 focus:outline-none transition"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold py-3 rounded-lg transition mt-6"
            >
              {loading ? 'Carregando...' : isSignup ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              {isSignup ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setSuccess('');
                  setInviteCode('');
                }}
                className="ml-2 text-green-600 hover:text-green-500 font-semibold transition"
              >
                {isSignup ? 'Entrar' : 'Criar conta'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-8">
          🔒 Seus dados estão seguros e criptografados no Supabase
        </p>
      </div>
    </div>
  );
}