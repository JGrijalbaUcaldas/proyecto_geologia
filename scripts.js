// Variable global para la base de datos
let geologicalDatabase = [];

// Elementos del DOM (se inicializan cuando el DOM está listo)
let searchForm;
let searchNameInput;
let searchTypeSelect;
let resultsContainer;
let toggleViewBtn;
let editModal;
let editForm;
let closeModal;
let cancelEditBtn;

// Estado de visualización
let currentView = 'grid'; // 'grid' o 'table'
let ultimosBuscados = []; // Guardar últimos resultados

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado');
    
    // Inicializar elementos del DOM
    searchForm = document.getElementById('searchForm');
    searchNameInput = document.getElementById('searchName');
    searchTypeSelect = document.getElementById('searchType');
    resultsContainer = document.getElementById('resultsContainer');
    toggleViewBtn = document.getElementById('toggleView');
    editModal = document.getElementById('editModal');
    editForm = document.getElementById('editForm');
    closeModal = document.querySelector('.close');
    cancelEditBtn = document.getElementById('cancelEdit');

    // Agregar event listeners
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        realizarBusqueda();
    });

    toggleViewBtn.addEventListener('click', alternarVisualizacion);
    closeModal.addEventListener('click', cerrarModal);
    cancelEditBtn.addEventListener('click', cerrarModal);
    editForm.addEventListener('submit', guardarCambios);

    // Cerrar modal si se hace click afuera
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            cerrarModal();
        }
    });

    // Mostrar mensaje inicial
    resultsContainer.innerHTML = '<p class="info-message">Ingresa los parámetros de búsqueda y presiona "Buscar"</p>';

    // Cargar la base de datos
    cargarBaseDatos();
});

// Función para cargar la base de datos
function cargarBaseDatos() {
    fetch('db_geologia.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            geologicalDatabase = data;
            console.log('✅ Base de datos cargada correctamente');
            console.log(`📊 Total de registros: ${geologicalDatabase.length}`);
        })
        .catch(error => {
            console.error('❌ Error al cargar la base de datos:', error);
            resultsContainer.innerHTML = '<p class="no-results">❌ Error: No se pudo cargar la base de datos. Asegúrate de: 1) Usar un servidor HTTP (no file://), 2) El archivo db_geologia.json exista en la carpeta del proyecto.</p>';
        });
}

// Función de búsqueda
function realizarBusqueda() {
    const nombre = searchNameInput.value.toLowerCase().trim();
    const tipo = searchTypeSelect.value;

    // Filtrar resultados
    let resultados = geologicalDatabase.filter(item => {
        const coincideNombre = nombre === '' || item.nombre.toLowerCase().includes(nombre);
        const coincideTipo = tipo === '' || item.tipo === tipo;
        
        return coincideNombre && coincideTipo;
    });

    // Guardar último búsqueda
    ultimosBuscados = resultados;

    // Mostrar resultados
    mostrarResultados(resultados);
}

// Función para alternar visualización
function alternarVisualizacion() {
    currentView = currentView === 'grid' ? 'table' : 'grid';
    
    if (currentView === 'table') {
        toggleViewBtn.textContent = '🔲 Vista Banner';
    } else {
        toggleViewBtn.textContent = '📊 Vista Tabla';
    }
    
    // Mostrar últimos resultados con nueva vista
    mostrarResultados(ultimosBuscados);
}

// Función para mostrar resultados
function mostrarResultados(resultados) {
    resultsContainer.innerHTML = '';

    if (resultados.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No se encontraron resultados. Intenta con otros parámetros.</p>';
        return;
    }

    if (currentView === 'table') {
        mostrarResultadosTabla(resultados);
    } else {
        mostrarResultadosGrid(resultados);
    }
}

// Mostrar resultados en vista de grid (tarjetas)
function mostrarResultadosGrid(resultados) {
    resultados.forEach(item => {
        const card = crearTarjetaResultado(item);
        resultsContainer.appendChild(card);
    });
}

// Mostrar resultados en vista de tabla
function mostrarResultadosTabla(resultados) {
    const tabla = document.createElement('table');
    tabla.className = 'results-table';
    
    // Encabezados
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Acciones</th>
        </tr>
    `;
    tabla.appendChild(thead);
    
    // Filas de datos
    const tbody = document.createElement('tbody');
    resultados.forEach(item => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td style="text-align: center; font-size: 1.5em;">${item.imagen}</td>
            <td><strong>${item.nombre}</strong></td>
            <td><span class="result-type">${item.tipo}</span></td>
            <td>${item.descripcion.substring(0, 50)}...</td>
            <td>
                <div class="table-actions" style="flex-direction: column; gap: 5px;">
                    <button class="btn-print" onclick="generarPDF(${item.id})" style="width: 100%; padding: 6px;">📄 PDF</button>
                    <button class="btn-edit" onclick="abrirModalEditar(${item.id})" style="width: 100%; padding: 6px;">✏️ Editar</button>
                    <button class="btn-delete" onclick="eliminarRegistro(${item.id})" style="width: 100%; padding: 6px;">🗑️ Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(fila);
    });
    tabla.appendChild(tbody);
    
    resultsContainer.appendChild(tabla);
}

// Función para crear tarjeta de resultado
function crearTarjetaResultado(item) {
    const card = document.createElement('div');
    card.className = 'result-card';

    const caracteristicasHTML = item.caracteristicas
        .map(caract => `<li>${caract}</li>`)
        .join('');

    card.innerHTML = `
        <div class="result-image">${item.imagen}</div>
        <div class="result-content">
            <div class="result-title">${item.nombre}</div>
            <span class="result-type">${item.tipo}</span>
            <p class="result-description">${item.descripcion}</p>
            <div class="result-characteristics">
                <div class="characteristics-label">📋 Características especiales:</div>
                <ul class="characteristics-list">
                    ${caracteristicasHTML}
                </ul>
            </div>
            <div class="result-actions">
                <button class="btn-print" onclick="generarPDF(${item.id})" style="flex: 1.2; margin-right: 8px;">📄 Imprimir PDF</button>
                <button class="btn-edit" onclick="abrirModalEditar(${item.id})" style="margin-right: 8px;">✏️ Editar</button>
                <button class="btn-delete" onclick="eliminarRegistro(${item.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `;

    return card;
}

// Función para abrir modal de edición
function abrirModalEditar(id) {
    const item = geologicalDatabase.find(x => x.id === id);
    
    if (!item) return;
    
    document.getElementById('editId').value = item.id;
    document.getElementById('editNombre').value = item.nombre;
    document.getElementById('editTipo').value = item.tipo;
    document.getElementById('editDescripcion').value = item.descripcion;
    document.getElementById('editImagen').value = item.imagen;
    document.getElementById('editCaracteristicas').value = item.caracteristicas.join('\n');
    
    editModal.style.display = 'block';
}

// Función para cerrar modal
function cerrarModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

// Función para guardar cambios
function guardarCambios(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('editId').value);
    const item = geologicalDatabase.find(x => x.id === id);
    
    if (!item) return;
    
    item.nombre = document.getElementById('editNombre').value;
    item.tipo = document.getElementById('editTipo').value;
    item.descripcion = document.getElementById('editDescripcion').value;
    item.imagen = document.getElementById('editImagen').value;
    item.caracteristicas = document.getElementById('editCaracteristicas').value
        .split('\n')
        .map(c => c.trim())
        .filter(c => c !== '');
    
    cerrarModal();
    mostrarResultados(ultimosBuscados);
    
    alert('✅ Registro actualizado correctamente');
}

// Función para eliminar registro
function eliminarRegistro(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        const index = geologicalDatabase.findIndex(x => x.id === id);
        if (index > -1) {
            const nombreEliminado = geologicalDatabase[index].nombre;
            geologicalDatabase.splice(index, 1);
            
            // Actualizar últimos buscados
            ultimosBuscados = ultimosBuscados.filter(x => x.id !== id);
            
            mostrarResultados(ultimosBuscados);
            alert(`✅ Registro "${nombreEliminado}" eliminado correctamente`);
        }
    }
}

// Función para generar PDF
function generarPDF(id) {
    const item = geologicalDatabase.find(x => x.id === id);
    
    if (!item) {
        alert('❌ No se encontró el registro');
        return;
    }

    // Crear contenido HTML para el PDF
    const contenidoHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; color: #333;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #555; padding-bottom: 20px;">
                <div style="font-size: 60px; margin-bottom: 10px;">${item.imagen}</div>
                <h1 style="margin: 0; color: #2c2c2c;">${item.nombre}</h1>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Tipo: <strong>${item.tipo}</strong></p>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Generado: ${new Date().toLocaleDateString()}</p>
            </div>

            <div style="margin-bottom: 30px;">
                <h2 style="color: #2c2c2c; border-bottom: 2px solid #888; padding-bottom: 10px; margin-bottom: 15px;">Descripción</h2>
                <p style="line-height: 1.6; text-align: justify; color: #555;">${item.descripcion}</p>
            </div>

            <div style="background: #f5f5f5; padding: 20px; border-left: 4px solid #666; border-radius: 4px;">
                <h2 style="color: #2c2c2c; margin-top: 0; border-bottom: 2px solid #888; padding-bottom: 10px; margin-bottom: 15px;">Características Especiales</h2>
                <ul style="line-height: 1.8; color: #555;">
                    ${item.caracteristicas.map(caract => `<li style="margin-bottom: 8px;">${caract}</li>`).join('')}
                </ul>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
                <p>Base de Datos Geológica - Proyecto Electiva Tecnológica I</p>
            </div>
        </div>
    `;

    // Crear un elemento temporal
    const elemento = document.createElement('div');
    elemento.innerHTML = contenidoHTML;
    
    // Configurar opciones para html2pdf
    const opt = {
        margin: 10,
        filename: `${item.nombre.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    // Generar y descargar el PDF
    html2pdf().set(opt).from(elemento).save();
    
    alert(`✅ PDF "${item.nombre}" descargado correctamente`);
}

// Mostrar mensaje inicial cuando la página carga
document.addEventListener('DOMContentLoaded', function() {
    resultsContainer.innerHTML = '<p class="info-message">Ingresa los parámetros de búsqueda y presiona "Buscar"</p>';
});
