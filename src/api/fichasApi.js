import api from './axios'

export const obtenerPreguntasPorRutaYFicha = (rutaId, tipFicha) =>
    api.get(`/preguntas/ruta/${rutaId}/ficha/${tipFicha}`)

export const obtenerFichaPre = (inscripcionId) =>
    api.get(`/fichas/pre/inscripcion/${inscripcionId}`)

export const obtenerFichaPost = (fichaPreId) =>
    api.get(`/fichas/post/inscripcion/${fichaPreId}`)

export const crearFichaPre = (data) =>
    api.post('/fichas/pre', data)

export const crearFichaPost = (data) =>
    api.post('/fichas/post', data)