declare module 'react-native-shared-group-preferences' {
    const SharedGroupPreferences: {
        setItem: (key: string, value: string, group: string) => Promise<void>;
        getItem: (key: string, group: string) => Promise<string | null>;
    };
    export default SharedGroupPreferences;
}
