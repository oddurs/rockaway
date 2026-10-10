// `@rockaway/react/table`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export { tableBuffer, tableLayout } from '../components/table.pure.ts';
export {
  Cell,
  type CellProps,
  Column,
  type ColumnAlign,
  type ColumnProps,
  type ColumnShape,
  type ColumnWidth,
  Row,
  type RowProps,
  type RowText,
  type SortDirection,
  Table,
  TableBody,
  type TableBodyProps,
  TableHeader,
  type TableHeaderProps,
  type TableLayout,
  type TableProps,
  type TableText,
} from '../components/table.tsx';
