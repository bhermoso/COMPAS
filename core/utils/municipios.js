/**
 * COMPÁS — Catálogo de municipios y utilidad de nombre
 * core/utils/municipios.js
 *
 * Extraído de COMPAS.html (L.9295, L.14578) el 2026-03-14
 *
 * Orden de definición:
 *   1. MUNICIPIOS           — export const  (COMPAS.html L.9295)
 *   2. getNombreMunicipio() — export function (COMPAS.html L.14578)
 *
 * MÓDULO PURO: Sin DOM. Sin Firebase. Sin efectos secundarios.
 */

// ── 1. Export: MUNICIPIOS ─────────────────────────────────────────────────────

export const MUNICIPIOS = {

    'agron': { nombre: 'Agrón', tieneInforme: false },

    'albolote': { nombre: 'Albolote', tieneInforme: false },

    'albunuelas': { nombre: 'Albuñuelas', tieneInforme: false },

    'alfacar': { nombre: 'Alfacar', tieneInforme: false },

    'algarinejo': { nombre: 'Algarinejo', tieneInforme: false },

    'alhama-de-granada': { nombre: 'Alhama de Granada', tieneInforme: false },

    'alhendin': { nombre: 'Alhendín', tieneInforme: false },

    'arenas-del-rey': { nombre: 'Arenas del Rey', tieneInforme: false },

    'armilla': { nombre: 'Armilla', tieneInforme: false },

    'atarfe': { nombre: 'Atarfe', tieneInforme: false },

    'benalua-de-las-villas': { nombre: 'Benalúa de las Villas', tieneInforme: false },

    'cacin': { nombre: 'Cacín', tieneInforme: false },

    'cajar': { nombre: 'Cájar', tieneInforme: false },

    'calicasas': { nombre: 'Calicasas', tieneInforme: false },

    'campotejar': { nombre: 'Campotéjar', tieneInforme: false },

    'cenes-de-la-vega': { nombre: 'Cenes de la Vega', tieneInforme: false },

    'chauchina': { nombre: 'Chauchina', tieneInforme: false },

    'chimeneas': { nombre: 'Chimeneas', tieneInforme: false },

    'churriana-de-la-vega': { nombre: 'Churriana de la Vega', tieneInforme: false },

    'cijuela': { nombre: 'Cijuela', tieneInforme: false },

    'cogollos-vega': { nombre: 'Cogollos Vega', tieneInforme: false },

    'colomera': { nombre: 'Colomera', tieneInforme: false },

    'cullar-vega': { nombre: 'Cúllar-Vega', tieneInforme: false },

    'deifontes': { nombre: 'Deifontes', tieneInforme: false },

    'dilar': { nombre: 'Dílar', tieneInforme: false },

    'dudar': { nombre: 'Dúdar', tieneInforme: false },

    'durcal': { nombre: 'Dúrcal', tieneInforme: false },

    'el-pinar': { nombre: 'El Pinar', tieneInforme: false },

    'el-valle': { nombre: 'El Valle', tieneInforme: false },

    'escuzar': { nombre: 'Escúzar', tieneInforme: false },

    'fuente-vaqueros': { nombre: 'Fuente Vaqueros', tieneInforme: false },

    'gobernador': { nombre: 'Gobernador', tieneInforme: false },

    'gojar': { nombre: 'Gójar', tieneInforme: false },

    'granada-albaicin': { nombre: 'Granada - Albaicín', tieneInforme: false },

    'granada-beiro': { nombre: 'Granada - Beiro', tieneInforme: false },

    'granada-centro': { nombre: 'Granada - Centro', tieneInforme: false },

    'granada-chana': { nombre: 'Granada - Chana', tieneInforme: false },

    'granada-genil': { nombre: 'Granada - Genil', tieneInforme: false },

    'granada-norte': { nombre: 'Granada - Norte', tieneInforme: false },

    'granada-ronda': { nombre: 'Granada - Ronda', tieneInforme: false },

    'granada-zaidin': { nombre: 'Granada - Zaidín', tieneInforme: false },

    'guadahortuna': { nombre: 'Guadahortuna', tieneInforme: false },

    'guejar-sierra': { nombre: 'Güejar Sierra', tieneInforme: false },

    'guevejar': { nombre: 'Güevéjar', tieneInforme: false },

    'huetor-tajar': { nombre: 'Huétor-Tájar', tieneInforme: false },

    'huetor-vega': { nombre: 'Huétor-Vega', tieneInforme: false },

    'illora': { nombre: 'Íllora', tieneInforme: false },

    'iznalloz': { nombre: 'Iznalloz', tieneInforme: false },

    'jayena': { nombre: 'Jayena', tieneInforme: false },

    'la-malaha': { nombre: 'La Malahá', tieneInforme: false },

    'la-zubia': { nombre: 'La Zubia', tieneInforme: false },

    'lachar': { nombre: 'Láchar', tieneInforme: false },

    'las-gabias': { nombre: 'Las Gabias', tieneInforme: false },

    'lecrin': { nombre: 'Lecrín', tieneInforme: false },

    'loja': { nombre: 'Loja', tieneInforme: false },

    'mancomunidad-alhama': { nombre: 'Mancomunidad de Alhama de Granada', tieneInforme: false },

    'mancomunidad-lecrin': { nombre: 'Mancomunidad del Valle de Lecrín', tieneInforme: false },

    'maracena': { nombre: 'Maracena', tieneInforme: false },

    'moclin': { nombre: 'Moclín', tieneInforme: false },

    'monachil': { nombre: 'Monachil', tieneInforme: false },

    'montefrio': { nombre: 'Montefrío', tieneInforme: false },

    'montejicar': { nombre: 'Montejícar', tieneInforme: false },

    'montillana': { nombre: 'Montillana', tieneInforme: false },

    'moraleda-de-zafayona': { nombre: 'Moraleda de Zafayona', tieneInforme: false },

    'niguelas': { nombre: 'Nigüelas', tieneInforme: false },

    'nivar': { nombre: 'Nívar', tieneInforme: false },

    'ogijares': { nombre: 'Ogíjares', tieneInforme: false },

    'otura': { nombre: 'Otura', tieneInforme: false },

    'padul': { nombre: 'Padul', tieneInforme: true },

    'peligros': { nombre: 'Peligros', tieneInforme: false },

    'pinar': { nombre: 'Píñar', tieneInforme: false },

    'pinos-genil': { nombre: 'Pinos-Genil', tieneInforme: false },

    'pinos-puente': { nombre: 'Pinos-Puente', tieneInforme: false },

    'pulianas': { nombre: 'Pulianas', tieneInforme: false },

    'quentar': { nombre: 'Quéntar', tieneInforme: false },

    'salar': { nombre: 'Salar', tieneInforme: false },

    'santa-cruz-del-comercio': { nombre: 'Santa Cruz del Comercio', tieneInforme: false },

    'santa-fe': { nombre: 'Santa Fe', tieneInforme: false },

    'torre-cardela': { nombre: 'Torre-Cardela', tieneInforme: false },

    'vegas-del-genil': { nombre: 'Vegas del Genil', tieneInforme: false },

    'ventas-de-huelma': { nombre: 'Ventas de Huelma', tieneInforme: false },

    'villamena': { nombre: 'Villamena', tieneInforme: false },

    'villanueva-mesia': { nombre: 'Villanueva Mesía', tieneInforme: false },

    'viznar': { nombre: 'Víznar', tieneInforme: false },

    'zafarraya': { nombre: 'Zafarraya', tieneInforme: false },

    'zagra': { nombre: 'Zagra', tieneInforme: false }

};

// ── 2. Export: getNombreMunicipio ─────────────────────────────────────────────

export function getNombreMunicipio(key) {

    if (!key) return '';

    if (MUNICIPIOS[key] && MUNICIPIOS[key].nombre) return MUNICIPIOS[key].nombre;

    return key.replace(/-/g, ' ').replace(/\w/g, function(c){ return c.toUpperCase(); });

}
