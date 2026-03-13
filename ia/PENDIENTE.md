# ia/ — Pendiente de extraer

Módulos planificados (ver MAPA_MODULOS_IMPLICITOS.md, módulos M09/M16/M17):

- `MotorExperto.js`         — COMPAS_EXPERT_SYSTEM + ANALYTIC_CONFIG (motor v2, l.4220–4530)
- `GeneradorAcciones.js`    — generador_automatico de actuaciones en agenda
- `AsistenteTexto.js`       — Análisis de texto libre (COMPAS_analizarTextoEstudio, COMPAS_analizarTextoInforme)

**No extraer todavía:**
- Motor v3 (IIFE l.26620–27504): requiere unificar primero ANALYTIC_CONFIG y COMPAS_PESOS_SFA
- generarPropuestaIA / _generarPropuestaLocal: dependen del estado global; extraer tras core/

**Estado actual:** todo sigue heredado en index.html (inline JS).
**Prioridad:** MotorExperto es el primer paso recomendado (bloque autocontenido, ver ARQUITECTURA_OBJETIVO.md Fase B orden 4).
