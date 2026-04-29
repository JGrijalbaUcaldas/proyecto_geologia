// Variable global para la base de datos
let geologicalDatabase = [];

// Elementos del DOM (se inicializan cuando el DOM está listo)
let searchForm;
let searchNameInput;
let searchTypeSelect;
let sortingOption;
let resultsContainer;
let toggleViewBtn;
let editModal;
let editForm;
let closeModal;
let cancelEditBtn;
let detailsSection;
let closeDetailsBtn;
let btnPrincipal;

// Estado de visualización
let currentView = 'grid'; // 'grid' o 'table'
let ultimosBuscados = []; // Guardar últimos resultados
let especimenSeleccionado = null; // Para imprimir

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado');
    
    // Inicializar elementos del DOM
    searchForm = document.getElementById('searchForm');
    searchNameInput = document.getElementById('searchName');
    searchTypeSelect = document.getElementById('searchType');
    sortingOption = document.getElementById('sortingOption');
    resultsContainer = document.getElementById('resultsContainer');
    toggleViewBtn = document.getElementById('toggleView');
    editModal = document.getElementById('editModal');
    editForm = document.getElementById('editForm');
    closeModal = document.querySelector('.close');
    cancelEditBtn = document.getElementById('cancelEdit');
    detailsSection = document.getElementById('detailsSection');
    closeDetailsBtn = document.getElementById('closeDetails');
    btnPrincipal = document.getElementById('btnPrincipal');
    const openCreateBtn = document.getElementById('openCreateBtn');
    const extractImageBtn = document.getElementById('extractImageBtn');
    const editImagenInput = document.getElementById('editImagen');
    const editImagePreview = document.getElementById('editImagePreview');

    // Agregar event listeners
    searchNameInput.addEventListener('input', realizarBusqueda);
    searchTypeSelect.addEventListener('change', realizarBusqueda);
    sortingOption.addEventListener('change', realizarBusqueda);
    
    searchForm.addEventListener('reset', function() {
        setTimeout(realizarBusqueda, 0);
    });

    toggleViewBtn.addEventListener('click', alternarVisualizacion);
    closeModal.addEventListener('click', cerrarModal);
    cancelEditBtn.addEventListener('click', cerrarModal);
    closeDetailsBtn.addEventListener('click', cerrarDetalles);
    btnPrincipal.addEventListener('click', imprimirFichaSeleccionada);
    if (openCreateBtn) openCreateBtn.addEventListener('click', abrirModalCrear);
    if (extractImageBtn) extractImageBtn.addEventListener('click', async function() {
        const val = editImagenInput.value.trim();
        if (!val) return alert('Ingresa una URL o emoji en el campo de imagen');
        const found = await extractImageFromLink(val);
        if (found) {
            editImagenInput.value = found;
            setEditImagePreview(found);
        } else {
            alert('No se pudo extraer imagen desde el enlace proporcionado. Si es una URL directa de imagen, pégala directamente.');
        }
    });
    if (editImagenInput) editImagenInput.addEventListener('input', function() { setEditImagePreview(this.value); });
    editForm.addEventListener('submit', guardarCambios);

    // Cerrar modal si se hace click afuera
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            cerrarModal();
        }
    });

    // Mostrar mensaje inicial
    resultsContainer.innerHTML = '<p class="info-message">Ingresa los parámetros de búsqueda</p>';

    // Cargar la base de datos
    cargarBaseDatos();
});

// Función para cerrar detalles
function cerrarDetalles() {
    detailsSection.style.display = 'none';
    btnPrincipal.style.display = 'none';
    especimenSeleccionado = null;
}

// Función para cargar la base de datos
function cargarBaseDatos() {
    // Si hay datos guardados en localStorage, úsalos (preservar cambios del usuario)
    const stored = localStorage.getItem('geoDB_store');
    if (stored) {
        try {
            geologicalDatabase = JSON.parse(stored);
            console.log('✅ Base de datos cargada desde localStorage');
            console.log(`📊 Total de registros: ${geologicalDatabase.length}`);
            return;
        } catch (err) {
            console.warn('⚠️ Error parseando localStorage, cargando desde JSON original');
            localStorage.removeItem('geoDB_store');
        }
    }

    fetch('db_geologia.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            geologicalDatabase = data;
            console.log('✅ Base de datos cargada correctamente desde JSON');
            console.log(`📊 Total de registros: ${geologicalDatabase.length}`);
        })
        .catch(error => {
            console.error('❌ Error al cargar la base de datos:', error);
            resultsContainer.innerHTML = '<p class="no-results">❌ Error: No se pudo cargar la base de datos. Asegúrate de: 1) Usar un servidor HTTP (no file://), 2) El archivo db_geologia.json exista en la carpeta del proyecto.</p>';
        });
}

function guardarEnLocalStorage() {
    try {
        localStorage.setItem('geoDB_store', JSON.stringify(geologicalDatabase));
    } catch (err) {
        console.error('Error guardando en localStorage', err);
    }
}

// Función para ordenar resultados
function aplicarOrdenamiento(resultados) {
    const ordenamiento = sortingOption.value;
    let ordenados = [...resultados];

    switch(ordenamiento) {
        case 'nombre':
            ordenados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));
            break;
        case 'nombre-desc':
            ordenados.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es', { numeric: true }));
            break;
        case 'tipo':
            ordenados.sort((a, b) => a.tipo.localeCompare(b.tipo, 'es', { numeric: true }));
            break;
        case 'reciente':
            ordenados.sort((a, b) => b.id - a.id);
            break;
        case 'antiguo':
            ordenados.sort((a, b) => a.id - b.id);
            break;
        default:
            ordenados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));
    }

    return ordenados;
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

    // Aplicar ordenamiento
    resultados = aplicarOrdenamiento(resultados);

    // Guardar último búsqueda
    ultimosBuscados = resultados;

    // Mostrar resultados
    mostrarResultados(resultados);
}

// Función para alternar visualización
function alternarVisualizacion() {
    currentView = currentView === 'grid' ? 'table' : 'grid';
    
    if (currentView === 'table') {
        toggleViewBtn.textContent = '🔲 Vista de Tarjetas';
    } else {
        toggleViewBtn.textContent = '📊 Vista de Tabla';
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
        fila.style.cursor = 'pointer';
        fila.innerHTML = `
            <td style="text-align: center; font-size: 1.5em;">${item.imagen}</td>
            <td><strong>${item.nombre}</strong></td>
            <td><span class="result-type">${item.tipo}</span></td>
            <td>${item.descripcion.substring(0, 50)}...</td>
            <td>
                <div class="table-actions" style="flex-direction: column; gap: 5px;">
                    <button class="btn-edit" onclick="abrirModalEditar(${item.id})" style="width: 100%; padding: 6px;">✏️ Editar</button>
                    <button class="btn-delete" onclick="eliminarRegistro(${item.id})" style="width: 100%; padding: 6px;">🗑️ Eliminar</button>
                </div>
            </td>
        `;
        
        // Hacer clickeable la fila (excepto los botones)
        fila.addEventListener('click', function(e) {
            if (!e.target.classList.contains('btn-edit') && !e.target.classList.contains('btn-delete') && !e.target.closest('button')) {
                especimenSeleccionado = item.id;
                mostrarDetalles(item);
            }
        });
        
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
                <div class="characteristics-label">📋 Características:</div>
                <ul class="characteristics-list">
                    ${caracteristicasHTML.substring(0, 150)}...
                </ul>
            </div>
            <div class="result-actions">
                <button class="btn-edit" onclick="abrirModalEditar(${item.id})" style="margin-right: 8px;">✏️ Editar</button>
                <button class="btn-delete" onclick="eliminarRegistro(${item.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `;

    // Agregar evento de click para mostrar detalles
    card.style.cursor = 'pointer';
    card.addEventListener('click', function(e) {
        if (!e.target.classList.contains('btn-edit') && !e.target.classList.contains('btn-delete')) {
            especimenSeleccionado = item.id;
            mostrarDetalles(item);
        }
    });

    return card;
}

// Función para mostrar detalles
function mostrarDetalles(item) {
    if (!item) return;

    document.getElementById('detailImage').textContent = item.imagen;
    document.getElementById('detailName').textContent = item.nombre;
    document.getElementById('detailType').textContent = item.tipo;
    document.getElementById('detailDescription').textContent = item.descripcion;
    
    const caracteristicasHTML = item.caracteristicas
        .map(caract => `<li>${caract}</li>`)
        .join('');
    
    document.getElementById('detailCharacteristics').innerHTML = caracteristicasHTML;
    
    document.getElementById('editDetailBtn').onclick = function() {
        abrirModalEditar(item.id);
    };
    
    document.getElementById('deleteDetailBtn').onclick = function() {
        eliminarRegistro(item.id);
    };
    
    // Mostrar la sección de detalles y el botón de imprimir
    detailsSection.style.display = 'block';
    btnPrincipal.style.display = 'block';
}
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

// Abrir modal para crear nuevo registro
function abrirModalCrear() {
    document.getElementById('editId').value = '';
    document.getElementById('editNombre').value = '';
    document.getElementById('editTipo').value = 'Mineral';
    document.getElementById('editDescripcion').value = '';
    document.getElementById('editImagen').value = '🔷';
    document.getElementById('editCaracteristicas').value = '';
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
    const idRaw = document.getElementById('editId').value;
    const id = idRaw ? parseInt(idRaw) : null;

    const payload = {
        nombre: document.getElementById('editNombre').value.trim() || 'Sin nombre',
        tipo: document.getElementById('editTipo').value,
        descripcion: document.getElementById('editDescripcion').value.trim() || 'Sin descripción',
        imagen: document.getElementById('editImagen').value.trim() || '🔷',
        caracteristicas: document.getElementById('editCaracteristicas').value
            .split('\n')
            .map(c => c.trim())
            .filter(c => c !== '')
    };

    if (id) {
        // Editar existente
        const item = geologicalDatabase.find(x => x.id === id);
        if (!item) return alert('Registro no encontrado');
        item.nombre = payload.nombre;
        item.tipo = payload.tipo;
        item.descripcion = payload.descripcion;
        item.imagen = payload.imagen;
        item.caracteristicas = payload.caracteristicas;
        guardarEnLocalStorage();
        cerrarModal();
        mostrarResultados(ultimosBuscados);
        alert('✅ Registro actualizado correctamente');
    } else {
        // Crear nuevo
        const maxId = geologicalDatabase.reduce((acc, cur) => Math.max(acc, cur.id || 0), 0);
        const newId = maxId + 1 || Date.now();
        const newItem = Object.assign({ id: newId }, payload);
        geologicalDatabase.push(newItem);
        guardarEnLocalStorage();
        cerrarModal();
        // Refrescar búsqueda para incluir nuevo item
        realizarBusqueda();
        // Mostrar detalles del nuevo elemento
        especimenSeleccionado = newId;
        mostrarDetalles(newItem);
        alert('✅ Nuevo registro creado correctamente');
    }
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

// Función para imprimir la ficha seleccionada
function imprimirFichaSeleccionada() {
    if (!especimenSeleccionado) {
        alert('❌ Debes seleccionar una ficha antes de imprimir');
        return;
    }

    const item = geologicalDatabase.find(x => x.id === especimenSeleccionado);
    
    if (!item) {
        alert('❌ No se encontró el registro');
        return;
    }

    // Crear contenido HTML para el PDF
    const contenidoHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 900px; color: #333; background: white;">
            <!-- Encabezado -->
            <div style="text-align: center; margin-bottom: 40px; border-bottom: 4px solid #2c7a3f; padding-bottom: 30px;">
                <div style="font-size: 100px; margin-bottom: 20px; line-height: 1;">${item.imagen}</div>
                <h1 style="margin: 15px 0; color: #2c7a3f; font-size: 32px; font-weight: bold;">${item.nombre}</h1>
                <div style="display: inline-block; background: #2c7a3f; color: white; padding: 6px 20px; border-radius: 25px; font-size: 14px; font-weight: 600; margin: 10px 0;">
                    ${item.tipo}
                </div>
                <p style="margin: 10px 0; font-size: 13px; color: #999;">ID: #${item.id}</p>
                <p style="margin: 5px 0; font-size: 13px; color: #999;">Impreso: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <!-- Descripción -->
            <div style="margin-bottom: 35px;">
                <h2 style="color: #2c7a3f; border-bottom: 3px solid #2c7a3f; padding-bottom: 10px; margin-bottom: 15px; font-size: 20px;">📝 Descripción</h2>
                <p style="line-height: 1.9; text-align: justify; color: #555; font-size: 15px;">${item.descripcion}</p>
            </div>

            <!-- Características -->
            <div style="background: linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%); padding: 30px; border-left: 6px solid #2c7a3f; border-radius: 8px; margin-bottom: 35px;">
                <h2 style="color: #2c7a3f; margin-top: 0; border-bottom: 3px solid #2c7a3f; padding-bottom: 12px; margin-bottom: 20px; font-size: 20px;">⭐ Características Especiales</h2>
                <ul style="line-height: 2; color: #555; margin-left: 20px; font-size: 15px;">
                    ${item.caracteristicas.map(caract => `<li style="margin-bottom: 10px;"><strong>${caract}</strong></li>`).join('')}
                </ul>
            </div>

            <!-- Pie de página -->
            <div style="text-align: center; margin-top: 45px; padding-top: 25px; border-top: 2px solid #ddd; color: #999; font-size: 12px;">
                <p style="margin: 5px 0;"><strong style="color: #333;">Base de Datos Geológica</strong></p>
                <p style="margin: 5px 0;">Proyecto Electiva Tecnológica I - Universidad</p>
                <p style="margin: 5px 0; font-style: italic;">Este documento es de consulta exclusivamente académica</p>
            </div>
        </div>
    `;

    // Crear un elemento temporal
    const elemento = document.createElement('div');
    elemento.innerHTML = contenidoHTML;
    
    // Configurar opciones para html2pdf
    const opt = {
        margin: 10,
        filename: `Ficha_${item.nombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    // Generar y descargar el PDF
    html2pdf().set(opt).from(elemento).save();
    
    console.log(`✅ PDF "${item.nombre}" generado correctamente`);
}
