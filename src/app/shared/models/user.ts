export interface User {
    id?: number;
    username: string;
    isBlocked: boolean;
    isActivate?: boolean;
    roles?: string[];
    createdDateTime?: Date;
    updatedDateTime?: Date;
    createdBy?: string;
    updatedBy?: string;
}