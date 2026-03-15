import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "../types.ts";
import { useAuth } from "../auth.tsx";

type ProtectedRouteProps = {
    children: React.ReactElement;
    allow?: Role[];
};

const roleToPath: Record<Role, string> = {
    admin: "/dashboard/admin",
    trainer: "/dashboard/trainer",
    athlete: "/dashboard/sportler",
};

export default function ProtectedRoute({ children, allow }: ProtectedRouteProps) {
    const { user } = useAuth();
    const location = useLocation();

    // Nicht eingeloggt
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Hat Rolle, aber nicht die nötige ergebniss = umleiten
    if (allow && !allow.includes(user.role)) {
        return <Navigate to={roleToPath[user.role]} replace />;
    }

    return children;
}
