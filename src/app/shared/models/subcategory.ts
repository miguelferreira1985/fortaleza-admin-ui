import { Category } from "./category";

export interface Subcategory {
    id?: number;
    name: string;
    description?: string;
    category: Category;
    isActivate?: boolean;
    createdDateTime?: Date;
    updatedDateTime?: Date;
    createdBy?: string;
    updatedBy?: string;
}