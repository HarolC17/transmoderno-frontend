import { useState, useEffect } from 'react'
import api from '../../../api/axios'

function tipoBadge(tipo) {
    switch (tipo) {
        case 'SELECCION':  return 'bg-blue-100 text-blue-700'
        case 'ESCALA_1_5': return 'bg-purple-100 text-purple-700'
        case 'ESCALA_0_4': return 'bg-indigo-100 text-indigo-700'
        case 'NUMERO':     return 'bg-orange-100 text-orange-700'
        case 'TEXTO':      return 'bg-gray-100 text-gray-600'
        default:           return 'bg-gray-100 text-gray-600'
    }
}

export default function TabPreguntas() {
    const [rutas, setRutas] = useState([])
    const [rutaId, setRutaId] = useState(1)
    const [tipFicha, setTipFicha] = useState('PRE')
    const [preguntas, setPreguntas] = useState([])
    const [cargando, setCargando] = useState(false)
    const [modal, setModal] = useState(null)
    const [form, setForm] = useState({ texto: '', tipo: 'SELECCION', opciones: '', tipFicha: 'PRE' })
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')

    const tiposOpciones = ['SELECCION', 'ESCALA_1_5', 'ESCALA_0_4', 'NUMERO', 'TEXTO']

    useEffect(() => {
        api.get('/rutas').then(r => setRutas(r.data.filter(r => r.activa))).catch(() => {})
    }, [])

    useEffect(() => {
        cargarPreguntas()
    }, [rutaId, tipFicha])

    const cargarPreguntas = async () => {
        setCargando(true)
        try {
            const res = await api.get(`/preguntas/ruta/${rutaId}/ficha/${tipFicha}`)
            setPreguntas(res.data.sort((a, b) => a.orden - b.orden))
        } catch {
            setPreguntas([])
        } finally {
            setCargando(false)
        }
    }

    const abrirNueva = () => {
        setForm({ texto: '', tipo: 'SELECCION', opciones: '', tipFicha })
        setError('')
        setModal('nueva')
    }

    const abrirEditar = (p) => {
        const opcionesStr = p.opciones ? JSON.parse(p.opciones).join('\n') : ''
        setForm({ texto: p.texto, tipo: p.tipo, opciones: opcionesStr, tipFicha: p.tipFicha })
        setError('')
        setModal(p)
    }

    const handleGuardar = async () => {
        if (!form.texto.trim()) { setError('El texto es obligatorio.'); return }
        setGuardando(true)
        setError('')
        try {
            const opcionesJson = form.opciones.trim()
                ? JSON.stringify(form.opciones.split('\n').map(o => o.trim()).filter(Boolean))
                : null
            const payload = {
                rutaId: Number(rutaId),
                texto: form.texto.trim(),
                tipo: form.tipo,
                opciones: opcionesJson,
                tipFicha: form.tipFicha,
                orden: modal === 'nueva' ? (preguntas.length + 1) : modal.orden,
            }
            if (modal === 'nueva') {
                await api.post('/preguntas', payload)
            } else {
                await api.put(`/preguntas/${modal.id}`, payload)
            }
            setModal(null)
            cargarPreguntas()
        } catch {
            setError('Error al guardar. Intenta de nuevo.')
        } finally {
            setGuardando(false)
        }
    }

    const handleDesactivar = async (id) => {
        if (!confirm('¿Desactivar esta pregunta?')) return
        try {
            await api.delete(`/preguntas/${id}`)
            cargarPreguntas()
        } catch {
            alert('Error al desactivar.')
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Filtros */}
            <div className="flex items-center gap-3 flex-wrap">
                <select value={rutaId} onChange={e => setRutaId(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500">
                    {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
                <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                    {['PRE', 'POST'].map(t => (
                        <button key={t} onClick={() => setTipFicha(t)}
                                className={`px-4 py-2 text-sm font-semibold transition-all ${
                                    tipFicha === t ? 'bg-green-700 text-white' : 'text-gray-500 hover:bg-gray-50'
                                }`}>
                            {t}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-gray-400">{preguntas.length} preguntas</span>
                <button onClick={abrirNueva}
                        className="ml-auto bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all">
                    + Nueva pregunta
                </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {cargando ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
                ) : preguntas.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No hay preguntas para esta ficha.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase w-10">#</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pregunta</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {preguntas.map((p) => (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-all">
                                <td className="px-5 py-3 text-xs text-gray-400">{p.orden}</td>
                                <td className="px-5 py-3 text-gray-700 max-w-xs">
                                    <p className="truncate">{p.texto}</p>
                                </td>
                                <td className="px-5 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tipoBadge(p.tipo)}`}>
                                            {p.tipo}
                                        </span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => abrirEditar(p)}
                                                className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition-all">
                                            Editar
                                        </button>
                                        <button onClick={() => handleDesactivar(p.id)}
                                                className="text-xs text-red-400 hover:text-red-600 font-semibold transition-all">
                                            Desactivar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                     onClick={() => setModal(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 flex flex-col gap-4"
                         onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-gray-800">
                            {modal === 'nueva' ? 'Nueva pregunta' : 'Editar pregunta'}
                        </h3>
                        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500">Texto *</label>
                                <textarea value={form.texto}
                                          onChange={e => setForm({ ...form, texto: e.target.value })}
                                          rows={3}
                                          placeholder="Ej. ¿Cómo calificas tu bienestar emocional?"
                                          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500 resize-none"/>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500">Tipo</label>
                                    <select value={form.tipo}
                                            onChange={e => setForm({ ...form, tipo: e.target.value })}
                                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                        {tiposOpciones.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500">Ficha</label>
                                    <select value={form.tipFicha}
                                            onChange={e => setForm({ ...form, tipFicha: e.target.value })}
                                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                        <option value="PRE">PRE</option>
                                        <option value="POST">POST</option>
                                    </select>
                                </div>
                            </div>
                            {['SELECCION', 'ESCALA_1_5', 'ESCALA_0_4'].includes(form.tipo) && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500">Opciones (una por línea)</label>
                                    <textarea value={form.opciones}
                                              onChange={e => setForm({ ...form, opciones: e.target.value })}
                                              rows={5}
                                              placeholder={"Opción 1\nOpción 2\nOpción 3"}
                                              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500 resize-none font-mono"/>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleGuardar} disabled={guardando}
                                    className="flex-1 bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button onClick={() => setModal(null)}
                                    className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}