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
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left side: Search and leftToolbar */}
                <div className="flex items-center gap-3 flex-1 flex-wrap">
                    {showSearch && (
                        <div className="w-full max-w-sm relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Search size={16} />
                            </div>
                            <TextInput
                                placeholder="Search all columns..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="pl-10 h-9"
                            />
                        </div>
                    )}
                    {leftToolbar}
                </div>

                {/* Right side: Custom content (Filters, etc) */}
                <div className="flex items-center justify-end gap-3 flex-wrap">
                    {customToolbar}
                    {enableSelection && Object.keys(rowSelection).length > 0 && (
                        <span className="text-sm text-slate-500 dark:text-slate-400 ml-2 whitespace-nowrap">
                            {Object.keys(rowSelection).length} row(s) selected
                        </span>
                    )}
                </div>
            </div>

            {/* The Table */}
            <Table>
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

            {/* Pagination Controls */}
            {showPagination && table.getPageCount() > 0 && (
                <div className="flex items-center justify-between px-2 mt-4">
                    <div className="flex-1 text-sm text-slate-500 dark:text-slate-400">
                        Page <span className="font-medium text-slate-900 dark:text-slate-100">{table.getState().pagination.pageIndex + 1}</span> of{" "}
                        <span className="font-medium text-slate-900 dark:text-slate-100">{table.getPageCount()}</span>
                    </div>

                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2 shrink-0">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Rows per page</p>
                            <select
                                className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 cursor-pointer"
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

                        <div className="flex items-center space-x-2">
                            <button
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-8 px-3"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </button>
                            <button
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-8 px-3"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
