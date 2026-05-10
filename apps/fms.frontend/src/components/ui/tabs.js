import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

const Tabs = ({ children, defaultValue, value, onValueChange, className = '', ...props }) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={`tw-w-full ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-md tw-bg-gray-100 tw-p-1 tw-text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ children, value, className = '', ...props }) => {
  const { value: selectedValue, onValueChange } = useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      className={`tw-inline-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-sm tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-ring-offset-white tw-transition-all tw-focus-visible:outline-none tw-focus-visible:ring-2 tw-focus-visible:ring-blue-500 tw-focus-visible:ring-offset-2 tw-disabled:pointer-events-none tw-disabled:opacity-50 ${
        isSelected
          ? 'tw-bg-white tw-text-gray-950 tw-shadow-sm'
          : 'tw-text-gray-600 hover:tw-text-gray-900'
      } ${className}`}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, className = '', ...props }) => {
  const { value: selectedValue } = useContext(TabsContext);

  if (selectedValue !== value) {
    return null;
  }

  return (
    <div
      className={`tw-mt-2 tw-ring-offset-white tw-focus-visible:outline-none tw-focus-visible:ring-2 tw-focus-visible:ring-blue-500 tw-focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };