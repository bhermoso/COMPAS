# ARQUITECTURA OBJETIVO — COMPÁS

> Documento de referencia para la transición del monolito HTML+JS a una plataforma institucional modular.
> Fecha de creación: 2026-03-12. No modifica código.

---

## 1. Reglas de dominio

### Ámbito territorial
- Todo el sistema depende de un **ámbito territorial activo** en todo momento.
- Ámbitos posibles: **municipio**, **mancomunidad**, **distrito municipal**.
- No existe jerarquía funcional entre ellos; son equivalentes a efectos de planificación.

### Plan territorial
- Un ámbito puede tener **varios planes territoriales sucesivos** (no simultáneos).
- El **plan territorial** es la unidad principal de planificación.
- Un plan tiene tantas **agendas anuales** como anualidades dure el plan.
- **Plan de acción y agenda anual son entidades distintas**: el plan de acción es el compilado multianual; la agenda anual es la programación operativa de un ejercicio.
- Las agendas anuales **no forman parte** del compilado principal del plan.

### Indicadores y cuadro de mandos
- **Indicadores y cuadro de mandos integral son la misma entidad conceptual** (distintas vistas del mismo objeto de datos).

### Priorización
- Solo puede ser: **manual**, **estratégica**, **temática** o **mixta**.
- No se admiten otros modos de priorización.

### Origen de acciones
- Las acciones pueden originarse únicamente por:
  - `generador_automatico`
  - `selector_epvsa`
  - `manual_agenda`

### Inteligencia artificial
- La IA es **apoyo técnico**, no decisora automática.
- Ninguna decisión de planificación puede ser tomada exclusivamente por la IA sin revisión humana.

---

## 2. Arquitectura objetivo de carpetas

```
compas/
├── core/
│   ├── ambito.js             # Gestión del ámbito territorial activo
│   ├── estado.js             # Estado global de la aplicación (store mínimo)
│   └── eventos.js            # Bus de eventos interno (pub/sub ligero)
│
├── dominio/
│   ├── plan/
│   │   ├── PlanTerritorial.js     # Entidad plan + ciclo de vida
│   │   ├── AgendaAnual.js         # Entidad agenda anual (independiente del plan)
│   │   └── Actuacion.js           # Entidad acción (origen, prioridad, indicadores)
│   ├── diagnostico/
│   │   ├── IBSE.js                # Modelo IBSE (I1-I7) y agregación
│   │   └── Indicador.js           # Entidad indicador / cuadro de mandos
│   ├── priorizacion/
│   │   └── Priorizacion.js        # Modos: manual | estratégica | temática | mixta
│   └── evaluacion/
│       └── Evaluacion.js          # Proceso y resultados (Fase 6)
│
├── persistencia/
│   ├── firebase/
│   │   ├── FirebaseAdapter.js     # Wrapper sobre Firebase SDK existente
│   │   ├── PlanRepository.js      # CRUD plan en Firebase
│   │   ├── AgendaRepository.js    # CRUD agenda anual en Firebase
│   │   └── IBSERepository.js      # Lectura ibse_respuestas / ibse_monitor
│   └── csv/
│       └── CSVImporter.js         # Importación de datos IBSE por CSV
│
├── ia/
│   ├── MotorExperto.js            # COMPAS_EXPERT_SYSTEM / ANALYTIC_CONFIG
│   ├── GeneradorAcciones.js       # generador_automatico
│   └── AsistenteTexto.js          # Redacción asistida (apoyo, no decisora)
│
├── ui/
│   ├── fases/
│   │   ├── Fase1_Ambito.js        # Selección de ámbito territorial
│   │   ├── Fase2_Diagnostico.js   # Panel IBSE + estudios complementarios
│   │   ├── Fase3_Priorizacion.js  # Priorización de objetivos
│   │   ├── Fase4_Plan.js          # Plan de acción (compilado)
│   │   ├── Fase5_Agenda.js        # Agenda anual
│   │   └── Fase6_Evaluacion.js    # Proceso + resultados + jornada
│   ├── modales/
│   │   ├── ModalIBSE.js           # modal-ibse-monitor + modal-ibse-cuestionario
│   │   ├── ModalMonitorIBSE.js    # modal-monitor-ibse (iframe a monitor_ibse.html)
│   │   └── ModalQueEsCOMPAS.js    # Modal informativo institucional
│   └── componentes/
│       ├── Semaforo.js            # Semáforo de proceso (eval_actualizarProceso)
│       ├── TablaIndicadores.js    # Tabla obj→indicadores
│       └── BadgeFuente.js         # ibse-badge-fuente
│
└── util/
    ├── fecha.js                   # Formateo y cálculo de fechas
    ├── exportacion.js             # PDF, Word, impresión
    └── sincronizacion.js          # sincronizarPlanConAgenda()
```

---

## 3. Estrategia de transición

### Fase A — Monolito estructurado (sin mover código)
**Objetivo:** documentar y delimitar fronteras lógicas dentro del HTML actual sin cambiar comportamiento.

Acciones:
1. Identificar y etiquetar bloques funcionales en el código existente con comentarios `// [MÓDULO: nombre]`.
2. Crear un mapa de dependencias entre funciones globales.
3. Definir las interfaces de cada módulo futuro (contratos de entrada/salida).
4. Acordar el modelo de estado global mínimo (`core/estado.js`).
5. Establecer convención de nombrado para la extracción progresiva.

Criterio de salida: cada función existente tiene asignado un módulo destino documentado.

---

### Fase B — Monolito modular (extracción progresiva)
**Objetivo:** extraer módulos uno a uno, manteniendo el HTML principal como orquestador.

Orden de extracción recomendado (menor riesgo → mayor riesgo):

| Orden | Módulo | Motivo |
|-------|--------|--------|
| 1 | `util/fecha.js`, `util/exportacion.js` | Sin dependencias de estado |
| 2 | `dominio/priorizacion/Priorizacion.js` | Lógica pura, sin UI ni Firebase |
| 3 | `persistencia/firebase/FirebaseAdapter.js` | Aislar SDK antes de tocar lógica |
| 4 | `ia/MotorExperto.js` | Bloque autocontenido (ANALYTIC_CONFIG) |
| 5 | `dominio/diagnostico/IBSE.js` | Bien delimitado, con tests posibles |
| 6 | `persistencia/*/Repositories` | Depende de FirebaseAdapter listo |
| 7 | `dominio/plan/` | Mayor complejidad, extraer al final |
| 8 | `ui/fases/` + `ui/modales/` | Última capa, depende de todo lo anterior |

Regla durante Fase B:
- Cada extracción se valida con el comportamiento observable antes de continuar.
- No se extrae el siguiente módulo hasta que el anterior pasa validación manual.
- El HTML principal importa los módulos vía `<script type="module">` progresivamente.

---

### Fase C — Plataforma modular (opcional, largo plazo)
**Objetivo:** separar ficheros en sistema de archivos real, habilitar tests unitarios, CI/CD institucional.

Acciones:
- Mover a estructura de carpetas definitiva.
- Añadir bundler ligero (Vite o esbuild) sin introducir frameworks de UI.
- Tests unitarios para dominio y persistencia.
- Firebase Rules revisadas según nuevos paths de acceso.

---

## 4. Riesgos principales de la refactorización

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|-------------|---------|------------|
| R1 | **Estado global implícito** — variables globales (`window.datosIBSE`, `municipioActual`, etc.) usadas en múltiples lugares sin contrato formal | Alta | Alto | Inventariar todas las variables globales antes de Fase A; centralizar en `core/estado.js` antes de extraer módulos |
| R2 | **Acoplamiento UI–lógica** — funciones de dominio mezclan manipulación DOM con lógica de negocio | Alta | Alto | Separar en Fase B: extraer primero la lógica pura, dejar el DOM en el HTML hasta Fase C |
| R3 | **Pérdida de funcionalidad silenciosa** — el monolito tiene código condicional difícil de rastrear (fallbacks Firebase, guardias de municipio) | Media | Alto | Crear checklist de comportamientos observables antes de cada extracción |
| R4 | **Rutas Firebase hardcodeadas** — paths como `ibse_respuestas/{mun}` y `planAccion` dispersos en el código | Alta | Medio | Centralizar todas las rutas en `persistencia/firebase/FirebaseAdapter.js` en el paso 3 de Fase B |
| R5 | **Bug MINGW64 con caracteres especiales** — `Á` en nombres de archivo falla con `cp` bash | Conocido | Bajo | Mantener convención de usar `shutil.copy2` de Python para cualquier copia de archivos de salida |
| R6 | **Regresión en motor experto** — `ANALYTIC_CONFIG` y `COMPAS_EXPERT_SYSTEM` tienen lógica analítica compleja y frágil | Media | Alto | Extraer como unidad atómica sin modificar; añadir tests de salida antes de mover |
| R7 | **Modales duplicados IBSE** — tres modales con responsabilidades solapadas (`modal-ibse-monitor`, `modal-monitor-ibse`, `modal-ibse-cuestionario`) | Conocida | Medio | Documentar responsabilidad exacta de cada modal antes de extraer; no consolidar sin análisis |
| R8 | **Importación ES modules vs scripts clásicos** — mezclar `<script>` y `<script type="module">` puede romper acceso a funciones globales desde atributos HTML (`onclick=`) | Media | Medio | Mantener funciones de entrada en scope global durante Fase B; migrar handlers al final |

---

*Fin del documento. Revisar y actualizar al inicio de cada fase de transición.*
