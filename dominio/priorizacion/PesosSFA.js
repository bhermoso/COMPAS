/**
 * COMPÁS — Pesos normativos del modelo SFA (6 dimensiones)
 * dominio/priorizacion/PesosSFA.js
 *
 * Extraído de COMPAS.html (L.53240) el 2026-03-14 — A5 PLAN_TRANSICION_MONOLITO.md
 *
 * Definición canónica: window.COMPAS_PESOS_SFA (motor v3, COMPAS_analizarV3)
 *
 * MÓDULO PURO: Sin DOM. Sin Firebase. Sin efectos secundarios.
 */

export const COMPAS_PESOS_SFA = {

    // Pesos normativos justificados (MCDA: Marsh et al. 2016)

    // Suma = 1.00 | Ajustables por equipo técnico local

    epi:         0.28,  // Evidencia epidemiológica — máxima validez externa

    ciudadano:   0.22,  // Participación ciudadana — legitimidad democrática

    inequidad:   0.20,  // Equidad — mandato ético ODS 3.8 y EPVSA

    evidencia:   0.15,  // Evidencia local (IBSE, estudios) — especificidad municipal

    impacto:     0.10,  // Impacto potencial de intervención — efectividad

    convergencia:0.05   // Convergencia multi-fuente — robustez de la señal

    // factibilidad eliminada: varianza <0.01 en SFA, no discriminante

};
