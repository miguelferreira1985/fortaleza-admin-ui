export type CashSessionStatus = 'ABIERTA' | 'CERRADA';
export type CashMovementType = 'ENTRADA' | 'SALIDA';

export interface CashMovementResponse {
  id: number;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdBy: string;
  createdDateTime: string;
}

export interface CashSessionResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  openingAmount: number;
  openingDateTime: string;
  closingDateTime?: string;
  expectedCash?: number;
  declaredCash?: number;
  cashDifference?: number;
  totalCardSales?: number;
  totalTransferSales?: number;
  totalCardRefunds?: number;
  totalTransferRefunds?: number;
  totalCashSales?: number;
  totalCashInflows?: number;
  totalCashOutflows?: number;
  totalCashRefunds?: number;
  status: CashSessionStatus;
  notes?: string;
  movements: CashMovementResponse[];
  createdBy: string;
  createdDateTime: string;
}

export interface OpenCashSessionRequest {
  openingAmount: number;
}

export interface CloseCashSessionRequest {
  declaredCash: number;
  notes?: string;
}

export interface CashMovementRequest {
  type: CashMovementType;
  amount: number;
  reason: string;
}

export interface CashCutReport {
  cutType: 'SESION' | 'DIA' | 'EMPLEADO';
  employeeName?: string;
  periodFrom: string;
  periodTo: string;
  openingAmount: number;
  totalCashSales: number;
  totalCashInflows: number;
  totalCashOutflows: number;
  totalCashRefunds: number;
  expectedCash: number;
  declaredCash?: number;
  cashDifference?: number;
  totalCardSales: number;
  totalCardRefunds: number;
  netCardTotal: number;
  totalTransferSales: number;
  totalTransferRefunds: number;
  netTransferTotal: number;
  grandTotal: number;
}
