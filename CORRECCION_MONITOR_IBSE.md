# CORRECCIÓN — 404 monitor_ibse.html en GitHub Pages

**Fecha:** 2026-03-13
**Error original:**
```
monitor_ibse.html:1 Failed to load resource: the server responded with a status of 404
```

---

## Causa exacta del 404

`monitor_ibse.html` **nunca existió en el repositorio Git** (COMPAS/). El archivo
se desarrolló localmente en `C:/Users/blash/Desktop/monitor_ibse.html` pero no fue
incluido en ningún commit. El repositorio de GitHub Pages no lo tenía y servía 404.

Confirmado: `git log --all -- monitor_ibse.html` devuelve vacío.

---

## Rutas afectadas

### 1. Iframe (carga estática al abrir la página)

| | Valor |
|---|---|
| Antes | `src="monitor_ibse.html"` |
| Después | `src="./monitor_ibse.html"` |

**Archivo:** `index.html`, línea 3628.

### 2. Función `ibse_abrirMonitor()` (asigna src dinámicamente)

| | Valor |
|---|---|
| Antes | `'monitor_ibse.html?municipio=...'` |
| Después | `'./monitor_ibse.html?municipio=...'` |

**Archivo:** `index.html`, función `ibse_abrirMonitor()` (~línea 28185).

> Las dos correcciones de ruta son preventivas: pasar de ruta relativa implícita
> a `./` explícita evita ambigüedades si el navegador resuelve la base URL desde
> un contexto diferente.

---

## Solución principal: crear monitor_ibse.html

Se crea `monitor_ibse.html` como página standalone autocontenida. Características:

| Aspecto | Implementación |
|---|---|
| Firebase | Inicializa su propia instancia con la misma config que COMPÁS |
| Municipio | Lee `?municipio=` y `?nombre=` del querystring |
| Ruta primaria | `ibse_respuestas/{mun}` — respuestas individuales |
| Ruta fallback | `ibse_monitor/{mun}` — agregado o colección legada |
| Formato agregado | Si `ibse_monitor/{mun}` tiene `n` y `media`, reconstruye array sintético |
| Renderizado | Semáforo IBSE, 4 factores, distribución por sexo, análisis textual |
| Fórmula | Idéntica a `calcularIBSE()` e `ibseMonitor_calcularIBSE()` de COMPÁS |
| Identidad visual | Franja signature COMPÁS, paleta azul-degradado |

### Lógica de carga

```
cargar()
  ├── ibse_respuestas/{mun}   ← tiene datos? → renderizar(arr)
  └── ibse_monitor/{mun}
        ├── ¿tiene campo n + media? → array sintético → renderizar
        └── ¿tiene objetos con total/ibse_total? → renderizar(arr)
        └── sin datos → mostrar panel "Sin datos"
```

---

## Cómo verificar en producción

1. **Abrir** `https://bhermoso.github.io/COMPAS/`
2. **Seleccionar** un municipio con datos IBSE (p.ej. Atarfe)
3. **Clicar** botón "📊 Monitor" en la fase IBSE
4. **Consola** no debe mostrar 404
5. **El iframe** debe mostrar el semáforo IBSE con datos de Firebase
6. **URL directa** en nueva pestaña: `https://bhermoso.github.io/COMPAS/monitor_ibse.html?municipio=atarfe&nombre=Atarfe`

### Señal de éxito en consola

No debe aparecer:
```
monitor_ibse.html:1 Failed to load resource: 404
```

El iframe debe mostrar el badge `📍 Atarfe` y el semáforo IBSE.
