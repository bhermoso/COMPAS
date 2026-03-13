# util/ — Pendiente de extraer

Módulos planificados (ver MAPA_MODULOS_IMPLICITOS.md):

- `fecha.js`          — Formateo y cálculo de fechas (funciones sin dependencias de estado)
- `exportacion.js`    — PDF (window.print), CSV builders, impresión
- `sincronizacion.js` — sincronizarPlanConAgenda() (l.~11467)
- `texto.js`          — Helpers de string (validaciones, parseo CSV, sanitización)

**Prioridad:** fecha.js y exportacion.js son los primeros pasos recomendados por ser funciones puras sin dependencias de estado (ver ARQUITECTURA_OBJETIVO.md Fase B orden 1).

**Estado actual:** todo sigue heredado en index.html (inline JS).
