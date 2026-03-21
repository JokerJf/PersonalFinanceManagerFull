"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function formatDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  // Формат ISO 8601 с timezone offset
  const timezoneOffset = -date.getTimezoneOffset();
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60).toString().padStart(2, "0");
  const offsetMinutes = Math.abs(timezoneOffset % 60).toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

function formatDisplayDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

function parseLocalDateTime(value: string): Date {
  // Parse "YYYY-MM-DDTHH:MM:SS+HH:MM" or "YYYY-MM-DDTHH:MM" format as local time
  // Remove timezone offset and parse as local time
  const withOffset = value.includes('+') || value.includes('-') && value.split('T')[1]?.includes('-');
  
  if (withOffset) {
    // For ISO 8601 with offset, we need to convert to local time
    // First, parse the date part and time part without timezone
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?([+-]\d{2}:?\d{2}|Z)?$/);
    if (match) {
      const [, year, month, day, hours, minutes, seconds] = match;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        seconds ? parseInt(seconds) : 0
      );
    }
  }
  
  // Fallback: parse as simple local format
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const timeParts = timePart.split(':');
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  const seconds = timeParts[2] ? parseInt(timeParts[2]) : 0;
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  return date;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const getInitialDate = () => {
    if (!value) return new Date();
    // Handle "YYYY-MM-DDTHH:MM" local format
    if (value.includes('T')) {
      return parseLocalDateTime(value);
    }
    return new Date(value);
  };
  
  const [currentMonth, setCurrentMonth] = React.useState<Date>(getInitialDate());
  const [selectedDate, setSelectedDate] = React.useState<Date>(getInitialDate());
  const [hours, setHours] = React.useState<number>(getInitialDate().getHours());
  const [minutes, setMinutes] = React.useState<number>(getInitialDate().getMinutes());
  const [isOpen, setIsOpen] = React.useState(false);

  const today = new Date();

  // Generate days for current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleDateClick = (day: Date | null) => {
    if (!day) return;
    setSelectedDate(day);
    updateDateTime(day, hours, minutes);
    setIsOpen(false);
  };

  const updateDateTime = (date: Date, h: number, m: number) => {
    const newDate = new Date(date);
    newDate.setHours(h);
    newDate.setMinutes(m);
    onChange(formatLocalDateTime(newDate));
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    updateDateTime(selectedDate, newHours, newMinutes);
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleNow = () => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentMonth(now);
    setHours(now.getHours());
    setMinutes(now.getMinutes());
    onChange(formatLocalDateTime(now));
    setIsOpen(false);
  };

  const formattedDateTime = value ? formatDisplayDate(new Date(value)) : "Select date & time";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal input-bg hover:bg-gray-200 dark:hover:bg-[#2a2f3c4d]/80 rounded-xl sm:rounded-2xl py-2.5 sm:py-3 px-3 sm:px-4 h-auto shadow-sm text-xs sm:text-sm",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarDays className="mr-1.5 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4" />
          <span className="flex-1 truncate">{formattedDateTime}</span>
          <Clock className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] sm:w-auto p-0 bg-card border-border rounded-xl sm:rounded-2xl max-w-[calc(100vw-1rem)]" align="start">
        <div className="flex flex-col sm:flex-row max-w-[300px] sm:max-w-none">
          {/* Calendar */}
          <div className="border-b sm:border-b-0 sm:border-r border-border p-2 sm:p-3">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <button onClick={goToPrevMonth} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                <svg width="14" sm:width="16" height="14" sm:height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span className="text-xs sm:text-sm font-semibold">
                {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
              <button onClick={goToNextMonth} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                <svg width="14" sm:width="16" height="14" sm:height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-0.5">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-[9px] sm:text-[10px] font-medium text-muted-foreground py-0.5">
                  {day}
                </div>
              ))}
              
              {days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  disabled={!day}
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm rounded-lg transition-colors",
                    !day && "invisible",
                    day && isSameDay(day, today) && "bg-primary/10 text-primary font-medium",
                    day && isSameDay(day, selectedDate) && "bg-primary text-primary-foreground",
                    day && !isSameDay(day, selectedDate) && !isSameDay(day, today) && "hover:bg-secondary"
                  )}
                >
                  {day?.getDate()}
                </button>
              ))}
            </div>
          </div>
          
          {/* Time Picker */}
          <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 min-w-[140px] sm:min-w-[160px]">
            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">Time</div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex-1">
                <label className="text-[9px] sm:text-[10px] text-muted-foreground mb-0.5 sm:mb-1 block">Hour</label>
                <select
                  value={hours}
                  onChange={(e) => handleTimeChange(parseInt(e.target.value), minutes)}
                  className="w-full bg-background rounded-lg py-1.5 sm:py-2 px-1.5 sm:px-2 text-xs sm:text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
              
              <span className="text-base sm:text-lg font-bold mt-4 sm:mt-5">:</span>
              
              <div className="flex-1">
                <label className="text-[9px] sm:text-[10px] text-muted-foreground mb-0.5 sm:mb-1 block">Min</label>
                <select
                  value={minutes}
                  onChange={(e) => handleTimeChange(hours, parseInt(e.target.value))}
                  className="w-full bg-background rounded-lg py-1.5 sm:py-2 px-1.5 sm:px-2 text-xs sm:text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <Button
              onClick={handleNow}
              variant="outline"
              size="sm"
              className="w-full text-[10px] sm:text-xs h-8 sm:h-9"
            >
              Now
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
