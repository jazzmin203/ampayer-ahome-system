// src/pages/admin/AdminHome.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import LogoutButton from "@/components/LogoutButton";

export default function AdminHome() {
    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* Sidebar */}
            <Sidebar role="admin" />

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col">

                {/* Header */}
                <header className="h-16 bg-white shadow px-6 flex items-center justify-between sticky top-0 z-10">
                    <h1 className="font-semibold text-xl">Panel Administrador</h1>
                    <LogoutButton />
                </header>

                {/* Contenido de las páginas internas */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>

            </div>
        </div>
    );
}
