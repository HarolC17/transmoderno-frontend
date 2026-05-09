import { useState, useEffect } from 'react'
import api from '../../api/axios'
import {
    obtenerPreguntasPorRutaYFicha,
    obtenerFichaPre,
    obtenerFichaPost,
    crearFichaPre,
    crearFichaPost,
} from '../../api/fichasApi'

const fondoEstilo = {
    backgroundImage: 'linear-gradient(rgba(0,40,10,0.4), rgba(0,0,0,0.2)), url(/fondo.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
}

const contenedorEstilo = {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 -4px 30px rgba(0,0,0,0.25)',
    marginTop: '28px',
    borderRadius: '20px 20px 0 0',
    minHeight: 'calc(100vh - 28px)',
    overflow: 'hidden',
}

// Preguntas que se auto-rellenan desde el participante — no se muestran en el formulario
const ORDENES_AUTO = [1, 2, 3]

// Mapeo de datos del participante a las preguntas automáticas
// orden 1 = Unidad Regional, orden 2 = Estamento, orden 3 = Número de identificación
function buildRespuestasAuto(preguntas, participante) {
    const auto = {}
    preguntas.forEach(p => {
        if (p.orden === 1) {
            // Unidad Regional — tomamos la sede del participante
            // Normalizamos: "UNIDAD REGIONAL, SEDE FUSAGASUGÁ" → "Fusagasugá"
            const sedeRaw = participante.sede || ''
            const match = sedeRaw.match(/SEDE\s+(\w+)/i)
            const sede = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() : sedeRaw
            auto[p.id] = sede
        }
        if (p.orden === 2) {
            // Estamento
            const estamentoRaw = participante.estamento || ''
            auto[p.id] = estamentoRaw.charAt(0).toUpperCase() + estamentoRaw.slice(1).toLowerCase()
        }
        if (p.orden === 3) {
            // Número de identificación
            auto[p.id] = participante.numeroIdentificacion || ''
        }
    })
    return auto
}

export default function FichasPage({ participante, onVolver }) {
    const [vista, setVista] = useState('cargando')
    const [inscripciones, setInscripciones] = useState([])
    const [estadoFichas, setEstadoFichas] = useState({})
    const [rutasMap, setRutasMap] = useState({})
    const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState(null)
    const [tipFicha, setTipFicha] = useState(null)
    const [preguntas, setPreguntas] = useState([])
    const [preguntasVisibles, setPreguntasVisibles] = useState([]) // sin las auto
    const [respuestas, setRespuestas] = useState({})
    const [fichaPreId, setFichaPreId] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')
    const [preguntaActual, setPreguntaActual] = useState(0)

    useEffect(() => { cargarInscripciones() }, [])

    const cargarInscripciones = async () => {
        try {
            const resRutas = await api.get('/rutas')
            const mapa = {}
            resRutas.data.forEach(r => { mapa[r.id] = r })
            setRutasMap(mapa)

            const res = await api.get(`/inscripciones/participante/${participante.numeroIdentificacion}`)
            const activas = res.data.filter(i => i.estado === 'ACTIVA')
            setInscripciones(activas)
            await cargarEstadoFichas(activas)
            setVista('seleccion')
        } catch {
            setInscripciones([])
            setVista('seleccion')
        }
    }

    const cargarEstadoFichas = async (inscripcionesActivas) => {
        const estado = {}
        for (const ins of inscripcionesActivas) {
            estado[ins.id] = { pre: null, post: null }
            try {
                const resPre = await obtenerFichaPre(ins.id)
                estado[ins.id].pre = resPre.data
                try {
                    const resPost = await obtenerFichaPost(resPre.data.id)
                    estado[ins.id].post = resPost.data
                } catch {}
            } catch {}
        }
        setEstadoFichas(estado)
    }

    const iniciarFicha = async (inscripcion, tipo) => {
        setError('')
        setInscripcionSeleccionada(inscripcion)
        setTipFicha(tipo)
        setPreguntaActual(0)

        if (tipo === 'POST') {
            setFichaPreId(estadoFichas[inscripcion.id]?.pre?.id)
        }

        try {
            const res = await obtenerPreguntasPorRutaYFicha(inscripcion.rutaId, tipo)
            const todasPreguntas = res.data.sort((a, b) => a.orden - b.orden)

            // Separar preguntas automáticas de las visibles
            const visibles = todasPreguntas.filter(p => !ORDENES_AUTO.includes(p.orden))
            const autoRespuestas = buildRespuestasAuto(todasPreguntas, participante)

            setPreguntas(todasPreguntas)
            setPreguntasVisibles(visibles)
            setRespuestas(autoRespuestas) // pre-cargar respuestas automáticas
            setVista('formulario')
        } catch {
            setError('No se pudieron cargar las preguntas. Intenta de nuevo.')
        }
    }

    const handleRespuesta = (preguntaId, valor) => {
        setRespuestas(prev => ({ ...prev, [preguntaId]: valor }))
    }

    const siguiente = () => {
        const pregunta = preguntasVisibles[preguntaActual]
        const val = respuestas[pregunta.id]
        if (val === undefined || val === null || val === '') {
            setError('Por favor responde esta pregunta antes de continuar.')
            return
        }
        setError('')
        if (preguntaActual < preguntasVisibles.length - 1) {
            setPreguntaActual(prev => prev + 1)
        } else {
            enviarFicha()
        }
    }

    const anterior = () => {
        setError('')
        if (preguntaActual > 0) setPreguntaActual(prev => prev - 1)
    }

    const enviarFicha = async () => {
        setGuardando(true)
        setError('')
        try {
            // Construir array de respuestas — incluye automáticas + manuales
            const respuestasArray = Object.entries(respuestas).map(([preguntaId, valor]) => ({
                preguntaId: Number(preguntaId),
                valor: String(valor),
            }))

            if (tipFicha === 'PRE') {
                await crearFichaPre({
                    inscripcionId: inscripcionSeleccionada.id,
                    respuestas: respuestasArray,
                })
            } else {
                await crearFichaPost({
                    fichaPreId: fichaPreId,
                    respuestas: respuestasArray,
                })
            }
            setVista('completado')
        } catch (e) {
            setError(e.response?.data?.mensaje || 'Error al guardar la ficha. Intenta de nuevo.')
        } finally {
            setGuardando(false)
        }
    }

    // ── CARGANDO ──────────────────────────────────────────────
    if (vista === 'cargando') {
        return (
            <div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
                <div className="w-full max-w-md" style={contenedorEstilo}>
                    <Header onVolver={onVolver} />
                    <div className="p-8 text-center text-gray-400 text-sm">Cargando fichas...</div>
                </div>
            </div>
        )
    }

    // ── COMPLETADO ────────────────────────────────────────────
    if (vista === 'completado') {
        return (
            <div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
                <div className="w-full max-w-md" style={contenedorEstilo}>
                    <Header onVolver={onVolver} />
                    <div className="p-6 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✅</div>
                        <h3 className="text-lg font-semibold text-gray-800">¡Ficha {tipFicha} registrada!</h3>
                        <p className="text-sm text-gray-500">Tu cuestionario de bienestar fue guardado correctamente.</p>
                        <button
                            onClick={() => { setVista('cargando'); cargarInscripciones() }}
                            className="w-full bg-green-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-800 transition-all">
                            Volver a mis fichas
                        </button>
                        <button onClick={onVolver} className="text-xs text-gray-400 hover:text-gray-600">
                            Ir al inicio
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── FORMULARIO ────────────────────────────────────────────
    if (vista === 'formulario') {
        const pregunta = preguntasVisibles[preguntaActual]
        const progreso = Math.round(((preguntaActual + 1) / preguntasVisibles.length) * 100)
        const esUltima = preguntaActual === preguntasVisibles.length - 1
        const opciones = pregunta.opciones ? JSON.parse(pregunta.opciones) : []

        return (
            <div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
                <div className="w-full max-w-md" style={contenedorEstilo}>
                    <div className="bg-green-800 px-6 py-5">
                        <div className="flex items-center gap-3 mb-3">
                            <button onClick={() => setVista('seleccion')} className="text-green-200 text-2xl leading-none">‹</button>
                            <div>
                                <h2 className="text-white font-semibold text-base">Ficha {tipFicha}</h2>
                                <p className="text-green-300 text-xs">{inscripcionSeleccionada?.nombreRuta || 'Bienestar'}</p>
                            </div>
                            <span className="ml-auto text-green-200 text-xs">{preguntaActual + 1} / {preguntasVisibles.length}</span>
                        </div>
                        <div className="w-full bg-green-900 rounded-full h-1.5">
                            <div className="bg-green-300 h-1.5 rounded-full transition-all duration-300"
                                 style={{ width: `${progreso}%` }} />
                        </div>
                    </div>

                    {/* Info auto-llenada del participante */}
                    <div className="bg-green-50 border-b border-green-100 px-5 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-sm flex-shrink-0">👤</div>
                        <div>
                            <p className="text-xs font-semibold text-green-800">{participante.nombreCompleto}</p>
                            <p className="text-xs text-green-600">
                                {participante.numeroIdentificacion} · {participante.sede?.replace('UNIDAD REGIONAL, SEDE ', '') || ''}
                            </p>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col gap-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">{error}</div>
                        )}

                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                            <p className="text-sm font-semibold text-gray-800 leading-relaxed">{pregunta.texto}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            {/* SELECCION */}
                            {pregunta.tipo === 'SELECCION' && opciones.map((op) => (
                                <button key={op} onClick={() => handleRespuesta(pregunta.id, op)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                                            respuestas[pregunta.id] === op
                                                ? 'bg-green-700 text-white border-green-700 font-semibold'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-green-400'
                                        }`}>
                                    {op}
                                </button>
                            ))}

                            {/* ESCALA_1_5 y ESCALA_0_4 */}
                            {(pregunta.tipo === 'ESCALA_1_5' || pregunta.tipo === 'ESCALA_0_4') && opciones.map((op) => {
                                const val = op.split(' - ')[0]
                                return (
                                    <button key={val} onClick={() => handleRespuesta(pregunta.id, val)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                                                respuestas[pregunta.id] === val
                                                    ? 'bg-green-700 text-white border-green-700 font-semibold'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-green-400'
                                            }`}>
                                        {op}
                                    </button>
                                )
                            })}

                            {/* SI_NO */}
                            {pregunta.tipo === 'SI_NO' && (
                                <div className="flex gap-3">
                                    {opciones.map((op) => (
                                        <button key={op} onClick={() => handleRespuesta(pregunta.id, op)}
                                                className={`flex-1 py-4 rounded-xl text-sm font-semibold border transition-all ${
                                                    respuestas[pregunta.id] === op
                                                        ? op === 'Sí'
                                                            ? 'bg-green-700 text-white border-green-700'
                                                            : 'bg-gray-700 text-white border-gray-700'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-green-400'
                                                }`}>
                                            {op === 'Sí' ? '✓ Sí' : '✗ No'}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* NUMERO */}
                            {pregunta.tipo === 'NUMERO' && (
                                <input type="number" step="0.01"
                                       value={respuestas[pregunta.id] || ''}
                                       onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
                                       placeholder="Ingresa un valor numérico"
                                       className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 w-full"/>
                            )}

                            {/* TEXTO */}
                            {pregunta.tipo === 'TEXTO' && (
                                <input type="text"
                                       value={respuestas[pregunta.id] || ''}
                                       onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
                                       placeholder="Escribe tu respuesta"
                                       className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 w-full"/>
                            )}
                        </div>

                        <div className="flex gap-2 mt-2">
                            {preguntaActual > 0 && (
                                <button onClick={anterior}
                                        className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition-all">
                                    ← Anterior
                                </button>
                            )}
                            <button onClick={siguiente} disabled={guardando}
                                    className="flex-1 bg-green-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                                {guardando ? 'Guardando...' : esUltima ? 'Finalizar ✓' : 'Siguiente →'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ── SELECCIÓN ─────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
            <div className="w-full max-w-md" style={contenedorEstilo}>
                <Header onVolver={onVolver} />
                <div className="p-4 flex flex-col gap-3">
                    {inscripciones.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 text-center">
                            No tienes inscripciones activas en ninguna ruta.
                        </div>
                    ) : (
                        inscripciones.map((ins) => {
                            const estado = estadoFichas[ins.id] || {}
                            const tienePre = !!estado.pre
                            const tienePost = !!estado.post
                            const postHabilitado = rutasMap[ins.rutaId]?.postHabilitado === true

                            return (
                                <div key={ins.id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-base">🏃</div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{ins.nombreRuta || `Ruta ${ins.rutaId}`}</p>
                                            <p className="text-xs text-gray-400">Inscripción activa</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {tienePre ? (
                                            <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                                <p className="text-xs font-semibold text-green-700">✓ PRE completada</p>
                                            </div>
                                        ) : (
                                            <button onClick={() => iniciarFicha(ins, 'PRE')}
                                                    className="flex-1 bg-blue-600 text-white rounded-xl p-3 text-xs font-semibold hover:bg-blue-700 transition-all">
                                                📋 Llenar PRE
                                            </button>
                                        )}

                                        {tienePost ? (
                                            <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                                <p className="text-xs font-semibold text-green-700">✓ POST completada</p>
                                            </div>
                                        ) : tienePre && postHabilitado ? (
                                            <button onClick={() => iniciarFicha(ins, 'POST')}
                                                    className="flex-1 bg-purple-600 text-white rounded-xl p-3 text-xs font-semibold hover:bg-purple-700 transition-all">
                                                📋 Llenar POST
                                            </button>
                                        ) : tienePre && !postHabilitado ? (
                                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                                                <p className="text-xs text-gray-400">POST — No disponible aún</p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                                                <p className="text-xs text-gray-400">POST — Requiere PRE</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

function Header({ onVolver }) {
    return (
        <div className="bg-green-800 px-6 py-5 flex items-center gap-3">
            <button onClick={onVolver} className="text-green-200 text-2xl leading-none">‹</button>
            <div>
                <h2 className="text-white font-semibold text-base">Fichas de bienestar</h2>
                <p className="text-green-300 text-xs">Cuestionario de seguimiento</p>
            </div>
        </div>
    )
}