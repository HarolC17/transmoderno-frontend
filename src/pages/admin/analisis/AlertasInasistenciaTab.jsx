import { useState, useEffect } from 'react'
import api from '../../../api/axios'

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

export default function AlertasInasistenciaTab() {
    const [inasistencias, setInasistencias] = useState([])
    const [resumen, setResumen] = useState({ ALTO: 0, MODERADO: 0, LEVE: 0 })
    const [total, setTotal] = useState(0)
    const [pagina, setPagina] = useState(0)
    const [cargando, setCargando] = useState(true)
    const [filtroNivel, setFiltroNivel] = useState('')
    const [filtroRutaId, setFiltroRutaId] = useState('')
    const [rutas, setRutas] = useState([])
    const [modalParticipante, setModalParticipante] = useState(null)
    const size = 10

    useEffect(() => {
        api.get('/rutas').then(res => setRutas(res.data.filter(r => r.activa)))
        cargarResumen()
        cargar(0)
    }, [])

    const cargarResumen = async () => {
        try {
            const res = await api.get('/alertas/inasistencia/resumen')
            setResumen(res.data)
        } catch {}
    }

    const cargar = async (page = 0, nivel = filtroNivel, rutaId = filtroRutaId) => {
        setCargando(true)
        try {
            const params = new URLSearchParams()
            params.append('page', page)
            params.append('size', size)
            if (nivel) params.append('nivel', nivel)
            if (rutaId) params.append('rutaId', rutaId)
            const res = await api.get(`/alertas/inasistencia?${params.toString()}`)
            setInasistencias(res.data.contenido)
            setTotal(res.data.totalElementos)
            setPagina(page)
        } catch {
            setInasistencias([])
        } finally {
            setCargando(false)
        }
    }

    const handleFiltroNivel = (nivel) => {
        setFiltroNivel(nivel)
        cargar(0, nivel, filtroRutaId)
    }

    const handleFiltroRuta = (rutaId) => {
        setFiltroRutaId(rutaId)
        cargar(0, filtroNivel, rutaId)
    }

    const totalPaginas = Math.ceil(total / size)

    return (
        <div className="flex flex-col gap-4">

            {/* Modal participante */}
            {modalParticipante && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                     onClick={() => setModalParticipante(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4"
                         onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-800">Información del participante</h3>
                            <button onClick={() => setModalParticipante(null)}
                                    className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700">
                                {modalParticipante.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{modalParticipante.nombreCompleto}</p>
                                <p className="text-xs text-gray-400">{modalParticipante.numeroIdentificacion}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <InfoFila label="Correo" valor={modalParticipante.correoInstitucional} />
                            <InfoFila label="Teléfono" valor={modalParticipante.telefono || 'No registrado'} />
                            <InfoFila label="Ruta" valor={modalParticipante.nombreRuta} />
                            <InfoFila label="Última asistencia" valor={
                                modalParticipante.ultimaAsistencia
                                    ? new Date(modalParticipante.ultimaAsistencia).toLocaleDateString('es-CO')
                                    : 'Nunca ha asistido'
                            } />
                            <InfoFila label="Sesiones sin asistir" valor={`${modalParticipante.sesionesSinAsistir}`} />
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                            <span className="text-xs font-semibold text-gray-500">Nivel de riesgo</span>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${colorNivel[modalParticipante.nivelRiesgo]}`}>
                                {iconoNivel[modalParticipante.nivelRiesgo]} {modalParticipante.nivelRiesgo}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tarjetas resumen */}
            <div className="grid grid-cols-3 gap-4">
                <div onClick={() => handleFiltroNivel(filtroNivel === 'ALTO' ? '' : 'ALTO')}
                     className={`border rounded-2xl p-4 cursor-pointer transition-all
                        ${filtroNivel === 'ALTO' ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-100 hover:bg-red-100'}`}>
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">🔴 Riesgo alto</p>
                    <p className="text-3xl font-semibold text-red-700 mt-1">{resumen.ALTO}</p>
                    <p className="text-xs text-red-400 mt-1">Clic para filtrar</p>
                </div>
                <div onClick={() => handleFiltroNivel(filtroNivel === 'MODERADO' ? '' : 'MODERADO')}
                     className={`border rounded-2xl p-4 cursor-pointer transition-all
                        ${filtroNivel === 'MODERADO' ? 'bg-yellow-100 border-yellow-300' : 'bg-yellow-50 border-yellow-100 hover:bg-yellow-100'}`}>
                    <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">🟠 Riesgo moderado</p>
                    <p className="text-3xl font-semibold text-yellow-700 mt-1">{resumen.MODERADO}</p>
                    <p className="text-xs text-yellow-400 mt-1">Clic para filtrar</p>
                </div>
                <div onClick={() => handleFiltroNivel(filtroNivel === 'LEVE' ? '' : 'LEVE')}
                     className={`border rounded-2xl p-4 cursor-pointer transition-all
                        ${filtroNivel === 'LEVE' ? 'bg-blue-100 border-blue-300' : 'bg-blue-50 border-blue-100 hover:bg-blue-100'}`}>
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">🟡 Riesgo leve</p>
                    <p className="text-3xl font-semibold text-blue-700 mt-1">{resumen.LEVE}</p>
                    <p className="text-xs text-blue-400 mt-1">Clic para filtrar</p>
                </div>
            </div>

            {/* Filtro por ruta */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500">Ruta</label>
                    <select value={filtroRutaId} onChange={e => handleFiltroRuta(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-green-500">
                        <option value="">Todas las rutas</option>
                        {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                </div>
                {(filtroNivel || filtroRutaId) && (
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">&nbsp;</label>
                        <button onClick={() => { setFiltroNivel(''); setFiltroRutaId(''); cargar(0, '', '') }}
                                className="px-3 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs hover:bg-gray-50 transition-all">
                            ✕ Limpiar filtros
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100">
                {cargando ? (
                    <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
                ) : inasistencias.length === 0 ? (
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
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sesiones sin asistir</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Riesgo</th>
                        </tr>
                        </thead>
                        <tbody>
                        {inasistencias.map((a, i) => (
                            <tr key={i}
                                onClick={() => setModalParticipante(a)}
                                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
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
                                <td className="px-4 py-3 text-sm text-gray-600">{a.sesionesSinAsistir}</td>
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

                {totalPaginas > 1 && (
                    <div className="p-4 flex items-center justify-between border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                            Página {pagina + 1} de {totalPaginas} — {total} alertas
                        </span>
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

function InfoFila({ label, valor }) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-gray-50">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs font-medium text-gray-700">{valor}</span>
        </div>
    )
}