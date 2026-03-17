"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { SvgIcon } from "@/components/svg-icon";
import { StandardDialog } from "@/components/ui/standard-dialog";

interface MonitoringDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isMonitorActive?: boolean;
  onCreateMonitor?: () => void;
  onRemoveMonitor?: () => void;
}

export default function MonitoringDialog({ 
  isOpen, 
  onClose,
  isMonitorActive = false,
  onCreateMonitor,
  onRemoveMonitor,
}: MonitoringDialogProps) {
  const [frequency, setFrequency] = useState("Weekly");
  const [hourOfDay, setHourOfDay] = useState("8:00 AM");
  const [dayOfWeek, setDayOfWeek] = useState("Sunday");
  const [sourceLocation, setSourceLocation] = useState("Vault");
  const [extractionMode, setExtractionMode] = useState<"new" | "all">("new");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const frequencies = ["Daily", "Weekly", "Monthly"];
  const hours = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const sources = ["Vault", "iManage", "SharePoint", "Google Drive"];

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Monitor for new files"
      icon={
        <SvgIcon 
          src="/central_icons/Satellite.svg" 
          alt="Monitor" 
          width={20} 
          height={20}
          className="text-fg-base"
        />
      }
      footer={
        <>
          <Button
            variant="outline"
            disabled={!isMonitorActive}
            onClick={() => {
              onRemoveMonitor?.();
              onClose();
            }}
          >
            Remove monitor
          </Button>
          <Button
            onClick={() => {
              onCreateMonitor?.();
              onClose();
            }}
          >
            {isMonitorActive ? "Update monitor" : "Create monitor"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Description */}
        <p className="text-sm text-fg-subtle">
          Automatically add new files into review
        </p>

        {/* Frequency */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-normal text-fg-subtle">Frequency</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-normal"
              >
                <span>{frequency}</span>
                <ChevronDown className="h-4 w-4 text-fg-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
              {frequencies.map((f) => (
                <DropdownMenuItem key={f} onClick={() => setFrequency(f)}>
                  {f}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Hour of day and Day of week */}
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-normal text-fg-subtle">Hour of day</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <span>{hourOfDay}</span>
                  <ChevronDown className="h-4 w-4 text-fg-muted" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[200px] overflow-y-auto">
                {hours.map((h) => (
                  <DropdownMenuItem key={h} onClick={() => setHourOfDay(h)}>
                    {h}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-normal text-fg-subtle">Day of week</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <span>{dayOfWeek}</span>
                  <ChevronDown className="h-4 w-4 text-fg-muted" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {days.map((d) => (
                  <DropdownMenuItem key={d} onClick={() => setDayOfWeek(d)}>
                    {d}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Source location */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <label className="text-sm font-normal text-fg-subtle">Source location</label>
            <Info className="h-3.5 w-3.5 text-fg-muted" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-normal"
              >
                <span>{sourceLocation}</span>
                <ChevronDown className="h-4 w-4 text-fg-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
              {sources.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSourceLocation(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Extraction mode radio buttons */}
        <RadioGroup 
          value={extractionMode} 
          onValueChange={(value) => setExtractionMode(value as "new" | "all")}
          className="flex items-center gap-4"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="new" />
            <span className="text-sm text-fg-base">Only run extraction over new files</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="all" />
            <span className="text-sm text-fg-base">Run extraction over all files</span>
          </label>
        </RadioGroup>

        {/* Toggles */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch 
              checked={emailUpdates} 
              onCheckedChange={setEmailUpdates}
            />
            <span className="text-sm text-fg-base">Email updates</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={notifications} 
              onCheckedChange={setNotifications}
            />
            <span className="text-sm text-fg-base">Notifications</span>
          </div>
        </div>
      </div>
    </StandardDialog>
  );
}
