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

export interface SaleReturnItemRepsonse {
  id: number;
  originalSaleItemId: number;
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
  saleFolio: string;
  employeeId: number;
  employeeName: string;
  returnDate: string;
  returnType: ReturnType;
  totalRefuned: number;
  refundMethod: PaymentMethod;
  reason: string;
  items: SaleReturnItemRepsonse[];
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
  totalSales: number;             // cantidad de ventas pendientes
  totalCashAmount: number;        // suma en efectivo
  totalCardAmount: number;        // suma en tarjeta
  totalTransferAmount: number;    // suma en transferencia
  grandTotal: number;
}
