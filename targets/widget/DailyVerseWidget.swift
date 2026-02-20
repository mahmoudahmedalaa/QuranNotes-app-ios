import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Daily Verse Widget — Redesigned for modern, vivid visuals
// Key improvements:
//   1. containerBackground(gradient) — eliminates dark border artifact
//   2. Lifted palettes — no near-black starts, all vivid mid-tones
//   3. Top glow highlight (EllipticalGradient) for depth
//   4. Glassy frosted panel (.white.opacity(0.1)) behind text
//   5. Colored accent picked per time period
// ═══════════════════════════════════════════════════════════════════

// ── Shared Palette ────────────────────────────────────────────────

struct TimePalette {
    let gradientColors: [Color]
    let accent: Color

    static func forHour(_ hour: Int) -> TimePalette {
        switch hour {
        case 4..<6:  // Fajr — violet purple dawn
            return TimePalette(
                gradientColors: [Color(hex: "3B2070"), Color(hex: "6B3FA0"), Color(hex: "9B6FCF")],
                accent: Color(hex: "E9D5FF")
            )
        case 6..<12: // Morning — brand blue
            return TimePalette(
                gradientColors: [Color(hex: "1D4ED8"), Color(hex: "3B82F6"), Color(hex: "60A5FA")],
                accent: Color(hex: "FDE68A")
            )
        case 12..<16: // Afternoon — rich teal
            return TimePalette(
                gradientColors: [Color(hex: "0E7490"), Color(hex: "0891B2"), Color(hex: "06B6D4")],
                accent: Color(hex: "A5F3FC")
            )
        case 16..<18: // Asr — warm amber
            return TimePalette(
                gradientColors: [Color(hex: "92400E"), Color(hex: "D97706"), Color(hex: "FBBF24")],
                accent: Color(hex: "FFFBEB")
            )
        case 18..<20: // Maghrib — sunset purple-rose
            return TimePalette(
                gradientColors: [Color(hex: "6D28D9"), Color(hex: "A21CAF"), Color(hex: "DB2777")],
                accent: Color(hex: "FDE68A")
            )
        default: // Isha — rich indigo (NOT black)
            return TimePalette(
                gradientColors: [Color(hex: "312E81"), Color(hex: "3730A3"), Color(hex: "4F46E5")],
                accent: Color(hex: "C7D2FE")
            )
        }
    }

    static func current() -> TimePalette {
        let hour = Calendar.current.component(.hour, from: Date())
        return forHour(hour)
    }
}

// ── Decorative elements ───────────────────────────────────────────

struct TopGlow: View {
    let accent: Color
    var body: some View {
        EllipticalGradient(
            colors: [accent.opacity(0.25), accent.opacity(0)],
            center: .top,
            startRadiusFraction: 0,
            endRadiusFraction: 0.55
        )
    }
}

struct StarDivider: View {
    let accent: Color
    var body: some View {
        HStack(spacing: 5) {
            Rectangle().fill(accent.opacity(0.3)).frame(height: 0.5)
            Text("◆").font(.system(size: 5)).foregroundColor(accent.opacity(0.7))
            Text("◆").font(.system(size: 4)).foregroundColor(accent.opacity(0.5))
            Text("◆").font(.system(size: 5)).foregroundColor(accent.opacity(0.7))
            Rectangle().fill(accent.opacity(0.3)).frame(height: 0.5)
        }
    }
}

// ── Entry ─────────────────────────────────────────────────────────

struct DailyVerseEntry: TimelineEntry {
    let date: Date
    let verse: DailyVerseData?
    let palette: TimePalette
}

struct DailyVerseProvider: TimelineProvider {
    func placeholder(in context: Context) -> DailyVerseEntry {
        DailyVerseEntry(
            date: Date(),
            verse: DailyVerseData(
                arabicText: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
                translation: "Unquestionably, by the remembrance of Allah hearts are assured.",
                surahName: "Ar-Ra'd",
                surahNameArabic: "سورة الرعد",
                verseNumber: 28,
                surahNumber: 13
            ),
            palette: .current()
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (DailyVerseEntry) -> Void) {
        completion(DailyVerseEntry(
            date: Date(),
            verse: WidgetDataStore.shared.getDailyVerse(),
            palette: .current()
        ))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyVerseEntry>) -> Void) {
        let verse = WidgetDataStore.shared.getDailyVerse()
        var entries: [DailyVerseEntry] = []
        let now = Date()

        for offset in 0..<6 {
            if let date = Calendar.current.date(byAdding: .hour, value: offset, to: now) {
                let hour = Calendar.current.component(.hour, from: date)
                entries.append(DailyVerseEntry(date: date, verse: verse, palette: TimePalette.forHour(hour)))
            }
        }

        let reload = Calendar.current.date(byAdding: .hour, value: 6, to: now) ?? now
        completion(Timeline(entries: entries, policy: .after(reload)))
    }
}

// ── Medium view ───────────────────────────────────────────────────

struct DailyVerseMediumView: View {
    let entry: DailyVerseEntry

    var body: some View {
        ZStack {
            TopGlow(accent: entry.palette.accent)

            if let verse = entry.verse {
                VStack(alignment: .center, spacing: 7) {
                    Text(verse.arabicText)
                        .font(.system(size: 19, weight: .medium, design: .serif))
                        .foregroundColor(.white)
                        .lineLimit(2)
                        .minimumScaleFactor(0.5)
                        .multilineTextAlignment(.center)
                        .shadow(color: .black.opacity(0.25), radius: 4, y: 2)

                    StarDivider(accent: entry.palette.accent).frame(width: 90)

                    Text(verse.translation)
                        .font(.system(size: 11, design: .serif))
                        .foregroundColor(.white.opacity(0.88))
                        .italic()
                        .lineLimit(2)
                        .minimumScaleFactor(0.7)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .fill(.white.opacity(0.1))
                        )

                    HStack {
                        Text("✦ \(verse.surahName) · \(verse.verseNumber)")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundColor(entry.palette.accent)
                        Spacer()
                        Text("QuranNotes App")
                            .font(.system(size: 8))
                            .foregroundColor(.white.opacity(0.35))
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
            } else {
                VStack(spacing: 8) {
                    Text("﷽").font(.system(size: 24)).foregroundColor(entry.palette.accent)
                    Text("Open QuranNotes App for today's verse")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.65))
                        .multilineTextAlignment(.center)
                }
            }
        }
    }
}

// ── Large view ────────────────────────────────────────────────────

struct DailyVerseLargeView: View {
    let entry: DailyVerseEntry

    var body: some View {
        ZStack {
            TopGlow(accent: entry.palette.accent)

            if let verse = entry.verse {
                VStack(spacing: 10) {
                    Text("﷽")
                        .font(.system(size: 20))
                        .foregroundColor(entry.palette.accent.opacity(0.85))

                    VStack(spacing: 2) {
                        Text(verse.surahName.uppercased())
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white.opacity(0.55))
                            .tracking(3)
                        Text("VERSE \(verse.verseNumber)")
                            .font(.system(size: 8, weight: .medium))
                            .foregroundColor(.white.opacity(0.4))
                            .tracking(2)
                    }

                    Text(verse.arabicText)
                        .font(.system(size: 24, weight: .medium, design: .serif))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .minimumScaleFactor(0.4)
                        .shadow(color: .black.opacity(0.2), radius: 6, y: 3)
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .fill(.white.opacity(0.08))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .stroke(.white.opacity(0.15), lineWidth: 0.5)
                                )
                        )

                    StarDivider(accent: entry.palette.accent).frame(width: 110)

                    Text(verse.translation)
                        .font(.system(size: 13, design: .serif))
                        .foregroundColor(.white.opacity(0.85))
                        .italic()
                        .lineLimit(4)
                        .minimumScaleFactor(0.6)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 8)

                    Spacer()

                    HStack(spacing: 3) {
                        Image(systemName: "book.fill").font(.system(size: 7))
                        Text("QURANNOTES APP").font(.system(size: 8, weight: .bold)).tracking(1.5)
                    }
                    .foregroundColor(.white.opacity(0.3))
                }
                .padding(16)
            } else {
                VStack(spacing: 14) {
                    Text("﷽").font(.system(size: 34)).foregroundColor(.white)
                    Text("Open QuranNotes App\nto see today's verse")
                        .font(.system(size: 15))
                        .foregroundColor(.white.opacity(0.65))
                        .multilineTextAlignment(.center)
                }
            }
        }
    }
}

// ── Widget ────────────────────────────────────────────────────────

struct DailyVerseWidget: Widget {
    let kind = "DailyVerseWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyVerseProvider()) { entry in
            let gradient = LinearGradient(
                colors: entry.palette.gradientColors,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            WidgetBody(entry: entry, gradient: gradient)
        }
        .configurationDisplayName("Verse of the Day")
        .description("A beautiful Quran verse, shifting colour with the time of day")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

private struct WidgetBody: View {
    let entry: DailyVerseEntry
    let gradient: LinearGradient
    @Environment(\.widgetFamily) var family

    var body: some View {
        let content: AnyView = (family == .systemLarge)
            ? AnyView(DailyVerseLargeView(entry: entry))
            : AnyView(DailyVerseMediumView(entry: entry))

        if #available(iOS 17.0, *) {
            content.containerBackground(gradient, for: .widget)
        } else {
            ZStack {
                gradient
                content
            }
        }
    }
}

// ── Color Extension ───────────────────────────────────────────────

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8)  & 0xFF) / 255
        let b = Double( int        & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: 1)
    }
}
