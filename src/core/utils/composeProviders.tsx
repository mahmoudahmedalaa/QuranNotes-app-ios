import React from 'react';

/**
 * Composes an ordered array of React context providers into a single
 * wrapper component, eliminating the "Provider Pyramid of Doom".
 *
 * Providers are nested in array order (first = outermost).
 *
 * @example
 * const AppProviders = composeProviders([AuthProvider, ThemeProvider]);
 * // equivalent to:
 * // <AuthProvider><ThemeProvider>{children}</ThemeProvider></AuthProvider>
 */
export function composeProviders(
    providers: Array<React.ComponentType<{ children: React.ReactNode }>>,
): React.FC<{ children: React.ReactNode }> {
    return function ComposedProviders({ children }: { children: React.ReactNode }) {
        return providers.reduceRight<React.ReactNode>(
            (acc, Provider) => <Provider>{acc}</Provider>,
            children,
        ) as React.ReactElement;
    };
}
