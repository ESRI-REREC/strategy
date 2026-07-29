import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Table, Text, LoadingOverlay, ActionIcon, Tooltip } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconSelector, IconEdit, IconTrash } from '@tabler/icons-react';

interface DataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export default function DataTable<T extends object>({
  data, columns, loading = false, onEdit, onDelete,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const allColumns: ColumnDef<T>[] = [
    ...columns,
    ...(onEdit || onDelete ? [{
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: T } }) => (
        <div className="flex items-center gap-1.5">
          {onEdit && (
            <Tooltip label="Edit">
              <ActionIcon variant="light" color="orange" size="sm" onClick={() => onEdit(row.original)}>
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip label="Delete">
              <ActionIcon variant="light" color="red" size="sm" onClick={() => onDelete(row.original)}>
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </div>
      ),
    } as ColumnDef<T>] : []),
  ];

  const table = useReactTable({
    data, columns: allColumns,
    state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="relative">
      <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ blur: 2 }} />
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <Table striped highlightOnHover withColumnBorders={false} style={{ minWidth: 600 }}>
          <Table.Thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <Table.Tr key={hg.id}>
                {hg.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      <Text size="sm" fw={600} c="#495057">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Text>
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === 'asc' ? <IconChevronUp size={14} color="#868e96" />
                        : header.column.getIsSorted() === 'desc' ? <IconChevronDown size={14} color="#868e96" />
                        : <IconSelector size={14} color="#ced4da" />
                      )}
                    </div>
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {table.getRowModel().rows.length === 0 && !loading ? (
              <Table.Tr>
                <Table.Td colSpan={allColumns.length}>
                  <div className="flex flex-col items-center py-12 gap-4">
                    <img src="/no-data.png" alt="No data" className="h-28 w-auto opacity-70" />
                    <Text c="dimmed" size="sm" fw={500}>No records found</Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id}>
                      <Text size="sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</Text>
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
