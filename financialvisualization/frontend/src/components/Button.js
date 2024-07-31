// src/components/Button.js
import React from 'react';

export const Button = ({ children, variant, ...props }) => {
  const baseClasses = "px-4 py-2 rounded";
  const variants = {
    default: "bg-blue-500 text-white",
    outline: "border border-blue-500 text-blue-500",
    ghost: "bg-transparent text-blue-500",
  };

  return (
    <button className={`${baseClasses} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
};
