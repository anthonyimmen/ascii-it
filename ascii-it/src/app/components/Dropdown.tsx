import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: (string | DropdownOption)[];
  placeholder?: string;
  onSelect?: (option: string | DropdownOption) => void;
  value?: string | null;
  disabled?: boolean;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ 
  options = [], 
  placeholder = "Select an option...", 
  onSelect = () => {},
  value = null,
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex]);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
    }
  };

  const handleSelect = (option: string | DropdownOption): void => {
    onSelect(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
    buttonRef.current?.focus();
  };

  const getDisplayText = (): string => {
    if (value) {
      const selectedOption = options.find(opt => 
        typeof opt === 'object' ? opt.value === value : opt === value
      );
      return typeof selectedOption === 'object' ? selectedOption.label : selectedOption || '';
    }
    return placeholder;
  };

  return (
    <div 
      ref={dropdownRef}
      className={`relative flex-1 w-1 ${className}`}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full px-4 py-2 text-left border border-white gap-2 rounded-md
          flex items-center justify-between
          ${disabled 
            ? 'bg-gray-100 text-white cursor-not-allowed' 
            : 'cursor-pointer'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="dropdown-label"
      >
        <span className={`block truncate text-white`}>
          {getDisplayText()}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-white transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-30 overflow-auto">
          <ul
            role="listbox"
            className="py-1"
          >
            {options.map((option, index) => {
              const optionValue = typeof option === 'object' ? option.value : option;
              const optionLabel = typeof option === 'object' ? option.label : option;
              const isSelected = value === optionValue;

              return (
                <li
                  key={optionValue}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={isSelected}
                  className={`
                    px-4 py-1 cursor-pointer text-black hover:bg-gray-200
                  `}
                >
                  {optionLabel}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;