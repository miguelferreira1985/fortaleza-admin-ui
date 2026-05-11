import { User } from "./user";

export interface Employee {
    id?: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
    ssn?: string;
    user?: User;
    isActivate?: boolean;
    createdDateTime?: Date;
    updatedDateTime?: Date;
    createdBy?: string;
    updatedBy?: string;
}
