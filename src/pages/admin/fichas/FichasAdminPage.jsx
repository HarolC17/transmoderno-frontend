import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import TabParticipantes from './TabParticipantes'
import TabPreguntas from './TabPreguntas'

function TabBtn({ label, active, onClick }) {
    return (
        <button onClick={onClick}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                    active ? 'border-green-700 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
            {label}
        </button>
    )
}

export default function FichasAdminPage() {
    const { usuario } = useAuth()
    const rol = usuario?.rol
    const [tab, setTab] = useState('participantes')

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-800">Fichas de bienestar</h2>
                <p className="text-sm text-gray-500 mt-0.5">Consulta fichas PRE/POST y gestiona las preguntas</p>
            </div>
            <div className="flex gap-2 border-b border-gray-200">
                <TabBtn label="Fichas de participantes" active={tab === 'participantes'} onClick={() => setTab('participantes')} />
                {(rol === 'ADMIN' || rol === 'PSICOLOGO') && (
                    <TabBtn label="Gestión de preguntas" active={tab === 'preguntas'} onClick={() => setTab('preguntas')} />
                )}
            </div>
            {tab === 'participantes' && <TabParticipantes />}
            {tab === 'preguntas' && <TabPreguntas />}
        </div>
    )
}