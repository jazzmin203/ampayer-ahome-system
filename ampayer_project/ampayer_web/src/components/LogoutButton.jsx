import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    return (
        <button
        onClick={() => {
            logout();
            navigate("/login");
        }}
        >
        Cerrar sesión
        </button>
    );
};

export default LogoutButton;
