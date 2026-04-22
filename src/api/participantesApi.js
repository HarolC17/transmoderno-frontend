import api from './axios'

export const buscarPorIdentificacion = (numero) =>
    api.get(`/participantes/identificacion/${numero}`)

export const buscarEnUcundinamarca = (documento) =>
    api.get(`/participantes/ucundinamarca/${documento}`)

export const registrarParticipante = (data) =>
    api.post('/participantes', data)