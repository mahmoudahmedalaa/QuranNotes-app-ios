import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// DailyHadith Widget
// Home screen (.systemMedium) + Lock screen (.accessoryRectangular,
// .accessoryInline)
//
// Warm-violet gradients (pink undertone) — prophetic warmth
// ═══════════════════════════════════════════════════════════════════

// ── Warm-Violet Palette ───────────────────────────────────────────

struct HadithPalette {
    let top: Color
    let bottom: Color
    let accent: Color

    var gradient: LinearGradient {
        LinearGradient(colors: [top, bottom], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
    var primaryText: Color  { .white }
    var secondaryText: Color { .white.opacity(0.85) }

    // ── Brand-aligned warm violet palette ─────────────────────────
    // Pink-violet undertone — prophetic wisdom, human warmth.
    // 3 states: Day / Twilight / Night.

    static func forHour(_ hour: Int) -> HadithPalette {
        switch hour {
        case 6..<18:  // Day — rich, warm rose-violet
            return HadithPalette(
                top:    Color(hex: "6E4FA0"),  // deep mauve-violet
                bottom: Color(hex: "9468C4"),  // vibrant plum
                accent: Color(hex: "DBC6F9"))  // luminous rose-lavender
        case 18..<20: // Twilight — deep berry, reflective
            return HadithPalette(
                top:    Color(hex: "4D2D6E"),  // rich berry
                bottom: Color(hex: "7450A0"),  // vivid wisteria
                accent: Color(hex: "CCB8EC"))  // soft orchid
        default:      // Night (8pm–6am) — deep cosmic, peaceful
            return HadithPalette(
                top:    Color(hex: "180F30"),  // deep midnight
                bottom: Color(hex: "2A1E4A"),  // cosmic plum
                accent: Color(hex: "AC99D8"))  // amethyst glow
        }
    }
    static func current() -> HadithPalette {
        forHour(Calendar.current.component(.hour, from: Date()))
    }
}

// ── Timeline Entry ────────────────────────────────────────────────

struct DailyHadithEntry: TimelineEntry {
    let date: Date
    let hadith: DailyHadithData?
    let palette: HadithPalette
}

// ── Timeline Provider ─────────────────────────────────────────────

struct DailyHadithProvider: TimelineProvider {
    func placeholder(in context: Context) -> DailyHadithEntry {
        DailyHadithEntry(date: Date(),
            hadith: DailyHadithData(
                arabicText: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
                englishText: "Actions are judged by intentions.",
                narrator: "Umar ibn al-Khattab",
                collection: "Sahih al-Bukhari",
                reference: "1"),
            palette: .current())
    }

    func getSnapshot(in context: Context, completion: @escaping (DailyHadithEntry) -> Void) {
        completion(DailyHadithEntry(date: Date(),
            hadith: WidgetDataStore.shared.getDailyHadith(), palette: .current()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyHadithEntry>) -> Void) {
        let hadith = WidgetDataStore.shared.getDailyHadith()
        let now = Date()
        var entries: [DailyHadithEntry] = []
        for offset in 0..<6 {
            if let d = Calendar.current.date(byAdding: .hour, value: offset, to: now) {
                entries.append(DailyHadithEntry(date: d, hadith: hadith,
                    palette: HadithPalette.forHour(Calendar.current.component(.hour, from: d))))
            }
        }
        completion(Timeline(entries: entries,
            policy: .after(Calendar.current.date(byAdding: .hour, value: 6, to: now) ?? now)))
    }
}

// ── Views ─────────────────────────────────────────────────────────

struct DailyHadithWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: DailyHadithEntry

    var body: some View {
        switch family {

        // ── Lock screen: rectangular bar ──────────────────────────
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 3) {
                if let hadith = entry.hadith {
                    Text(hadith.englishText)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.primary)
                        .lineLimit(3)
                        .minimumScaleFactor(0.85)
                        .fixedSize(horizontal: false, vertical: true)

                    Text("— \(hadith.narrator)")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.secondary)
                } else {
                    Label("Open QuranNotes", systemImage: "text.book.closed.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }
            }

        // ── Lock screen: inline (above clock) ─────────────────────
        case .accessoryInline:
            if let hadith = entry.hadith {
                Label("\(hadith.narrator) · \(hadith.collection)",
                      systemImage: "text.book.closed.fill")
            } else {
                Label("Hadith of the Day", systemImage: "text.book.closed.fill")
            }

        // ── Home screen: systemMedium ─────────────────────────────
        default:
            ZStack(alignment: .bottom) {
                Color.clear // gradient via containerBackground
                if let hadith = entry.hadith {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Text("✦ HADITH OF THE DAY")
                                .font(.system(size: 9, weight: .bold))
                                .kerning(0.8)
                                .foregroundColor(entry.palette.accent.opacity(0.9))
                            Spacer()
                            Text("QuranNotes")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(entry.palette.secondaryText.opacity(0.6))
                        }
                        .padding(.bottom, 8)

                        // Arabic text
                        if !hadith.arabicText.isEmpty {
                            Text(hadith.arabicText)
                                .font(.system(size: 15, weight: .medium))
                                .foregroundColor(entry.palette.primaryText)
                                .multilineTextAlignment(.trailing)
                                .frame(maxWidth: .infinity, alignment: .trailing)
                                .lineSpacing(3)
                                .lineLimit(2)
                        }

                        Spacer()

                        // English translation
                        Text(hadith.englishText)
                            .font(.system(size: 11))
                            .italic()
                            .foregroundColor(entry.palette.primaryText.opacity(0.80))
                            .lineLimit(3)
                            .lineSpacing(2)
                            .minimumScaleFactor(0.85)
                            .padding(.bottom, 6)

                        // Source
                        Text("\(hadith.narrator) · \(hadith.collection), #\(hadith.reference)")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(entry.palette.accent)
                    }
                    .padding(14)
                } else {
                    VStack(spacing: 8) {
                        Text("📖").font(.system(size: 28))
                        Text("Open QuranNotes\nto load today's hadith")
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

struct DailyHadithWidget: Widget {
    let kind = "DailyHadithWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyHadithProvider()) { entry in
            if #available(iOS 17.0, *) {
                DailyHadithWidgetView(entry: entry)
                    .containerBackground(entry.palette.gradient, for: .widget)
            } else {
                ZStack {
                    entry.palette.gradient
                    DailyHadithWidgetView(entry: entry)
                }
            }
        }
        .configurationDisplayName("Hadith of the Day")
        .description("Daily Prophetic wisdom — on your home and lock screen")
        .supportedFamilies([
            .systemMedium,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}
