import React, { useRef } from 'react';
import { useGameStore } from '../store';
import { PAIR_PROFILES } from '../utils/marketData';
import { twMerge } from 'tailwind-merge';

const pairsList = Object.values(PAIR_PROFILES);

export const CurrencyCarousel: React.FC = () => {
    const { currencyPair, setCurrencyPair } = useGameStore();

    const handleSelect = (pair: string) => {
        setCurrencyPair(pair);
    }

    return (
        <div className="absolute bottom-6 left-0 w-full z-50 pointer-events-auto overflow-x-auto pb-4 px-4 flex gap-3 snap-x snap-mandatory scrollbar-hide">
            {pairsList.map((p) => {
                const isSelected = p.pair === currencyPair;
                return (
                    <button
                        key={p.pair}
                        onClick={() => handleSelect(p.pair)}
                        className={twMerge(
                            "snap-center flex items-center justify-center gap-2 min-w-[120px] px-4 py-2 rounded-full transition-all duration-200 border",
                            isSelected 
                                ? "bg-[#e8eaed] text-[#202124] border-transparent font-medium" 
                                : "bg-[#202124]/80 text-[#9aa0a6] border-[#3c4043] hover:bg-[#303134] font-medium backdrop-blur-md"
                        )}
                    >
                        <span>{p.pair}</span>
                    </button>
                )
            })}
        </div>
    )
}
