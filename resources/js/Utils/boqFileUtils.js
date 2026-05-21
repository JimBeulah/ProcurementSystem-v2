import * as XLSX from 'xlsx';

/**
 * Generates and downloads a CSV template for BOQ bulk upload.
 * @param {Object} project - The project object.
 */
export const downloadBoqTemplate = (project) => {
    const headers = [
        'ROW TYPE', 'DESCRIPTION/NAME', 'UNIT', 'QUANTITY',
        'MAT. UNIT COST', 'LAB. UNIT COST', 'IS CARPORT',
        'RESOURCE TYPE', 'QTY FACTOR/HOURS', 'NO. OF PERSONS', 'UNIT RATE'
    ];
    const instructions = [
        '# INSTRUCTIONS:',
        'Use "ITEM" for main BOQ items. Use "RESOURCE" for breakdown components below an item.',
        'For ITEMS: Fill columns B to G. Leave H to K blank.',
        'For RESOURCES: Fill columns B (Name), H (Type), I (Factor/Hours), J (Persons), K (Rate).',
        'Resource Types: MATERIAL, LABOR, EQUIPMENT'
    ];
    const examples = [
        'ITEM,Concreting Works,lot,1.00,,,NO,,,,',
        'RESOURCE,Portland Cement,,,,,,MATERIAL,9.00,,230.00',
        'RESOURCE,Washed Sand,,,,,,MATERIAL,0.50,,850.00',
        'RESOURCE,Foreman,,,,,,LABOR,8.00,1.00,85.00',
        'RESOURCE,Skilled Labor,,,,,,LABOR,8.00,2.00,65.00'
    ];
    const csvContent = [headers.join(','), ...instructions.map(i => `"${i}",,,,,,,,,,`), ...examples].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boq_template_project_${project.id}.csv`;
    a.click();
};

/**
 * Parses a BOQ file (CSV or Excel) for bulk upload.
 * @param {File} file - The CSV or Excel file to parse.
 * @returns {Promise<Array>} - A promise that resolves to an array of parsed BOQ items.
 */
export const parseBoqCsv = (file) => {
    return new Promise((resolve, reject) => {
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            parseExcelFile(file, resolve, reject);
        } else if (fileName.endsWith('.csv')) {
            parseCsvFile(file, resolve, reject);
        } else {
            reject(new Error('Unsupported file format. Please use CSV or Excel (.xlsx).'));
        }
    });
};

/**
 * Parses CSV file content
 */
const parseCsvFile = (file, resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const text = (event.target?.result || '').replace(/^\uFEFF/, '');
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            resolve(parseBoqLines(lines));
        } catch (error) {
            reject(error);
        }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
};

/**
 * Parses Excel file content
 */
const parseExcelFile = (file, resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const lines = rows
                .map(row => row.map(cell => String(cell || '')).join(','))
                .filter(line => line.trim() !== '');

            resolve(parseBoqLines(lines));
        } catch (error) {
            reject(error);
        }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
};

/**
 * Parses BOQ lines from CSV format
 */
const parseBoqLines = (lines) => {
    const resultItems = [];
    let currentItem = null;

    lines.forEach((line, idx) => {
        if (idx === 0 || line.startsWith('#') || line.startsWith('"#')) return;

        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
        if (cols.length < 2) return;

        const rowType = cols[0].toUpperCase();
        if (rowType === 'ITEM') {
            if (currentItem) resultItems.push(currentItem);
            currentItem = {
                itemDescription: cols[1],
                unit: cols[2],
                quantity: parseFloat(cols[3] || 1),
                materialUnitPrice: cols[4] ? parseFloat(cols[4]) : 0,
                laborUnitPrice: cols[5] ? parseFloat(cols[5]) : 0,
                isCarport: ['YES', 'TRUE', '1'].includes((cols[6] || '').toUpperCase()),
                components: []
            };
        } else if (rowType === 'RESOURCE' && currentItem) {
            currentItem.components.push({
                resourceType: cols[7].toUpperCase(),
                name: cols[1],
                unit: cols[2] || '',
                quantityFactor: parseFloat(cols[8] || 0),
                noOfPersons: parseFloat(cols[9] || 1),
                hours: parseFloat(cols[8] || 0),
                unitRate: parseFloat(cols[10] || 0)
            });
        }
    });
    if (currentItem) resultItems.push(currentItem);
    return resultItems;
};

/**
 * Applies confirmed column mappings to raw row data for preview display.
 * @param {Array<Array<string>>} rows - Raw rows from the analyze response.
 * @param {Array<{columnIndex: number, mappedTo: string|null}>} mappings
 * @returns {Array<{itemDescription: string, unit: string, quantity: number, materialUnitPrice: number, laborUnitPrice: number}>}
 */
export const applyMappingsToRows = (rows, mappings) => {
    const fieldByIndex = {};
    mappings.forEach(m => {
        if (m.mappedTo) fieldByIndex[m.columnIndex] = m.mappedTo;
    });

    return rows
        .map(row => {
            const item = {
                itemDescription: '',
                unit: 'lot',
                quantity: 1,
                materialUnitPrice: 0,
                laborUnitPrice: 0,
            };
            Object.entries(fieldByIndex).forEach(([colIndex, field]) => {
                const value = row[colIndex] ?? '';
                switch (field) {
                    case 'itemDescription':  item.itemDescription   = String(value); break;
                    case 'unit':             item.unit              = String(value) || 'lot'; break;
                    case 'quantity':         item.quantity          = parseFloat(value) || 1; break;
                    case 'materialUnitCost': item.materialUnitPrice = parseFloat(value) || 0; break;
                    case 'laborUnitCost':    item.laborUnitPrice    = parseFloat(value) || 0; break;
                }
            });
            return item;
        })
        .filter(item => item.itemDescription.trim() !== '');
};
