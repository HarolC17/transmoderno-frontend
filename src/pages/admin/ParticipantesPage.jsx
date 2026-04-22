import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import api from '../../api/axios'

const PROGRAMAS_CACHE = { data: null }

export default function ParticipantesPage() {
    const [participantes, setParticipantes] = useState([])
    const [total, setTotal] = useState(0)
    const [pagina, setPagina] = useState(0)
    const [busqueda, setBusqueda] = useState('')
    const [cargando, setCargando] = useState(true)
    const [exportando, setExportando] = useState(false)
    const [programas, setProgramas] = useState([])
    const [modalEditar, setModalEditar] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const size = 10

    const cargar = async (page = 0) => {
        setCargando(true)
        try {
            const res = await api.get(`/participantes?page=${page}&size=${size}`)
            setParticipantes(res.data.contenido)
            setTotal(res.data.totalElementos)
            setPagina(page)
        } catch {
            setParticipantes([])
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargar()
        if (!PROGRAMAS_CACHE.data) {
            api.get('/participantes/programas').then(res => {
                PROGRAMAS_CACHE.data = res.data
                setProgramas(res.data)
            })
        } else {
            setProgramas(PROGRAMAS_CACHE.data)
        }
    }, [])

    const handleExportar = async () => {
        setExportando(true)
        try {
            const res = await api.get('/participantes/exportar')
            const datos = res.data.map(p => ({
                'ID': p.id,
                'Número de identificación': p.numeroIdentificacion,
                'Tipo documento': p.tipoDocumento || '',
                'Nombre completo': p.nombreCompleto,
                'Correo institucional': p.correoInstitucional,
                'Programa académico': p.programaAcademico,
                'Semestre': p.semestre || '',
                'Teléfono': p.telefono || '',
                'Estamento': p.estamento || '',
                'Sede': p.sede || '',
                'Fecha registro': p.fechaRegistro ? new Date(p.fechaRegistro).toLocaleString('es-CO') : ''
            }))
            const hoja = XLSX.utils.json_to_sheet(datos)
            const libro = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(libro, hoja, 'Participantes')
            XLSX.writeFile(libro, `participantes_${new Date().toISOString().split('T')[0]}.xlsx`)
        } catch {
            alert('Error al exportar. Intenta de nuevo.')
        } finally {
            setExportando(false)
        }
    }

    const handleGuardarEdicion = async () => {
        setGuardando(true)
        try {
            await api.put(`/participantes/${modalEditar.id}`, {
                numeroIdentificacion: modalEditar.numeroIdentificacion,
                nombreCompleto: modalEditar.nombreCompleto,
                correoInstitucional: modalEditar.correoInstitucional,
                programaAcademico: modalEditar.programaAcademico,
                semestre: modalEditar.semestre ? parseInt(modalEditar.semestre) : null,
                tipoDocumento: modalEditar.tipoDocumento,
                sede: modalEditar.sede,
                telefono: modalEditar.telefono,
                estamento: modalEditar.estamento
            })
            setModalEditar(null)
            cargar(pagina)
        } catch {
            alert('Error al guardar. Intenta de nuevo.')
        } finally {
            setGuardando(false)
        }
    }

    const participantesFiltrados = participantes.filter(p =>
        p.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.numeroIdentificacion.includes(busqueda)
    )

    const totalPaginas = Math.ceil(total / size)

    return (
        <div className="flex flex-col gap-6">

            {modalEditar && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                     onClick={() => setModalEditar(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
                         onClick={e => e.stopPropagation()}>
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">Editar participante</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{modalEditar.nombreCompleto}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Campo label="Programa académico">
                                <select value={modalEditar.programaAcademico}
                                        onChange={e => setModalEditar({...modalEditar, programaAcademico: e.target.value})}
                                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                    <option value="">Selecciona</option>
                                    {programas.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </Campo>

                            {modalEditar.estamento === 'ESTUDIANTE' && (
                                <Campo label="Semestre">
                                    <select value={modalEditar.semestre || ''}
                                            onChange={e => setModalEditar({...modalEditar, semestre: e.target.value})}
                                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                        <option value="">Sin semestre</option>
                                        {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>{s}°</option>)}
                                    </select>
                                </Campo>
                            )}

                            <Campo label="Teléfono">
                                <input type="tel" value={modalEditar.telefono || ''}
                                       onChange={e => setModalEditar({...modalEditar, telefono: e.target.value})}
                                       placeholder="Ej. 3001234567"
                                       className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500" />
                            </Campo>

                            <Campo label="Estamento">
                                <select value={modalEditar.estamento || 'ESTUDIANTE'}
                                        onChange={e => setModalEditar({...modalEditar, estamento: e.target.value})}
                                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500">
                                    {['ESTUDIANTE','DOCENTE','ADMINISTRATIVO','GRADUADO','COMUNIDAD'].map(e => (
                                        <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>
                                    ))}
                                </select>
                            </Campo>

                            <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
                                <p className="text-xs font-semibold text-gray-500 mb-1">Datos no editables</p>
                                <InfoFija label="Nombre" valor={modalEditar.nombreCompleto} />
                                <InfoFija label="Documento" valor={modalEditar.numeroIdentificacion} />
                                <InfoFija label="Correo" valor={modalEditar.correoInstitucional} />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleGuardarEdicion} disabled={guardando}
                                    className="flex-1 bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-800 transition-all disabled:opacity-50">
                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                            <button onClick={() => setModalEditar(null)}
                                    className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Participantes</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{total} registrados en total</p>
                </div>
                <button onClick={handleExportar} disabled={exportando}
                        className="flex items-center gap-2 border border-green-700 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-50 transition-all disabled:opacity-50">
                    {exportando ? 'Exportando...' : '⬇ Exportar Excel'}
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o número de identificación..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 outline-none focus:border-green-500 focus:bg-white"
                    />
                </div>

                {cargando ? (
                    <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
                ) : participantesFiltrados.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No se encontraron participantes</div>
                ) : (
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Participante</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Identificación</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Programa</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Semestre</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {participantesFiltrados.map(p => (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700">
                                            {p.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800">{p.nombreCompleto}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{p.numeroIdentificacion}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">{p.programaAcademico}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{p.semestre ? `${p.semestre}°` : '—'}</td>
                                <td className="px-4 py-3">
                                    <button onClick={() => setModalEditar({...p})}
                                            className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition-all">
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

                {totalPaginas > 1 && (
                    <div className="p-4 flex items-center justify-between border-t border-gray-100">
                        <span className="text-xs text-gray-400">Página {pagina + 1} de {totalPaginas}</span>
                        <div className="flex gap-2">
                            <button onClick={() => cargar(pagina - 1)} disabled={pagina === 0}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-all">
                                ← Anterior
                            </button>
                            <button onClick={() => cargar(pagina + 1)} disabled={pagina >= totalPaginas - 1}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-all">
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function Campo({ label, children }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">{label}</label>
            {children}
        </div>
    )
}

function InfoFija({ label, valor }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs text-gray-600 font-medium">{valor}</span>
        </div>
    )
}