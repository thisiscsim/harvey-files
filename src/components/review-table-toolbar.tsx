"use client";

import { SmallButton } from "@/components/ui/button";
import { SvgIcon } from "@/components/svg-icon";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MonitoringDialog from "@/components/monitoring-dialog";

// Icon components for column types
const TextIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 4.5V3H9M9 3H15V4.5M9 3V15M9 15H7.5M9 15H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ParagraphIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 4.5H15M3 9H15M3 13.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NumberIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 6V4H6.5M6.5 4H9V6M6.5 4V14M6.5 14H4M6.5 14H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 6H14.5M14.5 6V14M14.5 6L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DateIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2.25" y="3.75" width="13.5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2.25 7.5H15.75" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5.25 2.25V5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12.75 2.25V5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Pre-generated questions data
const preGeneratedQuestions = [
  { name: "Benchmark Floor", type: "text", icon: TextIcon },
  { name: "Biggest Winners / Biggest Losers", type: "paragraph", icon: ParagraphIcon },
  { name: "Biotech Probability Success", type: "number", icon: NumberIcon },
  { name: "Board Composition", type: "paragraph", icon: ParagraphIcon },
  { name: "Borrower Business Profile", type: "paragraph", icon: ParagraphIcon },
  { name: "Borrower Model", type: "paragraph", icon: ParagraphIcon },
  { name: "Buyback Guide", type: "paragraph", icon: ParagraphIcon },
  { name: "Benchmark Procurement Date", type: "date", icon: DateIcon },
];

interface ReviewTableToolbarProps {
  chatOpen: boolean;
  onToggleChat: () => void;
  alignment?: 'top' | 'center' | 'bottom';
  onAlignmentChange?: (alignment: 'top' | 'center' | 'bottom') => void;
  textWrap?: boolean;
  onTextWrapChange?: (wrap: boolean) => void;
  hasFiles?: boolean;
  onAddColumn?: () => void;
  isGroupingFiles?: boolean;
  onGroupFiles?: () => void;
  onBatchColumns?: () => void;
}

export default function ReviewTableToolbar({ 
  chatOpen, 
  onToggleChat, 
  alignment = 'center',
  onAlignmentChange,
  textWrap = false,
  onTextWrapChange,
  hasFiles = false,
  onAddColumn,
  isGroupingFiles = false,
  onGroupFiles,
  onBatchColumns
}: ReviewTableToolbarProps) {
  // Use props for alignment instead of local state
  const handleAlignmentChange = (newAlignment: 'top' | 'center' | 'bottom') => {
    onAlignmentChange?.(newAlignment);
  };
  
  // Use props for text wrap instead of local state
  const handleTextWrapChange = (wrap: boolean) => {
    onTextWrapChange?.(wrap);
  };
  
  // State for concise/extend (keep local for now)
  const [textLength, setTextLength] = useState<'concise' | 'extend'>('concise');
  
  // State for Add column dropdown
  const [addColumnDropdownOpen, setAddColumnDropdownOpen] = useState(false);
  
  // State for Monitoring dialog
  const [monitoringDialogOpen, setMonitoringDialogOpen] = useState(false);
  const [isMonitorActive, setIsMonitorActive] = useState(false);

  return (
    <div className="px-3 py-2 border-b border-border-base bg-bg-base flex items-center" style={{ height: '42px' }}>
      {/* Left Section - Ask Harvey */}
      <div className="flex items-center gap-2">
        <SmallButton
          onClick={onToggleChat}
          variant="secondary"
          className={chatOpen ? "bg-bg-subtle" : ""}
          icon={
            <SvgIcon 
              src={chatOpen ? "/central_icons/Assistant - Filled.svg" : "/central_icons/Assistant.svg"}
              alt="Harvey" 
              width={14} 
              height={14} 
              className={chatOpen ? "text-fg-base" : "text-fg-subtle"}
            />
          }
        >
          Ask Harvey
        </SmallButton>
      </div>
      
      {/* Center Section - File/Column Controls + Formatting */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {/* Add Column Button with Dropdown */}
        <DropdownMenu open={addColumnDropdownOpen} onOpenChange={setAddColumnDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <SmallButton 
              variant="secondary" 
              icon={<SvgIcon src="/central_icons/Add Column.svg" alt="Add column" width={14} height={14} className="text-fg-subtle" />}
              className={addColumnDropdownOpen ? "bg-bg-subtle-pressed" : ""}
            >
              Add column
            </SmallButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={hasFiles ? "min-w-[380px]" : "min-w-[180px]"}>
            {hasFiles && (
              <>
                <div className="px-2 py-2 text-fg-muted" style={{ fontSize: '12px' }}>
                  Harvey auto-generated questions from your files
                </div>
                {preGeneratedQuestions.map((question) => {
                  const IconComponent = question.icon;
                  return (
                    <DropdownMenuItem key={question.name}>
                      <IconComponent className="text-fg-subtle" />
                      <span>{question.name}</span>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onAddColumn}>
              <SvgIcon 
                src="/central_icons/Add Column.svg" 
                alt="Add column" 
                width={16} 
                height={16}
                className="text-fg-subtle"
              />
              <span>Add column</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBatchColumns}>
              <SvgIcon 
                src="/central_icons/Batch Columns.svg" 
                alt="Batch columns" 
                width={16} 
                height={16}
                className="text-fg-subtle"
              />
              <span>Batch columns</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Add Files Button */}
        <SmallButton 
          variant="secondary" 
          icon={<SvgIcon src="/central_icons/Add File.svg" alt="Add files" width={14} height={14} className="text-fg-subtle" />}
        >
          Add files
        </SmallButton>
        
        {/* Group Files Button with Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SmallButton 
                variant="secondary"
                onClick={onGroupFiles}
                disabled={isGroupingFiles}
                icon={<SvgIcon src="/central_icons/Layers.svg" alt="Group files" width={14} height={14} className="text-fg-subtle" />}
              >
                Group files
              </SmallButton>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[170px]">
              Automatically group files to extract deeper insights
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Separator */}
        <div className="w-px bg-bg-subtle-pressed" style={{ height: '12px' }}></div>
        
        {/* Alignment Options - Segmented Control */}
        <div className="flex items-center bg-bg-subtle rounded-[6px] p-[2px] border border-border-base">
          <button 
            onClick={() => handleAlignmentChange('top')}
            className={`w-[18px] h-[18px] flex items-center justify-center rounded-[4px] transition-colors ${
              alignment === 'top' ? 'bg-bg-base text-fg-base' : 'text-fg-subtle hover:text-fg-base'
            }`}
            title="Top align"
          >
            <SvgIcon 
              src={alignment === 'top' ? '/top-align-filled.svg' : '/top-align-outline.svg'} 
              alt="Top align" 
              width={12} 
              height={12} 
            />
          </button>
          
          <button 
            onClick={() => handleAlignmentChange('center')}
            className={`w-[18px] h-[18px] flex items-center justify-center rounded-[4px] transition-colors ${
              alignment === 'center' ? 'bg-bg-base text-fg-base' : 'text-fg-subtle hover:text-fg-base'
            }`}
            title="Center align"
          >
            <SvgIcon 
              src={alignment === 'center' ? '/center-align-filled.svg' : '/center-align-outline.svg'} 
              alt="Center align" 
              width={12} 
              height={12} 
            />
          </button>
          
          <button 
            onClick={() => handleAlignmentChange('bottom')}
            className={`w-[18px] h-[18px] flex items-center justify-center rounded-[4px] transition-colors ${
              alignment === 'bottom' ? 'bg-bg-base text-fg-base' : 'text-fg-subtle hover:text-fg-base'
            }`}
            title="Bottom align"
          >
            <SvgIcon 
              src={alignment === 'bottom' ? '/bottom-align-filled.svg' : '/bottom-align-outline.svg'} 
              alt="Bottom align" 
              width={12} 
              height={12} 
            />
          </button>
        </div>
        
        {/* Text Display Options - Segmented Control */}
        <div className="flex items-center bg-bg-subtle rounded-[6px] p-[2px] border border-border-base">
          <button 
            onClick={() => handleTextWrapChange(false)}
            className={`w-[18px] h-[18px] flex items-center justify-center rounded-[4px] transition-colors ${
              !textWrap ? 'bg-bg-base text-fg-base' : 'text-fg-subtle hover:text-fg-base'
            }`}
            title="Text overflow"
          >
            <SvgIcon 
              src="/overflow.svg" 
              alt="Text overflow" 
              width={12} 
              height={12} 
            />
          </button>
          
          <button 
            onClick={() => handleTextWrapChange(true)}
            className={`w-[18px] h-[18px] flex items-center justify-center rounded-[4px] transition-colors ${
              textWrap ? 'bg-bg-base text-fg-base' : 'text-fg-subtle hover:text-fg-base'
            }`}
            title="Text wrapping"
          >
            <SvgIcon 
              src="/wrapping.svg" 
              alt="Text wrapping" 
              width={12} 
              height={12} 
            />
          </button>
        </div>
        
        {/* Text Length Options - Segmented Control */}
        <div className="flex items-center bg-bg-subtle rounded-[6px] p-[2px] border border-border-base">
          <button 
            onClick={() => setTextLength('concise')}
            className={`w-[18px] h-[18px] flex items-center justify-center rounded-[4px] transition-colors ${
              textLength === 'concise' ? 'bg-bg-base text-fg-base' : 'text-fg-subtle hover:text-fg-base'
            }`}
            title="Concise"
          >
            <SvgIcon 
              src="/concise.svg" 
              alt="Concise" 
              width={12} 
              height={12} 
            />
          </button>
          
          <button 
            onClick={() => setTextLength('extend')}
            className={`w-[18px] h-[18px] flex items-center justify-center rounded-[4px] transition-colors ${
              textLength === 'extend' ? 'bg-bg-base text-fg-base' : 'text-fg-subtle hover:text-fg-base'
            }`}
            title="Extend"
          >
            <SvgIcon 
              src="/extend.svg" 
              alt="Extend" 
              width={12} 
              height={12} 
            />
          </button>
        </div>
      </div>
      
      {/* Right Section - Monitoring */}
      <div className="flex items-center gap-2">
        <SmallButton 
          variant="secondary" 
          onClick={() => setMonitoringDialogOpen(true)}
          className={isMonitorActive ? "bg-bg-subtle" : ""}
          icon={
            <SvgIcon 
              src={isMonitorActive ? "/central_icons/Satellite - Filled.svg" : "/central_icons/Satellite.svg"} 
              alt="Monitoring" 
              width={14} 
              height={14} 
              className={isMonitorActive ? "text-fg-base" : "text-fg-subtle"}
            />
          }
        >
          {isMonitorActive ? "Monitor Active" : "Monitoring"}
        </SmallButton>
      </div>
      
      {/* Monitoring Dialog */}
      <MonitoringDialog 
        isOpen={monitoringDialogOpen} 
        onClose={() => setMonitoringDialogOpen(false)}
        isMonitorActive={isMonitorActive}
        onCreateMonitor={() => setIsMonitorActive(true)}
        onRemoveMonitor={() => setIsMonitorActive(false)}
      />
    </div>
  );
}
