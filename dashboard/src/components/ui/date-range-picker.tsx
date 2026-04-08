"use client";

import * as React from "react";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import { IconCalendar, IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "./utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void;
  className?: string;
  placeholder?: string;
}

const TITLE_H = "h-7";

const cls = {
  months: "flex flex-col",
  month: "flex flex-col",
  month_caption: "hidden",
  nav: "hidden",
  month_grid: "w-full border-collapse",
  weekdays: "flex",
  weekday: "rdp-weekday w-9 h-8 flex items-center justify-center text-xs font-medium text-gray-400",
  weeks: "flex flex-col",
  week: "flex",
  day: "rdp-day relative w-9 h-9 p-0 text-center",
  day_button: "rdp-day-btn w-9 h-9 flex items-center justify-center text-sm font-normal focus:outline-none relative z-10",
  today: "rdp-today",
  outside: "rdp-outside",
  disabled: "rdp-disabled",
  hidden: "invisible",
  selected: "rdp-selected",
  range_start: "rdp-range-start",
  range_end: "rdp-range-end",
  range_middle: "rdp-range-middle",
};

export function DateRangePicker({
  from,
  to,
  onSelect,
  className,
  placeholder = "Pick a date range",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [leftMonth, setLeftMonth] = React.useState<Date>(
    from ? startOfMonth(from) : startOfMonth(new Date())
  );
  const rightMonth = addMonths(leftMonth, 1);
  const range: DateRange | undefined = from || to ? { from, to } : undefined;

  const label =
    from && to
      ? `${format(from, "MMM dd, yyyy")} – ${format(to, "MMM dd, yyyy")}`
      : from
      ? `${format(from, "MMM dd, yyyy")} – …`
      : undefined;

  const pickerProps = {
    mode: "range" as const,
    selected: range,
    onSelect: (r: DateRange | undefined) => onSelect({ from: r?.from, to: r?.to }),
    classNames: cls,
  };

  return (
    <>
      <style>{`
        /* Day button base */
        .rdp-day-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.15s;
          color: #111;
        }
        .rdp-day-btn:hover { background: #f3f4f6; }

        /* Today */
        .rdp-today .rdp-day-btn { font-weight: 700; color: #033620; }

        /* Outside / disabled */
        .rdp-outside .rdp-day-btn { color: #d1d5db; }
        .rdp-disabled .rdp-day-btn { color: #d1d5db; cursor: not-allowed; }

        /* ── Single selected (no range) ── */
        .rdp-selected .rdp-day-btn {
          background: #033620 !important;
          color: #fff !important;
          border-radius: 50%;
        }

        /* ── Range middle: full-width green band, no circle ── */
        .rdp-range-middle {
          background-color: #3a604a;
        }
        .rdp-range-middle .rdp-day-btn {
          background: transparent !important;
          color: #033620;
          border-radius: 0;
        }
        .rdp-range-middle .rdp-day-btn:hover {
          background: rgba(3, 54, 32, 0.15) !important;
        }

        /* ── Range start: circle + right-side band ── */
        .rdp-range-start {
          background: linear-gradient(to right, transparent 50%, #3a604a 50%);
        }
        .rdp-range-start .rdp-day-btn {
          background: #033620 !important;
          color: #fff !important;
          border-radius: 50%;
        }

        /* ── Range end: circle + left-side band ── */
        .rdp-range-end {
          background: linear-gradient(to left, transparent 50%, #3a604a 50%);
        }
        .rdp-range-end .rdp-day-btn {
          background: #033620 !important;
          color: #fff !important;
          border-radius: 50%;
        }

        /* ── When start === end (single day range) ── */
        .rdp-range-start.rdp-range-end {
          background: transparent;
        }
      `}</style>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-10 justify-start text-left font-normal shadow-sm hover:bg-gray-50 px-3",
              className
            )}
          >
            <IconCalendar className="mr-2 h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
            <span className="truncate flex-1">
              {label ?? <span className="text-gray-400">{placeholder}</span>}
            </span>
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

        <PopoverContent
          className="w-auto p-0 shadow-xl border border-gray-200 rounded-2xl overflow-hidden bg-white"
          align="end"
        >
          <div className="flex items-start px-3 pt-4 pb-2 gap-2">
            {/* ← */}
            <div className={cn("flex items-center shrink-0", TITLE_H)}>
              <button
                type="button"
                onClick={() => setLeftMonth((m) => subMonths(m, 1))}
                className="size-7 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <IconChevronLeft className="size-4" />
              </button>
            </div>

            <div className="flex gap-4">
              {/* Left month */}
              <div className="flex flex-col">
                <div className={cn("flex items-center justify-center", TITLE_H)}>
                  <span className="text-sm font-semibold text-gray-900">
                    {format(leftMonth, "MMMM yyyy")}
                  </span>
                </div>
                <DayPicker {...pickerProps} month={leftMonth} onMonthChange={setLeftMonth} />
              </div>

              <div className="w-px bg-gray-100 self-stretch my-1" />

              {/* Right month */}
              <div className="flex flex-col">
                <div className={cn("flex items-center justify-center", TITLE_H)}>
                  <span className="text-sm font-semibold text-gray-900">
                    {format(rightMonth, "MMMM yyyy")}
                  </span>
                </div>
                <DayPicker
                  {...pickerProps}
                  month={rightMonth}
                  onMonthChange={(m) => setLeftMonth(subMonths(m, 1))}
                />
              </div>
            </div>

            {/* → */}
            <div className={cn("flex items-center shrink-0", TITLE_H)}>
              <button
                type="button"
                onClick={() => setLeftMonth((m) => addMonths(m, 1))}
                className="size-7 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <IconChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => onSelect({ from: undefined, to: undefined })}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="bg-[#033620] hover:bg-[#022819] text-white"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
