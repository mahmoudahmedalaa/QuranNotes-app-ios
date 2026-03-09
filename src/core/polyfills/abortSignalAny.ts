/**
 * Polyfill for AbortSignal.any() — required by firebase/ai SDK.
 *
 * React Native's Hermes engine does not implement AbortSignal.any(),
 * which was added to the Web platform in 2023. The Firebase AI Logic SDK
 * uses it internally for request cancellation. This polyfill provides
 * a compatible implementation.
 *
 * MUST be imported before any firebase/ai imports.
 */

if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any !== 'function') {
    (AbortSignal as any).any = function any(signals: AbortSignal[]): AbortSignal {
        const controller = new AbortController();

        for (const signal of signals) {
            if (signal.aborted) {
                controller.abort(signal.reason);
                return controller.signal;
            }

            signal.addEventListener(
                'abort',
                () => controller.abort(signal.reason),
                { once: true },
            );
        }

        return controller.signal;
    };
}
