// src/components/Select.js
import React from 'react';

export const Select = ({ children, ...props }) => (
  <select className="border rounded px-4 py-2" {...props}>
    {children}
  </select>
);
