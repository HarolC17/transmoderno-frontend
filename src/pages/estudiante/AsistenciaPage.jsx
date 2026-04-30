import { useState, useEffect } from 'react'
import { registrarAsistencia } from '../../api/asistenciaApi'
import { obtenerInscripcionesPorParticipante } from '../../api/inscripcionesApi'
import api from '../../api/axios'

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
    overflow: 'hidden'
}

export default function AsistenciaPage({ participante, sesionIdQR, onVolver }) {
    const [inscripciones, setInscripciones] = useState([])
    const [inscripcion, setInscripcion] = useState(null)
    const [sesionActiva, setSesionActiva] = useState(null)
    const [estado, setEstado] = useState('pendiente')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const [cargandoInicial, setCargandoInicial] = useState(true)

    useEffect(() => {
        const cargar = async () => {
            try {
                const resInscripciones = await obtenerInscripcionesPorParticipante(
                    participante.numeroIdentificacion
                )
                const activas = resInscripciones.data.filter(i => i.estado === 'ACTIVA')
                setInscripciones(activas)

                if (sesionIdQR) {
                    const resSesion = await api.get(`/sesiones/${sesionIdQR}`).catch(() => null)
                    if (!resSesion?.data) {
                        setError('No se pudo cargar la información de la sesión.')
                        return
                    }
                    const fechaSesion = resSesion.data.fecha
                    const hoy = new Date().toISOString().split('T')[0]
                    if (fechaSesion !== hoy) {
                        setError('El código QR corresponde a una sesión que ya pasó o aún no ha comenzado.')
                        return
                    }
                    const inscripcionCorrecta = activas.find(i => i.rutaId === resSesion.data.rutaId)
                    if (!inscripcionCorrecta) {
                        setError('Este código QR corresponde a una ruta en la que no estás inscrito.')
                        return
                    }
                    setInscripcion(inscripcionCorrecta)
                    setSesionActiva(resSesion.data)
                    return
                }

                if (activas.length === 1) {
                    setInscripcion(activas[0])
                    const resSesion = await api.get(`/sesiones/activa/${activas[0].rutaId}`).catch(() => null)
                    setSesionActiva(resSesion?.data || null)
                }
            } catch {
                setError('Error al cargar tus inscripciones.')
            } finally {
                setCargandoInicial(false)
            }
        }
        cargar()
    }, [])

    const handleSeleccionarRuta = async (insc) => {
        setInscripcion(insc)
        setError('')
        try {
            const resSesion = await api.get(`/sesiones/activa/${insc.rutaId}`).catch(() => null)
            setSesionActiva(resSesion?.data || null)
        } catch {
            setSesionActiva(null)
        }
    }

    const handleConfirmar = async () => {
        setCargando(true)
        setError('')
        try {
            await registrarAsistencia({
                numeroIdentificacion: participante.numeroIdentificacion,
                rutaId: inscripcion.rutaId
            })
            setEstado('confirmado')
        } catch (err) {
            const msg = err.response?.data?.mensaje || 'Error al registrar asistencia'
            setError(msg)
        } finally {
            setCargando(false)
        }
    }

    if (estado === 'confirmado') {
        return (
            <div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
                <div className="w-full max-w-md" style={contenedorEstilo}>
                    <div className="flex flex-col items-center justify-center gap-5 p-10 text-center">
                        <div className="text-7xl">✅</div>
                        <div>
                            <h2 className="text-2xl font-semibold text-green-700">¡Asistencia registrada!</h2>
                            <p className="text-gray-500 text-sm mt-2">Tu presencia quedó guardada exitosamente.</p>
                        </div>
                        <button onClick={onVolver}
                                className="bg-green-700 text-white rounded-xl py-3 px-8 text-sm font-semibold hover:bg-green-800 transition-all">
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
            <div className="w-full max-w-md" style={contenedorEstilo}>
                <div className="bg-green-800 px-6 py-5 flex items-center gap-3">
                    <button onClick={onVolver} className="text-green-200 text-2xl leading-none">‹</button>
                    <div>
                        <h2 className="text-white font-semibold text-base">Registrar asistencia</h2>
                        <p className="text-green-300 text-xs">
                            {sesionIdQR ? 'Sesión escaneada por QR' : 'Sesión de hoy'}
                        </p>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                    {cargandoInicial ? (
                        <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>

                    ) : inscripciones.length === 0 ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                            No tienes una inscripción activa en ninguna ruta.
                        </div>

                    ) : !inscripcion && inscripciones.length > 1 ? (
                        <>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                                Estás inscrito en varias rutas. ¿En cuál vas a participar hoy?
                            </div>
                            {inscripciones.map(i => (
                                <button key={i.id} onClick={() => handleSeleccionarRuta(i)}
                                        className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 active:scale-95 transition-all">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                                        ${i.nombreRuta === 'Energía sin Límite' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                                        {i.nombreRuta === 'Energía sin Límite' ? '🏃' : '💃'}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-semibold text-gray-800">{i.nombreRuta}</p>
                                        <p className="text-xs text-gray-400">Toca para seleccionar</p>
                                    </div>
                                    <span className="text-gray-300 text-lg">›</span>
                                </button>
                            ))}
                        </>

                    ) : error && !sesionActiva ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                            {error}
                        </div>

                    ) : !sesionActiva ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                            No hay una sesión activa en este momento para <strong>{inscripcion?.nombreRuta}</strong>. Vuelve cuando comience la sesión.
                        </div>

                    ) : (
                        <>
                            <div className="bg-green-800 rounded-2xl p-6 text-white text-center">
                                <div className="text-4xl mb-3">🏃</div>
                                <h3 className="text-lg font-semibold mb-1">Confirmar asistencia</h3>
                                <p className="text-green-300 text-sm mb-4">{sesionActiva.nombre}</p>
                                <div className="bg-white/10 rounded-xl p-3 text-sm text-left space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-green-300">Participante</span>
                                        <span className="font-semibold">{participante.nombreCompleto}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-300">Ruta</span>
                                        <span className="font-semibold">{inscripcion.nombreRuta}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-300">Sesión</span>
                                        <span className="font-semibold">{sesionActiva.nombre}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-300">Horario</span>
                                        <span className="font-semibold">{sesionActiva.horaInicio} - {sesionActiva.horaFin}</span>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                                    {error}
                                </div>
                            )}

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                                Solo puedes registrar asistencia una vez por sesión.
                            </div>

                            <button onClick={handleConfirmar} disabled={cargando}
                                    className="bg-green-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                                {cargando ? 'Registrando...' : '✓ Confirmar mi asistencia'}
                            </button>

                            {inscripciones.length > 1 && (
                                <button onClick={() => { setInscripcion(null); setSesionActiva(null); setError('') }}
                                        className="text-xs text-gray-400 hover:text-gray-600 transition-all">
                                    ← Seleccionar otra ruta
                                </button>
                            )}
                        </>
                    )}

                    <button onClick={onVolver}
                            className="border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition-all">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}