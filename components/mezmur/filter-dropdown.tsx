"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export interface FilterGroupDef {
  key: string;
  label: string;
  values: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  labelFor?: (value: string) => string;
}

// A single "Filters" dropdown holding several nested checkbox groups (one
// per filter criterion — Theme, Language, Speed, Length) instead of a
// separate dropdown button per criterion.
export function FilterDropdown({ groups }: { groups: FilterGroupDef[] }) {
  const totalSelected = groups.reduce((sum, g) => sum + g.selected.length, 0);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="size-4" />
            Filters
            {totalSelected > 0 && (
              <span className="font-semibold text-primary">({totalSelected})</span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="max-h-96 w-64 overflow-y-auto">
        {groups.map((group, i) => (
          <div key={group.key}>
            {i > 0 && <Separator className="my-2" />}
            <p className="px-1 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.values.map((value) => {
                const id = `${group.key}-${value}`;
                const checked = group.selected.includes(value);
                return (
                  <Label
                    key={value}
                    htmlFor={id}
                    className="group cursor-pointer rounded-md px-1 py-1.5 font-normal hover:bg-muted"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() => group.onToggle(value)}
                    />
                    {group.labelFor ? group.labelFor(value) : value}
                  </Label>
                );
              })}
              {group.values.length === 0 && (
                <p className="px-1 py-1 text-xs text-muted-foreground">Loading...</p>
              )}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
