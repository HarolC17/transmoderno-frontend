import api from './axios'

export const obtenerUsuarios = () => api.get('/auth/usuarios')
export const crearUsuario = (data) => api.post('/auth/registro', data)
export const actualizarUsuario = (id, data) => api.put(`/auth/usuarios/${id}`, data)
export const cambiarContrasena = (id, data) => api.patch(`/auth/usuarios/${id}/contrasena`, data)
export const desactivarUsuario = (id) => api.delete(`/auth/usuarios/${id}`)