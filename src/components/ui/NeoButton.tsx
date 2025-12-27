'use client';

import clsx from 'clsx';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface NeoButtonProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
}

export default function NeoButton({ children, onClick, className, variant = 'primary', disabled }: NeoButtonProps) {
    const variants = {
        primary: 'bg-neo-blue text-white hover:bg-blue-600',
        secondary: 'bg-neo-white text-neo-black hover:bg-gray-100',
        danger: 'bg-neo-pink text-white hover:bg-pink-600',
    };

    return (
        <motion.button
            whileTap={!disabled ? { scale: 0.95, x: 2, y: 2, boxShadow: '0px 0px 0px 0px #000' } : {}}
            whileHover={!disabled ? { y: -1, boxShadow: '6px 6px 0px 0px #000' } : {}}
            onClick={!disabled ? onClick : undefined}
            disabled={disabled}
            className={clsx(
                "border-3 border-neo-black px-4 py-2 font-bold transition-all",
                !disabled && "shadow-neo",
                variants[variant],
                disabled ? "opacity-50 cursor-not-allowed bg-gray-300 border-gray-500 shadow-none text-gray-500" : "",
                className
            )}
        >
            {children}
        </motion.button>
    );
}
