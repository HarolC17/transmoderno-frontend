import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts'

const SECCIONES = [
    {
        id: 'fisica',
        label: '💪 Condición física',
        ordenes: [7, 8, 9, 10, 11],
        color: '#15803d',
        colorClaro: '#bbf7d0',
        descripcion: 'Estado inicial de la condición física (1=Muy baja · 5=Muy buena)',
        inversion: false,
    },
    {
        id: 'sintomas',
        label: '😰 Síntomas de estrés',
        ordenes: [12, 13, 14, 15, 16],
        color: '#b91c1c',
        colorClaro: '#fecaca',
        descripcion: 'Frecuencia de síntomas físicos al inicio del semestre (1=Nunca · 5=Siempre)',
        inversion: true,
    },
    {
        id: 'emocional',
        label: '🧠 Experiencias emocionales',
        ordenes: [17, 18, 19, 20],
        color: '#7e22ce',
        colorClaro: '#e9d5ff',
        descripcion: 'Frecuencia de experiencias emocionales al inicio (0=Nunca · 4=Siempre)',
        inversion: true,
    },
]

function limpiarTexto(texto) {
    return texto
        .replace(/^Condición física — /i, '')
        .replace(/^Síntomas de estrés — /i, '')
        .replace(/^Experiencias emocionales — /i, '')
        .replace(/\s*\(Escala.*?\)/gi, '')
        .replace(/\s*\(invertido\)/gi, '')
        .trim()
}

const CustomTooltip = ({ active, payload, label, seccion }) => {
    if (!active || !payload?.length) return null
    const val = payload[0]?.value ?? 0
    const max = seccion?.id === 'emocional' ? 4 : 5
    const nivel = seccion?.inversion
        ? val >= 3.5 ? '⚠️ Nivel alto — requiere atención'
            : val >= 2.5 ? '⚡ Nivel moderado'
                : '✓ Nivel bajo'
        : val >= 4 ? '✓ Buen nivel inicial'
            : val >= 3 ? '⚡ Nivel moderado'
                : '⚠️ Nivel bajo — área de mejora'
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs max-w-xs">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            <p style={{ color: seccion?.color }}>Promedio PRE: <strong>{val.toFixed(2)}</strong> / {max}</p>
            <p className="text-gray-400 mt-1">{nivel}</p>
        </div>
    )
}

export default function ReportesFichasTab() {
    const [rutas,        setRutas]        = useState([])
    const [rutaId,       setRutaId]       = useState('')
    const [cargando,     setCargando]     = useState(false)
    const [error,        setError]        = useState('')
    const [datos,        setDatos]        = useState([])
    const [seccion,      setSeccion]      = useState('fisica')
    const [vistaGrafica, setVistaGrafica] = useState('barras')
    const [vista,        setVista]        = useState('grupo')

    const [busqueda,         setBusqueda]         = useState('')
    const [participanteData, setParticipanteData] = useState(null)
    const [buscando,         setBuscando]         = useState(false)
    const [errorBusqueda,    setErrorBusqueda]    = useState('')

    useEffect(() => {
        api.get('/rutas').then(r => {
            const activas = r.data.filter(x => x.activa)
            setRutas(activas)
            if (activas.length > 0) setRutaId(String(activas[0].id))
        })
    }, [])

    const cargar = async () => {
        if (!rutaId) return
        setCargando(true)
        setError('')
        setDatos([])
        try {
            const res = await api.get(`/reportes/fichas/comparativa?rutaId=${rutaId}`)
            setDatos(res.data)
        } catch {
            setError('No se pudieron cargar los datos. Verifica que existan fichas PRE completadas.')
        } finally {
            setCargando(false)
        }
    }

    const seccionActual  = SECCIONES.find(s => s.id === seccion)
    const maxEscala      = seccion === 'emocional' ? 4 : 5
    const datosSeccion   = datos
        .filter(d => seccionActual?.ordenes.includes(d.orden))
        .map(d => ({ nombre: limpiarTexto(d.pregunta), valor: d.promedioPre ?? 0 }))

    const promedioSeccion = datosSeccion.length > 0
        ? (datosSeccion.reduce((s, d) => s + d.valor, 0) / datosSeccion.length).toFixed(2)
        : '—'

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
                        try { fpost = (await api.get(`/fichas/post/inscripcion/${fp.id}`)).data } catch {}
                    } catch {}
                    fichasP.push({
                        ins,
                        preguntasPre:  resPre.data.sort((a, b) => a.orden - b.orden),
                        preguntasPost: resPostQ.data.sort((a, b) => a.orden - b.orden),
                        pre: fp, post: fpost,
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
                    { id: 'grupo',      label: '📊 Diagnóstico grupal' },
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

            {/* ══ VISTA GRUPAL ══ */}
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
                        <button onClick={cargar} disabled={cargando}
                                className="bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                            {cargando ? 'Cargando…' : 'Generar'}
                        </button>
                    </div>

                    {cargando && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
                            Consultando diagnóstico inicial…
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center">{error}</div>
                    )}

                    {!cargando && datos.length > 0 && (
                        <>
                            {/* Cards resumen */}
                            <div className="grid grid-cols-3 gap-3">
                                {SECCIONES.map(s => {
                                    const ds  = datos.filter(d => s.ordenes.includes(d.orden))
                                    const max = s.id === 'emocional' ? 4 : 5
                                    const prom = ds.length > 0
                                        ? (ds.reduce((a, d) => a + (d.promedioPre ?? 0), 0) / ds.length).toFixed(1)
                                        : '—'
                                    return (
                                        <div key={s.id} onClick={() => setSeccion(s.id)}
                                             className={`rounded-2xl p-4 cursor-pointer transition-all border-2 ${
                                                 seccion === s.id ? 'border-gray-400 shadow-sm' : 'border-transparent'
                                             }`}
                                             style={{ backgroundColor: s.colorClaro + '80' }}>
                                            <p className="text-xs font-semibold text-gray-500 mb-1">{s.label}</p>
                                            <p className="text-2xl font-bold" style={{ color: s.color }}>
                                                {prom}<span className="text-sm font-normal text-gray-400"> /{max}</span>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">Promedio inicial</p>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Panel gráfica */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                                {/* Tabs + toggle */}
                                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-3">
                                    <div className="flex gap-2 flex-wrap">
                                        {SECCIONES.map(s => (
                                            <button key={s.id} onClick={() => setSeccion(s.id)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                                        seccion === s.id ? 'text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                    style={seccion === s.id ? { backgroundColor: seccionActual?.color } : {}}>
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        {[{ id: 'barras', icon: '▊' }, { id: 'radar', icon: '⬡' }].map(v => (
                                            <button key={v.id} onClick={() => setVistaGrafica(v.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                        vistaGrafica === v.id
                                                            ? 'bg-gray-800 text-white'
                                                            : 'border border-gray-200 text-gray-400 hover:bg-gray-50'
                                                    }`}>
                                                {v.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400">{seccionActual?.descripcion}</p>

                                {datosSeccion.length > 0 ? (
                                    vistaGrafica === 'barras' ? (
                                        <ResponsiveContainer width="100%" height={320}>
                                            <BarChart data={datosSeccion} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                                                <YAxis domain={[0, maxEscala]} tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip seccion={seccionActual} />} />
                                                <Bar dataKey="valor" fill={seccionActual?.color} radius={[6, 6, 0, 0]} name="Promedio PRE"
                                                     label={{ position: 'top', fontSize: 11, fill: seccionActual?.color,
                                                         formatter: v => v.toFixed(1) }} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={320}>
                                            <RadarChart data={datosSeccion}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                                                <PolarRadiusAxis domain={[0, maxEscala]} tick={{ fontSize: 10 }} />
                                                <Radar name="Promedio PRE" dataKey="valor"
                                                       stroke={seccionActual?.color}
                                                       fill={seccionActual?.color} fillOpacity={0.35} />
                                                <Legend />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    )
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-8">Sin datos para esta sección.</p>
                                )}

                                {/* Tabla */}
                                {datosSeccion.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left px-3 py-2 font-semibold text-gray-500">Dimensión</th>
                                                <th className="text-center px-3 py-2 font-semibold text-gray-500">Promedio PRE</th>
                                                <th className="text-center px-3 py-2 font-semibold text-gray-500">Nivel</th>
                                                <th className="text-center px-3 py-2 font-semibold text-gray-500">Barra</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {datosSeccion.map((d, i) => {
                                                const pct   = (d.valor / maxEscala) * 100
                                                const nivel = seccionActual?.inversion
                                                    ? d.valor >= 3.5 ? { label: 'Alto ⚠️',    color: 'text-red-600'   }
                                                        : d.valor >= 2.5 ? { label: 'Moderado',  color: 'text-amber-600' }
                                                            : { label: 'Bajo ✓',   color: 'text-green-600' }
                                                    : d.valor >= 4   ? { label: 'Bueno ✓',  color: 'text-green-600' }
                                                        : d.valor >= 3 ? { label: 'Moderado',  color: 'text-amber-600' }
                                                            : { label: 'Bajo ⚠️',  color: 'text-red-600'   }
                                                return (
                                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                                        <td className="px-3 py-2 text-gray-700">{d.nombre}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className="font-semibold text-gray-800">{d.valor.toFixed(2)}</span>
                                                            <span className="text-gray-400"> /{maxEscala}</span>
                                                        </td>
                                                        <td className={`px-3 py-2 text-center font-semibold ${nivel.color}`}>
                                                            {nivel.label}
                                                        </td>
                                                        <td className="px-3 py-2 w-32">
                                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                                <div className="h-2 rounded-full"
                                                                     style={{ width: `${pct}%`, backgroundColor: seccionActual?.color }} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            <tr className="bg-gray-50">
                                                <td className="px-3 py-2 font-semibold text-gray-600">Promedio sección</td>
                                                <td className="px-3 py-2 text-center font-bold" style={{ color: seccionActual?.color }}>
                                                    {promedioSeccion} /{maxEscala}
                                                </td>
                                                <td colSpan={2} />
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 text-center">
                                    📋 Diagnóstico inicial (PRE) — Los resultados POST estarán disponibles al finalizar el semestre
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ══ VISTA INDIVIDUAL ══ */}
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
                                    className="px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-all">✕</button>
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
                                        <div className="p-5 text-sm text-gray-400 text-center">Sin ficha PRE registrada</div>
                                    ) : (
                                        <div className="p-4 flex flex-col gap-4">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                                    <p className="font-semibold text-blue-700">📋 PRE completada</p>
                                                    <p className="text-blue-500 mt-0.5">{new Date(f.pre.fechaDiligenciamiento).toLocaleDateString('es-CO')}</p>
                                                </div>
                                                <div className={`rounded-xl p-3 text-center ${f.post ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                    <p className={`font-semibold ${f.post ? 'text-green-700' : 'text-gray-400'}`}>
                                                        {f.post ? '✓ POST completada' : '— POST pendiente'}
                                                    </p>
                                                    {f.post && <p className="text-green-500 mt-0.5">{new Date(f.post.fechaDiligenciamiento).toLocaleDateString('es-CO')}</p>}
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
                                                {f.preguntasPre.map(q => {
                                                    const respPre  = f.pre.respuestas.find(r => r.preguntaId === q.id)
                                                    const qPost    = f.preguntasPost.find(p => p.orden === q.orden)
                                                    const respPost = f.post && qPost ? f.post.respuestas.find(r => r.preguntaId === qPost.id) : null
                                                    return (
                                                        <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                            <td className="px-3 py-2 text-gray-700 max-w-xs">
                                                                <p className="truncate">
                                                                    {q.texto
                                                                        .replace(/^(Condición física|Síntomas de estrés|Experiencias emocionales|Estrategia|Actividad de interés|Frecuencia estrategia|Cambio en condición física|Cambio en síntomas|Cambio emocional) — /i, '')
                                                                        .replace(/\s*\(Escala.*?\)/gi, '')
                                                                        .replace(/\s*\(invertido\)/gi, '')
                                                                        .trim()}
                                                                </p>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-semibold">
                                                                        {respPre?.valor ?? '—'}
                                                                    </span>
                                                            </td>
                                                            {f.post && (
                                                                <td className="px-3 py-2 text-center">
                                                                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-lg font-semibold">
                                                                            {qPost ? (respPost?.valor ?? '—') : '—'}
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