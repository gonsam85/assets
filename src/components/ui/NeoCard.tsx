import clsx from 'clsx';
import { ReactNode } from 'react';

interface NeoCardProps {
    children: ReactNode;
    className?: string;
    color?: 'white' | 'yellow' | 'pink' | 'blue' | 'orange' | 'green' | 'red';
    onClick?: () => void;
}

export default function NeoCard({ children, className, color = 'white', onClick }: NeoCardProps) {
    const bgColors = {
        white: 'bg-neo-white',
        yellow: 'bg-neo-yellow',
        pink: 'bg-neo-pink',
        blue: 'bg-neo-blue',
        orange: 'bg-neo-orange',
        green: 'bg-neo-green',
        red: 'bg-neo-red',
    };

    return (
        <div
            onClick={onClick}
            className={clsx(
                "border-3 border-neo-black shadow-neo rounded-lg p-4",
                bgColors[color],
                className
            )}
        >
            {children}
        </div>
    );
}
