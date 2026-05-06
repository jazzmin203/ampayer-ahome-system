'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';

const IMPORT_TYPES = [
    { id: 'teams', label: 'Equipos', description: 'Nombre, Categoría, Manager' },
    { id: 'players', label: 'Jugadores', description: 'Nombre, Apellido, Jersey, Equipo' },
    { id: 'stadiums', label: 'Estadios', description: 'Nombre, Dirección, Ciudad, Estado' },
    { id: 'games', label: 'Juegos', description: 'Fecha, Hora, Local, Visitante, Estadio, Categoría' },
];

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [selectedType, setSelectedType] = useState('teams');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post(`/import/${selectedType}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResult(response.data);
        } catch (error: any) {
            console.error('Import error:', error);
            setResult({ errors: [error.response?.data?.error || 'Error desconocido al importar'] });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">Importación Masiva de Datos</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Upload Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cargar Archivo Excel</CardTitle>
                        <CardDescription>Seleccione el tipo de datos y suba el archivo .xlsx</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Datos</label>
                            <div className="grid grid-cols-2 gap-2">
                                {IMPORT_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => { setSelectedType(type.id); setResult(null); }}
                                        className={`p-3 text-sm border rounded-md text-left transition-colors ${selectedType === type.id
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                                                : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="font-semibold">{type.label}</div>
                                        <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600 font-medium">
                                {file ? file.name : 'Click para seleccionar archivo Excel'}
                            </span>
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="w-full"
                        >
                            {loading ? 'Procesando...' : `Importar ${IMPORT_TYPES.find(t => t.id === selectedType)?.label}`}
                        </Button>
                    </CardContent>
                </Card>

                {/* Results Area */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resultado de Importación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!result && !loading && (
                            <div className="text-center text-gray-500 py-8">
                                <Upload className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                                <p>Los resultados aparecerán aquí después de importar.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <div className="text-2xl font-bold text-green-600">{result.created || 0}</div>
                                        <div className="text-xs text-green-800 font-medium">Creados</div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="text-2xl font-bold text-blue-600">{result.updated || 0}</div>
                                        <div className="text-xs text-blue-800 font-medium">Actualizados</div>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                        <div className="text-2xl font-bold text-red-600">{result.errors?.length || 0}</div>
                                        <div className="text-xs text-red-800 font-medium">Errores</div>
                                    </div>
                                </div>

                                {result.errors && result.errors.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1" /> Detalle de Errores
                                        </h4>
                                        <div className="bg-red-50 p-3 rounded-md text-xs text-red-700 max-h-60 overflow-y-auto space-y-1">
                                            {result.errors.map((err: string, idx: number) => (
                                                <div key={idx} className="border-b border-red-100 last:border-0 pb-1 last:pb-0">
                                                    {err}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.errors?.length === 0 && (
                                    <div className="flex items-center justify-center text-green-600 mt-4">
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        <span className="font-medium">Importación completada sin errores.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
