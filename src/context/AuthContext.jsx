import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [usuario, setUsuario] = useState(
        JSON.parse(localStorage.getItem('usuario') || 'null')
    )

    const login = (token, usuario) => {
        localStorage.setItem('token', token)
        localStorage.setItem('usuario', JSON.stringify(usuario))
        setToken(token)
        setUsuario(usuario)
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        setToken(null)
        setUsuario(null)
    }

    return (
        <AuthContext.Provider value={{ token, usuario, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}