"use client";

import * as React from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { IconCalendar, IconX } from "@tabler/icons-react";

import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({ from, to, onSelect, className, placeholder = "Pick a date range" }: DateRangePickerProps) {
  const range: DateRange | undefined = from || to ? { from, to } : undefined;

  const label = from && to
    ? `${format(from, "MMM dd, yyyy")} – ${format(to, "MMM dd, yyyy")}`
    : from
    ? `${format(from, "MMM dd, yyyy")} – …`
    : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 justify-start text-left font-normal shadow-sm hover:bg-gray-50 px-3",
            !label && "text-muted-foreground",
            className
          )}
        >
          <IconCalendar className="mr-2 h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
          <span className="truncate flex-1">{label ?? <span className="text-gray-500">{placeholder}</span>}</span>
          {range && (
            <IconX
              className="ml-2 h-3.5 w-3.5 text-gray-400 hover:text-gray-700 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onSelect({ from: undefined, to: undefined });
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-lg" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => onSelect({ from: r?.from, to: r?.to })}
          initialFocus
          numberOfMonths={2}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  );
}
