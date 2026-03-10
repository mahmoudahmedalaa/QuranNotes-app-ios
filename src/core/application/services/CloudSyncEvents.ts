/**
 * CloudSyncEvents — Simple pub/sub for notifying React contexts
 * when CloudSync pulls remote data into AsyncStorage.
 *
 * Contexts subscribe with `onPull()` and re-load their state
 * whenever cloud data is written to local storage.
 */

type Listener = () => void;
const listeners = new Set<Listener>();

export const CloudSyncEvents = {
    /** Subscribe to pull events. Returns unsubscribe function. */
    onPull(listener: Listener): () => void {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    },

    /** Emit a pull event — called by CloudSyncService after pulling remote data. */
    emitPull(): void {
        listeners.forEach((fn) => {
            try { fn(); } catch (e) {
                if (__DEV__) console.warn('[CloudSyncEvents] Listener error:', e);
            }
        });
    },
};
