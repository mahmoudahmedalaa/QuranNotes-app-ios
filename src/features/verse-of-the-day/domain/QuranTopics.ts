/**
 * QuranTopics — Curated topic categories with hand-picked verses.
 * Each topic has 5-8 verses covering key themes from the Quran.
 */

export interface TopicVerse {
    surah: number;
    verse: number;
    surahName: string;
    arabicSnippet: string;
    translation: string;
}

export interface QuranTopic {
    id: string;
    name: string;
    arabicTitle: string;
    icon: string;
    color: string;
    description: string;
    verses: TopicVerse[];
}

export const QURAN_TOPICS: QuranTopic[] = [
    {
        id: 'patience',
        name: 'Patience',
        arabicTitle: 'الصبر',
        icon: 'hand-left-outline',
        color: '#5B7FFF',
        description: 'Verses about enduring hardship with faith and steadfastness.',
        verses: [
            { surah: 2, verse: 153, surahName: 'Al-Baqarah', arabicSnippet: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ', translation: 'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.' },
            { surah: 2, verse: 155, surahName: 'Al-Baqarah', arabicSnippet: 'وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ', translation: 'And We will surely test you with something of fear and hunger and a loss of wealth and lives and fruits, but give good tidings to the patient.' },
            { surah: 94, verse: 5, surahName: 'Ash-Sharh', arabicSnippet: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'For indeed, with hardship [will be] ease.' },
            { surah: 94, verse: 6, surahName: 'Ash-Sharh', arabicSnippet: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship [will be] ease.' },
            { surah: 39, verse: 10, surahName: 'Az-Zumar', arabicSnippet: 'إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ', translation: 'Indeed, the patient will be given their reward without account.' },
            { surah: 3, verse: 200, surahName: 'Ali Imran', arabicSnippet: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا', translation: 'O you who have believed, be patient and endure and remain stationed and fear Allah that you may be successful.' },
        ],
    },
    {
        id: 'gratitude',
        name: 'Gratitude',
        arabicTitle: 'الشكر',
        icon: 'flower-outline',
        color: '#10B981',
        description: 'Verses about thankfulness to Allah for His blessings.',
        verses: [
            { surah: 14, verse: 7, surahName: 'Ibrahim', arabicSnippet: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', translation: 'If you are grateful, I will surely increase you [in favor].' },
            { surah: 16, verse: 114, surahName: 'An-Nahl', arabicSnippet: 'فَكُلُوا مِمَّا رَزَقَكُمُ اللَّهُ حَلَالًا طَيِّبًا وَاشْكُرُوا نِعْمَتَ اللَّهِ', translation: 'So eat of the lawful and good food which Allah has provided for you, and be grateful for the favor of Allah.' },
            { surah: 31, verse: 12, surahName: 'Luqman', arabicSnippet: 'وَلَقَدْ آتَيْنَا لُقْمَانَ الْحِكْمَةَ أَنِ اشْكُرْ لِلَّهِ', translation: 'And We had certainly given Luqman wisdom [and said], "Be grateful to Allah."' },
            { surah: 2, verse: 152, surahName: 'Al-Baqarah', arabicSnippet: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ', translation: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.' },
            { surah: 55, verse: 13, surahName: 'Ar-Rahman', arabicSnippet: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ', translation: 'So which of the favors of your Lord would you deny?' },
        ],
    },
    {
        id: 'love-mercy',
        name: 'Love & Mercy',
        arabicTitle: 'الرحمة',
        icon: 'heart-outline',
        color: '#EC4899',
        description: 'Verses about Allah\'s mercy and love in relationships.',
        verses: [
            { surah: 30, verse: 21, surahName: 'Ar-Rum', arabicSnippet: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا', translation: 'And of His signs is that He created for you from yourselves mates that you may find tranquility in them; and He placed between you affection and mercy.' },
            { surah: 90, verse: 17, surahName: 'Al-Balad', arabicSnippet: 'ثُمَّ كَانَ مِنَ الَّذِينَ آمَنُوا وَتَوَاصَوْا بِالصَّبْرِ وَتَوَاصَوْا بِالْمَرْحَمَةِ', translation: 'And then being among those who believed and advised one another to patience and advised one another to compassion.' },
            { surah: 21, verse: 107, surahName: 'Al-Anbiya', arabicSnippet: 'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ', translation: 'And We have not sent you, [O Muhammad], except as a mercy to the worlds.' },
            { surah: 19, verse: 96, surahName: 'Maryam', arabicSnippet: 'إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ سَيَجْعَلُ لَهُمُ الرَّحْمَنُ وُدًّا', translation: 'Indeed, those who have believed and done righteous deeds — the Most Merciful will appoint for them affection.' },
            { surah: 6, verse: 12, surahName: 'Al-An\'am', arabicSnippet: 'كَتَبَ عَلَىٰ نَفْسِهِ الرَّحْمَةَ', translation: 'He has decreed upon Himself mercy.' },
        ],
    },
    {
        id: 'protection',
        name: 'Protection',
        arabicTitle: 'الحفظ',
        icon: 'shield-outline',
        color: '#6366F1',
        description: 'Verses for seeking Allah\'s protection and refuge.',
        verses: [
            { surah: 2, verse: 255, surahName: 'Al-Baqarah', arabicSnippet: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', translation: 'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.' },
            { surah: 113, verse: 1, surahName: 'Al-Falaq', arabicSnippet: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translation: 'Say, "I seek refuge in the Lord of daybreak."' },
            { surah: 114, verse: 1, surahName: 'An-Nas', arabicSnippet: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: 'Say, "I seek refuge in the Lord of mankind."' },
            { surah: 3, verse: 173, surahName: 'Ali Imran', arabicSnippet: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', translation: 'Sufficient for us is Allah, and [He is] the best Disposer of affairs.' },
            { surah: 12, verse: 64, surahName: 'Yusuf', arabicSnippet: 'فَاللَّهُ خَيْرٌ حَافِظًا وَهُوَ أَرْحَمُ الرَّاحِمِينَ', translation: 'But Allah is the best guardian, and He is the most merciful of the merciful.' },
        ],
    },
    {
        id: 'strength',
        name: 'Strength & Courage',
        arabicTitle: 'القوة',
        icon: 'flash-outline',
        color: '#F97316',
        description: 'Verses about finding strength through faith.',
        verses: [
            { surah: 8, verse: 46, surahName: 'Al-Anfal', arabicSnippet: 'وَأَطِيعُوا اللَّهَ وَرَسُولَهُ وَلَا تَنَازَعُوا فَتَفْشَلُوا', translation: 'And obey Allah and His Messenger, and do not dispute and [thus] lose courage and [then] your strength would depart.' },
            { surah: 3, verse: 139, surahName: 'Ali Imran', arabicSnippet: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ', translation: 'So do not weaken and do not grieve, and you will be superior if you are [true] believers.' },
            { surah: 2, verse: 286, surahName: 'Al-Baqarah', arabicSnippet: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', translation: 'Allah does not burden a soul beyond that it can bear.' },
            { surah: 65, verse: 3, surahName: 'At-Talaq', arabicSnippet: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', translation: 'And whoever relies upon Allah — then He is sufficient for him.' },
            { surah: 29, verse: 69, surahName: 'Al-Ankabut', arabicSnippet: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا', translation: 'And those who strive for Us — We will surely guide them to Our ways.' },
        ],
    },
    {
        id: 'guidance',
        name: 'Guidance',
        arabicTitle: 'الهداية',
        icon: 'compass-outline',
        color: '#FBBF24',
        description: 'Verses about seeking and following divine guidance.',
        verses: [
            { surah: 1, verse: 6, surahName: 'Al-Fatiha', arabicSnippet: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guide us to the straight path.' },
            { surah: 2, verse: 2, surahName: 'Al-Baqarah', arabicSnippet: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ', translation: 'This is the Book about which there is no doubt, a guidance for those conscious of Allah.' },
            { surah: 16, verse: 9, surahName: 'An-Nahl', arabicSnippet: 'وَعَلَى اللَّهِ قَصْدُ السَّبِيلِ', translation: 'And upon Allah is the direction of the [right] way.' },
            { surah: 6, verse: 125, surahName: 'Al-An\'am', arabicSnippet: 'فَمَن يُرِدِ اللَّهُ أَن يَهْدِيَهُ يَشْرَحْ صَدْرَهُ لِلْإِسْلَامِ', translation: 'So whoever Allah wants to guide — He expands his breast to [contain] Islam.' },
            { surah: 42, verse: 52, surahName: 'Ash-Shura', arabicSnippet: 'وَإِنَّكَ لَتَهْدِي إِلَىٰ صِرَاطٍ مُّسْتَقِيمٍ', translation: 'And indeed, [O Muhammad], you guide to a straight path.' },
        ],
    },
    {
        id: 'family',
        name: 'Family',
        arabicTitle: 'الأهل',
        icon: 'people-outline',
        color: '#8B5CF6',
        description: 'Verses about family bonds, parents, and kinship.',
        verses: [
            { surah: 4, verse: 1, surahName: 'An-Nisa', arabicSnippet: 'يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ الَّذِي خَلَقَكُم مِّن نَّفْسٍ وَاحِدَةٍ', translation: 'O mankind, fear your Lord, who created you from one soul and created from it its mate.' },
            { surah: 31, verse: 14, surahName: 'Luqman', arabicSnippet: 'وَوَصَّيْنَا الْإِنسَانَ بِوَالِدَيْهِ', translation: 'And We have enjoined upon man [care] for his parents.' },
            { surah: 66, verse: 6, surahName: 'At-Tahrim', arabicSnippet: 'يَا أَيُّهَا الَّذِينَ آمَنُوا قُوا أَنفُسَكُمْ وَأَهْلِيكُمْ نَارًا', translation: 'O you who believe, protect yourselves and your families from a Fire.' },
            { surah: 17, verse: 23, surahName: 'Al-Isra', arabicSnippet: 'وَبِالْوَالِدَيْنِ إِحْسَانًا', translation: 'And to parents, do good.' },
            { surah: 25, verse: 74, surahName: 'Al-Furqan', arabicSnippet: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', translation: 'Our Lord, grant us from among our wives and offspring comfort to our eyes.' },
        ],
    },
    {
        id: 'provision',
        name: 'Provision',
        arabicTitle: 'الرزق',
        icon: 'leaf-outline',
        color: '#059669',
        description: 'Verses about trusting Allah\'s provision and sustenance.',
        verses: [
            { surah: 65, verse: 3, surahName: 'At-Talaq', arabicSnippet: 'وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ', translation: 'And He will provide for him from where he does not expect.' },
            { surah: 11, verse: 6, surahName: 'Hud', arabicSnippet: 'وَمَا مِن دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا', translation: 'And there is no creature on earth but that upon Allah is its provision.' },
            { surah: 62, verse: 10, surahName: 'Al-Jumu\'ah', arabicSnippet: 'فَانتَشِرُوا فِي الْأَرْضِ وَابْتَغُوا مِن فَضْلِ اللَّهِ', translation: 'Disperse within the land and seek from the bounty of Allah.' },
            { surah: 29, verse: 60, surahName: 'Al-Ankabut', arabicSnippet: 'وَكَأَيِّن مِّن دَابَّةٍ لَّا تَحْمِلُ رِزْقَهَا اللَّهُ يَرْزُقُهَا وَإِيَّاكُمْ', translation: 'And how many a creature carries not its [own] provision. Allah provides for it and for you.' },
            { surah: 51, verse: 58, surahName: 'Adh-Dhariyat', arabicSnippet: 'إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ', translation: 'Indeed, it is Allah who is the [continual] Provider, the firm possessor of strength.' },
        ],
    },
    {
        id: 'peace',
        name: 'Peace',
        arabicTitle: 'السلام',
        icon: 'water-outline',
        color: '#06B6D4',
        description: 'Verses about inner peace and tranquility of the heart.',
        verses: [
            { surah: 13, verse: 28, surahName: 'Ar-Ra\'d', arabicSnippet: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', translation: 'Unquestionably, by the remembrance of Allah hearts are assured.' },
            { surah: 89, verse: 27, surahName: 'Al-Fajr', arabicSnippet: 'يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ', translation: 'O reassured soul.' },
            { surah: 89, verse: 28, surahName: 'Al-Fajr', arabicSnippet: 'ارْجِعِي إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً', translation: 'Return to your Lord, well-pleased and pleasing [to Him].' },
            { surah: 36, verse: 58, surahName: 'Ya-Sin', arabicSnippet: 'سَلَامٌ قَوْلًا مِّن رَّبٍّ رَّحِيمٍ', translation: '"Peace," a word from a merciful Lord.' },
            { surah: 48, verse: 4, surahName: 'Al-Fath', arabicSnippet: 'هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ', translation: 'It is He who sent down tranquility into the hearts of the believers.' },
        ],
    },
    {
        id: 'repentance',
        name: 'Repentance',
        arabicTitle: 'التوبة',
        icon: 'return-up-back-outline',
        color: '#7C3AED',
        description: 'Verses about seeking forgiveness and returning to Allah.',
        verses: [
            { surah: 39, verse: 53, surahName: 'Az-Zumar', arabicSnippet: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ', translation: 'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins."' },
            { surah: 66, verse: 8, surahName: 'At-Tahrim', arabicSnippet: 'يَا أَيُّهَا الَّذِينَ آمَنُوا تُوبُوا إِلَى اللَّهِ تَوْبَةً نَّصُوحًا', translation: 'O you who have believed, repent to Allah with sincere repentance.' },
            { surah: 4, verse: 110, surahName: 'An-Nisa', arabicSnippet: 'وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا', translation: 'And whoever does a wrong or wrongs himself but then seeks forgiveness of Allah will find Allah Forgiving and Merciful.' },
            { surah: 11, verse: 90, surahName: 'Hud', arabicSnippet: 'وَاسْتَغْفِرُوا رَبَّكُمْ ثُمَّ تُوبُوا إِلَيْهِ إِنَّ رَبِّي رَحِيمٌ وَدُودٌ', translation: 'And ask forgiveness of your Lord and then repent to Him. Indeed, my Lord is Merciful and Affectionate.' },
            { surah: 25, verse: 70, surahName: 'Al-Furqan', arabicSnippet: 'إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ عَمَلًا صَالِحًا', translation: 'Except for those who repent, believe, and do righteous work. For them Allah will replace their evil deeds with good.' },
        ],
    },
    {
        id: 'afterlife',
        name: 'Death & Afterlife',
        arabicTitle: 'الآخرة',
        icon: 'cloud-outline',
        color: '#64748B',
        description: 'Verses about death, the hereafter, and preparing for the next life.',
        verses: [
            { surah: 21, verse: 35, surahName: 'Al-Anbiya', arabicSnippet: 'كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ', translation: 'Every soul will taste death.' },
            { surah: 3, verse: 185, surahName: 'Ali Imran', arabicSnippet: 'كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ وَإِنَّمَا تُوَفَّوْنَ أُجُورَكُمْ يَوْمَ الْقِيَامَةِ', translation: 'Every soul will taste death, and you will only be given your [full] compensation on the Day of Resurrection.' },
            { surah: 67, verse: 2, surahName: 'Al-Mulk', arabicSnippet: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا', translation: '[He] who created death and life to test you [as to] which of you is best in deed.' },
            { surah: 50, verse: 19, surahName: 'Qaf', arabicSnippet: 'وَجَاءَتْ سَكْرَةُ الْمَوْتِ بِالْحَقِّ', translation: 'And the intoxication of death will bring the truth.' },
            { surah: 23, verse: 115, surahName: 'Al-Mu\'minun', arabicSnippet: 'أَفَحَسِبْتُمْ أَنَّمَا خَلَقْنَاكُمْ عَبَثًا وَأَنَّكُمْ إِلَيْنَا لَا تُرْجَعُونَ', translation: 'Then did you think that We created you uselessly and that to Us you would not be returned?' },
        ],
    },
    {
        id: 'marriage',
        name: 'Marriage',
        arabicTitle: 'النكاح',
        icon: 'heart-circle-outline',
        color: '#F43F5E',
        description: 'Verses about the beauty and sanctity of marriage.',
        verses: [
            { surah: 30, verse: 21, surahName: 'Ar-Rum', arabicSnippet: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا', translation: 'And of His signs is that He created for you from yourselves mates that you may find tranquility in them.' },
            { surah: 24, verse: 32, surahName: 'An-Nur', arabicSnippet: 'وَأَنكِحُوا الْأَيَامَىٰ مِنكُمْ وَالصَّالِحِينَ مِنْ عِبَادِكُمْ وَإِمَائِكُمْ', translation: 'And marry the unmarried among you and the righteous among your male slaves and female slaves.' },
            { surah: 4, verse: 19, surahName: 'An-Nisa', arabicSnippet: 'وَعَاشِرُوهُنَّ بِالْمَعْرُوفِ', translation: 'And live with them in kindness.' },
            { surah: 2, verse: 187, surahName: 'Al-Baqarah', arabicSnippet: 'هُنَّ لِبَاسٌ لَّكُمْ وَأَنتُمْ لِبَاسٌ لَّهُنَّ', translation: 'They are clothing for you and you are clothing for them.' },
            { surah: 7, verse: 189, surahName: 'Al-A\'raf', arabicSnippet: 'هُوَ الَّذِي خَلَقَكُم مِّن نَّفْسٍ وَاحِدَةٍ وَجَعَلَ مِنْهَا زَوْجَهَا لِيَسْكُنَ إِلَيْهَا', translation: 'It is He who created you from one soul and created from it its mate that he might dwell in security with her.' },
        ],
    },
    {
        id: 'knowledge',
        name: 'Knowledge',
        arabicTitle: 'العلم',
        icon: 'library-outline',
        color: '#0EA5E9',
        description: 'Verses about the importance of learning and understanding.',
        verses: [
            { surah: 96, verse: 1, surahName: 'Al-Alaq', arabicSnippet: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', translation: 'Read in the name of your Lord who created.' },
            { surah: 20, verse: 114, surahName: 'Ta-Ha', arabicSnippet: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', translation: 'And say, "My Lord, increase me in knowledge."' },
            { surah: 39, verse: 9, surahName: 'Az-Zumar', arabicSnippet: 'قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ', translation: 'Say, "Are those who know equal to those who do not know?"' },
            { surah: 58, verse: 11, surahName: 'Al-Mujadila', arabicSnippet: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ', translation: 'Allah will raise those who have believed among you and those who were given knowledge, by degrees.' },
            { surah: 35, verse: 28, surahName: 'Fatir', arabicSnippet: 'إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ', translation: 'Only those fear Allah, from among His servants, who have knowledge.' },
        ],
    },
    {
        id: 'justice',
        name: 'Justice',
        arabicTitle: 'العدل',
        icon: 'scale-outline',
        color: '#B45309',
        description: 'Verses about fairness, equity, and standing for truth.',
        verses: [
            { surah: 4, verse: 135, surahName: 'An-Nisa', arabicSnippet: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُونُوا قَوَّامِينَ بِالْقِسْطِ', translation: 'O you who have believed, be persistently standing firm in justice.' },
            { surah: 5, verse: 8, surahName: 'Al-Ma\'idah', arabicSnippet: 'اعْدِلُوا هُوَ أَقْرَبُ لِلتَّقْوَىٰ', translation: 'Be just; that is nearer to righteousness.' },
            { surah: 16, verse: 90, surahName: 'An-Nahl', arabicSnippet: 'إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ', translation: 'Indeed, Allah orders justice and good conduct.' },
            { surah: 49, verse: 9, surahName: 'Al-Hujurat', arabicSnippet: 'وَأَقْسِطُوا إِنَّ اللَّهَ يُحِبُّ الْمُقْسِطِينَ', translation: 'And act justly. Indeed, Allah loves those who act justly.' },
            { surah: 57, verse: 25, surahName: 'Al-Hadid', arabicSnippet: 'لِيَقُومَ النَّاسُ بِالْقِسْطِ', translation: 'So that people may maintain [their affairs] in justice.' },
        ],
    },
    {
        id: 'dua',
        name: 'Du\'a',
        arabicTitle: 'الدعاء',
        icon: 'hands-outline',
        color: '#D4A853',
        description: 'Verses about supplication and calling upon Allah.',
        verses: [
            { surah: 2, verse: 186, surahName: 'Al-Baqarah', arabicSnippet: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ', translation: 'And when My servants ask you concerning Me — indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.' },
            { surah: 40, verse: 60, surahName: 'Ghafir', arabicSnippet: 'وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ', translation: 'And your Lord says, "Call upon Me; I will respond to you."' },
            { surah: 7, verse: 55, surahName: 'Al-A\'raf', arabicSnippet: 'ادْعُوا رَبَّكُمْ تَضَرُّعًا وَخُفْيَةً', translation: 'Call upon your Lord in humility and privately.' },
            { surah: 27, verse: 62, surahName: 'An-Naml', arabicSnippet: 'أَمَّن يُجِيبُ الْمُضْطَرَّ إِذَا دَعَاهُ وَيَكْشِفُ السُّوءَ', translation: 'Is He [not best] who responds to the desperate one when he calls upon Him and removes evil?' },
            { surah: 3, verse: 38, surahName: 'Ali Imran', arabicSnippet: 'رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً إِنَّكَ سَمِيعُ الدُّعَاءِ', translation: 'My Lord, grant me from Yourself a good offspring. Indeed, You are the Hearer of supplication.' },
        ],
    },
];

/** Get a topic by ID */
export function getTopicById(id: string): QuranTopic | undefined {
    return QURAN_TOPICS.find(t => t.id === id);
}
