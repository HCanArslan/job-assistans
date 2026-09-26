"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  width = "w-72",
  searchable = true,
  renderOption,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  width?: string;
  searchable?: boolean;
  renderOption?: (value: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs font-normal">
          <span className="text-muted-foreground">{label}</span>
          {selected.length > 0 ? (
            <Badge variant="secondary" className="rounded px-1 py-0 text-[10px]">
              {selected.length}
            </Badge>
          ) : null}
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={width + " p-0"}>
        {searchable ? (
          <div className="border-b border-border p-1.5">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Filter ${label.toLowerCase()}…`}
              className="h-6 w-full bg-transparent px-1 text-xs outline-none placeholder:text-muted-foreground/70"
            />
          </div>
        ) : null}
        <div className="max-h-64 overflow-y-auto p-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No options</p>
          ) : null}
          {filtered.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
            >
              <Checkbox checked={selected.includes(option)} onCheckedChange={() => toggle(option)} />
              <span className="min-w-0 flex-1 truncate" title={option}>
                {renderOption ? renderOption(option) : option.replace(/^Hiring\s+/i, "")}
              </span>
              {selected.includes(option) ? <Check className="size-3.5 text-muted-foreground" /> : null}
            </label>
          ))}
        </div>
        {selected.length > 0 ? (
          <div className="border-t border-border p-1.5">
            <Button variant="ghost" size="xs" className="w-full justify-center" onClick={() => onChange([])}>
              <X className="size-3" />
              Clear {label.toLowerCase()}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
