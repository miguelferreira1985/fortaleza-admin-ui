export type SaleStatus = 'COMPLETADA' | 'CANCELADA' | 'DEVUELTA' | 'DEVUELTA_PARCIAL';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
export type ReturnType = 'TOTAL' | 'PARCIAL';

export interface SaleItemResponse {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface SalePaymentResponse {
  id: number;
  paymentMethod: PaymentMethod;
  amount: number;
  cashReceived?: number;
}

export interface SaleResponse {
  id: number;
  folio: string;
  clientId?: number;
  clientName?: string;
  employeeId: number;
  employeeName: string;
  saleDate: string;
  subtotal: number;
  total: number;
  status: SaleStatus;
  toBeBilled: boolean;
  cancelReason?: string;
  items: SaleItemResponse[];
  payments: SalePaymentResponse[];
  createdBy: string;
  createdDateTime: string;
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  discount: number;
}

export interface SalePaymentRequest {
  paymentMethod: PaymentMethod;
  amount: number;
  cashReceived?: number;
}

export interface SaleRequest {
  clientId?: number | null;
  toBeBilled:boolean;
  items: SaleItemRequest[];
  payments: SalePaymentRequest[];
}

export interface SaleCancelRequest {
  reason: string;
}

export interface SaleReturnItemRequest {
  saleItemId: number;
  quantityToReturn: number;
}

export interface SaleReturnRequest {
  refundMethod: PaymentMethod;
  reason: string;
  items: SaleReturnItemRequest[];
}

export interface SaleReturnItemResponse {
  id: number;
  originalSaleItemId?: number;
  productId: number;
  productName: string;
  productCode: string;
  quantityReturned: number;
  refundAmount: number;
}

export interface SaleReturnResponse {
  id: number;
  folio: string;
  saleId?: number;
  saleFolio?: string;
  employeeId: number;
  employeeName: string;
  returnDate: string;
  returnType: ReturnType;
  totalRefunded: number;
  refundMethod: PaymentMethod;
  reason: string;
  items: SaleReturnItemResponse[];
  freeReturn: boolean;
  createdBy: string;
  createdDateTime: string;
}

export interface CartItem {
  product: {
    id: number;
    name: string;
    code: string;
    price: number;
    stock: number;
  };
  quantity: number;
  discount: number;
  subtotal: number;
}

export interface CartPayment {
  paymentMethod: PaymentMethod;
  amount: number;
}

export interface FreeReturnRequest {
  amount: number;
  refundMethod: PaymentMethod;
  reason: string;
  productId?: number | null;
  quantityToRestore?: number | null;
}

export interface BillingClientSummary {
  clientId: number;
  clientName: string;
  clientRfc: string;
  totalSales: number;
  totalProducts: number;
  totalCashAmount: number;
  totalCardAmount: number;
  totalTransferAmount: number;
  grandTotal: number;
}

export interface BillingClientDetail {
  groupKey: string;
  paymentMethod: PaymentMethod;
  saleId: number | null;
  folio: string;
  saleDate: string | null;
  total: number;
  isGrouped: boolean;
}

export interface BillingItemDetail {
  productId: number;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  dicount: number;
  subtotal: number
}
