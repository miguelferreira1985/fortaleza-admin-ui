export interface Supplier {
    id?: number;
    name: string;
    contact: string;
    location: string;
    email?: string;
    contactPhone: string;
    officePhone?: string,
    isActivate?: boolean;
    createdDateTime?: Date;
    updatedDateTime?: Date;
    createdBy?: string;
    updatedBy?: string;
}