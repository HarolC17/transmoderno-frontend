import api from './axios'

export const crearSolicitudAyuda = (data) =>
    api.post('/alertas/ayuda', data)