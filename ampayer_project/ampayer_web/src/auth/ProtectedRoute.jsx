import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth();

    if (loading) return <p>Cargando...</p>; // mientras se carga la sesión

    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/login" replace />;

    return children;
}