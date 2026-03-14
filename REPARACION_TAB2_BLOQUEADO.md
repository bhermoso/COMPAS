# REPARACIÓN TAB 2 — BLOQUEADO

**Fecha:** 2026-03-14
**Archivo afectado:** `index.html` (repositorio `Desktop/COMPAS/`)
**Estado tras reparación:** ✅ TAB 2 operativo

---

## 1. Causa real del fallo

El commit `bf4f21e` ("Pipeline salutogénico + motores IA + rediseño TAB2") incluía el script `patch_priorizacion_tab2.py`, que había sido ejecutado previamente sobre `index.html` para añadir las tarjetas homogéneas de estudios complementarios y el nuevo diseño de priorización en TAB 2.

Ese patch introdujo un **string literal no cerrado** en el bloque `renderizarSeccionEstudios`, dentro del **Script 6** del HTML (bloque que empieza en HTML línea 46299). Al fallar el parsing de ese script completo, el motor JS de V8/Chrome nunca registraba las funciones definidas en él.

---

## 2. Error de sintaxis encontrado

**Localización:** Script 6, línea JS 870 (≈ HTML línea 47169)

**Código roto:**
```javascript
                + 'padding:0.36rem 0.65rem;font-size:0.74rem;font-weight:600;color:#475569;cursor:pointer;"
                + 'title="Abrir formulario de registro de datos">✏️ Registrar datos</button>',
```

**Problema:** El string `'padding:...cursor:pointer;"` abre con `'` pero no cierra — falta `'` antes del `+` de continuación.

**Código corregido:**
```javascript
                + 'padding:0.36rem 0.65rem;font-size:0.74rem;font-weight:600;color:#475569;cursor:pointer;"'
                + 'title="Abrir formulario de registro de datos">✏️ Registrar datos</button>',
```

**Origen:** El script `patch_priorizacion_tab2.py` tenía el patrón correcto en su código fuente (con el `'` de cierre tras el `"`), pero al aplicar el reemplazo sobre el archivo, el cierre `'` se perdió — probablemente por un mismatch entre la representación del string en Python y el contenido real del archivo.

---

## 3. Funciones que quedaban fuera de alcance

Las tres funciones reportadas como `is not defined` estaban **definidas** en el archivo pero en el **mismo Script 6** que fallaba por el SyntaxError:

| Función | Línea HTML | Estado antes | Estado después |
|---|---|---|---|
| `_cargarEstudiosFirebase` | L46557 | ❌ No registrada | ✅ Registrada |
| `renderizarSeccionEstudios` | L47027 | ❌ No registrada | ✅ Registrada |
| `renderizarSeccionPriorizacion` | L47526 | ❌ No registrada | ✅ Registrada |

Ninguna de las tres necesitaba ser recreada — solo era necesario que el script que las contiene parseara correctamente.

---

## 4. Corrección aplicada

**Una sola corrección:** añadir el `'` de cierre faltante en la línea 870 del Script 6.

```
Antes: + 'padding:...cursor:pointer;"
Después: + 'padding:...cursor:pointer;"'
```

Verificación con Node.js `--check`:
- Script 4 (1.2MB, JS principal): ✅ OK
- Script 5 (1.7KB): ✅ OK
- **Script 6 (191KB, TAB2 + estudios + priorizacion): ✅ OK tras corrección**
- Scripts 7–17: ✅ OK

---

## 5. Flujo TAB 2 — estado tras reparación

El flujo `actualizarMunicipio()` → TAB 2 queda operativo:

```
actualizarMunicipio(key)
  ├── _cargarEstudiosFirebase(key)       ✅ carga estudios desde Firebase
  ├── cargarParticipacionCiudadana(key)  ✅ carga datos VRELAS
  └── cargarDecisionPriorizacion(key)   ✅ carga decisiones

renderizarSeccionEstudios()             ✅ llamada en onclick acordeón (L3147)
                                        + llamada interna en callbacks (L46521, L46585...)
renderizarSeccionPriorizacion()         ✅ llamada en onclick acordeón (L3171)
                                        + guards typeof (L34187, L35517, L35559...)
```

---

## 6. Rediseños que se mantienen

| Rediseño | Estado |
|---|---|
| Tarjetas homogéneas de estudios complementarios (`_renderTarjetaEstudio`) | ✅ Mantenido |
| Nuevo diseño de priorización TAB 2 (estratégica · temática · mixta) | ✅ Mantenido |
| Terminología EAS (renombrado desde "Determinantes") | ✅ Mantenido |
| Rediseño de conclusiones/recomendaciones (campos estructurados salutogénicos) | ✅ Mantenido |
| ICP relegado a `<details>` cerrado | ✅ Mantenido |
| Monitor EAS (`monitor_eas.html`) | ✅ Mantenido |
| Monitor escalas diagnósticas (`monitor_escalas.html`) | ✅ Mantenido |

---

## 7. Rediseños que hubo que ajustar

**Ninguno.** La reparación fue quirúrgica: un solo carácter (`'`) añadido en una línea. No se revirtió ni modificó ningún rediseño previo.

---

## 8. Verificación pendiente (manual)

- [ ] Abrir TAB 2 en el navegador y confirmar que carga sin errores en consola
- [ ] Verificar que `renderizarSeccionEstudios()` muestra las tarjetas de estudios
- [ ] Verificar que `renderizarSeccionPriorizacion()` muestra el panel de priorización
- [ ] Verificar que el botón "Registrar datos" de escalas diagnósticas funciona
