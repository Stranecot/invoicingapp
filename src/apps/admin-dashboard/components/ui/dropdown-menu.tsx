'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, children, align = 'left' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="py-1" onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// Trigger component (optional - for compatibility)
interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  return <>{children}</>;
}

// Content component (optional - for compatibility)
interface DropdownMenuContentProps {
  children: React.ReactNode;
}

export function DropdownMenuContent({ children }: DropdownMenuContentProps) {
  return <>{children}</>;
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  destructive?: boolean;
}

export function DropdownMenuItem({
  children,
  destructive,
  className,
  ...props
}: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        'w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2',
        destructive && 'text-red-600 hover:bg-red-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Separator component
export function DropdownMenuSeparator() {
  return <div className="h-px bg-gray-200 my-1" />;
}
