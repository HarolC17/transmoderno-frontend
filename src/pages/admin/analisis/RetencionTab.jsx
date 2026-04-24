import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function RetencionTab() {
    const [retencion, setRetencion] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        setCargando(true)
        try {
            const res = await api.get('/reportes/retencion')
            setRetencion(res.data)
        } catch {
            setRetencion([])
        } finally {
            setCargando(false)
        }
    }

    const datosGrafico = retencion.map(r => ({
        nombre: r.ruta,
        activos: r.activos,
        inactivos: r.inactivos,
        tasa: Math.round(r.tasaRetencion)
    }))

    if (cargando) return <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>

    return (
        <div className="flex flex-col gap-4">

            <div className="grid grid-cols-2 gap-4">
                {retencion.map((r, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-700">{r.ruta}</p>
                            <span className={`text-2xl font-bold
                                ${r.tasaRetencion >= 75 ? 'text-green-600'
                                : r.tasaRetencion >= 50 ? 'text-yellow-600'
                                    : 'text-red-600'}`}>
                                {Math.round(r.tasaRetencion)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                            <div className={`h-3 rounded-full transition-all
                                ${r.tasaRetencion >= 75 ? 'bg-green-500'
                                : r.tasaRetencion >= 50 ? 'bg-yellow-500'
                                    : 'bg-red-500'}`}
                                 style={{ width: `${r.tasaRetencion}%` }}
                            />
                        </div>
                        <div className="flex gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                                Activos: {r.activos}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                                Inactivos: {r.inactivos}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>
                                Total: {r.totalInscritos}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-sm font-semibold text-gray-700 mb-4">Comparativa por ruta</p>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={datosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value, name) => [value, name === 'activos' ? 'Activos' : 'Inactivos']} />
                        <Legend formatter={value => value === 'activos' ? 'Activos' : 'Inactivos'} />
                        <Bar dataKey="activos" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="inactivos" stackId="a" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

        </div>
    )
}