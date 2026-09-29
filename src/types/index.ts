export interface User {
  uid: string;
  name: string;
  role: string;
  tenantId: string;
  permissions?: string[];
}

export interface Machine {
  id: string;
  name: string;
  qrCode?: string;
  internalId?: string;
  regionId?: string;
  regionName?: string;
  currentWorkHours?: number;
  isDeleted?: boolean;
}

export interface Ticket {
  id: string;
  machineId: string;
  status: number | string; // e.g., 1, 2, 3, 4, 5, 'new'
  topic: string;
  description: string;
  reportedBy: string;
  createdAt: string | Date | any; // Firebase Timestamp is tricky here, start with any
  updatedAt?: string | Date | any;
  closedAt?: string | Date | any;
  history?: Array<{
    date: string | Date | any;
    user: string;
    action: string;
    note?: string;
  }>;
  isDeleted?: boolean;
}

export interface Part {
  id: string;
  name: string;
  code: string;
  stock: number;
  minStock: number;
  location?: string;
  unit: string;
  isDeleted?: boolean;
}
