import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "default", size = "default", ...props }, ref) => {

        // Manual variant styles to avoid missing dependencies
        let variantClass = "bg-gray-900 text-white hover:bg-gray-800"; // default
        if (variant === "destructive") variantClass = "bg-red-500 text-white hover:bg-red-600";
        if (variant === "outline") variantClass = "border border-gray-200 bg-white hover:bg-gray-100 text-gray-900";
        if (variant === "secondary") variantClass = "bg-gray-100 text-gray-900 hover:bg-gray-200";
        if (variant === "ghost") variantClass = "hover:bg-gray-100 hover:text-gray-900";
        if (variant === "link") variantClass = "text-gray-900 underline-offset-4 hover:underline";

        let sizeClass = "h-10 px-4 py-2"; // default
        if (size === "sm") sizeClass = "h-9 rounded-md px-3";
        if (size === "lg") sizeClass = "h-11 rounded-md px-8";
        if (size === "icon") sizeClass = "h-10 w-10";

        const combinedClassName = `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClass} ${sizeClass} ${className}`;

        const Comp = "button"
        return (
            <Comp
                className={combinedClassName}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
