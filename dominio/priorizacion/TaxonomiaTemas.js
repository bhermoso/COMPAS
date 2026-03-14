/**
 * COMPÁS — Taxonomía de temas de salud
 * dominio/priorizacion/TaxonomiaTemas.js
 *
 * Extraído de COMPAS.html (L.48246) el 2026-03-14 — A2 PLAN_TRANSICION_MONOLITO.md
 *
 * PRERREQUISITO PARA: scoring epidemiológico preciso en ia/motores/motorPriorizacion.js
 *
 * MÓDULO PURO: Sin DOM. Sin Firebase. Sin efectos secundarios.
 */

export const TAXONOMIA_TEMAS = {

    alimentacion:       { label: 'Alimentación y nutrición',           lineas: [1],   keyReg: /alimentaci[oó]n|nutri|obesidad|sobrepeso|dieta/i },

    actividad_fisica:   { label: 'Actividad física y sedentarismo',    lineas: [1],   keyReg: /actividad f[ií]sica|sedentarismo|ejercicio|deporte/i },

    salud_mental:       { label: 'Salud mental y bienestar emocional', lineas: [1],   keyReg: /salud mental|ansiedad|depresi[oó]n|bienestar emocional/i },

    tabaco:             { label: 'Tabaco',                             lineas: [1],   keyReg: /tabaco|tabaquismo|fumar/i },

    alcohol:            { label: 'Alcohol y otras drogas',             lineas: [1],   keyReg: /alcohol|bebida|consumo de riesgo/i },

    sueno:              { label: 'Sueño saludable',                    lineas: [1],   keyReg: /sue[ñn]o|insomnio|descanso|dormir/i },

    entorno:            { label: 'Entornos promotores de salud',       lineas: [2],   keyReg: /medioambiente|contaminaci[oó]n|entorno.*salud/i },

    desigualdad:        { label: 'Equidad y determinantes sociales',   lineas: [2],   keyReg: /desigualdad|inequidad|vulnerab|exclusi[oó]n|pobreza/i },

    envejecimiento:     { label: 'Envejecimiento activo',              lineas: [1],   keyReg: /envejecimiento|mayor|anciano|longevidad/i },

    infancia_juventud:  { label: 'Infancia y juventud',                lineas: [1],   keyReg: /infancia|ni[ñn]o|joven|adolescente|escolar/i },

    cronicas:           { label: 'Enfermedades crónicas',              lineas: [1],   keyReg: /cr[oó]nica|cardiovascular|diabetes|c[aá]ncer|hipertensi[oó]n/i },

    redes_sociales:     { label: 'Redes de apoyo social',              lineas: [1,2], keyReg: /red.*apoyo|soledad|comunidad|cohesi[oó]n/i }

};
