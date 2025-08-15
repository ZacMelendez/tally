import * as React from "react";

import { cn } from "@/lib/utils";

export const inputStyles = [
    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/20 flex h-9 w-full min-w-0 rounded-md shadow-[0_0_0_1px_rgba(255,255,255,0.1)] bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    "focus-visible:shadow-[0_0_0_1px_rgba(0,112,243,0.8),0_0_0_3px_rgba(0,112,243,0.2)]",
    "aria-invalid:shadow-[0_0_0_1px_rgba(225,29,72,0.8),0_0_0_3px_rgba(225,29,72,0.2)]",
];

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(...inputStyles, className)}
            {...props}
        />
    );
}

export { Input };
