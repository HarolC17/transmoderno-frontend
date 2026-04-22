import api from './axios'

export const registrarAsistencia = (data) =>
    api.post('/asistencia', data)

export const obtenerAsistenciasPorParticipante = (numeroIdentificacion, page = 0, size = 10) =>
    api.get(`/asistencia/participante/${numeroIdentificacion}?page=${page}&size=${size}`)