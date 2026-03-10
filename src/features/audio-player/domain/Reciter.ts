export interface Reciter {
    id: string;
    name: string;
    subfolder: string; // Used for API URL construction (e.g., 'ar.alafasy')
    cdnFolder: string; // EveryAyah CDN folder name (e.g., 'Alafasy_128kbps')
    /** Quran.com chapter_recitations API reciter ID — enables full-surah gapless audio */
    quranComId?: number;
}

/**
 * Reciters with quranComId get full-surah audio from Quran.com API (zero gaps).
 * Reciters without quranComId fall back to per-verse MP3s from everyayah.com.
 *
 * Quran.com IDs verified via: GET /api/v4/chapter_recitations/{id}/1
 * EveryAyah available reciters: https://everyayah.com/data/
 */
export const RECITERS: Reciter[] = [
    {
        id: 'alafasy',
        name: 'Mishary Rashid Alafasy',
        subfolder: 'ar.alafasy',
        cdnFolder: 'Alafasy_128kbps',
        quranComId: 7,
    },
    {
        id: 'abdulbasit',
        name: 'Abdul Basit (Murattal)',
        subfolder: 'ar.abdulbasit',
        cdnFolder: 'Abdul_Basit_Murattal_192kbps',
        quranComId: 2,
    },
    {
        id: 'abdulbasit_mujawwad',
        name: 'Abdul Basit (Mujawwad)',
        subfolder: 'ar.abdulbasit',
        cdnFolder: 'Abdul_Basit_Mujawwad_128kbps',
        quranComId: 1,
    },
    {
        id: 'minshawy',
        name: 'Mohamed Siddiq Al-Minshawi',
        subfolder: 'ar.minshawi',
        cdnFolder: 'Minshawy_Murattal_128kbps',
        quranComId: 9,
    },
    {
        id: 'minshawy_mujawwad',
        name: 'Al-Minshawi (Mujawwad)',
        subfolder: 'ar.minshawi',
        cdnFolder: 'Minshawy_Mujawwad_192kbps',
        quranComId: 8,
    },
    {
        id: 'husary',
        name: 'Mahmoud Khalil Al-Husary',
        subfolder: 'ar.husary',
        cdnFolder: 'Husary_128kbps',
        quranComId: 6,
    },
    {
        id: 'sudais',
        name: 'Abdurrahman As-Sudais',
        subfolder: 'ar.sudais',
        cdnFolder: 'Abdurrahmaan_As-Sudais_192kbps',
        quranComId: 3,
    },
    {
        id: 'shuraym',
        name: 'Saud Al-Shuraym',
        subfolder: 'ar.shuraym',
        cdnFolder: 'Saood_ash-Shuraym_128kbps',
        quranComId: 10,
    },
    {
        id: 'ghamadi',
        name: 'Saad Al-Ghamdi',
        subfolder: 'ar.ghamadi',
        cdnFolder: 'Ghamadi_40kbps',
        quranComId: 13,
    },
    {
        id: 'maher',
        name: 'Maher Al-Muaiqly',
        subfolder: 'ar.maher',
        cdnFolder: 'MaherAlMuaiqly128kbps',
        // No quranComId — falls back to per-verse everyayah.com
    },
    {
        id: 'ajamy',
        name: 'Ahmed Al-Ajamy',
        subfolder: 'ar.ajamy',
        cdnFolder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net',
        // No quranComId — falls back to per-verse everyayah.com
    },
    {
        id: 'hudhaify',
        name: 'Ali Al-Hudhaify',
        subfolder: 'ar.hudhaify',
        cdnFolder: 'Hudhaify_128kbps',
        // No quranComId — falls back to per-verse everyayah.com
    },
    {
        id: 'hussary_mujawwad',
        name: 'Al-Husary (Muallim)',
        subfolder: 'ar.husary',
        cdnFolder: 'Husary_128kbps_Mujawwad',
        quranComId: 12,
    },
    {
        id: 'alijaber',
        name: 'Ali Jaber',
        subfolder: 'ar.jaber',
        cdnFolder: 'Ali_Jaber_64kbps',
        // No quranComId — falls back to per-verse everyayah.com
    },
    // ── New reciters added from Quran.com API (full-surah gapless available) ──
    {
        id: 'shatri',
        name: 'Abu Bakr Al-Shatri',
        subfolder: 'ar.shatri',
        cdnFolder: 'Abu_Bakr_Ash-Shaatree_128kbps',
        quranComId: 4,
    },
    {
        id: 'rifai',
        name: 'Hani Ar-Rifai',
        subfolder: 'ar.rifai',
        cdnFolder: 'Hani_Rifai_192kbps',
        quranComId: 5,
    },
    {
        id: 'tablawi',
        name: 'Mohamed Al-Tablawi',
        subfolder: 'ar.tablawi',
        cdnFolder: 'Mohammad_al_Tablaway_128kbps',
        quranComId: 11,
    },
];

export const DEFAULT_RECITER = RECITERS[0];

// Helper to get reciter by ID
export const getReciterById = (id: string): Reciter => {
    return RECITERS.find(r => r.id === id) || DEFAULT_RECITER;
};

/** Check if a reciter supports full-surah gapless audio via Quran.com */
export const hasFullSurahAudio = (reciter: Reciter): boolean => {
    return reciter.quranComId !== undefined;
};
