"use client";

import * as React from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        // Months container — relative so nav can be absolute inside it
        months: "relative flex flex-col sm:flex-row gap-6",
        month: "flex flex-col gap-4",
        // Each month's caption row — centered label, no extra space for arrows
        month_caption: "flex justify-center items-center h-7",
        caption_label: "text-sm font-medium select-none",
        // Nav spans the full width of the months container, arrows at each end
        nav: "absolute top-0 inset-x-0 flex items-center justify-between h-7 px-0",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 p-0 opacity-70 hover:opacity-100 bg-white border border-gray-200 shadow-sm"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 p-0 opacity-70 hover:opacity-100 bg-white border border-gray-200 shadow-sm"
        ),
        // Grid
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground w-8 font-normal text-[0.8rem] text-center",
        weeks: "w-full",
        week: "flex w-full mt-2",
        // Day cell — handles range highlight background
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-[#033620]/10",
          "[&:has([aria-selected].range_start)]:rounded-l-md [&:has([aria-selected].range_start)]:bg-[#033620]",
          "[&:has([aria-selected].range_end)]:rounded-r-md [&:has([aria-selected].range_end)]:bg-[#033620]",
          "[&:has([aria-selected].range_middle)]:rounded-none",
          "first:[&:has([aria-selected])]:rounded-l-md",
          "last:[&:has([aria-selected])]:rounded-r-md"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal hover:bg-transparent focus-visible:ring-0"
        ),
        // Selection states applied to the day_button element
        selected:
          "bg-[#033620] text-white hover:bg-[#033620] hover:text-white focus:bg-[#033620] focus:text-white rounded-md",
        today: "bg-gray-100 text-gray-900 font-medium rounded-md",
        outside: "text-muted-foreground opacity-40",
        disabled: "text-muted-foreground opacity-30",
        range_start:
          "range_start !bg-[#033620] text-white rounded-l-md rounded-r-none",
        range_end:
          "range_end !bg-[#033620] text-white rounded-r-md rounded-l-none",
        range_middle:
          "range_middle !bg-transparent text-[#033620] rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <IconChevronLeft className="size-4" />
          ) : (
            <IconChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
