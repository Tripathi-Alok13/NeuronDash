import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  disabled,
  ...props
}) => {
  // Base classes for transition, focus-visible ring, and animations
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus:outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-[0.98] hover:scale-[1.01]";

  // Variant classes using design tokens
  const variantClasses = {
    primary: "kinetic-gradient text-white shadow-md shadow-primary/10 hover:shadow-primary/20 focus-visible:ring-primary/80 border border-transparent",
    secondary: "bg-surface-container-high border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest focus-visible:ring-outline-variant/80",
    ghost: "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low focus-visible:ring-outline-variant/50 border border-transparent",
    destructive: "bg-error text-white hover:bg-error/95 focus-visible:ring-error/80 border border-transparent"
  };

  // Size classes (ensuring minimum 44px height for mobile accessibility on md and lg sizes)
  const sizeClasses = {
    sm: "text-xs py-2 px-4 min-h-[38px]",
    md: "text-sm py-2.5 px-5 min-h-[44px]",
    lg: "text-base py-3.5 px-8 min-h-[52px]"
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return (
        <a href={href} className={classes} {...(props as any)}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...(props as any)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
