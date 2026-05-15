// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

// Configuración de Firebase (igual a la del HTML)
const firebaseConfig = {
    apiKey: "AIzaSyDanK18_exa_GbMc2vWnwFrMGSR-Dw1gDI",
    authDomain: "proyecto-geologia.firebaseapp.com",
    projectId: "proyecto-geologia",
    storageBucket: "proyecto-geologia.firebasestorage.app",
    messagingSenderId: "1041014004819",
    appId: "1:1041014004819:web:fc5e0cfb38aea4d33b7aa6",
    measurementId: "G-PEZ7N7Q9Y5"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Variable global para la base de datos
let geologicalDatabase = [];

// Elementos del DOM (se inicializan cuando el DOM está listo)
let searchForm;
let searchGeneroInput;
let sortingOption;
let searchUnidadInput;
let searchLocalidadInput;
let searchEdadInput;
let searchCladoInput;
let searchAsociacionInput;
let searchFosilizacionInput;
let searchColectorInput;
let searchFechaInput;
let resultsContainer;
let toggleViewBtn;
let editModal;
let editForm;
let closeModal;
let cancelEditBtn;
let detailsSection;
let closeDetailsBtn;
let paginationContainer;

// Estado de visualización
let currentView = 'grid'; // 'grid' o 'table'
let ultimosBuscados = []; // Guardar últimos resultados
let especimenSeleccionado = null; // Registro seleccionado

// Variables de paginación
let currentPage = 1;
const itemsPerPage = 10;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado');
    
    // Inicializar elementos del DOM
    searchForm = document.getElementById('searchForm');
    searchGeneroInput = document.getElementById('searchGenero');
    sortingOption = document.getElementById('sortingOption');
    searchUnidadInput = document.getElementById('searchUnidad');
    searchLocalidadInput = document.getElementById('searchLocalidad');
    searchEdadInput = document.getElementById('searchEdad');
    searchCladoInput = document.getElementById('searchClado');
    searchAsociacionInput = document.getElementById('searchAsociacion');
    searchFosilizacionInput = document.getElementById('searchFosilizacion');
    searchColectorInput = document.getElementById('searchColector');
    searchFechaInput = document.getElementById('searchFecha');
    resultsContainer = document.getElementById('resultsContainer');
    paginationContainer = document.getElementById('paginationContainer');
    toggleViewBtn = document.getElementById('toggleView');
    editModal = document.getElementById('editModal');
    editForm = document.getElementById('editForm');
    closeModal = document.querySelector('.close');
    cancelEditBtn = document.getElementById('cancelEdit');
    detailsSection = document.getElementById('detailsSection');
    closeDetailsBtn = document.getElementById('closeDetails');
    const openCreateBtn = document.getElementById('openCreateBtn');
    const editNombreGroup = document.getElementById('editNombreGroup');
    const editTipoGroup = document.getElementById('editTipoGroup');
    const editNombreInput = document.getElementById('editNombre');
    const editTipoInput = document.getElementById('editTipo');
    const editFotoUpload = document.getElementById('editFotoUpload');
    const previewUploadBtn = document.getElementById('previewUploadBtn');
    const editFotoPreview = document.getElementById('editFotoPreview');
    const authBtn = document.getElementById('authBtn');

    // Agregar event listeners
    searchGeneroInput.addEventListener('input', realizarBusqueda);
    sortingOption.addEventListener('change', realizarBusqueda);
    searchUnidadInput.addEventListener('input', realizarBusqueda);
    searchLocalidadInput.addEventListener('input', realizarBusqueda);
    searchEdadInput.addEventListener('input', realizarBusqueda);
    searchCladoInput.addEventListener('input', realizarBusqueda);
    searchAsociacionInput.addEventListener('input', realizarBusqueda);
    searchFosilizacionInput.addEventListener('input', realizarBusqueda);
    searchColectorInput.addEventListener('input', realizarBusqueda);
    searchFechaInput.addEventListener('input', realizarBusqueda);
    
    searchForm.addEventListener('reset', function() {
        setTimeout(realizarBusqueda, 0);
    });

    toggleViewBtn.addEventListener('click', alternarVisualizacion);
    closeModal.addEventListener('click', cerrarModal);
    cancelEditBtn.addEventListener('click', cerrarModal);
    closeDetailsBtn.addEventListener('click', cerrarDetalles);
    if (openCreateBtn) openCreateBtn.addEventListener('click', abrirModalCrear);
    editForm.addEventListener('submit', guardarCambios);

    // Event listeners para carga de foto
    if (editFotoUpload) {
        editFotoUpload.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                previewUploadBtn.style.display = 'inline-block';
            }
        });
    }
    if (previewUploadBtn) {
        previewUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            convertirFotoABase64(editFotoUpload, editFotoPreview, document.getElementById('editFotoRuta'));
        });
    }

    // Manejo de Autenticación
    if (authBtn) {
        authBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    await signOut(auth);
                    alert('Cerraste sesión correctamente');
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                }
            } else {
                const email = prompt('Ingresa tu correo electrónico:');
                if (!email) return;
                const password = prompt('Ingresa tu contraseña:');
                if (!password) return;

                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    alert('Bienvenido administrador');
                } catch (error) {
                    console.error('Error de autenticación:', error);
                    alert('Credenciales incorrectas');
                }
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        const isAdmin = !!user;
        authBtn.textContent = isAdmin ? '🔓 Cerrar Sesión' : '🔐 Login';
        document.body.classList.toggle('guest-mode', !isAdmin);

        // Actualizar visibilidad de elementos admin
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });

        // Si estamos en la página de resultados, refrescamos la vista para mostrar/ocultar botones de editar/borrar
        if (ultimosBuscados.length > 0) {
            mostrarResultados(ultimosBuscados);
        }
    });

    // Cerrar modal si se hace click afuera
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            cerrarModal();
        }
    });

    // Cargar la base de datos desde Firestore
    cargarBaseDatos().then(() => {
        console.log('✅ Base de datos inicializada');
        // Mostrar los primeros 10 registros automáticamente
        currentPage = 1;
        ultimosBuscados = aplicarOrdenamiento(geologicalDatabase);
        mostrarResultados(ultimosBuscados);
    }).catch(err => {
        console.error('Error al inicializar la base de datos:', err);
    });
});

// Función para cerrar detalles
function cerrarDetalles() {
    detailsSection.style.display = 'none';
    especimenSeleccionado = null;
}

// Función para cargar la base de datos desde Firestore
async function cargarBaseDatos() {
    try {
        console.log('📡 Cargando datos desde Firestore...');
        const querySnapshot = await getDocs(collection(db, "geologia"));
        geologicalDatabase = [];
        
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            geologicalDatabase.push({
                id: docSnapshot.id,
                ...data
            });
        });
        
        console.log('✅ Base de datos cargada desde Firestore');
        console.log(`📊 Total de registros: ${geologicalDatabase.length}`);
        
        // Si no hay datos en Firestore, cargar desde JSON inicial
        //if (geologicalDatabase.length === 0) {
        //    console.log('📋 Firestore vacío, cargando datos iniciales desde JSON...');
        //    await cargarDatosIniciales();
        //}
    } catch (error) {
        console.error('❌ Error al cargar desde Firestore:', error);
        resultsContainer.innerHTML = '<p class="no-results">❌ Error: No se pudo conectar a Firestore. Verifica tu conexión a internet.</p>';
    }
}

// Función para cargar datos iniciales del JSON a Firestore (solo si está vacío)

// async function cargarDatosIniciales() {
//     try {
//         const response = await fetch('db_geologia.json');
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
        
//         for (const item of data) {
//             const docRef = await addDoc(collection(db, "geologia"), item);
//             geologicalDatabase.push({
//                 id: docRef.id,
//                 ...item
//             });
//         }
        
//         console.log('✅ Datos iniciales importados a Firestore');
//         console.log(`📊 Total de registros: ${geologicalDatabase.length}`);
//     } catch (error) {
//         console.error('❌ Error cargando datos iniciales:', error);
//         resultsContainer.innerHTML = '<p class="no-results">❌ Error: No se pudo cargar los datos iniciales. Asegúrate de que db_geologia.json exista.</p>';
//     }
// }

// Función para escapar HTML y prevenir XSS
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

function getFieldValue(item, ...keys) {
    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) {
            return item[key];
        }
    }
    return '';
}

function matchesFilter(value, itemValue) {
    if (!value) return true;
    if (itemValue === undefined || itemValue === null) return false;
    return itemValue.toString().toLowerCase().includes(value);
}

// Función de búsqueda
function realizarBusqueda() {
    const genero = searchGeneroInput.value.toLowerCase().trim();
    const unidad = searchUnidadInput.value.toLowerCase().trim();
    const localidad = searchLocalidadInput.value.toLowerCase().trim();
    const edad = searchEdadInput.value.toLowerCase().trim();
    const clado = searchCladoInput.value.toLowerCase().trim();
    const asociacion = searchAsociacionInput.value.toLowerCase().trim();
    const fosilizacion = searchFosilizacionInput.value.toLowerCase().trim();
    const colector = searchColectorInput.value.toLowerCase().trim();
    const fecha = searchFechaInput.value.toLowerCase().trim();

    // Filtrar resultados
    let resultados = geologicalDatabase.filter(item => {
        const coincideGenero = genero === '' || getFieldValue(item, 'Genero_Especie', 'generoEspecie').toString().toLowerCase().includes(genero);
        const coincideUnidad = matchesFilter(unidad, getFieldValue(item, 'Unidad_Estratigrafica', 'unidadEstratigrafica'));
        const coincideLocalidad = matchesFilter(localidad, getFieldValue(item, 'Localidad', 'localidad'));
        const coincideEdad = matchesFilter(edad, getFieldValue(item, 'Edad', 'edad'));
        const coincideClado = matchesFilter(clado, getFieldValue(item, 'Clado_Clasificacion', 'clado', 'cladoClasificacion'));
        const coincideAsociacion = matchesFilter(asociacion, getFieldValue(item, 'Asociacion_Paleontologica', 'asociacion', 'asociacionPaleontologica'));
        const coincideFosilizacion = matchesFilter(fosilizacion, getFieldValue(item, 'Tipo_Fosilzacion', 'fosilizacion'));
        const coincideColector = matchesFilter(colector, getFieldValue(item, 'Colector', 'colector'));
        const coincideFecha = matchesFilter(fecha, getFieldValue(item, 'Fecha_Recoleccion', 'fechaRecoleccion'));

        return coincideGenero && coincideUnidad && coincideLocalidad && coincideEdad && coincideClado && coincideAsociacion && coincideFosilizacion && coincideColector && coincideFecha;
    });

    // Aplicar ordenamiento
    resultados = aplicarOrdenamiento(resultados);

    // Guardar última búsqueda
    ultimosBuscados = resultados;
    
    // Reiniciar a la primera página
    currentPage = 1;

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
    
    // Reiniciar a la primera página
    currentPage = 1;
    
    // Mostrar últimos resultados con nueva vista
    mostrarResultados(ultimosBuscados);
}

// Función para mostrar resultados
function mostrarResultados(resultados) {
    resultsContainer.innerHTML = '';
    resultsContainer.classList.toggle('table-view', currentView === 'table');

    if (resultados.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No se encontraron resultados. Intenta con otros parámetros.</p>';
        paginationContainer.innerHTML = '';
        return;
    }

    // Calcular paginación
    const totalPages = Math.ceil(resultados.length / itemsPerPage);
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = resultados.slice(startIndex, endIndex);

    if (currentView === 'table') {
        mostrarResultadosTabla(paginatedResults);
    } else {
        mostrarResultadosGrid(paginatedResults);
    }

    // Renderizar controles de paginación
    renderPaginationControls(resultados.length);
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
            <th>Género / Especie</th>
            <th>Localidad</th>
            <th>Edad</th>
            <th>Acciones</th>
        </tr>
    `;
    tabla.appendChild(thead);
    
    // Filas de datos
    const tbody = document.createElement('tbody');
    resultados.forEach(item => {
        const fila = document.createElement('tr');
        fila.style.cursor = 'pointer';
        const genero = getFieldValue(item, 'Genero_Especie', 'generoEspecie', 'nombre');
        const localidad = getFieldValue(item, 'Localidad', 'localidad');
        const edad = getFieldValue(item, 'Edad', 'edad');

        // Celda Imagen
        const tdImg = document.createElement('td');
        tdImg.style.textAlign = 'center';
        tdImg.style.verticalAlign = 'middle';
        tdImg.innerHTML = renderImageMarkup(item.imagen); // El markup de imagen es controlado por renderImageMarkup

        // Celda Género
        const tdGen = document.createElement('td');
        const strongGen = document.createElement('strong');
        strongGen.textContent = genero;
        tdGen.appendChild(strongGen);

        // Celda Localidad
        const tdLoc = document.createElement('td');
        tdLoc.textContent = localidad;

        // Celda Edad
        const tdEdad = document.createElement('td');
        tdEdad.textContent = edad;

        // Celda Acciones
        const tdAct = document.createElement('td');
        const divAct = document.createElement('div');
        divAct.className = 'table-actions admin-only';
        divAct.style.flexDirection = 'column';
        divAct.style.gap = '5px';
        divAct.style.display = auth.currentUser ? 'flex' : 'none';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn-edit';
        editBtn.style.width = '100%';
        editBtn.style.padding = '6px';
        editBtn.textContent = '✏️ Editar';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-delete';
        deleteBtn.style.width = '100%';
        deleteBtn.style.padding = '6px';
        deleteBtn.textContent = '🗑️ Eliminar';

        divAct.appendChild(editBtn);
        divAct.appendChild(deleteBtn);
        tdAct.appendChild(divAct);

        fila.appendChild(tdImg);
        fila.appendChild(tdGen);
        fila.appendChild(tdLoc);
        fila.appendChild(tdEdad);
        fila.appendChild(tdAct);

        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            abrirModalEditar(item.id);
        });

        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            eliminarRegistro(item.id);
        });

        fila.addEventListener('click', function(e) {
            if (!e.target.closest('button')) {
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

    // Imagen
    const imgDiv = document.createElement('div');
    imgDiv.className = 'result-image';
    imgDiv.innerHTML = renderImageMarkup(item.imagen);
    card.appendChild(imgDiv);

    // Contenido
    const contentDiv = document.createElement('div');
    contentDiv.className = 'result-content';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'result-title';
    titleDiv.textContent = item.nombre;
    contentDiv.appendChild(titleDiv);

    const summaryP = document.createElement('p');
    summaryP.className = 'result-summary';
    summaryP.textContent = `${getFieldValue(item, 'Localidad', 'localidad')} · ${getFieldValue(item, 'Edad', 'edad')}`;
    contentDiv.appendChild(summaryP);

    const descP = document.createElement('p');
    descP.className = 'result-description';
    descP.textContent = item.descripcion;
    contentDiv.appendChild(descP);

    // Características
    const charDiv = document.createElement('div');
    charDiv.className = 'result-characteristics';

    const charLabel = document.createElement('div');
    charLabel.className = 'characteristics-label';
    charLabel.textContent = '📋 Características:';
    charDiv.appendChild(charLabel);

    const charList = document.createElement('ul');
    charList.className = 'characteristics-list';

    const caracts = item.caracteristicas || [];
    caracts.slice(0, 3).forEach(caract => {
        const li = document.createElement('li');
        li.textContent = caract;
        charList.appendChild(li);
    });

    if (caracts.length > 3) {
        const liExtra = document.createElement('li');
        liExtra.textContent = `...y ${caracts.length - 3} más`;
        charList.appendChild(liExtra);
    }
    charDiv.appendChild(charList);
    contentDiv.appendChild(charDiv);

    // Acciones
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'result-actions admin-only';
    actionsDiv.style.display = auth.currentUser ? 'flex' : 'none';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'btn-edit';
    editButton.style.marginRight = '8px';
    editButton.textContent = '✏️ Editar';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = '🗑️ Eliminar';

    actionsDiv.appendChild(editButton);
    actionsDiv.appendChild(deleteButton);
    contentDiv.appendChild(actionsDiv);

    card.appendChild(contentDiv);

    editButton.addEventListener('click', function(e) {
        e.stopPropagation();
        abrirModalEditar(item.id);
    });

    deleteButton.addEventListener('click', function(e) {
        e.stopPropagation();
        eliminarRegistro(item.id);
    });

    card.style.cursor = 'pointer';
    card.addEventListener('click', function(e) {
        if (!e.target.closest('button')) {
            especimenSeleccionado = item.id;
            mostrarDetalles(item);
        }
    });

    return card;
}

// Función para mostrar detalles
function mostrarDetalles(item) {
    if (!item) return;

    document.getElementById('detailImage').innerHTML = renderImageMarkup(item.imagen);
    document.getElementById('detailName').textContent = item.nombre;
    document.getElementById('detailType').textContent = item.tipo;
    document.getElementById('detailDescription').textContent = item.descripcion;
    document.getElementById('detailGenero').textContent = getFieldValue(item, 'Genero_Especie', 'generoEspecie', 'nombre');
    document.getElementById('detailNumeroColeccion').textContent = getFieldValue(item, 'Numero_Coleccion', 'numeroColeccion', 'Sin dato');
    document.getElementById('detailUnidad').textContent = getFieldValue(item, 'Unidad_Estratigrafica', 'unidadEstratigrafica');
    document.getElementById('detailLocalidad').textContent = getFieldValue(item, 'Localidad', 'localidad');
    document.getElementById('detailLitologia').textContent = getFieldValue(item, 'Litologia', 'litologia');
    document.getElementById('detailEdad').textContent = getFieldValue(item, 'Edad', 'edad');
    document.getElementById('detailClado').textContent = getFieldValue(item, 'Clado_Clasificacion', 'clado', 'cladoClasificacion');
    document.getElementById('detailAsociacion').textContent = getFieldValue(item, 'Asociacion_Paleontologica', 'asociacion', 'asociacionPaleontologica');
    document.getElementById('detailFosilizacion').textContent = getFieldValue(item, 'Tipo_Fosilzacion', 'fosilizacion');
    document.getElementById('detailColector').textContent = getFieldValue(item, 'Colector', 'colector');
    document.getElementById('detailFecha').textContent = getFieldValue(item, 'Fecha_Recoleccion', 'fechaRecoleccion');
    document.getElementById('detailClasifico').textContent = getFieldValue(item, 'Clasifico', 'clasifico');
    
    const charList = document.getElementById('detailCharacteristics');
    charList.innerHTML = '';

    const caracts = item.caracteristicas || [];
    if (caracts.length === 0) {
        const liEmpty = document.createElement('li');
        liEmpty.textContent = '-';
        charList.appendChild(liEmpty);
    } else {
        caracts.forEach(caract => {
            const li = document.createElement('li');
            li.textContent = caract;
            charList.appendChild(li);
        });
    }

    document.getElementById('editDetailBtn').onclick = function() {
        abrirModalEditar(item.id);
    };
    
    document.getElementById('deleteDetailBtn').onclick = function() {
        eliminarRegistro(item.id);
    };
    document.getElementById('printDetailBtn').onclick = function() {
        imprimirRegistro(item);
    };
    
    detailsSection.style.display = 'block';
}

function imprimirRegistro(item) {
    const imageMarkup = renderImageMarkup(item.imagen);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('No se pudo abrir la ventana de impresión. Verifica que el bloqueador de ventanas emergentes esté desactivado.');
        return;
    }

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Imprimir registro</title>
<style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #222; }
    h1 { margin-top: 0; }
    .record-image img { max-width: 100%; height: auto; display: block; margin-bottom: 20px; }
    .metadata { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
    .metadata strong { display: block; margin-bottom: 4px; }
    .section { margin-bottom: 20px; }
    .section ul { padding-left: 18px; }
    .print-button { margin-bottom: 20px; padding: 10px 16px; border: none; background: #2c7a3f; color: white; border-radius: 6px; cursor: pointer; }
</style>
</head>
<body>
<button class="print-button" onclick="window.print();">Imprimir</button>
<h1>${escapeHTML(item.nombre || 'Registro')}</h1>
<div class="record-image">${imageMarkup}</div>
<p><strong>Tipo:</strong> ${escapeHTML(item.tipo || '-')}</p>
<div class="section">
    <h2>Descripción</h2>
    <p>${escapeHTML(item.descripcion || '-')}</p>
</div>
<div class="metadata">
    <div><strong>Género / Especie:</strong> ${escapeHTML(getFieldValue(item, 'Genero_Especie', 'generoEspecie', 'nombre') || '-')}</div>
    <div><strong>Número colección:</strong> ${escapeHTML(getFieldValue(item, 'Numero_Coleccion', 'numeroColeccion') || '-')}</div>
    <div><strong>Unidad estratigráfica:</strong> ${escapeHTML(getFieldValue(item, 'Unidad_Estratigrafica', 'unidadEstratigrafica') || '-')}</div>
    <div><strong>Localidad:</strong> ${escapeHTML(getFieldValue(item, 'Localidad', 'localidad') || '-')}</div>
    <div><strong>Litología:</strong> ${escapeHTML(getFieldValue(item, 'Litologia', 'litologia') || '-')}</div>
    <div><strong>Edad:</strong> ${escapeHTML(getFieldValue(item, 'Edad', 'edad') || '-')}</div>
    <div><strong>Clado:</strong> ${escapeHTML(getFieldValue(item, 'Clado_Clasificacion', 'clado', 'cladoClasificacion') || '-')}</div>
    <div><strong>Asociación:</strong> ${escapeHTML(getFieldValue(item, 'Asociacion_Paleontologica', 'asociacion', 'asociacionPaleontologica') || '-')}</div>
    <div><strong>Fosilización:</strong> ${escapeHTML(getFieldValue(item, 'Tipo_Fosilzacion', 'fosilizacion') || '-')}</div>
    <div><strong>Colector:</strong> ${escapeHTML(getFieldValue(item, 'Colector', 'colector') || '-')}</div>
    <div><strong>Recolección:</strong> ${escapeHTML(getFieldValue(item, 'Fecha_Recoleccion', 'fechaRecoleccion') || '-')}</div>
    <div><strong>Clasificó:</strong> ${escapeHTML(getFieldValue(item, 'Clasifico', 'clasifico') || '-')}</div>
</div>
<div class="section">
    <h2>Características</h2>
    <ul>${(item.caracteristicas || []).map(caract => `<li>${escapeHTML(caract)}</li>`).join('') || '<li>-</li>'}</ul>
</div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
}

function abrirModalEditar(id) {
    const item = geologicalDatabase.find(x => x.id === id);
    
    if (!item) return;
    
    document.getElementById('editId').value = item.id;
    document.getElementById('editNombre').value = item.nombre;
    document.getElementById('editTipo').value = item.tipo;
    document.getElementById('editDescripcion').value = item.descripcion;
    document.getElementById('editNombreGroup').style.display = '';
    document.getElementById('editTipoGroup').style.display = '';
    document.getElementById('editNombre').disabled = true;
    document.getElementById('editTipo').disabled = true;
    document.getElementById('editGeneroEspecie').value = getFieldValue(item, 'Genero_Especie', 'generoEspecie');
    document.getElementById('editNumeroColeccion').value = getFieldValue(item, 'Numero_Coleccion', 'numeroColeccion');
    document.getElementById('editCoordenadaX').value = getFieldValue(item, 'Coordenadas')?.x ?? '';
    document.getElementById('editCoordenadaY').value = getFieldValue(item, 'Coordenadas')?.y ?? '';
    document.getElementById('editUnidad').value = getFieldValue(item, 'Unidad_Estratigrafica', 'unidadEstratigrafica');
    document.getElementById('editLocalidad').value = getFieldValue(item, 'Localidad', 'localidad');
    document.getElementById('editLitologia').value = getFieldValue(item, 'Litologia', 'litologia');
    document.getElementById('editEdad').value = getFieldValue(item, 'Edad', 'edad');
    document.getElementById('editClado').value = getFieldValue(item, 'Clado_Clasificacion', 'clado', 'cladoClasificacion');
    document.getElementById('editAsociacion').value = getFieldValue(item, 'Asociacion_Paleontologica', 'asociacion', 'asociacionPaleontologica');
    document.getElementById('editFosilizacion').value = getFieldValue(item, 'Tipo_Fosilzacion', 'fosilizacion');
    document.getElementById('editColector').value = getFieldValue(item, 'Colector', 'colector');
    document.getElementById('editFecha').value = getFieldValue(item, 'Fecha_Recoleccion', 'fechaRecoleccion');
    document.getElementById('editClasifico').value = getFieldValue(item, 'Clasifico', 'clasifico');
    
    // Cargar la foto desde el campo imagen (que contiene URL o base64)
    const foto = getFieldValue(item, 'imagen', 'Foto_Ruta', 'fotoRuta');
    document.getElementById('editFotoRuta').value = foto;
    document.getElementById('editFotoUpload').value = '';
    
    // Cargar previsualización si existe foto
    const previewDiv = document.getElementById('editFotoPreview');
    if (foto && (isBase64(foto) || isValidUrl(foto))) {
        previewDiv.innerHTML = `<img src="${foto}" alt="Vista previa" style="max-width: 100%; height: auto; border-radius: 4px;">`;
    } else {
        previewDiv.innerHTML = '';
    }
    
    editModal.style.display = 'block';
}

// Abrir modal para crear nuevo registro
function abrirModalCrear() {
    document.getElementById('editId').value = '';
    document.getElementById('editNombre').value = '';
    document.getElementById('editTipo').value = 'Mineral';
    document.getElementById('editDescripcion').value = '';
    document.getElementById('editNombreGroup').style.display = '';
    document.getElementById('editTipoGroup').style.display = '';
    document.getElementById('editNombre').disabled = false;
    document.getElementById('editTipo').disabled = false;
    document.getElementById('editGeneroEspecie').value = '';
    document.getElementById('editNumeroColeccion').value = '';
    document.getElementById('editCoordenadaX').value = '';
    document.getElementById('editCoordenadaY').value = '';
    document.getElementById('editUnidad').value = '';
    document.getElementById('editLocalidad').value = '';
    document.getElementById('editLitologia').value = '';
    document.getElementById('editEdad').value = '';
    document.getElementById('editClado').value = '';
    document.getElementById('editAsociacion').value = '';
    document.getElementById('editFosilizacion').value = '';
    document.getElementById('editColector').value = '';
    document.getElementById('editFecha').value = '';
    document.getElementById('editClasifico').value = '';
    document.getElementById('editFotoRuta').value = '';
    document.getElementById('editFotoUpload').value = '';
    document.getElementById('editFotoPreview').innerHTML = '';
    editModal.style.display = 'block';
}

// Función para cerrar modal
function cerrarModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

function isValidUrl(value) {
    try {
        new URL(value);
        return true;
    } catch (error) {
        return false;
    }
}

function isBase64(value) {
    if (!value || typeof value !== 'string') return false;
    return value.startsWith('data:image/');
}

function renderImageMarkup(value) {
    if (!value) return '';
    if (isValidUrl(value) || isBase64(value)) {
        return `<img src="${value}" alt="Imagen del espécimen" class="result-image-item" />`;
    }
    return `${value}`;
}

// Función para convertir archivo a base64
function convertirFotoABase64(fileInput, previewDiv, fotorutaInput) {
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor selecciona un archivo de imagen');
        return;
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        const base64String = e.target.result;
        
        // Mostrar previsualización
        previewDiv.innerHTML = `<img src="${base64String}" alt="Vista previa" style="max-width: 100%; height: auto; border-radius: 4px;">`;
        
        // Guardar en el input oculto (como base64)
        fotorutaInput.value = base64String;
        
        alert('✅ Imagen cargada. Guarda los cambios para que se almacene permanentemente.');
    };
    
    reader.onerror = function() {
        alert('Error al leer el archivo');
    };
    
    reader.readAsDataURL(file);
}

// Función para renderizar controles de paginación
function renderPaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) {
        return;
    }

    const paginationDiv = document.createElement('div');
    paginationDiv.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 20px;
        padding: 10px;
    `;

    // Botón "Anterior"
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◀ Anterior';
    prevBtn.className = 'pagination-btn';
    prevBtn.disabled = currentPage === 1;
    prevBtn.style.cssText = `
        padding: 8px 12px;
        cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};
        opacity: ${currentPage === 1 ? '0.5' : '1'};
        background-color: #0066cc;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        transition: background-color 0.3s;
    `;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            mostrarResultados(ultimosBuscados);
            window.scrollTo(0, 0);
        }
    });
    paginationDiv.appendChild(prevBtn);

    // Números de página
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.textContent = '1';
        firstBtn.className = 'pagination-btn-number';
        firstBtn.style.cssText = `
            padding: 6px 10px;
            background-color: white;
            border: 1px solid #0066cc;
            border-radius: 4px;
            cursor: pointer;
            color: #0066cc;
            font-weight: bold;
        `;
        firstBtn.addEventListener('click', () => {
            currentPage = 1;
            mostrarResultados(ultimosBuscados);
            window.scrollTo(0, 0);
        });
        paginationDiv.appendChild(firstBtn);

        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.cssText = 'padding: 0 5px;';
            paginationDiv.appendChild(dots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'pagination-btn-active' : 'pagination-btn-number';
        pageBtn.style.cssText = `
            padding: 6px 10px;
            background-color: ${i === currentPage ? '#0066cc' : 'white'};
            color: ${i === currentPage ? 'white' : '#0066cc'};
            border: 1px solid #0066cc;
            border-radius: 4px;
            cursor: pointer;
            font-weight: ${i === currentPage ? 'bold' : 'normal'};
        `;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            mostrarResultados(ultimosBuscados);
            window.scrollTo(0, 0);
        });
        paginationDiv.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.cssText = 'padding: 0 5px;';
            paginationDiv.appendChild(dots);
        }

        const lastBtn = document.createElement('button');
        lastBtn.textContent = totalPages;
        lastBtn.className = 'pagination-btn-number';
        lastBtn.style.cssText = `
            padding: 6px 10px;
            background-color: white;
            border: 1px solid #0066cc;
            border-radius: 4px;
            cursor: pointer;
            color: #0066cc;
            font-weight: bold;
        `;
        lastBtn.addEventListener('click', () => {
            currentPage = totalPages;
            mostrarResultados(ultimosBuscados);
            window.scrollTo(0, 0);
        });
        paginationDiv.appendChild(lastBtn);
    }

    // Botón "Siguiente"
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Siguiente ▶';
    nextBtn.className = 'pagination-btn';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.style.cssText = `
        padding: 8px 12px;
        cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};
        opacity: ${currentPage === totalPages ? '0.5' : '1'};
        background-color: #0066cc;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        transition: background-color 0.3s;
    `;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            mostrarResultados(ultimosBuscados);
            window.scrollTo(0, 0);
        }
    });
    paginationDiv.appendChild(nextBtn);

    // Información de página
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    pageInfo.style.cssText = `
        margin-left: 10px;
        font-weight: bold;
        color: #333;
    `;
    paginationDiv.appendChild(pageInfo);

    paginationContainer.appendChild(paginationDiv);
}



// Función para guardar cambios
async function guardarCambios(e) {
    e.preventDefault();
    const idRaw = document.getElementById('editId').value;
    const id = idRaw ? idRaw : null;
    const currentItem = id ? geologicalDatabase.find(x => x.id === id) : null;

    const fotoRutaValue = document.getElementById('editFotoRuta').value.trim() || '';

    const payload = {
        nombre: currentItem ? currentItem.nombre : document.getElementById('editNombre').value.trim() || 'Sin nombre',
        tipo: currentItem ? currentItem.tipo : document.getElementById('editTipo').value,
        descripcion: document.getElementById('editDescripcion').value.trim() || 'Sin descripción',
        imagen: fotoRutaValue || '🔷',
        Genero_Especie: document.getElementById('editGeneroEspecie').value.trim() || '',
        Numero_Coleccion: document.getElementById('editNumeroColeccion').value.trim() || '',
        Coordenadas: {
            x: parseFloat(document.getElementById('editCoordenadaX').value) || 0,
            y: parseFloat(document.getElementById('editCoordenadaY').value) || 0
        },
        Unidad_Estratigrafica: document.getElementById('editUnidad').value.trim() || '',
        Localidad: document.getElementById('editLocalidad').value.trim() || '',
        Litologia: document.getElementById('editLitologia').value.trim() || '',
        Edad: document.getElementById('editEdad').value.trim() || '',
        Clado_Clasificacion: document.getElementById('editClado').value.trim() || '',
        Asociacion_Paleontologica: document.getElementById('editAsociacion').value.trim() || '',
        Tipo_Fosilzacion: document.getElementById('editFosilizacion').value.trim() || '',
        Colector: document.getElementById('editColector').value.trim() || '',
        Fecha_Recoleccion: document.getElementById('editFecha').value || '',
        Clasifico: document.getElementById('editClasifico').value.trim() || '',
        Foto_Ruta: fotoRutaValue || '',
        caracteristicas: [],
        fechaActualizacion: new Date().toISOString()
    };

    try {
        if (id) {
            // Editar existente
            const item = geologicalDatabase.find(x => x.id === id);
            if (!item) {
                alert('❌ Registro no encontrado');
                return;
            }
            
            // Actualizar en Firestore
            const docRef = doc(db, "geologia", id);
            await updateDoc(docRef, payload);
            
            // Actualizar en memoria
            Object.assign(item, payload);
            cerrarModal();
            mostrarResultados(ultimosBuscados);
            alert('✅ Registro actualizado correctamente');
        } else {
            // Crear nuevo
            payload.fechaCreacion = new Date().toISOString();
            
            // Guardar en Firestore
            const docRef = await addDoc(collection(db, "geologia"), payload);
            
            // Agregar a la lista en memoria con el ID de Firestore
            const newItem = {
                id: docRef.id,
                ...payload
            };
            geologicalDatabase.push(newItem);
            
            cerrarModal();
            // Refrescar búsqueda para incluir nuevo item
            realizarBusqueda();
            // Mostrar detalles del nuevo elemento
            especimenSeleccionado = newItem.id;
            mostrarDetalles(newItem);
            alert('✅ Nuevo registro creado correctamente');
        }
    } catch (error) {
        console.error('❌ Error guardando en Firestore:', error);
        alert('❌ Error al guardar: ' + error.message);
    }
}

// Función para eliminar registro
async function eliminarRegistro(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        try {
            const index = geologicalDatabase.findIndex(x => x.id === id);
            if (index > -1) {
                const nombreEliminado = geologicalDatabase[index].nombre;
                
                // Eliminar de Firestore
                await deleteDoc(doc(db, "geologia", id));
                
                // Eliminar de la lista en memoria
                geologicalDatabase.splice(index, 1);
                
                // Actualizar últimos buscados
                ultimosBuscados = ultimosBuscados.filter(x => x.id !== id);
                
                mostrarResultados(ultimosBuscados);
                alert(`✅ Registro "${nombreEliminado}" eliminado correctamente`);
                
                // Cerrar detalles si estaba mostrando el registro eliminado
                if (especimenSeleccionado === id) {
                    cerrarDetalles();
                }
            }
        } catch (error) {
            console.error('❌ Error eliminando de Firestore:', error);
            alert('❌ Error al eliminar: ' + error.message);
        }
    }
}
