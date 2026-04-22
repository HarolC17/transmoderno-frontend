import { useState, useEffect } from 'react'
import api from '../../api/axios'

const ESTADOS = ['TODOS', 'ACTIVA', 'INACTIVA', 'FINALIZADA']

const colorEstado = {
    ACTIVA: 'bg-green-100 text-green-800',
    INACTIVA: 'bg-yellow-100 text-yellow-800',
    FINALIZADA: 'bg-gray-100 text-gray-600'
}

export default function InscripcionesPage() {
    const [inscripciones, setInscripciones] = useState([])
    const [total, setTotal] = useState(0)
    const [pagina, setPagina] = useState(0)
    const [cargando, setCargando] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('TODOS')
    const [filtroRuta, setFiltroRuta] = useState('TODOS')
    const [cerrando, setCerrando] = useState(false)
    const size = 10

    const cargar = async (page = 0) => {
        setCargando(true)
        try {
            const res = await api.get(`/inscripciones?page=${page}&size=${size}`)
            setInscripciones(res.data.contenido)
            setTotal(res.data.totalElementos)
            setPagina(page)
        } catch {
            setInscripciones([])
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const handleCancelar = async (inscripcion) => {
        if (!confirm(`¿Cancelar la inscripción de ${inscripcion.nombreParticipante} en ${inscripcion.nombreRuta}?`)) return
        try {
            await api.patch(`/inscripciones/${inscripcion.id}/cancelar`)
            cargar(pagina)
        } catch {
            alert('Error al cancelar. Intenta de nuevo.')
        }
    }

    const handleReactivar = async (inscripcion) => {
        if (!confirm(`¿Reactivar la inscripción de ${inscripcion.nombreParticipante} en ${inscripcion.nombreRuta}?`)) return
        try {
            await api.post('/inscripciones', {
                numeroIdentificacion: inscripcion.numeroIdentificacion,
                rutaId: inscripcion.rutaId
            })
            cargar(pagina)
        } catch {
            alert('Error al reactivar. Intenta de nuevo.')
        }
    }

    const handleCerrarSemestre = async () => {
        const activas = inscripciones.filter(i => i.estado === 'ACTIVA').length
        if (!confirm(`¿Cerrar el semestre? Esta acción finalizará todas las inscripciones activas y no se puede deshacer.`)) return
        setCerrando(true)
        try {
            const res = await api.post('/inscripciones/cerrar-semestre')
            alert(`Semestre cerrado. ${res.data.inscripcionesFinalizadas} inscripciones finalizadas.`)
            cargar(0)
        } catch {
            alert('Error al cerrar el semestre. Intenta de nuevo.')
        } finally {
            setCerrando(false)
        }
    }

    const inscripcionesFiltradas = inscripciones.filter(i => {
        const estadoOk = filtroEstado === 'TODOS' || i.estado === filtroEstado
        const rutaOk = filtroRuta === 'TODOS' || i.nombreRuta === filtroRuta
        return estadoOk && rutaOk
    })

    const totalPaginas = Math.ceil(total / size)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Inscripciones</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{total} inscripciones en total</p>
                </div>
                <button onClick={handleCerrarSemestre} disabled={cerrando}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50">
                    {cerrando ? 'Cerrando...' : '🔒 Cerrar semestre'}
                </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500">Estado</label>
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-green-500">
                        {ESTADOS.map(e => <option key={e} value={e}>{e === 'TODOS' ? 'Todos los estados' : e}</option>)}
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
                {cargando ? (
                    <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
                ) : inscripcionesFiltradas.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No se encontraron inscripciones</div>
                ) : (
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Participante</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Identificación</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ruta</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {inscripcionesFiltradas.map(i => (
                            <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700">
                                            {i.nombreParticipante.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800">{i.nombreParticipante}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{i.numeroIdentificacion}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                        ${i.nombreRuta === 'Energía sin Límite' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                        {i.nombreRuta}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(i.fechaInscripcion).toLocaleDateString('es-CO')}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorEstado[i.estado]}`}>
                                        {i.estado}
                                    </span>
                                </td>
                                <td className="px-4 py-3 flex items-center gap-3">
                                    {i.estado === 'ACTIVA' && (
                                        <button onClick={() => handleCancelar(i)}
                                                className="text-xs text-red-500 hover:text-red-700 font-semibold transition-all">
                                            Cancelar
                                        </button>
                                    )}
                                    {i.estado === 'INACTIVA' && (
                                        <button onClick={() => handleReactivar(i)}
                                                className="text-xs text-green-600 hover:text-green-800 font-semibold transition-all">
                                            Reactivar
                                        </button>
                                    )}
                                    {i.estado === 'FINALIZADA' && (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
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
                            <button onClick={() => cargar(pagina - 1)} disabled={pagina === 0}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-all">
                                ← Anterior
                            </button>
                            <button onClick={() => cargar(pagina + 1)} disabled={pagina >= totalPaginas - 1}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-all">
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}