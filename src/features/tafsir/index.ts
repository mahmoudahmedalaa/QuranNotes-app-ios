/**
 * Tafsir Feature — Barrel export
 */
export { TafsirBottomSheet } from './presentation/TafsirBottomSheet';
export { SourcePicker } from './presentation/SourcePicker';
export { AiQueryInput } from './presentation/AiQueryInput';
export { getTafsirCommentary, clearTafsirCache } from './data/TafsirDataService';
export { summarizeTafsir, askAboutVerse, isAiAvailable } from './domain/TafsirService';
export type { TafsirSource, TafsirSheetData, TafsirCommentary, AiQueryResult } from './domain/types';
export { DEFAULT_TAFSIR_SOURCE, TAFSIR_SOURCE_LABELS } from './domain/types';
