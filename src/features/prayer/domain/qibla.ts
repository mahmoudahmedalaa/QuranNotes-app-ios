/**
 * qibla.ts — Pure math functions for Qibla direction calculation.
 * Zero dependencies. Uses Great Circle Bearing formula.
 */

/** Kaaba coordinates in Makkah, Saudi Arabia */
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

/** Convert degrees to radians */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate the Qibla direction (bearing) from a given location.
 * Uses the Great Circle Bearing formula from user's position to Kaaba.
 *
 * @param lat - User's latitude in degrees
 * @param lng - User's longitude in degrees
 * @returns Bearing in degrees (0-360, clockwise from true north)
 */
export function calculateQiblaDirection(lat: number, lng: number): number {
    const kaabaLat = toRadians(KAABA_LAT);
    const kaabaLng = toRadians(KAABA_LNG);
    const userLat = toRadians(lat);
    const userLng = toRadians(lng);

    const dLng = kaabaLng - userLng;

    const x = Math.sin(dLng) * Math.cos(kaabaLat);
    const y =
        Math.cos(userLat) * Math.sin(kaabaLat) -
        Math.sin(userLat) * Math.cos(kaabaLat) * Math.cos(dLng);

    let bearing = Math.atan2(x, y) * (180 / Math.PI);
    return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Get the cardinal/intercardinal direction label for a bearing.
 *
 * @param degrees - Bearing in degrees (0-360)
 * @returns Cardinal direction string (e.g., "N", "NE", "SW")
 */
export function getCardinalDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const normalized = ((degrees % 360) + 360) % 360;
    const index = Math.round(normalized / 45) % 8;
    return directions[index];
}

/**
 * Check if user is within ~1 km of the Kaaba.
 * Uses the Haversine formula for distance calculation.
 *
 * @param lat - User's latitude in degrees
 * @param lng - User's longitude in degrees
 * @returns true if within approximately 1 km of the Kaaba
 */
export function isNearKaaba(lat: number, lng: number): boolean {
    const R = 6371; // Earth radius in km
    const dLat = toRadians(KAABA_LAT - lat);
    const dLng = toRadians(KAABA_LNG - lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat)) *
            Math.cos(toRadians(KAABA_LAT)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance < 1; // Less than 1 km
}
