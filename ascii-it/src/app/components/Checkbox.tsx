'use client'

import React, { useState } from 'react';

interface CheckboxIconProps {
  checked?: boolean;
  size?: number;
  checkedColor?: string;
  uncheckedColor?: string;
  checkmarkColor?: string;
  borderRadius?: string;
  onChange?: React.MouseEventHandler<HTMLDivElement>;
}

export const Checkbox: React.FC<CheckboxIconProps> = ({ 
  checked = false, 
  size = 24, 
  checkedColor = '#292929', 
  checkmarkColor = '#ffffff',
  borderRadius = '4px',
  onChange
}) => {
  return (
    <div
      className="inline-flex items-center justify-center cursor-pointer"
      style={{
        width: size,
        height: size,
        backgroundColor: checkedColor,
        border: `2px solid white`,
        borderRadius: borderRadius,
        margin: '4px 4px 4px 0'
      }}
      onClick={onChange}
    >
      {checked && (
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 6L9 17L4 12"
            stroke={checkmarkColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};