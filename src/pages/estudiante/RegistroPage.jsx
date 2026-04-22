import { useState, useEffect } from 'react'
import { registrarParticipante, buscarPorIdentificacion } from '../../api/participantesApi'
import { obtenerRutas } from '../../api/rutasApi'
import { inscribirParticipante } from '../../api/inscripcionesApi'
import api from '../../api/axios'

const ESTAMENTOS = ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'GRADUADO', 'COMUNIDAD']

export default function RegistroPage({ numeroIdentificacion, datosUcundinamarca, onExito, onVolver }) {
    const [rutas, setRutas] = useState([])
    const [programas, setProgramas] = useState([])
    const [rutaId, setRutaId] = useState('')
    const [semestre, setSemestre] = useState('')
    const [telefono, setTelefono] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    const [form, setForm] = useState({
        numeroIdentificacion: numeroIdentificacion || '',
        nombreCompleto: '',
        correoInstitucional: '',
        programaAcademico: '',
        semestre: '',
        rutaId: '',
        telefono: '',
        estamento: 'ESTUDIANTE'
    })

    useEffect(() => {
        obtenerRutas().then(res => setRutas(res.data.filter(r => r.activa)))
        api.get('/participantes/programas').then(res => setProgramas(res.data))
    }, [])

    const esEstudiante = form.estamento === 'ESTUDIANTE'

    const handleConfirmar = async (e) => {
        e.preventDefault()
        if (!rutaId || !semestre || !telefono) {
            setError('Completa semestre, teléfono y ruta para continuar.')
            return
        }
        setCargando(true)
        setError('')
        try {
            await registrarParticipante({
                numeroIdentificacion: datosUcundinamarca.documento,
                nombreCompleto: datosUcundinamarca.nombreCompleto,
                correoInstitucional: datosUcundinamarca.correoInstitucional,
                programaAcademico: datosUcundinamarca.pensum,
                semestre: parseInt(semestre),
                tipoDocumento: datosUcundinamarca.tipoDocumento,
                sede: datosUcundinamarca.sede,
                telefono: telefono,
                estamento: 'ESTUDIANTE'
            })
            await inscribirParticipante({
                numeroIdentificacion: datosUcundinamarca.documento,
                rutaId: parseInt(rutaId)
            })
            const res = await buscarPorIdentificacion(datosUcundinamarca.documento)
            onExito(res.data)
        } catch {
            setError('Ocurrió un error al registrar. Intenta de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setError('')
    }

    const handleSubmitManual = async (e) => {
        e.preventDefault()
        setCargando(true)
        setError('')
        try {
            await registrarParticipante({
                numeroIdentificacion: form.numeroIdentificacion,
                nombreCompleto: form.nombreCompleto,
                correoInstitucional: form.correoInstitucional,
                programaAcademico: form.programaAcademico,
                semestre: esEstudiante ? parseInt(form.semestre) : null,
                telefono: form.telefono,
                estamento: form.estamento
            })
            await inscribirParticipante({
                numeroIdentificacion: form.numeroIdentificacion,
                rutaId: parseInt(form.rutaId)
            })
            const res = await buscarPorIdentificacion(form.numeroIdentificacion)
            onExito(res.data)
        } catch {
            setError('Ocurrió un error. Verifica los datos e intenta de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    // Vista con datos de UCundinamarca
    if (datosUcundinamarca) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center">
                <div className="w-full max-w-md">
                    <div className="bg-green-800 px-6 py-5 flex items-center gap-3">
                        <button onClick={onVolver} className="text-green-200 text-2xl leading-none">‹</button>
                        <div>
                            <h2 className="text-white font-semibold text-base">¿Eres tú?</h2>
                            <p className="text-green-300 text-xs">Confirma tus datos antes de continuar</p>
                        </div>
                    </div>

                    <form onSubmit={handleConfirmar} className="p-4 flex flex-col gap-3">
                        <div className="bg-white border border-green-200 rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-green-700 text-lg">🎓</span>
                                <p className="text-sm font-semibold text-gray-800">Datos encontrados</p>
                            </div>
                            <CampoInfo label="Nombre" valor={datosUcundinamarca.nombreCompleto} />
                            <CampoInfo label="Documento" valor={`${datosUcundinamarca.tipoDocumento} ${datosUcundinamarca.documento}`} />
                            <CampoInfo label="Correo" valor={datosUcundinamarca.correoInstitucional} />
                            <CampoInfo label="Programa" valor={datosUcundinamarca.pensum} />
                            <CampoInfo label="Sede" valor={datosUcundinamarca.sede} />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Semestre *</label>
                            <select value={semestre} onChange={e => setSemestre(e.target.value)} required
                                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-green-500">
                                <option value="">Selecciona</option>
                                {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>{s}°</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Teléfono *</label>
                            <input
                                type="tel"
                                value={telefono}
                                onChange={e => setTelefono(e.target.value)}
                                placeholder="Ej. 3001234567"
                                required
                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-green-500 focus:bg-white"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Ruta *</label>
                            <select value={rutaId} onChange={e => setRutaId(e.target.value)} required
                                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-green-500">
                                <option value="">Selecciona tu ruta</option>
                                {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </select>
                        </div>

                        <button type="submit" disabled={cargando}
                                className="bg-green-700 text-white rounded-xl py-3 text-sm font-semibold mt-2 hover:bg-green-800 active:scale-95 transition-all disabled:opacity-50">
                            {cargando ? 'Registrando...' : 'Sí, soy yo. Registrarme →'}
                        </button>

                        <button type="button" onClick={onVolver}
                                className="border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition-all">
                            No soy yo
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // Vista manual
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <div className="w-full max-w-md">
                <div className="bg-green-800 px-6 py-5 flex items-center gap-3">
                    <button onClick={onVolver} className="text-green-200 text-2xl leading-none">‹</button>
                    <div>
                        <h2 className="text-white font-semibold text-base">Crear perfil</h2>
                        <p className="text-green-300 text-xs">Solo la primera vez</p>
                    </div>
                </div>

                <form onSubmit={handleSubmitManual} className="p-4 flex flex-col gap-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                        No encontramos tus datos en el sistema universitario. Completa el formulario manualmente.
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                            {error}
                        </div>
                    )}

                    <Campo label="Número de identificación *" name="numeroIdentificacion" value={form.numeroIdentificacion} onChange={handleChange} placeholder="Ej. 1000179920" />
                    <Campo label="Nombre completo *" name="nombreCompleto" value={form.nombreCompleto} onChange={handleChange} placeholder="Nombre y apellidos" />
                    <Campo label="Correo institucional *" name="correoInstitucional" value={form.correoInstitucional} onChange={handleChange} placeholder="usuario@ucundinamarca.edu.co" type="email" />
                    <Campo label="Teléfono *" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. 3001234567" type="tel" />

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Estamento *</label>
                        <select name="estamento" value={form.estamento} onChange={handleChange} required
                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-green-500">
                            {ESTAMENTOS.map(e => <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Programa académico *</label>
                        <select name="programaAcademico" value={form.programaAcademico} onChange={handleChange} required
                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-green-500">
                            <option value="">Selecciona tu programa</option>
                            {programas.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {esEstudiante && (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Semestre *</label>
                            <select name="semestre" value={form.semestre} onChange={handleChange} required={esEstudiante}
                                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-green-500">
                                <option value="">Selecciona</option>
                                {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>{s}°</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Ruta *</label>
                        <select name="rutaId" value={form.rutaId} onChange={handleChange} required
                                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-green-500">
                            <option value="">Selecciona tu ruta</option>
                            {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                    </div>

                    <button type="submit" disabled={cargando}
                            className="bg-green-700 text-white rounded-xl py-3 text-sm font-semibold mt-2 hover:bg-green-800 active:scale-95 transition-all disabled:opacity-50">
                        {cargando ? 'Creando perfil...' : 'Crear mi perfil →'}
                    </button>

                    <button type="button" onClick={onVolver}
                            className="border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition-all">
                        Cancelar
                    </button>
                </form>
            </div>
        </div>
    )
}

function CampoInfo({ label, valor }) {
    return (
        <div className="flex justify-between items-start gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
            <span className="text-xs font-medium text-gray-700 text-right">{valor}</span>
        </div>
    )
}

function Campo({ label, name, value, onChange, placeholder, type = 'text' }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">{label}</label>
            <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required
                   className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-green-500 focus:bg-white" />
        </div>
    )
}