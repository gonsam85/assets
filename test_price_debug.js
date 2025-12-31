
const pkg = require('yahoo-finance2');

async function test() {
    try {
        console.log('Pkg keys:', Object.keys(pkg));
        const YahooFinance = pkg.default || pkg;
        console.log('YahooFinance type:', typeof YahooFinance);

        let yf;
        try {
            console.log('Attempting new YahooFinance()...');
            yf = new YahooFinance();
            console.log('Success: new YahooFinance()');
        } catch (e) {
            console.log('Failed new YahooFinance():', e.message);
            console.log('Assuming singleton...');
            yf = YahooFinance;
        }

        if (yf.suppressNotices) {
            yf.suppressNotices(['yahooSurvey']);
        }

        console.log('Fetching quote for AAPL...');
        const quote = await yf.quote('AAPL');
        console.log('Quote:', quote.regularMarketPrice);
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

test();
