import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function DashboardPage() {
    const { usuario, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const rol = usuario?.rol

    const handleLogout = () => {
        logout()
        navigate('/admin/login')
    }

    const menuItems = [
        { path: '/admin',               label: 'Panel Principal', icon: '◉',  roles: ['ADMIN', 'PSICOLOGO', 'ENCARGADO'] },
        { path: '/admin/participantes', label: 'Participantes',   icon: '👥', roles: ['ADMIN', 'PSICOLOGO', 'ENCARGADO'] },
        { path: '/admin/inscripciones', label: 'Inscripciones',   icon: '📋', roles: ['ADMIN'] },
        { path: '/admin/sesiones',      label: 'Sesiones',        icon: '📅', roles: ['ADMIN', 'ENCARGADO'] },
        { path: '/admin/asistencia',    label: 'Asistencia',      icon: '✓',  roles: ['ADMIN', 'ENCARGADO'] },
        { path: '/admin/fichas',        label: 'Fichas',          icon: '📝', roles: ['ADMIN', 'PSICOLOGO'] },
        { path: '/admin/analisis',      label: 'Análisis',        icon: '📊', roles: ['ADMIN', 'PSICOLOGO', 'ENCARGADO'] },
        { path: '/admin/usuarios',      label: 'Usuarios',        icon: '🔐', roles: ['ADMIN'] },
    ].filter(item => item.roles.includes(rol))

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <div className="w-56 bg-green-800 flex flex-col flex-shrink-0">
                <div className="p-5 border-b border-green-700">
                    <h1 className="text-white font-semibold text-base">Gimnasio</h1>
                    <p className="text-green-400 text-xs">Transmoderno</p>
                </div>

                <nav className="flex-1 p-3 flex flex-col gap-1">
                    {menuItems.map(item => (
                        <button key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left transition-all
                                    ${location.pathname === item.path
                                    ? 'bg-white/15 text-white'
                                    : 'text-green-300 hover:bg-white/10 hover:text-white'}`}>
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-3 border-t border-green-700">
                    <div className="px-3 py-2 mb-1">
                        <p className="text-white text-xs font-semibold">{usuario?.nombre}</p>
                        <p className="text-green-400 text-xs">{usuario?.correo}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block
                            ${rol === 'ADMIN'     ? 'bg-purple-500/30 text-purple-200' :
                            rol === 'PSICOLOGO'  ? 'bg-blue-500/30 text-blue-200' :
                                'bg-green-500/30 text-green-200'}`}>
                            {rol === 'ADMIN' ? 'Administrador' : rol === 'PSICOLOGO' ? 'Psicólogo' : 'Encargado'}
                        </span>
                    </div>
                    <button onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left text-green-300 hover:bg-white/10 hover:text-white transition-all">
                        <span>🚪</span> Cerrar sesión
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-auto">
                <div className="bg-white border-b border-gray-100 px-6 py-4">
                    <p className="text-sm text-gray-500">
                        {menuItems.find(m => m.path === location.pathname)?.label || 'Dashboard'}
                    </p>
                </div>
                <div className="flex-1 p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}