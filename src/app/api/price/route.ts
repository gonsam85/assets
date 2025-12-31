import { NextResponse } from 'next/server';

// Force dynamic to ensure API is not statically pre-rendered (which might trigger build time exec issues)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const tickersParam = searchParams.get('tickers');

    if (!ticker && !tickersParam) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    try {
        const pkg = require('yahoo-finance2');
        const YahooFinance = pkg.default || pkg;
        const yf = new YahooFinance();

        if (yf.suppressNotices) {
            yf.suppressNotices(['yahooSurvey']);
        }

        if (tickersParam) {
            const symbols = tickersParam.split(',').map(s => s.trim()).filter(s => s.length > 0);
            if (symbols.length === 0) return NextResponse.json([]);

            try {
                const quotes = await yf.quote(symbols);
                // Ensure array
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
                console.error("Batch fetch error:", e);
                // If batch fails, try individual? No, too complex. Return error.
                return NextResponse.json({ error: 'Batch fetch failed', details: e.message }, { status: 500 });
            }
        }

        // Single Ticker Fallback
        if (ticker) {
            const quote = await yf.quote(ticker);
            if (!quote) {
                return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
            }
            return NextResponse.json({
                ticker: ticker,
                price: quote.regularMarketPrice,
                prevClose: quote.regularMarketPreviousClose,
                currency: quote.currency,
                symbol: quote.symbol
            });
        }

    } catch (error: any) {
        console.error('Yahoo Finance Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch price',
            details: error.message
        }, { status: 500 });
    }
}
