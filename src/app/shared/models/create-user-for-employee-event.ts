import { UserRequestDto } from "./user-request-dto";

export interface CreateUserForEmployeeEvent {
    employeeId: number;
    user: UserRequestDto;
}