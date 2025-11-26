import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    companyId: string;
    role: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<LoginResponse>('/auth/login', form);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data);
      navigate('/');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-700 px-4">
      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 rounded-3xl bg-white/10 p-8 text-white shadow-2xl backdrop-blur md:grid-cols-2 md:p-12">
        <div className="hidden flex-col justify-between md:flex">
          <div>
            <p className="text-sm uppercase tracking-wide text-secondary">Operação inteligente</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight">
              Alves Lava a Jato
              <br /> Gestão completa em um só lugar.
            </h1>
            <p className="mt-3 text-sm text-slate-200">
              Controle de agenda, OS, financeiro e CRM ativo inspirado na experiência da Plataforma CERA.
            </p>
          </div>
          <div className="mt-8 rounded-2xl bg-white/5 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">Dicas para login</p>
            <ul className="mt-2 space-y-1">
              <li>• Cada usuário pertence a uma empresa (companyId).</li>
              <li>• Tokens de acesso e refresh são guardados no navegador.</li>
              <li>• Se não possuir conta, crie uma empresa e usuário via API.</li>
            </ul>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-card">
          <h2 className="text-xl font-semibold text-primary">Acessar painel</h2>
          <p className="text-sm text-slate-600">Informe suas credenciais e o código da empresa.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="E-mail"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              label="Senha"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                Não foi possível autenticar. Verifique e-mail e senha.
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">API de autenticação</p>
            <p>POST /auth/login → {`{ email, password }`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
