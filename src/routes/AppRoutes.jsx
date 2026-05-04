import {Routes, Route, Navigate, Link} from 'react-router-dom'
import {useAuth} from '../hooks/useAuth'
import {useState, useEffect} from 'react'
import api from '../api/axios'

import EstudiantePage from '../pages/estudiante/EstudiantePage'
import LoginPage from '../pages/admin/LoginPage'
import DashboardPage from '../pages/admin/DashboardPage'
import ParticipantesPage from '../pages/admin/ParticipantesPage'
import SesionesPage from '../pages/admin/SesionesPage'
import AsistenciaPage from '../pages/admin/AsistenciaPage'
import InscripcionesPage from '../pages/admin/InscripcionesPage'
import FichasAdminPage from '../pages/admin/fichas/FichasAdminPage.jsx'
import AnalisisPage from '../pages/admin/AnalisisPage'
import UsuariosPage from '../pages/admin/UsuariosPage'

function RutaProtegida({ children }) {
    const { token } = useAuth()
    return token ? children : <Navigate to="/admin/login" />
}

function RutaConRol({ children, roles }) {
    const { usuario } = useAuth()
    if (!roles.includes(usuario?.rol)) return <Navigate to="/admin" />
    return children
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<EstudiantePage/>}/>
            <Route path="/admin/login" element={<LoginPage/>}/>
            <Route path="/admin" element={<RutaProtegida><DashboardPage/></RutaProtegida>}>
                <Route index element={<DashboardHome/>}/>
                <Route path="participantes" element={<ParticipantesPage/>}/>
                <Route path="inscripciones" element={
                    <RutaConRol roles={['ADMIN']}>
                        <InscripcionesPage/>
                    </RutaConRol>
                }/>
                <Route path="sesiones" element={
                    <RutaConRol roles={['ADMIN', 'ENCARGADO']}>
                        <SesionesPage/>
                    </RutaConRol>
                }/>
                <Route path="asistencia" element={
                    <RutaConRol roles={['ADMIN', 'ENCARGADO']}>
                        <AsistenciaPage/>
                    </RutaConRol>
                }/>
                <Route path="fichas" element={
                    <RutaConRol roles={['ADMIN', 'PSICOLOGO']}>
                        <FichasAdminPage/>
                    </RutaConRol>
                }/>
                <Route path="analisis" element={<AnalisisPage/>}/>
                <Route path="usuarios" element={
                    <RutaConRol roles={['ADMIN']}>
                        <UsuariosPage/>
                    </RutaConRol>
                }/>
            </Route>
        </Routes>
    )
}

function DashboardHome() {
    const { usuario } = useAuth()
    const rol = usuario?.rol

    const [stats, setStats] = useState({
        participantes: 0,
        sesiones: 0,
        solicitudesPendientes: 0
    })
    const [rutas, setRutas] = useState([])
    const [modalRuta, setModalRuta] = useState(null)
    const [formRuta, setFormRuta] = useState({nombre: '', descripcion: ''})
    const [guardandoRuta, setGuardandoRuta] = useState(false)

    useEffect(() => {
        cargarTodo()
    }, [])

    const cargarTodo = async () => {
        try {
            const resRutas = await api.get('/rutas')
            const todasRutas = resRutas.data
            setRutas(todasRutas)

            const rutasActivas = todasRutas.filter(r => r.activa)

            let totalSesiones = 0
            if (rol === 'ADMIN' || rol === 'ENCARGADO') {
                const resSesiones = await Promise.all(
                    rutasActivas.map(r => api.get(`/sesiones/ruta/${r.id}?page=0&size=1`))
                )
                totalSesiones = resSesiones.reduce((acc, res) => acc + (res.data.totalElementos || 0), 0)
            }

            const resParticipantes = await api.get('/participantes?page=0&size=1')

            let pendientes = 0
            if (rol === 'ADMIN' || rol === 'PSICOLOGO') {
                const resAlertas = await api.get('/alertas/ayuda?page=0&size=50')
                pendientes = resAlertas.data.contenido.filter(s => !s.atendida).length
            } else if (rol === 'ENCARGADO') {
                const resInasistencia = await api.get('/alertas/inasistencia?page=0&size=1')
                pendientes = resInasistencia.data.totalElementos || 0
            }

            setStats({
                participantes: resParticipantes.data.totalElementos,
                sesiones: totalSesiones,
                solicitudesPendientes: pendientes
            })
        } catch {}
    }

    const abrirNueva = () => {
        setFormRuta({nombre: '', descripcion: ''})
        setModalRuta('nueva')
    }

    const abrirEditar = (ruta) => {
        setFormRuta({nombre: ruta.nombre, descripcion: ruta.descripcion || ''})
        setModalRuta(ruta)
    }

    const handleGuardarRuta = async () => {
        if (!formRuta.nombre.trim()) return
        setGuardandoRuta(true)
        try {
            if (modalRuta === 'nueva') {
                await api.post('/rutas', formRuta)
            } else {
                await api.put(`/rutas/${modalRuta.id}`, formRuta)
            }
            setModalRuta(null)
            cargarTodo()
        } catch {
            alert('Error al guardar. Intenta de nuevo.')
        } finally {
            setGuardandoRuta(false)
        }
    }

    const handleToggleActiva = async (ruta) => {
        if (!confirm(`¿${ruta.activa ? 'Desactivar' : 'Activar'} la ruta "${ruta.nombre}"?`)) return
        try {
            if (ruta.activa) {
                await api.delete(`/rutas/${ruta.id}`)
            } else {
                await api.patch(`/rutas/${ruta.id}/reactivar`)
            }
            cargarTodo()
        } catch {
            alert('Error al actualizar la ruta.')
        }
    }

    const handleTogglePost = async (ruta) => {
        const nuevoEstado = !ruta.postHabilitado
        if (!confirm(`¿${nuevoEstado ? 'Habilitar' : 'Deshabilitar'} el POST para "${ruta.nombre}"?`)) return
        try {
            await api.patch(`/rutas/${ruta.id}/post?habilitado=${nuevoEstado}`)
            cargarTodo()
        } catch {
            alert('Error al actualizar el estado del POST.')
        }
    }

    const labelSolicitudes = rol === 'ENCARGADO' ? 'Alertas inasistencia' : 'Solicitudes pendientes'

    const cards = [
        {label: 'Participantes registrados', valor: stats.participantes, color: 'bg-green-50 border-green-100', texto: 'text-green-700', icono: '👥', path: '/admin/participantes'},
        ...(rol === 'ADMIN' || rol === 'ENCARGADO' ? [{label: 'Sesiones creadas', valor: stats.sesiones, color: 'bg-blue-50 border-blue-100', texto: 'text-blue-700', icono: '📅', path: '/admin/sesiones'}] : []),
        {label: labelSolicitudes, valor: stats.solicitudesPendientes, color: 'bg-red-50 border-red-100', texto: 'text-red-700', icono: '🙋', path: '/admin/analisis'},
    ]

    return (
        <div className="flex flex-col gap-6">

            {modalRuta && rol === 'ADMIN' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                     onClick={() => setModalRuta(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4"
                         onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-gray-800">
                            {modalRuta === 'nueva' ? 'Nueva ruta' : 'Editar ruta'}
                        </h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500">Nombre *</label>
                                <input value={formRuta.nombre}
                                       onChange={e => setFormRuta({...formRuta, nombre: e.target.value})}
                                       placeholder="Ej. Energía sin Límite"
                                       className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500"/>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500">Descripción</label>
                                <input value={formRuta.descripcion}
                                       onChange={e => setFormRuta({...formRuta, descripcion: e.target.value})}
                                       placeholder="Ej. Actividad física musicalizada"
                                       className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500"/>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleGuardarRuta} disabled={guardandoRuta || !formRuta.nombre.trim()}
                                    className="flex-1 bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                                {guardandoRuta ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button onClick={() => setModalRuta(null)}
                                    className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-xl font-semibold text-gray-800">Panel Principal</h2>
                <p className="text-sm text-gray-500 mt-0.5">Resumen general del sistema</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {cards.map((card, i) => (
                    <Link key={i} to={card.path}
                          className={`${card.color} border rounded-2xl p-5 hover:opacity-90 active:scale-95 transition-all cursor-pointer`}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
                            <span className="text-2xl">{card.icono}</span>
                        </div>
                        <p className={`text-4xl font-semibold ${card.texto}`}>{card.valor}</p>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-700">Rutas del programa</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {rol === 'ADMIN' ? 'Gestiona las rutas activas e inactivas' : 'Rutas disponibles'}
                            </p>
                        </div>
                        {rol === 'ADMIN' && (
                            <button onClick={abrirNueva}
                                    className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-xl hover:bg-green-800 transition-all font-semibold">
                                + Nueva
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        {rutas.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No hay rutas registradas</p>
                        ) : (
                            rutas.map((r, i) => (
                                <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all
                                    ${r.activa ? 'bg-green-50' : 'bg-gray-50 opacity-60'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0
                                        ${r.activa ? 'bg-green-700' : 'bg-gray-400'}`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{r.nombre}</p>
                                        <p className="text-xs text-gray-400 truncate">{r.descripcion || 'Sin descripción'}</p>
                                    </div>
                                    {rol === 'ADMIN' && (
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => abrirEditar(r)}
                                                    className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition-all">
                                                Editar
                                            </button>
                                            <button onClick={() => handleTogglePost(r)}
                                                    className={`text-xs font-semibold transition-all px-2 py-0.5 rounded-full ${
                                                        r.postHabilitado
                                                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}>
                                                {r.postHabilitado ? '📋 POST ON' : '📋 POST OFF'}
                                            </button>
                                            <button onClick={() => handleToggleActiva(r)}
                                                    className={`text-xs font-semibold transition-all
                                                        ${r.activa ? 'text-red-400 hover:text-red-600' : 'text-green-600 hover:text-green-800'}`}>
                                                {r.activa ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Accesos rápidos</p>
                    <p className="text-xs text-gray-400 mb-4">Navega a las secciones principales</p>
                    <div className="flex flex-col gap-2">
                        {[
                            {label: 'Ver participantes', path: '/admin/participantes', icono: '👥'},
                            ...(rol === 'ADMIN' || rol === 'ENCARGADO' ? [{label: 'Gestionar sesiones', path: '/admin/sesiones', icono: '📅'}] : []),
                            ...(rol === 'ADMIN' || rol === 'PSICOLOGO' ? [{label: 'Fichas de bienestar', path: '/admin/fichas', icono: '📝'}] : []),
                            {label: 'Análisis y alertas', path: '/admin/analisis', icono: '📊'},
                        ].map((item, i) => (
                            <Link key={i} to={item.path}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm text-gray-700">
                                <span>{item.icono}</span>
                                {item.label}
                                <span className="ml-auto text-gray-300">›</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}