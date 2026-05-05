// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useState } from "react";

export default function Sidebar({ role }) {
    const [isOpen, setIsOpen] = useState(true);

    // Menú según el rol
    const adminLinks = [
        { name: "Inicio", path: "/admin" },
        { name: "Ligas", path: "/admin/leagues" },
        { name: "Zonas", path: "/admin/zones" },
        { name: "Juegos", path: "/admin/games" },
        { name: "Estadios", path: "/admin/stadiums" },
        { name: "Asignaciones", path: "/admin/assignments" },
    ];

    const ampayerLinks = [
        { name: "Inicio", path: "/ampayer" },
        // Puedes agregar más enlaces si es necesario
    ];

    const links = role === "admin" ? adminLinks : ampayerLinks;

    return (
        <div
            className={`bg-white shadow-lg h-screen transition-all duration-300 ${isOpen ? "w-64" : "w-16"
                } flex flex-col`}
        >
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 border-b">
                {isOpen && <span className="font-bold text-lg">Menú</span>}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                    {isOpen ? "←" : "→"}
                </button>
            </div>

            {/* Enlaces */}
            <nav className="flex-1 p-2 space-y-1">
                {links.map((link) => (
                    <NavLink
                        key={link.name}
                        to={link.path}
                        end
                        className={({ isActive }) =>
                            `block px-4 py-2 rounded-md transition-colors duration-200 ${isActive
                                ? "bg-blue-500 text-white font-semibold"
                                : "text-gray-700 hover:bg-gray-200"
                            }`
                        }
                    >
                        {isOpen ? link.name : link.name.charAt(0)}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
