import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from './useAuth';
import { Mail, Lock, LogOut, Key, CheckCircle, PieChart, Target, Calendar, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import evokLogo from './assets/evokmif_logo0.png';

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
            className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white tracking-tight inline-block"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
          <motion.span
            initial={{ x: "-110%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 0.7, delay: i * 0.04, ease: "easeInOut" }}
            className="absolute inset-0 text-2xl sm:text-3xl lg:text-5xl font-extrabold text-finance-green tracking-tight pointer-events-none"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
          <motion.span
            initial={{ x: "110%" }}
            animate={{ x: "-120%" }}
            transition={{ duration: 0.7, delay: i * 0.04 + 0.15, ease: "easeInOut" }}
            className="absolute inset-0 text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white tracking-tight pointer-events-none"
            style={{ clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

export function LoginPage() {
  const { login, signup, logout, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      await signup(email, password, inviteCode);
      setSuccess(
  `✅ Conta criada com sucesso! Você já pode fazer login com seu email e senha.`
);
      setIsSignup(false);
      setEmail('');
      setPassword('');
      setInviteCode('');
    } else {
      await login(email, password);
    }
  } catch (err: any) {
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
      <div className="w-full h-screen flex items-center justify-center" style={{ background: 'radial-gradient(circle at 75% 10%, rgba(34,197,94,0.10) 0%, transparent 50%), linear-gradient(160deg, #1c1c20 0%, #0d0d10 100%)' }}>
        <div className="text-center bg-evok-surface border border-evok-border rounded-2xl p-10 shadow-2xl">
          <div className="mb-8">
            <img src={evokLogo} alt="Logo Evok" className="w-40 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo! 👋</h1>
          <p className="text-slate-400 mb-6">{user.email}</p>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 mx-auto border border-finance-red/40 text-finance-red hover:bg-finance-red/10 hover:border-finance-red font-bold py-3 px-6 rounded-lg transition active:scale-[0.98]"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </div>
    );
  }

 return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row" style={{ background: 'radial-gradient(circle at 75% 10%, rgba(34,197,94,0.10) 0%, transparent 50%), linear-gradient(160deg, #1c1c20 0%, #0d0d10 100%)' }}>

      {/* Coluna esquerda — convite */}
      <div className="lg:w-1/2 flex flex-col justify-start lg:justify-center px-8 pt-16 pb-12 lg:px-16 relative overflow-hidden" style={{ backgroundImage: 'linear-gradient(to right, rgba(136,136,136,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(136,136,136,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
        <img src={evokLogo} alt="Logo Evok" className="mb-8" style={{ width: '420px', maxWidth: '90%' }} />
        <div className="mb-3"><ShutterTitle text="Meu Incrível Financeiro" /></div>
        <p className="text-slate-400 text-base mb-10 max-w-md">Organize seu dinheiro pelo método 50/30/20 e realize seus sonhos.</p>
        <div className="space-y-4 max-w-md">
          {[
            { Icon: PieChart, text: 'Controle pelo método 50/30/20' },
            { Icon: Target, text: 'Defina e acompanhe suas metas' },
            { Icon: Calendar, text: 'Visão anual completa das suas finanças' },
            { Icon: ShieldCheck, text: 'Seus dados seguros e privados' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-finance-green/15 text-finance-green shrink-0">
                <b.Icon size={18} />
              </span>
              <span className="text-slate-200 text-sm font-medium">{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coluna direita — formulário */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-evok-surface border border-evok-border rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {isSignup ? 'Criar Conta' : 'Bem-vindo de volta'}
            </h2>

            {error && (
              <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

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
                    className="w-full bg-white/5 text-white placeholder:text-slate-500 pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-finance-green focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-zinc-500" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 text-white placeholder:text-slate-500 pl-10 pr-12 py-3 rounded-lg border border-white/10 focus:border-finance-green focus:outline-none transition"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
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
                      className="w-full bg-white/5 text-white placeholder:text-slate-500 pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-finance-green focus:outline-none transition"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-finance-green hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition mt-6 active:scale-[0.98]"
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
                  className="ml-2 text-finance-green hover:text-green-400 font-semibold transition"
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
    </div>
  );
}