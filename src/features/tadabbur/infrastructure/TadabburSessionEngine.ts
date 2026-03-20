/**
 * TadabburSessionEngine — Pure state-machine for Tadabbur session flow.
 * No React dependency — can be tested independently.
 *
 * Phases:  IDLE → OPENING → PLAYING → PAUSING → RESPONDING → ADVANCE → CLOSING
 *                                                                     ↑       |
 *                                                                     └───────┘  (next verse)
 */
import {
    SessionPhase,
    SessionState,
    Reflection,
    TadabburPassage,
    ReflectionPrompt,
} from '../domain/entities/Reflection';
import type { MoodType } from '../../../core/domain/entities/Mood';

/** Actions the engine can process */
export type SessionAction =
    | { type: 'START'; passages: TadabburPassage[]; intent?: import('../domain/entities/Reflection').ReflectionIntent; verseSelections?: import('../domain/entities/Reflection').VerseSelection[]; moodType?: MoodType }
    | { type: 'OPENING_COMPLETE' }
    | { type: 'VERSE_COMPLETE' }
    | { type: 'PAUSE_COMPLETE' }
    | { type: 'PROMPT_SELECTED'; prompt: ReflectionPrompt }
    | { type: 'RESPONSE_SUBMITTED'; reflection: Reflection }
    | { type: 'SKIP_VERSE' }
    | { type: 'ADVANCE_NEXT' }
    | { type: 'FINISH' }
    | { type: 'ABORT' };

export const INITIAL_STATE: SessionState = {
    phase: 'IDLE',
    verseSelections: [],
    currentVerseIndex: 0,
    totalVerses: 0,
    startTime: 0,
    closingTime: 0,
    reflections: [],
};

/**
 * Pure reducer — returns the next session state.
 */
export function sessionReducer(
    state: SessionState,
    action: SessionAction,
): SessionState {
    switch (action.type) {
        case 'START':
            return {
                phase: 'OPENING',
                intent: action.intent,
                verseSelections: action.verseSelections || [],
                currentVerseIndex: 0,
                totalVerses: action.passages.length,
                startTime: Date.now(),
                closingTime: 0,
                reflections: [],
                moodType: action.moodType,
            };

        case 'OPENING_COMPLETE':
            if (state.phase !== 'OPENING') return state;
            return { ...state, phase: 'PLAYING' };

        case 'VERSE_COMPLETE':
            if (state.phase !== 'PLAYING') return state;
            return { ...state, phase: 'PAUSING' };

        case 'PAUSE_COMPLETE':
            if (state.phase !== 'PAUSING') return state;
            return { ...state, phase: 'RESPONDING' };

        case 'PROMPT_SELECTED':
            // No-op in this reducer — prompt selection is handled in the UI layer
            return state;

        case 'RESPONSE_SUBMITTED':
            if (state.phase !== 'RESPONDING') return state;
            return {
                ...state,
                phase: 'ADVANCE',
                reflections: [...state.reflections, action.reflection],
            };

        case 'SKIP_VERSE':
            if (state.phase === 'PLAYING' || state.phase === 'PAUSING' || state.phase === 'RESPONDING') {
                // Move to ADVANCE without saving a reflection
                return { ...state, phase: 'ADVANCE' };
            }
            return state;

        case 'ADVANCE_NEXT': {
            if (state.phase !== 'ADVANCE') return state;
            const nextIndex = state.currentVerseIndex + 1;
            if (nextIndex >= state.totalVerses) {
                // Freeze time when entering CLOSING — prevents inflation
                return { ...state, phase: 'CLOSING', closingTime: Date.now() };
            }
            return { ...state, phase: 'PLAYING', currentVerseIndex: nextIndex };
        }

        case 'FINISH':
            return { ...INITIAL_STATE };

        case 'ABORT':
            return { ...INITIAL_STATE };

        default:
            return state;
    }
}

/** Helper: compute session duration in seconds.
 *  Uses closingTime when available so the timer doesn't tick while
 *  the user browses the closing screen. */
export function getSessionDuration(state: SessionState): number {
    if (state.startTime === 0) return 0;
    const endTime = state.closingTime > 0 ? state.closingTime : Date.now();
    return Math.round((endTime - state.startTime) / 1000);
}
