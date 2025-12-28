'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAssets, AssetType } from '@/context/AssetContext';
import NeoCard from '@/components/ui/NeoCard';
import NeoButton from '@/components/ui/NeoButton';
import NeoInput from '@/components/ui/NeoInput';
import { BadgeDollarSign, Wallet, LineChart, Building2, Landmark, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

function AddEditContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');
    const { addAsset, updateAsset, assets } = useAssets();

    // Check if we are in edit mode and find the asset
    const [isEditMode, setIsEditMode] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<number>(1400); // Default fallback

    const [formData, setFormData] = useState({
        name: '',
        amount: '',         // For Cash / Loan (KRW default)
        type: 'cash' as AssetType,
        currency: 'KRW' as 'KRW' | 'USD',
        purchasePrice: '',  // Realty, Stock, Crypto
        currentPrice: '',   // Realty
        quantity: '',       // Stock, Crypto
        ticker: '',         // Stock, Crypto
    });

    // Fetch Exchange Rate on mount
    useEffect(() => {
        fetch('https://api.exchangerate-api.com/v4/latest/USD')
            .then(res => res.json())
            .then(data => {
                const rate = data.rates.KRW;
                if (rate) setExchangeRate(rate);
            })
            .catch(err => console.error("Failed to fetch exchange rate", err));
    }, []);

    useEffect(() => {
        if (editId) {
            const assetToEdit = assets.find(a => a.id === editId);
            if (assetToEdit) {
                setIsEditMode(true);
                setFormData({
                    name: assetToEdit.name,
                    amount: assetToEdit.amount.toString(),
                    type: assetToEdit.type,
                    currency: assetToEdit.currency || 'KRW',
                    purchasePrice: assetToEdit.purchasePrice?.toString() || '',
                    currentPrice: assetToEdit.currentPrice?.toString() || '',
                    quantity: assetToEdit.quantity?.toString() || '',
                    ticker: assetToEdit.ticker || '',
                });
            }
        }
    }, [editId, assets]);

    const assetTypes: { id: AssetType; icon: any; label: string; color: string; textColor?: string }[] = [
        { id: 'cash', icon: Wallet, label: 'Cash', color: 'bg-neo-orange' },
        { id: 'stock', icon: LineChart, label: 'Stock', color: 'bg-neo-blue' },
        { id: 'crypto', icon: BadgeDollarSign, label: 'Crypto', color: 'bg-neo-green', textColor: 'text-neo-black' },
        { id: 'real_estate', icon: Building2, label: 'Realty', color: 'bg-neo-yellow', textColor: 'text-neo-black' },
        { id: 'loan', icon: Landmark, label: 'Loan', color: 'bg-neo-red' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        let calculatedAmount = 0;

        // Logic to calculate final KRW amount
        if (formData.type === 'loan' || formData.type === 'cash') {
            const rawAmount = Number(formData.amount);
            if (formData.currency === 'USD') {
                calculatedAmount = rawAmount * exchangeRate;
            } else {
                calculatedAmount = rawAmount;
            }
        } else if (formData.type === 'real_estate') {
            // Realty uses Current Price for Net Worth
            // Assume input is KRW for Realty as per Korean context usually, but if USD needed could add.
            // User request usually implies KRW for realty unless specified.
            // "Name, Purchase Price, Current Price" -> Amount = Current Price
            calculatedAmount = Number(formData.currentPrice);
        } else if (formData.type === 'stock' || formData.type === 'crypto') {
            // "Purchase Price, Quantity" -> User request implies we track this.
            // Amount = PurchasePrice * Quantity
            const price = Number(formData.purchasePrice);
            const qty = Number(formData.quantity);
            let totalValue = price * qty;

            if (formData.currency === 'USD') {
                totalValue = totalValue * exchangeRate;
            }
            calculatedAmount = totalValue;
        }

        const assetData = {
            name: formData.name,
            amount: Math.round(calculatedAmount), // core amount for dashboard
            type: formData.type,
            currency: formData.currency,
            purchasePrice: Number(formData.purchasePrice) || undefined,
            currentPrice: Number(formData.currentPrice) || undefined,
            quantity: Number(formData.quantity) || undefined,
            ticker: formData.ticker || undefined,
            category: 'General',
        };

        if (isEditMode && editId) {
            const originalAsset = assets.find(a => a.id === editId);
            if (originalAsset) {
                updateAsset({ ...originalAsset, ...assetData });
            }
        } else {
            addAsset(assetData);
        }

        router.push(isEditMode ? (formData.type === 'loan' ? '/loan' : '/portfolio') : '/');
    };

    return (
        <div className="p-4 pt-8 pb-24 space-y-6">
            <h1 className={clsx(
                "text-4xl font-black text-white inline-block px-2 border-3 border-neo-black shadow-neo-sm",
                isEditMode ? "bg-neo-blue" : "bg-neo-pink"
            )}>
                {isEditMode ? 'EDIT ASSET' : 'ADD ASSET'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selection */}
                <section>
                    <label className="font-bold text-lg mb-2 block">Asset Type</label>
                    <div className="grid grid-cols-3 gap-3">
                        {assetTypes.map((type) => {
                            const isSelected = formData.type === type.id;
                            return (
                                <div
                                    key={type.id}
                                    onClick={() => setFormData({ ...formData, type: type.id })}
                                    className={clsx(
                                        "cursor-pointer border-3 border-neo-black p-3 flex flex-col items-center justify-center transition-all",
                                        isSelected ? `${type.color} ${type.textColor || 'text-white'} shadow-neo -translate-y-1` : "bg-white text-neo-black hover:bg-gray-50"
                                    )}
                                >
                                    <type.icon size={24} strokeWidth={2.5} />
                                    <span className="font-bold text-sm mt-1">{type.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <NeoCard>
                    <div className="space-y-4">
                        <NeoInput
                            label="Name"
                            placeholder="Asset Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />

                        {/* Currency Selector for Cash/Stock/Crypto */}
                        {(formData.type === 'cash' || formData.type === 'stock' || formData.type === 'crypto') && (
                            <div>
                                <label className="block text-sm font-bold mb-1">Currency</label>
                                <div className="flex gap-2">
                                    {['KRW', 'USD'].map(curr => (
                                        <button
                                            key={curr}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, currency: curr as 'KRW' | 'USD' })}
                                            className={clsx(
                                                "flex-1 py-2 font-black border-2 border-neo-black shadow-neo-sm transition-transform active:translate-y-1",
                                                formData.currency === curr ? "bg-neo-yellow text-neo-black" : "bg-white text-gray-500"
                                            )}
                                        >
                                            {curr}
                                        </button>
                                    ))}
                                </div>
                                {formData.currency === 'USD' && (
                                    <p className="text-xs text-gray-400 mt-1 font-bold flex items-center gap-1">
                                        <RefreshCw size={12} /> Rate: 1 USD ≈ {exchangeRate.toFixed(0)} KRW
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Fields for Loan / Cash */}
                        {(formData.type === 'loan' || formData.type === 'cash') && (
                            <NeoInput
                                label={`Amount (${formData.currency})`}
                                type="number"
                                placeholder="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        )}

                        {/* Fields for Realty */}
                        {formData.type === 'real_estate' && (
                            <>
                                <NeoInput
                                    label="Purchase Price (KRW)"
                                    type="number"
                                    value={formData.purchasePrice}
                                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                />
                                <NeoInput
                                    label="Current Price (KRW)"
                                    type="number"
                                    value={formData.currentPrice}
                                    onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                                />
                            </>
                        )}

                        {/* Fields for Stock / Crypto */}
                        {(formData.type === 'stock' || formData.type === 'crypto') && (
                            <>
                                <NeoInput
                                    label="Ticker Symbol (e.g. AAPL, BTC-USD)"
                                    placeholder="Enter Ticker for Live Price"
                                    value={formData.ticker}
                                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
                                />
                                <NeoInput
                                    label={`Purchase Price (${formData.currency})`}
                                    type="number"
                                    value={formData.purchasePrice}
                                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                />
                                <NeoInput
                                    label="Quantity"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </>
                        )}
                    </div>
                </NeoCard>

                {/* Submit Button */}
                <NeoButton className="w-full py-4 text-xl" onClick={() => { }}>
                    {isEditMode ? 'UPDATE ASSET' : 'CONFIRM ADD'}
                </NeoButton>
            </form>
        </div>
    );
}

export default function AddPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddEditContent />
        </Suspense>
    );
}
