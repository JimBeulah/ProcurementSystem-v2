import React, { useState } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './Table';
import TextInput from '../TextInput';
import Checkbox from '../Checkbox';
import { Search } from 'lucide-react';

export function DataTable({
    columns,
    data,
    showPagination = true,
    showSearch = true,
    enableSelection = false,
    onRowSelectionChange,
    onRowClick,
    customToolbar,
    leftToolbar,
    renderMobileRow, // Optional custom mobile row renderer
    overflowVisible = false,
}) {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});

    // If selection is enabled, we dynamically add a checkbox column to the front
    const tableColumns = React.useMemo(() => {
        if (!enableSelection) return columns;

        return [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            ...columns,
        ];
    }, [columns, enableSelection]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: (updaterOrValue) => {
            setRowSelection(updaterOrValue);
            // If user passed a callback, notify them of the change ideally in a useEffect,
            // but for simplicity we'll just let the state update
        },
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
        enableRowSelection: enableSelection,
    });

    // Notify parent component when row selection changes
    React.useEffect(() => {
        if (onRowSelectionChange) {
            // map selected indices to actual data rows
            const selectedRows = Object.keys(rowSelection).map(index => data[index]);
            onRowSelectionChange(selectedRows);
        }
    }, [rowSelection, data, onRowSelectionChange]);

    return (
        <div className="space-y-4 w-full">

            {/* Toolbar: Search and Table Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left side: Search and leftToolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                    {showSearch && (
                        <div className="w-full md:max-w-sm relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Search size={16} />
                            </div>
                            <TextInput
                                placeholder="Search all columns..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="pl-10 h-9 shadow-sm text-sm"
                            />
                        </div>
                    )}
                    {leftToolbar && <div className="flex items-center gap-2">{leftToolbar}</div>}
                </div>

                {/* Right side: Custom content (Filters, etc) */}
                <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                    {customToolbar}
                    {enableSelection && Object.keys(rowSelection).length > 0 && (
                        <span className="text-sm text-slate-500 dark:text-slate-400 ml-2 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                            {Object.keys(rowSelection).length} row(s) selected
                        </span>
                    )}
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <div
                            key={row.id}
                            onClick={() => onRowClick && onRowClick(row.original)}
                            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm space-y-2.5 sm:space-y-3 ${
                                onRowClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""
                            }`}
                        >
                            {renderMobileRow ? (
                                renderMobileRow(row.original)
                            ) : (
                                <>
                                    {row.getVisibleCells().map((cell, idx) => {
                                        // Skip selection column on mobile card if it exists
                                        if (cell.column.id === 'select') return null;
                                        
                                        const header = cell.column.columnDef.header;
                                        const isHeaderString = typeof header === 'string';

                                        if (idx === (enableSelection ? 1 : 0)) {
                                            return (
                                                <div key={cell.id} className="pb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </div>
                                                    {enableSelection && (
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <Checkbox
                                                                checked={row.getIsSelected()}
                                                                onChange={row.getToggleSelectedHandler()}
                                                                aria-label="Select row"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={cell.id} className="flex justify-between items-center gap-4 text-xs">
                                                <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider shrink-0">
                                                    {isHeaderString ? header : (cell.column.columnDef.mobileHeader || cell.column.id)}
                                                </span>
                                                <div className="text-slate-900 dark:text-slate-200 font-semibold text-right">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500">
                        No results found.
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className={`hidden md:block ${overflowVisible ? 'overflow-visible' : 'overflow-x-auto'}`}>
                <Table overflowVisible={overflowVisible}>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead
                                        key={header.id}
                                        className={header.column.getCanSort() ? "cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" : ""}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </div>
                                            {/* Sorting Indicator */}
                                            {header.column.getCanSort() && (
                                                <span className="text-xs text-slate-400">
                                                    {{
                                                        asc: '▲',
                                                        desc: '▼',
                                                    }[header.column.getIsSorted()] ?? null}
                                                </span>
                                            )}
                                        </div>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => onRowClick && onRowClick(row.original)}
                                className={onRowClick ? "cursor-pointer" : ""}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={tableColumns.length}
                                className="h-24 text-center text-slate-500 dark:text-slate-400"
                            >
                                No results found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>

            {/* Pagination Controls */}
            {showPagination && table.getPageCount() > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 mt-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            Page <span className="font-medium text-slate-900 dark:text-slate-100">{table.getState().pagination.pageIndex + 1}</span> of{" "}
                            <span className="font-medium text-slate-900 dark:text-slate-100">{table.getPageCount()}</span>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Rows per page</p>
                            <select
                                className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 cursor-pointer transition-all"
                                value={table.getState().pagination.pageSize}
                                onChange={e => {
                                    table.setPageSize(Number(e.target.value))
                                }}
                            >
                                {[10, 20, 30, 40, 50].map(pageSize => (
                                    <option key={pageSize} value={pageSize}>
                                        {pageSize}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 w-full md:w-auto">
                        <button
                            type="button"
                            className="flex-1 md:flex-none inline-flex items-center justify-center rounded-xl text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:pointer-events-none disabled:opacity-30 border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:hover:border-slate-700 h-9 sm:h-10 px-4 sm:px-6 active:scale-95"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            className="flex-1 md:flex-none inline-flex items-center justify-center rounded-xl text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:pointer-events-none disabled:opacity-30 border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:hover:border-slate-700 h-9 sm:h-10 px-4 sm:px-6 active:scale-95"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
