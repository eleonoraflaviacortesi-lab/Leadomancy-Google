import React from "react";
import { cn } from "@/src/lib/utils";

interface MultiCheckboxFieldProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

export const MultiCheckboxField: React.FC<MultiCheckboxFieldProps> = ({ label, options, value, onChange }) => {
  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase tracking-wider">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={cn(
                "px-3 py-1.5 rounded-full font-outfit text-[12px] transition-all",
                isSelected 
                  ? "bg-[#1A1A18] text-white shadow-sm" 
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};
