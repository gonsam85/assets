'use client';

import { useState } from 'react';
import NeoCard from '@/components/ui/NeoCard';
import NeoButton from '@/components/ui/NeoButton';

export default function DebugPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [ticker, setTicker] = useState('AAPL');

    const testApi = async (isBatch = false) => {
        setLoading(true);
        setResult(null);
        try {
            const url = isBatch
                ? `/api/price?tickers=AAPL,TSLA,BTC-USD,KRW=X`
                : `/api/price?ticker=${ticker}`;

            const res = await fetch(url);
            const status = res.status;
            let data;
            try {
                data = await res.json();
            } catch (e) {
                data = { error: 'Failed to parse JSON', rawText: await res.text() };
            }
            setResult({ status, data, type: isBatch ? 'Batch' : 'Single' });
        } catch (e: any) {
            setResult({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-black">API Debugger 🐞</h1>

            <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                    <input
                        value={ticker}
                        onChange={e => setTicker(e.target.value)}
                        className="border-3 border-neo-black p-2 font-bold w-full"
                        placeholder="Single Ticker"
                    />
                    <NeoButton onClick={() => testApi(false)} disabled={loading}>
                        {loading ? '...' : 'Single'}
                    </NeoButton>
                </div>

                <div className="border-t-2 border-dashed border-gray-300"></div>

                <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">Test Batch (AAPL, TSLA, BTC, KRW)</span>
                    <NeoButton onClick={() => testApi(true)} disabled={loading} variant="secondary">
                        {loading ? '...' : 'Test Batch'}
                    </NeoButton>
                </div>
            </div>

            {result && (
                <NeoCard color={result.status === 200 ? 'green' : 'red'}>
                    <h2 className="font-bold mb-2">
                        [{result.type}] Result (Status: {result.status})
                    </h2>
                    <pre className="bg-black text-white p-2 text-xs overflow-auto max-h-96">
                        {JSON.stringify(result.data, null, 2)}
                    </pre>
                </NeoCard>
            )}

            <div className="text-xs text-gray-500 font-bold mt-12 bg-gray-100 p-4 rounded-lg">
                <p>1. If 'Single' works checking individual stocks.</p>
                <p>2. If 'Batch' works, the Dashboard should work.</p>
                <p>3. If 'Batch' fails (500/404), the batch logic in route.ts is broken.</p>
            </div>
        </div>
    );
}
