import React, { useState, useEffect } from 'react';

export default function DebouncedInput({ value: initialValue, onChange, debounce = 300, ...props }) {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);
    return () => clearTimeout(timeout);
  }, [value, debounce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input 
      {...props} 
      value={value} 
      onChange={e => setValue(e.target.value)} 
    />
  );
}
