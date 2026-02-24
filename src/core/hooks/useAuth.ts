import { useState, useEffect } from 'react';
import { User } from '../../features/auth/domain/User';
import { RemoteAuthRepository } from '../../features/auth/data/RemoteAuthRepository';
import {
    SignInAnonymouslyUseCase,
    SignInWithGoogleUseCase,
    SignInWithEmailUseCase,
    SignUpWithEmailUseCase,
    SendPasswordResetUseCase,
    SignOutUseCase,
    ObserveAuthStateUseCase
} from '../../features/auth/domain/usecases/AuthUseCases';

const repo = new RemoteAuthRepository();
const signInAnon = new SignInAnonymouslyUseCase(repo);
const signOut = new SignOutUseCase(repo);
const onAuthStateChanged = new ObserveAuthStateUseCase(repo);

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged.execute((u: User | null) => {
            setUser(u);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const loginAnonymously = async () => {
        try {
            await signInAnon.execute();
        } catch (e) {
            console.error(e);
        }
    };

    const logout = async () => {
        await signOut.execute();
    };

    return { user, loading, loginAnonymously, logout };
};
