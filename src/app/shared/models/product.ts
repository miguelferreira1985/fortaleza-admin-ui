import { Presentation } from "./presentation";
import { Subcategory } from "./subcategory";
import { SupplierCost } from "./supplier-cost";

export interface Product {
    id?: number;
    name: string;
    code: string;
    description: string;
    price: number;
    cost: number;
    stock: number;
    minimumStock: number;
    recommendedStock: number;
    subcategory?: Subcategory;
    presentation?: Presentation
    supplierCosts?: SupplierCost[];
    isActivate?: boolean;
    createdDateTime?: Date;
    updatedDateTime?: Date;
    createdBy?: string;
    updatedBy?: string;
    profitMargin?: number;
    profitValue?: number;
    inventoryValue?: number;
    isBelowOrEqualMinimumStock?: boolean;
}
