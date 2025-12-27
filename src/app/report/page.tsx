'use client';

import { useAssets } from '@/context/AssetContext';
import NeoCard from '@/components/ui/NeoCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useMemo } from 'react';

export default function ReportPage() {
    const { netWorth, assets } = useAssets();

    // Helper: Format Currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);
    };

    // 1. Calculate Current Composition
    const currentComposition = useMemo(() => {
        const comp = { stock: 0, real_estate: 0, crypto: 0, cash: 0, loan: 0 };
        assets.forEach(a => {
            const val = a.amount;
            if (comp[a.type as keyof typeof comp] !== undefined) {
                comp[a.type as keyof typeof comp] += val;
            } else {
                comp.cash += val;
            }
        });
        return comp;
    }, [assets]);

    // 2. Simulate History Data (6 Months)
    const historyData = useMemo(() => {
        const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentTotal = Object.values(currentComposition).reduce((a, b) => a + b, 0) - currentComposition.loan;

        return months.map((month, i) => {
            const progress = (i + 1) / 6;
            const trendFactor = 0.85 + (progress * 0.15);
            const random = 1 + (Math.random() * 0.05 - 0.025);

            const simulatedTotal = currentTotal * trendFactor * random;
            const simulatedLoan = currentComposition.loan * (1 - (progress * 0.05));

            const baseRatio = simulatedTotal / currentTotal;

            return {
                name: month,
                NetWorth: Math.floor(simulatedTotal),
                TotalAssets: Math.floor(simulatedTotal + simulatedLoan),
                // Composition for Stacked Bar
                stock: Math.floor(currentComposition.stock * baseRatio * (1 + Math.random() * 0.1)),
                real_estate: Math.floor(currentComposition.real_estate * trendFactor),
                crypto: Math.floor(currentComposition.crypto * baseRatio * (1 + (Math.random() * 0.3 - 0.15))),
                cash: Math.floor(currentComposition.cash * baseRatio * 0.95),
            };
        });
    }, [currentComposition]);

    // 3. AI Insight Generation
    const insight = useMemo(() => {
        const start = historyData[0];
        const end = historyData[historyData.length - 1];
        const growth = start.NetWorth > 0 ? ((end.NetWorth - start.NetWorth) / start.NetWorth) * 100 : 0;

        const topAsset = Object.entries(currentComposition)
            .filter(([k]) => k !== 'loan')
            .sort(([, a], [, b]) => b - a)[0];

        const getKoreanAssetName = (key: string) => {
            const map: Record<string, string> = {
                'stock': '주식',
                'real_estate': '부동산',
                'crypto': '크립토',
                'cash': '현금',
                'loan': '대출'
            };
            return map[key] || key.toUpperCase();
        };

        const topAssetName = topAsset ? getKoreanAssetName(topAsset[0]) : '자산';

        return {
            growth: growth.toFixed(1),
            topAssetName: topAssetName,
            msg: `지난 6개월간 순자산이 ${growth.toFixed(1)}% 성장했습니다! 현재 포트폴리오는 주로 ${topAssetName}에 집중되어 있습니다.`
        };
    }, [historyData, currentComposition]);

    return (
        <div className="p-4 pt-8 pb-24 space-y-8">
            <h1 className="text-4xl font-black bg-neo-green text-neo-black inline-block px-2 border-3 border-neo-black shadow-neo-sm transform -rotate-1">
                REPORT
            </h1>

            {/* 1. Trend Chart (Double Bar) */}
            <NeoCard color="green" className="border-3 border-neo-black relative overflow-hidden">
                <h2 className="font-black text-xl mb-4 flex items-center gap-2">
                    📈 6-Month Trend <span className="text-xs font-normal text-neo-black">(Gross vs Net)</span>
                </h2>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000" strokeOpacity={0.1} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: '900', fill: '#000' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                            <Tooltip
                                contentStyle={{ border: '3px solid black', borderRadius: '8px', boxShadow: '4px 4px 0 black' }}
                                formatter={(value: any) => formatCurrency(value)}
                            />
                            <Legend
                                wrapperStyle={{
                                    paddingTop: '20px',
                                    fontWeight: '900',
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    color: '#000'
                                }}
                            />
                            <Bar dataKey="TotalAssets" name="Total Assets" fill="#335CFF" radius={[4, 4, 0, 0]} barSize={12} stroke="#000" strokeWidth={1} />
                            <Bar dataKey="NetWorth" name="Net Worth" fill="#FFDE00" radius={[4, 4, 0, 0]} stroke="#000" strokeWidth={1} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </NeoCard>

            {/* 2. Composition Trend (Stacked Bar) */}
            <NeoCard color="yellow" className="border-3 border-neo-black relative">
                <h2 className="font-black text-xl mb-4">🧱 Asset Composition</h2>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000" strokeOpacity={0.1} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: '900', fill: '#000' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                            <Tooltip
                                contentStyle={{ border: '3px solid black', borderRadius: '8px', boxShadow: '4px 4px 0 black' }}
                                formatter={(value: any) => formatCurrency(value)}
                            />
                            <Legend
                                wrapperStyle={{
                                    paddingTop: '20px',
                                    fontWeight: '900',
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    color: '#000'
                                }}
                            />
                            <Bar dataKey="real_estate" name="Realty" stackId="a" fill="#FF5ACD" stroke="#000" strokeWidth={1} />
                            <Bar dataKey="stock" name="Stock" stackId="a" fill="#335CFF" stroke="#000" strokeWidth={1} />
                            <Bar dataKey="crypto" name="Crypto" stackId="a" fill="#00E054" stroke="#000" strokeWidth={1} />
                            <Bar dataKey="cash" name="Cash" stackId="a" fill="#FF9100" stroke="#000" strokeWidth={1} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </NeoCard>

            {/* 3. AI Insight */}
            <NeoCard color="blue" className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                <h3 className="font-black text-xl mb-2 text-white flex items-center gap-2">
                    🤖 AI INSIGHT
                </h3>
                <div className="bg-white/10 p-4 rounded-lg border-2 border-white/20 text-white">
                    <p className="font-bold text-lg leading-relaxed">
                        "{insight.msg}"
                    </p>
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                        <span className="bg-black/30 px-3 py-1 rounded-full text-xs font-bold border border-white/30 whitespace-nowrap">
                            🚀 Trend: +{insight.growth}%
                        </span>
                        <span className="bg-black/30 px-3 py-1 rounded-full text-xs font-bold border border-white/30 whitespace-nowrap">
                            🏆 Top: {insight.topAssetName}
                        </span>
                    </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            </NeoCard>
        </div>
    );
}
