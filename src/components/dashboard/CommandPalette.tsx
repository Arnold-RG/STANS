import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTab: (tab: string) => void;
  onCompute: () => void;
  onSwap: () => void;
  onClearBoard: () => void;
  onExport: () => void;
  onLoadKarachi: () => void;
  onToggleSim: () => void;
  onOpenCities: () => void;
  onPrint: () => void;
  onBrief: () => void;
}

const CommandPalette = ({
  open,
  onOpenChange,
  onTab,
  onCompute,
  onSwap,
  onClearBoard,
  onExport,
  onLoadKarachi,
  onToggleSim,
  onOpenCities,
  onPrint,
  onBrief,
}: CommandPaletteProps) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Command the desk…" />
      <CommandList>
        <CommandEmpty>No matching command.</CommandEmpty>
        <CommandGroup heading="Board">
          <CommandItem onSelect={() => run(onCompute)}>Compute route</CommandItem>
          <CommandItem onSelect={() => run(onSwap)}>Swap live / dest</CommandItem>
          <CommandItem onSelect={() => run(onToggleSim)}>Toggle night board</CommandItem>
          <CommandItem onSelect={() => run(onExport)}>Export session JSON</CommandItem>
          <CommandItem onSelect={() => run(onPrint)}>Print SITREP</CommandItem>
          <CommandItem onSelect={() => run(onClearBoard)}>Clear board</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Load">
          <CommandItem onSelect={() => run(onLoadKarachi)}>Load Karachi Sector 04</CommandItem>
          <CommandItem onSelect={() => run(onOpenCities)}>Open city templates</CommandItem>
          <CommandItem onSelect={() => run(onBrief)}>Open briefing</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go">
          {[
            ["map", "Map"],
            ["route", "Route"],
            ["mst", "MST"],
            ["builder", "Builder"],
            ["cities", "Cities"],
            ["files", "Files"],
            ["analytics", "Analytics"],
            ["brief", "Brief"],
          ].map(([value, label]) => (
            <CommandItem key={value} onSelect={() => run(() => onTab(value))}>
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
