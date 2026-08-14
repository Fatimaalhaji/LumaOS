import { cn } from "@/lib/utils";
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={cn("w-full", props.className)} />; }
