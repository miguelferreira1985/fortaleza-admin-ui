import { User } from "./user";
import { UserRequestDto } from "./user-request-dto";

export interface EmployeeRequestDto {
    id?: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
    ssn?: string;
    userRequestDTO?: UserRequestDto | null;
    isActivate?: boolean;
    createdDateTime?: Date;
    updatedDateTime?: Date;
    createdBy?: string;
    updatedBy?: string;
}
