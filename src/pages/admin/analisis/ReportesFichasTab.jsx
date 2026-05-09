import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Legend,
    PieChart, Pie, Cell,
} from 'recharts'

// ── Colores distribución POST ────────────────────────────────
const COLORES_POSITIVO = ['#15803d', '#4ade80', '#f59e0b', '#b91c1c', '#fca5a5']
const COLORES_NEGATIVO = ['#b91c1c', '#f87171', '#fca5a5', '#fecaca']
const COLORES_PIE      = ['#15803d', '#4ade80', '#f59e0b', '#b91c1c', '#7e22ce', '#0ea5e9']

// ── Secciones PRE ────────────────────────────────────────────
const SECCIONES_PRE = [
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
        descripcion: 'Frecuencia de síntomas físicos al inicio (1=Nunca · 5=Siempre)',
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

// ── Secciones POST ───────────────────────────────────────────
const SECCIONES_POST = [
    { id: 'fisica_post',    label: '💪 Condición física',         ordenes: [7,8,9,10,11],   tipo: 'distribucion' },
    { id: 'sintomas_post',  label: '😰 Síntomas de estrés',       ordenes: [12,13,14,15,16], tipo: 'distribucion' },
    { id: 'emocional_post', label: '🧠 Cambios emocionales',       ordenes: [17,18,19,20],    tipo: 'distribucion' },
    { id: 'satisfaccion',   label: '⭐ Satisfacción',              ordenes: [21],             tipo: 'pie' },
    { id: 'estado',         label: '😊 Estado emocional',          ordenes: [22],             tipo: 'pie' },
    { id: 'estrategias',    label: '🛠️ Estrategias',              ordenes: [24,25,26,27,28,29,30], tipo: 'estrategias' },
    { id: 'frecuencia',     label: '🏃 Frecuencia ejercicio',      ordenes: [6],              tipo: 'pie' },
]

function limpiarTexto(texto) {
    return texto
        .replace(/^(Condición física|Síntomas de estrés|Experiencias emocionales|Estrategia|Actividad de interés|Frecuencia estrategia|Cambio en condición física|Cambio en síntomas|Cambio emocional) — /i, '')
        .replace(/\s*\(Escala.*?\)/gi, '')
        .replace(/\s*\(invertido\)/gi, '')
        .replace(/^Luego de participar.*?,\s*/i, '')
        .trim()
}

// Tooltip PRE
const TooltipPre = ({ active, payload, label, seccion }) => {
    if (!active || !payload?.length) return null
    const val = payload[0]?.value ?? 0
    const max = seccion?.id === 'emocional' ? 4 : 5
    const nivel = seccion?.inversion
        ? val >= 3.5 ? '⚠️ Nivel alto' : val >= 2.5 ? '⚡ Moderado' : '✓ Nivel bajo'
        : val >= 4   ? '✓ Buen nivel'  : val >= 3   ? '⚡ Moderado' : '⚠️ Nivel bajo'
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            <p style={{ color: seccion?.color }}>Promedio: <strong>{val.toFixed(2)}</strong> /{max}</p>
            <p className="text-gray-400 mt-1">{nivel}</p>
        </div>
    )
}

// Barra apilada horizontal para distribución POST
function BarraDistribucion({ distribucion, total, colores }) {
    if (!distribucion || total === 0) return null
    const entries = Object.entries(distribucion)
    return (
        <div className="w-full">
            <div className="flex h-6 rounded-lg overflow-hidden w-full">
                {entries.map(([key, val], i) => {
                    const pct = (val / total) * 100
                    return (
                        <div key={key} style={{ width: `${pct}%`, backgroundColor: colores[i % colores.length] }}
                             title={`${key}: ${val} (${pct.toFixed(0)}%)`} />
                    )
                })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {entries.map(([key, val], i) => (
                    <div key={key} className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                             style={{ backgroundColor: colores[i % colores.length] }} />
                        {key}: <strong>{val}</strong> ({((val/total)*100).toFixed(0)}%)
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ReportesFichasTab() {
    const [rutas,        setRutas]        = useState([])
    const [rutaId,       setRutaId]       = useState('')
    const [cargando,     setCargando]     = useState(false)
    const [error,        setError]        = useState('')

    // Datos
    const [datosPre,     setDatosPre]     = useState([])
    const [datosPost,    setDatosPost]    = useState([])

    // Vistas
    const [vistaMain,    setVistaMain]    = useState('grupo')   // grupo | individual
    const [vistaPeriodo, setVistaPeriodo] = useState('pre')     // pre | post
    const [seccionPre,   setSeccionPre]   = useState('fisica')
    const [seccionPost,  setSeccionPost]  = useState('fisica_post')
    const [vistaGrafica, setVistaGrafica] = useState('barras')

    // Vista individual
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
        setDatosPre([])
        setDatosPost([])
        try {
            const [resPre, resPost] = await Promise.all([
                api.get(`/reportes/fichas/comparativa?rutaId=${rutaId}`),
                api.get(`/reportes/fichas/distribucion-post?rutaId=${rutaId}`),
            ])
            setDatosPre(resPre.data)
            setDatosPost(resPost.data)
        } catch {
            setError('No se pudieron cargar los datos. Verifica que existan fichas completadas.')
        } finally {
            setCargando(false)
        }
    }

    // ── Lógica PRE ───────────────────────────────────────────
    const seccionPreActual = SECCIONES_PRE.find(s => s.id === seccionPre)
    const maxEscala        = seccionPre === 'emocional' ? 4 : 5
    const datosSeccionPre  = datosPre
        .filter(d => seccionPreActual?.ordenes.includes(d.orden))
        .map(d => ({ nombre: limpiarTexto(d.pregunta), valor: d.promedioPre ?? 0 }))

    const promedioSeccionPre = datosSeccionPre.length > 0
        ? (datosSeccionPre.reduce((s, d) => s + d.valor, 0) / datosSeccionPre.length).toFixed(2)
        : '—'

    // ── Lógica POST ──────────────────────────────────────────
    const seccionPostActual = SECCIONES_POST.find(s => s.id === seccionPost)
    const datosSeccionPost  = datosPost.filter(d => seccionPostActual?.ordenes.includes(d.orden))

    // Colores según sección POST
    const coloresPost = ['sintomas_post'].includes(seccionPost)
        ? COLORES_POSITIVO  // Disminuyó = verde (buena noticia)
        : ['fisica_post', 'emocional_post', 'frecuencia'].includes(seccionPost)
            ? COLORES_POSITIVO
            : COLORES_PIE

    // Para pie chart — primer item de la sección
    const dataPie = datosSeccionPost.length > 0
        ? Object.entries(datosSeccionPost[0].distribucion).map(([k, v]) => ({ nombre: k, valor: v }))
        : []

    // Buscar participante
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

    const hayDatos = datosPre.length > 0 || datosPost.length > 0

    return (
        <div className="flex flex-col gap-5">

            {/* Selector vista */}
            <div className="flex gap-2">
                {[
                    { id: 'grupo',      label: '📊 Vista grupal'   },
                    { id: 'individual', label: '👤 Vista individual' },
                ].map(v => (
                    <button key={v.id} onClick={() => setVistaMain(v.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                vistaMain === v.id
                                    ? 'bg-green-700 text-white border-green-700'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}>
                        {v.label}
                    </button>
                ))}
            </div>

            {/* ══ VISTA GRUPAL ══ */}
            {vistaMain === 'grupo' && (
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
                            Consultando fichas PRE y POST…
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center">{error}</div>
                    )}

                    {!cargando && hayDatos && (
                        <>
                            {/* Toggle PRE / POST */}
                            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                                <button onClick={() => setVistaPeriodo('pre')}
                                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                            vistaPeriodo === 'pre'
                                                ? 'bg-white text-gray-800 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}>
                                    📋 Diagnóstico PRE
                                </button>
                                <button onClick={() => setVistaPeriodo('post')}
                                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                            vistaPeriodo === 'post'
                                                ? 'bg-white text-gray-800 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}>
                                    ✅ Resultados POST
                                </button>
                            </div>

                            {/* ── PANEL PRE ── */}
                            {vistaPeriodo === 'pre' && (
                                <>
                                    {/* Cards resumen */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {SECCIONES_PRE.map(s => {
                                            const ds  = datosPre.filter(d => s.ordenes.includes(d.orden))
                                            const max = s.id === 'emocional' ? 4 : 5
                                            const prom = ds.length > 0
                                                ? (ds.reduce((a, d) => a + (d.promedioPre ?? 0), 0) / ds.length).toFixed(1)
                                                : '—'
                                            return (
                                                <div key={s.id} onClick={() => setSeccionPre(s.id)}
                                                     className={`rounded-2xl p-4 cursor-pointer transition-all border-2 ${
                                                         seccionPre === s.id ? 'border-gray-400 shadow-sm' : 'border-transparent'
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

                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                                        {/* Tabs + toggle */}
                                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-3">
                                            <div className="flex gap-2 flex-wrap">
                                                {SECCIONES_PRE.map(s => (
                                                    <button key={s.id} onClick={() => setSeccionPre(s.id)}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                                                seccionPre === s.id ? 'text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                            style={seccionPre === s.id ? { backgroundColor: seccionPreActual?.color } : {}}>
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

                                        <p className="text-xs text-gray-400">{seccionPreActual?.descripcion}</p>

                                        {datosSeccionPre.length > 0 ? (
                                            vistaGrafica === 'barras' ? (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={datosSeccionPre} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                                                        <YAxis domain={[0, maxEscala]} tick={{ fontSize: 12 }} />
                                                        <Tooltip content={<TooltipPre seccion={seccionPreActual} />} />
                                                        <Bar dataKey="valor" fill={seccionPreActual?.color} radius={[6, 6, 0, 0]}
                                                             label={{ position: 'top', fontSize: 11, fill: seccionPreActual?.color,
                                                                 formatter: v => v.toFixed(1) }} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <RadarChart data={datosSeccionPre}>
                                                        <PolarGrid />
                                                        <PolarAngleAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                                                        <PolarRadiusAxis domain={[0, maxEscala]} tick={{ fontSize: 10 }} />
                                                        <Radar name="Promedio PRE" dataKey="valor"
                                                               stroke={seccionPreActual?.color}
                                                               fill={seccionPreActual?.color} fillOpacity={0.35} />
                                                        <Legend />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            )
                                        ) : (
                                            <p className="text-sm text-gray-400 text-center py-8">Sin datos.</p>
                                        )}

                                        {/* Tabla PRE */}
                                        {datosSeccionPre.length > 0 && (
                                            <table className="w-full text-xs">
                                                <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                    <th className="text-left px-3 py-2 font-semibold text-gray-500">Dimensión</th>
                                                    <th className="text-center px-3 py-2 font-semibold text-gray-500">Promedio</th>
                                                    <th className="text-center px-3 py-2 font-semibold text-gray-500">Nivel</th>
                                                    <th className="text-center px-3 py-2 font-semibold text-gray-500">Barra</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {datosSeccionPre.map((d, i) => {
                                                    const pct   = (d.valor / maxEscala) * 100
                                                    const nivel = seccionPreActual?.inversion
                                                        ? d.valor >= 3.5 ? { label: 'Alto ⚠️',   color: 'text-red-600'   }
                                                            : d.valor >= 2.5 ? { label: 'Moderado', color: 'text-amber-600' }
                                                                : { label: 'Bajo ✓',  color: 'text-green-600' }
                                                        : d.valor >= 4   ? { label: 'Bueno ✓',  color: 'text-green-600' }
                                                            : d.valor >= 3 ? { label: 'Moderado', color: 'text-amber-600' }
                                                                : { label: 'Bajo ⚠️', color: 'text-red-600'   }
                                                    return (
                                                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                                            <td className="px-3 py-2 text-gray-700">{d.nombre}</td>
                                                            <td className="px-3 py-2 text-center font-semibold text-gray-800">
                                                                {d.valor.toFixed(2)}<span className="text-gray-400"> /{maxEscala}</span>
                                                            </td>
                                                            <td className={`px-3 py-2 text-center font-semibold ${nivel.color}`}>{nivel.label}</td>
                                                            <td className="px-3 py-2 w-32">
                                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                                    <div className="h-2 rounded-full"
                                                                         style={{ width: `${pct}%`, backgroundColor: seccionPreActual?.color }} />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                                <tr className="bg-gray-50">
                                                    <td className="px-3 py-2 font-semibold text-gray-600">Promedio sección</td>
                                                    <td className="px-3 py-2 text-center font-bold" style={{ color: seccionPreActual?.color }}>
                                                        {promedioSeccionPre} /{maxEscala}
                                                    </td>
                                                    <td colSpan={2} />
                                                </tr>
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ── PANEL POST ── */}
                            {vistaPeriodo === 'post' && (
                                <>
                                    {/* Tabs POST */}
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                                        <div className="flex gap-2 flex-wrap border-b border-gray-100 pb-3">
                                            {SECCIONES_POST.map(s => (
                                                <button key={s.id} onClick={() => setSeccionPost(s.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                                            seccionPost === s.id
                                                                ? 'bg-green-700 text-white'
                                                                : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                                                        }`}>
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>

                                        {datosSeccionPost.length === 0 && (
                                            <p className="text-sm text-gray-400 text-center py-8">Sin datos POST para esta sección.</p>
                                        )}

                                        {/* Distribución por dimensión */}
                                        {seccionPostActual?.tipo === 'distribucion' && datosSeccionPost.length > 0 && (
                                            <div className="flex flex-col gap-5">
                                                {datosSeccionPost.map((d, i) => (
                                                    <div key={i} className="flex flex-col gap-2">
                                                        <p className="text-sm font-semibold text-gray-700">{limpiarTexto(d.pregunta)}</p>
                                                        <BarraDistribucion
                                                            distribucion={d.distribucion}
                                                            total={d.total}
                                                            colores={coloresPost}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Pie chart */}
                                        {seccionPostActual?.tipo === 'pie' && dataPie.length > 0 && (
                                            <div className="flex flex-col gap-4">
                                                <p className="text-sm font-semibold text-gray-700">
                                                    {limpiarTexto(datosSeccionPost[0]?.pregunta || '')}
                                                </p>
                                                <div className="flex gap-6 items-center flex-wrap">
                                                    <ResponsiveContainer width={260} height={220}>
                                                        <PieChart>
                                                            <Pie data={dataPie} dataKey="valor" nameKey="nombre"
                                                                 cx="50%" cy="50%" outerRadius={90}
                                                                 label={({ percent }) => `${(percent*100).toFixed(0)}%`}>
                                                                {dataPie.map((_, i) => (
                                                                    <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip formatter={(val) => [`${val} participantes`]} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="flex flex-col gap-2">
                                                        {dataPie.map((d, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-sm">
                                                                <div className="w-3 h-3 rounded-sm flex-shrink-0"
                                                                     style={{ backgroundColor: COLORES_PIE[i % COLORES_PIE.length] }} />
                                                                <span className="text-gray-600">{d.nombre}:</span>
                                                                <span className="font-semibold">{d.valor}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Estrategias POST */}
                                        {seccionPostActual?.tipo === 'estrategias' && datosSeccionPost.length > 0 && (
                                            <div className="flex flex-col gap-4">
                                                <p className="text-xs text-gray-400">Frecuencia de uso de estrategias para manejar emociones y estrés (POST)</p>
                                                {datosSeccionPost.map((d, i) => (
                                                    <div key={i} className="flex flex-col gap-1.5">
                                                        <p className="text-xs font-semibold text-gray-700">{limpiarTexto(d.pregunta)}</p>
                                                        <BarraDistribucion
                                                            distribucion={d.distribucion}
                                                            total={d.total}
                                                            colores={COLORES_POSITIVO}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ══ VISTA INDIVIDUAL ══ */}
            {vistaMain === 'individual' && (
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
                                                    const respPost = f.post && qPost
                                                        ? f.post.respuestas.find(r => r.preguntaId === qPost.id)
                                                        : null
                                                    return (
                                                        <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                            <td className="px-3 py-2 text-gray-700 max-w-xs">
                                                                <p className="truncate">{limpiarTexto(q.texto)}</p>
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