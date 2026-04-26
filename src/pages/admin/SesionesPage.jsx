import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import api from '../../api/axios'

const ACTIVIDADES_POR_RUTA = {
    'Energía sin Límite': ['Rumba', 'Zumba', 'Kickboxing', 'Trabajo Funcional'],
    'Alma Latina': ['Salsa', 'Merengue', 'Bachata', 'Cumbia']
}

export default function SesionesPage() {
    const [sesiones, setSesiones] = useState([])
    const [rutas, setRutas] = useState([])
    const [rutaSeleccionada, setRutaSeleccionada] = useState('')
    const [total, setTotal] = useState(0)
    const [pagina, setPagina] = useState(0)
    const [cargando, setCargando] = useState(false)
    const [mostrarForm, setMostrarForm] = useState(false)
    const [form, setForm] = useState({ rutaId: '', nombre: '', fecha: '', horaInicio: '', horaFin: '' })
    const [error, setError] = useState('')
    const [sesionQR, setSesionQR] = useState(null)
    const size = 10

    const hoy = new Date().toISOString().split('T')[0]

    useEffect(() => {
        api.get('/rutas').then(res => {
            const activas = res.data.filter(r => r.activa)
            setRutas(activas)
            if (activas.length > 0) {
                setRutaSeleccionada(activas[0].id)
                cargar(activas[0].id, 0)
            }
        })
    }, [])

    const cargar = async (rutaId, page = 0) => {
        setCargando(true)
        try {
            const res = await api.get(`/sesiones/ruta/${rutaId}?page=${page}&size=${size}`)
            setSesiones(res.data.contenido)
            setTotal(res.data.totalElementos)
            setPagina(page)
        } catch {
            setSesiones([])
        } finally {
            setCargando(false)
        }
    }

    const handleRutaChange = (rutaId) => {
        setRutaSeleccionada(rutaId)
        cargar(rutaId, 0)
    }

    const handleRutaFormChange = (rutaId) => {
        setForm({ ...form, rutaId, nombre: '' })
    }

    const rutaFormNombre = rutas.find(r => r.id === parseInt(form.rutaId))?.nombre || ''
    const actividadesDisponibles = ACTIVIDADES_POR_RUTA[rutaFormNombre] || []

    const handleCrear = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await api.post('/sesiones', {
                rutaId: parseInt(form.rutaId),
                nombre: form.nombre,
                fecha: form.fecha,
                horaInicio: form.horaInicio,
                horaFin: form.horaFin
            })
            setMostrarForm(false)
            setForm({ rutaId: '', nombre: '', fecha: '', horaInicio: '', horaFin: '' })
            cargar(rutaSeleccionada, 0)
        } catch (err) {
            const mensaje = err.response?.data?.mensaje
            setError(mensaje || 'Error al crear la sesión. Verifica los datos.')
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta sesión?')) return
        try {
            await api.delete(`/sesiones/${id}`)
            cargar(rutaSeleccionada, 0)
        } catch {
            alert('Error al eliminar la sesión.')
        }
    }

    const totalPaginas = Math.ceil(total / size)
    const urlBase = window.location.origin

    return (
        <div className="flex flex-col gap-6">

            {sesionQR && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                     onClick={() => setSesionQR(null)}>
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full mx-4"
                         onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-800">{sesionQR.nombre}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{sesionQR.fecha} · {sesionQR.horaInicio} - {sesionQR.horaFin}</p>
                        </div>
                        <QRCodeSVG
                            value={`${urlBase}/?sesion=${sesionQR.id}`}
                            size={200}
                            bgColor="#ffffff"
                            fgColor="#166534"
                            level="M"
                        />
                        <p className="text-xs text-gray-400 text-center break-all">
                            {`${urlBase}/?sesion=${sesionQR.id}`}
                        </p>
                        <button onClick={() => setSesionQR(null)}
                                className="w-full border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Sesiones</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{total} sesiones registradas</p>
                </div>
                <button onClick={() => { setMostrarForm(true); setError('') }}
                        className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all">
                    + Nueva sesión
                </button>
            </div>

            {mostrarForm && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Crear sesión</h3>
                    <form onSubmit={handleCrear} className="grid grid-cols-2 gap-4">
                        {error && (
                            <div className="col-span-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Ruta *</label>
                            <select required value={form.rutaId}
                                    onChange={e => handleRutaFormChange(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                <option value="">Selecciona</option>
                                {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Actividad *</label>
                            <select required value={form.nombre}
                                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    disabled={!form.rutaId || actividadesDisponibles.length === 0}
                                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500 disabled:opacity-50">
                                <option value="">
                                    {!form.rutaId ? 'Primero selecciona una ruta' : 'Selecciona una actividad'}
                                </option>
                                {actividadesDisponibles.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Fecha *</label>
                            <input type="date" required
                                   min={hoy}
                                   value={form.fecha}
                                   onChange={e => setForm({ ...form, fecha: e.target.value })}
                                   className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500" />
                        </div>

                        <div className="flex gap-3">
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-xs font-semibold text-gray-500">Hora inicio *</label>
                                <input type="time" required value={form.horaInicio}
                                       onChange={e => setForm({ ...form, horaInicio: e.target.value })}
                                       className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500" />
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-xs font-semibold text-gray-500">Hora fin *</label>
                                <input type="time" required value={form.horaFin}
                                       onChange={e => setForm({ ...form, horaFin: e.target.value })}
                                       className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500" />
                            </div>
                        </div>

                        <div className="col-span-2 flex gap-3 justify-end">
                            <button type="button"
                                    onClick={() => { setMostrarForm(false); setError(''); setForm({ rutaId: '', nombre: '', fecha: '', horaInicio: '', horaFin: '' }) }}
                                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                                Cancelar
                            </button>
                            <button type="submit"
                                    className="px-4 py-2 text-sm bg-green-700 text-white rounded-xl hover:bg-green-800 transition-all">
                                Crear sesión
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex gap-2">
                    {rutas.map(r => (
                        <button key={r.id} onClick={() => handleRutaChange(r.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                                ${rutaSeleccionada === r.id
                                    ? 'bg-green-700 text-white'
                                    : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            {r.nombre}
                        </button>
                    ))}
                </div>

                {cargando ? (
                    <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
                ) : sesiones.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No hay sesiones para esta ruta</div>
                ) : (
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actividad</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Horario</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sesiones.map(s => (
                            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-semibold text-gray-800">{s.nombre}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{s.fecha}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{s.horaInicio} - {s.horaFin}</td>
                                <td className="px-4 py-3 flex items-center gap-3">
                                    <button onClick={() => setSesionQR(s)}
                                            className="text-xs text-green-600 hover:text-green-800 font-semibold transition-all">
                                        Ver QR
                                    </button>
                                    <button onClick={() => handleEliminar(s.id)}
                                            className="text-xs text-red-500 hover:text-red-700 transition-all">
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

                {totalPaginas > 1 && (
                    <div className="p-4 flex items-center justify-between border-t border-gray-100">
                        <span className="text-xs text-gray-400">Página {pagina + 1} de {totalPaginas}</span>
                        <div className="flex gap-2">
                            <button onClick={() => cargar(rutaSeleccionada, pagina - 1)} disabled={pagina === 0}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                                ← Anterior
                            </button>
                            <button onClick={() => cargar(rutaSeleccionada, pagina + 1)} disabled={pagina >= totalPaginas - 1}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}