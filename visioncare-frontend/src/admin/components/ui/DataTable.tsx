import React from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

function getValue<T>(row: T, key: string): unknown {
  return (key as string).split('.').reduce((acc: unknown, k) => (acc as Record<string, unknown>)?.[k], row);
}

export function DataTable<T>({
  columns, data, keyExtractor, loading = false, emptyMessage = 'No data found', onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="text-5xl mb-3">📋</div>
        <p className="font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((col) => (
              <th
                key={col.key as string}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors hover:bg-white/5 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key as string}
                  className={`px-4 py-3.5 text-slate-300 ${col.className ?? ''}`}
                >
                  {col.render ? col.render(row) : String(getValue(row, col.key as string) ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
