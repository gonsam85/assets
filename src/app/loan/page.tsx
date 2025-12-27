'use client';

import { useAssets } from '@/context/AssetContext';
import NeoCard from '@/components/ui/NeoCard';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function LoanPage() {
    const { getAssetsByType, removeAsset } = useAssets();
    const loans = getAssetsByType('loan');

    const totalDebt = loans.reduce((sum, loan) => sum + loan.amount, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
    };

    return (
        <div className="p-4 pt-8 pb-24 space-y-6">
            <h1 className="text-4xl font-black bg-neo-orange text-neo-black inline-block px-2 border-3 border-neo-black shadow-neo-sm">
                LOANS
            </h1>

            {/* Total Debt Card */}
            <NeoCard color="pink" className="border-3 border-neo-black p-3">
                <p className="font-bold text-sm mb-1 text-white opacity-90">Total Liabilities</p>
                <div className="text-2xl font-black text-white leading-none">
                    {formatCurrency(totalDebt)}
                </div>
            </NeoCard>

            {/* Loan List */}
            <div className="space-y-3">
                <h3 className="text-lg font-black pl-1">My Debts</h3>
                {loans.length > 0 ? (
                    loans.map((loan) => (
                        <motion.div key={loan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <NeoCard color="pink" className="flex justify-between items-center py-2 px-3">
                                <div>
                                    <div className="font-black text-sm text-white">{loan.name}</div>
                                    <div className="text-[10px] font-bold text-neo-black bg-white inline-block px-1 mt-0.5 border border-black">
                                        LOAN
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-white text-sm">{formatCurrency(loan.amount)}</div>
                                    <div className="flex gap-2 justify-end mt-1 text-[10px]">
                                        <a
                                            href={`/add?id=${loan.id}`}
                                            className="text-white font-bold hover:underline opacity-90"
                                        >
                                            EDIT
                                        </a>
                                        <button
                                            onClick={() => removeAsset(loan.id)}
                                            className="text-white/90 font-bold hover:text-white hover:underline opacity-90"
                                        >
                                            PAID OFF
                                        </button>
                                    </div>
                                </div>
                            </NeoCard>
                        </motion.div>
                    ))
                ) : (
                    <NeoCard className="bg-neo-green text-neo-black">
                        <div className="font-black text-xl mb-2">You are debt free! 🎉</div>
                        <p className="font-bold">Great job managing your finances.</p>
                    </NeoCard>
                )}
            </div>
        </div>
    );
}
