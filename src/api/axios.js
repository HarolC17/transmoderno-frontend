import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:1010/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const esRutaAdmin = window.location.pathname.startsWith('/admin')
            const tieneToken = localStorage.getItem('token')
            if (esRutaAdmin && tieneToken) {
                localStorage.removeItem('token')
                localStorage.removeItem('usuario')
                window.location.href = '/admin/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api