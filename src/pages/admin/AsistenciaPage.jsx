import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import api from '../../api/axios'

export default function AsistenciaPage() {
    const [sesiones, setSesiones] = useState([])
    const [rutas, setRutas] = useState([])
    const [rutaSeleccionada, setRutaSeleccionada] = useState('')
    const [sesionSeleccionada, setSesionSeleccionada] = useState('')
    const [asistencias, setAsistencias] = useState([])
    const [total, setTotal] = useState(0)
    const [pagina, setPagina] = useState(0)
    const [cargando, setCargando] = useState(false)
    const [exportando, setExportando] = useState(false)
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
            const res = await api.get(`/sesiones/ruta/${rutaId}?page=0&size=100`)
            setSesiones(res.data.contenido)
            setSesionSeleccionada('')
            setAsistencias([])
            setTotal(0)
        } catch {
            setSesiones([])
        }
    }

    const cargarAsistencias = async (sesionId, page = 0) => {
        setCargando(true)
        try {
            const res = await api.get(`/asistencia/sesion/${sesionId}?page=${page}&size=${size}`)
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
        cargarSesiones(rutaId)
    }

    const handleSesionChange = (sesionId) => {
        setSesionSeleccionada(sesionId)
        if (sesionId) cargarAsistencias(sesionId, 0)
        else setAsistencias([])
    }

    const handleExportar = async () => {
        if (!sesionSeleccionada) return
        setExportando(true)
        try {
            const res = await api.get(`/asistencia/sesion/${sesionSeleccionada}/exportar`)
            const sesion = sesiones.find(s => s.id === parseInt(sesionSeleccionada))
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
            const nombreArchivo = `asistencia_${sesion?.nombre || sesionSeleccionada}_${new Date().toISOString().split('T')[0]}.xlsx`
            XLSX.writeFile(libro, nombreArchivo)
        } catch {
            alert('Error al exportar. Intenta de nuevo.')
        } finally {
            setExportando(false)
        }
    }

    const totalPaginas = Math.ceil(total / size)

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

            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-semibold text-gray-500">Ruta</label>
                    <div className="flex gap-2">
                        {rutas.map(r => (
                            <button key={r.id} onClick={() => handleRutaChange(r.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                                    ${rutaSeleccionada === r.id ? 'bg-green-700 text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                {r.nombre}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-semibold text-gray-500">Sesión</label>
                    <select value={sesionSeleccionada} onChange={e => handleSesionChange(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 outline-none focus:border-green-500">
                        <option value="">Selecciona una sesión</option>
                        {sesiones.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre} — {s.fecha}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100">
                {!sesionSeleccionada ? (
                    <div className="p-8 text-center text-sm text-gray-400">Selecciona una sesión para ver las asistencias</div>
                ) : cargando ? (
                    <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
                ) : asistencias.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No hay asistencias registradas para esta sesión</div>
                ) : (
                    <>
                        <div className="px-4 py-3 border-b border-gray-100">
                            <span className="text-xs font-semibold text-gray-500">{total} asistencias registradas</span>
                        </div>
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Participante ID</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha y hora</th>
                            </tr>
                            </thead>
                            <tbody>
                            {asistencias.map(a => (
                                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700">
                                                #{a.participanteId}
                                            </div>
                                            <span className="text-sm text-gray-600">Participante {a.participanteId}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(a.fechaHoraRegistro).toLocaleString('es-CO')}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {totalPaginas > 1 && (
                            <div className="p-4 flex items-center justify-between border-t border-gray-100">
                                <span className="text-xs text-gray-400">Página {pagina + 1} de {totalPaginas}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => cargarAsistencias(sesionSeleccionada, pagina - 1)} disabled={pagina === 0}
                                            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                                        ← Anterior
                                    </button>
                                    <button onClick={() => cargarAsistencias(sesionSeleccionada, pagina + 1)} disabled={pagina >= totalPaginas - 1}
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
    )
}