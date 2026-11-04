import { useEffect, useState, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Car, Package, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Notification, NotifyType } from '../stores/nui.store';
import { useNuiStore } from '../stores/nui.store';

interface NotificationsProps {
    notifications: Notification[];
}

const ICONS: Record<NotifyType, React.ElementType> = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
    vehicle: Car,
    inventory: Package,
    progress: Loader2,
};

const COLORS: Record<NotifyType, { border: string; bg: string; icon: string; bar: string }> = {
    success: { border: 'border-green-500/50', bg: 'bg-green-500/10', icon: 'text-green-400', bar: 'bg-green-500' },
    error: { border: 'border-red-500/50', bg: 'bg-red-500/10', icon: 'text-red-400', bar: 'bg-red-500' },
    info: { border: 'border-blue-500/50', bg: 'bg-blue-500/10', icon: 'text-blue-400', bar: 'bg-blue-500' },
    warning: { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', icon: 'text-yellow-400', bar: 'bg-yellow-500' },
    vehicle: { border: 'border-purple-500/50', bg: 'bg-purple-500/10', icon: 'text-purple-400', bar: 'bg-purple-500' },
    inventory: { border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', icon: 'text-cyan-400', bar: 'bg-cyan-500' },
    progress: { border: 'border-blue-500/50', bg: 'bg-blue-500/10', icon: 'text-blue-400', bar: 'bg-blue-500' },
};

export function Notifications({ notifications }: NotificationsProps) {
    // Separate persistent notifications (duration === 0) from regular ones
    const persistentNotifications = notifications.filter(n => n.duration === 0 && n.type !== 'progress');
    const regularNotifications = notifications.filter(n => n.duration !== 0 || n.type === 'progress');

    return (
        <>
            {/* Persistent notifications - Top Left (e.g., YACA connection warning) */}
            {persistentNotifications.length > 0 && (
                <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 max-w-sm">
                    {persistentNotifications.map((notification) => (
                        <NotificationItem key={notification.id} notification={notification} isPersistent />
                    ))}
                </div>
            )}

            {/* Regular notifications - Centered above hotbar */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 max-w-md w-full px-4">
                {regularNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                ))}
            </div>
        </>
    );
}

function NotificationItem({ notification, isPersistent: _isPersistent = false }: { notification: Notification; isPersistent?: boolean }) {
    const removeNotification = useNuiStore((state) => state.removeNotification);
    const [timerProgress, setTimerProgress] = useState(100);
    const [isUpdated, setIsUpdated] = useState(false);
    const prevMessageRef = useRef(notification.message);
    const prevProgressRef = useRef(notification.progress);

    // Detect message changes (for update animation)
    useEffect(() => {
        if (prevMessageRef.current !== notification.message) {
            setIsUpdated(true);
            prevMessageRef.current = notification.message;
            const timeout = setTimeout(() => setIsUpdated(false), 500);
            return () => clearTimeout(timeout);
        }
    }, [notification.message]);

    // Detect progress changes (for update animation)
    useEffect(() => {
        if (notification.type === 'progress' && prevProgressRef.current !== notification.progress) {
            setIsUpdated(true);
            prevProgressRef.current = notification.progress;
            const timeout = setTimeout(() => setIsUpdated(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [notification.progress, notification.type]);

    // Timer progress bar countdown (only for non-progress notifications)
    useEffect(() => {
        if (notification.type === 'progress' || notification.duration === 0) return;

        const interval = setInterval(() => {
            const elapsed = Date.now() - notification.createdAt;
            const remaining = Math.max(0, 100 - (elapsed / notification.duration) * 100);
            setTimerProgress(remaining);
            if (remaining <= 0) {
                removeNotification(notification.id);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [notification.id, notification.duration, notification.createdAt, notification.type, removeNotification]);

    const Icon = ICONS[notification.type];
    const colors = COLORS[notification.type];
    const isProgress = notification.type === 'progress';
    const progressValue = notification.progress ?? 0;

    return (
        <div
            className={clsx(
                'relative glass rounded-lg p-3 overflow-hidden transition-all duration-200',
                'border',
                colors.border,
                colors.bg,
                isUpdated && 'ring-2 ring-white/50 scale-[1.02]'
            )}
            style={{
                animation: isUpdated ? 'none' : 'slideIn 0.3s ease-out'
            }}
        >
            <div className="flex items-start gap-3">
                <Icon className={clsx(
                    'w-5 h-5 shrink-0 mt-0.5',
                    colors.icon,
                    isProgress && 'animate-spin'
                )} />

                <div className="flex-1 min-w-0">
                    {notification.title && (
                        <p className="text-white font-medium text-sm mb-0.5">
                            {notification.title}
                        </p>
                    )}

                    {isProgress ? (
                        // Progress notification: show big progress bar
                        <div className="mt-1">
                            <div className="flex justify-between text-xs text-white/60 mb-1">
                                <span>{Math.round(progressValue)}%</span>
                                {notification.canCancel && (
                                    <span className="text-white/40">ESC zum Abbrechen</span>
                                )}
                            </div>
                            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                <div
                                    className={clsx(
                                        'h-full rounded-full transition-all duration-200',
                                        colors.bar
                                    )}
                                    style={{ width: `${progressValue}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className={clsx(
                            'text-sm transition-colors duration-200',
                            isUpdated ? 'text-white font-medium' : 'text-white/80'
                        )}>
                            {notification.message}
                        </p>
                    )}
                </div>

                {!isProgress && (
                    <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Timer bar (only for non-progress notifications) */}
            {!isProgress && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/30">
                    <div
                        className={clsx('h-full transition-all duration-50', colors.bar)}
                        style={{ width: `${timerProgress}%` }}
                    />
                </div>
            )}
        </div>
    );
}
