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
