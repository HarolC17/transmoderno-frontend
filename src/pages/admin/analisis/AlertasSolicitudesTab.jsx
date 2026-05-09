import { useState, useEffect } from 'react'
import api from '../../../api/axios'

export default function AlertasSolicitudesTab() {
    const [solicitudes, setSolicitudes] = useState([])
    const [cargando,    setCargando]    = useState(true)
    const [detalle,     setDetalle]     = useState(null)

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
            setDetalle(null)
        } catch {
            alert('Error al atender la solicitud.')
        }
    }

    const pendientes = solicitudes.filter(s => !s.atendida).length

    return (
        <div className="flex flex-col gap-4">
            {/* Contadores */}
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

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-gray-100">
                {cargando ? (
                    <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
                ) : solicitudes.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No hay solicitudes de ayuda</div>
                ) : (
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Participante</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Programa</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha y hora</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
                        </tr>
                        </thead>
                        <tbody>
                        {solicitudes.map(s => (
                            <tr key={s.id}
                                onClick={() => setDetalle(s)}
                                className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {s.nombreCompleto || `#${s.participanteId}`}
                                    </p>
                                    <p className="text-xs text-gray-400">{s.numeroIdentificacion || ''}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                    <p className="truncate">{s.programaAcademico || '—'}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(s.fechaHora).toLocaleString('es-CO')}
                                </td>
                                <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                            ${s.atendida ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {s.atendida ? 'Atendida' : 'Pendiente'}
                                        </span>
                                </td>
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
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

            {/* Modal de detalle */}
            {detalle && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                     onClick={() => setDetalle(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4"
                         onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-800">Solicitud de ayuda</h3>
                            <button onClick={() => setDetalle(null)}
                                    className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                        </div>

                        {/* Datos del participante */}
                        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-lg flex-shrink-0">👤</div>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-semibold text-gray-800">
                                    {detalle.nombreCompleto || `Participante #${detalle.participanteId}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {detalle.numeroIdentificacion} · {detalle.programaAcademico || 'Sin programa'}
                                </p>
                                {detalle.correoInstitucional && (
                                    <p className="text-xs text-green-700">✉ {detalle.correoInstitucional}</p>
                                )}
                                {detalle.telefono && (
                                    <p className="text-xs text-green-700">📞 {detalle.telefono}</p>
                                )}
                            </div>
                        </div>

                        {/* Detalles */}
                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-500">Fecha y hora</span>
                                <span className="font-semibold text-gray-800">
                                    {new Date(detalle.fechaHora).toLocaleString('es-CO')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-500">Estado</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                                    ${detalle.atendida ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {detalle.atendida ? 'Atendida' : 'Pendiente'}
                                </span>
                            </div>
                            {detalle.atendida && detalle.fechaAtencion && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Fecha atención</span>
                                    <span className="font-semibold text-gray-800">
                                        {new Date(detalle.fechaAtencion).toLocaleString('es-CO')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setDetalle(null)}
                                    className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all">
                                Cerrar
                            </button>
                            {!detalle.atendida && (
                                <button onClick={() => handleAtender(detalle.id)}
                                        className="flex-1 bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all">
                                    Marcar como atendida
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}