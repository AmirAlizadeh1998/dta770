// models/user.ts

export type User = {
    id: number
    user_name: string
    first_name: string
    last_name: string
    mobile: string
    role_name: string
    role_id: number
    status: string
}

export type UserFormData = {
    user_name: string
    first_name: string
    last_name: string
    mobile: string
    password?: string
    role_id: number
    status: string
}

export type Role = {
    id: number;
    name: string;
    description: string;
}