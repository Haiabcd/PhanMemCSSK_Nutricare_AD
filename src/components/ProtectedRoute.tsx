import { Navigate, Outlet } from "react-router-dom";
import { hasAccessToken } from "../utils/auth";

export default function ProtectedRoute() {
    if (!hasAccessToken()) return <Navigate to="/" replace />;
    return <Outlet />;
}
