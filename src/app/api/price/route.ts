import { NextResponse } from 'next/server';

// Force dynamic to ensure API is not statically pre-rendered (which might trigger build time exec issues)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    try {
        // Use require to avoid build-time static analysis issues with yahoo-finance2 ESM build
        const pkg = require('yahoo-finance2');
        const YahooFinance = pkg.default || pkg;
        const yf = new YahooFinance();

        // Suppress survey notice
        if (yf.suppressNotices) {
            yf.suppressNotices(['yahooSurvey']);
        }

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
    } catch (error: any) {
        console.error('Yahoo Finance Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch price',
            details: error.message
        }, { status: 500 });
    }
}
