import { useState, useEffect } from 'react'
import api from '../../../api/axios'

export default function VisorFicha({ ficha, onVolver }) {
    const [preguntas, setPreguntas] = useState({})

    useEffect(() => {
        cargarPreguntas()
    }, [])

    const cargarPreguntas = async () => {
        try {
            const [res1, res2] = await Promise.all([
                api.get('/preguntas/ruta/1'),
                api.get('/preguntas/ruta/2'),
            ])
            const mapa = {}
            ;[...res1.data, ...res2.data].forEach(p => { mapa[p.id] = p })
            setPreguntas(mapa)
        } catch {}
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <button onClick={onVolver}
                        className="text-gray-400 hover:text-gray-600 text-lg transition-all">
                    ‹ Volver
                </button>
                <h3 className="text-base font-semibold text-gray-800">
                    Ficha {ficha.tipo} — {new Date(ficha.data.fechaDiligenciamiento).toLocaleDateString('es-CO')}
                </h3>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pregunta</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Respuesta</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ficha.data.respuestas.map((r, i) => {
                        const pregunta = preguntas[r.preguntaId]
                        return (
                            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-all">
                                <td className="px-5 py-3 text-xs text-gray-400">{i + 1}</td>
                                <td className="px-5 py-3 text-gray-700">
                                    {pregunta ? pregunta.texto : `Pregunta #${r.preguntaId}`}
                                </td>
                                <td className="px-5 py-3">
                                        <span className="bg-green-50 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-lg">
                                            {r.valor}
                                        </span>
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}