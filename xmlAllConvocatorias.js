function parseXml(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const obj = {};
    traverseNodes(xmlDoc.documentElement, obj);
    return obj;
}

function traverseNodes(node, obj) {
    node.childNodes.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const nodeName = child.nodeName;
            const isSection = child.getAttribute('section') === 'true';

            if (isSection) {
                if (!obj.sections) {
                    obj.sections = {};
                }
                const sectionObj = {};
                traverseNodes(child, sectionObj);
                obj.sections[nodeName] = sectionObj;
            } else {
                if (child.childElementCount > 0) {
                    if (!obj[nodeName]) {
                        obj[nodeName] = [];
                    }
                    const childObj = {};
                    traverseNodes(child, childObj);
                    obj[nodeName].push(childObj);
                } else {
                    if (!obj[nodeName]) {
                        obj[nodeName] = [];
                    }
                    obj[nodeName].push(child.textContent);
                }
            }
        }
    });
}

function generateItemsFromXml(xml) {
    const container = document.createElement('div');
    container.className = 'xml-container';

    Object.keys(xml).forEach(key => {
        const item = document.createElement('div');
        item.className = 'xml-item';

        if (key !== 'element') {
            const header = document.createElement('h4');
            header.textContent = key;
            item.appendChild(header);
        }

        if (Array.isArray(xml[key])) {
            xml[key].forEach((subItem, index) => {
                const subContainer = document.createElement('div');
                subContainer.className = 'xml-item';
                if (typeof subItem === 'object') {
                    const subHeader = document.createElement('h4');
                    subHeader.textContent = `${key} ${index + 1}`;
                    subContainer.appendChild(subHeader);
                    const nestedContainer = generateItemsFromXml(subItem);
                    subContainer.appendChild(nestedContainer);
                } else {
                    const value = document.createElement('p');
                    value.textContent = subItem;
                    subContainer.appendChild(value);
                }
                container.appendChild(subContainer);
            });
        } else if (typeof xml[key] === 'object') {
            const subContainer = generateItemsFromXml(xml[key]);
            item.appendChild(subContainer);
        } else {
            const value = document.createElement('p');
            value.textContent = xml[key];
            item.appendChild(value);
        }

        container.appendChild(item);
    });

    return container;
}

async function fetchConvocatorias() {
    try {
        const response = await fetch('http://10.10.0.231/api/Convocatoria/get-convocatorias');
        if (!response.ok) {
            throw new Error('La respuesta de la red no fue correcta: ' + response.statusText);
        }
        const data = await response.json();
        displayConvocatorias(data);
    } catch (error) {
        console.error('Hubo un problema con la petición fetch:', error);
        displayError(error.message);
    }
}

function displayConvocatorias(data) {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'search-input';
    searchInput.placeholder = 'Buscar por nombre o ID de convocatoria';
    searchInput.onkeyup = filterConvocatorias;
    contentDiv.appendChild(searchInput);

    const container = generateItemsFromConvocatoria(data);
    contentDiv.appendChild(container);

    const downloadContainer = document.createElement('div');
    downloadContainer.className = 'download-container';

    const button = document.createElement('button');
    button.textContent = 'Descargar Convocatorias';
    button.className = 'download-button';

    button.onclick = () => downloadXls(data, 'Convocatorias.xlsx', false);

    downloadContainer.appendChild(button);
    contentDiv.appendChild(downloadContainer);

    const navButton = document.createElement('button');
    navButton.textContent = 'Interfaz de evaluaciones';
    navButton.className = 'nav-button floating-nav-button';

    navButton.onclick = () => {
        window.location.href = 'http://evaluacionesdecandidatos.ande.intra:82/'; 
    };
    document.body.appendChild(navButton);

}


function filterConvocatorias() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const items = document.querySelectorAll('.item');

    items.forEach(item => {
        const idConvocatoria = item.querySelector('h4:first-child').textContent.toLowerCase();
        const nombreConvocatoria = item.querySelector('h4:nth-child(2)').textContent.toLowerCase();

        if (idConvocatoria.includes(searchInput) || nombreConvocatoria.includes(searchInput)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function generateItemsFromConvocatoria(json) {
    const container = document.createElement('div');
    container.className = 'container';

    json.forEach(item => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'item';

        const idHeader = document.createElement('h4');
        idHeader.textContent = `ID Convocatoria: ${item.id_convocatoria}`;
        itemContainer.appendChild(idHeader);

        const nameHeader = document.createElement('h4');
        nameHeader.textContent = `Nombre: ${item.convocatoria_nombre}`;
        itemContainer.appendChild(nameHeader);

        const select = document.createElement('select');
        select.className = 'status-select';

        const optionFinished = document.createElement('option');
        optionFinished.value = '0';
        optionFinished.textContent = 'Finalizado';
        select.appendChild(optionFinished);

        const optionInProcess = document.createElement('option');
        optionInProcess.value = '1';
        optionInProcess.textContent = 'En proceso';
        select.appendChild(optionInProcess);

        itemContainer.appendChild(select);

        const detailsButton = document.createElement('button');
        detailsButton.textContent = "Descargar Proyectos";
        detailsButton.className = 'details-button';

        detailsButton.onclick = (event) => {
            event.preventDefault();
            const editable = select.value;

            console.log(`ID de Convocatoria: ${item.id_convocatoria}`);
            console.log(`Nombre de Convocatoria: ${item.convocatoria_nombre}`);

            if (item.id_convocatoria) {
                viewDetails(item.id_convocatoria, item.convocatoria_nombre, editable);
            } else {
                console.error('ID de convocatoria no encontrado:', item);
            }
        };

        itemContainer.appendChild(detailsButton);
        container.appendChild(itemContainer);
    });

    return container;
}


let convocatoriaNames = {};

fetch('convocatoriaIdName.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(convocatoria => {
            convocatoriaNames[convocatoria.id] = convocatoria.nombre;
        });

        console.log(convocatoriaNames);
        const id = 39;
        console.log(`Nombre de la convocatoria con ID ${id}: ${convocatoriaNames[id]}`);
    })
    .catch(error => {
        console.error('Error al cargar el archivo JSON:', error);
    });

function viewDetails(idFormConvocatoria) {
    console.log(`Nombre de la convocatoria con ID ${idFormConvocatoria}: ${convocatoriaNames[idFormConvocatoria]}`);
}

async function viewDetails(idConvocatoria, nombreConvocatoria, editable = 'Todos') {
    try {
        const editableParam = editable === 'Todos' ? '' : `&editable=${editable}`;
        const url = `http://10.10.0.231/api/Gf_instance/get-xml-convocatoria?idConvocatoria=${idConvocatoria}${editableParam}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('No hay datos válidos.');

        displayData(data, idConvocatoria, nombreConvocatoria);
    } catch (error) {
        console.error('Error fetching details:', error);
        displayError(error.message);
    }
}


function displayData(data, idConvocatoria, convocatoriaNombre) {
    const invisibleContainer = document.createElement('div');
    invisibleContainer.style.display = 'none';
    document.body.appendChild(invisibleContainer);

    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'breadcrumb';
    breadcrumb.innerHTML = `
        <span><a href="#" onclick="fetchConvocatorias()">Convocatorias</a></span> / 
        <span>${convocatoriaNombre} (ID: ${idConvocatoria})</span>
    `;
    invisibleContainer.appendChild(breadcrumb);

    const allData = [];

    data.forEach((item, index) => {
        const xmlObject = parseXml(item.xml_object);

        xmlObject.tables = item.tables || {};
        xmlObject.idProyecto = item.idProyecto || '';
        xmlObject.idAutogenerado = item.idAutogenerado || '';
        xmlObject.estadoPostulacion = item.estadoPostulacion || '';
        xmlObject.fechaApertura = item.fechaApertura || '';
        xmlObject.fechaFinalizacion = item.fechaFinalizacion || '';
        xmlObject.id_proyecto = index + 1;

        const projectContainer = document.createElement('div');
        projectContainer.className = 'project-container';

        const projectHeader = document.createElement('div');
        projectHeader.className = 'project-header';
        projectHeader.textContent = `Proyecto ${index + 1}`;
        projectContainer.appendChild(projectHeader);

        const container = generateItemsFromXml(xmlObject);
        projectContainer.appendChild(container);

        const projectFooter = document.createElement('div');
        projectFooter.className = 'project-footer';
        projectFooter.textContent = `Fin del Proyecto ${index + 1}`;
        projectContainer.appendChild(projectFooter);

        invisibleContainer.appendChild(projectContainer);
        allData.push(xmlObject);
    });

    const safeConvocatoriaNombre = convocatoriaNombre.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
    downloadXls(allData, `Convocatoria_${idConvocatoria}_${safeConvocatoriaNombre}.xlsx`);

    document.body.removeChild(invisibleContainer);
}

function downloadXls(jsonData, filename, includeAdditionalColumns = true) {
    const workbook = XLSX.utils.book_new();

    const objectToSheet = (objArray) => {
        const rows = [];
        const headers = new Set();

        if (includeAdditionalColumns) {
            headers.add('idProyecto');
            headers.add('idAutogenerado');
            headers.add('estadoPostulacion');
            headers.add('fechaApertura');
            headers.add('fechaFinalizacion');
        }

        objArray.forEach(item => {
            Object.keys(item).forEach(key => headers.add(key));
        });

        const headersArray = [...headers];
        const filteredHeadersArray = headersArray.filter(header => header !== '');

        const idProyectoIndex = filteredHeadersArray.indexOf('id_proyecto');
        if (idProyectoIndex > -1) {
            filteredHeadersArray.push(filteredHeadersArray.splice(idProyectoIndex, 1)[0]);
        }

        rows.push(filteredHeadersArray);

        objArray.forEach(item => {
            const row = [];
            filteredHeadersArray.forEach(header => {
                let value = item[header] || '';
                if (typeof value === 'object' && value !== null) {
                    value = flattenObject(value);
                }
                row.push(value ? String(value) : '');
            });
            rows.push(row);
        });

        return XLSX.utils.aoa_to_sheet(rows);
    };

    const repeaters = {};
    const tables = [];

    const mainData = jsonData.map((item, index) => {
        const cleanedItem = { ...item, id_proyecto: index + 1 };

        Object.keys(item).forEach(key => {
            if (Array.isArray(item[key]) && item[key][0]?.['repeater-iteration'] !== undefined) {
                if (!repeaters[key]) repeaters[key] = [];
                item[key].forEach(subItem => {
                    const flatSubItem = { id_proyecto: index + 1, ...subItem };
                    repeaters[key].push(flatSubItem);
                });
                delete cleanedItem[key];
            } else if (key === 'tables') {
                Object.keys(item[key]).forEach(tableName => {
                    const sheetName = `${tableName}_Proy_${index + 1}`;
                    const sheet = XLSX.utils.aoa_to_sheet(item[key][tableName]);
                    tables.push({ name: sheetName, sheet });
                });
                delete cleanedItem[key];
            }
        });

        return cleanedItem;
    });

    const mainSheet = objectToSheet(mainData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, "Proyectos");

    Object.entries(repeaters).forEach(([name, data]) => {
        const sheet = createVerticalSheetFromRepeaterData(data);
        XLSX.utils.book_append_sheet(workbook, sheet, name);
    });

    tables.forEach(({ name, sheet }) => {
        XLSX.utils.book_append_sheet(workbook, sheet, name);
    });

    XLSX.writeFile(workbook, filename);
}

function flattenObject(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => flattenObject(item)).join('; ');
    } else if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj)
            .map(([key, value]) => `${key}: ${flattenObject(value)}`)
            .join(', ');
    } else {
        return obj !== undefined && obj !== null ? String(obj) : '';
    }
}

function createVerticalSheetFromRepeaterData(data) {
    const rows = [];

    data.forEach(item => {
        Object.keys(item).forEach(key => {
            const value = item[key];

            if (Array.isArray(value)) {
                value.forEach((arrayItem, index) => {
                    if (typeof arrayItem === 'object' && arrayItem !== null) {
                        Object.entries(arrayItem).forEach(([subKey, subValue]) => {
                            const aliasKey = cleanKeyName(`${subKey}`);
                            rows.push([aliasKey, subValue || '']);
                        });
                    } else {
                        const aliasKey = cleanKeyName(`${key}[${index}]`);
                        rows.push([aliasKey, arrayItem || '']);
                    }
                });
            } else if (typeof value === 'object' && value !== null) {
                Object.entries(value).forEach(([subKey, subValue]) => {
                    const aliasKey = cleanKeyName(`${subKey}`);
                    rows.push([aliasKey, subValue || '']);
                });
            } else {
                const aliasKey = cleanKeyName(`${key}`);
                rows.push([aliasKey, value || '']);
            }
        });

        rows.push([]);
    });

    return XLSX.utils.aoa_to_sheet(rows);
}

function cleanKeyName(key) {
    return key.replace(/^repeater-iteration\[\d+\]\./, '');
}


function parseTableData(tableString, tableName, projectId) {
    const rows = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(tableString, 'text/xml');

    xmlDoc.querySelectorAll('row').forEach((row, rowIndex) => {
        const rowData = [`${tableName} - Proy ${projectId} - Row ${rowIndex + 1}`];
        row.querySelectorAll('col value').forEach(col => {
            let cellValue = col.textContent.trim();
            rowData.push(cellValue);
        });
        rows.push(rowData);
    });

    return rows;
}

function displayError(message) {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';

    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-container'

    const errorMessage = document.createElement('p');
    errorMessage.textContent = message;
    errorContainer.appendChild(errorMessage);

    contentDiv.appendChild(errorContainer);
}

fetchConvocatorias();