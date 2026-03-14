/**
 * COMPÁS — Generadores HTML de agenda para documento PDF
 * core/documentos/agendaCompletaPDF.js
 *
 * Extraído de COMPAS.html (L.29156, L.30376) el 2026-03-14
 *
 * Orden de definición:
 *   1. generarAgendaCompletaPorEntorno()  — export público (COMPAS.html L.29156)
 *   2. generarCronogramaCompilado()       — export público (COMPAS.html L.30376)
 *
 * MÓDULO PURO: Sin DOM. Sin Firebase. Sin efectos secundarios.
 * Ambas funciones reciben datos por parámetro y devuelven string HTML.
 */

// ── 1. Export público: generarAgendaCompletaPorEntorno ────────────────────────

export function generarAgendaCompletaPorEntorno(acciones) {

    const entornos = {

        sanitario: { nombre: '🏥 entorno sanitario', color: '#0074c8', acciones: [] },

        comunitario: { nombre: '🏘️ entorno comunitario', color: '#94d40b', acciones: [] },

        educativo: { nombre: '🎓 entorno educativo', color: '#ffb61b', acciones: [] },

        laboral: { nombre: '🏢 entorno laboral', color: '#ff6600', acciones: [] }

    };



    // Clasificar acciones por entorno

    acciones.forEach(a => {

        if (entornos[a.entorno]) {

            entornos[a.entorno].acciones.push(a);

        }

    });



    let html = '';



    // Generar tabla completa para cada entorno

    for (const [key, entorno] of Object.entries(entornos)) {

        if (entorno.acciones.length === 0) continue;



        html += '<div class="sub"><div class="sub-header"><div class="sub-icon" style="background:' + entorno.color + '20;">' + entorno.nombre.split(' ')[0] + '</div><h3 class="sub-titulo">' + entorno.nombre + ' (' + entorno.acciones.length + ' actuaciones)</h3></div>';



        html += '<table class="tabla-actuaciones"><thead><tr><th>Código</th><th>Actuación</th><th>Programa</th><th>Trimestre</th><th>Prioridad</th></tr></thead><tbody>';



        entorno.acciones.forEach(a => {

            const prioridadClass = a.prioridad === 'alta' ? 'color:#dc143c;font-weight:600;' : (a.prioridad === 'media' ? 'color:#b45309;' : 'color:#00acd9;');

            html += '<tr>';

            html += '<td><code style="background:#f1f5f9;padding:0.2rem 0.4rem;border-radius:3px;font-size:0.8rem;">' + (a.codigo || '-') + '</code></td>';

            html += '<td><strong>' + a.nombre + '</strong></td>';

            html += '<td style="font-size:0.85rem;">' + (a.programa || '-') + '</td>';

            html += '<td>' + (a.trimestre || '-') + '</td>';

            html += '<td style="' + prioridadClass + '">' + (a.prioridad ? a.prioridad.charAt(0).toUpperCase() + a.prioridad.slice(1) : '-') + '</td>';

            html += '</tr>';

        });



        html += '</tbody></table></div>';

    }



    return html;

}

// ── 2. Export público: generarCronogramaCompilado ─────────────────────────────

export function generarCronogramaCompilado(acciones) {

    const trimestres = {T1: {s:0,c:0,e:0,l:0}, T2: {s:0,c:0,e:0,l:0}, T3: {s:0,c:0,e:0,l:0}, T4: {s:0,c:0,e:0,l:0}};

    const mapEnt = {sanitario:'s', comunitario:'c', educativo:'e', laboral:'l'};



    acciones.forEach(a => {

        const t = a.trimestre || 'T1';

        const e = mapEnt[a.entorno];

        if (trimestres[t] && e) trimestres[t][e]++;

    });



    let html = '<table><thead><tr><th>Trimestre</th><th>🏥</th><th>🏘️</th><th>🎓</th><th>🏢</th><th>Total</th></tr></thead><tbody>';

    let totales = {s:0,c:0,e:0,l:0};

    for (const [t, v] of Object.entries(trimestres)) {

        const total = v.s + v.c + v.e + v.l;

        html += '<tr><td><strong>' + t + '</strong></td><td>' + v.s + '</td><td>' + v.c + '</td><td>' + v.e + '</td><td>' + v.l + '</td><td><strong>' + total + '</strong></td></tr>';

        totales.s += v.s; totales.c += v.c; totales.e += v.e; totales.l += v.l;

    }

    const grandTotal = totales.s + totales.c + totales.e + totales.l;

    html += '<tr class="tabla-total"><td><strong>TOTAL</strong></td><td><strong>' + totales.s + '</strong></td><td><strong>' + totales.c + '</strong></td><td><strong>' + totales.e + '</strong></td><td><strong>' + totales.l + '</strong></td><td><strong>' + grandTotal + '</strong></td></tr>';

    html += '</tbody></table>';

    return html;

}
