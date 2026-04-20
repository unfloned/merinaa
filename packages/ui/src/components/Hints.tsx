import { clsx } from 'clsx';
import { Move, Hand, Key, Car, Package, Info, AlertCircle } from 'lucide-react';
import type { Hint } from '../stores/nui.store';

interface HintsProps {
    hints: Hint[];
}

// Map icon names to components
const ICON_MAP: Record<string, React.ElementType> = {
    move: Move,
    hand: Hand,
    key: Key,
    car: Car,
    package: Package,
    info: Info,
    alert: AlertCircle,
};

export function Hints({ hints }: HintsProps) {
    if (hints.length === 0) return null;

    return (
        // Position: Top center
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-2">
            {hints.map((hint) => (
                <HintItem key={hint.id} hint={hint} />
            ))}
        </div>
    );
}

function HintItem({ hint }: { hint: Hint }) {
    const Icon = hint.icon ? ICON_MAP[hint.icon] || Info : Info;

    return (
        <div className="glass rounded-lg px-4 py-2 border border-white/20 bg-black/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-white/70" />

                <span className="text-white/90 text-sm">
                    {hint.message}
                </span>

                {hint.keyBind && (
                    <kbd className={clsx(
                        'px-2 py-0.5 rounded text-xs font-mono font-bold',
                        'bg-white/20 text-white border border-white/30'
                    )}>
                        {hint.keyBind}
                    </kbd>
                )}
            </div>
        </div>
    );
}
