'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define Asset Types
export type AssetType = 'cash' | 'stock' | 'crypto' | 'real_estate' | 'loan';

export interface Asset {
    id: string;
    name: string;
    amount: number;
    type: AssetType;
    date: string;
    category: string; // e.g., "Apple" or "Savings"

    // New Fields for Enhanced Input
    currency?: 'KRW' | 'USD';
    purchasePrice?: number;
    currentPrice?: number; // For Realty (and potentially others)
    quantity?: number;     // For Stock/Crypto
    ticker?: string;       // For Stock/Crypto (e.g., AAPL, BTC-USD)
}

interface AssetContextType {
    assets: Asset[];
    netWorth: number;
    addAsset: (asset: Omit<Asset, 'id' | 'date'>) => void;
    removeAsset: (id: string) => void;
    getAssetsByType: (type: AssetType) => Asset[];
    updateAsset: (asset: Asset) => void;
    userSettings: UserSettings;
    updateUserSettings: (settings: Partial<UserSettings>) => void;
}

export interface UserSettings {
    nickname: string;
    fireGoal: number;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export function AssetProvider({ children }: { children: React.ReactNode }) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [userSettings, setUserSettings] = useState<UserSettings>({
        nickname: 'Rich',
        fireGoal: 100000000,
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedAssets = localStorage.getItem('my_wealth_assets');
        const savedSettings = localStorage.getItem('my_wealth_settings');

        if (savedAssets) {
            setAssets(JSON.parse(savedAssets));
        } else {
            // Initial Dummy Data for demonstration
            setAssets([
                { id: '1', name: 'Salary', amount: 3500000, type: 'cash', date: new Date().toISOString(), category: 'Income' },
                { id: '2', name: 'Bitcoin', amount: 5500000, type: 'crypto', date: new Date().toISOString(), category: 'Invest' },
                { id: '3', name: 'Apple Stock', amount: 1200000, type: 'stock', date: new Date().toISOString(), category: 'Invest' }
            ]);
        }

        if (savedSettings) {
            setUserSettings(JSON.parse(savedSettings));
        }

        setIsLoaded(true);
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('my_wealth_assets', JSON.stringify(assets));
            localStorage.setItem('my_wealth_settings', JSON.stringify(userSettings));
        }
    }, [assets, userSettings, isLoaded]);

    const addAsset = (newAsset: Omit<Asset, 'id' | 'date'>) => {
        // Aggregate Cash with same name
        if (newAsset.type === 'cash') {
            const existingIndex = assets.findIndex(a =>
                a.type === 'cash' &&
                a.name === newAsset.name
            );

            if (existingIndex !== -1) {
                const existing = assets[existingIndex];
                const updatedAssets = [...assets];
                updatedAssets[existingIndex] = {
                    ...existing,
                    amount: existing.amount + newAsset.amount,
                    date: new Date().toISOString()
                };
                setAssets(updatedAssets);
                return;
            }
        }

        // Aggregate Stock/Crypto with same ticker
        if ((newAsset.type === 'stock' || newAsset.type === 'crypto') && newAsset.ticker) {
            const existingIndex = assets.findIndex(a =>
                a.type === newAsset.type &&
                a.ticker === newAsset.ticker
            );

            if (existingIndex !== -1) {
                const existing = assets[existingIndex];
                const oldQty = existing.quantity || 0;
                const newQty = newAsset.quantity || 0;
                const totalQty = oldQty + newQty;

                // Weighted Average Price
                const oldPrice = existing.purchasePrice || 0;
                const newPrice = newAsset.purchasePrice || 0;
                const avgPrice = totalQty > 0 ? ((oldPrice * oldQty) + (newPrice * newQty)) / totalQty : 0;

                const updatedAssets = [...assets];
                updatedAssets[existingIndex] = {
                    ...existing,
                    quantity: totalQty,
                    purchasePrice: avgPrice,
                    amount: existing.amount + newAsset.amount, // Accumulate total book value
                    date: new Date().toISOString()
                };
                setAssets(updatedAssets);
                return;
            }
        }

        const asset: Asset = {
            ...newAsset,
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
        };
        setAssets((prev) => [asset, ...prev]);
    };

    const updateAsset = (updatedAsset: Asset) => {
        setAssets((prev) => prev.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset)));
    };

    const removeAsset = (id: string) => {
        setAssets((prev) => prev.filter((a) => a.id !== id));
    };

    const updateUserSettings = (newSettings: Partial<UserSettings>) => {
        setUserSettings(prev => ({ ...prev, ...newSettings }));
    };

    const getAssetsByType = (type: AssetType) => {
        return assets.filter((asset) => asset.type === type);
    };

    // Calculate Net Worth (Assets - Loans)
    const netWorth = assets.reduce((total, asset) => {
        if (asset.type === 'loan') {
            return total - asset.amount;
        }
        return total + asset.amount;
    }, 0);

    return (
        <AssetContext.Provider value={{ assets, netWorth, userSettings, addAsset, updateAsset, removeAsset, updateUserSettings, getAssetsByType }}>
            {children}
        </AssetContext.Provider>
    );
}

export function useAssets() {
    const context = useContext(AssetContext);
    if (context === undefined) {
        throw new Error('useAssets must be used within an AssetProvider');
    }
    return context;
}
