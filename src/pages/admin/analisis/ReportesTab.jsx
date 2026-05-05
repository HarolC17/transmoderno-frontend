import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import * as XLSX from 'xlsx'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

const TEMAS = [
    { nombre: 'Verde',   color: '#15803d' },
    { nombre: 'Azul',    color: '#1d4ed8' },
    { nombre: 'Naranja', color: '#ea580c' },
    { nombre: 'Morado',  color: '#7e22ce' },
    { nombre: 'Rojo',    color: '#b91c1c' },
]

const COLORES = ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0']

export default function ReportesTab() {
    const [rutas, setRutas] = useState([])
    const [programas, setProgramas] = useState([])
    const [filtros, setFiltros] = useState({
        tipo: 'asistencia',
        agrupacion: 'ruta',
        rutaId: '',
        programaAcademico: '',
        semestre: '',
        estamento: '',
        fechaInicio: '',
        fechaFin: ''
    })
    const [datos, setDatos] = useState([])
    const [tipoGrafico, setTipoGrafico] = useState('barras')
    const [cargando, setCargando] = useState(false)
    const [exportandoDetalle, setExportandoDetalle] = useState(false)
    const [tema, setTema] = useState(0)

    useEffect(() => {
        api.get('/rutas').then(res => setRutas(res.data.filter(r => r.activa)))
        api.get('/participantes/programas').then(res => setProgramas(res.data))
    }, [])

    const handleFiltroChange = (key, value) => {
        setFiltros(prev => ({ ...prev, [key]: value }))
    }

    const construirParams = () => {
        const params = new URLSearchParams()
        if (filtros.rutaId) params.append('rutaId', filtros.rutaId)
        if (filtros.programaAcademico) params.append('programaAcademico', filtros.programaAcademico)
        if (filtros.semestre) params.append('semestre', filtros.semestre)
        if (filtros.estamento) params.append('estamento', filtros.estamento)
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
            } else {
                url = `/reportes/participantes/${filtros.agrupacion}`
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
            estamento: '',
            fechaInicio: '',
            fechaFin: ''
        })
        setDatos([])
        setTipoGrafico('barras')
    }

    const handleExportarExcel = () => {
        if (datos.length === 0) return
        const hoja = XLSX.utils.json_to_sheet(datosNormalizados.map(d => ({
            'Etiqueta': d.nombre,
            'Total': d.valor,
        })))
        const libro = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(libro, hoja, 'Reporte')
        XLSX.writeFile(libro, `reporte_${filtros.tipo}_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const handleExportarCSV = () => {
        if (datos.length === 0) return
        const encabezado = 'Etiqueta,Total'
        const filas = datosNormalizados.map(d => `"${d.nombre}",${d.valor}`)
        const csv = '\uFEFF' + [encabezado, ...filas].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte_${filtros.tipo}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleExportarDetalle = async () => {
        setExportandoDetalle(true)
        try {
            const params = construirParams()
            const res = await api.get(`/reportes/asistencia/detalle?${params}`)
            const datos = res.data
            const encabezado = 'Nombre,Identificación,Programa Académico,Semestre,Estamento,Ruta,Sesión,Fecha'
            const filas = datos.map(d =>
                `"${d.nombreCompleto}","${d.numeroIdentificacion}","${d.programaAcademico}",${d.semestre || ''},"${d.estamento}","${d.ruta}","${d.sesion}","${d.fecha}"`
            )
            const csv = '\uFEFF' + [encabezado, ...filas].join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `asistencia_detalle_${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            alert('Error al exportar. Intenta de nuevo.')
        } finally {
            setExportandoDetalle(false)
        }
    }

    const datosNormalizados = datos.map(d => ({
        nombre: d.etiqueta || d.pregunta || d.fecha || '',
        valor: d.total || 0,
    }))

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Configura tu reporte</p>
                    <button onClick={handleExportarDetalle} disabled={exportandoDetalle}
                            className="flex items-center gap-1.5 border border-purple-600 text-purple-600 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-purple-50 transition-all disabled:opacity-50">
                        {exportandoDetalle ? 'Exportando...' : '⬇ Exportar detalle individual'}
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Tipo de dato</label>
                        <select value={filtros.tipo} onChange={e => handleFiltroChange('tipo', e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                            <option value="asistencia">Asistencia</option>
                            <option value="participantes">Participantes</option>
                        </select>
                    </div>

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

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Tipo de gráfico</label>
                        <select value={tipoGrafico} onChange={e => setTipoGrafico(e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                            <option value="barras">Barras</option>
                            <option value="torta">Torta</option>
                            {filtros.tipo === 'asistencia' && filtros.agrupacion === 'tendencia' && (
                                <option value="linea">Línea</option>
                            )}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
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
                        <select value={filtros.programaAcademico}
                                onChange={e => handleFiltroChange('programaAcademico', e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                            <option value="">Todos</option>
                            {programas.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
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
                        <label className="text-xs font-semibold text-gray-500">Estamento</label>
                        <select value={filtros.estamento} onChange={e => handleFiltroChange('estamento', e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                            <option value="">Todos</option>
                            <option value="ESTUDIANTE">Estudiante</option>
                            <option value="DOCENTE">Docente</option>
                            <option value="ADMINISTRATIVO">Administrativo</option>
                            <option value="GRADUADO">Graduado</option>
                            <option value="COMUNIDAD">Comunidad</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">&nbsp;</label>
                        <div className="flex gap-2">
                            <button onClick={handleGenerar}
                                    className="flex-1 bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-800 transition-all">
                                Generar
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
                            <input type="date" value={filtros.fechaInicio}
                                   onChange={e => handleFiltroChange('fechaInicio', e.target.value)}
                                   className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Fecha fin</label>
                            <input type="date" value={filtros.fechaFin}
                                   onChange={e => handleFiltroChange('fechaFin', e.target.value)}
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
                    Configura los filtros y presiona <strong>Generar</strong>
                </div>
            )}

            {!cargando && datos.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">Resultado</p>
                        <div className="flex items-center gap-4">
                            {/* Selector de color */}
                            {tipoGrafico !== 'torta' && (
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-400">Color:</p>
                                    {TEMAS.map((t, i) => (
                                        <button key={i} onClick={() => setTema(i)}
                                                title={t.nombre}
                                                className={`w-5 h-5 rounded-full border-2 transition-all ${
                                                    tema === i ? 'border-gray-400 scale-110' : 'border-transparent'
                                                }`}
                                                style={{ backgroundColor: t.color }}
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button onClick={handleExportarExcel}
                                        className="flex items-center gap-1.5 border border-green-700 text-green-700 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-green-50 transition-all">
                                    ⬇ Excel
                                </button>
                                <button onClick={handleExportarCSV}
                                        className="flex items-center gap-1.5 border border-blue-600 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-blue-50 transition-all">
                                    ⬇ CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {tipoGrafico === 'barras' && (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={datosNormalizados} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="valor" fill={TEMAS[tema].color} radius={[4, 4, 0, 0]} name="Total" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {tipoGrafico === 'torta' && (
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie data={datosNormalizados} dataKey="valor" nameKey="nombre"
                                     cx="50%" cy="50%" outerRadius={130}
                                     label={({ nombre, percent }) => `${nombre} ${(percent * 100).toFixed(0)}%`}>
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
                                <Line type="monotone" dataKey="valor" stroke={TEMAS[tema].color} strokeWidth={2} dot={{ r: 4 }} name="Asistencias" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}
        </div>
    )
}