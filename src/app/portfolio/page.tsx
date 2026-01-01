'use client';

import { useAssets } from '@/context/AssetContext';
import NeoCard from '@/components/ui/NeoCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const ASSET_COLORS: Record<string, string> = {
    'stock': '#335CFF',      // Neo Blue
    'crypto': '#00E054',     // Neo Green
    'real_estate': '#FFDE00', // Neo Yellow
    'cash': '#FF9100',       // Neo Orange
    'loan': '#FF1F1F',       // Neo Red
};

export default function PortfolioPage() {
    const { assets, removeAsset } = useAssets();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

    // Real-time Data State
    const [prices, setPrices] = useState<Record<string, { price: number, prevClose: number }>>({});
    const [exchangeRate, setExchangeRate] = useState<number>(1400);

    const filteredAssets = assets.filter(a => a.type !== 'loan');

    // Fetch Exchange Rate and Asset Prices
    useEffect(() => {
        // Exchange Rate
        fetch('/api/price?ticker=KRW=X')
            .then(res => res.json())
            .then(data => {
                if (data.price) setExchangeRate(data.price);
            })
            .catch(e => console.error('Failed to fetch exchange rate', e));

        // Asset Prices (Batch)
        const tickersToFetch = filteredAssets
            .filter(a => a.ticker)
            .map(a => a.ticker)
            .filter((t): t is string => !!t)
            .filter((t, i, arr) => arr.indexOf(t) === i); // Unique

        if (tickersToFetch.length > 0) {
            const query = tickersToFetch.join(',');
            fetch(`/api/price?tickers=${query}`)
                .then(res => res.json())
                .then(data => {
                    const newPrices: Record<string, { price: number, prevClose: number }> = {};

                    if (Array.isArray(data)) {
                        data.forEach((item: any) => {
                            // Map ticker price to all relevant assets
                            filteredAssets.forEach(asset => {
                                if (asset.ticker?.toUpperCase().trim() === item.ticker?.toUpperCase().trim()) {
                                    newPrices[asset.id] = {
                                        price: item.price,
                                        prevClose: item.prevClose || item.price
                                    };
                                }
                            });
                        });
                        setPrices(prev => ({ ...prev, ...newPrices }));
                    }
                })
                .catch(e => console.error("Batch fetch failed", e));
        }
    }, [assets]);

    const getRealTimeValue = (asset: any) => {
        // Only use real-time price if valid (> 0)
        // Check if price object exists and price > 0
        const priceData = prices[asset.id];
        if (asset.ticker && priceData && priceData.price > 0 && asset.quantity) {
            let val = priceData.price * asset.quantity;
            if (asset.currency === 'USD') val *= exchangeRate;
            return val;
        }
        return asset.amount;
    };

    const data = filteredAssets.reduce((acc: any[], asset) => {
        const val = getRealTimeValue(asset);
        const existing = acc.find(item => item.name === asset.type);
        if (existing) {
            existing.value += val;
        } else {
            acc.push({ name: asset.type, value: val });
        }
        return acc;
    }, []);

    const totalValue = filteredAssets.reduce((sum, asset) => sum + getRealTimeValue(asset), 0);

    const formatCurrency = (amount: number, currency = 'KRW') => {
        if (currency === 'USD') {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
        }
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
    };

    const toggleExpand = (id: string) => {
        setExpandedAssetId(expandedAssetId === id ? null : id);
    };

    const calculateROI = (asset: any) => {
        let currentPrice = 0;
        let buyPrice = asset.purchasePrice || 0;

        if (asset.type === 'real_estate') {
            currentPrice = asset.currentPrice || 0;
        } else {
            // For Stock/Crypto, need valid API price and quantity
            const priceData = prices[asset.id];
            if (!asset.purchasePrice || !asset.quantity || !priceData || priceData.price <= 0) return null;
            currentPrice = priceData.price;
        }

        if (buyPrice === 0) return null;

        const roi = ((currentPrice - buyPrice) / buyPrice) * 100;
        return roi;
    };

    const calculateDailyChange = (asset: any) => {
        const priceData = prices[asset.id];
        if (!priceData || !priceData.prevClose) return null;

        const change = ((priceData.price - priceData.prevClose) / priceData.prevClose) * 100;
        return change;
    };

    return (
        <div className="p-4 pt-8 pb-24 space-y-6">
            <h1 className="text-4xl font-black bg-neo-blue text-white inline-block px-2 border-3 border-neo-black shadow-neo-sm">
                PORTFOLIO
            </h1>

            {/* Chart Section */}
            <NeoCard color="pink" className="relative pb-4 border-3 border-neo-black">
                <h2 className="font-bold text-base mb-2 text-center text-white">Asset Allocation</h2>

                {/* Chart */}
                <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                stroke="#000"
                                strokeWidth={2}
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.name] || '#000'} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    border: '3px solid #000',
                                    boxShadow: '4px 4px 0px 0px #000',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    color: '#000'
                                }}
                                formatter={(value: any) => formatCurrency(value)}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-40">
                        <div className="text-[10px] font-bold text-white/90 mb-0.5">TOTAL ASSETS</div>
                        <div className="text-lg font-black text-white leading-tight break-keep">
                            {formatCurrency(totalValue)}
                        </div>
                    </div>
                </div>
            </NeoCard>

            {/* Asset List */}
            <div className="space-y-3">
                {filteredAssets.map((asset) => {
                    const isExpanded = expandedAssetId === asset.id;
                    const roi = calculateROI(asset);
                    const realTimeVal = getRealTimeValue(asset);

                    const cardColor = asset.type === 'stock' ? 'blue' :
                        asset.type === 'crypto' ? 'green' :
                            asset.type === 'real_estate' ? 'yellow' :
                                asset.type === 'loan' ? 'pink' : 'orange';
                    const isDarkBg = ['stock', 'loan', 'pink', 'blue'].includes(cardColor);

                    return (
                        <motion.div key={asset.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <NeoCard
                                color={cardColor}
                                className="transition-all cursor-pointer py-2 px-3"
                                onClick={() => toggleExpand(asset.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className={clsx("font-bold text-sm flex items-center gap-2", isDarkBg ? "text-white" : "text-neo-black")}>
                                            {asset.name}
                                            {roi !== null && (
                                                <span className={clsx(
                                                    "text-[10px] px-1 py-0 border border-black rounded-sm",
                                                    roi >= 0 ? "bg-neo-green text-black" : "bg-red-500 text-white"
                                                )}>
                                                    {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                        <div className={clsx("text-[9px] font-bold uppercase inline-block px-1 rounded-sm border border-black mt-1", isDarkBg ? "text-neo-black bg-white" : "text-gray-500 bg-gray-200")}>
                                            {asset.type}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={clsx("font-bold text-sm", isDarkBg ? "text-white" : "text-neo-black")}>{formatCurrency(realTimeVal)}</div>
                                        {/* Daily Change Badge */}
                                        {(asset.type === 'stock' || asset.type === 'crypto') && (
                                            (() => {
                                                const dailyChange = calculateDailyChange(asset);
                                                if (dailyChange !== null) {
                                                    return (
                                                        <div className={clsx(
                                                            "text-[10px] font-bold mt-0.5",
                                                            dailyChange >= 0 ? (isDarkBg ? "text-neo-green" : "text-green-600") : "text-red-500"
                                                        )}>
                                                            {dailyChange > 0 ? '▲' : '▼'} {Math.abs(dailyChange).toFixed(2)}%
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()
                                        )}
                                        {isExpanded ? <ChevronUp size={16} className={clsx("ml-auto mt-0.5", isDarkBg ? "text-white/80" : "text-gray-400")} /> : <ChevronDown size={16} className={clsx("ml-auto mt-0.5", isDarkBg ? "text-white/80" : "text-gray-400")} />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className={clsx("mt-2 pt-2 border-t border-black/10 space-y-1 text-xs", isDarkBg ? "text-white/90" : "text-gray-700")}>

                                                {/* Real Estate Specifics */}
                                                {asset.type === 'real_estate' && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span>Purchase Price</span>
                                                            <span className="font-bold">{formatCurrency(asset.purchasePrice || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Current Price</span>
                                                            <span className="font-bold">{formatCurrency(asset.amount)}</span>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Stock / Crypto Specifics */}
                                                {(asset.type === 'stock' || asset.type === 'crypto') && asset.quantity && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span>Quantity</span>
                                                            <span className="font-bold">{asset.quantity}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Avg Price</span>
                                                            <span className="font-bold">{formatCurrency(asset.purchasePrice || 0, asset.currency)}</span>
                                                        </div>
                                                        {prices[asset.id] && prices[asset.id].price > 0 && (
                                                            <div className="flex justify-between">
                                                                <span>Current Price</span>
                                                                <span className="font-bold">{formatCurrency(prices[asset.id].price, asset.currency)}</span>
                                                            </div>
                                                        )}
                                                        <div className="pt-1 mt-1 border-t border-black/10"></div>
                                                        <div className="flex justify-between">
                                                            <span>Total Cost</span>
                                                            <span className="font-bold">{formatCurrency((asset.purchasePrice || 0) * asset.quantity, asset.currency)}</span>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Default for Others (Cash, Loan, etc) */}
                                                {!['real_estate', 'stock', 'crypto'].includes(asset.type) && (
                                                    <div className="flex justify-between">
                                                        <span>Amount</span>
                                                        <span className="font-bold">{formatCurrency(asset.amount)}</span>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex justify-end gap-2 mt-2 pt-1">
                                                    <Link
                                                        href={`/add?id=${asset.id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-[10px] text-neo-black bg-white px-1.5 py-0.5 border border-neo-black font-bold hover:bg-gray-100"
                                                    >
                                                        EDIT
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Are you sure you want to delete this asset?')) {
                                                                removeAsset(asset.id);
                                                            }
                                                        }}
                                                        className="text-[10px] text-red-500 bg-white px-1.5 py-0.5 border border-red-500 font-bold hover:bg-red-50"
                                                    >
                                                        DELETE
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </NeoCard>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
