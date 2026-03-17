"use client";

import React, { useState, useEffect } from "react";
import { SmallButton } from "@/components/ui/button";
import { SvgIcon } from "@/components/svg-icon";
import { X, Check, GripVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Icons for column types
const FileColumnIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.75 2.625V5.25C9.75 6.07843 10.4216 6.75 11.25 6.75H13.875M5.25 2.25H9.1287C9.5265 2.25 9.90803 2.40803 10.1894 2.68934L13.8106 6.31066C14.092 6.59197 14.25 6.97349 14.25 7.37132V14.25C14.25 15.0784 13.5784 15.75 12.75 15.75H5.25C4.42157 15.75 3.75 15.0784 3.75 14.25V3.75C3.75 2.92157 4.42157 2.25 5.25 2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TextColumnIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5V3H9M9 3H15V4.5M9 3V15M9 15H7.5M9 15H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Date column icon
const DateColumnIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.25" y="3.75" width="13.5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2.25 7.5H15.75" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5.25 2.25V5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12.75 2.25V5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export interface FilterableColumn {
  id: string;
  header: string;
  type: 'file' | 'text' | 'selection' | 'date';
  values?: string[]; // Possible values for this column
}

export interface DisplayColumn {
  id: string;
  header: string;
  visible: boolean;
  fixed?: boolean;
}

export interface ActiveFilter {
  columnId: string;
  columnHeader: string;
  columnType: 'file' | 'text' | 'selection' | 'date';
  condition: 'is_any_of' | 'is_none_of';
  values: string[]; // Selected values
}

// Get icon for column type
const getColumnIcon = (type: 'file' | 'text' | 'selection' | 'date') => {
  switch (type) {
    case 'file':
      return <FileColumnIcon />;
    case 'date':
      return <DateColumnIcon />;
    default:
      return <TextColumnIcon />;
  }
};

// Column Filter Submenu Content
const ColumnFilterSubmenuContent = ({
  column,
  selectedValues,
  onToggleValue,
}: {
  column: FilterableColumn;
  selectedValues: string[];
  onToggleValue: (value: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredValues = (column.values || []).filter(value =>
    value.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="w-[240px]">
      {/* Search input */}
      <div className="p-2 border-b border-border-base">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1.5 text-xs bg-bg-base border border-border-base rounded-[4px] outline-none focus:border-border-strong placeholder:text-fg-muted"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      {/* Values list */}
      <div className="p-1 max-h-[240px] overflow-y-auto">
        {filteredValues.length > 0 ? (
          filteredValues.map((value) => {
            const isSelected = selectedValues.includes(value);
            return (
              <div
                key={value}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleValue(value);
                }}
                className="flex items-center gap-2 px-2 py-2 text-xs rounded-[4px] hover:bg-bg-subtle-hover cursor-pointer"
              >
                <div
                  className={`w-3.5 h-3.5 shrink-0 rounded-[3px] border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-bg-interactive border-border-interactive'
                      : 'border-border-base bg-transparent'
                  }`}
                >
                  {isSelected && <Check size={10} className="text-fg-on-color" />}
                </div>
                <span className="truncate">{value}</span>
              </div>
            );
          })
        ) : (
          <div className="px-2 py-2 text-xs text-fg-muted text-center">
            No values found
          </div>
        )}
      </div>
    </div>
  );
};

// Filter Chip Component - button group style
const FilterChip = ({ 
  filter, 
  column,
  allColumns,
  onColumnChange,
  onConditionChange, 
  onToggleValue,
  onRemove 
}: { 
  filter: ActiveFilter;
  column?: FilterableColumn;
  allColumns: FilterableColumn[];
  onColumnChange: (newColumnId: string) => void;
  onConditionChange: (condition: 'is_any_of' | 'is_none_of') => void;
  onToggleValue: (value: string) => void;
  onRemove: () => void;
}) => {
  const [columnOpen, setColumnOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [valuesOpen, setValuesOpen] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState("");
  
  // Format values display
  const getValuesDisplay = () => {
    if (filter.values.length === 0) return 'All values';
    if (filter.values.length === 1) return filter.values[0];
    return `${filter.values.length} selected`;
  };
  
  // Filter columns based on search
  const filteredColumns = allColumns.filter(col =>
    col.header.toLowerCase().includes(columnSearchQuery.toLowerCase())
  );
  
  return (
    <div className="inline-flex items-center h-6 rounded-[6px] border border-border-base bg-button-neutral overflow-hidden">
      {/* Column name segment - clickable dropdown */}
      <DropdownMenu open={columnOpen} onOpenChange={(open) => {
        setColumnOpen(open);
        if (!open) setColumnSearchQuery("");
      }}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 px-2 h-full text-xs text-fg-base hover:bg-button-neutral-hover transition-colors border-r border-border-base">
            <span className="text-fg-subtle">
              {getColumnIcon(filter.columnType)}
            </span>
            <span className="max-w-[80px] truncate">{filter.columnHeader}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px] p-0 rounded-[6px]">
          {/* Search input */}
          <div className="p-2 border-b border-border-base">
            <input
              type="text"
              placeholder="Search columns..."
              value={columnSearchQuery}
              onChange={(e) => setColumnSearchQuery(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-transparent border-none outline-none placeholder:text-fg-muted"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Column list */}
          <div className="p-1 max-h-[240px] overflow-y-auto">
            {filteredColumns.length > 0 ? (
              filteredColumns.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() => {
                    onColumnChange(col.id);
                    setColumnOpen(false);
                  }}
                  className="flex items-center justify-between gap-2 px-2 py-2 text-xs rounded-[4px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-fg-subtle shrink-0">
                      {getColumnIcon(col.type)}
                    </span>
                    <span className="truncate">{col.header}</span>
                  </div>
                  {col.id === filter.columnId && <Check size={14} className="text-fg-base shrink-0" />}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-2 text-xs text-fg-muted text-center">
                No columns found
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Condition dropdown segment */}
      <DropdownMenu open={conditionOpen} onOpenChange={setConditionOpen}>
        <DropdownMenuTrigger asChild>
          <button 
            className="flex items-center px-2 h-full text-xs text-fg-base hover:bg-button-neutral-hover transition-colors border-r border-border-base"
          >
            {filter.condition === 'is_any_of' ? 'is any of' : 'is none of'}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[140px] p-1 rounded-[6px]">
          <DropdownMenuItem 
            onClick={() => onConditionChange('is_any_of')}
            className="flex items-center justify-between px-2 py-2 text-xs rounded-[4px]"
          >
            <span>is any of</span>
            {filter.condition === 'is_any_of' && <Check size={14} className="text-fg-base" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onConditionChange('is_none_of')}
            className="flex items-center justify-between px-2 py-2 text-xs rounded-[4px]"
          >
            <span>is none of</span>
            {filter.condition === 'is_none_of' && <Check size={14} className="text-fg-base" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Value segment - clickable dropdown */}
      <DropdownMenu open={valuesOpen} onOpenChange={setValuesOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center px-2 h-full text-xs text-fg-base hover:bg-button-neutral-hover transition-colors border-r border-border-base">
            <span className="max-w-[100px] truncate">{getValuesDisplay()}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="p-0 rounded-[6px]">
          {column ? (
            <ColumnFilterSubmenuContent
              column={column}
              selectedValues={filter.values}
              onToggleValue={onToggleValue}
            />
          ) : (
            <div className="w-[200px] p-2 text-xs text-fg-muted text-center">
              No values available
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Close button segment */}
      <button 
        onClick={onRemove}
        className="flex items-center justify-center w-6 h-full text-fg-muted hover:text-fg-base hover:bg-button-neutral-hover transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// Sortable column item for display options
const SortableColumnItem = ({ 
  column, 
  onToggleVisibility 
}: { 
  column: DisplayColumn;
  onToggleVisibility: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-2 px-2 py-2 rounded-[4px] hover:bg-bg-subtle-hover"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={() => onToggleVisibility(column.id)}
          className={`w-3.5 h-3.5 shrink-0 rounded-[3px] border flex items-center justify-center transition-colors ${
            column.visible 
              ? 'bg-bg-interactive border-border-interactive' 
              : 'border-border-base bg-transparent hover:border-border-strong'
          }`}
        >
          {column.visible && <Check size={10} className="text-fg-on-color" />}
        </button>
        <span className="text-xs text-fg-base truncate">{column.header}</span>
      </div>
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 shrink-0 text-fg-muted hover:text-fg-subtle cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>
    </div>
  );
};

// Display Options Dropdown Content
const DisplayOptionsContent = ({
  displayColumns,
  onToggleVisibility,
  onReorder,
}: {
  displayColumns: DisplayColumn[];
  onToggleVisibility: (id: string) => void;
  onReorder: (columns: DisplayColumn[]) => void;
}) => {
  const fixedColumns = displayColumns.filter(col => col.fixed);
  const sortableColumns = displayColumns.filter(col => !col.fixed);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortableColumns.findIndex(col => col.id === active.id);
      const newIndex = sortableColumns.findIndex(col => col.id === over.id);
      
      const newSortableColumns = arrayMove(sortableColumns, oldIndex, newIndex);
      onReorder([...fixedColumns, ...newSortableColumns]);
    }
  };

  return (
    <div className="w-[240px]">
      {/* Fixed columns section */}
      {fixedColumns.length > 0 && (
        <div className="p-1">
          <div className="text-xs text-fg-muted px-2 py-2">Fixed columns</div>
          {fixedColumns.map(column => (
            <div 
              key={column.id}
              className="flex items-center gap-2 px-2 py-2 min-w-0"
            >
              <span className="shrink-0"><FileColumnIcon /></span>
              <span className="text-xs text-fg-base truncate">{column.header}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Divider */}
      {fixedColumns.length > 0 && sortableColumns.length > 0 && (
        <div className="h-px bg-border-base mx-1" />
      )}
      
      {/* Sortable columns section */}
      {sortableColumns.length > 0 && (
        <div className="p-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableColumns.map(col => col.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortableColumns.map(column => (
                <SortableColumnItem
                  key={column.id}
                  column={column}
                  onToggleVisibility={onToggleVisibility}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
      
      {/* Empty state */}
      {sortableColumns.length === 0 && fixedColumns.length === 0 && (
        <div className="px-2 py-2 text-xs text-fg-muted text-center">
          No columns to display
        </div>
      )}
    </div>
  );
};

interface ReviewFilterBarProps {
  onFilter?: () => void;
  columns?: FilterableColumn[];
  onColumnFilter?: (columnId: string) => void;
  onFiltersChange?: (filters: ActiveFilter[]) => void;
  activeFilters?: ActiveFilter[];
  hasFilters?: boolean;
  displayColumns?: DisplayColumn[];
  onToggleColumnVisibility?: (columnId: string) => void;
  onReorderColumns?: (columns: DisplayColumn[]) => void;
}

export default function ReviewFilterBar({ 
  onFilter,
  columns = [],
  onColumnFilter,
  onFiltersChange,
  activeFilters: controlledActiveFilters,
  hasFilters = false,
  displayColumns = [],
  onToggleColumnVisibility,
  onReorderColumns,
}: ReviewFilterBarProps) {
  const hasColumns = columns.length > 0;
  const hasDisplayColumns = displayColumns.length > 0;
  const [internalActiveFilters, setInternalActiveFilters] = useState<ActiveFilter[]>([]);
  
  // Use controlled filters if provided, otherwise use internal state
  const activeFilters = controlledActiveFilters ?? internalActiveFilters;
  const setActiveFilters = (filters: ActiveFilter[] | ((prev: ActiveFilter[]) => ActiveFilter[])) => {
    const newFilters = typeof filters === 'function' ? filters(activeFilters) : filters;
    setInternalActiveFilters(newFilters);
    onFiltersChange?.(newFilters);
  };
  const [displayOptionsOpen, setDisplayOptionsOpen] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  
  // Track pending filter selections (before submenu closes)
  const [pendingSelections, setPendingSelections] = useState<Record<string, string[]>>({});
  
  // Notify parent when filters change
  useEffect(() => {
    onFiltersChange?.(activeFilters);
  }, [activeFilters, onFiltersChange]);
  
  const handleToggleValue = (columnId: string, value: string) => {
    const currentSelections = pendingSelections[columnId] || [];
    const newSelections = currentSelections.includes(value)
      ? currentSelections.filter(v => v !== value)
      : [...currentSelections, value];
    
    setPendingSelections(prev => ({
      ...prev,
      [columnId]: newSelections,
    }));
    
    // Find the column
    const column = columns.find(c => c.id === columnId);
    if (!column) return;
    
    // Check if filter already exists
    const existingFilter = activeFilters.find(f => f.columnId === columnId);
    
    if (existingFilter) {
      // Update existing filter
      setActiveFilters(activeFilters.map(f => 
        f.columnId === columnId ? { ...f, values: newSelections } : f
      ));
    } else {
      // Create new filter
      const newFilter: ActiveFilter = {
        columnId: column.id,
        columnHeader: column.header,
        columnType: column.type,
        condition: 'is_any_of',
        values: newSelections,
      };
      setActiveFilters([...activeFilters, newFilter]);
    }
    
    onColumnFilter?.(columnId);
  };
  
  const handleConditionChange = (filterId: string, condition: 'is_any_of' | 'is_none_of') => {
    setActiveFilters(activeFilters.map(f => 
      f.columnId === filterId ? { ...f, condition } : f
    ));
  };
  
  const handleRemoveFilter = (filterId: string) => {
    setActiveFilters(activeFilters.filter(f => f.columnId !== filterId));
    setPendingSelections(prev => {
      const next = { ...prev };
      delete next[filterId];
      return next;
    });
  };
  
  const handleColumnChange = (oldColumnId: string, newColumnId: string) => {
    // Find the new column
    const newColumn = columns.find(c => c.id === newColumnId);
    if (!newColumn) return;
    
    // Update the filter with new column info, reset values
    setActiveFilters(activeFilters.map(f => 
      f.columnId === oldColumnId 
        ? { 
            ...f, 
            columnId: newColumn.id,
            columnHeader: newColumn.header,
            columnType: newColumn.type,
            values: [], // Reset values when column changes
          } 
        : f
    ));
    
    // Update pending selections
    setPendingSelections(prev => {
      const next = { ...prev };
      delete next[oldColumnId];
      next[newColumnId] = [];
      return next;
    });
  };
  
  // Filter columns based on search query
  const filteredColumns = columns.filter(col =>
    col.header.toLowerCase().includes(columnSearchQuery.toLowerCase())
  );
  
  // Get selected values for a column (from active filter or pending selections)
  const getSelectedValues = (columnId: string): string[] => {
    const activeFilter = activeFilters.find(f => f.columnId === columnId);
    if (activeFilter) return activeFilter.values;
    return pendingSelections[columnId] || [];
  };
  
  return (
    <div className="px-3 py-2 border-b border-border-base bg-bg-base flex items-center justify-between" style={{ height: '42px' }}>
      <div className="flex items-center gap-2">
        {/* Filter Button with Dropdown */}
        {hasColumns ? (
          <DropdownMenu open={filterDropdownOpen} onOpenChange={(open) => {
            setFilterDropdownOpen(open);
            if (!open) {
              setColumnSearchQuery("");
            }
          }}>
            <DropdownMenuTrigger asChild>
              <div>
                <SmallButton 
                  variant="secondary" 
                  icon={<SvgIcon src="/central_icons/Filter.svg" alt="Filter" width={14} height={14} className="text-fg-subtle" />}
                >
                  Filter
                </SmallButton>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px] p-0 rounded-[6px]">
              {/* Search columns input */}
              <div className="p-2 border-b border-border-base">
                <input
                  type="text"
                  placeholder="Search columns..."
                  value={columnSearchQuery}
                  onChange={(e) => setColumnSearchQuery(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-transparent border-none outline-none placeholder:text-fg-muted"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              {/* Column list with submenus */}
              <div className="p-1">
                {filteredColumns.length > 0 ? (
                  filteredColumns.map((column) => (
                    <DropdownMenuSub key={column.id}>
                      <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-2 text-xs rounded-[4px] w-full">
                        <span className="text-fg-subtle shrink-0">
                          {getColumnIcon(column.type)}
                        </span>
                        <span className="truncate">{column.header}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="p-0 rounded-[6px]">
                        <ColumnFilterSubmenuContent
                          column={column}
                          selectedValues={getSelectedValues(column.id)}
                          onToggleValue={(value) => handleToggleValue(column.id, value)}
                        />
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ))
                ) : (
                  <div className="px-2 py-2 text-xs text-fg-muted text-center">
                    No columns found
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SmallButton 
            variant="secondary" 
            onClick={onFilter}
            icon={<SvgIcon src="/central_icons/Filter.svg" alt="Filter" width={14} height={14} className="text-fg-subtle" />}
            disabled
          >
            Filter
          </SmallButton>
        )}
        
        {/* Active Filter Chips */}
        {activeFilters.map((filter) => (
          <FilterChip
            key={filter.columnId}
            filter={filter}
            column={columns.find(c => c.id === filter.columnId)}
            allColumns={columns}
            onColumnChange={(newColumnId) => handleColumnChange(filter.columnId, newColumnId)}
            onConditionChange={(condition) => handleConditionChange(filter.columnId, condition)}
            onToggleValue={(value) => handleToggleValue(filter.columnId, value)}
            onRemove={() => handleRemoveFilter(filter.columnId)}
          />
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Display Options Button with Dropdown */}
        {hasDisplayColumns ? (
          <DropdownMenu open={displayOptionsOpen} onOpenChange={setDisplayOptionsOpen}>
            <DropdownMenuTrigger asChild>
              <div>
                <SmallButton 
                  variant="secondary" 
                  icon={<SvgIcon src="/central_icons/SliderSettings.svg" alt="Display options" width={14} height={14} className="text-fg-subtle" />}
                >
                  Display options
                </SmallButton>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-1 rounded-[6px]">
              <DisplayOptionsContent
                displayColumns={displayColumns}
                onToggleVisibility={(id) => onToggleColumnVisibility?.(id)}
                onReorder={(cols) => onReorderColumns?.(cols)}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SmallButton 
            variant="secondary" 
            icon={<SvgIcon src="/central_icons/SliderSettings.svg" alt="Display options" width={14} height={14} className="text-fg-subtle" />}
            disabled
          >
            Display options
          </SmallButton>
        )}
      </div>
    </div>
  );
}
