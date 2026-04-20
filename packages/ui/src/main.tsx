import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// Notify client that UI is ready after React has mounted
// The spawn-handler queues events until this callback is received
setTimeout(() => {
    fetch(`https://${(window as any).GetParentResourceName?.() ?? 'fivem-framework'}/ui:ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    }).catch(() => {
        // Ignore errors in development
    });

    console.log('[UI] React mounted, sent ui:ready to client');
}, 100);
