export interface UserRequestDto {
    id?: number;
    username: string;
    password: string;
    roles: string[];
}