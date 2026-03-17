"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

// Type options for columns
const typeOptions = [
  { id: 'free-response', label: 'Free response', icon: (
    <svg width="12" height="12" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4.5H15M3 9H15M3 13.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { id: 'verbatim', label: 'Verbatim', icon: (
    <svg width="12" height="12" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4.5V3H9M9 3H15V4.5M9 3V15M9 15H7.5M9 15H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { id: 'date', label: 'Date', icon: (
    <svg width="12" height="12" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.25" y="3.75" width="13.5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.25 7.5H15.75" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5.25 2.25V5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12.75 2.25V5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )},
  { id: 'number', label: 'Number', icon: (
    <svg width="12" height="12" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6V4H6.5M6.5 4H9V6M6.5 4V14M6.5 14H4M6.5 14H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 6H14.5M14.5 6V14M14.5 6L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
];

interface BatchColumn {
  id: string;
  title: string;
  query: string;
  type: string;
  selected: boolean;
}

interface BatchColumnsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColumns: (columns: { title: string; query: string; type: string }[]) => void;
}

export default function BatchColumnsDialog({ isOpen, onClose, onAddColumns }: BatchColumnsDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [columns, setColumns] = useState<BatchColumn[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [openTypeDropdown, setOpenTypeDropdown] = useState<string | null>(null);

  const handleGenerateColumns = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    // Simulate generating columns from the prompt
    setTimeout(() => {
      const generated: BatchColumn[] = [
        { id: `col-${Date.now()}-1`, title: 'Effective Date', query: 'What is the effective date of the merger agreement?', type: 'date', selected: true },
        { id: `col-${Date.now()}-2`, title: 'Acquiror', query: 'Who is the acquiror?', type: 'verbatim', selected: true },
        { id: `col-${Date.now()}-3`, title: 'Target', query: 'Who is being acquired?', type: 'verbatim', selected: true },
        { id: `col-${Date.now()}-4`, title: 'Other Parties', query: 'What other parties are involved in the transaction?', type: 'free-response', selected: true },
        { id: `col-${Date.now()}-5`, title: 'Simultaneous Sign and Close?', query: 'Does the agreement provide for a simultaneous or bifurcated signing and closing?', type: 'free-response', selected: true },
      ];
      setColumns(generated);
      setIsGenerating(false);
    }, 1500);
  };

  const toggleColumn = (id: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const toggleAll = () => {
    const allSelected = columns.every(c => c.selected);
    setColumns(prev => prev.map(c => ({ ...c, selected: !allSelected })));
  };

  const updateColumn = (id: string, field: 'title' | 'query' | 'type', value: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeColumn = (id: string) => {
    setColumns(prev => prev.filter(c => c.id !== id));
  };

  const addEmptyColumn = () => {
    setColumns(prev => [...prev, {
      id: `col-${Date.now()}`,
      title: '',
      query: '',
      type: 'free-response',
      selected: true,
    }]);
  };

  const handleAddColumns = () => {
    const selected = columns.filter(c => c.selected && c.title.trim());
    if (selected.length === 0) return;
    onAddColumns(selected.map(c => ({ title: c.title, query: c.query, type: c.type })));
    handleClose();
  };

  const handleClose = () => {
    setPrompt('');
    setColumns([]);
    setIsGenerating(false);
    onClose();
  };

  const allSelected = columns.length > 0 && columns.every(c => c.selected);
  const someSelected = columns.some(c => c.selected);
  const getTypeOption = (typeId: string) => typeOptions.find(t => t.id === typeId) || typeOptions[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent 
        className="p-0 gap-0 overflow-hidden flex flex-col"
        style={{ width: '900px', maxWidth: '900px', maxHeight: '80vh' }}
        
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border-base" style={{ flexShrink: 0 }}>
          <h2 className="text-base font-medium text-fg-base">Batch columns</h2>
          <button 
            onClick={handleClose}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-bg-subtle transition-colors text-fg-subtle hover:text-fg-base"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
          {/* Prompt Section */}
          <div className="mb-4">
            <p className="text-sm text-fg-muted mb-2">Ask Harvey to generate multiple columns based on your prompt</p>
            <div className="border border-border-base rounded-[10px] bg-bg-subtle">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What are the types of organizations listed in these docs. Summarize into categories and extract provisions in each case..."
                className="w-full p-3 text-sm text-fg-base placeholder:text-fg-muted bg-transparent resize-none outline-none"
                style={{ minHeight: '100px' }}
              />
              <div className="flex items-center justify-between px-[10px] py-2 border-t border-border-base">
                <p className="text-[11px] text-fg-disabled leading-[14px]">
                  For best results, include the type of document you&apos;re reviewing the key information you&apos;d like to extract
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="small">
                    Import CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="small"
                    disabled={!prompt.trim() || isGenerating}
                    onClick={handleGenerateColumns}
                  >
                    {isGenerating ? 'Generating...' : 'Generate columns'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Columns Table */}
          {columns.length > 0 && (
            <div className="border border-border-base rounded-[8px] overflow-hidden">
              {/* Table Header */}
              <div className="flex items-center h-8 border-b border-border-base bg-bg-base">
                <div className="w-7 flex items-center justify-center shrink-0">
                  <button
                    onClick={toggleAll}
                    className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                      allSelected ? 'border-fg-base bg-fg-base' : 'border-border-strong bg-bg-base hover:border-fg-muted'
                    }`}
                  >
                    {allSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {someSelected && !allSelected && (
                      <div className="w-2 h-0.5 bg-fg-base rounded-full" />
                    )}
                  </button>
                </div>
                <div className="w-[200px] px-2 shrink-0">
                  <span className="text-xs font-medium text-fg-subtle">Title</span>
                </div>
                <div className="flex-1 px-2">
                  <span className="text-xs font-medium text-fg-subtle">Query</span>
                </div>
                <div className="w-[160px] px-2 shrink-0">
                  <span className="text-xs font-medium text-fg-subtle">Type</span>
                </div>
                <div className="w-7 shrink-0 pr-[2px]" />
              </div>

              {/* Table Rows */}
              {columns.map((col) => {
                const typeOpt = getTypeOption(col.type);
                return (
                  <div key={col.id} className="flex items-center h-10 border-b border-border-base last:border-b-0 group">
                    <div className="w-7 flex items-center justify-center shrink-0">
                      <button
                        onClick={() => toggleColumn(col.id)}
                        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                          col.selected ? 'border-fg-base bg-fg-base' : 'border-border-strong bg-bg-base hover:border-fg-muted'
                        }`}
                      >
                        {col.selected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="w-[200px] px-2 shrink-0">
                      <input
                        type="text"
                        value={col.title}
                        onChange={(e) => updateColumn(col.id, 'title', e.target.value)}
                        className="w-full bg-transparent text-sm text-fg-base outline-none placeholder:text-fg-muted font-medium"
                        placeholder="Column title"
                      />
                    </div>
                    <div className="flex-1 px-2 border-l border-border-base">
                      <input
                        type="text"
                        value={col.query}
                        onChange={(e) => updateColumn(col.id, 'query', e.target.value)}
                        className="w-full bg-transparent text-sm text-fg-base outline-none placeholder:text-fg-muted"
                        placeholder="Enter query..."
                      />
                    </div>
                    <div className="w-[160px] px-2 border-l border-border-base shrink-0">
                      <div className="relative">
                        <button
                          onClick={() => setOpenTypeDropdown(openTypeDropdown === col.id ? null : col.id)}
                          className="flex items-center justify-between w-full h-6 px-2 py-1 bg-bg-base border border-border-base rounded-[4px] cursor-pointer hover:border-border-strong transition-colors"
                        >
                          <div className="flex items-center gap-[5px]">
                            <span className="text-fg-subtle shrink-0">{typeOpt.icon}</span>
                            <span className="text-[12px] text-fg-base leading-[16px]">{typeOpt.label}</span>
                          </div>
                          <ChevronsUpDown size={12} className="text-fg-muted shrink-0" />
                        </button>
                        {openTypeDropdown === col.id && (
                          <>
                            <div className="fixed inset-0 z-50" onClick={() => setOpenTypeDropdown(null)} />
                            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-base border border-border-base rounded-[6px] z-50 py-1" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                              {typeOptions.map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => { updateColumn(col.id, 'type', opt.id); setOpenTypeDropdown(null); }}
                                  className={`w-full flex items-center gap-[5px] px-2 py-1.5 text-left hover:bg-bg-subtle transition-colors ${col.type === opt.id ? 'bg-bg-subtle' : ''}`}
                                >
                                  <span className="text-fg-subtle shrink-0">{opt.icon}</span>
                                  <span className="text-[12px] text-fg-base leading-[16px]">{opt.label}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-center shrink-0 pr-[2px]">
                      <button
                        onClick={() => removeColumn(col.id)}
                        className="h-6 w-6 flex items-center justify-center rounded-[6px] text-fg-subtle hover:text-fg-base hover:bg-button-neutral-hover active:bg-button-neutral-pressed opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Column Button */}
          {columns.length > 0 && (
            <button
              onClick={addEmptyColumn}
              className="w-full flex items-center justify-center gap-1 h-8 mt-2 border border-border-base rounded-[8px] text-sm text-fg-subtle hover:text-fg-base hover:bg-bg-subtle transition-colors"
            >
              <Plus size={14} />
              Add column
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-base p-3 flex items-center justify-end gap-2" style={{ flexShrink: 0 }}>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            variant="default"
            disabled={!columns.some(c => c.selected && c.title.trim())}
            onClick={handleAddColumns}
          >
            Add columns
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
