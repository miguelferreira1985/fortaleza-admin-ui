import { PurchaseOrderStatus } from "./purchase-order-status.enum";

export interface PurchaseOrderItemRequest {
    id?: number;
    productId: number;
    quantityOrdered: number;
    unitCostWithTaxes?: number;
    unitCostWithoutTaxes?: number;
}

export interface PurchaseOrderRequest {
    supplierId: number;
    expectedDeliveryDate?: string;
    items: PurchaseOrderItemRequest[];
}

export interface PurchaseOrderItem {
    id: number;
    productId: number;
    productName: string;
    supplierProductCode: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitCostWithTaxes: number;
    unitCostWithoutTaxes: number;
    subtotalWithTaxes: number;
    subtotalWithoutTaxes: number;
}

export interface PurchaseOrder {
    id: number;
    supplierId: number;
    supplierName: string;
    status: PurchaseOrderStatus;
    expectedDeliveryDate?: string;
    totalCostWithTaxes: number;
    totalCostWithoutTaxes: number;
    items: PurchaseOrderItem[];
    createdDateTime?: string;
    updatedDateTime?: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface PurchaseOrderStatusItemDTO {
    itemId: number;
    quantityToReceive: number;
}

export interface PurchaseOrderStatusUpdateRequestDTO {
    newStatus: PurchaseOrderStatus;
    description?: string;
    items?: PurchaseOrderStatusItemDTO[];
}

export interface PurchaseOrderUpdateRequestDTO {
    expectedDeliveryDate?: string | null;
    items: PurchaseOrderItemRequest[];
}

export interface PurchaseOrderItemDetail {
    id: number;
    productId: number;
    productName: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitCostWithTaxes: number;
    unitCostWithoutTaxes: number;
    subtotalWithTaxes: number;
    subtotalWithoutTaxes: number;
  }

  export interface PurchaseOrderDetail {
    id: number;
    supplierId: number;
    supplierName: string;
    expectedDeliveryDate: string;
    createdDateTime: string;
    status: 'PENDIENTE' | 'PARCIALMENTE_RECIBIDA' | 'COMPLETADA' | 'CANCELADA';
    totalCostWithTaxes: number;
    totalCostWithoutTaxes: number;
    items: PurchaseOrderItemDetail[];
  }
