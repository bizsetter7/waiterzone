import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {

    let variantClass = "border-transparent bg-gray-900 text-white hover:bg-gray-800";
    if (variant === "secondary") variantClass = "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200";
    if (variant === "destructive") variantClass = "border-transparent bg-red-500 text-white hover:bg-red-600";
    if (variant === "outline") variantClass = "text-gray-900 border-gray-200 border";

    const combinedClassName = `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClass} ${className}`;

    return (
        <div className={combinedClassName} {...props} />
    )
}

export { Badge }
