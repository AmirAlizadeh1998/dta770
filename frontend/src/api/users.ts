import type { User, UserFormData } from "../models/user"
import {apiFetch} from "./ApiClient.ts";

export async function fetchUsers(): Promise<User[]> {
    const res = await apiFetch("/api/users")
    const data = await res.json()
    return Array.isArray(data) ? data : []
}

export async function createUser(payload: UserFormData): Promise<User> {
    const res = await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify(payload)
    })
    return res.json()
}

export async function updateUser(id: number, payload: UserFormData): Promise<User> {
    const res = await apiFetch(`/api/users?id=${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    })
    return res.json()
}

export async function deleteUser(id: number): Promise<void> {
    await apiFetch(`/api/users?id=${id}`, {
        method: "DELETE"
    })
}