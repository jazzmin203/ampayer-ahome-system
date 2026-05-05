// src/auth/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // ⚡ tu versión de jwt-decode

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [tokens, setTokens] = useState(() => {
        const saved = localStorage.getItem("tokens");
        return saved ? JSON.parse(saved) : null;
    });

    const [user, setUser] = useState(() => {
        if (tokens) {
            try {
                const decoded = jwtDecode(tokens.access);
                return { ...decoded, role: tokens.role };
            } catch (e) {
                return null;
            }
        }
        return null;
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tokens) {
            try {
                const decoded = jwtDecode(tokens.access);
                setUser({ ...decoded, role: tokens.role });
                localStorage.setItem("tokens", JSON.stringify(tokens));
            } catch (e) {
                setTokens(null);
                setUser(null);
                localStorage.removeItem("tokens");
            }
        } else {
            setUser(null);
            localStorage.removeItem("tokens");
        }
        setLoading(false);
    }, [tokens]);

    const login = (tokenData) => {
        setTokens(tokenData);
        localStorage.setItem("tokens", JSON.stringify(tokenData));
    };

    const logout = () => {
        setTokens(null);
        setUser(null);
        localStorage.removeItem("tokens");
    };

    return (
        <AuthContext.Provider value={{ tokens, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
