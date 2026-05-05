import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'

const TEMAS = [
    { nombre: 'Verde',   pre: '#86efac', post: '#15803d' },
    { nombre: 'Azul',    pre: '#93c5fd', post: '#1d4ed8' },
    { nombre: 'Naranja', pre: '#fed7aa', post: '#ea580c' },
    { nombre: 'Morado',  pre: '#d8b4fe', post: '#7e22ce' },
    { nombre: 'Rojo',    pre: '#fca5a5', post: '#b91c1c' },
]

const COLORES_PIE = ['#15803d','#22c55e','#86efac','#dcfce7','#4ade80','#bbf7d0']

const mapEscala = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '0': 0 }

const mapMejora = {
    'Mejoró significativamente': 4,
    'Mejoró levemente': 3,
    'Se mantuvo igual': 2,
    'Disminuyó': 1,
}

const mapSintoma = {
    'Disminuyó significativamente': 1,
    'Disminuyó levemente': 2,
    'Se mantuvo': 3,
    'Aumentó levemente': 4,
    'Aumentó significativamente': 5,
}

function avg(arr) {
    const nums = arr.filter(v => v !== null && v !== undefined && !isNaN(v))
    if (nums.length === 0) return 0
    return parseFloat((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2))
}

export default function ReportesFichasTab() {
    const [rutas, setRutas] = useState([])
    const [rutaId, setRutaId] = useState('')
    const [vista, setVista] = useState('grupo')
    const [cargando, setCargando] = useState(false)
    const [datos, setDatos] = useState(null)
    const [seccion, setSeccion] = useState('fisica')
    const [tema, setTema] = useState(0)
    const [busqueda, setBusqueda] = useState('')
    const [participanteData, setParticipanteData] = useState(null)
    const [buscando, setBuscando] = useState(false)
    const [errorBusqueda, setErrorBusqueda] = useState('')

    useEffect(() => {
        api.get('/rutas').then(r => {
            const activas = r.data.filter(x => x.activa)
            setRutas(activas)
            if (activas.length > 0) setRutaId(String(activas[0].id))
        })
    }, [])

    const cargarDatosGrupo = async () => {
        if (!rutaId) return
        setCargando(true)
        setDatos(null)
        try {
            const [resPre, resPost] = await Promise.all([
                api.get(`/preguntas/ruta/${rutaId}/ficha/PRE`),
                api.get(`/preguntas/ruta/${rutaId}/ficha/POST`),
            ])
            const preguntasPre  = resPre.data.sort((a,b) => a.orden - b.orden)
            const preguntasPost = resPost.data.sort((a,b) => a.orden - b.orden)

            const resIns = await api.get('/inscripciones?page=0&size=200')
            const inscripciones = resIns.data.contenido.filter(
                i => i.estado === 'ACTIVA' && String(i.rutaId) === String(rutaId)
            )

            const fichas = []
            for (const ins of inscripciones) {
                try {
                    const fpRes = await api.get(`/fichas/pre/inscripcion/${ins.id}`)
                    const fp = fpRes.data
                    let fpost = null
                    try {
                        const fpostRes = await api.get(`/fichas/post/inscripcion/${fp.id}`)
                        fpost = fpostRes.data
                    } catch {}
                    fichas.push({ ins, pre: fp, post: fpost })
                } catch {}
            }
            setDatos({ fichas, preguntasPre, preguntasPost })
        } catch {
            setDatos(null)
        } finally {
            setCargando(false)
        }
    }

    const buscarParticipante = async () => {
        if (!busqueda.trim()) return
        setBuscando(true)
        setErrorBusqueda('')
        setParticipanteData(null)
        try {
            const resP = await api.get(`/participantes/identificacion/${busqueda.trim()}`)
            const participante = resP.data
            const resIns = await api.get(`/inscripciones/participante/${busqueda.trim()}`)
            const inscripciones = resIns.data.filter(i => i.estado === 'ACTIVA')

            const fichasP = []
            for (const ins of inscripciones) {
                try {
                    const [resPre, resPostQ, resPostF] = await Promise.all([
                        api.get(`/preguntas/ruta/${ins.rutaId}/ficha/PRE`),
                        api.get(`/preguntas/ruta/${ins.rutaId}/ficha/POST`),
                        api.get(`/fichas/pre/inscripcion/${ins.id}`).catch(() => null),
                    ])
                    const fp = resPostF?.data || null
                    let fpost = null
                    if (fp) {
                        try {
                            const r = await api.get(`/fichas/post/inscripcion/${fp.id}`)
                            fpost = r.data
                        } catch {}
                    }
                    fichasP.push({
                        ins,
                        preguntasPre: resPre.data.sort((a,b) => a.orden - b.orden),
                        preguntasPost: resPostQ.data.sort((a,b) => a.orden - b.orden),
                        pre: fp,
                        post: fpost,
                    })
                } catch {}
            }
            setParticipanteData({ participante, fichas: fichasP })
        } catch {
            setErrorBusqueda('No se encontró ningún participante con ese número.')
        } finally {
            setBuscando(false)
        }
    }

    const calcularComparativa = () => {
        if (!datos) return []
        const { fichas, preguntasPre, preguntasPost } = datos
        const conAmbas = fichas.filter(f => f.pre && f.post)
        if (conAmbas.length === 0) return []

        const makeMapPre  = (f) => Object.fromEntries(f.pre.respuestas.map(r => [r.preguntaId, r.valor]))
        const makeMapPost = (f) => Object.fromEntries(f.post.respuestas.map(r => [r.preguntaId, r.valor]))

        if (seccion === 'fisica') {
            const qPre  = preguntasPre.filter(q => q.tipo === 'ESCALA_1_5' && q.orden >= 7 && q.orden <= 11)
            const qPost = preguntasPost.filter(q => q.orden >= 7 && q.orden <= 11)
            return qPre.map((qp, idx) => {
                const qpo = qPost[idx]
                const valsPre  = conAmbas.map(f => mapEscala[makeMapPre(f)[qp.id]])
                const valsPost = qpo ? conAmbas.map(f => mapMejora[makeMapPost(f)[qpo.id]]) : []
                const label = qp.texto.replace(/\s*\(Escala.*\)/, '').replace('Escala 1–5: Muy baja a Muy buena', '').trim()
                return {
                    nombre: label.length > 20 ? label.substring(0,20)+'…' : label,
                    nombreCompleto: label,
                    pre: avg(valsPre),
                    post: avg(valsPost),
                    n: conAmbas.length,
                }
            })
        }

        if (seccion === 'estres') {
            const qPre  = preguntasPre.filter(q => q.tipo === 'ESCALA_1_5' && q.orden >= 12 && q.orden <= 16)
            const qPost = preguntasPost.filter(q => q.orden >= 12 && q.orden <= 16)
            return qPre.map((qp, idx) => {
                const qpo = qPost[idx]
                const valsPre  = conAmbas.map(f => mapEscala[makeMapPre(f)[qp.id]])
                const valsPost = qpo ? conAmbas.map(f => mapSintoma[makeMapPost(f)[qpo.id]]) : []
                const label = qp.texto.replace(/\s*\(Escala.*\)/, '').trim()
                return {
                    nombre: label.length > 18 ? label.substring(0,18)+'…' : label,
                    nombreCompleto: label,
                    pre: avg(valsPre),
                    post: avg(valsPost),
                    n: conAmbas.length,
                }
            })
        }

        if (seccion === 'emocional') {
            const qPre  = preguntasPre.filter(q => q.tipo === 'ESCALA_0_4')
            const qPost = preguntasPost.filter(q => q.orden >= 17 && q.orden <= 20)
            const mapEmocPost = { 'Nunca': 0, 'Casi nunca': 1, 'A veces': 2, 'Casi siempre': 3, 'Siempre': 4 }
            return qPre.map((qp, idx) => {
                const qpo = qPost[idx]
                const valsPre  = conAmbas.map(f => mapEscala[makeMapPre(f)[qp.id]])
                const valsPost = qpo ? conAmbas.map(f => mapEmocPost[makeMapPost(f)[qpo.id]]) : []
                const label = qp.texto.replace(/\s*\(Escala.*\)/, '').trim()
                return {
                    nombre: label.length > 18 ? label.substring(0,18)+'…' : label,
                    nombreCompleto: label,
                    pre: avg(valsPre),
                    post: avg(valsPost),
                    n: conAmbas.length,
                }
            })
        }

        if (seccion === 'satisfaccion') {
            const qSat = preguntasPost.find(q => q.orden === 21)
            if (!qSat) return []
            const conteo = { 'Muy satisfecho': 0, 'Satisfecho': 0, 'Un poco satisfecho': 0, 'Insatisfecho': 0 }
            conAmbas.forEach(f => {
                const v = makeMapPost(f)[qSat.id]
                if (v && conteo[v] !== undefined) conteo[v]++
            })
            return Object.entries(conteo).map(([k, v]) => ({ nombre: k, valor: v }))
        }

        return []
    }

    const comparativa = calcularComparativa()
    const conAmbas = datos ? datos.fichas.filter(f => f.pre && f.post).length : 0
    const totalPre  = datos ? datos.fichas.filter(f => f.pre).length : 0

    return (
        <div className="flex flex-col gap-5">
            {/* Selector de vista */}
            <div className="flex gap-2">
                {[
                    { id: 'grupo',      label: '📊 Comparativa grupal' },
                    { id: 'individual', label: '👤 Vista individual' },
                ].map(v => (
                    <button key={v.id} onClick={() => setVista(v.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                vista === v.id
                                    ? 'bg-green-700 text-white border-green-700'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}>
                        {v.label}
                    </button>
                ))}
            </div>

            {/* ── VISTA GRUPAL ─────────────────────────────────────── */}
            {vista === 'grupo' && (
                <div className="flex flex-col gap-4">
                    {/* Filtros */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-end gap-4">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-semibold text-gray-500">Ruta</label>
                            <select value={rutaId} onChange={e => setRutaId(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </select>
                        </div>
                        <button onClick={cargarDatosGrupo} disabled={cargando}
                                className="bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                            {cargando ? 'Cargando...' : 'Generar'}
                        </button>
                    </div>

                    {cargando && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
                            Procesando datos de fichas...
                        </div>
                    )}

                    {!cargando && datos && (
                        <>
                            {/* Resumen */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Participantes con PRE', valor: totalPre,   color: 'bg-blue-50 text-blue-700' },
                                    { label: 'Participantes con POST', valor: conAmbas,   color: 'bg-green-50 text-green-700' },
                                    { label: 'Completitud', valor: totalPre > 0 ? `${Math.round(conAmbas/totalPre*100)}%` : '0%', color: 'bg-purple-50 text-purple-700' },
                                ].map((s, i) => (
                                    <div key={i} className={`${s.color} rounded-2xl p-4`}>
                                        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{s.label}</p>
                                        <p className="text-3xl font-bold mt-1">{s.valor}</p>
                                    </div>
                                ))}
                            </div>

                            {conAmbas === 0 ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-sm text-yellow-800 text-center">
                                    No hay participantes con ambas fichas (PRE y POST) completadas en esta ruta.
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                                    {/* Tabs de sección */}
                                    <div className="flex gap-2 flex-wrap border-b border-gray-100 pb-3">
                                        {[
                                            { id: 'fisica',      label: '💪 Condición física' },
                                            { id: 'estres',      label: '😰 Síntomas de estrés' },
                                            { id: 'emocional',   label: '🧠 Experiencias emocionales' },
                                            { id: 'satisfaccion',label: '⭐ Satisfacción' },
                                        ].map(s => (
                                            <button key={s.id} onClick={() => setSeccion(s.id)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                                        seccion === s.id
                                                            ? 'bg-green-700 text-white'
                                                            : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                                                    }`}>
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-400">
                                            Basado en <strong>{conAmbas}</strong> participantes con PRE y POST completados.
                                            {seccion !== 'satisfaccion' && ' Escala 1–5.'}
                                        </p>

                                        {/* Selector de colores */}
                                        {seccion !== 'satisfaccion' && (
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-gray-400">Color:</p>
                                                {TEMAS.map((t, i) => (
                                                    <button key={i} onClick={() => setTema(i)}
                                                            title={t.nombre}
                                                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                                                                tema === i ? 'border-gray-400 scale-110' : 'border-transparent'
                                                            }`}
                                                            style={{ background: `linear-gradient(135deg, ${t.pre} 50%, ${t.post} 50%)` }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {seccion !== 'satisfaccion' ? (
                                        <ResponsiveContainer width="100%" height={380}>
                                            <BarChart data={comparativa} margin={{ top: 10, right: 20, left: 0, bottom: 90 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                                                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                                                <Tooltip
                                                    formatter={(val, name) => [val.toFixed(2), name === 'pre' ? 'Promedio PRE' : 'Promedio POST']}
                                                    labelFormatter={(label) => {
                                                        const item = comparativa.find(c => c.nombre === label)
                                                        return item?.nombreCompleto || label
                                                    }}
                                                />
                                                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }}
                                                        formatter={v => v === 'pre' ? 'PRE (inicio semestre)' : 'POST (fin semestre)'} />
                                                <Bar dataKey="pre"  fill={TEMAS[tema].pre}  radius={[4,4,0,0]} name="pre" />
                                                <Bar dataKey="post" fill={TEMAS[tema].post} radius={[4,4,0,0]} name="post" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie data={comparativa} dataKey="valor" nameKey="nombre"
                                                         cx="50%" cy="50%" outerRadius={120}
                                                         label={({ nombre, percent }) => `${nombre} ${(percent*100).toFixed(0)}%`}>
                                                        {comparativa.map((_, i) => (
                                                            <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="grid grid-cols-2 gap-2">
                                                {comparativa.map((c, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm">
                                                        <div className="w-3 h-3 rounded-full flex-shrink-0"
                                                             style={{ backgroundColor: COLORES_PIE[i % COLORES_PIE.length] }} />
                                                        <span className="text-gray-600">{c.nombre}:</span>
                                                        <span className="font-semibold">{c.valor}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── VISTA INDIVIDUAL ─────────────────────────────────── */}
            {vista === 'individual' && (
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && buscarParticipante()}
                               placeholder="Número de identificación del participante..."
                               className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500"/>
                        <button onClick={buscarParticipante} disabled={buscando}
                                className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                            {buscando ? 'Buscando...' : 'Buscar'}
                        </button>
                        {participanteData && (
                            <button onClick={() => { setParticipanteData(null); setBusqueda(''); setErrorBusqueda('') }}
                                    className="px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-all">
                                ✕
                            </button>
                        )}
                    </div>

                    {errorBusqueda && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{errorBusqueda}</div>
                    )}

                    {participanteData && (
                        <div className="flex flex-col gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-lg">👤</div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{participanteData.participante.nombreCompleto}</p>
                                    <p className="text-xs text-gray-500">
                                        {participanteData.participante.numeroIdentificacion} · {participanteData.participante.programaAcademico || 'Sin programa'}
                                    </p>
                                </div>
                            </div>

                            {participanteData.fichas.map((f, idx) => (
                                <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                    <div className="bg-green-800 px-5 py-3">
                                        <p className="text-white text-sm font-semibold">{f.ins.nombreRuta || `Ruta ${f.ins.rutaId}`}</p>
                                    </div>

                                    {!f.pre ? (
                                        <div className="p-5 text-sm text-gray-400 text-center">Sin ficha PRE</div>
                                    ) : (
                                        <div className="p-4 flex flex-col gap-4">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                                    <p className="font-semibold text-blue-700">📋 PRE</p>
                                                    <p className="text-blue-500 mt-0.5">{new Date(f.pre.fechaDiligenciamiento).toLocaleDateString('es-CO')}</p>
                                                </div>
                                                <div className={`rounded-xl p-3 text-center ${f.post ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                    <p className={`font-semibold ${f.post ? 'text-green-700' : 'text-gray-400'}`}>
                                                        {f.post ? '✓ POST' : '— POST pendiente'}
                                                    </p>
                                                    {f.post && (
                                                        <p className="text-green-500 mt-0.5">{new Date(f.post.fechaDiligenciamiento).toLocaleDateString('es-CO')}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <table className="w-full text-xs">
                                                <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                    <th className="text-left px-3 py-2 font-semibold text-gray-500">Pregunta</th>
                                                    <th className="text-center px-3 py-2 font-semibold text-blue-600">PRE</th>
                                                    {f.post && <th className="text-center px-3 py-2 font-semibold text-green-700">POST</th>}
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {f.preguntasPre.map((q, qi) => {
                                                    const respPre  = f.pre.respuestas.find(r => r.preguntaId === q.id)
                                                    const qPost    = f.preguntasPost[qi]
                                                    const respPost = f.post && qPost ? f.post.respuestas.find(r => r.preguntaId === qPost.id) : null
                                                    return (
                                                        <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                            <td className="px-3 py-2 text-gray-700 max-w-xs">
                                                                <p className="truncate">{q.texto.replace(/\s*\(Escala.*\)/, '').trim()}</p>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-semibold">
                                                                        {respPre?.valor || '—'}
                                                                    </span>
                                                            </td>
                                                            {f.post && (
                                                                <td className="px-3 py-2 text-center">
                                                                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-lg font-semibold">
                                                                            {respPost?.valor || '—'}
                                                                        </span>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    )
                                                })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}