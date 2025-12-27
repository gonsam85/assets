'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssets } from '@/context/AssetContext';
import NeoCard from '@/components/ui/NeoCard';
import NeoButton from '@/components/ui/NeoButton';
import NeoInput from '@/components/ui/NeoInput';

export default function SettingsPage() {
    const router = useRouter();
    const { userSettings, updateUserSettings } = useAssets();

    // Local state for inputs
    const [nickname, setNickname] = useState('');
    const [fireGoal, setFireGoal] = useState('');

    // Load initial values
    useEffect(() => {
        if (userSettings) {
            setNickname(userSettings.nickname);
            setFireGoal(userSettings.fireGoal.toString());
        }
    }, [userSettings]);

    const handleSave = () => {
        const goalAmount = Number(fireGoal);
        if (nickname && !isNaN(goalAmount)) {
            updateUserSettings({
                nickname,
                fireGoal: goalAmount
            });
            router.push('/');
        }
    };

    return (
        <div className="p-4 pt-8 pb-24 space-y-6">
            <h1 className="text-4xl font-black bg-white text-neo-black inline-block px-2 border-3 border-neo-black shadow-neo-sm transform rotate-1">
                SETTINGS
            </h1>

            <NeoCard color="blue">
                <h2 className="text-xl font-bold text-white mb-4">User Profile</h2>
                <div className="space-y-4">
                    <NeoInput
                        label="Nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Enter your nickname"
                    />
                </div>
            </NeoCard>

            <NeoCard color="pink">
                <h2 className="text-xl font-bold text-white mb-4">Goals</h2>
                <div className="space-y-4">
                    <NeoInput
                        label="FIRE Goal Amount (KRW)"
                        value={fireGoal}
                        onChange={(e) => setFireGoal(e.target.value)}
                        type="number"
                        placeholder="100000000"
                    />
                    <p className="text-xs text-white font-bold opacity-80">
                        This amount will be used to calculate your progress bar on the Dashboard.
                    </p>
                </div>
            </NeoCard>

            <NeoButton
                onClick={handleSave}
                className="w-full py-4 text-xl bg-neo-yellow text-neo-black hover:bg-yellow-400"
            >
                SAVE SETTINGS
            </NeoButton>
        </div>
    );
}
