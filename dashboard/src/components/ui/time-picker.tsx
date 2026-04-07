import { useState, useEffect } from 'react';
import { Button } from './button';

interface TimePickerProps {
  value?: string; // Format: "HH:MM"
  onChange: (time: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);

  // Initialize from value if provided
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const currentPeriod = hours >= 12 ? 'PM' : 'AM';
      setSelectedHour(hour12);
      setSelectedMinute(minutes);
      setPeriod(currentPeriod);
    }
  }, [value]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleHourChange = (hour: number) => {
    setSelectedHour(hour);
    updateTime(hour, selectedMinute, period);
  };

  const handleMinuteChange = (minute: number) => {
    setSelectedMinute(minute);
    updateTime(selectedHour, minute, period);
  };

  const handlePeriodToggle = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod);
    updateTime(selectedHour, selectedMinute, newPeriod);
  };

  const updateTime = (hour: number, minute: number, timePeriod: 'AM' | 'PM') => {
    let hour24 = hour;
    if (timePeriod === 'PM' && hour !== 12) {
      hour24 = hour + 12;
    } else if (timePeriod === 'AM' && hour === 12) {
      hour24 = 0;
    }
    const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(timeString);
  };

  return (
    <div className="w-[320px] p-6 space-y-6">
      {/* Time Display */}
      <div className="flex items-center justify-center gap-2">
        <div className="text-5xl font-[Poppins] font-bold text-[#033620]">
          {selectedHour.toString().padStart(2, '0')}
        </div>
        <span className="text-5xl font-[Poppins] font-bold text-gray-400">:</span>
        <div className="text-5xl font-[Poppins] font-bold text-[#033620]">
          {selectedMinute.toString().padStart(2, '0')}
        </div>
        <div className="ml-3 flex flex-col gap-1">
          <button
            onClick={() => handlePeriodToggle('AM')}
            className={`text-sm px-3 py-1 rounded transition-colors font-medium ${
              period === 'AM' ? 'bg-[#033620] text-white' : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            AM
          </button>
          <button
            onClick={() => handlePeriodToggle('PM')}
            className={`text-sm px-3 py-1 rounded transition-colors font-medium ${
              period === 'PM' ? 'bg-[#033620] text-white' : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            PM
          </button>
        </div>
      </div>

      {/* Scrollable Time Picker */}
      <div className="flex gap-3 justify-center">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-2 font-medium">Hour</div>
          <div className="h-[200px] w-[70px] overflow-y-auto scroll-smooth border border-gray-200 rounded-lg shadow-sm">
            {hours.map((hour) => (
              <button
                key={hour}
                onClick={() => handleHourChange(hour)}
                className={`w-full py-3 text-center transition-all ${
                  selectedHour === hour
                    ? 'bg-[#033620] text-white font-bold sticky top-0 bottom-0'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {hour.toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-2 font-medium">Minute</div>
          <div className="h-[200px] w-[70px] overflow-y-auto scroll-smooth border border-gray-200 rounded-lg shadow-sm">
            {minutes.map((minute) => (
              <button
                key={minute}
                onClick={() => handleMinuteChange(minute)}
                className={`w-full py-3 text-center transition-all ${
                  selectedMinute === minute
                    ? 'bg-[#033620] text-white font-bold sticky top-0 bottom-0'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {minute.toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Select */}
      <div className="border-t pt-4">
        <div className="text-xs text-gray-500 mb-2 font-medium">Quick Select</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '9:00 AM', h: 9, m: 0, p: 'AM' },
            { label: '12:00 PM', h: 12, m: 0, p: 'PM' },
            { label: '3:00 PM', h: 3, m: 0, p: 'PM' },
            { label: '6:00 PM', h: 6, m: 0, p: 'PM' },
          ].map((time) => (
            <button
              key={time.label}
              onClick={() => {
                setSelectedHour(time.h);
                setSelectedMinute(time.m);
                setPeriod(time.p as 'AM' | 'PM');
                updateTime(time.h, time.m, time.p as 'AM' | 'PM');
              }}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded hover:bg-[#033620] hover:text-white hover:border-[#033620] transition-colors"
            >
              {time.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}