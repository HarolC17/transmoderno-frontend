import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import VisorFicha from './VisorFicha'

export default function TabParticipantes() {
    const [busqueda, setBusqueda] = useState('')
    const [fichaVista, setFichaVista] = useState(null)
    const [error, setError] = useState('')
    const [buscando, setBuscando] = useState(false)
    const [resumen, setResumen] = useState([])
    const [cargandoResumen, setCargandoResumen] = useState(true)
    const [rutaFiltro, setRutaFiltro] = useState('todas')
    const [rutas, setRutas] = useState([])

    useEffect(() => {
        cargarResumen()
    }, [])

    const cargarResumen = async () => {
        setCargandoResumen(true)
        try {
            const resRutas = await api.get('/rutas')
            const rutasActivas = resRutas.data.filter(r => r.activa)
            setRutas(rutasActivas)

            const resIns = await api.get('/inscripciones?page=0&size=200')
            const activas = resIns.data.contenido.filter(i => i.estado === 'ACTIVA')

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

            setResumen(datos.sort((a, b) => {
                const prioridad = (d) => {
                    if (d.pre && d.post) return 0
                    if (d.pre && !d.post) return 1
                    return 2
                }
                return prioridad(a) - prioridad(b)
            }))
        } catch {}
        finally { setCargandoResumen(false) }
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
            setRutaFiltro('todas')
        } catch {
            setError('No se encontró ningún participante con ese número.')
        } finally { setBuscando(false) }
    }

    const resumenFiltrado = rutaFiltro === 'todas'
        ? resumen
        : resumen.filter(r => String(r.ins.rutaId) === String(rutaFiltro))

    if (fichaVista) return <VisorFicha ficha={fichaVista} onVolver={() => setFichaVista(null)} />

    return (
        <div className="flex flex-col gap-5">
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

            {/* Tabla resumen */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Estado de fichas por participante</p>
                        <p className="text-xs text-gray-400 mt-0.5">{resumenFiltrado.length} inscripciones activas</p>
                    </div>
                    <select value={rutaFiltro} onChange={e => setRutaFiltro(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500">
                        <option value="todas">Todas las rutas</option>
                        {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                </div>

                {cargandoResumen ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Cargando participantes...</div>
                ) : resumenFiltrado.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No hay inscripciones activas.</div>
                ) : (
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
                        {resumenFiltrado.map(({ ins, pre, post }) => (
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
                )}
            </div>
        </div>
    )
}