import Foundation

// ═══════════════════════════════════════════════════════════════════
// Shared data models between QuranNotes app and widgets
// Data is stored in UserDefaults via App Group
// ═══════════════════════════════════════════════════════════════════

let appGroupID = "group.com.mahmoudahmedalaa.qurannotes"

struct DailyVerseData: Codable {
    let arabicText: String
    let translation: String
    let surahName: String
    let surahNameArabic: String
    let verseNumber: Int
    let surahNumber: Int
}

struct NextPrayerData: Codable {
    let name: String
    let time: String
    let timestamp: Double  // Unix epoch seconds
}

struct KhatmaData: Codable {
    let completedJuz: Int
    let totalJuz: Int
    let completedSurahs: Int
}

struct StreakData: Codable {
    let count: Int
}

// ── UserDefaults helpers ───────────────────────────────────────────

class WidgetDataStore {
    static let shared = WidgetDataStore()
    
    private let defaults: UserDefaults?
    
    private init() {
        defaults = UserDefaults(suiteName: appGroupID)
    }
    
    func getDailyVerse() -> DailyVerseData? {
        guard let data = defaults?.data(forKey: "widgetData_dailyVerse") else { return nil }
        return try? JSONDecoder().decode(DailyVerseData.self, from: data)
    }
    
    func getNextPrayer() -> NextPrayerData? {
        guard let data = defaults?.data(forKey: "widgetData_nextPrayer") else { return nil }
        return try? JSONDecoder().decode(NextPrayerData.self, from: data)
    }
    
    func getNextPrayers() -> [NextPrayerData]? {
        guard let data = defaults?.data(forKey: "widgetData_nextPrayers") else { return nil }
        return try? JSONDecoder().decode([NextPrayerData].self, from: data)
    }
    
    func getKhatma() -> KhatmaData? {
        guard let data = defaults?.data(forKey: "widgetData_khatma") else { return nil }
        return try? JSONDecoder().decode(KhatmaData.self, from: data)
    }
    
    func getStreak() -> StreakData? {
        guard let data = defaults?.data(forKey: "widgetData_streak") else { return nil }
        return try? JSONDecoder().decode(StreakData.self, from: data)
    }
}
