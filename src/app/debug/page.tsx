'use client';

import { useState } from 'react';
import NeoCard from '@/components/ui/NeoCard';
import NeoButton from '@/components/ui/NeoButton';

export default function DebugPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [ticker, setTicker] = useState('AAPL');

    const testApi = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`/api/price?ticker=${ticker}`);
            const status = res.status;
            let data;
            try {
                data = await res.json();
            } catch (e) {
                data = { error: 'Failed to parse JSON', rawText: await res.text() };
            }
            setResult({ status, data });
        } catch (e: any) {
            setResult({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-black">API Debugger 🐞</h1>

            <div className="flex gap-2">
                <input
                    value={ticker}
                    onChange={e => setTicker(e.target.value)}
                    className="border-3 border-neo-black p-2 font-bold"
                />
                <NeoButton onClick={testApi} disabled={loading}>
                    {loading ? 'Testing...' : 'Test Fetch'}
                </NeoButton>
            </div>

            {result && (
                <NeoCard color={result.status === 200 ? 'green' : 'red'}>
                    <h2 className="font-bold mb-2">Result (Status: {result.status})</h2>
                    <pre className="bg-black text-white p-2 text-xs overflow-auto max-h-96">
                        {JSON.stringify(result.data, null, 2)}
                    </pre>
                </NeoCard>
            )}

            <div className="text-xs text-gray-500 font-bold mt-12">
                Use this page to check if Vercel is blocking our API requests.
                If Status is 404 or 500, check the "error" field above.
            </div>
        </div>
    );
}
