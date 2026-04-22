import api from './axios'

export const obtenerInscripcionesPorParticipante = (numeroIdentificacion) =>
    api.get(`/inscripciones/participante/${numeroIdentificacion}`)

export const inscribirParticipante = (data) =>
    api.post('/inscripciones', data)