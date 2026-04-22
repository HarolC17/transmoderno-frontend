import { useState, useEffect } from 'react'
import api from '../../api/axios'

const NIVELES = ['TODOS', 'ALTO', 'MODERADO', 'LEVE']

const colorNivel = {
    ALTO: 'bg-red-100 text-red-800',
    MODERADO: 'bg-yellow-100 text-yellow-800',
    LEVE: 'bg-blue-100 text-blue-800'
}

const iconoNivel = {
    ALTO: '🔴',
    MODERADO: '🟠',
    LEVE: '🟡'
}

export default function AlertasPage() {
    const [solicitudes, setSolicitudes] = useState([])
    const [inasistencias, setInasistencias] = useState([])
    const [vista, setVista] = useState('ayuda')
    const [cargando, setCargando] = useState(true)
    const [filtroNivel, setFiltroNivel] = useState('TODOS')
    const [filtroRuta, setFiltroRuta] = useState('TODOS')

    useEffect(() => { cargarTodo() }, [])

    const cargarTodo = async () => {
        setCargando(true)
        try {
            const [resSolicitudes, resInasistencias] = await Promise.all([
                api.get('/alertas/ayuda?page=0&size=50'),
                api.get('/alertas/inasistencia')
            ])
            setSolicitudes(resSolicitudes.data.contenido)
            setInasistencias(resInasistencias.data)
        } catch {
            setSolicitudes([])
            setInasistencias([])
        } finally {
            setCargando(false)
        }
    }

    const handleAtender = async (id) => {
        try {
            await api.patch(`/alertas/ayuda/${id}/atender`)
            cargarTodo()
        } catch {
            alert('Error al atender la solicitud.')
        }
    }

    const pendientes = solicitudes.filter(s => !s.atendida)
    const atendidas = solicitudes.filter(s => s.atendida)

    const inasistenciasFiltradas = inasistencias.filter(a => {
        const nivelOk = filtroNivel === 'TODOS' || a.nivelRiesgo === filtroNivel
        const rutaOk = filtroRuta === 'TODOS' || a.nombreRuta === filtroRuta
        return nivelOk && rutaOk
    })

    const conteoAlto = inasistencias.filter(a => a.nivelRiesgo === 'ALTO').length
    const conteoModerado = inasistencias.filter(a => a.nivelRiesgo === 'MODERADO').length
    const conteoLeve = inasistencias.filter(a => a.nivelRiesgo === 'LEVE').length

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-800">Alertas</h2>
                <p className="text-sm text-gray-500 mt-0.5">Panel de seguimiento y atención</p>
            </div>

            {/* Tarjetas resumen */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Solicitudes pendientes</p>
                    <p className="text-3xl font-semibold text-red-700 mt-1">{pendientes.length}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">🔴 Riesgo alto</p>
                    <p className="text-3xl font-semibold text-red-700 mt-1">{conteoAlto}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">🟠 Riesgo moderado</p>
                    <p className="text-3xl font-semibold text-yellow-700 mt-1">{conteoModerado}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">🟡 Riesgo leve</p>
                    <p className="text-3xl font-semibold text-blue-700 mt-1">{conteoLeve}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button onClick={() => setVista('ayuda')}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                        ${vista === 'ayuda' ? 'bg-green-700 text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    Solicitudes de ayuda
                </button>
                <button onClick={() => setVista('inasistencia')}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                        ${vista === 'inasistencia' ? 'bg-green-700 text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    Inasistencias
                </button>
            </div>

            {cargando ? (
                <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
            ) : vista === 'ayuda' ? (
                <div className="bg-white rounded-2xl border border-gray-100">
                    {pendientes.length === 0 && atendidas.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400">No hay solicitudes de ayuda</div>
                    ) : (
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Participante ID</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha y hora</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
                            </tr>
                            </thead>
                            <tbody>
                            {solicitudes.map(s => (
                                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-800 font-semibold">#{s.participanteId}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(s.fechaHora).toLocaleString('es-CO')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                            ${s.atendida ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {s.atendida ? 'Atendida' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {!s.atendida && (
                                            <button onClick={() => handleAtender(s.id)}
                                                    className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-all">
                                                Atender
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <>
                    {/* Filtros inasistencia */}
                    <div className="flex gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Nivel de riesgo</label>
                            <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-green-500">
                                {NIVELES.map(n => <option key={n} value={n}>{n === 'TODOS' ? 'Todos los niveles' : n}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Ruta</label>
                            <select value={filtroRuta} onChange={e => setFiltroRuta(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-green-500">
                                <option value="TODOS">Todas las rutas</option>
                                <option value="Energía sin Límite">Energía sin Límite</option>
                                <option value="Alma Latina">Alma Latina</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100">
                        {inasistenciasFiltradas.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400">
                                No hay participantes con inasistencia en este filtro
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Participante</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ruta</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Última asistencia</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Días sin asistir</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Riesgo</th>
                                </tr>
                                </thead>
                                <tbody>
                                {inasistenciasFiltradas.map((a, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-gray-800">{a.nombreCompleto}</p>
                                            <p className="text-xs text-gray-400">{a.numeroIdentificacion}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                                ${a.nombreRuta === 'Energía sin Límite' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {a.nombreRuta}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {a.ultimaAsistencia
                                                ? new Date(a.ultimaAsistencia).toLocaleDateString('es-CO')
                                                : 'Nunca ha asistido'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {a.diasSinAsistir === -1 ? '—' : `${a.diasSinAsistir} días`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorNivel[a.nivelRiesgo]}`}>
                                                {iconoNivel[a.nivelRiesgo]} {a.nivelRiesgo}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}