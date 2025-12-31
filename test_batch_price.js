const pkg = require('yahoo-finance2');
const yf = pkg.default || pkg; // Use Singleton

async function testBatch() {
    try {
        console.log('Testing Batch Fetch with Singleton...');
        const symbols = ['AAPL', 'BTC-USD', 'KRW=X'];
        console.log('Symbols:', symbols);

        // Suppress survey
        if (yf.suppressNotices) yf.suppressNotices(['yahooSurvey']);

        const results = await yf.quote(symbols);

        if (Array.isArray(results)) {
            console.log('Success! Received Array of length:', results.length);
            results.forEach(q => console.log(`${q.symbol}: ${q.regularMarketPrice}`));
        } else {
            console.log('Received Single Object:', results.symbol);
        }

    } catch (e) {
        console.error('Batch Fetch Error:', e.message);
    }
}

testBatch();
