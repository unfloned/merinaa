import { useState, useEffect } from 'react';
import { useNuiEvent } from '../hooks/useNui';
import { clsx } from 'clsx';

/**
 * HUD Overlay Component
 * Manages visibility of persistent HUD elements and provides overlay modes
 */

interface HUDState {
    minimapVisible: boolean;
    statusBarsVisible: boolean;  // Health, armor, food, drink
    moneyVisible: boolean;
    jobStatusVisible: boolean;
    hotbarVisible: boolean;
}

interface PlacingModeState {
    active: boolean;
    itemName: string;
    itemLabel: string;
}

export function HUDOverlay() {
    const [hudState, setHudState] = useState<HUDState>({
        minimapVisible: true,
        statusBarsVisible: true,
        moneyVisible: true,
        jobStatusVisible: true,
        hotbarVisible: true,
    });

    const [placingMode, setPlacingMode] = useState<PlacingModeState>({
        active: false,
        itemName: '',
        itemLabel: '',
    });

    const [fadeIn, setFadeIn] = useState(false);

    // Listen for HUD visibility changes
    useNuiEvent('hud:setVisibility', (data: Partial<HUDState>) => {
        setHudState(prev => ({ ...prev, ...data }));
    });

    // Listen for placing mode
    useNuiEvent('inventory:placingMode', (data: { active: boolean; itemName?: string; itemLabel?: string }) => {
        if (data.active) {
            setPlacingMode({
                active: true,
                itemName: data.itemName || '',
                itemLabel: data.itemLabel || 'Item',
            });
            // Hide HUD elements
            setHudState({
                minimapVisible: false,
                statusBarsVisible: false,
                moneyVisible: false,
                jobStatusVisible: false,
                hotbarVisible: false,
            });
            // Trigger fade in animation
            setTimeout(() => setFadeIn(true), 50);
        } else {
            setFadeIn(false);
            // Delay hiding to allow fade out
            setTimeout(() => {
                setPlacingMode({ active: false, itemName: '', itemLabel: '' });
                // Restore HUD elements
                setHudState({
                    minimapVisible: true,
                    statusBarsVisible: true,
                    moneyVisible: true,
                    jobStatusVisible: true,
                    hotbarVisible: true,
                });
            }, 300);
        }
    });

    // Send visibility state to other components
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('hudVisibilityChange', { detail: hudState }));
    }, [hudState]);

    if (!placingMode.active) return null;

    return (
        <div className={clsx(
            "fixed inset-0 pointer-events-none z-100 transition-opacity duration-300",
            fadeIn ? "opacity-100" : "opacity-0"
        )}>
            {/* Vignette/Frame Effect */}
            <div className="absolute inset-0 bg-linear-to-r from-black/40 via-transparent to-black/40" />
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/40" />

            {/* Corner Brackets */}
            <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-white/60" />
            <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-white/60" />
            <div className="absolute bottom-24 left-8 w-16 h-16 border-l-2 border-b-2 border-white/60" />
            <div className="absolute bottom-24 right-8 w-16 h-16 border-r-2 border-b-2 border-white/60" />

            {/* Top Info */}
            <div className={clsx(
                "absolute top-12 left-1/2 -translate-x-1/2 text-center transition-all duration-500",
                fadeIn ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            )}>
                <div className="bg-black/60 backdrop-blur-xs rounded-lg px-6 py-3 border border-white/20">
                    <p className="text-white/60 text-sm uppercase tracking-wider">Platzieren</p>
                    <p className="text-white text-lg font-semibold">{placingMode.itemLabel}</p>
                </div>
            </div>

            {/* Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    {/* Outer ring */}
                    <div className={clsx(
                        "w-12 h-12 rounded-full border-2 border-green-400/60 transition-all duration-300",
                        fadeIn ? "scale-100" : "scale-150 opacity-0"
                    )} />
                    {/* Inner dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400" />
                    {/* Cross lines */}
                    <div className="absolute top-1/2 left-0 w-3 h-0.5 bg-green-400/60 -translate-y-1/2" />
                    <div className="absolute top-1/2 right-0 w-3 h-0.5 bg-green-400/60 -translate-y-1/2" />
                    <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-green-400/60 -translate-x-1/2" />
                    <div className="absolute bottom-0 left-1/2 w-0.5 h-3 bg-green-400/60 -translate-x-1/2" />
                </div>
            </div>

            {/* Bottom Instructions */}
            <div className={clsx(
                "absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-500",
                fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
                <div className="bg-black/70 backdrop-blur-xs rounded-xl px-8 py-4 border border-white/10">
                    <div className="flex items-center gap-6">
                        {/* Left Click */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">Linksklick</p>
                                <p className="text-white/50 text-sm">Platzieren</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-10 bg-white/20" />

                        {/* Mouse Wheel */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9v6c0 3.87 3.13 7 7 7s7-3.13 7-7V9c0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5v2h-4V7h-2v4H7V9c0-2.76 2.24-5 5-5z"/>
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">Mausrad</p>
                                <p className="text-white/50 text-sm">Drehen</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-10 bg-white/20" />

                        {/* ALT + Mouse Wheel */}
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                                    <span className="text-purple-400 font-bold text-xs">ALT</span>
                                </div>
                                <span className="text-white/40 self-center">+</span>
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C8.13 2 5 5.13 5 9v6c0 3.87 3.13 7 7 7s7-3.13 7-7V9c0-3.87-3.13-7-7-7z"/>
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-medium">Neigen</p>
                                <p className="text-white/50 text-sm">Kippen</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-10 bg-white/20" />

                        {/* Right Click */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">Rechtsklick</p>
                                <p className="text-white/50 text-sm">Abbrechen</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to check HUD visibility
 */
export function useHUDVisibility() {
    const [visibility, setVisibility] = useState<HUDState>({
        minimapVisible: true,
        statusBarsVisible: true,
        moneyVisible: true,
        jobStatusVisible: true,
        hotbarVisible: true,
    });

    useEffect(() => {
        const handler = (e: CustomEvent<HUDState>) => {
            setVisibility(e.detail);
        };
        window.addEventListener('hudVisibilityChange', handler as EventListener);
        return () => window.removeEventListener('hudVisibilityChange', handler as EventListener);
    }, []);

    return visibility;
}
