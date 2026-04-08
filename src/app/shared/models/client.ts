export interface Client {
    id?: number;
    name: string;
    phone?: string;
    rfc: string;
    isActivate?: boolean;
    createdDateTime?: Date;
    updatedDateTime?: Date;
    createdBy?: string;
    updatedBy?: string;
}
