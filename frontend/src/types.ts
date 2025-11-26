export type Client = {
  id: string;
  name: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  tags?: string[];
};

export type Vehicle = {
  id: string;
  plate: string;
  model?: string;
  brand?: string;
  color?: string;
};

export type WorkOrderItem = {
  id: string;
  service: {
    name: string;
    category?: string;
  };
  quantity: number;
  total: number;
};

export type WorkOrder = {
  id: string;
  sequential: number;
  status: string;
  totalNet: number;
  openedAt: string;
  client: Client;
  vehicle?: Vehicle;
  items: WorkOrderItem[];
};

export type Appointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  client: Client;
  vehicle?: Vehicle;
  services: Array<{ service: { name: string } }>;
};

export type Payable = {
  id: string;
  description: string;
  category: string;
  expected: number;
  paid?: number | null;
  dueDate: string;
  paidDate?: string | null;
  supplier?: string | null;
  status: string;
};

export type Receivable = {
  id: string;
  expected: number;
  received?: number | null;
  expectedDate: string;
  receivedDate?: string | null;
  status: string;
  client?: { id: string; name: string } | null;
  workOrder?: { id: string; sequential: number } | null;
};

export type FollowUp = {
  id: string;
  contactAt: string;
  status: string;
  client: { id: string; name: string; whatsapp?: string | null };
  workOrder: { id: string; sequential: number };
  service?: { id: string; name: string } | null;
};

export type OnboardingStatus = {
  completed: boolean;
  data?: {
    ramoAtuacao: string[];
    qtdFuncionarios?: string;
    faturamentoMensal?: string;
    prioridade?: string;
    comoConheceu?: string;
    completedAt?: string;
  };
};

export type Service = {
  id: string;
  name: string;
  basePrice: number;
};
