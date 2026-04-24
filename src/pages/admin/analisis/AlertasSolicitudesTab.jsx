import { useState, useEffect } from 'react'
import api from '../../../api/axios'

export default function AlertasSolicitudesTab() {
    const [solicitudes, setSolicitudes] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        setCargando(true)
        try {
            const res = await api.get('/alertas/ayuda?page=0&size=50')
            setSolicitudes(res.data.contenido)
        } catch {
            setSolicitudes([])
        } finally {
            setCargando(false)
        }
    }

    const handleAtender = async (id) => {
        try {
            await api.patch(`/alertas/ayuda/${id}/atender`)
            cargar()
        } catch {
            alert('Error al atender la solicitud.')
        }
    }

    const pendientes = solicitudes.filter(s => !s.atendida).length

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Pendientes</p>
                    <p className="text-3xl font-semibold text-red-700 mt-1">{pendientes}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-green-500 uppercase tracking-wider">Atendidas</p>
                    <p className="text-3xl font-semibold text-green-700 mt-1">{solicitudes.length - pendientes}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100">
                {cargando ? (
                    <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
                ) : solicitudes.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No hay solicitudes de ayuda</div>
                ) : (
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Participante ID</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha y hora</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
                        </tr>
                        </thead>
                        <tbody>
                        {solicitudes.map(s => (
                            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-800 font-semibold">#{s.participanteId}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(s.fechaHora).toLocaleString('es-CO')}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                        ${s.atendida ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {s.atendida ? 'Atendida' : 'Pendiente'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {!s.atendida && (
                                        <button onClick={() => handleAtender(s.id)}
                                                className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-all">
                                            Atender
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}