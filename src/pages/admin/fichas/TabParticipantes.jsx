import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import VisorFicha from './VisorFicha'

const PAGE_SIZE = 20

export default function TabParticipantes() {
    const [busqueda, setBusqueda] = useState('')
    const [fichaVista, setFichaVista] = useState(null)
    const [error, setError] = useState('')
    const [buscando, setBuscando] = useState(false)
    const [resumen, setResumen] = useState([])
    const [cargando, setCargando] = useState(false)
    const [rutaFiltro, setRutaFiltro] = useState('')
    const [rutas, setRutas] = useState([])
    const [cargado, setCargado] = useState(false)
    const [pagina, setPagina] = useState(0)

    useEffect(() => {
        api.get('/rutas').then(r => {
            const activas = r.data.filter(x => x.activa)
            setRutas(activas)
            if (activas.length > 0) setRutaFiltro(String(activas[0].id))
        })
    }, [])

    const cargarResumen = async () => {
        if (!rutaFiltro) return
        setCargando(true)
        setCargado(false)
        setResumen([])
        setPagina(0)
        try {
            const resIns = await api.get(`/inscripciones?page=0&size=700&rutaId=${rutaFiltro}`)
            const activas = resIns.data.contenido.filter(i => i.estado === 'ACTIVA')

            const datos = []
            const loteSize = 10
            for (let i = 0; i < activas.length; i += loteSize) {
                const lote = activas.slice(i, i + loteSize)
                const resultados = await Promise.all(lote.map(async (ins) => {
                    let pre = null, post = null
                    try {
                        const resPre = await api.get(`/fichas/pre/inscripcion/${ins.id}`)
                        pre = resPre.data
                        try {
                            const resPost = await api.get(`/fichas/post/inscripcion/${resPre.data.id}`)
                            post = resPost.data
                        } catch {}
                    } catch {}
                    return { ins, pre, post }
                }))
                datos.push(...resultados)
            }

            setResumen(datos.sort((a, b) => {
                const p = d => d.pre && d.post ? 0 : d.pre ? 1 : 2
                return p(a) - p(b)
            }))
            setCargado(true)
        } catch {}
        finally { setCargando(false) }
    }

    const buscar = async () => {
        if (!busqueda.trim()) return
        setBuscando(true)
        setError('')
        try {
            await api.get(`/participantes/identificacion/${busqueda.trim()}`)
            const resIns = await api.get(`/inscripciones/participante/${busqueda.trim()}`)
            const activas = resIns.data.filter(i => i.estado === 'ACTIVA')

            const datos = await Promise.all(activas.map(async (ins) => {
                let pre = null, post = null
                try {
                    const resPre = await api.get(`/fichas/pre/inscripcion/${ins.id}`)
                    pre = resPre.data
                    try {
                        const resPost = await api.get(`/fichas/post/inscripcion/${resPre.data.id}`)
                        post = resPost.data
                    } catch {}
                } catch {}
                return { ins, pre, post }
            }))

            setResumen(prev => {
                const ids = new Set(datos.map(d => d.ins.id))
                const sinBuscado = prev.filter(d => !ids.has(d.ins.id))
                return [...datos, ...sinBuscado]
            })
            setPagina(0)
        } catch {
            setError('No se encontró ningún participante con ese número.')
        } finally { setBuscando(false) }
    }

    const paginaActual = resumen.slice(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE)
    const totalPaginas = Math.ceil(resumen.length / PAGE_SIZE)

    if (fichaVista) return <VisorFicha ficha={fichaVista} onVolver={() => setFichaVista(null)} />

    return (
        <div className="flex flex-col gap-5">

            {/* Filtro y carga */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-end gap-4">
                <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-semibold text-gray-500">Ruta</label>
                    <select value={rutaFiltro} onChange={e => { setRutaFiltro(e.target.value); setCargado(false); setResumen([]); setPagina(0) }}
                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                        {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                </div>
                <button onClick={cargarResumen} disabled={cargando}
                        className="bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                    {cargando ? 'Cargando...' : 'Cargar fichas'}
                </button>
            </div>

            {/* Buscador */}
            <div className="flex gap-2">
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && buscar()}
                       placeholder="Buscar por número de identificación..."
                       className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500"/>
                <button onClick={buscar} disabled={buscando}
                        className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                    {buscando ? 'Buscando...' : 'Buscar'}
                </button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

            {/* Estados */}
            {!cargado && !cargando && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
                    Selecciona una ruta y presiona <strong>Cargar fichas</strong>
                </div>
            )}

            {cargando && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
                    Cargando fichas... esto puede tomar unos segundos.
                </div>
            )}

            {cargado && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Estado de fichas por participante</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {resumen.length} inscripciones · {rutas.find(r => String(r.id) === String(rutaFiltro))?.nombre}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                {resumen.filter(d => d.pre && d.post).length} ambas
                            </span>
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                                {resumen.filter(d => d.pre && !d.post).length} solo PRE
                            </span>
                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                                {resumen.filter(d => !d.pre).length} sin ficha
                            </span>
                        </div>
                    </div>

                    {resumen.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No hay inscripciones activas.</div>
                    ) : (
                        <>
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Participante</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Ruta</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">PRE</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">POST</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Ver</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginaActual.map(({ ins, pre, post }) => (
                                    <tr key={ins.id} className="border-b border-gray-50 hover:bg-gray-50 transition-all">
                                        <td className="px-5 py-3">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {ins.nombreParticipante || `Participante ${ins.participanteId}`}
                                            </p>
                                            <p className="text-xs text-gray-400">{ins.numeroIdentificacion || ''}</p>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-gray-500">
                                            {ins.nombreRuta || `Ruta ${ins.rutaId}`}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {pre
                                                ? <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">✓ Completada</span>
                                                : <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Pendiente</span>
                                            }
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {post
                                                ? <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">✓ Completada</span>
                                                : pre
                                                    ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Disponible</span>
                                                    : <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Bloqueada</span>
                                            }
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex gap-2">
                                                {pre && (
                                                    <button onClick={() => setFichaVista({ tipo: 'PRE', data: pre })}
                                                            className="text-xs text-green-600 hover:text-green-800 font-semibold transition-all">
                                                        PRE
                                                    </button>
                                                )}
                                                {post && (
                                                    <button onClick={() => setFichaVista({ tipo: 'POST', data: post })}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-all">
                                                        POST
                                                    </button>
                                                )}
                                                {!pre && !post && <span className="text-xs text-gray-300">—</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {/* Paginación */}
                            {totalPaginas > 1 && (
                                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                        Página {pagina + 1} de {totalPaginas} · {resumen.length} participantes
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 0}
                                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-all">
                                            ← Anterior
                                        </button>
                                        <button onClick={() => setPagina(p => p + 1)} disabled={pagina >= totalPaginas - 1}
                                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-all">
                                            Siguiente →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}