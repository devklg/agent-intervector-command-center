import React from 'react';

export const Alert = React.forwardRef(({ className = '', variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-background text-foreground border-gray-200',
    destructive: 'border-red-500/50 text-red-600 bg-red-50 [&>svg]:text-red-600',
    warning: 'border-yellow-500/50 text-yellow-600 bg-yellow-50 [&>svg]:text-yellow-600',
    success: 'border-green-500/50 text-green-600 bg-green-50 [&>svg]:text-green-600',
    info: 'border-blue-500/50 text-blue-600 bg-blue-50 [&>svg]:text-blue-600',
  };

  return (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${variants[variant] || variants.default} ${className}`}
      {...props}
    />
  );
});
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef(({ className = '', ...props }, ref) => (
  <h5
    ref={ref}
    className={`mb-1 font-medium leading-none tracking-tight ${className}`}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm [&_p]:leading-relaxed ${className}`}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';
