import { create } from 'zustand';

export type NotifyType = 'success' | 'error' | 'info' | 'warning' | 'vehicle' | 'inventory' | 'progress';

export interface Notification {
    id: string;
    message: string;
    type: NotifyType;
    duration: number;
    title?: string;
    createdAt: number;
    progress?: number; // 0-100 for progress notifications
    canCancel?: boolean; // Show cancel hint for progress
}

// Hints are persistent messages (no countdown) - for actions like pushing, carrying, etc.
export interface Hint {
    id: string;
    message: string;
    icon?: string; // lucide icon name
    keyBind?: string; // e.g. "E" or "SHIFT"
}

export interface PlayerData {
    id: string;
    name: string;
    money: {
        cash: number;
        bank: number;
    };
    job: {
        name: string;
        label: string;
        grade: number;
        gradeName: string;
        onDuty: boolean;
    };
    metadata: {
        health: number;
        armor: number;
        hunger: number;
        thirst: number;
        stress: number;
    };
}

interface DeathState {
    isDead: boolean;
    timer: number;
    canRespawn: boolean;
}

export interface CharacterPreview {
    id: string;
    slot: number;
    firstName: string;
    lastName: string;
    gender: number;
    jobLabel: string;
    cash: number;
    bank: number;
    lastPlayed: string;
    playTime: number;
}

interface CharacterSelectState {
    isOpen: boolean;
    characters: CharacterPreview[];
    maxSlots: number;
    selectedId: string | null;
}

interface NuiState {
    // Notifications
    notifications: Notification[];
    addNotification: (notification: Notification) => void;
    removeNotification: (id: string) => void;
    updateNotificationProgress: (id: string, progress: number) => void;
    clearNotifications: () => void;

    // Hints (persistent, no countdown)
    hints: Hint[];
    showHint: (hint: Hint) => void;
    hideHint: (id: string) => void;
    clearHints: () => void;

    // Player Data
    playerData: PlayerData | null;
    setPlayerData: (data: PlayerData) => void;

    // Loading
    isLoading: boolean;
    loadingMessage?: string;
    setLoading: (loading: boolean, message?: string) => void;

    // UI State
    currentPage: string | null;
    setCurrentPage: (page: string | null) => void;

    // Death State
    death: DeathState;
    setDeathState: (state: Partial<DeathState>) => void;
    showDeath: (timer: number) => void;
    hideDeath: () => void;

    // Character Selection State
    characterSelect: CharacterSelectState;
    setCharacterSelect: (state: Partial<CharacterSelectState>) => void;
    openCharacterSelect: (characters: CharacterPreview[], maxSlots: number) => void;
    closeCharacterSelect: () => void;
    selectCharacter: (id: string | null) => void;
}

export const useNuiStore = create<NuiState>((set) => ({
    // Notifications
    notifications: [],
    addNotification: (notification) =>
        set((state) => {
            const existingIndex = state.notifications.findIndex(n => n.id === notification.id);
            if (existingIndex !== -1) {
                // Update existing notification with same ID (reset timer)
                const updated = [...state.notifications];
                updated[existingIndex] = { ...notification, createdAt: Date.now() };
                return { notifications: updated };
            }
            // Add new notification (max 5)
            const newList = [{ ...notification, createdAt: Date.now() }, ...state.notifications];
            return { notifications: newList.slice(0, 5) };
        }),
    removeNotification: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),
    updateNotificationProgress: (id, progress) =>
        set((state) => {
            const existingIndex = state.notifications.findIndex(n => n.id === id);
            if (existingIndex !== -1) {
                const updated = [...state.notifications];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    progress,
                    message: `${Math.round(progress)}%`,
                };
                return { notifications: updated };
            }
            return state;
        }),
    clearNotifications: () => set({ notifications: [] }),

    // Hints (persistent, no countdown)
    hints: [],
    showHint: (hint) =>
        set((state) => {
            const existingIndex = state.hints.findIndex(h => h.id === hint.id);
            if (existingIndex !== -1) {
                // Update existing hint
                const updated = [...state.hints];
                updated[existingIndex] = hint;
                return { hints: updated };
            }
            return { hints: [...state.hints, hint] };
        }),
    hideHint: (id) =>
        set((state) => ({
            hints: state.hints.filter((h) => h.id !== id),
        })),
    clearHints: () => set({ hints: [] }),

    // Player Data
    playerData: null,
    setPlayerData: (data) => set({ playerData: data }),

    // Loading
    isLoading: false,
    loadingMessage: undefined,
    setLoading: (loading, message) =>
        set({ isLoading: loading, loadingMessage: message }),

    // UI State
    currentPage: null,
    setCurrentPage: (page) => set({ currentPage: page }),

    // Death State
    death: {
        isDead: false,
        timer: 0,
        canRespawn: false,
    },
    setDeathState: (state) =>
        set((prev) => ({
            death: { ...prev.death, ...state },
        })),
    showDeath: (timer) =>
        set({
            death: {
                isDead: true,
                timer,
                canRespawn: timer <= 0,
            },
        }),
    hideDeath: () =>
        set({
            death: {
                isDead: false,
                timer: 0,
                canRespawn: false,
            },
        }),

    // Character Selection State
    characterSelect: {
        isOpen: false,
        characters: [],
        maxSlots: 3,
        selectedId: null,
    },
    setCharacterSelect: (state) =>
        set((prev) => ({
            characterSelect: { ...prev.characterSelect, ...state },
        })),
    openCharacterSelect: (characters, maxSlots) =>
        set({
            characterSelect: {
                isOpen: true,
                characters,
                maxSlots,
                selectedId: null,
            },
        }),
    closeCharacterSelect: () =>
        set((prev) => ({
            characterSelect: { ...prev.characterSelect, isOpen: false },
        })),
    selectCharacter: (id) =>
        set((prev) => ({
            characterSelect: { ...prev.characterSelect, selectedId: id },
        })),
}));
