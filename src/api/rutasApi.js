import api from './axios'

export const obtenerRutas = () =>
    api.get('/rutas')