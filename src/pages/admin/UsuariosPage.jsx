import { useState, useEffect } from 'react'
import { obtenerUsuarios, crearUsuario, actualizarUsuario, cambiarContrasena, desactivarUsuario } from '../../api/usuariosApi'

const ROLES = ['ADMIN', 'PSICOLOGO', 'ENCARGADO']

const rolColor = {
    ADMIN:     'bg-purple-100 text-purple-700',
    PSICOLOGO: 'bg-blue-100 text-blue-700',
    ENCARGADO: 'bg-green-100 text-green-700',
}

const rolLabel = {
    ADMIN:     'Administrador',
    PSICOLOGO: 'Psicólogo',
    ENCARGADO: 'Encargado',
}

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [modal, setModal] = useState(null) // 'crear' | 'editar' | 'contrasena' | 'desactivar'
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
    const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', rol: 'ENCARGADO' })
    const [nuevaContrasena, setNuevaContrasena] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState('')
    const [error, setError] = useState('')

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        try {
            const res = await obtenerUsuarios()
            setUsuarios(res.data)
        } catch {
            setError('Error al cargar usuarios.')
        } finally {
            setCargando(false)
        }
    }

    const abrirCrear = () => {
        setForm({ nombre: '', correo: '', contrasena: '', rol: 'ENCARGADO' })
        setError('')
        setExito('')
        setModal('crear')
    }

    const abrirEditar = (u) => {
        setUsuarioSeleccionado(u)
        setForm({ nombre: u.nombre, correo: u.correo, rol: u.rol })
        setError('')
        setModal('editar')
    }

    const abrirContrasena = (u) => {
        setUsuarioSeleccionado(u)
        setNuevaContrasena('')
        setError('')
        setModal('contrasena')
    }

    const cerrarModal = () => {
        setModal(null)
        setUsuarioSeleccionado(null)
        setError('')
    }

    const handleCrear = async (e) => {
        e.preventDefault()
        setGuardando(true)
        setError('')
        try {
            await crearUsuario(form)
            await cargar()
            setExito('Usuario creado correctamente.')
            cerrarModal()
        } catch {
            setError('Error al crear usuario. El correo puede estar en uso.')
        } finally {
            setGuardando(false)
        }
    }

    const handleEditar = async (e) => {
        e.preventDefault()
        setGuardando(true)
        setError('')
        try {
            await actualizarUsuario(usuarioSeleccionado.id, {
                nombre: form.nombre,
                correo: form.correo,
                rol: form.rol
            })
            await cargar()
            setExito('Usuario actualizado correctamente.')
            cerrarModal()
        } catch {
            setError('Error al actualizar usuario.')
        } finally {
            setGuardando(false)
        }
    }

    const handleContrasena = async (e) => {
        e.preventDefault()
        setGuardando(true)
        setError('')
        try {
            await cambiarContrasena(usuarioSeleccionado.id, { contrasena: nuevaContrasena })
            setExito('Contraseña actualizada correctamente.')
            cerrarModal()
        } catch {
            setError('Error al cambiar contraseña.')
        } finally {
            setGuardando(false)
        }
    }

    const handleDesactivar = async () => {
        setGuardando(true)
        try {
            await desactivarUsuario(usuarioSeleccionado.id)
            await cargar()
            setExito('Usuario desactivado.')
            cerrarModal()
        } catch {
            setError('Error al desactivar usuario.')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Modales */}
            {modal === 'crear' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                     onClick={cerrarModal}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4"
                         onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-gray-800">Nuevo usuario</h3>
                        <form onSubmit={handleCrear} className="flex flex-col gap-3">
                            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">{error}</div>}
                            <Campo label="Nombre completo *" value={form.nombre}
                                   onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej. Laura Pérez" />
                            <Campo label="Correo *" type="email" value={form.correo}
                                   onChange={e => setForm({...form, correo: e.target.value})} placeholder="correo@ucundinamarca.edu.co" />
                            <Campo label="Contraseña *" type="password" value={form.contrasena}
                                   onChange={e => setForm({...form, contrasena: e.target.value})} placeholder="Mínimo 8 caracteres" />
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500">Rol *</label>
                                <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}
                                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                    {ROLES.map(r => <option key={r} value={r}>{rolLabel[r]}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={guardando}
                                        className="flex-1 bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                                    {guardando ? 'Creando...' : 'Crear usuario'}
                                </button>
                                <button type="button" onClick={cerrarModal}
                                        className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'editar' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                     onClick={cerrarModal}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4"
                         onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-gray-800">Editar usuario</h3>
                        <form onSubmit={handleEditar} className="flex flex-col gap-3">
                            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">{error}</div>}
                            <Campo label="Nombre completo *" value={form.nombre}
                                   onChange={e => setForm({...form, nombre: e.target.value})} />
                            <Campo label="Correo *" type="email" value={form.correo}
                                   onChange={e => setForm({...form, correo: e.target.value})} />
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500">Rol *</label>
                                <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}
                                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                    {ROLES.map(r => <option key={r} value={r}>{rolLabel[r]}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={guardando}
                                        className="flex-1 bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                                <button type="button" onClick={cerrarModal}
                                        className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'contrasena' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                     onClick={cerrarModal}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4"
                         onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-gray-800">
                            Cambiar contraseña — {usuarioSeleccionado?.nombre}
                        </h3>
                        <form onSubmit={handleContrasena} className="flex flex-col gap-3">
                            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">{error}</div>}
                            <Campo label="Nueva contraseña *" type="password" value={nuevaContrasena}
                                   onChange={e => setNuevaContrasena(e.target.value)} placeholder="Mínimo 8 caracteres" />
                            <div className="flex gap-2">
                                <button type="submit" disabled={guardando}
                                        className="flex-1 bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                                    {guardando ? 'Actualizando...' : 'Actualizar contraseña'}
                                </button>
                                <button type="button" onClick={cerrarModal}
                                        className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'desactivar' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                     onClick={cerrarModal}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4"
                         onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-gray-800">Desactivar usuario</h3>
                        <p className="text-sm text-gray-600">
                            ¿Seguro que deseas desactivar a <strong>{usuarioSeleccionado?.nombre}</strong>?
                            Ya no podrá iniciar sesión en el sistema.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={handleDesactivar} disabled={guardando}
                                    className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50">
                                {guardando ? 'Desactivando...' : 'Sí, desactivar'}
                            </button>
                            <button onClick={cerrarModal}
                                    className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Encabezado */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Usuarios del sistema</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Administradores, psicólogos y encargados</p>
                </div>
                <button onClick={abrirCrear}
                        className="bg-green-700 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-800 transition-all font-semibold">
                    + Nuevo usuario
                </button>
            </div>

            {/* Alertas */}
            {exito && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                    ✅ {exito}
                </div>
            )}
            {error && !modal && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                    {error}
                </div>
            )}

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-gray-100">
                {cargando ? (
                    <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
                ) : usuarios.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No hay usuarios registrados.</div>
                ) : (
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Correo</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {usuarios.map(u => (
                            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700 flex-shrink-0">
                                            {u.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800">{u.nombre}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{u.correo}</td>
                                <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${rolColor[u.rol]}`}>
                                            {rolLabel[u.rol]}
                                        </span>
                                </td>
                                <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold
                                            ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => abrirEditar(u)}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-all">
                                            Editar
                                        </button>
                                        <button onClick={() => abrirContrasena(u)}
                                                className="text-xs text-yellow-600 hover:text-yellow-800 font-semibold transition-all">
                                            Contraseña
                                        </button>
                                        {u.activo && (
                                            <button onClick={() => { setUsuarioSeleccionado(u); setModal('desactivar') }}
                                                    className="text-xs text-red-500 hover:text-red-700 font-semibold transition-all">
                                                Desactivar
                                            </button>
                                        )}
                                    </div>
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

function Campo({ label, value, onChange, placeholder, type = 'text' }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} required
                   className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500 focus:bg-white" />
        </div>
    )
}