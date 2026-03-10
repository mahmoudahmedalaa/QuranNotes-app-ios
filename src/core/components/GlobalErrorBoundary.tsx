/**
 * GlobalErrorBoundary — Catches all uncaught JS errors in the React tree
 * and shows a recovery UI instead of killing the app.
 *
 * This is the single most important stability measure for production.
 */
import React, { Component, ErrorInfo } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to console in dev, could send to a crash reporter in prod
        if (__DEV__) console.error('[GlobalErrorBoundary] Uncaught error:', error, errorInfo);
    }

    handleRestart = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={styles.container}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.emoji}>🤲</Text>
                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.subtitle}>
                            We&apos;re sorry — an unexpected error occurred. Please try again.
                        </Text>
                        {__DEV__ && this.state.error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText} numberOfLines={8}>
                                    {this.state.error.message}
                                </Text>
                            </View>
                        )}
                        <Pressable
                            onPress={this.handleRestart}
                            style={({ pressed }) => [
                                styles.button,
                                pressed && { opacity: 0.8 },
                            ]}
                        >
                            <Text style={styles.buttonText}>Try Again</Text>
                        </Pressable>
                    </ScrollView>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAF8',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1A1D21',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    errorBox: {
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        width: '100%',
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#DC2626',
    },
    button: {
        backgroundColor: '#1A1D21',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 28,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
