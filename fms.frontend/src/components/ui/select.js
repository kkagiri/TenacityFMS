import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const SelectContext = createContext();

const Select = ({ children, value, onValueChange, defaultValue, ...props }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [isOpen, setIsOpen] = useState(false);
  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider value={{
      value: currentValue,
      onValueChange: handleValueChange,
      isOpen,
      setIsOpen
    }}>
      <div className="tw-relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({ children, className = '', ...props }) => {
  const { value, isOpen, setIsOpen } = useContext(SelectContext);

  return (
    <button
      type="button"
      className={`tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-between tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-ring-offset-white tw-placeholder:text-gray-500 tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:ring-offset-2 tw-disabled:cursor-not-allowed tw-disabled:opacity-50 ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
      <i className={`fa-light fa-chevron-down tw-h-4 tw-w-4 tw-transition-transform ${isOpen ? 'tw-rotate-180' : ''}`} />
    </button>
  );
};

const SelectValue = ({ placeholder = 'Select an option...', className = '', ...props }) => {
  const { value } = useContext(SelectContext);

  return (
    <span className={`tw-block tw-truncate ${!value ? 'tw-text-gray-500' : ''} ${className}`} {...props}>
      {value || placeholder}
    </span>
  );
};

const SelectContent = ({ children, className = '', ...props }) => {
  const { isOpen, setIsOpen } = useContext(SelectContext);
  const contentRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={`tw-absolute tw-top-full tw-left-0 tw-z-50 tw-w-full tw-min-w-[8rem] tw-overflow-hidden tw-rounded-md tw-border tw-border-gray-200 tw-bg-white tw-shadow-md tw-mt-1 ${className}`}
      {...props}
    >
      <div className="tw-p-1">
        {children}
      </div>
    </div>
  );
};

const SelectItem = ({ children, value, className = '', ...props }) => {
  const { onValueChange, value: selectedValue } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  return (
    <div
      className={`tw-relative tw-flex tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-rounded-sm tw-py-1.5 tw-pl-8 tw-pr-2 tw-text-sm tw-outline-none tw-transition-colors tw-focus:bg-gray-100 tw-data-[disabled]:pointer-events-none tw-data-[disabled]:opacity-50 ${
        isSelected ? 'tw-bg-gray-100' : 'hover:tw-bg-gray-50'
      } ${className}`}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {isSelected && (
        <span className="tw-absolute tw-left-2 tw-flex tw-h-3.5 tw-w-3.5 tw-items-center tw-justify-center">
          <i className="fa-light fa-check tw-h-4 tw-w-4" />
        </span>
      )}
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };