import { calculateQiblaDirection, getCardinalDirection, isNearKaaba } from './qibla';

describe('calculateQiblaDirection', () => {
    // Known Qibla bearings (approximate, ±2° tolerance)
    it('Cairo → ~136°', () => {
        const bearing = calculateQiblaDirection(30.0444, 31.2357);
        expect(bearing).toBeGreaterThan(134);
        expect(bearing).toBeLessThan(138);
    });

    it('New York → ~58°', () => {
        const bearing = calculateQiblaDirection(40.7128, -74.006);
        expect(bearing).toBeGreaterThan(56);
        expect(bearing).toBeLessThan(60);
    });

    it('Jakarta → ~295°', () => {
        const bearing = calculateQiblaDirection(-6.2088, 106.8456);
        expect(bearing).toBeGreaterThan(293);
        expect(bearing).toBeLessThan(297);
    });

    it('London → ~119°', () => {
        const bearing = calculateQiblaDirection(51.5074, -0.1278);
        expect(bearing).toBeGreaterThan(117);
        expect(bearing).toBeLessThan(121);
    });

    it('Tokyo → ~293°', () => {
        const bearing = calculateQiblaDirection(35.6762, 139.6503);
        expect(bearing).toBeGreaterThan(291);
        expect(bearing).toBeLessThan(295);
    });

    it('returns a value between 0 and 360', () => {
        const bearing = calculateQiblaDirection(-33.8688, 151.2093); // Sydney
        expect(bearing).toBeGreaterThanOrEqual(0);
        expect(bearing).toBeLessThan(360);
    });
});

describe('getCardinalDirection', () => {
    it('0° → N', () => expect(getCardinalDirection(0)).toBe('N'));
    it('45° → NE', () => expect(getCardinalDirection(45)).toBe('NE'));
    it('90° → E', () => expect(getCardinalDirection(90)).toBe('E'));
    it('135° → SE', () => expect(getCardinalDirection(135)).toBe('SE'));
    it('180° → S', () => expect(getCardinalDirection(180)).toBe('S'));
    it('225° → SW', () => expect(getCardinalDirection(225)).toBe('SW'));
    it('270° → W', () => expect(getCardinalDirection(270)).toBe('W'));
    it('315° → NW', () => expect(getCardinalDirection(315)).toBe('NW'));
    it('360° → N (wraps)', () => expect(getCardinalDirection(360)).toBe('N'));
});

describe('isNearKaaba', () => {
    it('returns true at Kaaba coordinates', () => {
        expect(isNearKaaba(21.4225, 39.8262)).toBe(true);
    });

    it('returns true within 1km of Kaaba', () => {
        // ~500m offset
        expect(isNearKaaba(21.4270, 39.8262)).toBe(true);
    });

    it('returns false far from Kaaba', () => {
        expect(isNearKaaba(30.0444, 31.2357)).toBe(false); // Cairo
    });
});
