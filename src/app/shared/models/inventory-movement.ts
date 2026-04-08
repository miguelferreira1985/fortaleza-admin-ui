export interface InventoryMovement {
    id?: number;
    productId: string;
    productName: string;
    productCode: string;
    movementType: string;
    description?: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    createdBy: string
    movementDate: string;
}
