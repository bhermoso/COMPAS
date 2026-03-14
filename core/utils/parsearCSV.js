/**
 * COMPÁS — Parser de archivos CSV
 * core/utils/parsearCSV.js
 *
 * Extraído de COMPAS.html (L.11515, L.11329, L.11946) el 2026-03-14 — E1 PLAN_TRANSICION_MONOLITO.md
 *
 * Orden de definición:
 *   1. detectarTipoCSV()  — auxiliar interna (COMPAS.html L.11946)
 *   2. validarCSV()       — auxiliar interna (COMPAS.html L.11329)
 *   3. parsearCSV()       — export público  (COMPAS.html L.11515)
 *
 * MÓDULO PURO: Sin DOM. Sin Firebase. Sin efectos secundarios.
 */

// ── 1. Auxiliar interna: detectarTipoCSV ─────────────────────────────────────

function detectarTipoCSV(contenido) {

    if (!contenido) return null;



    const cabecera = contenido.split('\n')[0]?.toLowerCase() || '';



    // Detectar por palabras clave en cabecera

    if (cabecera.includes('indicador') && cabecera.includes('unidadmedida')) return 'indicadores';

    if (cabecera.includes('determinante') || (cabecera.includes('codigo') && cabecera.includes('pregunta'))) return 'determinantes';

    if (cabecera.includes('conclusion') || (cabecera.includes('numero') && cabecera.includes('texto'))) return 'conclusiones';

    if (cabecera.includes('recomendacion')) return 'recomendaciones';

    if (cabecera.includes('areaprioritaria') || cabecera.includes('problema')) return 'priorizacion';

    if (cabecera.includes('ambito') && cabecera.includes('poblaciondiana')) return 'programas';

    if (cabecera.includes('refgranada') && cabecera.includes('refandalucia') && !cabecera.includes('valormunicipio')) return 'referencias';



    return null;

}

// ── 2. Auxiliar interna: validarCSV ──────────────────────────────────────────

function validarCSV(contenido, tipo) {

    const resultado = {

        valido: true,

        error: null,

        advertencias: [],

        columnas: 0,

        filas: 0,

        tipoDetectado: null

    };



    if (!contenido) {

        resultado.valido = false;

        resultado.error = 'El archivo está vacío';

        return resultado;

    }



    const lineas = contenido.split('\n').filter(l => l.trim());

    resultado.filas = lineas.length - 1; // Sin cabecera



    if (lineas.length < 2) {

        resultado.valido = false;

        resultado.error = 'El archivo no tiene datos (solo cabecera o vacío)';

        return resultado;

    }



    // Verificar que usa punto y coma como separador

    const cabecera = lineas[0];

    if (!cabecera.includes(';')) {

        // Verificar si usa coma

        if (cabecera.includes(',')) {

            resultado.valido = false;

            resultado.error = 'El archivo usa coma como separador. COMPÁS requiere punto y coma (;)';

            return resultado;

        }

        resultado.advertencias.push('La cabecera no parece tener separadores de columna');

    }



    const columnasEsperadas = {

        'indicadores': { min: 2, nombres: ['numero', 'indicador'] },

        'determinantes': { min: 3, nombres: ['codigo'] }, // Reducido a 3 para formato simple

        'conclusiones': { min: 2, nombres: ['numero', 'texto'] },

        'recomendaciones': { min: 2, nombres: ['numero', 'recomendacion'] },

        'priorizacion': { min: 3, nombres: ['numero', 'areaprioritaria'] },

        'programas': { min: 3, nombres: ['codigo', 'nombre', 'ambito'] },

        'referencias': { min: 6, nombres: ['area', 'codigo', 'refgranada'] }

    };



    const cols = cabecera.split(';');

    resultado.columnas = cols.length;



    // Detectar tipo automáticamente si no se especificó

    resultado.tipoDetectado = detectarTipoCSV(contenido);



    // Verificar columnas mínimas según tipo

    if (tipo && columnasEsperadas[tipo]) {

        const esperado = columnasEsperadas[tipo];

        if (cols.length < esperado.min) {

            resultado.advertencias.push(`Se esperaban al menos ${esperado.min} columnas para ${tipo}, se encontraron ${cols.length}`);

        }



        // Verificar nombres de columnas clave

        const cabeceraLower = cabecera.toLowerCase();

        const columnasEncontradas = esperado.nombres.filter(n => cabeceraLower.includes(n));

        if (columnasEncontradas.length < esperado.nombres.length / 2) {

            resultado.advertencias.push(`La cabecera no parece corresponder al tipo "${tipo}"`);

            if (resultado.tipoDetectado && resultado.tipoDetectado !== tipo) {

                resultado.advertencias.push(`El archivo parece ser de tipo "${resultado.tipoDetectado}"`);

            }

        }

    }



    // Verificar consistencia de columnas en las filas

    let columnasInconsistentes = 0;

    lineas.slice(1).forEach((linea, idx) => {

        const colsLinea = linea.split(';').length;

        if (colsLinea !== cols.length && linea.trim()) {

            columnasInconsistentes++;

        }

    });



    if (columnasInconsistentes > 0) {

        resultado.advertencias.push(`${columnasInconsistentes} fila(s) tienen número de columnas diferente a la cabecera`);

    }



    return resultado;

}

// ── 3. Export público: parsearCSV ─────────────────────────────────────────────

export function parsearCSV(contenido, tipo) {

    const resultado = {

        datos: {},

        referencias: {},  // Solo para determinantes con refs Granada/Andalucía

        contador: 0,

        error: null,

        validacion: null

    };



    if (!contenido || !tipo) {

        resultado.error = 'Contenido o tipo no especificado';

        return resultado;

    }



    // Validar estructura antes de parsear

    const validacion = validarCSV(contenido, tipo);

    resultado.validacion = validacion;



    if (!validacion.valido) {

        resultado.error = validacion.error;

        return resultado;

    }



    // MC1: strip BOM (Excel UTF-8 con BOM añade \uFEFF — rompe detección de formato)
    contenido = contenido.replace(/^\uFEFF/, '');

    const lineas = contenido.split('\n');

    if (lineas.length < 2) {

        resultado.error = 'El archivo está vacío o no tiene datos';

        return resultado;

    }



    // Detectar si tiene cabecera válida (primera línea)

    const cabecera = lineas[0]?.toLowerCase() || '';



    try {

        switch (tipo) {

            case 'indicadores':

                // Formato: Numero;Indicador;Valor;Unidad;TendenciaObservada;TendenciaDeseada

                lineas.forEach((linea, idx) => {

                    if (idx === 0 || !linea.trim()) return;

                    const cols = linea.split(';');

                    if (cols.length >= 2 && cols[0].trim()) {

                        const num = cols[0].trim();

                        resultado.datos[num] = {

                            nombre: cols[1]?.replace(/"/g, '').trim() || '',

                            dato: cols[2]?.trim() || '',

                            unidad: cols[3]?.trim() || '',

                            tendenciaObservada: cols[4]?.trim() || '',

                            tendenciaDeseada: cols[5]?.trim() || ''

                        };

                        resultado.contador++;

                    }

                });

                break;



            case 'determinantes':

                // Detectar formato según cabecera

                // Formato nuevo con referencias: Area;Codigo;Pregunta;Unidad;ValorMunicipio;RefGranada;RefAndalucia

                // Formato antiguo 5 cols: Area;Codigo;Pregunta;Escala;Valor

                // Formato simple 4 cols: Codigo;Indicador;Valor;Unidad

                const tieneReferencias = cabecera.includes('granada') || cabecera.includes('andalucia') || cabecera.includes('refgranada');



                // Detectar formato simple: primera columna es "codigo" (no "area")

                const primeraColumna = cabecera.split(';')[0]?.trim().toLowerCase() || '';

                const esFormatoSimple = primeraColumna === 'codigo' || primeraColumna === 'código';



                console.log('📊 Parseo determinantes:', { cabecera: cabecera.substring(0, 50), primeraColumna, esFormatoSimple, tieneReferencias });



                lineas.forEach((linea, idx) => {

                    if (idx === 0 || !linea.trim()) return;

                    const cols = linea.split(';');



                    if (esFormatoSimple && cols.length >= 3) {

                        // Formato simple: Codigo;Indicador;Valor;Unidad

                        const codigo = cols[0]?.trim();

                        if (codigo) {

                            resultado.datos[codigo] = {

                                area: '',

                                codigo: codigo,

                                pregunta: cols[1]?.replace(/"/g, '').trim() || '',

                                unidad: cols[3]?.trim() || '%',

                                valor: cols[2]?.trim() ? parseFloat(cols[2].replace(',', '.')) : null

                            };

                            resultado.contador++;

                        }

                    } else if (cols.length >= 3 && cols[1]?.trim()) {

                        const codigo = cols[1].trim();



                        if (tieneReferencias && cols.length >= 7) {

                            // Formato nuevo con referencias

                            resultado.datos[codigo] = {

                                area: cols[0]?.trim() || '',

                                codigo: codigo,

                                pregunta: cols[2]?.trim() || '',

                                unidad: cols[3]?.trim() || '',

                                valor: cols[4]?.trim() ? parseFloat(cols[4].replace(',', '.')) : null

                            };

                            // Guardar referencias separadamente

                            const refGranada = cols[5]?.trim() ? parseFloat(cols[5].replace(',', '.')) : null;

                            const refAndalucia = cols[6]?.trim() ? parseFloat(cols[6].replace(',', '.')) : null;

                            if (refGranada !== null || refAndalucia !== null) {

                                resultado.referencias[codigo] = {

                                    refGranada: refGranada,

                                    refAndalucia: refAndalucia

                                };

                            }

                        } else {

                            // Formato antiguo sin referencias

                            resultado.datos[codigo] = {

                                area: cols[0]?.trim() || '',

                                codigo: codigo,

                                pregunta: cols[2]?.trim() || '',

                                escala: cols[3]?.trim() || '',

                                valor: cols[4]?.trim() ? parseFloat(cols[4].replace(',', '.')) : null

                            };

                        }

                        resultado.contador++;

                    }

                });

                break;



            case 'conclusiones':

            case 'recomendaciones':

                // Formato: Numero;Texto (puede tener más columnas, se concatenan)

                lineas.forEach((linea, idx) => {

                    if (idx === 0 || !linea.trim()) return;

                    const cols = linea.split(';');

                    if (cols.length >= 2) {

                        const num = cols[0].trim();

                        const texto = cols.slice(1).join(';').replace(/^"|"$/g, '').trim();

                        if (texto) {

                            resultado.datos[num] = texto;

                            resultado.contador++;

                        }

                    }

                });

                break;



            case 'priorizacion':

                // Formato: Numero;AreaPrioritaria;Problema;Justificacion;ProgramasRelacionados;Indicador;Meta

                const areas = {};

                lineas.forEach((linea, idx) => {

                    if (idx === 0 || !linea.trim()) return;

                    const cols = linea.split(';');

                    if (cols.length >= 2 && cols[0].trim()) {

                        const num = cols[0].trim();

                        areas[num] = {

                            areaPrioritaria: cols[1]?.trim() || '',

                            problema: cols[2]?.trim() || '',

                            justificacion: cols[3]?.trim() || '',

                            programasRelacionados: cols[4]?.trim().split('|').map(p => p.trim()).filter(p => p) || [],

                            indicador: cols[5]?.trim() || '',

                            meta: cols[6]?.trim() || ''

                        };

                        resultado.contador++;

                    }

                });

                resultado.datos = { areas: areas, fechaCarga: new Date().toISOString() };

                break;



            case 'programas':

                // Formato: Codigo;Nombre;Ambito;Descripcion;PoblacionDiana;Objetivos;Actuaciones

                lineas.forEach((linea, idx) => {

                    if (idx === 0 || !linea.trim()) return;

                    const cols = linea.split(';');

                    if (cols.length >= 2 && cols[0].trim()) {

                        const codigo = cols[0].trim();

                        resultado.datos[codigo] = {

                            codigo: codigo,

                            nombre: cols[1]?.trim() || '',

                            ambito: cols[2]?.trim() || '',

                            descripcion: cols[3]?.trim() || '',

                            poblacionDiana: cols[4]?.trim() || '',

                            objetivos: cols[5]?.trim().split('|').map(o => o.trim()).filter(o => o) || [],

                            actuaciones: cols[6]?.trim().split('|').map(a => a.trim()).filter(a => a) || []

                        };

                        resultado.contador++;

                    }

                });

                break;



            case 'referencias':

                // Formato: Area;Codigo;Pregunta;Unidad;RefGranada;RefAndalucia

                lineas.forEach((linea, idx) => {

                    if (idx === 0 || !linea.trim()) return;

                    const cols = linea.split(';');

                    if (cols.length >= 6 && cols[1]?.trim()) {

                        const codigo = cols[1].trim();

                        resultado.datos[codigo] = {

                            area: cols[0]?.trim() || '',

                            codigo: codigo,

                            pregunta: cols[2]?.trim() || '',

                            unidad: cols[3]?.trim() || '',

                            refGranada: cols[4]?.trim() ? parseFloat(cols[4].replace(',', '.')) : null,

                            refAndalucia: cols[5]?.trim() ? parseFloat(cols[5].replace(',', '.')) : null

                        };

                        resultado.contador++;

                    }

                });

                break;



            default:

                resultado.error = 'Tipo de CSV no reconocido: ' + tipo;

        }

    } catch (e) {

        resultado.error = 'Error parseando CSV: ' + e.message;

    }



    return resultado;

}
