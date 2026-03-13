# core/ — Pendiente de extraer

Módulos planificados para este directorio (ver ARQUITECTURA_OBJETIVO.md):

- `estadoGlobal.js`     — Store mínimo: datosMunicipioActual, planLocalSalud, accionesAgenda
- `ambito.js`           — Gestión del ámbito territorial activo (actualizarMunicipio)
- `eventos.js`          — Bus de eventos interno pub/sub ligero

**Estado actual:** solo `main.js` (bootstrap). El resto sigue heredado en index.html.
