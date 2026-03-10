import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// SHARED: Brand-purple TimePalette + Color(hex:)
// (defined once here, used across all 3 widget files)
// ═══════════════════════════════════════════════════════════════════

extension Color {
    init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: h).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

struct TimePalette {
    let top: Color
    let bottom: Color
    let accent: Color
    let isDark: Bool

    var gradient: LinearGradient {
        LinearGradient(colors: [top, bottom], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
    // The iOS Widget is a "Window to the Sky". We use these rich, atmospheric 
    // gradients universally. All text inside the widget is permanently locked 
    // to White/Light-opacities to guarantee WCAG AA perfect contrast.
    var primaryText: Color  { .white }
    var secondaryText: Color { .white.opacity(0.85) }

    static func forHour(_ hour: Int) -> TimePalette {
        let isDark = true // Force dark-mode behavior for rich backgrounds universally

        switch hour {
        case 4..<6:  // Fajr: Dawn purple to soft pink
            return TimePalette(
                top:    Color(hex: "3B1F50"),
                bottom: Color(hex: "7E4B8C"),
                accent: Color(hex: "C481A7"), // Soft pink accent
                isDark: isDark)
        case 6..<12: // Morning: Airy sky blue
            return TimePalette(
                top:    Color(hex: "4CA1AF"),
                bottom: Color(hex: "73BDEB"),
                accent: Color(hex: "A5D6F7"), // Light blue accent
                isDark: isDark)
        case 12..<16: // Dhuhr: Vibrant daytime blue
            return TimePalette(
                top:    Color(hex: "1E3A8A"),
                bottom: Color(hex: "2563EB"),
                accent: Color(hex: "60A5FA"), // Bright blue accent
                isDark: isDark)
        case 16..<18: // Asr: Golden hour amber/orange
            return TimePalette(
                top:    Color(hex: "9A3412"),
                bottom: Color(hex: "C2410C"),
                accent: Color(hex: "FDE68A"), // Gold accent
                isDark: isDark)
        case 18..<20: // Maghrib: Sunset crimson & purple
            return TimePalette(
                top:    Color(hex: "581C87"),
                bottom: Color(hex: "9D174D"),
                accent: Color(hex: "FBCFE8"), // Soft pink/white accent
                isDark: isDark)
        default:     // Isha: Deep midnight
            return TimePalette(
                top:    Color(hex: "0F172A"),
                bottom: Color(hex: "1E293B"),
                accent: Color(hex: "D4A853"), // Premium Gold accent
                isDark: isDark)
        }
    }
    static func current() -> TimePalette {
        forHour(Calendar.current.component(.hour, from: Date()))
    }
}

// ═══════════════════════════════════════════════════════════════════
// DailyVerse Widget
// Home screen (.systemMedium)  + Lock screen (.accessoryRectangular,
// .accessoryInline)
// ═══════════════════════════════════════════════════════════════════

struct DailyVerseEntry: TimelineEntry {
    let date: Date
    let verse: DailyVerseData?
    let palette: TimePalette
}

struct DailyVerseProvider: TimelineProvider {
    func placeholder(in context: Context) -> DailyVerseEntry {
        DailyVerseEntry(date: Date(),
            verse: DailyVerseData(arabicText: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
                translation: "Allah is sufficient for us, and He is the best guardian.",
                surahName: "Ali Imran", surahNameArabic: "آل عمران",
                verseNumber: 173, surahNumber: 3),
            palette: .current())
    }
    func getSnapshot(in context: Context, completion: @escaping (DailyVerseEntry) -> Void) {
        completion(DailyVerseEntry(date: Date(),
            verse: WidgetDataStore.shared.getDailyVerse(), palette: .current()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyVerseEntry>) -> Void) {
        let verse = WidgetDataStore.shared.getDailyVerse()
        let now = Date()
        var entries: [DailyVerseEntry] = []
        for offset in 0..<6 {
            if let d = Calendar.current.date(byAdding: .hour, value: offset, to: now) {
                entries.append(DailyVerseEntry(date: d, verse: verse,
                    palette: TimePalette.forHour(Calendar.current.component(.hour, from: d))))
            }
        }
        completion(Timeline(entries: entries,
            policy: .after(Calendar.current.date(byAdding: .hour, value: 6, to: now) ?? now)))
    }
}

// ── Views ─────────────────────────────────────────────────────────

struct DailyVerseWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: DailyVerseEntry

    var body: some View {
        switch family {

        // ── Lock screen: rectangular bar ──────────────────────────
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 3) {
                if let verse = entry.verse {
                    // Verse translation — front and centre, as many lines as fit
                    Text(verse.translation)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.primary)
                        .lineLimit(3)
                        .minimumScaleFactor(0.85)
                        .fixedSize(horizontal: false, vertical: true)

                    // Reference below — small and unobtrusive
                    Text("— \(verse.surahName) · \(verse.verseNumber)")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.secondary)
                } else {
                    Label("Open QuranNotes", systemImage: "book.closed.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }
            }

        // ── Lock screen: inline (above clock) ─────────────────────
        case .accessoryInline:
            if let verse = entry.verse {
                Label("\(verse.surahName) · \(verse.verseNumber)",
                      systemImage: "book.closed.fill")
            } else {
                Label("Verse of the Day", systemImage: "book.closed.fill")
            }

        // ── Home screen: systemMedium ─────────────────────────────
        default:
            ZStack(alignment: .bottom) {
                Color.clear // gradient via containerBackground
                if let verse = entry.verse {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Text("✦ VERSE OF THE DAY")
                                .font(.system(size: 9, weight: .bold))
                                .kerning(0.8)
                                .foregroundColor(entry.palette.accent.opacity(0.9))
                            Spacer()
                            Text("QuranNotes")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(entry.palette.secondaryText.opacity(0.6))
                        }
                        .padding(.bottom, 8)

                        Text(verse.arabicText)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(entry.palette.primaryText)
                            .multilineTextAlignment(.trailing)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                            .lineSpacing(4)
                            .lineLimit(2)

                        Spacer()

                        Text(verse.translation)
                            .font(.system(size: 11))
                            .italic()
                            .foregroundColor(entry.palette.primaryText.opacity(0.80))
                            .lineLimit(3)
                            .lineSpacing(2)
                            .minimumScaleFactor(0.85)
                            .padding(.bottom, 6)

                        Text("\(verse.surahName) · \(verse.verseNumber)")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(entry.palette.accent)
                    }
                    .padding(14)
                } else {
                    VStack(spacing: 8) {
                        Text("📖").font(.system(size: 28))
                        Text("Open QuranNotes\nto load your verse")
                            .font(.system(size: 11))
                            .foregroundColor(entry.palette.secondaryText)
                            .multilineTextAlignment(.center)
                    }
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
            if #available(iOS 17.0, *) {
                DailyVerseWidgetView(entry: entry)
                    .containerBackground(entry.palette.gradient, for: .widget)
            } else {
                ZStack {
                    entry.palette.gradient
                    DailyVerseWidgetView(entry: entry)
                }
            }
        }
        .configurationDisplayName("Verse of the Day")
        .description("Daily Quranic verse — on your home and lock screen")
        .supportedFamilies([
            .systemMedium,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}
