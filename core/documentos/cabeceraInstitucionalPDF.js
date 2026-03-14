/**
 * COMPÁS — Cabecera institucional y portada para documentos PDF
 * core/documentos/cabeceraInstitucionalPDF.js
 *
 * Extraído de COMPAS.html (L.29958, L.30088) el 2026-03-14
 *
 * Orden de definición:
 *   1. generarCabeceraInstitucional()  — export público (COMPAS.html L.29958)
 *   2. generarPortadaPLS()             — export público (COMPAS.html L.30088)
 *
 * MÓDULO PURO: Sin DOM. Sin Firebase. Sin efectos secundarios.
 */

import {
    LOGO_CONSEJERIA_B64,
    LOGO_DISTRITO_B64,
    LOGO_RELAS_B64,
    LOGO_VIOLENCIA_B64,
    LOGO_RASSELH_B64
} from '../assets/logos.js';

// ── 1. Export público: generarCabeceraInstitucional ───────────────────────────

export function generarCabeceraInstitucional(tipoDocumento, nombreMunicipio, opciones = {}) {

    const anio = opciones.anio || new Date().getFullYear();

    const periodoVigencia = opciones.periodoVigencia || '2026 — 2030';



    // Obtener logos base64

    const logoConsejeria = typeof LOGO_CONSEJERIA_B64 !== 'undefined' ? 'data:image/jpeg;base64,' + LOGO_CONSEJERIA_B64 : '';

    const logoDistrito = typeof LOGO_DISTRITO_B64 !== 'undefined' ? 'data:image/png;base64,' + LOGO_DISTRITO_B64 : '';

    const logoRelas = typeof LOGO_RELAS_B64 !== 'undefined' ? 'data:image/jpeg;base64,' + LOGO_RELAS_B64 : '';

    const logoViolencia = typeof LOGO_VIOLENCIA_B64 !== 'undefined' ? 'data:image/gif;base64,' + LOGO_VIOLENCIA_B64 : '';

    const logoRasselh = typeof LOGO_RASSELH_B64 !== 'undefined' ? 'data:image/jpeg;base64,' + LOGO_RASSELH_B64 : '';



    // Determinar título según tipo de documento

    let titulo = '';

    let mostrarPeriodo = false;

    switch(tipoDocumento) {

        case 'informe':

            titulo = 'Informe de la Situación de Salud';

            break;

        case 'perfil':

            titulo = 'Perfil de salud local';

            break;

        case 'plan':

            titulo = 'Plan local de salud';

            mostrarPeriodo = true;

            break;

        default:

            titulo = tipoDocumento;

    }



    let html = '<header class="header-institucional" style="padding: 1.5rem 2rem; page-break-after: always;">\n';

    html += '    <div style="display: flex; justify-content: center; text-align: center; flex-direction: column; align-items: center;">\n';



    // Logos institucionales centrados

    html += '        <div style="display: flex; justify-content: center; align-items: center; gap: 1.5rem; margin-bottom: 2rem; flex-wrap: nowrap;">\n';

    html += '            <img src="' + logoConsejeria + '" alt="Consejería de Sanidad, Presidencia y Emergencias" style="height: 170px; width: auto; max-width: 350px; object-fit: contain;">\n';

    html += '            <img src="' + logoDistrito + '" alt="Distrito de atención primaria Granada-Metropolitano" style="height: 140px; width: auto; max-width: 350px; object-fit: contain;">\n';

    html += '            <img src="' + logoRelas + '" alt="RELAS - Red de acción local en salud" style="height: 150px; width: auto; max-width: 350px; object-fit: contain;">\n';

    html += '            <img src="' + logoViolencia + '" alt="Centros comprometidos contra la Violencia de Género" style="height: 120px; width: auto; max-width: 350px; object-fit: contain;">\n';

    html += '            <img src="' + logoRasselh + '" alt="RASSELH" style="height: 140px; width: auto; max-width: 350px; object-fit: contain;">\n';

    html += '        </div>\n';



    // Branding COMPÁS

    html += '        <div style="text-align: center; margin-top: 1rem;">\n';

    html += '            <span style="font-size: 3.5rem; font-weight: 700; letter-spacing: 18px; text-transform: uppercase; color: #2c3e50; display: block; margin-bottom: 0.5rem;">COMPÁS</span>\n';

    html += '            <span style="font-size: 1rem; letter-spacing: 12px; text-transform: uppercase; font-weight: 300; color: #666; display: block;">Diseño ciudadano de la salud</span>\n';

    html += '        </div>\n';



    // Título del documento

    html += '        <div style="margin-top: 2rem; text-align: center;">\n';

    html += '            <h1 style="font-size: 2rem; color: #0074c8; margin-bottom: 0.5rem;">' + titulo + '</h1>\n';

    html += '            <div style="font-size: 2.5rem; font-weight: 700; color: #2c3e50; margin-bottom: 0.5rem;">' + nombreMunicipio + '</div>\n';

    if (mostrarPeriodo) {

        html += '            <div style="font-size: 1.2rem; color: #666; letter-spacing: 4px;">' + periodoVigencia + '</div>\n';

    } else {

        html += '            <div style="font-size: 1.2rem; color: #666; letter-spacing: 2px;">' + anio + '</div>\n';

    }

    html += '        </div>\n';



    html += '    </div>\n';

    html += '</header>\n';

    html += '<div style="height: 6px; background: linear-gradient(90deg, #0074c8 0%, #00acd9 20%, #94d40b 40%, #ffb61b 60%, #ff6600 80%, #dc143c 100%);"></div>\n';



    return html;

}

// ── 2. Export público: generarPortadaPLS ──────────────────────────────────────

export function generarPortadaPLS(nombre) {

    return generarCabeceraInstitucional('plan', nombre);

}
