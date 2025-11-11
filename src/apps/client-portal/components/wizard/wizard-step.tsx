import React from 'react';

interface WizardStepProps {
  children: React.ReactNode;
  className?: string;
}

export function WizardStep({ children, className = '' }: WizardStepProps) {
  return (
    <div className={`w-full ${className}`}>
      {children}
    </div>
  );
}
