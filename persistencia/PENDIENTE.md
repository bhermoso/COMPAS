# persistencia/ — Pendiente de extraer

Módulos planificados (ver MAPA_MODULOS_IMPLICITOS.md, módulos M04/M06/M07/M11/M15/M20/M21):

- `firebase/FirebaseAdapter.js`     — Wrapper sobre Firebase SDK existente (sin cambiar backend)
- `firebase/paths.js`               — Repositorio centralizado de rutas Firebase (18 patrones)
- `firebase/PlanRepository.js`      — CRUD plan en Firebase
- `firebase/AgendaRepository.js`    — CRUD agenda anual en Firebase
- `firebase/IBSERepository.js`      — Lectura ibse_respuestas / ibse_monitor
- `csv/CSVImporter.js`              — Importación de datos IBSE y determinantes por CSV

**Estado actual:** todo sigue heredado en index.html (inline JS).
**Prioridad:** FirebaseAdapter y paths.js son el primer paso recomendado (ver ARQUITECTURA_OBJETIVO.md Fase B orden 3).
