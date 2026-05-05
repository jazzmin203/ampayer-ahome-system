import { Link } from "react-router-dom"

export default function MenuCard({ title, to, icon }) {
    return (
        <Link
            to={to}
            className="bg-white rounded-xl shadow hover:shadow-xl transition p-6 flex items-center gap-4"
        >
            <div className="text-4xl">{icon}</div>
            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-slate-500">
                    Acceder a {title.toLowerCase()}
                </p>
            </div>
        </Link>
    )
}
