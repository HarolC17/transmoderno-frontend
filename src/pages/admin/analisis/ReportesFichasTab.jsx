import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

// ── Secciones por orden de pregunta PRE ──────────────────────
// orden 6      → frecuencia (SELECCION) → excluida de gráfica escala
// orden 7-11   → condición física       → escala 1-5, alto=bueno
// orden 12-16  → síntomas de estrés     → escala 1-5, alto=malo
// orden 17-20  → bienestar emocional    → escala 1-5 (19=calma: alto=bueno)
// orden 21-24  → satisfacción/selección → excluidas de comparativa directa
// orden 25     → motivación             → excluida

const SECCIONES = [
    {
        id: 'fisica',
        label: '💪 Condición física',
        ordenes: [7, 8, 9, 10, 11],
        invertida: false, // alto = bueno → POST debe ser mayor
        yLabel: 'Nivel (1=Muy baja · 5=Muy buena)',
    },
    {
        id: 'sintomas',
        label: '😰 Síntomas de estrés',
        ordenes: [12, 13, 14, 15, 16],
        invertida: true, // alto = malo → POST debe ser menor
        yLabel: 'Frecuencia (1=Nunca · 5=Siempre)',
    },
    {
        id: 'emocional',
        label: '🧠 Experiencias emocionales',
        ordenes: [17, 18, 19, 20],
        invertida: false, // interpretación mixta — se muestra sin invertir
        yLabel: 'Frecuencia (1=Nunca · 5=Siempre)',
    },
]

const TEMAS = [
    { nombre: 'Verde',   pre: '#86efac', post: '#15803d' },
    { nombre: 'Azul',    pre: '#93c5fd', post: '#1d4ed8' },
    { nombre: 'Naranja', pre: '#fed7aa', post: '#ea580c' },
    { nombre: 'Morado',  pre: '#d8b4fe', post: '#7e22ce' },
    { nombre: 'Rojo',    pre: '#fca5a5', post: '#b91c1c' },
]

function limpiarTexto(texto) {
    return texto
        .replace(/\s*\(Escala.*?\)/gi, '')
        .replace(/\s*Escala.*$/gi, '')
        .trim()
}

function deltaColor(pre, post, invertida) {
    const mejoro = invertida ? post < pre : post > pre
    const igual  = Math.abs(post - pre) < 0.1
    if (igual)   return 'text-gray-400'
    if (mejoro)  return 'text-green-600'
    return 'text-red-500'
}

function deltaLabel(pre, post, invertida) {
    const diff = post - pre
    if (Math.abs(diff) < 0.1) return '→ Sin cambio'
    const mejoro = invertida ? diff < 0 : diff > 0
    const flecha = diff > 0 ? '↑' : '↓'
    const signo  = diff > 0 ? '+' : ''
    return `${flecha} ${signo}${diff.toFixed(2)}`
}

// ── Tooltip personalizado ────────────────────────────────────
const CustomTooltip = ({ active, payload, label, comparativa }) => {
    if (!active || !payload?.length) return null
    const item = comparativa.find(c => c.nombre === label)
    const pre  = payload.find(p => p.dataKey === 'pre')?.value  ?? 0
    const post = payload.find(p => p.dataKey === 'post')?.value ?? 0
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs max-w-xs">
            <p className="font-semibold text-gray-700 mb-1.5">{item?.nombreCompleto || label}</p>
            <div className="flex flex-col gap-1">
                <span className="text-blue-600">PRE:  <strong>{pre.toFixed(2)}</strong></span>
                <span className="text-green-700">POST: <strong>{post.toFixed(2)}</strong></span>
            </div>
        </div>
    )
}

export default function ReportesFichasTab() {
    const [rutas,       setRutas]       = useState([])
    const [rutaId,      setRutaId]      = useState('')
    const [vista,       setVista]       = useState('grupo')
    const [cargando,    setCargando]    = useState(false)
    const [error,       setError]       = useState('')
    const [comparativa, setComparativa] = useState([])   // datos del endpoint
    const [seccion,     setSeccion]     = useState('fisica')
    const [tema,        setTema]        = useState(0)
    const [totalFichas, setTotalFichas] = useState(0)

    // Vista individual
    const [busqueda,        setBusqueda]        = useState('')
    const [participanteData, setParticipanteData] = useState(null)
    const [buscando,        setBuscando]        = useState(false)
    const [errorBusqueda,   setErrorBusqueda]   = useState('')

    useEffect(() => {
        api.get('/rutas').then(r => {
            const activas = r.data.filter(x => x.activa)
            setRutas(activas)
            if (activas.length > 0) setRutaId(String(activas[0].id))
        })
    }, [])

    // ── Carga usando el endpoint comparativa ─────────────────
    const cargarComparativa = async () => {
        if (!rutaId) return
        setCargando(true)
        setError('')
        setComparativa([])
        setTotalFichas(0)
        try {
            const res = await api.get(`/reportes/fichas/comparativa?rutaId=${rutaId}`)
            setComparativa(res.data)          // [{ orden, pregunta, promedioPre, promedioPost }]

            // Total de fichas con PRE+POST para mostrar en el resumen
            const resIns = await api.get(`/inscripciones?page=0&size=1&rutaId=${rutaId}`)
            setTotalFichas(res.data.length > 0 ? res.data[0].n ?? 0 : 0)
        } catch {
            setError('No se pudieron cargar los datos. Verifica que existan fichas completadas.')
        } finally {
            setCargando(false)
        }
    }

    // ── Datos de la sección activa ────────────────────────────
    const datosSeccion = () => {
        const sec = SECCIONES.find(s => s.id === seccion)
        if (!sec || comparativa.length === 0) return []

        return comparativa
            .filter(d => sec.ordenes.includes(d.orden))
            .map(d => {
                const nombre = limpiarTexto(d.pregunta)
                return {
                    nombre:        nombre.length > 18 ? nombre.substring(0, 18) + '…' : nombre,
                    nombreCompleto: nombre,
                    pre:           d.promedioPre  ?? 0,
                    post:          d.promedioPost ?? 0,
                }
            })
    }

    const seccionActual = SECCIONES.find(s => s.id === seccion)
    const datos         = datosSeccion()
    const hayDatos      = comparativa.length > 0

    // ── Buscar participante individual ────────────────────────
    const buscarParticipante = async () => {
        if (!busqueda.trim()) return
        setBuscando(true)
        setErrorBusqueda('')
        setParticipanteData(null)
        try {
            const resP   = await api.get(`/participantes/identificacion/${busqueda.trim()}`)
            const resIns = await api.get(`/inscripciones/participante/${busqueda.trim()}`)
            const inscripciones = resIns.data.filter(i => i.estado === 'ACTIVA')

            const fichasP = []
            for (const ins of inscripciones) {
                try {
                    const [resPre, resPostQ] = await Promise.all([
                        api.get(`/preguntas/ruta/${ins.rutaId}/ficha/PRE`),
                        api.get(`/preguntas/ruta/${ins.rutaId}/ficha/POST`),
                    ])
                    let fp = null, fpost = null
                    try {
                        const r = await api.get(`/fichas/pre/inscripcion/${ins.id}`)
                        fp = r.data
                        try {
                            const r2 = await api.get(`/fichas/post/inscripcion/${fp.id}`)
                            fpost = r2.data
                        } catch {}
                    } catch {}
                    fichasP.push({
                        ins,
                        preguntasPre:  resPre.data.sort((a, b) => a.orden - b.orden),
                        preguntasPost: resPostQ.data.sort((a, b) => a.orden - b.orden),
                        pre:  fp,
                        post: fpost,
                    })
                } catch {}
            }
            setParticipanteData({ participante: resP.data, fichas: fichasP })
        } catch {
            setErrorBusqueda('No se encontró ningún participante con ese número.')
        } finally {
            setBuscando(false)
        }
    }

    return (
        <div className="flex flex-col gap-5">

            {/* Selector vista */}
            <div className="flex gap-2">
                {[
                    { id: 'grupo',      label: '📊 Comparativa grupal' },
                    { id: 'individual', label: '👤 Vista individual'   },
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

            {/* ══════════ VISTA GRUPAL ══════════ */}
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
                        <button onClick={cargarComparativa} disabled={cargando}
                                className="bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                            {cargando ? 'Cargando…' : 'Generar'}
                        </button>
                    </div>

                    {cargando && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
                            Consultando comparativa PRE/POST…
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center">
                            {error}
                        </div>
                    )}

                    {!cargando && hayDatos && (
                        <>
                            {/* Tabs sección */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                                <div className="flex gap-2 flex-wrap border-b border-gray-100 pb-3">
                                    {SECCIONES.map(s => (
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

                                {/* Info + selector color */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <p className="text-xs text-gray-400">
                                        Basado en <strong>{comparativa[0]?.n ?? '—'}</strong> participantes con PRE y POST completados.
                                        Escala 1–5. {seccionActual?.invertida
                                        ? '⬇ En esta sección un valor menor en POST indica mejora.'
                                        : '⬆ En esta sección un valor mayor en POST indica mejora.'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-400">Color:</p>
                                        {TEMAS.map((t, i) => (
                                            <button key={i} onClick={() => setTema(i)} title={t.nombre}
                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                                                        tema === i ? 'border-gray-400 scale-110' : 'border-transparent'
                                                    }`}
                                                    style={{ background: `linear-gradient(135deg, ${t.pre} 50%, ${t.post} 50%)` }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Gráfica de barras */}
                                {datos.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={380}>
                                        <BarChart data={datos} margin={{ top: 10, right: 20, left: 0, bottom: 90 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                                            <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} label={{ value: seccionActual?.yLabel, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' }} />
                                            <Tooltip content={<CustomTooltip comparativa={datos} />} />
                                            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }}
                                                    formatter={v => v === 'pre' ? 'PRE (inicio semestre)' : 'POST (fin semestre)'} />
                                            <Bar dataKey="pre"  fill={TEMAS[tema].pre}  radius={[4, 4, 0, 0]} name="pre"  />
                                            <Bar dataKey="post" fill={TEMAS[tema].post} radius={[4, 4, 0, 0]} name="post" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-8">Sin datos para esta sección.</p>
                                )}

                                {/* Tabla resumen con delta */}
                                {datos.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left px-3 py-2 font-semibold text-gray-500">Pregunta</th>
                                                <th className="text-center px-3 py-2 font-semibold text-blue-600">PRE</th>
                                                <th className="text-center px-3 py-2 font-semibold text-green-700">POST</th>
                                                <th className="text-center px-3 py-2 font-semibold text-gray-500">Cambio</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {datos.map((d, i) => (
                                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-gray-700">{d.nombreCompleto}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-semibold">{d.pre.toFixed(2)}</span>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-lg font-semibold">{d.post.toFixed(2)}</span>
                                                    </td>
                                                    <td className={`px-3 py-2 text-center font-semibold ${deltaColor(d.pre, d.post, seccionActual?.invertida)}`}>
                                                        {deltaLabel(d.pre, d.post, seccionActual?.invertida)}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ══════════ VISTA INDIVIDUAL ══════════ */}
            {vista === 'individual' && (
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && buscarParticipante()}
                               placeholder="Número de identificación del participante…"
                               className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500" />
                        <button onClick={buscarParticipante} disabled={buscando}
                                className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                            {buscando ? 'Buscando…' : 'Buscar'}
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
                            {/* Header participante */}
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
                                        <div className="p-5 text-sm text-gray-400 text-center">Sin ficha PRE registrada</div>
                                    ) : (
                                        <div className="p-4 flex flex-col gap-4">
                                            {/* Estado fichas */}
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                                    <p className="font-semibold text-blue-700">📋 PRE completada</p>
                                                    <p className="text-blue-500 mt-0.5">{new Date(f.pre.fechaDiligenciamiento).toLocaleDateString('es-CO')}</p>
                                                </div>
                                                <div className={`rounded-xl p-3 text-center ${f.post ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                    <p className={`font-semibold ${f.post ? 'text-green-700' : 'text-gray-400'}`}>
                                                        {f.post ? '✓ POST completada' : '— POST pendiente'}
                                                    </p>
                                                    {f.post && (
                                                        <p className="text-green-500 mt-0.5">{new Date(f.post.fechaDiligenciamiento).toLocaleDateString('es-CO')}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tabla respuestas */}
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
                                                    const qPost    = f.preguntasPost.find(p => p.orden === q.orden)
                                                    const respPost = f.post && qPost
                                                        ? f.post.respuestas.find(r => r.preguntaId === qPost.id)
                                                        : null

                                                    // Mostrar texto de la opción si tiene opciones definidas
                                                    const getLabel = (pregunta, valor) => {
                                                        if (!pregunta.opciones || valor === undefined || valor === null) return valor ?? '—'
                                                        try {
                                                            const opts = JSON.parse(pregunta.opciones)
                                                            return opts[Number(valor)] ?? valor
                                                        } catch { return valor }
                                                    }

                                                    return (
                                                        <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                            <td className="px-3 py-2 text-gray-700 max-w-xs">
                                                                <p className="truncate">{limpiarTexto(q.texto)}</p>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-semibold">
                                                                        {getLabel(q, respPre?.valor)}
                                                                    </span>
                                                            </td>
                                                            {f.post && (
                                                                <td className="px-3 py-2 text-center">
                                                                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-lg font-semibold">
                                                                            {qPost ? getLabel(qPost, respPost?.valor) : '—'}
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