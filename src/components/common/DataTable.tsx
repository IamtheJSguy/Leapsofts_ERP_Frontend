import { useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Box, CircularProgress } from '@mui/material';
import type { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface DataTableProps<T> {
  rowData: T[];
  columnDefs: ColDef<T>[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  height?: number | string;
}

export const DataTable = <T,>({
  rowData,
  columnDefs,
  isLoading = false,
  onRowClick,
  height = 500,
}: DataTableProps<T>) => {
  const gridRef = useRef<AgGridReact<T>>(null);

  const handleRowClicked = useCallback(
    (event: { data?: T }) => {
      if (event.data && onRowClick) onRowClick(event.data);
    },
    [onRowClick],
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading table" sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box className="ag-theme-alpine ag-theme-leap" sx={{ width: '100%', height }}>
      <AgGridReact<T>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{ sortable: true, filter: true, resizable: true, flex: 1 }}
        rowSelection="multiple"
        animateRows
        onRowClicked={handleRowClicked}
        suppressCellFocus
      />
    </Box>
  );
};
