import { cn } from "@/lib/utils";
export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={cn("btn disabled:opacity-50", className)} {...props} />; }
