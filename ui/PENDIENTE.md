# ui/ — Pendiente de extraer

Módulos planificados (ver MAPA_MODULOS_IMPLICITOS.md, módulos M10/M12/M13/M14/M19):

- `fases/Fase1_Ambito.js`       — Selección de ámbito territorial
- `fases/Fase2_Diagnostico.js`  — Panel IBSE + estudios complementarios
- `fases/Fase3_Priorizacion.js` — Priorización de objetivos
- `fases/Fase4_Plan.js`         — Plan de acción (compilado)
- `fases/Fase5_Agenda.js`       — Agenda anual
- `fases/Fase6_Evaluacion.js`   — Proceso + resultados + jornada
- `modales/ModalIBSE.js`        — modal-ibse-monitor + modal-ibse-cuestionario
- `modales/ModalMonitorIBSE.js` — modal-monitor-ibse (iframe a monitor_ibse.html)
- `componentes/Semaforo.js`     — Semáforo de proceso (eval_actualizarProceso)
- `componentes/TablaIndicadores.js` — Tabla obj→indicadores

**Estado actual:** todo sigue heredado en index.html (inline JS).
**Nota:** UI es la última capa a extraer (ver ARQUITECTURA_OBJETIVO.md Fase B orden 8).
