# Corrección de los 3 casos pendientes
path = r'C:\Users\blash\Desktop\COMPAS\index.html'
with open(path, 'rb') as f:
    content = f.read().decode('utf-8')

before = len(content)

# Caso 1: confirm borrar datos — \n es literal JS (\\n en fuente), bullet es unicode
# La búsqueda necesita el literal \n (dos chars: backslash + n)
old1 = '\u2022 Determinantes\\n'
new1 = '\u2022 Indicadores EAS\\n'
n1 = content.count(old1)
content = content.replace(old1, new1)
print("confirm borrar datos [%dx]: %r -> %r" % (n1, old1[:40], new1[:40]))

# Caso 2: agenda seguimiento — texto con HTML entities (&#243; = ó)
old2 = 'Revisi&#243;n de indicadores, determinantes y nuevas evidencias disponibles.'
new2 = 'Revisi&#243;n de indicadores EAS y nuevas evidencias disponibles.'
n2 = content.count(old2)
content = content.replace(old2, new2)
print("agenda seguimiento [%dx]: %r -> %r" % (n2, old2[:60], new2[:60]))

# Caso 3: badge con valor 0 (sin numDet)
old3 = "badgeDet.textContent = '\U0001f4ca Determinantes: 0/' + TOTAL_DETERMINANTES_EPVSA;"
new3 = "badgeDet.textContent = '\U0001f4ca EAS: 0/' + TOTAL_DETERMINANTES_EPVSA;"
n3 = content.count(old3)
content = content.replace(old3, new3)
print("badge valor 0 [%dx]" % n3)

# Caso extra: narrativa JS "determinantes de la Encuesta Andaluza de Salud"
old4 = 'determinantes de la Encuesta Andaluza de Salud'
new4 = 'indicadores de la Encuesta Andaluza de Salud'
n4 = content.count(old4)
content = content.replace(old4, new4)
print("narrativa JS [%dx]: %r" % (n4, old4))

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("\nOK: %d -> %d chars (delta: %+d)" % (before, len(content), len(content) - before))
