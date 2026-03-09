export interface Note {
    id: string;
    surahId: number;
    verseId?: number;
    content: string;
    folderId?: string;
    isPinned?: boolean;
    tags?: string[];
    highlightColor?: string;
    createdAt: Date;
    updatedAt: Date;
}
