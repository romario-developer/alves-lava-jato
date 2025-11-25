import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/clients', label: 'Clientes' },
  { to: '/services', label: 'Serviços' },
  { to: '/work-orders', label: 'OS' },
];

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
                AL
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Alves Lava a Jato</p>
                <p className="text-xs text-slate-500">Gestão multi-empresa</p>
              </div>
            </div>
            <nav className="hidden gap-4 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'text-sm font-medium px-3 py-2 rounded-lg',
                      isActive ? 'bg-slate-100 text-primary' : 'text-slate-600 hover:text-primary',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <Button intent="ghost" size="sm" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
