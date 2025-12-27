const yahooFinance = require('yahoo-finance2').default;

async function testFx() {
    try {
        const quote = await yahooFinance.quote('KRW=X');
        console.log('KRW=X:', quote.regularMarketPrice);

        const quote2 = await yahooFinance.quote('USDKRW=X');
        console.log('USDKRW=X:', quote2 ? quote2.regularMarketPrice : 'null');
    } catch (e) {
        console.error(e);
    }
}

testFx();
