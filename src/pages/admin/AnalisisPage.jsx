import { useState } from 'react'
import AlertasSolicitudesTab from './analisis/AlertasSolicitudesTab'
import AlertasInasistenciaTab from './analisis/AlertasInasistenciaTab'
import ReportesTab from './analisis/ReportesTab'
import RetencionTab from './analisis/RetencionTab'

const TABS = [
    { id: 'solicitudes', label: '🙋 Solicitudes de ayuda' },
    { id: 'inasistencia', label: '📋 Inasistencias' },
    { id: 'reportes', label: '📊 Reportes' },
    { id: 'retencion', label: '📈 Retención' },
]

export default function AnalisisPage() {
    const [tab, setTab] = useState('solicitudes')

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-800">Análisis</h2>
                <p className="text-sm text-gray-500 mt-0.5">Alertas, seguimiento y reportes del programa</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                            ${tab === t.id ? 'bg-green-700 text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'solicitudes' && <AlertasSolicitudesTab />}
            {tab === 'inasistencia' && <AlertasInasistenciaTab />}
            {tab === 'reportes' && <ReportesTab />}
            {tab === 'retencion' && <RetencionTab />}
        </div>
    )
}