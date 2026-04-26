import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import api from '../../api/axios'

export default function AsistenciaPage() {
    const [sesiones, setSesiones] = useState([])
    const [rutas, setRutas] = useState([])
    const [rutaSeleccionada, setRutaSeleccionada] = useState('')
    const [sesionSeleccionada, setSesionSeleccionada] = useState(null)
    const [asistencias, setAsistencias] = useState([])
    const [total, setTotal] = useState(0)
    const [pagina, setPagina] = useState(0)
    const [cargando, setCargando] = useState(false)
    const [exportando, setExportando] = useState(false)
    const [filtroMes, setFiltroMes] = useState('')
    const size = 10

    useEffect(() => {
        api.get('/rutas').then(res => {
            const activas = res.data.filter(r => r.activa)
            setRutas(activas)
            if (activas.length > 0) {
                setRutaSeleccionada(activas[0].id)
                cargarSesiones(activas[0].id)
            }
        })
    }, [])

    const cargarSesiones = async (rutaId) => {
        try {
            const res = await api.get(`/sesiones/ruta/${rutaId}?page=0&size=200`)
            setSesiones(res.data.contenido)
            setSesionSeleccionada(null)
            setAsistencias([])
            setTotal(0)
            setFiltroMes('')
        } catch {
            setSesiones([])
        }
    }

    const cargarAsistencias = async (sesion, page = 0) => {
        setCargando(true)
        try {
            const res = await api.get(`/asistencia/sesion/${sesion.id}?page=${page}&size=${size}`)
            setAsistencias(res.data.contenido)
            setTotal(res.data.totalElementos)
            setPagina(page)
        } catch {
            setAsistencias([])
        } finally {
            setCargando(false)
        }
    }

    const handleRutaChange = (rutaId) => {
        setRutaSeleccionada(rutaId)
        setFiltroMes('')
        cargarSesiones(rutaId)
    }

    const handleSesionClick = (sesion) => {
        setSesionSeleccionada(sesion)
        cargarAsistencias(sesion, 0)
    }

    const handleExportar = async () => {
        if (!sesionSeleccionada) return
        setExportando(true)
        try {
            const res = await api.get(`/asistencia/sesion/${sesionSeleccionada.id}/exportar`)
            const datos = res.data.map(a => ({
                'Número de identificación': a.numeroIdentificacion,
                'Nombre completo': a.nombreCompleto,
                'Programa académico': a.programaAcademico,
                'Semestre': a.semestre,
                'Sesión': a.sesionNombre,
                'Fecha sesión': a.sesionFecha,
                'Fecha y hora registro': new Date(a.fechaHoraRegistro).toLocaleString('es-CO')
            }))
            const hoja = XLSX.utils.json_to_sheet(datos)
            const libro = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(libro, hoja, 'Asistencia')
            XLSX.writeFile(libro, `asistencia_${sesionSeleccionada.nombre}_${sesionSeleccionada.fecha}.xlsx`)
        } catch {
            alert('Error al exportar. Intenta de nuevo.')
        } finally {
            setExportando(false)
        }
    }

    const mesesDisponibles = [...new Set(sesiones.map(s => s.fecha.substring(0, 7)))]
        .sort((a, b) => b.localeCompare(a))

    const sesionesFiltradasPorMes = filtroMes
        ? sesiones.filter(s => s.fecha.startsWith(filtroMes))
        : sesiones

    const totalPaginas = Math.ceil(total / size)

    const formatFecha = (fecha) => {
        if (!fecha) return ''
        const [year, month, day] = fecha.split('-')
        const meses = ['Ene','Feb','Mar','Abr','May','Jun',
            'Jul','Ago','Sep','Oct','Nov','Dic']
        return `${parseInt(day)} ${meses[parseInt(month) - 1]} ${year}`
    }

    const formatHora = (hora) => hora?.substring(0, 5) || ''

    const nombreMes = (m) => {
        const [year, month] = m.split('-')
        const meses = ['Ene','Feb','Mar','Abr','May','Jun',
            'Jul','Ago','Sep','Oct','Nov','Dic']
        return `${meses[parseInt(month) - 1]} ${year}`
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Asistencia</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Consulta los registros por sesión</p>
                </div>
                {sesionSeleccionada && (
                    <button onClick={handleExportar} disabled={exportando}
                            className="flex items-center gap-2 border border-green-700 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-50 transition-all disabled:opacity-50">
                        {exportando ? 'Exportando...' : '⬇ Exportar Excel'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-4">

                {/* Columna izquierda */}
                <div className="flex flex-col gap-3">

                    {/* Selector de ruta */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2">
                        <p className="text-xs font-semibold text-gray-500">Ruta</p>
                        <div className="flex flex-wrap gap-2">
                            {rutas.map(r => (
                                <button key={r.id} onClick={() => handleRutaChange(r.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                                        ${rutaSeleccionada === r.id
                                            ? 'bg-green-700 text-white'
                                            : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    {r.nombre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lista de sesiones con filtro por mes */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-gray-500">
                                {sesionesFiltradasPorMes.length} sesiones
                            </p>
                            {mesesDisponibles.length > 1 && (
                                <select value={filtroMes}
                                        onChange={e => { setFiltroMes(e.target.value); setSesionSeleccionada(null); setAsistencias([]) }}
                                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white outline-none focus:border-green-500">
                                    <option value="">Todos los meses</option>
                                    {mesesDisponibles.map(m => (
                                        <option key={m} value={m}>{nombreMes(m)}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {sesiones.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No hay sesiones para esta ruta</p>
                        ) : sesionesFiltradasPorMes.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No hay sesiones en este mes</p>
                        ) : (
                            <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto pr-1">
                                {sesionesFiltradasPorMes.map(s => (
                                    <button key={s.id} onClick={() => handleSesionClick(s)}
                                            className={`w-full text-left p-3 rounded-xl transition-all border
                                            ${sesionSeleccionada?.id === s.id
                                                ? 'bg-green-700 border-green-700'
                                                : 'bg-gray-50 border-gray-100 hover:border-green-300 hover:bg-green-50'}`}>
                                        <p className={`text-sm font-semibold
                                            ${sesionSeleccionada?.id === s.id ? 'text-white' : 'text-gray-800'}`}>
                                            {s.nombre}
                                        </p>
                                        <p className={`text-xs mt-0.5
                                            ${sesionSeleccionada?.id === s.id ? 'text-green-200' : 'text-gray-400'}`}>
                                            {formatFecha(s.fecha)}
                                        </p>
                                        <p className={`text-xs
                                            ${sesionSeleccionada?.id === s.id ? 'text-green-200' : 'text-gray-400'}`}>
                                            {formatHora(s.horaInicio)} - {formatHora(s.horaFin)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna derecha — tabla de asistencia */}
                <div className="col-span-2 bg-white rounded-2xl border border-gray-100">
                    {!sesionSeleccionada ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 gap-3">
                            <span className="text-4xl">📋</span>
                            <p className="text-sm text-gray-400 text-center">
                                Selecciona una sesión para ver las asistencias
                            </p>
                        </div>
                    ) : cargando ? (
                        <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
                    ) : (
                        <>
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {sesionSeleccionada.nombre} — {formatFecha(sesionSeleccionada.fecha)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {formatHora(sesionSeleccionada.horaInicio)} - {formatHora(sesionSeleccionada.horaFin)} · {total} asistencias
                                    </p>
                                </div>
                            </div>

                            {asistencias.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-400">
                                    No hay asistencias registradas para esta sesión
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Participante</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Identificación</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hora registro</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {asistencias.map(a => (
                                        <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700 flex-shrink-0">
                                                        {a.nombreCompleto
                                                            ? a.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')
                                                            : '#'}
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-800">
                                                        {a.nombreCompleto || `Participante ${a.participanteId}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {a.numeroIdentificacion || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {new Date(a.fechaHoraRegistro).toLocaleTimeString('es-CO', {
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}

                            {totalPaginas > 1 && (
                                <div className="p-4 flex items-center justify-between border-t border-gray-100">
                                    <span className="text-xs text-gray-400">Página {pagina + 1} de {totalPaginas}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => cargarAsistencias(sesionSeleccionada, pagina - 1)}
                                                disabled={pagina === 0}
                                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                                            ← Anterior
                                        </button>
                                        <button onClick={() => cargarAsistencias(sesionSeleccionada, pagina + 1)}
                                                disabled={pagina >= totalPaginas - 1}
                                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                                            Siguiente →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}