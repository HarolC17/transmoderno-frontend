import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORES_MOTIVOS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#6b7280']

export default function RetencionTab() {
    const [retencion, setRetencion] = useState([])
    const [motivos, setMotivos] = useState([])
    const [rutas, setRutas] = useState([])
    const [filtroRutaMotivos, setFiltroRutaMotivos] = useState('')
    const [cargando, setCargando] = useState(true)
    const [cargandoMotivos, setCargandoMotivos] = useState(false)

    useEffect(() => {
        cargar()
        api.get('/rutas').then(res => setRutas(res.data.filter(r => r.activa)))
        cargarMotivos()
    }, [])

    const cargar = async () => {
        setCargando(true)
        try {
            const res = await api.get('/reportes/retencion')
            setRetencion(res.data)
        } catch {
            setRetencion([])
        } finally {
            setCargando(false)
        }
    }

    const cargarMotivos = async (rutaId = '') => {
        setCargandoMotivos(true)
        try {
            const params = rutaId ? `?rutaId=${rutaId}` : ''
            const res = await api.get(`/reportes/inscripciones/motivos${params}`)
            setMotivos(res.data)
        } catch {
            setMotivos([])
        } finally {
            setCargandoMotivos(false)
        }
    }

    const handleFiltroRuta = (rutaId) => {
        setFiltroRutaMotivos(rutaId)
        cargarMotivos(rutaId)
    }

    const datosGrafico = retencion.map(r => ({
        nombre: r.ruta,
        activos: r.activos,
        inactivos: r.inactivos,
        tasa: Math.round(r.tasaRetencion)
    }))

    const datosMotivos = motivos.map(m => ({
        nombre: m.etiqueta,
        total: m.total
    }))

    const totalCancelaciones = motivos.reduce((acc, m) => acc + m.total, 0)

    if (cargando) return <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>

    return (
        <div className="flex flex-col gap-4">

            {/* Tarjetas de retención */}
            <div className="grid grid-cols-2 gap-4">
                {retencion.map((r, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-700">{r.ruta}</p>
                            <span className={`text-2xl font-bold
                                ${r.tasaRetencion >= 75 ? 'text-green-600'
                                : r.tasaRetencion >= 50 ? 'text-yellow-600'
                                    : 'text-red-600'}`}>
                                {Math.round(r.tasaRetencion)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                            <div className={`h-3 rounded-full transition-all
                                ${r.tasaRetencion >= 75 ? 'bg-green-500'
                                : r.tasaRetencion >= 50 ? 'bg-yellow-500'
                                    : 'bg-red-500'}`}
                                 style={{ width: `${r.tasaRetencion}%` }}
                            />
                        </div>
                        <div className="flex gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                                Activos: {r.activos}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                                Inactivos: {r.inactivos}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>
                                Total: {r.totalInscritos}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Comparativa por ruta */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-sm font-semibold text-gray-700 mb-4">Comparativa por ruta</p>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={datosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value, name) => [value, name === 'activos' ? 'Activos' : 'Inactivos']} />
                        <Legend formatter={value => value === 'activos' ? 'Activos' : 'Inactivos'} />
                        <Bar dataKey="activos" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="inactivos" stackId="a" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Motivos de cancelación */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Motivos de cancelación</p>
                        <p className="text-xs text-gray-400 mt-0.5">{totalCancelaciones} cancelaciones en total</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <select value={filtroRutaMotivos} onChange={e => handleFiltroRuta(e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-green-500">
                            <option value="">Todas las rutas</option>
                            {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                    </div>
                </div>

                {cargandoMotivos ? (
                    <div className="text-center text-sm text-gray-400 py-4">Cargando...</div>
                ) : motivos.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 py-8">
                        No hay cancelaciones registradas aún
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Gráfica de torta */}
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={datosMotivos} dataKey="total" nameKey="nombre"
                                     cx="50%" cy="50%" outerRadius={90}
                                     label={false}>
                                    {datosMotivos.map((_, i) => (
                                        <Cell key={i} fill={COLORES_MOTIVOS[i % COLORES_MOTIVOS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Lista de motivos */}
                        <div className="flex flex-col gap-2 justify-center">
                            {motivos.map((m, i) => (
                                <div key={i} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full flex-shrink-0"
                                              style={{ backgroundColor: COLORES_MOTIVOS[i % COLORES_MOTIVOS.length] }}>
                                        </span>
                                        <span className="text-xs text-gray-700">{m.etiqueta}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-800">{m.total}</span>
                                        <span className="text-xs text-gray-400">
                                            ({Math.round((m.total / totalCancelaciones) * 100)}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}