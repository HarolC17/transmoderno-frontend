import {Routes, Route, Navigate} from 'react-router-dom'
import {useAuth} from '../hooks/useAuth'

import EstudiantePage from '../pages/estudiante/EstudiantePage'
import LoginPage from '../pages/admin/LoginPage'
import DashboardPage from '../pages/admin/DashboardPage'
import ParticipantesPage from '../pages/admin/ParticipantesPage'
import SesionesPage from '../pages/admin/SesionesPage'
import AsistenciaPage from '../pages/admin/AsistenciaPage'
import AlertasPage from '../pages/admin/AlertasPage'
import ReportesPage from '../pages/admin/ReportesPage'
import InscripcionesPage from '../pages/admin/InscripcionesPage'

function RutaProtegida({children}) {
    const {token} = useAuth()
    return token ? children : <Navigate to="/admin/login"/>
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<EstudiantePage/>}/>
            <Route path="/admin/login" element={<LoginPage/>}/>
            <Route path="/admin" element={<RutaProtegida><DashboardPage/></RutaProtegida>}>
                <Route index element={<DashboardHome/>}/>
                <Route path="participantes" element={<ParticipantesPage/>}/>
                <Route path="inscripciones" element={<InscripcionesPage/>}/>
                <Route path="sesiones" element={<SesionesPage/>}/>
                <Route path="asistencia" element={<AsistenciaPage/>}/>
                <Route path="alertas" element={<AlertasPage/>}/>
                <Route path="reportes" element={<ReportesPage/>}/>
            </Route>
        </Routes>
    )
}

import {useState, useEffect} from 'react'
import api from '../api/axios'

function DashboardHome() {
    const [stats, setStats] = useState({
        participantes: 0,
        sesiones: 0,
        asistencias: 0,
        solicitudesPendientes: 0
    })

    useEffect(() => {
        const cargar = async () => {
            try {
                const [resParticipantes, resSesiones1, resSesiones2, resAlertas] = await Promise.all([
                    api.get('/participantes?page=0&size=1'),
                    api.get('/sesiones/ruta/1?page=0&size=1'),
                    api.get('/sesiones/ruta/2?page=0&size=1'),
                    api.get('/alertas/ayuda?page=0&size=50')
                ])
                const pendientes = resAlertas.data.contenido.filter(s => !s.atendida).length
                setStats({
                    participantes: resParticipantes.data.totalElementos,
                    sesiones: (resSesiones1.data.totalElementos || 0) + (resSesiones2.data.totalElementos || 0),
                    solicitudesPendientes: pendientes
                })
            } catch {
            }
        }
        cargar()
    }, [])

    const cards = [
        {
            label: 'Participantes registrados',
            valor: stats.participantes,
            color: 'bg-green-50 border-green-100',
            texto: 'text-green-700',
            icono: '👥'
        },
        {
            label: 'Sesiones creadas',
            valor: stats.sesiones,
            color: 'bg-blue-50 border-blue-100',
            texto: 'text-blue-700',
            icono: '📅'
        },
        {
            label: 'Solicitudes pendientes',
            valor: stats.solicitudesPendientes,
            color: 'bg-red-50 border-red-100',
            texto: 'text-red-700',
            icono: '🙋'
        },
    ]

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
                <p className="text-sm text-gray-500 mt-0.5">Resumen general del sistema</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {cards.map((card, i) => (
                    <div key={i} className={`${card.color} border rounded-2xl p-5`}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
                            <span className="text-2xl">{card.icono}</span>
                        </div>
                        <p className={`text-4xl font-semibold ${card.texto}`}>{card.valor}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Rutas activas</p>
                    <p className="text-xs text-gray-400 mb-4">Programas en operación actualmente</p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                            <div
                                className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">1
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Energía sin Límite</p>
                                <p className="text-xs text-gray-400">Actividad física musicalizada</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                            <div
                                className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">2
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Alma Latina</p>
                                <p className="text-xs text-gray-400">Baile y ritmos latinos</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Accesos rápidos</p>
                    <p className="text-xs text-gray-400 mb-4">Navega a las secciones principales</p>
                    <div className="flex flex-col gap-2">
                        {[
                            {label: 'Ver participantes', path: '/admin/participantes', icono: '👥'},
                            {label: 'Gestionar sesiones', path: '/admin/sesiones', icono: '📅'},
                            {label: 'Revisar alertas', path: '/admin/alertas', icono: '🔔'},
                            {label: 'Generar reportes', path: '/admin/reportes', icono: '📊'},
                        ].map((item, i) => (
                            <a key={i} href={item.path}
                               className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm text-gray-700">
                                <span>{item.icono}</span>
                                {item.label}
                                <span className="ml-auto text-gray-300">›</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}