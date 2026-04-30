import { useState } from 'react'
import { crearSolicitudAyuda } from '../../api/alertasApi'

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

export default function AyudaPage({ participante, onVolver }) {
    const [estado, setEstado] = useState('pendiente')
    const [cargando, setCargando] = useState(false)

    const handleSolicitud = async () => {
        setCargando(true)
        try {
            await crearSolicitudAyuda({ numeroIdentificacion: participante.numeroIdentificacion })
            setEstado('enviado')
        } catch {
            setEstado('enviado')
        } finally {
            setCargando(false)
        }
    }

    if (estado === 'enviado') {
        return (
            <div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
                <div className="w-full max-w-md" style={contenedorEstilo}>
                    <div className="flex flex-col items-center justify-center gap-5 p-10 text-center">
                        <div className="text-7xl">🙋</div>
                        <div>
                            <h2 className="text-2xl font-semibold text-red-600">Solicitud enviada</h2>
                            <p className="text-gray-500 text-sm mt-2">El equipo de Bienestar fue notificado y se pondrá en contacto contigo pronto.</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 w-full">
                            Dar este paso es un acto de valentía. <strong>No estás solo/a.</strong>
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
                        <h2 className="text-white font-semibold text-base">Pedir ayuda</h2>
                        <p className="text-green-300 text-xs">Solicitud discreta y confidencial</p>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                    <div className="bg-red-700 rounded-2xl p-8 text-white text-center">
                        <button onClick={handleSolicitud} disabled={cargando}
                                className="w-24 h-24 rounded-full bg-white/15 border-2 border-white/30 text-5xl flex items-center justify-center mx-auto mb-4 hover:bg-white/25 active:scale-90 transition-all disabled:opacity-50">
                            🙋
                        </button>
                        <h3 className="text-lg font-semibold mb-2">Levantar la mano</h3>
                        <p className="text-red-200 text-sm">Si necesitas hablar con alguien del equipo de Bienestar, toca el botón.</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                        <strong>100% confidencial.</strong> Solo el equipo de Bienestar verá tu solicitud.
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                        <strong>¿Emergencia?</strong> Llama directamente: <strong>320 7771170</strong>
                    </div>
                </div>
            </div>
        </div>
    )
}