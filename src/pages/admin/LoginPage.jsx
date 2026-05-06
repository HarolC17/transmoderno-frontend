import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { login } from '../../api/authApi'

export default function LoginPage() {
    const { login: setAuth } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ correo: '', contrasena: '' })
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setCargando(true)
        setError('')
        try {
            const res = await login(form)
            setAuth(res.data.token, {
                nombre: res.data.nombre,
                correo: res.data.correo,
                rol: res.data.rol
            })
            navigate('/admin')
        } catch {
            setError('Correo o contraseña incorrectos')
            setCargando(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-700 rounded-2xl mb-4">
                        <span className="text-white text-2xl">🏃</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-800">Gimnasio Transmoderno</h1>
                    <p className="text-gray-500 text-sm mt-1">Panel de administración</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                                {error}
                            </div>
                        )}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Correo</label>
                            <input type="email" required value={form.correo}
                                   onChange={e => setForm({ ...form, correo: e.target.value })}
                                   placeholder="admin@gimnasio.com"
                                   className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-green-500 focus:bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500">Contraseña</label>
                            <input type="password" required value={form.contrasena}
                                   onChange={e => setForm({ ...form, contrasena: e.target.value })}
                                   placeholder="••••••••"
                                   className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-green-500 focus:bg-white" />
                        </div>
                        <button type="submit" disabled={cargando}
                                className="bg-green-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50 mt-2">
                            {cargando ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}