import { useMemo } from 'react';

/**
 * Custom hook to encapsulate and memoize all financial calculations for the BOQ.
 * @param {Array} items - The list of BOQ items.
 * @param {Object} project - The project object.
 */
export function useBoqCalculations(items, project) {
    return useMemo(() => {
        const totalMaterialCost = items.reduce((sum, item) => sum + (Number(item.material_unit_price) * Number(item.quantity)), 0);
        const totalLaborCost = items.reduce((sum, item) => sum + (Number(item.labor_unit_price || 0) * Number(item.quantity)), 0);
        const totalConstructionCost = totalMaterialCost + totalLaborCost;

        const baseCarportAmount = items.filter(i => i.is_carport).reduce((sum, i) => sum + ((Number(i.material_unit_price) + Number(i.labor_unit_price || 0)) * Number(i.quantity)), 0);
        const amountOfCarportWithProfit = baseCarportAmount * 1.1;
        const totalWithProfit = totalConstructionCost * 1.1;
        const amountWithoutCarportWithProfit = totalWithProfit - amountOfCarportWithProfit;

        const floorArea = Number(project.total_floor_area) || 0;
        const carportArea = Number(project.carport_area) || 0;

        const amountPerSqmBuilding = floorArea > 0 ? amountWithoutCarportWithProfit / floorArea : 0;
        const amountPerSqmCarport = carportArea > 0 ? amountOfCarportWithProfit / carportArea : 0;

        return {
            totalMaterialCost,
            totalLaborCost,
            totalConstructionCost,
            totalWithProfit,
            amountOfCarportWithProfit,
            amountWithoutCarportWithProfit,
            floorArea,
            carportArea,
            amountPerSqmBuilding,
            amountPerSqmCarport
        };
    }, [items, project]);
}
