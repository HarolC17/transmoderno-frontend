import {useState} from 'react'
import {useSearchParams} from 'react-router-dom'
import {buscarPorIdentificacion, buscarEnUcundinamarca} from '../../api/participantesApi'
import api from '../../api/axios'
import RegistroPage from './RegistroPage'
import AsistenciaPage from './AsistenciaPage'
import FichasPage from './FichasPage'
import AyudaPage from './AyudaPage'
import PerfilPage from './PerfilPage'
import GatoAsistente from '../../components/GatoAsistente'

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

export default function EstudiantePage() {
    const [participante, setParticipante] = useState(null)
    const [estudianteUcundinamarca, setEstudianteUcundinamarca] = useState(null)
    const [inscripciones, setInscripciones] = useState([])
    const [vista, setVista] = useState('identificacion')
    const [numeroId, setNumeroId] = useState('')
    const [buscando, setBuscando] = useState(false)
    const [error, setError] = useState('')

    const [searchParams] = useSearchParams()
    const sesionIdQR = searchParams.get('sesion')

    const handleIdentificar = async (e) => {
        e.preventDefault()
        setBuscando(true)
        setError('')
        try {
            const res = await buscarPorIdentificacion(numeroId)
            setParticipante(res.data)
            try {
                const resInscripciones = await api.get(`/inscripciones/participante/${numeroId}`)
                setInscripciones(resInscripciones.data)
            } catch {
                setInscripciones([])
            }
            setVista('inicio')
        } catch {
            try {
                const resUcu = await buscarEnUcundinamarca(numeroId)
                setEstudianteUcundinamarca(resUcu.data)
                setVista('confirmacion')
            } catch {
                setEstudianteUcundinamarca(null)
                setVista('noEncontrado')
            }
        } finally {
            setBuscando(false)
        }
    }

    const handleRegistroExitoso = (datos) => {
        setParticipante(datos)
        setVista('inicio')
    }

    if (vista === 'confirmacion') return (<RegistroPage
            numeroIdentificacion={numeroId}
            datosUcundinamarca={estudianteUcundinamarca}
            onExito={handleRegistroExitoso}
            onVolver={() => setVista('identificacion')}
        />)

    if (vista === 'registro') return (<RegistroPage
            numeroIdentificacion={numeroId}
            datosUcundinamarca={null}
            onExito={handleRegistroExitoso}
            onVolver={() => setVista('noEncontrado')}
        />)

    if (vista === 'asistencia') return (<AsistenciaPage
            participante={participante}
            sesionIdQR={sesionIdQR}
            onVolver={() => setVista('inicio')}
        />)

    if (vista === 'fichas') return <FichasPage participante={participante} onVolver={() => setVista('inicio')}/>
    if (vista === 'ayuda') return <AyudaPage participante={participante} onVolver={() => setVista('inicio')}/>
    if (vista === 'perfil') return (<PerfilPage
            participante={participante}
            onVolver={() => setVista('inicio')}
            onActualizar={(datos) => setParticipante(datos)}
        />)

    if (vista === 'noEncontrado') {
        return (<div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
                <div className="w-full max-w-md" style={contenedorEstilo}>
                    <div className="bg-green-800 px-6 py-8 text-center">
                        <h1 className="text-2xl font-semibold text-white">Gimnasio Transmoderno</h1>
                        <p className="text-green-300 text-sm mt-1">UCundinamarca · Fusagasugá</p>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                            No encontramos el número <strong>{numeroId}</strong> en el sistema. ¿Es tu primera vez?
                        </div>
                        <button onClick={() => setVista('registro')}
                                className="bg-green-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-800 transition-all">
                            Registrarme manualmente
                        </button>
                        <button onClick={() => setVista('identificacion')}
                                className="border border-gray-200 text-gray-500 rounded-xl py-3 text-sm hover:bg-gray-50 transition-all">
                            Intentar con otro número
                        </button>
                    </div>
                </div>
            </div>)
    }

    if (vista === 'inicio') {
        return (<div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
            <div className="w-full max-w-md" style={contenedorEstilo}>
                <div className="bg-green-800 px-6 py-6 text-center relative">
                    <button
                        onClick={() => setVista('perfil')}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
                        title="Mi perfil">
                        👤
                    </button>
                    <h1 className="text-2xl font-semibold text-white">Gimnasio Transmoderno</h1>
                    <p className="text-green-300 text-sm mt-1">UCundinamarca · Fusagasugá</p>
                    <span
                        className="inline-block mt-3 bg-white/10 text-green-100 text-xs px-4 py-1 rounded-full border border-white/20">
                         Sesión activa hoy
                    </span>
                </div>

                <div className="p-4 flex flex-col gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                        Bienvenido/a, <strong>{participante.nombreCompleto}</strong>
                    </div>

                    {sesionIdQR && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                            📷 Llegaste desde un código QR. Puedes registrar tu asistencia directamente.
                        </div>)}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Opciones
                        disponibles</p>
                    <OptionCard icon="✅" iconBg="bg-orange-50" titulo="Registrar asistencia"
                                descripcion="Confirma tu presencia en la sesión de hoy"
                                onClick={() => setVista('asistencia')}/>
                    <OptionCard icon="📝" iconBg="bg-blue-50" titulo="Fichas PRE / POST"
                                descripcion="Cuestionario de seguimiento de bienestar"
                                onClick={() => setVista('fichas')}/>
                    <OptionCard icon="🙋" iconBg="bg-red-50" titulo="Levantar la mano"
                                descripcion="Solicita orientación de manera discreta"
                                onClick={() => setVista('ayuda')}/>
                    <button onClick={() => {
                        setParticipante(null);
                        setNumeroId('');
                        setInscripciones([]);
                        setVista('identificacion')
                    }}
                            className="text-xs text-gray-400 mt-2 hover:text-gray-600 transition-all">
                        No soy {participante.nombreCompleto}
                    </button>
                </div>
            </div>

                <GatoAsistente
                    participante={participante}
                    inscripciones={inscripciones}
                    onNavegar={(v) => setVista(v)}
                />
            </div>)
    }

    return (<div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
            <div className="w-full max-w-md" style={contenedorEstilo}>
                <div className="bg-green-800 px-6 py-8 text-center">
                    <h1 className="text-2xl font-semibold text-white">Gimnasio Transmoderno</h1>
                    <p className="text-green-300 text-sm mt-1">UCundinamarca · Fusagasugá</p>
                    {/* Botón admin */}
                    <a href="/admin/login"
                       className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all">
                        <span>🔐</span> Admin
                    </a>
                </div>
                <div className="p-4 flex flex-col gap-4">
                    {sesionIdQR && (<div
                            className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 text-center">
                            📷 Escaneaste el QR de una sesión. Ingresa tu número para registrar asistencia.
                        </div>)}
                    <div className="text-center mt-2">
                        <p className="text-sm font-semibold text-gray-700">Ingresa tu número de identificación</p>
                        <p className="text-xs text-gray-400 mt-1">Para acceder a las opciones del programa</p>
                    </div>
                    <form onSubmit={handleIdentificar} className="flex flex-col gap-3">
                        {error && <div
                            className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">{error}</div>}
                        <input
                            type="text"
                            value={numeroId}
                            onChange={(e) => setNumeroId(e.target.value)}
                            placeholder="Ej. 1000179920"
                            required
                            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:border-green-500 text-center text-lg"
                        />
                        <button type="submit" disabled={buscando}
                                className="bg-green-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                            {buscando ? 'Buscando...' : 'Continuar →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>)
}

function OptionCard({icon, iconBg, titulo, descripcion, onClick}) {
    return (<div onClick={onClick}
                 className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 active:scale-95 transition-all">
            <div
                className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{descripcion}</p>
            </div>
            <span className="text-gray-300 text-lg">›</span>
        </div>)
}