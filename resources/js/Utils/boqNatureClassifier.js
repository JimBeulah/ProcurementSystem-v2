// resources/js/Utils/boqNatureClassifier.js

const DIRECT_KEYWORDS = [
    'supply', 'steel', 'rebar', 'pipe', 'pvc', 'chb', 'block',
    'aggregate', 'gravel', 'sand', 'cement', 'tile', 'paint',
    'wire', 'lumber', 'plywood', 'phenolic', 'glass', 'door',
    'window', 'hardware', 'bolt', 'nail', 'bar', 'reinforcing',
    'structural', 'sheet pile', 'guardrail', 'concrete masonry',
];

const SERVICE_KEYWORDS = [
    'mobilization', 'demobilization', 'whse', 'documentation',
    'management', 'safety', 'health', 'loading', 'unloading',
    'hauling', 'as-built', 'supervision', 'inspection',
    'signboard', 'billboard', 'permit', 'testing', 'survey',
];

export const NATURE_OPTIONS = [
    { value: 'DIRECT_MATERIAL', label: 'Direct Material' },
    { value: 'SERVICE',         label: 'Service' },
    { value: 'BUNDLE',          label: 'Bundle' },
];

export const NATURE_COLORS = {
    DIRECT_MATERIAL: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    SERVICE:         'bg-blue-100 text-blue-700 border-blue-300',
    BUNDLE:          'bg-amber-100 text-amber-700 border-amber-300',
};

export function classifyNature(description) {
    const lower = (description || '').toLowerCase();

    for (const kw of DIRECT_KEYWORDS) {
        if (lower.includes(kw)) return 'DIRECT_MATERIAL';
    }
    for (const kw of SERVICE_KEYWORDS) {
        if (lower.includes(kw)) return 'SERVICE';
    }
    return 'BUNDLE';
}

export function natureHelperText(nature) {
    switch (nature) {
        case 'DIRECT_MATERIAL':
            return 'A MATERIAL component will be auto-created for you.';
        case 'SERVICE':
            return 'A LABOR component will be auto-created for you.';
        default:
            return 'You will add components manually after saving.';
    }
}
