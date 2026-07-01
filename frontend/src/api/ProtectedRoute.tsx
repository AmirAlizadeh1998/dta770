// frontend/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import React from "react";

type Props = {
    children: React.ReactNode;
};

export function ProtectedRoute({ children }: Props) {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
