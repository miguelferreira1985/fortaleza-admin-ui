import { SupplierCost } from "./supplier-cost";

export interface ProductRequestDto {
    id?: number;
    name: string;
    code: string;
    description: string;
    price: number;
    cost: number;
    stock: number;
    minimumStock: number;
    recommendedStock: number;
    subcategoryId?: number;
    presentationId?: number;
    supplierCosts?: SupplierCost[];
}
