"use client";

import React from "react";
import { Plus } from "lucide-react";
import { SvgIcon } from "@/components/svg-icon";

export interface View {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface ReviewTableViewBarProps {
  views: View[];
  activeViewId: string;
  onViewChange: (viewId: string) => void;
  onAddView: () => void;
}

export default function ReviewTableViewBar({
  views,
  activeViewId,
  onViewChange,
  onAddView,
}: ReviewTableViewBarProps) {
  return (
    <div className="border-t border-border-base bg-bg-base flex items-center gap-1" style={{ padding: '8px 12px' }}>
      {/* View Tabs */}
      {views.map((view) => {
        const isActive = view.id === activeViewId;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`h-6 px-2 flex items-center gap-1 rounded-[6px] text-xs font-normal transition-colors border ${
              isActive 
                ? 'bg-button-neutral border-border-base text-fg-base' 
                : 'border-transparent text-fg-subtle hover:bg-button-neutral-hover'
            }`}
          >
            <SvgIcon 
              src="/table-outline.svg" 
              alt="Table" 
              width={14} 
              height={14}
              className={isActive ? "text-fg-base" : "text-fg-subtle"}
            />
            <span>{view.name}</span>
          </button>
        );
      })}
      
      {/* Add View Button */}
      <button
        onClick={onAddView}
        className="h-6 px-2 flex items-center gap-1 text-xs font-normal text-fg-subtle hover:bg-button-neutral-hover rounded-[6px] transition-colors"
      >
        <Plus size={14} className="text-fg-subtle" />
        <span>Add view</span>
      </button>
    </div>
  );
}

