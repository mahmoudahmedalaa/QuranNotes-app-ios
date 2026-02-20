import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Daily Verse Widget — Medium & Large
// Shows a beautiful verse from the Quran on the home screen
// ═══════════════════════════════════════════════════════════════════

struct DailyVerseEntry: TimelineEntry {
    let date: Date
    let verse: DailyVerseData?
}

struct DailyVerseProvider: TimelineProvider {
    func placeholder(in context: Context) -> DailyVerseEntry {
        DailyVerseEntry(date: Date(), verse: DailyVerseData(
            arabicText: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
            translation: "The Entirely Merciful, the Especially Merciful",
            surahName: "Al-Fatiha",
            surahNameArabic: "سُورَةُ ٱلْفَاتِحَةِ",
            verseNumber: 3,
            surahNumber: 1
        ))
    }
    
    func getSnapshot(in context: Context, completion: @escaping (DailyVerseEntry) -> Void) {
        let verse = WidgetDataStore.shared.getDailyVerse()
        completion(DailyVerseEntry(date: Date(), verse: verse))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyVerseEntry>) -> Void) {
        let verse = WidgetDataStore.shared.getDailyVerse()
        let entry = DailyVerseEntry(date: Date(), verse: verse)
        // Refresh every hour
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// ── Medium View ───────────────────────────────────────────────────

struct DailyVerseMediumView: View {
    let entry: DailyVerseEntry
    
    var body: some View {
        if let verse = entry.verse {
            ZStack {
                // Deep navy gradient background
                LinearGradient(
                    colors: [Color(hex: "0C1220"), Color(hex: "152238")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                VStack(spacing: 6) {
                    // Arabic text
                    Text(verse.arabicText)
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(.white)
                        .lineLimit(2)
                        .minimumScaleFactor(0.6)
                        .multilineTextAlignment(.center)
                    
                    // Translation
                    Text("\"\(verse.translation)\"")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(Color(hex: "8892B0"))
                        .italic()
                        .lineLimit(2)
                        .minimumScaleFactor(0.7)
                        .multilineTextAlignment(.center)
                    
                    Spacer().frame(height: 2)
                    
                    // Surah reference + branding row
                    HStack {
                        Text("\(verse.surahName) · \(verse.verseNumber)")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(Color(hex: "D4A853"))
                        
                        Spacer()
                        
                        HStack(spacing: 3) {
                            Circle()
                                .fill(Color(hex: "5B7FFF"))
                                .frame(width: 5, height: 5)
                            Text("QURANNOTES")
                                .font(.system(size: 8, weight: .bold))
                                .foregroundColor(Color(hex: "5B7FFF").opacity(0.7))
                                .tracking(1)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
        } else {
            // No data placeholder
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "0C1220"), Color(hex: "152238")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                VStack(spacing: 8) {
                    Text("﷽")
                        .font(.system(size: 24))
                        .foregroundColor(Color(hex: "D4A853"))
                    Text("Open QuranNotes\nto see today's verse")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(Color(hex: "8892B0"))
                        .multilineTextAlignment(.center)
                }
            }
        }
    }
}

// ── Large View ────────────────────────────────────────────────────

struct DailyVerseLargeView: View {
    let entry: DailyVerseEntry
    
    var body: some View {
        if let verse = entry.verse {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "0C1220"), Color(hex: "152238"), Color(hex: "1A2D50")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                VStack(spacing: 10) {
                    // Bismillah ornament
                    Text("﷽")
                        .font(.system(size: 26))
                        .foregroundColor(Color(hex: "D4A853"))
                    
                    // Surah name in Arabic
                    Text(verse.surahNameArabic)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.white)
                    
                    // Reference
                    Text("\(verse.surahName.uppercased()) · VERSE \(verse.verseNumber)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(Color(hex: "A8B2D1"))
                        .tracking(1)
                    
                    Spacer().frame(height: 4)
                    
                    // Verse container with subtle border
                    Text(verse.arabicText)
                        .font(.system(size: 24, weight: .medium))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .minimumScaleFactor(0.5)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.white.opacity(0.05))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color(hex: "D4A853").opacity(0.2), lineWidth: 1)
                                )
                        )
                    
                    // Translation
                    Text("\"\(verse.translation)\"")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(Color(hex: "8892B0"))
                        .italic()
                        .lineLimit(4)
                        .minimumScaleFactor(0.7)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 8)
                    
                    Spacer()
                    
                    // Decorative divider
                    HStack(spacing: 8) {
                        Rectangle().fill(Color.white.opacity(0.1)).frame(height: 1)
                        Text("✦")
                            .font(.system(size: 8))
                            .foregroundColor(Color(hex: "D4A853").opacity(0.6))
                        Rectangle().fill(Color.white.opacity(0.1)).frame(height: 1)
                    }
                    
                    // Branding
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color(hex: "5B7FFF"))
                            .frame(width: 6, height: 6)
                        Text("QURANNOTES")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(Color(hex: "8892B0"))
                            .tracking(2)
                    }
                }
                .padding(16)
            }
        } else {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "0C1220"), Color(hex: "152238")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                VStack(spacing: 12) {
                    Text("﷽")
                        .font(.system(size: 32))
                        .foregroundColor(Color(hex: "D4A853"))
                    Text("Open QuranNotes\nto see today's verse")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(Color(hex: "8892B0"))
                        .multilineTextAlignment(.center)
                    
                    HStack(spacing: 4) {
                        Circle().fill(Color(hex: "5B7FFF")).frame(width: 6, height: 6)
                        Text("QURANNOTES").font(.system(size: 9, weight: .bold))
                            .foregroundColor(Color(hex: "8892B0")).tracking(2)
                    }
                }
            }
        }
    }
}

// ── Widget Declaration ────────────────────────────────────────────

struct DailyVerseWidget: Widget {
    let kind = "DailyVerseWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyVerseProvider()) { entry in
            if #available(iOS 17.0, *) {
                Group {
                    DailyVerseMediumView(entry: entry)
                }
                .containerBackground(.clear, for: .widget)
            } else {
                DailyVerseMediumView(entry: entry)
            }
        }
        .configurationDisplayName("Verse of the Day")
        .description("A beautiful Quran verse on your home screen")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// ── Color Extension ───────────────────────────────────────────────

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
