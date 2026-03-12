export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export type ManagementStatus = 'draft' | 'submitted' | 'in_review' | 'negotiating' | 'resolved' | 'canceled' | 'Pending' | 'PendingPayment' | 'Completed' | 'In Progress' | 'Failed' | 'Missing Information';

export interface Invoice {
  id: string;
  managementId: string;
  filename: string;
  size: number;
  mime: string;
  uploadedAt: string;
  fileUrl: string;
  number?: string;
  period?: string;
  total?: number;
}

export interface ManagementRequest {
  id: string;
  userId: string;
  status: ManagementStatus;
  createdAt: string;
  updatedAt: string;
  serviceName?: string;
  notes?: string;
  invoice?: Invoice;
  savingsAchieved?: number;
  promotionStart?: string;
  promotionEnd?: string;
  duration?: number;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  brand: 'Visa' | 'Mastercard' | 'Amex' | 'Other';
  last4: string;
  issuerName: string;
  isDefault: boolean;
  createdAt: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'failed';

export interface Payment {
  id: string;
  userId: string;
  managementId: string;
  installmentNumber: number; // 1 to 6
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: string;
  paymentMethodSnapshot?: {
    brand: string;
    last4: string;
    issuerName: string;
  };
  createdAt: string;
}
