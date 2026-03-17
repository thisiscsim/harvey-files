"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Folder type definition
export type FolderItem = {
  id: string;
  name: string;
  type?: 'folder' | 'file';
  isExpanded?: boolean;
  children?: FolderItem[];
};

// Sample folder structure for sources
export const sampleFolders: FolderItem[] = [
  { 
    id: '1', 
    name: 'Agilent Supply', 
    isExpanded: true,
    children: [
      { id: '1-1', name: 'Asset Liquidation Records', type: 'folder' },
      { 
        id: '1-2', 
        name: 'Bankruptcy or Receivership', 
        type: 'folder',
        isExpanded: true,
        children: [
          { id: '1-2-1', name: 'Bankruptcy Filings', type: 'folder' },
          { id: '1-2-2', name: 'Chapter 11 Agreements', type: 'folder' },
          { id: '1-2-3', name: 'Chapter 7 Cases', type: 'folder' },
          { id: '1-2-4', name: 'Creditor Claims', type: 'folder' },
          { id: '1-2-5', name: 'Debtor Correspondence', type: 'folder' },
          { id: '1-2-6', name: 'Trustee Communications', type: 'folder' },
        ]
      },
    ]
  },
  { id: '2', name: 'Completion of Acquisition of Material Scienc...', type: 'folder' },
  { id: '3', name: 'Entry into a Material Agreement', type: 'folder' },
  { id: '4', name: 'Mine Safety - Reporting of Terminat...', type: 'folder' },
];

// Tree view trail component matching Figma specs exactly with curved SVGs
function TreeViewTrail({ goBelow = true, goOnTheRight = false }: { goBelow?: boolean; goOnTheRight?: boolean }) {
  if (goBelow && goOnTheRight) {
    // Curved L-connector that continues down (9x32px SVG)
    return (
      <div className="w-[20px] h-[24px] relative mix-blend-multiply">
        <img 
          src="/tree-line-curve-continue.svg" 
          alt="" 
          className="absolute left-[6px] -top-[4px] w-[9px] h-[32px]"
        />
      </div>
    );
  }
  if (!goBelow && goOnTheRight) {
    // Curved L-connector that terminates (9x17px SVG)
    return (
      <div className="w-[20px] h-[24px] relative mix-blend-multiply">
        <img 
          src="/tree-line-curve.svg" 
          alt="" 
          className="absolute left-[6px] -top-[4px] w-[9px] h-[17px]"
        />
      </div>
    );
  }
  if (goBelow && !goOnTheRight) {
    // Vertical pass-through line
    return (
      <div className="w-[20px] h-[24px] relative mix-blend-multiply">
        <div className="absolute h-[32px] left-[6px] -top-[4px] w-px bg-[#cccac6]" />
      </div>
    );
  }
  // No lines (goBelow=false, goOnTheRight=false) - empty spacer
  return <div className="w-[20px] h-[24px]" />;
}

interface FileTreeViewProps {
  folders: FolderItem[];
  defaultExpandedIds?: string[];
  onFolderClick?: (folder: FolderItem) => void;
  onFileClick?: (file: FolderItem) => void;
  className?: string;
}

export function FileTreeView({ 
  folders, 
  defaultExpandedIds = ['1', '1-2'],
  onFolderClick,
  onFileClick,
  className = ''
}: FileTreeViewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(defaultExpandedIds));

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFolderTree = (items: FolderItem[], depth = 0, parentHasMoreSiblings: boolean[] = []) => {
    return items.map((item, index) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedFolders.has(item.id);
      const isLastInLevel = index === items.length - 1;
      const isFolder = item.type === 'folder' || hasChildren;
      
      return (
        <div key={item.id}>
          <div 
            className={`flex items-center h-[32px] px-[8px] rounded-[4px] cursor-pointer hover:bg-[#f6f5f4] group ${
              isExpanded && hasChildren ? 'bg-[#f6f5f4]' : 'bg-white'
            }`}
            onClick={() => {
              if (hasChildren) {
                toggleFolder(item.id);
              }
              if (isFolder) {
                onFolderClick?.(item);
              } else {
                onFileClick?.(item);
              }
            }}
          >
            {/* Trail lines for hierarchy - only for non-root items */}
            {depth > 0 && (
              <div className="flex items-center h-[24px] shrink-0">
                {/* Parent trail lines (vertical pass-through) */}
                {parentHasMoreSiblings.map((hasMore, i) => (
                  <TreeViewTrail key={i} goBelow={hasMore} goOnTheRight={false} />
                ))}
                {/* Current level curved connector */}
                <TreeViewTrail goBelow={!isLastInLevel} goOnTheRight={true} />
              </div>
            )}
            
            {/* Folder/File icon */}
            <div className="flex items-center h-full px-[2px] shrink-0">
              <img 
                src={isExpanded && hasChildren ? "/folder-vault-filled.svg" : "/folderIcon.svg"} 
                alt="Folder" 
                className="w-4 h-4" 
              />
            </div>
            
            {/* Text zone */}
            <div className="flex-1 flex items-center gap-[4px] h-full overflow-hidden px-[4px]">
              <span className="text-[13px] font-medium text-[#575757] leading-[20px] truncate">{item.name}</span>
            </div>
            
            {/* Chevron on the right */}
            {hasChildren && (
              <div className="flex items-center h-[24px] px-[2px] shrink-0">
                <ChevronDown 
                  className={`w-4 h-4 text-[#8f8c85] transition-transform ${
                    isExpanded ? '' : '-rotate-90'
                  }`} 
                />
              </div>
            )}
          </div>
          
          {hasChildren && isExpanded && (
            <div>
              {renderFolderTree(
                item.children as FolderItem[], 
                depth + 1,
                depth === 0 ? [] : [...parentHasMoreSiblings, !isLastInLevel]
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={className}>
      {renderFolderTree(folders)}
    </div>
  );
}

export default FileTreeView;
