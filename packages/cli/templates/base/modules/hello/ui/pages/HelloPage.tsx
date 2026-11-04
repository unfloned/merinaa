import { useNuiEvent, fetchNui } from '@merinaa/ui/hooks';
import { useState, useCallback } from 'react';

/**
 * Hello page — opens when the client calls `showPage('hello', { payload: { name } })`.
 *
 * The component manages its own visibility via `useNuiEvent('hello:open')` /
 * `useNuiEvent('hello:close')`. The framework has already done:
 *   - SetNuiFocus(true, true)
 *   - Started the movement/camera-lock tick loop
 *   - Bound Escape to hidePage()
 *
 * All this component has to do is render when it's its turn.
 */
export default function HelloPage() {
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState<string>('stranger');

    useNuiEvent<{ payload: { name: string } }>('hello:open', useCallback((data) => {
        setName(data?.payload?.name ?? 'stranger');
        setVisible(true);
    }, []));

    useNuiEvent('hello:close', useCallback(() => {
        setVisible(false);
    }, []));

    if (!visible) return null;

    async function onGreet() {
        const result = await fetchNui<{ name: string }, string>('hello:greet', { name });
        alert(result);
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur">
            <div className="rounded-lg bg-slate-900/95 p-8 text-white shadow-2xl">
                <h2 className="text-2xl font-bold">Hello, {name}!</h2>
                <p className="mt-2 text-sm text-slate-400">
                    Edit <code>modules/hello/ui/pages/HelloPage.tsx</code> to make this yours.
                </p>
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onGreet}
                        className="rounded-sm bg-sky-500 px-4 py-2 text-sm font-medium hover:bg-sky-600"
                    >
                        Greet via server
                    </button>
                    <button
                        onClick={() => setVisible(false)}
                        className="rounded-sm bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
