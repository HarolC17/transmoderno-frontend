export default function FichasPage({ participante, onVolver }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <div className="w-full max-w-md">
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