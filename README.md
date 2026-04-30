# 🌍 Base de Datos Geológica

Sistema web para búsqueda y gestión de especímenes geológicos (piedras, minerales, moluscos y fósiles).

## ✨ Características

- **Búsqueda avanzada**: Filtra por nombre y tipo de espécimen
- **Dos vistas**: Vista de tarjetas (grid) y vista de tabla
- **Visualización completa**: Nombre, tipo, descripción, imagen y características especiales
- **Edición de registros**: Modifica cualquier espécimen
- **Eliminación de registros**: Remueve especímenes de la base de datos
- **Generación de PDF**: Exporta fichas individuales como documentos PDF descargables
- **Diseño responsivo**: Funciona en desktop, tablet y móvil
- **Paleta de colores gris**: Interfaz moderna y profesional

## 🛠️ Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Servidor HTTP local

## 📦 Instalación

1. **Clonar el repositorio**:
```bash
git clone https://github.com/tu-usuario/proyecto-geologia.git
cd proyecto-geologia
```

2. **Ejecutar servidor HTTP**:

**Con Python 3**:
```bash
python -m http.server 8000
```

**Con Python 2**:
```bash
python -m SimpleHTTPServer 8000
```

**Con Node.js (NPX)**:
```bash
npx http-server
```

3. **Abrir en navegador**:
```
http://localhost:8000
```

## 📂 Estructura del Proyecto

```
proyecto-geologia/
├── index.html           # Estructura HTML
├── styles.css          # Estilos y diseño
├── scripts.js          # Lógica y funcionalidad
├── db_geologia.json    # Base de datos de especímenes
├── generar_db.py       # Script para generar datos (opcional)
├── README.md           # Este archivo
└── .gitignore          # Archivos ignorados por Git
```

## 🎯 Uso

1. **Buscar especímenes**:
   - Ingresa el nombre (ej: "Cuarzo", "Ammonites")
   - Selecciona el tipo (Piedra, Mineral, Molusco, Fósil)
   - Presiona "Buscar"

2. **Cambiar vista**:
   - Haz clic en "📊 Vista Tabla" o "🔳 Vista Banner"

3. **Editar un espécimen**:
   - Haz clic en el botón "✏️ Editar"
   - Modifica los campos
   - Presiona "Guardar cambios"

4. **Eliminar un espécimen**:
   - Haz clic en "🗑️ Eliminar"
   - Confirma la acción

5. **Generar PDF**:
   - Haz clic en "📄 Imprimir PDF"
   - El PDF se descargará automáticamente

## 🗄️ Base de Datos

La base de datos está en formato JSON (`db_geologia.json`). Cada espécimen contiene:

```json
{
  "id": 1,
  "nombre": "Cuarzo",
  "tipo": "Mineral",
  "descripcion": "Descripción del espécimen...",
  "imagen": "🔷",
  "caracteristicas": [
    "Característica 1",
    "Característica 2"
  ]
}
```

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura
- **CSS3**: Diseño responsivo
- **JavaScript Vanilla**: Funcionalidad sin dependencias externas
- **html2pdf.js**: Generación de PDFs

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la Licencia MIT.

## 👤 Autor

**Jhoane**  
Proyecto Electiva Tecnológica I - Semestre 6

## 📞 Contacto

Para preguntas o sugerencias, abre un issue en el repositorio.

---

**Última actualización**: 28 de Abril de 2026
