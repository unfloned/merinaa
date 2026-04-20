/**
 * SidePanel Component
 * Wiederverwendbares Side-Panel UI (rechte Seite)
 *
 * Features:
 * - Gradient Overlay zur Spielwelt
 * - Optionale Minimier-Funktion (H-Taste)
 * - Custom Header Farben/Gradient
 * - Tab-Navigation
 * - Footer & Keyboard Hints
 * - Resizable: Linker Rand ziehbar (max 80% Bildschirmbreite)
 *
 * Verwendet von: OrganisationPanel, TuningPreview, Shop, AdminPanel, Bank, etc.
 */

import { ReactNode, useEffect, useCallback, useState, useRef } from 'react';
import { X, Minimize2, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

// ==================== TYPES ====================

export interface SidePanelTab {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: 'red' | 'green' | 'blue' | 'yellow';
    indicator?: boolean; // Kleiner Punkt statt Badge
}

export interface SidePanelProps {
    /** Ist das Panel sichtbar? */
    isOpen: boolean;
    /** Schließen Handler */
    onClose: () => void;
    /** Panel Breite (default: 600px) */
    width?: number;
    /** Header Icon Component */
    headerIcon: React.ComponentType<{ className?: string }>;
    /** Header Titel */
    title: string;
    /** Header Untertitel */
    subtitle?: string;
    /** Custom Header als ReactNode (ersetzt Standard-Header) */
    customHeader?: ReactNode;
    /** Header Gradient (z.B. "from-blue-600 to-blue-800") */
    headerGradient?: string;
    /** Header Icon Hintergrund Farbe */
    headerIconBg?: string;
    /** Info-Bar unter dem Header (optional) */
    infoBar?: ReactNode;
    /** Navigation Tabs (links) */
    tabs?: SidePanelTab[];
    /** Aktiver Tab ID */
    activeTab?: string;
    /** Tab Change Handler */
    onTabChange?: (tabId: string) => void;
    /** Navigation Breite (default: 180px) */
    navWidth?: number;
    /** Navigation Header Text */
    navHeader?: string;
    /** Footer Content (optional) */
    footer?: ReactNode;
    /** Keyboard Hints (optional) */
    keyboardHints?: Array<{ key: string; label: string }>;
    /** Main Content */
    children: ReactNode;

    // ==================== MINIMIZE FEATURE ====================
    /** Minimieren aktivieren? */
    minimizable?: boolean;
    /** Ist minimiert? (controlled) */
    isMinimized?: boolean;
    /** Minimize Toggle Handler */
    onMinimizeToggle?: (minimized: boolean) => void;
    /** Label für minimierten Tab */
    minimizedLabel?: string;
    /** Farbe für minimierten Tab (tailwind bg class) */
    minimizedColor?: string;

    // ==================== RESIZE FEATURE ====================
    /** Resizing durch Ziehen am linken Rand aktivieren? */
    resizable?: boolean;
    /** Minimale Breite beim Resizing (default: width prop) */
    minWidth?: number;
    /** Maximale Breite beim Resizing (default: 80% des Bildschirms) */
    maxWidth?: number;
}

// ==================== COMPONENT ====================

export function SidePanel({
    isOpen,
    onClose,
    width = 600,
    headerIcon: HeaderIcon,
    title,
    subtitle,
    customHeader,
    headerGradient,
    headerIconBg = 'bg-blue-600/20',
    infoBar,
    tabs,
    activeTab,
    onTabChange,
    navWidth = 180,
    navHeader,
    footer,
    keyboardHints,
    children,
    // Minimize props
    minimizable = false,
    isMinimized = false,
    onMinimizeToggle,
    minimizedLabel,
    minimizedColor = 'bg-blue-600/90 hover:bg-blue-500',
    // Resize props
    resizable = false,
    minWidth,
    maxWidth,
}: SidePanelProps) {

    // ==================== RESIZE STATE ====================
    const [currentWidth, setCurrentWidth] = useState(width);
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

    // Calculate min/max widths
    const effectiveMinWidth = minWidth ?? width;
    const effectiveMaxWidth = maxWidth ?? (typeof window !== 'undefined' ? window.innerWidth * 0.8 : 1500);

    // Handle resize mouse events
    useEffect(() => {
        if (!resizable || !isOpen) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!resizeRef.current) return;

            e.preventDefault();
            const deltaX = resizeRef.current.startX - e.clientX;
            const newWidth = Math.min(
                effectiveMaxWidth,
                Math.max(effectiveMinWidth, resizeRef.current.startWidth + deltaX)
            );
            setCurrentWidth(newWidth);
        };

        const handleMouseUp = () => {
            resizeRef.current = null;
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizable, isOpen, isResizing, effectiveMinWidth, effectiveMaxWidth]);

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        resizeRef.current = { startX: e.clientX, startWidth: currentWidth };
        setIsResizing(true);
    }, [currentWidth]);

    // Reset width when panel closes
    useEffect(() => {
        if (!isOpen) {
            setCurrentWidth(width);
        }
    }, [isOpen, width]);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // H = Minimieren/Maximieren
            if (minimizable && (e.key === 'h' || e.key === 'H')) {
                e.preventDefault();
                onMinimizeToggle?.(!isMinimized);
            }

            // ESC handling is done by parent component
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, minimizable, isMinimized, onMinimizeToggle]);

    const handleToggleMinimize = useCallback(() => {
        onMinimizeToggle?.(!isMinimized);
    }, [isMinimized, onMinimizeToggle]);

    if (!isOpen) return null;

    const hasNavigation = tabs && tabs.length > 0;

    // Build keyboard hints including minimize if enabled
    const allKeyboardHints = [
        ...(minimizable ? [{ key: 'H', label: 'Minimieren' }] : []),
        ...(keyboardHints || []),
    ];

    // ==================== MINIMIZED VIEW ====================
    if (minimizable && isMinimized) {
        return (
            <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
                <button
                    onClick={handleToggleMinimize}
                    className={clsx(
                        "text-white px-3 py-6 rounded-l-xl shadow-xl flex flex-col items-center gap-2 transition-all hover:px-4",
                        minimizedColor
                    )}
                >
                    <HeaderIcon className="w-6 h-6" />
                    <ChevronLeft className="w-4 h-4" />
                    <span
                        className="text-xs font-medium"
                        style={{ writingMode: 'vertical-rl' }}
                    >
                        {minimizedLabel || title}
                    </span>
                </button>

                {/* Hint */}
                <div className="fixed bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                    <span className="text-zinc-400">H</span> = Öffnen
                </div>
            </div>
        );
    }

    // ==================== FULL PANEL VIEW ====================
    return (
        <div
            className="fixed inset-y-0 right-0 flex z-50 pointer-events-auto"
            style={{ width: `${currentWidth}px` }}
        >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/70 to-transparent -left-32 pointer-events-none" />

            {/* Resize Handle */}
            {resizable && (
                <div
                    onMouseDown={handleResizeStart}
                    className={clsx(
                        "absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 group flex items-center justify-center",
                        isResizing ? "bg-blue-500/30" : "hover:bg-blue-500/20"
                    )}
                >
                    <div className={clsx(
                        "h-16 w-1 rounded-full transition-all",
                        isResizing ? "bg-blue-400" : "bg-zinc-600 group-hover:bg-blue-400"
                    )} />
                </div>
            )}

            {/* Main Panel */}
            <div className="relative flex flex-col bg-zinc-900/95 border-l border-zinc-700 w-full">
                {/* Header */}
                {customHeader ? (
                    customHeader
                ) : (
                    <div className={clsx(
                        "p-4 border-b border-zinc-700 flex items-center justify-between",
                        headerGradient ? `bg-gradient-to-r ${headerGradient}` : "bg-zinc-900"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                headerGradient ? "bg-white/20" : headerIconBg
                            )}>
                                <HeaderIcon className={clsx(
                                    "w-5 h-5",
                                    headerGradient ? "text-white" : "text-blue-400"
                                )} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">{title}</h2>
                                {subtitle && (
                                    <p className={clsx(
                                        "text-xs",
                                        headerGradient ? "text-white/60" : "text-zinc-400"
                                    )}>
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {minimizable && (
                                <button
                                    onClick={handleToggleMinimize}
                                    className={clsx(
                                        "p-2 rounded-lg transition-all",
                                        headerGradient
                                            ? "bg-white/20 hover:bg-white/30 text-white"
                                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                                    )}
                                    title="Minimieren (H)"
                                >
                                    <Minimize2 className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className={clsx(
                                    "p-2 rounded-lg transition-all",
                                    headerGradient
                                        ? "bg-white/20 hover:bg-red-600 text-white"
                                        : "bg-red-600/80 hover:bg-red-600 text-white"
                                )}
                                title="Schließen (ESC)"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Info Bar (optional) */}
                {infoBar && (
                    <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
                        {infoBar}
                    </div>
                )}

                {/* Two-Column Layout or Single Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Navigation */}
                    {hasNavigation && (
                        <div
                            className="border-r border-zinc-700 overflow-y-auto bg-zinc-900/50 flex flex-col"
                            style={{ width: `${navWidth}px`, minWidth: `${navWidth}px` }}
                        >
                            {navHeader && (
                                <p className="text-xs text-zinc-500 uppercase tracking-wide px-3 py-2 border-b border-zinc-800">
                                    {navHeader}
                                </p>
                            )}
                            <nav className="flex-1">
                                {tabs.map((tab) => {
                                    const TabIcon = tab.icon;
                                    const isSelected = activeTab === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => onTabChange?.(tab.id)}
                                            className={clsx(
                                                'w-full flex items-center gap-2 px-3 py-2.5 transition-all text-sm',
                                                isSelected
                                                    ? 'bg-blue-600 text-white'
                                                    : 'hover:bg-zinc-800 text-zinc-300'
                                            )}
                                        >
                                            <TabIcon className="w-4 h-4 flex-shrink-0" />
                                            <span className="flex-1 text-left truncate">{tab.label}</span>
                                            {tab.indicator && (
                                                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                                            )}
                                            {tab.badge !== undefined && (
                                                <span className={clsx(
                                                    "px-1.5 py-0.5 text-xs rounded-full flex-shrink-0",
                                                    tab.badgeColor === 'red' && "bg-red-500 text-white",
                                                    tab.badgeColor === 'green' && "bg-green-500 text-white",
                                                    tab.badgeColor === 'blue' && "bg-blue-500 text-white",
                                                    tab.badgeColor === 'yellow' && "bg-yellow-500 text-black",
                                                    !tab.badgeColor && "bg-zinc-600 text-white"
                                                )}>
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    )}

                    {/* Right: Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4">
                            {children}
                        </div>
                    </div>
                </div>

                {/* Footer (optional) */}
                {footer && (
                    <div className="border-t border-zinc-700 bg-zinc-900">
                        {footer}
                    </div>
                )}

                {/* Keyboard Hints (optional) */}
                {allKeyboardHints.length > 0 && (
                    <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center gap-6 text-xs text-zinc-500">
                        {allKeyboardHints.map((hint, i) => (
                            <span key={i}>
                                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">{hint.key}</kbd> {hint.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== SUB-COMPONENTS ====================

/** Content Header für Tab-Inhalte */
export function SidePanelContentHeader({
    icon: Icon,
    title,
    count
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    count?: number;
}) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <Icon className="w-4 h-4 text-blue-400" />
            <span className="text-white font-medium">{title}</span>
            {count !== undefined && (
                <span className="text-xs text-zinc-500">({count})</span>
            )}
        </div>
    );
}

/** Info Box für Panel */
export function SidePanelInfoBox({
    children,
    variant = 'default'
}: {
    children: ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) {
    const variantClasses = {
        default: 'bg-zinc-800/50 border-zinc-700/50',
        success: 'bg-green-500/10 border-green-500/30',
        warning: 'bg-yellow-500/10 border-yellow-500/30',
        error: 'bg-red-500/10 border-red-500/30',
        info: 'bg-blue-500/10 border-blue-500/30',
    };

    return (
        <div className={clsx("rounded-xl p-4 border", variantClasses[variant])}>
            {children}
        </div>
    );
}

/** Stat Card für Statistiken */
export function SidePanelStatCard({
    icon: Icon,
    label,
    value,
    color = 'blue',
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'emerald';
}) {
    const colorClasses = {
        blue: 'bg-blue-500/20 text-blue-400',
        green: 'bg-green-500/20 text-green-400',
        yellow: 'bg-yellow-500/20 text-yellow-400',
        red: 'bg-red-500/20 text-red-400',
        purple: 'bg-purple-500/20 text-purple-400',
        emerald: 'bg-emerald-500/20 text-emerald-400',
    };

    return (
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colorClasses[color])}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="text-zinc-400 text-sm">{label}</div>
            <div className="text-white font-bold text-xl">{value}</div>
        </div>
    );
}

/** Footer mit Actions */
export function SidePanelFooter({
    left,
    right,
}: {
    left?: ReactNode;
    right?: ReactNode;
}) {
    return (
        <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                {left}
            </div>
            <div className="flex items-center gap-2">
                {right}
            </div>
        </div>
    );
}

export default SidePanel;
