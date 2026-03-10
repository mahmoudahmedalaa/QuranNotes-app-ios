import { useEffect } from 'react';
import { useAuth } from '../../features/auth/infrastructure/AuthContext';
import { usePro } from '../../features/auth/infrastructure/ProContext';
import { SyncService } from '../application/services/SyncService';
import { CloudSyncService } from '../application/services/CloudSyncService';

export const useSync = () => {
    const { user } = useAuth();
    const { isPro } = usePro();

    useEffect(() => {
        if (user && !user.isAnonymous) {
            const syncService = new SyncService(user.id);
            syncService.syncAll();

            // Cloud sync (settings, mood, adhkar, etc.) — Pro only
            if (isPro) {
                const cloudSync = new CloudSyncService(user.id);
                cloudSync.syncAll();
            }

            // Background sync every 10 minutes
            const interval = setInterval(() => {
                syncService.syncAll();
                if (isPro) {
                    const cloudSync = new CloudSyncService(user.id);
                    cloudSync.syncAll();
                }
            }, 10 * 60 * 1000);

            return () => clearInterval(interval);
        }
    }, [user, isPro]);
};
