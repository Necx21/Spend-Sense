import { Currency } from '../types';

export const formatCurrency = (amountInBase: number, currency: Currency): string => {
    // Base amount (INR) * Rate
    const value = amountInBase * currency.rate;
    
    // Logic: If the value is small (< 100) or has significant decimals, show them.
    // If it's a large integer based currency (like JPY, KRW) usually no decimals.
    
    let minimumFractionDigits = 0;
    let maximumFractionDigits = 0;

    // Check for "strong" currencies where values might be small (e.g. 10 INR = 0.12 USD)
    if (value > 0 && value < 10) {
        minimumFractionDigits = 2;
        maximumFractionDigits = 2;
    } else if (value >= 10 && value < 100) {
        minimumFractionDigits = 2;
        maximumFractionDigits = 2;
    } else {
        // Larger numbers default
        minimumFractionDigits = 0;
        maximumFractionDigits = 0;
    }

    // Currencies that typically don't use decimals for everyday amounts
    const noDecimalCurrencies = ['JPY', 'KRW', 'HUF', 'VND', 'IDR', 'CLP', 'TWD'];
    if (noDecimalCurrencies.includes(currency.code)) {
        minimumFractionDigits = 0;
        maximumFractionDigits = 0;
    }
    
    // Currencies that typically USE decimals (Standard 2 decimals)
    // Most western currencies and others
    const decimalCurrencies = [
        'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'NZD', 
        'SGD', 'HKD', 'BRL', 'ZAR', 'TRY', 'SAR', 'AED', 'THB', 
        'MYR', 'PHP', 'PLN', 'ILS', 'NOK', 'DKK', 'MXN', 'SEK'
    ];
    
    if (decimalCurrencies.includes(currency.code)) {
         minimumFractionDigits = 2;
         maximumFractionDigits = 2;
    }

    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(value);
};

export const getRawConvertedAmount = (amountInBase: number, currency: Currency): number => {
    return Number((amountInBase * currency.rate).toFixed(2));
}