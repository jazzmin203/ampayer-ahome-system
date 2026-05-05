import { useAuth } from "@/auth/AuthContext"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"

const adminMenu = [
    { title: "Dashboard", to: "/dashboard", icon: "📊", color: "from-blue-500 to-blue-600" },
    { title: "Ligas", to: "/admin/leagues", icon: "🏆", color: "from-yellow-500 to-yellow-600" },
    { title: "Juegos", to: "/admin/games", icon: "⚾", color: "from-red-500 to-red-600" },
    { title: "Ampayers", to: "/admin/teams", icon: "👨‍⚖️", color: "from-purple-500 to-purple-600" },
    { title: "Estadios", to: "/admin/stadiums", icon: "🏟️", color: "from-slate-500 to-slate-600" },
    { title: "Programación", to: "/admin/assignments", icon: "📅", color: "from-indigo-500 to-indigo-600" },
]

const ampayerMenu = [
    { title: "Mis Juegos", to: "/ampayer", icon: "⚾", color: "from-blue-500 to-blue-600" },
    { title: "Calendario", to: "/ampayer", icon: "📅", color: "from-indigo-500 to-indigo-600" },
    { title: "Estadios", to: "/ampayer", icon: "🏟️", color: "from-green-500 to-green-600" },
    { title: "Perfil", to: "/ampayer", icon: "👤", color: "from-slate-500 to-slate-600" },
]

export default function Home() {
    const { user } = useAuth()
    const menu = user?.role === "admin" ? adminMenu : ampayerMenu

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">
                    Bienvenido, {user?.username}
                </h1>
                <p className="text-slate-600 mb-10">
                    Selecciona una opción para comenzar
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {menu.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link to={item.to}>
                                <div className={`h-40 rounded-2xl shadow-lg bg-gradient-to-br ${item.color}
                    text-white p-6 flex flex-col justify-between
                    hover:scale-105 transition-transform`}>
                                    <div className="text-4xl">{item.icon}</div>
                                    <h2 className="text-xl font-semibold">{item.title}</h2>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
