import { useState, useEffect } from 'react'
import api from '../../api/axios'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

const COLORES = ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0']

export default function ReportesPage() {
    const [rutas, setRutas] = useState([])
    const [filtros, setFiltros] = useState({
        tipo: 'asistencia',
        agrupacion: 'ruta',
        rutaId: '',
        programaAcademico: '',
        semestre: '',
        fechaInicio: '',
        fechaFin: ''
    })
    const [datos, setDatos] = useState([])
    const [tipoGrafico, setTipoGrafico] = useState('barras')
    const [cargando, setCargando] = useState(false)
    const [retencion, setRetencion] = useState([])
    const [cargandoRetencion, setCargandoRetencion] = useState(true)

    useEffect(() => {
        api.get('/rutas').then(res => setRutas(res.data.filter(r => r.activa)))
        cargarRetencion()
    }, [])

    const cargarRetencion = async () => {
        setCargandoRetencion(true)
        try {
            const res = await api.get('/reportes/retencion')
            setRetencion(res.data)
        } catch {
            setRetencion([])
        } finally {
            setCargandoRetencion(false)
        }
    }

    const handleFiltroChange = (key, value) => {
        setFiltros(prev => ({ ...prev, [key]: value }))
    }

    const construirParams = () => {
        const params = new URLSearchParams()
        if (filtros.rutaId) params.append('rutaId', filtros.rutaId)
        if (filtros.programaAcademico) params.append('programaAcademico', filtros.programaAcademico)
        if (filtros.semestre) params.append('semestre', filtros.semestre)
        if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio)
        if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin)
        return params.toString()
    }

    const handleGenerar = async () => {
        setCargando(true)
        setDatos([])
        try {
            let url = ''
            if (filtros.tipo === 'asistencia') {
                url = `/reportes/asistencia/${filtros.agrupacion}`
            } else if (filtros.tipo === 'participantes') {
                url = `/reportes/participantes/${filtros.agrupacion}`
            } else {
                url = '/reportes/fichas/comparativa'
            }
            const params = construirParams()
            const res = await api.get(`${url}?${params}`)
            setDatos(res.data)
        } catch {
            setDatos([])
        } finally {
            setCargando(false)
        }
    }

    const handleLimpiar = () => {
        setFiltros({
            tipo: 'asistencia',
            agrupacion: 'ruta',
            rutaId: '',
            programaAcademico: '',
            semestre: '',
            fechaInicio: '',
            fechaFin: ''
        })
        setDatos([])
        setTipoGrafico('barras')
    }

    const datosNormalizados = datos.map(d => ({
        nombre: d.etiqueta || d.pregunta || d.fecha || '',
        valor: d.total || 0,
        pre: d.promedioPre || 0,
        post: d.promedioPost || 0
    }))

    const datosRetencion = retencion.map(r => ({
        nombre: r.ruta,
        activos: r.activos,
        inactivos: r.inactivos,
        tasa: Math.round(r.tasaRetencion)
    }))

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-800">Reportes</h2>
                <p className="text-sm text-gray-500 mt-0.5">Genera visualizaciones con los filtros que necesites</p>
            </div>

            {/* Tasa de retención — siempre visible */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Tasa de retención por ruta</p>
                        <p className="text-xs text-gray-400 mt-0.5">Participantes activos vs total inscritos</p>
                    </div>
                </div>
                {cargandoRetencion ? (
                    <div className="text-center text-sm text-gray-400 py-4">Cargando...</div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {retencion.map((r, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">{r.ruta}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-400">{r.activos} activos / {r.totalInscritos} inscritos</span>
                                        <span className={`text-lg font-bold ${r.tasaRetencion >= 75 ? 'text-green-600' : r.tasaRetencion >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {Math.round(r.tasaRetencion)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all ${r.tasaRetencion >= 75 ? 'bg-green-500' : r.tasaRetencion >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
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
                                </div>
                            </div>
                        ))}
                        <div className="mt-4">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={datosRetencion} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                    </div>
                )}
            </div>

            {/* Reportes configurables */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                <p className="text-sm font-semibold text-gray-700">Configura tu reporte</p>

                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Tipo de dato</label>
                        <select value={filtros.tipo} onChange={e => handleFiltroChange('tipo', e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                            <option value="asistencia">Asistencia</option>
                            <option value="participantes">Participantes</option>
                            <option value="fichas">Fichas PRE/POST</option>
                        </select>
                    </div>

                    {filtros.tipo !== 'fichas' && (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Agrupar por</label>
                            <select value={filtros.agrupacion} onChange={e => handleFiltroChange('agrupacion', e.target.value)}
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                <option value="ruta">Ruta</option>
                                <option value="programa">Programa académico</option>
                                <option value="semestre">Semestre</option>
                                {filtros.tipo === 'asistencia' && <option value="tendencia">Tendencia semanal</option>}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Tipo de gráfico</label>
                        <select value={tipoGrafico} onChange={e => setTipoGrafico(e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                            <option value="barras">Barras</option>
                            <option value="torta">Torta</option>
                            {filtros.tipo === 'asistencia' && filtros.agrupacion === 'tendencia' && (
                                <option value="linea">Línea</option>
                            )}
                            {filtros.tipo === 'fichas' && <option value="comparativa">Comparativa</option>}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Ruta</label>
                        <select value={filtros.rutaId} onChange={e => handleFiltroChange('rutaId', e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                            <option value="">Todas</option>
                            {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Programa académico</label>
                        <input value={filtros.programaAcademico} onChange={e => handleFiltroChange('programaAcademico', e.target.value)}
                               placeholder="Ej. Ingeniería de Sistemas"
                               className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Semestre</label>
                        <select value={filtros.semestre} onChange={e => handleFiltroChange('semestre', e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                            <option value="">Todos</option>
                            {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>{s}°</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">&nbsp;</label>
                        <div className="flex gap-2">
                            <button onClick={handleGenerar}
                                    className="flex-1 bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-800 transition-all">
                                Generar reporte
                            </button>
                            <button onClick={handleLimpiar}
                                    className="px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-all">
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                {filtros.tipo === 'asistencia' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Fecha inicio</label>
                            <input type="date" value={filtros.fechaInicio} onChange={e => handleFiltroChange('fechaInicio', e.target.value)}
                                   className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Fecha fin</label>
                            <input type="date" value={filtros.fechaFin} onChange={e => handleFiltroChange('fechaFin', e.target.value)}
                                   className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500" />
                        </div>
                    </div>
                )}
            </div>

            {cargando && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
                    Generando reporte...
                </div>
            )}

            {!cargando && datos.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
                    Configura los filtros y presiona <strong>Generar reporte</strong>
                </div>
            )}

            {!cargando && datos.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-sm font-semibold text-gray-700 mb-6">Resultado</p>

                    {tipoGrafico === 'barras' && (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={datosNormalizados} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="valor" fill="#15803d" radius={[4, 4, 0, 0]} name="Total" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {tipoGrafico === 'torta' && (
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie data={datosNormalizados} dataKey="valor" nameKey="nombre"
                                     cx="50%" cy="50%" outerRadius={130} label={({ nombre, percent }) =>
                                    `${nombre} ${(percent * 100).toFixed(0)}%`}>
                                    {datosNormalizados.map((_, i) => (
                                        <Cell key={i} fill={COLORES[i % COLORES.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}

                    {tipoGrafico === 'linea' && (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={datosNormalizados} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="valor" stroke="#15803d" strokeWidth={2} dot={{ r: 4 }} name="Asistencias" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}

                    {tipoGrafico === 'comparativa' && (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={datosNormalizados} margin={{ top: 5, right: 20, left: 0, bottom: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="pre" fill="#22c55e" radius={[4, 4, 0, 0]} name="PRE" />
                                <Bar dataKey="post" fill="#15803d" radius={[4, 4, 0, 0]} name="POST" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}
        </div>
    )
}