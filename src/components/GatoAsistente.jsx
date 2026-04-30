import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import gatoFeliz from '../assets/gato/gato-feliz.png'
import gatoPreocupado from '../assets/gato/gato-preocupado.png'
import gatoTriste from '../assets/gato/gato-triste.png'
import gatoPsicologo from '../assets/gato/gato-psicologo.png'

const imagenes = {
    feliz: gatoFeliz,
    preocupado: gatoPreocupado,
    triste: gatoTriste,
    psicologo: gatoPsicologo
}

const FLUJO_INICIAL = (nombre) => ({
    mensaje: `¡Hola, ${nombre}! ¿Cómo estás hoy? 🐾`,
    opciones: [
        { texto: '😊 Bien, gracias', respuesta: '¡Me alegra mucho! Sigue dándole duro al programa 💪', estadoGato: 'feliz', siguiente: 'fin' },
        { texto: '😐 Más o menos', respuesta: '¿Hay algo en lo que pueda ayudarte?', estadoGato: 'psicologo', siguiente: 'ayuda_opciones' },
        { texto: '😔 No tan bien', respuesta: 'Gracias por contarme, aquí estoy para ti 🤗', estadoGato: 'triste', siguiente: 'ayuda_opciones' },
    ]
})

const FLUJO_PREOCUPADO = (nombre) => ({
    mensaje: `¡${nombre}! Llevamos un tiempo sin verte por las sesiones 🥺 ¿Todo bien?`,
    opciones: [
        { texto: '✅ Sí, solo estuve ocupado', respuesta: '¡Me alegra que estés bien! Te esperamos pronto 😸', estadoGato: 'feliz', siguiente: 'fin' },
        { texto: '😔 No he estado muy bien', respuesta: 'Entiendo, es importante que te cuides 🤗', estadoGato: 'triste', siguiente: 'ayuda_opciones' },
    ]
})

const OPCIONES_AYUDA = [
    { texto: '🙋 Quiero hablar con alguien', respuesta: 'Te conecto con el equipo de Bienestar ahora mismo 💙', estadoGato: 'psicologo', siguiente: 'ir_ayuda' },
    { texto: '💬 Solo quería desahogarme', respuesta: 'Está bien, a veces necesitamos soltar. Recuerda que el movimiento también ayuda a liberar 🌿', estadoGato: 'psicologo', siguiente: 'fin' },
    { texto: '🧘 Necesito un respiro', respuesta: 'Respira profundo. Tres veces. Estás haciendo lo que puedes y eso es suficiente 💚', estadoGato: 'feliz', siguiente: 'fin' },
]

export default function GatoAsistente({ participante, inscripciones, onNavegar }) {
    const [abierto, setAbierto] = useState(false)
    const [estadoBoton, setEstadoBoton] = useState('psicologo')
    const [estadoChat, setEstadoChat] = useState('psicologo')
    const [mensajes, setMensajes] = useState([])
    const [opciones, setOpciones] = useState([])
    const [cargando, setCargando] = useState(true)
    const [bounce, setBounce] = useState(false)
    const [flujoInicial, setFlujoInicial] = useState(null)
    const chatRef = useRef(null)

    useEffect(() => {
        determinarEstadoBoton()
        const interval = setInterval(() => {
            setBounce(true)
            setTimeout(() => setBounce(false), 600)
        }, 4000)
        return () => clearInterval(interval)
    }, [participante])

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
    }, [mensajes])

    const determinarEstadoBoton = async () => {
        setCargando(true)
        try {
            const resAlerta = await api.get(`/alertas/inasistencia?page=0&size=100`)
            const estaEnAlerta = resAlerta.data.contenido.some(
                a => a.participanteId === participante.id && a.sesionesSinAsistir >= 3
            )
            if (estaEnAlerta) {
                setEstadoBoton('preocupado')
                setFlujoInicial(FLUJO_PREOCUPADO(participante.nombreCompleto.split(' ')[0]))
            } else {
                setEstadoBoton('psicologo')
                setFlujoInicial(FLUJO_INICIAL(participante.nombreCompleto.split(' ')[0]))
            }
        } catch {
            setEstadoBoton('psicologo')
            setFlujoInicial(FLUJO_INICIAL(participante.nombreCompleto.split(' ')[0]))
        } finally {
            setCargando(false)
        }
    }

    const abrirChat = () => {
        if (!abierto && flujoInicial) {
            setEstadoChat(estadoBoton)
            setMensajes([{ tipo: 'gato', texto: flujoInicial.mensaje, estadoGato: estadoBoton }])
            setOpciones(flujoInicial.opciones)
        }
        setAbierto(!abierto)
    }

    const handleOpcion = (opcion) => {
        const nuevosMensajes = [
            ...mensajes,
            { tipo: 'usuario', texto: opcion.texto },
            { tipo: 'gato', texto: opcion.respuesta, estadoGato: opcion.estadoGato }
        ]
        setMensajes(nuevosMensajes)
        setEstadoChat(opcion.estadoGato)

        if (opcion.siguiente === 'ir_ayuda') {
            setTimeout(() => { setAbierto(false); onNavegar('ayuda') }, 1200)
            setOpciones([])
        } else if (opcion.siguiente === 'fin') {
            setOpciones([{
                texto: '👋 ¡Hasta luego!',
                respuesta: '¡Cuídate mucho! Aquí estaré cuando me necesites 🐾',
                estadoGato: 'psicologo',
                siguiente: 'cerrar'
            }])
        } else if (opcion.siguiente === 'cerrar') {
            setTimeout(() => setAbierto(false), 800)
            setOpciones([])
        } else if (opcion.siguiente === 'ayuda_opciones') {
            setOpciones(OPCIONES_AYUDA)
        }
    }

    const posicionDerecha = 'max(16px, calc(50vw - 200px))'

    return (
        <>
            {abierto && (
                <div className="fixed bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden z-50"
                     style={{
                         bottom: '96px',
                         right: posicionDerecha,
                         width: '320px',
                         maxHeight: '480px'
                     }}>

                    {/* Header */}
                    <div className="bg-green-700 px-4 py-3 flex items-center gap-3">
                        <img src={imagenes[estadoChat]} alt="gato"
                             className="w-11 h-11 object-contain" />
                        <div className="flex-1">
                            <p className="text-white text-sm font-semibold">Asistente del Gimnasio</p>
                            <p className="text-green-200 text-xs">Siempre aquí para ti 🐾</p>
                        </div>
                        <button onClick={() => setAbierto(false)}
                                className="text-green-200 hover:text-white text-lg leading-none transition-all">
                            ✕
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div ref={chatRef}
                         className="flex-1 overflow-y-auto p-3 flex flex-col gap-2"
                         style={{ minHeight: '200px', maxHeight: '280px' }}>
                        {cargando ? (
                            <div className="text-center text-xs text-gray-400 py-4">Cargando...</div>
                        ) : (
                            mensajes.map((m, i) => (
                                <div key={i} className={`flex ${m.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                                    {m.tipo === 'gato' && (
                                        <img src={imagenes[m.estadoGato || estadoChat]} alt="gato"
                                             className="w-9 h-9 object-contain mr-2 self-end flex-shrink-0" />
                                    )}
                                    <div className={`px-3 py-2 rounded-2xl text-xs max-w-[200px]
                                        ${m.tipo === 'gato'
                                        ? 'bg-green-50 text-gray-700 rounded-bl-sm'
                                        : 'bg-green-700 text-white rounded-br-sm'}`}>
                                        {m.texto}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Opciones */}
                    {opciones.length > 0 && (
                        <div className="p-3 border-t border-gray-100 flex flex-col gap-1.5">
                            {opciones.map((o, i) => (
                                <button key={i} onClick={() => handleOpcion(o)}
                                        className="w-full text-left text-xs bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-100 rounded-xl px-3 py-2 transition-all text-gray-700">
                                    {o.texto}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Botón flotante */}
            <button
                onClick={abrirChat}
                className="fixed w-20 h-20 rounded-full bg-green-700 shadow-xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 border-4 border-white"
                style={{
                    bottom: '16px',
                    right: posicionDerecha,
                    transform: bounce ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'transform 0.3s ease'
                }}>
                <img src={imagenes[estadoBoton]} alt="gato asistente"
                     className="w-16 h-16 object-contain" />
            </button>
        </>
    )
}