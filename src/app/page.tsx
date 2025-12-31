'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Settings, LineChart, Building2, BadgeDollarSign, Wallet, Landmark, RefreshCw } from 'lucide-react';
import NeoCard from '@/components/ui/NeoCard';
import NeoButton from '@/components/ui/NeoButton';
import clsx from 'clsx';
import { useAssets, AssetType } from '@/context/AssetContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const { netWorth: staticNetWorth, assets, userSettings } = useAssets();
  const [exchangeRate, setExchangeRate] = useState<number>(1400);
  const [dailyChange, setDailyChange] = useState<number>(0);
  const [realTimeTotalAssets, setRealTimeTotalAssets] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'stock': return <LineChart size={20} strokeWidth={2.5} />;
      case 'real_estate': return <Building2 size={20} strokeWidth={2.5} />;
      case 'crypto': return <BadgeDollarSign size={20} strokeWidth={2.5} />;
      case 'loan': return <Landmark size={20} strokeWidth={2.5} />;
      case 'cash': default: return <Wallet size={20} strokeWidth={2.5} />;
    }
  };

  // Fetch Data Logic
  const fetchData = async () => {
    setIsRefreshing(true);
    let calculatedChange = 0;
    let currentTotalValue = 0;

    try {
      // 1. Exchange Rate
      const fxRes = await fetch('/api/price?ticker=KRW=X');
      const fxData = await fxRes.json();
      const currentRate = fxData.price || 1400;
      setExchangeRate(currentRate);

      // 2. Identify Tickers to Fetch
      const tickersToFetch = assets
        .filter(a => (a.type === 'stock' || a.type === 'crypto') && a.ticker)
        .map(a => a.ticker)
        .filter((t): t is string => !!t) // Ensure string
        .filter((t, i, arr) => arr.indexOf(t) === i); // Unique

      // 3. Batch Fetch
      let priceMap = new Map<string, any>();
      if (tickersToFetch.length > 0) {
        try {
          const query = tickersToFetch.join(',');
          const res = await fetch(`/api/price?tickers=${query}`);
          const data = await res.json();

          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              priceMap.set(item.ticker, item);
            });
          }
        } catch (e) {
          console.error("Batch fetch failed", e);
        }
      }

      // 4. Calculate Values
      assets.forEach(asset => {
        let assetValue = asset.amount;
        let changeTotal = 0;

        // Apply Real-time Price if available
        if ((asset.type === 'stock' || asset.type === 'crypto') && asset.ticker) {
          const data = priceMap.get(asset.ticker);
          if (data && data.price) {
            let price = data.price;
            let prevClose = data.prevClose || price;

            // Convert USD
            if (asset.currency === 'USD') {
              price *= currentRate;
              prevClose *= currentRate;
            }

            if (asset.quantity) {
              assetValue = price * asset.quantity;
              changeTotal = (price - prevClose) * asset.quantity;
            }
          }
        }

        // Sum up (Skip Loan for Total Assets)
        if (asset.type !== 'loan') {
          currentTotalValue += assetValue;
          calculatedChange += changeTotal;
        }
      });

      setDailyChange(calculatedChange);
      setRealTimeTotalAssets(currentTotalValue);

    } catch (e) {
      console.error('Dashboard fetch error', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 1 min refresh
    return () => clearInterval(interval);
  }, [assets]);

  // Use real-time values if available, otherwise static
  const displayTotalAssets = realTimeTotalAssets > 0 ? realTimeTotalAssets : assets.filter(a => a.type !== 'loan').reduce((sum, a) => sum + a.amount, 0);

  // Calculate Net Worth derived from Real-Time Assets
  const totalLoans = assets.filter(a => a.type === 'loan').reduce((sum, a) => sum + a.amount, 0);
  const displayNetWorth = displayTotalAssets - totalLoans;

  // Percentage Calculations
  const prevTotalAssets = displayTotalAssets - dailyChange;
  const dailyTotalPercent = prevTotalAssets !== 0 ? (dailyChange / prevTotalAssets) * 100 : 0;

  const prevNetWorth = displayNetWorth - dailyChange;
  const dailyNetWorthPercent = prevNetWorth !== 0 ? (dailyChange / prevNetWorth) * 100 : 0;

  const GOAL_AMOUNT = userSettings?.fireGoal || 100000000;
  const progress = Math.max(0, Math.min((displayNetWorth / GOAL_AMOUNT) * 100, 100));

  return (
    <div className="p-4 pt-8 pb-20 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black bg-neo-yellow inline-block px-2 border-3 border-neo-black shadow-neo-sm transform -rotate-2">
            MY WEALTH
          </h1>
          <p className="font-bold mt-2 text-lg">
            Welcome back, <span className="text-neo-blue underline decoration-3">{userSettings?.nickname || 'Friend'}</span>!
          </p>
        </div>
        <div className="relative flex gap-2">
          <NeoButton variant="secondary" className="!p-3 rounded-full" onClick={fetchData} disabled={isRefreshing}>
            <RefreshCw size={24} className={clsx(isRefreshing && "animate-spin")} />
          </NeoButton>
          <Link href="/settings">
            <NeoButton variant="secondary" className="!p-3 rounded-full">
              <Settings size={24} />
            </NeoButton>
          </Link>
        </div>
      </header>

      {/* Goal Progress Bar */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <NeoCard color="orange">
          <div className="flex justify-between items-end mb-2 text-white">
            <span className="font-black text-lg">🔥 FIRE GOAL</span>
            <span className="font-bold text-sm opacity-90">
              {progress.toFixed(1)}% ({formatCurrency(GOAL_AMOUNT)})
            </span>
          </div>
          <div className="w-full h-6 border-3 border-neo-black rounded-full overflow-hidden relative bg-white">
            <div className="absolute top-0 left-0 h-full w-full bg-gray-200"></div>
            {/* Progress Fill */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-neo-green border-r-3 border-neo-black relative z-10"
            ></motion.div>
          </div>
          <div className="text-right mt-1 text-xs font-bold text-white">
            {formatCurrency(Math.max(0, GOAL_AMOUNT - displayNetWorth))} left to go!
          </div>
        </NeoCard>
      </motion.div>

      {/* Overview Stack - Horizontal Bars */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {/* Total Assets Card - Horizontal */}
        <NeoCard color="blue" className="relative overflow-hidden p-4 flex justify-between items-center">
          <div className="relative z-10 text-white">
            <span className="font-bold text-xs opacity-90 block">TOTAL ASSETS</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx(
                "text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-black shadow-sm",
                dailyChange >= 0 ? "bg-neo-green text-black" : "bg-red-500 text-white"
              )}>
                {dailyChange > 0 ? '+' : ''}{formatCurrency(dailyChange)}
              </span>
              <span className={clsx("text-[10px] font-bold", dailyChange >= 0 ? "text-neo-green" : "text-red-300")}>
                {dailyChange > 0 ? '▲' : '▼'} {Math.abs(dailyTotalPercent).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="relative z-10 text-right">
            <span className="text-2xl font-black tracking-tight text-white block">
              {formatCurrency(displayTotalAssets)}
            </span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white opacity-10 rounded-full"></div>
        </NeoCard>

        {/* Net Worth - Horizontal */}
        <NeoCard color="white" className="border-3 border-neo-black bg-neo-yellow relative overflow-hidden p-4 flex justify-between items-center">
          <div className="relative z-10">
            <span className="font-bold text-xs block">NET WORTH</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx(
                "text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-black shadow-sm",
                dailyChange >= 0 ? "bg-neo-green text-black" : "bg-red-500 text-white"
              )}>
                {dailyChange > 0 ? '+' : ''}{formatCurrency(dailyChange)}
              </span>
              <span className={clsx("text-[10px] font-bold", dailyChange >= 0 ? "text-green-600" : "text-red-600")}>
                {dailyChange > 0 ? '▲' : '▼'} {Math.abs(dailyNetWorthPercent).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="text-right relative z-10">
            <span className="text-2xl font-black block text-neo-black">
              {formatCurrency(displayNetWorth)}
            </span>
          </div>
        </NeoCard>
      </motion.div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h2 className="text-lg font-black border-b-4 border-neo-black inline-block pr-6 pb-0.5">
          Recent Assets
        </h2>

        <div className="space-y-2">
          {assets.slice(0, 3).map((item, i) => {
            const cardColor = item.type === 'stock' ? 'blue' :
              item.type === 'crypto' ? 'green' :
                item.type === 'real_estate' ? 'yellow' :
                  item.type === 'loan' ? 'red' : 'orange';

            const isDarkBg = ['stock', 'loan', 'pink', 'blue', 'red'].includes(cardColor);

            return (
              <motion.div
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
              >
                <NeoCard color={cardColor} className="flex justify-between items-center p-2.5">
                  <div className="flex items-center gap-2">
                    <div className={clsx(
                      "w-8 h-8 border-2 border-neo-black flex items-center justify-center shadow-neo-sm bg-white text-neo-black"
                    )}>
                      {getAssetIcon(item.type)}
                    </div>
                    <div>
                      <div className={clsx("font-bold text-sm", isDarkBg ? "text-white" : "text-neo-black")}>{item.name}</div>
                      <div className={clsx("text-[10px] font-bold", isDarkBg ? "text-white/80" : "text-gray-600")}>{new Date(item.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={clsx("font-black text-sm", isDarkBg ? "text-white" : "text-neo-black")}>
                    {item.type === 'loan' ? '-' : ''}{formatCurrency(item.amount)}
                  </div>
                </NeoCard>
              </motion.div>
            )
          })}
          {assets.length === 0 && (
            <div className="text-gray-500 font-bold text-center py-4">No assets yet. Add one!</div>
          )}
        </div>
      </div>
    </div>
  );
}
