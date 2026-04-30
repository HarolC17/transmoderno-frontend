import { useState, useEffect } from 'react'
import api from '../../api/axios'

const MOTIVOS = [
    'Falta de tiempo',
    'Problemas personales',
    'Cambio de horario',
    'Desinterés',
    'Otro'
]

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

export default function PerfilPage({ participante, onVolver, onActualizar }) {
    const [rutas, setRutas] = useState([])
    const [inscripciones, setInscripciones] = useState([])
    const [form, setForm] = useState({
        semestre: participante.semestre || '',
        telefono: participante.telefono || '',
    })
    const [guardando, setGuardando] = useState(false)
    const [inscribiendo, setInscribiendo] = useState(false)
    const [exito, setExito] = useState('')
    const [error, setError] = useState('')
    const [mostrarNuevaInscripcion, setMostrarNuevaInscripcion] = useState(false)
    const [rutaSeleccionada, setRutaSeleccionada] = useState('')
    const [modalCancelar, setModalCancelar] = useState(null)
    const [motivoSeleccionado, setMotivoSeleccionado] = useState('')
    const [cancelando, setCancelando] = useState(false)

    useEffect(() => {
        api.get('/rutas').then(res => setRutas(res.data.filter(r => r.activa)))
        api.get(`/inscripciones/participante/${participante.numeroIdentificacion}`)
            .then(res => setInscripciones(res.data))
    }, [])

    const rutasDisponibles = rutas.filter(r =>
        !inscripciones.some(i => i.rutaId === r.id && i.estado === 'ACTIVA')
    )

    const handleGuardar = async () => {
        setGuardando(true)
        setError('')
        setExito('')
        try {
            const res = await api.put(`/participantes/${participante.id}`, {
                numeroIdentificacion: participante.numeroIdentificacion,
                nombreCompleto: participante.nombreCompleto,
                correoInstitucional: participante.correoInstitucional,
                programaAcademico: participante.programaAcademico,
                semestre: form.semestre ? parseInt(form.semestre) : null,
                tipoDocumento: participante.tipoDocumento,
                sede: participante.sede,
                telefono: form.telefono,
                estamento: participante.estamento
            })
            onActualizar(res.data)
            setExito('Datos actualizados correctamente.')
        } catch {
            setError('Error al guardar. Intenta de nuevo.')
        } finally {
            setGuardando(false)
        }
    }

    const handleInscribir = async () => {
        if (!rutaSeleccionada) return
        setInscribiendo(true)
        setError('')
        try {
            await api.post('/inscripciones', {
                numeroIdentificacion: participante.numeroIdentificacion,
                rutaId: parseInt(rutaSeleccionada)
            })
            const res = await api.get(`/inscripciones/participante/${participante.numeroIdentificacion}`)
            setInscripciones(res.data)
            setMostrarNuevaInscripcion(false)
            setRutaSeleccionada('')
            setExito('Inscripción realizada correctamente.')
        } catch {
            setError('Error al inscribirse. Intenta de nuevo.')
        } finally {
            setInscribiendo(false)
        }
    }

    const handleConfirmarCancelar = async () => {
        if (!motivoSeleccionado) return
        setCancelando(true)
        try {
            await api.patch(`/inscripciones/${modalCancelar.id}/cancelar`, {
                motivo: motivoSeleccionado
            })
            const res = await api.get(`/inscripciones/participante/${participante.numeroIdentificacion}`)
            setInscripciones(res.data)
            setModalCancelar(null)
            setMotivoSeleccionado('')
            setExito('Inscripción cancelada.')
        } catch {
            setError('Error al cancelar. Intenta de nuevo.')
        } finally {
            setCancelando(false)
        }
    }

    const esEstudiante = participante.estamento === 'ESTUDIANTE'

    return (
        <div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
            <div className="w-full max-w-md" style={contenedorEstilo}>

                {/* Modal cancelar inscripción */}
                {modalCancelar && (
                    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
                         onClick={() => { setModalCancelar(null); setMotivoSeleccionado('') }}>
                        <div className="bg-white rounded-t-2xl p-6 w-full max-w-md flex flex-col gap-4"
                             onClick={e => e.stopPropagation()}>
                            <div>
                                <h3 className="text-base font-semibold text-gray-800">¿Por qué deseas cancelar?</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Tu respuesta nos ayuda a mejorar el programa</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {MOTIVOS.map(m => (
                                    <button key={m} onClick={() => setMotivoSeleccionado(m)}
                                            className={`px-4 py-3 rounded-xl text-sm text-left transition-all
                                                ${motivoSeleccionado === m
                                                ? 'bg-green-700 text-white font-semibold'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleConfirmarCancelar}
                                    disabled={!motivoSeleccionado || cancelando}
                                    className="bg-red-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50">
                                {cancelando ? 'Cancelando...' : 'Confirmar cancelación'}
                            </button>
                            <button onClick={() => { setModalCancelar(null); setMotivoSeleccionado('') }}
                                    className="border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                                Volver
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-green-800 px-6 py-5 flex items-center gap-3">
                    <button onClick={onVolver} className="text-green-200 text-2xl leading-none">‹</button>
                    <div>
                        <h2 className="text-white font-semibold text-base">Mi perfil</h2>
                        <p className="text-green-300 text-xs">{participante.nombreCompleto}</p>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-4">

                    {exito && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                            ✅ {exito}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                            {error}
                        </div>
                    )}

                    {/* 1. Inscripciones */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                        <p className="text-xs font-semibold text-gray-500">Mis rutas</p>

                        {inscripciones.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-2">No tienes inscripciones registradas.</p>
                        ) : (
                            inscripciones.map(i => (
                                <div key={i.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{i.nombreRuta}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                                            ${i.estado === 'ACTIVA' ? 'bg-green-100 text-green-700'
                                            : i.estado === 'INACTIVA' ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-gray-100 text-gray-500'}`}>
                                            {i.estado}
                                        </span>
                                    </div>
                                    {i.estado === 'ACTIVA' && (
                                        <button onClick={() => setModalCancelar(i)}
                                                className="text-xs text-red-500 hover:text-red-700 font-semibold transition-all">
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            ))
                        )}

                        {rutasDisponibles.length > 0 && !mostrarNuevaInscripcion && (
                            <button onClick={() => setMostrarNuevaInscripcion(true)}
                                    className="w-full bg-green-50 border-2 border-dashed border-green-300 text-green-700 rounded-xl py-3 text-sm font-semibold hover:bg-green-100 transition-all flex items-center justify-center gap-2">
                                + Inscribirme en otra ruta
                            </button>
                        )}

                        {mostrarNuevaInscripcion && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex flex-col gap-2">
                                <p className="text-xs font-semibold text-gray-600">Selecciona una ruta</p>
                                <select value={rutaSeleccionada}
                                        onChange={e => setRutaSeleccionada(e.target.value)}
                                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-green-500">
                                    <option value="">Selecciona</option>
                                    {rutasDisponibles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                </select>
                                <div className="flex gap-2">
                                    <button onClick={handleInscribir} disabled={inscribiendo || !rutaSeleccionada}
                                            className="flex-1 bg-green-700 text-white rounded-xl py-2 text-xs font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                                        {inscribiendo ? 'Inscribiendo...' : 'Confirmar'}
                                    </button>
                                    <button onClick={() => { setMostrarNuevaInscripcion(false); setRutaSeleccionada('') }}
                                            className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2 text-xs hover:bg-gray-50 transition-all">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Datos editables */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                        <p className="text-xs font-semibold text-gray-500">Datos que puedes actualizar</p>

                        {esEstudiante && (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500">Semestre</label>
                                <select value={form.semestre}
                                        onChange={e => setForm({...form, semestre: e.target.value})}
                                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                    <option value="">Sin semestre</option>
                                    {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>{s}°</option>)}
                                </select>
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Teléfono</label>
                            <input type="tel" value={form.telefono}
                                   onChange={e => setForm({...form, telefono: e.target.value})}
                                   placeholder="Ej. 3001234567"
                                   className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500" />
                        </div>

                        <button onClick={handleGuardar} disabled={guardando}
                                className="bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>

                    {/* 3. Datos no editables */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Datos personales</p>
                        <InfoFila label="Nombre" valor={participante.nombreCompleto} />
                        <InfoFila label="Documento" valor={participante.numeroIdentificacion} />
                        <InfoFila label="Correo" valor={participante.correoInstitucional} />
                        <InfoFila label="Programa" valor={participante.programaAcademico} />
                        <InfoFila label="Estamento" valor={participante.estamento} />
                    </div>

                </div>
            </div>
        </div>
    )
}

function InfoFila({ label, valor }) {
    return (
        <div className="flex justify-between items-start gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
            <span className="text-xs font-medium text-gray-700 text-right">{valor || '—'}</span>
        </div>
    )
}