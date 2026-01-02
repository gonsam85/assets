import { NextResponse } from 'next/server';

// Force dynamic to ensure API is not statically pre-rendered (which might trigger build time exec issues)
export const dynamic = 'force-dynamic';

// Global instance cache to reuse crumbs/sessions
let yfInstance: any = null;

// Helper: Raw Fetch Fallback
async function fetchRawPrice(ticker: string) {
    try {
        console.log(`[Fallback] Fetching raw data for ${ticker}...`);
        // Using v8 chart API which is often more lenient
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) throw new Error(`Raw fetch failed: ${res.status}`);

        const data = await res.json();

        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
            throw new Error('Invalid raw response structure');
        }

        const result = data.chart.result[0];
        const meta = result.meta;

        return {
            ticker: meta.symbol,
            price: meta.regularMarketPrice,
            prevClose: meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice,
            currency: meta.currency,
            symbol: meta.symbol,
            debugMeta: meta
        };
    } catch (e) {
        console.error(`Raw fetch error for ${ticker}:`, e);
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const tickersParam = searchParams.get('tickers');

    if (!ticker && !tickersParam) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    try {
        // Lazy Initialization (Singleton)
        if (!yfInstance) {
            console.log("Initializing new YahooFinance instance...");
            const pkg = require('yahoo-finance2');
            const YahooFinance = pkg.default || pkg;
            yfInstance = new YahooFinance({
                fetchOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                    }
                }
            });

            if (yfInstance.suppressNotices) {
                yfInstance.suppressNotices(['yahooSurvey']);
            }
        }

        const yf = yfInstance;

        if (tickersParam) {
            const symbols = tickersParam.split(',').map(s => s.trim()).filter(s => s.length > 0);
            if (symbols.length === 0) return NextResponse.json([]);

            try {
                // Try Library First
                const quotes = await yf.quote(symbols);
                const quoteArray = Array.isArray(quotes) ? quotes : [quotes];

                const results = quoteArray.map((q: any) => ({
                    ticker: q.symbol,
                    price: q.regularMarketPrice,
                    prevClose: q.regularMarketPreviousClose,
                    currency: q.currency,
                    symbol: q.symbol
                }));
                return NextResponse.json(results);
            } catch (e: any) {
                console.error("Batch fetch error (Lib), trying fallback:", e.message);

                // Fallback: Parallel Raw Requests
                // Note: Yahoo v8 chart API doesn't support batch, so we must loop.
                const tasks = symbols.map((s: string) => fetchRawPrice(s));
                const rawResults = (await Promise.all(tasks)).filter(r => r !== null);

                if (rawResults.length > 0) {
                    return NextResponse.json(rawResults);
                }

                return NextResponse.json({ error: 'Batch fetch failed', details: e.message }, { status: 500 });
            }
        }

        // Single Ticker Fallback
        if (ticker) {
            try {
                const quote = await yf.quote(ticker);
                if (!quote) throw new Error("Quote not found");

                return NextResponse.json({
                    ticker: ticker,
                    price: quote.regularMarketPrice,
                    prevClose: quote.regularMarketPreviousClose,
                    currency: quote.currency,
                    symbol: quote.symbol
                });
            } catch (e: any) {
                console.error("Single fetch error (Lib), trying fallback:", e.message);

                const rawData = await fetchRawPrice(ticker);
                if (rawData) return NextResponse.json(rawData);

                return NextResponse.json({
                    error: 'Failed to fetch price',
                    details: e.message
                }, { status: 500 });
            }
        }

    } catch (error: any) {
        console.error('Yahoo Finance Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch price',
            details: error.message
        }, { status: 500 });
    }
}
