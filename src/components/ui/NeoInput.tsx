import clsx from 'clsx';
import { InputHTMLAttributes } from 'react';

interface NeoInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export default function NeoInput({ label, className, ...props }: NeoInputProps) {
    return (
        <div className="flex flex-col gap-1 w-full">
            {label && <label className="font-bold text-neo-black text-sm ml-1">{label}</label>}
            <input
                className={clsx(
                    "w-full border-3 border-neo-black p-3 font-bold outline-none transition-all",
                    "focus:shadow-neo focus:-translate-y-1 focus:bg-neo-white",
                    "placeholder:text-gray-400",
                    className
                )}
                {...props}
            />
        </div>
    );
}
