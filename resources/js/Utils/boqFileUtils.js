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
 * Parses a CSV file for BOQ bulk upload.
 * @param {File} file - The CSV file to parse.
 * @returns {Promise<Array>} - A promise that resolves to an array of parsed BOQ items.
 */
export const parseBoqCsv = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = (event.target?.result || '').replace(/^\uFEFF/, '');
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

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
                            hours: parseFloat(cols[8] || 0), // Use same col for hours if Labor
                            unitRate: parseFloat(cols[10] || 0)
                        });
                    }
                });
                if (currentItem) resultItems.push(currentItem);
                resolve(resultItems);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};
