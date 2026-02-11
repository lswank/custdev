export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  primary?: boolean;
  type?: 'text' | 'badge' | 'phase' | 'date' | 'number' | 'tag-list' | 'review';
  priority?: 'high' | 'low';
}

export interface FilterDef {
  key: string;
  label: string;
  options: string[];
}
