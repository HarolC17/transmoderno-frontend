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

export default function FichasPage({ participante, onVolver }) {
    return (
        <div className="min-h-screen flex flex-col items-center" style={fondoEstilo}>
            <div className="w-full max-w-md" style={contenedorEstilo}>
                <div className="bg-green-800 px-6 py-5 flex items-center gap-3">
                    <button onClick={onVolver} className="text-green-200 text-2xl leading-none">‹</button>
                    <div>
                        <h2 className="text-white font-semibold text-base">Fichas de bienestar</h2>
                        <p className="text-green-300 text-xs">Cuestionario de seguimiento</p>
                    </div>
                </div>
                <div className="p-4">
                    <p className="text-sm text-gray-500">Próximamente disponible.</p>
                </div>
            </div>
        </div>
    )
}