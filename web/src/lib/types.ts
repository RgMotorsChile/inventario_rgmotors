export type ItemRow = {
  sku: string;
  name: string;
  category: string;
  brand: string;
  stock: number;
  min_stock: number;
  location: string;
  unit_cost: number | string;
  compatible: string;
};

export type AssignmentRow = {
  id: string;
  item_sku: string;
  qty: number;
  worker_id: string;
  status: string;
  created_at: string;
};

export type MovementRow = {
  id: string;
  type: string;
  item_sku: string;
  qty: number;
  plate: string | null;
  worker_id?: string | null;
  worker_name: string | null;
  note: string | null;
  outcome?: string | null;
  user_name: string;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
};

export type WorkerRow = {
  id: string;
  full_name: string;
  job_title: string;
  active: boolean;
};

export type VehicleDelivery = {
  id: string;
  created_at: string;
  item_name: string;
  qty: number;
  worker_name: string;
  outcome: string | null;
  note: string | null;
  user_name: string;
};

export type VehicleRow = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: string;
};
