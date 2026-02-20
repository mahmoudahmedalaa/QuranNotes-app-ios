import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Daily Verse Widget — The hero widget
// Time-of-day adaptive gradients, premium Islamic design
// ═══════════════════════════════════════════════════════════════════

// ── Time-Aware Palette ────────────────────────────────────────────

enum TimeOfDay {
    case fajr      // 4-6 AM
    case morning   // 6-12 PM
    case afternoon // 12-16 PM
    case asr       // 16-18 PM
    case maghrib   // 18-20 PM
    case isha      // 20-4 AM
    
    static func current() -> TimeOfDay {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 4..<6:   return .fajr
        case 6..<12:  return .morning
        case 12..<16: return .afternoon
        case 16..<18: return .asr
        case 18..<20: return .maghrib
        default:      return .isha
        }
    }
    
    var gradientColors: [Color] {
        switch self {
        case .fajr:
            return [Color(hex: "1A1B3A"), Color(hex: "2D1B69"), Color(hex: "5B3A8C")]
        case .morning:
            return [Color(hex: "1E3A5F"), Color(hex: "2E5A88"), Color(hex: "4A8FBF")]
        case .afternoon:
            return [Color(hex: "1B3A4B"), Color(hex: "2A5F7A"), Color(hex: "3A7FA0")]
        case .asr:
            return [Color(hex: "3D2B1F"), Color(hex: "6B4226"), Color(hex: "C47D3C")]
        case .maghrib:
            return [Color(hex: "2A1A3D"), Color(hex: "6B2D5B"), Color(hex: "D4654A")]
        case .isha:
            return [Color(hex: "0A0E1A"), Color(hex: "121B30"), Color(hex: "1A2744")]
        }
    }
    
    var accentColor: Color {
        switch self {
        case .fajr:      return Color(hex: "C9A0DC")
        case .morning:   return Color(hex: "F0C75E")
        case .afternoon: return Color(hex: "F0C75E")
        case .asr:       return Color(hex: "FFD700")
        case .maghrib:   return Color(hex: "FFB347")
        case .isha:      return Color(hex: "E8D5A3")
        }
    }
    
    var subtextColor: Color {
        switch self {
        case .fajr:      return Color(hex: "9B8EC4")
        case .morning:   return Color(hex: "A8C4E0")
        case .afternoon: return Color(hex: "99BDD8")
        case .asr:       return Color(hex: "D4A76A")
        case .maghrib:   return Color(hex: "D4A0A0")
        case .isha:      return Color(hex: "7A8BA8")
        }
    }
}

// ── Timeline ──────────────────────────────────────────────────────

struct DailyVerseEntry: TimelineEntry {
    let date: Date
    let verse: DailyVerseData?
    let timeOfDay: TimeOfDay
}

struct DailyVerseProvider: TimelineProvider {
    func placeholder(in context: Context) -> DailyVerseEntry {
        DailyVerseEntry(date: Date(), verse: DailyVerseData(
            arabicText: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
            translation: "Unquestionably, by the remembrance of Allah hearts are assured.",
            surahName: "Ar-Ra'd",
            surahNameArabic: "سورة الرعد",
            verseNumber: 28,
            surahNumber: 13
        ), timeOfDay: .current())
    }
    
    func getSnapshot(in context: Context, completion: @escaping (DailyVerseEntry) -> Void) {
        completion(DailyVerseEntry(
            date: Date(),
            verse: WidgetDataStore.shared.getDailyVerse(),
            timeOfDay: .current()
        ))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyVerseEntry>) -> Void) {
        let verse = WidgetDataStore.shared.getDailyVerse()
        var entries: [DailyVerseEntry] = []
        let now = Date()
        
        // Create entries for each hour to update the gradient
        for hourOffset in 0..<6 {
            let date = Calendar.current.date(byAdding: .hour, value: hourOffset, to: now)!
            let hour = Calendar.current.component(.hour, from: date)
            let tod: TimeOfDay = {
                switch hour {
                case 4..<6:   return .fajr
                case 6..<12:  return .morning
                case 12..<16: return .afternoon
                case 16..<18: return .asr
                case 18..<20: return .maghrib
                default:      return .isha
                }
            }()
            entries.append(DailyVerseEntry(date: date, verse: verse, timeOfDay: tod))
        }
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 6, to: now)!
        completion(Timeline(entries: entries, policy: .after(nextUpdate)))
    }
}

// ── Decorative Elements ───────────────────────────────────────────

struct IslamicStarPattern: View {
    let opacity: Double
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Subtle radial glow at top
                RadialGradient(
                    colors: [Color.white.opacity(opacity * 0.15), Color.clear],
                    center: .top,
                    startRadius: 0,
                    endRadius: geo.size.height * 0.8
                )
                // Corner ornaments
                VStack {
                    HStack {
                        Text("✦").font(.system(size: 6)).foregroundColor(.white.opacity(opacity))
                        Spacer()
                        Text("✦").font(.system(size: 6)).foregroundColor(.white.opacity(opacity))
                    }
                    Spacer()
                    HStack {
                        Text("✦").font(.system(size: 6)).foregroundColor(.white.opacity(opacity))
                        Spacer()
                        Text("✦").font(.system(size: 6)).foregroundColor(.white.opacity(opacity))
                    }
                }
                .padding(8)
            }
        }
    }
}

struct OrnamentalDivider: View {
    let color: Color
    var body: some View {
        HStack(spacing: 6) {
            Rectangle().fill(color.opacity(0.3)).frame(height: 0.5)
            Text("◆").font(.system(size: 5)).foregroundColor(color.opacity(0.6))
            Circle().fill(color.opacity(0.5)).frame(width: 3, height: 3)
            Text("◆").font(.system(size: 5)).foregroundColor(color.opacity(0.6))
            Rectangle().fill(color.opacity(0.3)).frame(height: 0.5)
        }
    }
}

// ── Medium View ───────────────────────────────────────────────────

struct DailyVerseMediumView: View {
    let entry: DailyVerseEntry
    
    var body: some View {
        let tod = entry.timeOfDay
        
        if let verse = entry.verse {
            ZStack {
                // Time-adaptive gradient
                LinearGradient(
                    colors: tod.gradientColors,
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                // Subtle star pattern
                IslamicStarPattern(opacity: 0.4)
                
                VStack(spacing: 8) {
                    // Arabic text — large and beautiful
                    Text(verse.arabicText)
                        .font(.system(size: 22, weight: .medium, design: .serif))
                        .foregroundColor(.white)
                        .lineLimit(2)
                        .minimumScaleFactor(0.5)
                        .multilineTextAlignment(.center)
                        .shadow(color: .black.opacity(0.3), radius: 4, y: 2)
                    
                    // Ornamental separator
                    OrnamentalDivider(color: tod.accentColor)
                        .frame(width: 100)
                    
                    // Translation
                    Text(verse.translation)
                        .font(.system(size: 11, weight: .regular, design: .serif))
                        .foregroundColor(.white.opacity(0.85))
                        .italic()
                        .lineLimit(2)
                        .minimumScaleFactor(0.7)
                        .multilineTextAlignment(.center)
                    
                    // Footer
                    HStack {
                        Text("\(verse.surahName) · Verse \(verse.verseNumber)")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundColor(tod.accentColor)
                        
                        Spacer()
                        
                        HStack(spacing: 3) {
                            Image(systemName: "book.fill")
                                .font(.system(size: 7))
                            Text("QuranNotes")
                                .font(.system(size: 8, weight: .bold))
                        }
                        .foregroundColor(tod.subtextColor.opacity(0.7))
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
            }
        } else {
            emptyState(tod: tod)
        }
    }
    
    private func emptyState(tod: TimeOfDay) -> some View {
        ZStack {
            LinearGradient(colors: tod.gradientColors, startPoint: .topLeading, endPoint: .bottomTrailing)
            IslamicStarPattern(opacity: 0.3)
            VStack(spacing: 8) {
                Text("﷽")
                    .font(.system(size: 28))
                    .foregroundColor(tod.accentColor)
                Text("Open QuranNotes\nto see today's verse")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(tod.subtextColor)
                    .multilineTextAlignment(.center)
            }
        }
    }
}

// ── Large View ────────────────────────────────────────────────────

struct DailyVerseLargeView: View {
    let entry: DailyVerseEntry
    
    var body: some View {
        let tod = entry.timeOfDay
        
        if let verse = entry.verse {
            ZStack {
                LinearGradient(
                    colors: tod.gradientColors,
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                IslamicStarPattern(opacity: 0.3)
                
                VStack(spacing: 10) {
                    // Bismillah
                    Text("﷽")
                        .font(.system(size: 22))
                        .foregroundColor(tod.accentColor.opacity(0.8))
                    
                    // Surah header
                    Text(verse.surahName.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(tod.subtextColor)
                        .tracking(3)
                    
                    Text("VERSE \(verse.verseNumber)")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(tod.subtextColor.opacity(0.7))
                        .tracking(2)
                    
                    Spacer().frame(height: 4)
                    
                    // Arabic verse in decorative frame
                    Text(verse.arabicText)
                        .font(.system(size: 26, weight: .medium, design: .serif))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .minimumScaleFactor(0.4)
                        .shadow(color: .black.opacity(0.3), radius: 6, y: 3)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 14)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.white.opacity(0.06))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(tod.accentColor.opacity(0.15), lineWidth: 1)
                                )
                        )
                    
                    // Ornamental separator
                    OrnamentalDivider(color: tod.accentColor)
                        .frame(width: 120)
                    
                    // Translation
                    Text(verse.translation)
                        .font(.system(size: 13, weight: .regular, design: .serif))
                        .foregroundColor(.white.opacity(0.8))
                        .italic()
                        .lineLimit(4)
                        .minimumScaleFactor(0.6)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 8)
                    
                    Spacer()
                    
                    // Branding footer
                    HStack(spacing: 5) {
                        Image(systemName: "book.fill")
                            .font(.system(size: 8))
                        Text("QURANNOTES")
                            .font(.system(size: 8, weight: .bold))
                            .tracking(2)
                    }
                    .foregroundColor(tod.subtextColor.opacity(0.5))
                }
                .padding(16)
            }
        } else {
            ZStack {
                LinearGradient(colors: tod.gradientColors, startPoint: .topLeading, endPoint: .bottomTrailing)
                IslamicStarPattern(opacity: 0.3)
                VStack(spacing: 14) {
                    Text("﷽").font(.system(size: 36)).foregroundColor(tod.accentColor)
                    Text("Open QuranNotes\nto see today's verse")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(tod.subtextColor)
                        .multilineTextAlignment(.center)
                    HStack(spacing: 4) {
                        Image(systemName: "book.fill").font(.system(size: 8))
                        Text("QURANNOTES").font(.system(size: 9, weight: .bold)).tracking(2)
                    }
                    .foregroundColor(tod.subtextColor.opacity(0.5))
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
                    switch WidgetFamily(rawValue: 0) {
                    default:
                        DailyVerseMediumView(entry: entry)
                    }
                }
                .containerBackground(.clear, for: .widget)
            } else {
                DailyVerseMediumView(entry: entry)
            }
        }
        .configurationDisplayName("Verse of the Day")
        .description("A beautiful Quran verse that changes with the time of day")
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
