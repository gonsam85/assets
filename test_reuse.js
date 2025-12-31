
const pkg = require('yahoo-finance2');
const YahooFinance = pkg.default || pkg;
// Instantiate ONCE
const yf = new YahooFinance();

if (yf.suppressNotices) yf.suppressNotices(['yahooSurvey']);

async function testReuse() {
    try {
        console.log('Call 1...');
        await yf.quote('AAPL');
        console.log('Call 1 Success');

        console.log('Call 2...');
        await yf.quote('MSFT');
        console.log('Call 2 Success');

        console.log('Call 3...');
        await yf.quote('BTC-USD');
        console.log('Call 3 Success');

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testReuse();
