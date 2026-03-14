/**
 * COMPÁS — Generador HTML de conclusiones y recomendaciones para documento PDF
 * core/documentos/conclusionesPDF.js
 *
 * Extraído de COMPAS.html (L.29546) el 2026-03-14
 *
 * MÓDULO PURO: Sin DOM. Sin Firebase. Sin efectos secundarios.
 * Recibe todos los datos por parámetro y devuelve string HTML.
 */

// ── Export público: generarConclusionesCompletasPDF ───────────────────────────

export function generarConclusionesCompletasPDF(conclusiones, recomendaciones, nombre) {

    let html = '<div class="concl-grid">';



    const conclArray = typeof conclusiones === 'object' ? Object.values(conclusiones) : [];

    const recomArray = typeof recomendaciones === 'object' ? Object.values(recomendaciones) : [];

    const maxItems = Math.max(conclArray.length, recomArray.length, 1);



    for (let i = 0; i < maxItems; i++) {

        const concl = conclArray[i] || '';

        const recom = recomArray[i] || '';



        // Manejar diferentes formatos de datos

        let textoConclusion = '';

        let textoRecomendacion = '';



        if (typeof concl === 'object') {

            // Formato antiguo: {conclusion: '...', recomendacion: '...'}

            textoConclusion = concl.conclusion || concl.texto || '';

            textoRecomendacion = concl.recomendacion || '';

        } else {

            // Formato nuevo: solo texto de conclusión

            textoConclusion = concl;

        }



        // Si recomendaciones vienen por separado

        if (!textoRecomendacion && recom) {

            textoRecomendacion = typeof recom === 'object' ? (recom.texto || recom.recomendacion || '') : recom;

        }



        // Reemplazar nombre de municipio si es genérico

        textoConclusion = textoConclusion.replace(/\[MUNICIPIO\]/g, nombre);

        textoRecomendacion = textoRecomendacion.replace(/\[MUNICIPIO\]/g, nombre);



        html += '<div class="concl-card">';

        html += '<div class="concl-num">' + String(i + 1).padStart(2, '0') + '</div>';

        html += '<div class="concl-tipo">Conclusión</div>';

        html += '<p>' + textoConclusion + '</p>';

        if (textoRecomendacion) {

            html += '<div class="recom"><div class="concl-tipo">Recomendación</div>';

            html += '<p>' + textoRecomendacion + '</p></div>';

        }

        html += '</div>';

    }



    html += '</div>';

    return html;

}
