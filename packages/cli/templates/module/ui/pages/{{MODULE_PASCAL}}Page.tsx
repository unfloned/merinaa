import { useNuiEvent } from '@merinaa/ui/hooks';
import { useState, useCallback } from 'react';

/**
 * NUI page for {{MODULE_PASCAL}}Module.
 *
 * Opens when the client calls `showPage('{{MODULE_CAMEL}}', payload)`.
 * The framework has already grabbed NUI focus and started the movement /
 * camera lock — all this component has to do is listen for its event
 * and render when it's its turn.
 */
export default function {{MODULE_PASCAL}}Page() {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState<unknown>(null);

    useNuiEvent<unknown>('{{MODULE_CAMEL}}:open', useCallback((payload) => {
        setData(payload);
        setVisible(true);
    }, []));

    useNuiEvent('{{MODULE_CAMEL}}:close', useCallback(() => {
        setVisible(false);
    }, []));

    if (!visible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-slate-900/90 p-6 text-white shadow-xl backdrop-blur">
                <h2 className="text-xl font-bold">{{MODULE_PASCAL}}</h2>
                <p className="mt-2 text-sm text-slate-400">
                    Edit <code>modules/{{MODULE_NAME}}/ui/pages/{{MODULE_PASCAL}}Page.tsx</code>
                </p>
            </div>
        </div>
    );
}
