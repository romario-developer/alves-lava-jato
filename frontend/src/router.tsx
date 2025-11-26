import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ServicesPage } from './pages/ServicesPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { FinancialPage } from './pages/FinancialPage';
import { HomePage } from './pages/HomePage';
import { SpacesPage } from './pages/SpacesPage';
import { NewSalePage } from './pages/NewSalePage';
import { NewBudgetPage } from './pages/NewBudgetPage';
import { NewAppointmentPage } from './pages/NewAppointmentPage';
import { FillSpacePage } from './pages/FillSpacePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'work-orders', element: <WorkOrdersPage /> },
      { path: 'financial', element: <FinancialPage /> },
      { path: 'spaces', element: <SpacesPage /> },
      { path: 'work-orders/new', element: <NewSalePage /> },
      { path: 'budgets/new', element: <NewBudgetPage /> },
      { path: 'appointments/new', element: <NewAppointmentPage /> },
      { path: 'spaces/fill', element: <FillSpacePage /> },
    ],
  },
]);
