import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Khatma Widget
// Home screen (.systemSmall) + Lock screen (.accessoryCircular,
// .accessoryRectangular)
//
// The circular lock screen is the hero: it mirrors Apple's Activity
// ring on Apple Watch — a thin arc showing Juz progress, Juz count
// in center. Immediately meaningful. Works like Streaks / Habitica.
// ═══════════════════════════════════════════════════════════════════

struct KhatmaEntry: TimelineEntry {
    let date: Date
    let khatma: KhatmaData?
    let palette: TimePalette
}

struct KhatmaProvider: TimelineProvider {
    func placeholder(in context: Context) -> KhatmaEntry {
        KhatmaEntry(date: Date(),
            khatma: KhatmaData(completedJuz: 12, totalJuz: 30, completedSurahs: 0),
            palette: .current())
    }
    func getSnapshot(in context: Context, completion: @escaping (KhatmaEntry) -> Void) {
        completion(KhatmaEntry(date: Date(),
            khatma: WidgetDataStore.shared.getKhatma(), palette: .current()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<KhatmaEntry>) -> Void) {
        let khatma = WidgetDataStore.shared.getKhatma()
        let now = Date()
        var entries: [KhatmaEntry] = []
        for offset in 0..<6 {
            if let d = Calendar.current.date(byAdding: .hour, value: offset, to: now) {
                entries.append(KhatmaEntry(date: d, khatma: khatma,
                    palette: TimePalette.forHour(Calendar.current.component(.hour, from: d))))
            }
        }
        completion(Timeline(entries: entries,
            policy: .after(Calendar.current.date(byAdding: .hour, value: 6, to: now) ?? now)))
    }
}

// ── Views ─────────────────────────────────────────────────────────

struct KhatmaWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: KhatmaEntry

    var body: some View {
        if let khatma = entry.khatma {
            let total  = Double(max(khatma.totalJuz, 1))
            let done   = Double(max(0, khatma.completedJuz))
            let progress = done / total
            let isComplete = khatma.completedJuz >= khatma.totalJuz
            let remaining  = khatma.totalJuz - khatma.completedJuz

            switch family {

            // ── Lock screen: circular — Activity-ring style ────────
            //    Native Gauge = same look as Apple Watch activity ring
            case .accessoryCircular:
                Gauge(value: progress) {
                    // outer label (not shown in accessoryCircular)
                    EmptyView()
                } currentValueLabel: {
                    if isComplete {
                        Image(systemName: "checkmark")
                            .font(.system(size: 13, weight: .bold))
                    } else {
                        Text("\(khatma.completedJuz)")
                            .font(.system(size: 14, weight: .black, design: .rounded))
                    }
                }
                .gaugeStyle(.accessoryCircular)
                .widgetAccentable()   // tinted by user's accent / lock screen vibrancy

            // ── Lock screen: rectangular — progress summary ────────
            case .accessoryRectangular:
                HStack(alignment: .center, spacing: 10) {
                    // Mini arc
                    Gauge(value: progress) {
                        EmptyView()
                    } currentValueLabel: {
                        Text("\(khatma.completedJuz)")
                            .font(.system(size: 12, weight: .black, design: .rounded))
                    }
                    .gaugeStyle(.accessoryCircular)
                    .widgetAccentable()
                    .frame(width: 44, height: 44)

                    VStack(alignment: .leading, spacing: 3) {
                        Text("KHATMA")
                            .font(.system(size: 10, weight: .bold))
                            .kerning(0.6)
                            .foregroundStyle(.secondary)
                        Text(isComplete ? "Complete! ✦" : "\(khatma.completedJuz) / \(khatma.totalJuz) Juz")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.primary)
                        Text(isComplete ? "Maasha'Allah!" : "\(remaining) remaining")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }

            // ── Home screen: systemSmall ───────────────────────────
            default:
                VStack(alignment: .leading, spacing: 0) {
                    // Progress ring (custom SwiftUI arc — keeps brand color on home screen)
                    ZStack {
                        Circle()
                            .stroke(entry.palette.primaryText.opacity(0.15), lineWidth: 3.5)
                        Circle()
                            .trim(from: 0, to: progress)
                            .stroke(entry.palette.accent,
                                    style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                        Group {
                            if isComplete {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(entry.palette.accent)
                            } else {
                                Text("\(khatma.completedJuz)")
                                    .font(.system(size: 16, weight: .black, design: .rounded))
                                    .foregroundColor(entry.palette.primaryText)
                            }
                        }
                    }
                    .frame(width: 52, height: 52)
                    .padding(.bottom, 8)

                    Spacer()

                    Text(isComplete ? "COMPLETE" : "KHATMA")
                        .font(.system(size: 9, weight: .bold))
                        .kerning(0.6)
                        .foregroundColor(entry.palette.secondaryText)

                    Text(isComplete ? "30 / 30 ✦" : "\(khatma.completedJuz) / \(khatma.totalJuz)")
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundColor(entry.palette.primaryText)
                        .padding(.top, 1)

                    Text(isComplete ? "Masha'Allah!" : "\(remaining) remaining")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(entry.palette.accent)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .padding(14)
            }

        } else {
            // No data
            VStack(spacing: 6) {
                Image(systemName: "book.closed.fill")
                    .font(.system(size: 22))
                Text("Start Khatma")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// ── Widget ────────────────────────────────────────────────────────

struct KhatmaWidget: Widget {
    let kind = "KhatmaWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KhatmaProvider()) { entry in
            if #available(iOS 17.0, *) {
                KhatmaWidgetView(entry: entry)
                    .containerBackground(entry.palette.gradient, for: .widget)
            } else {
                ZStack {
                    entry.palette.gradient
                    KhatmaWidgetView(entry: entry)
                }
            }
        }
        .configurationDisplayName("Khatma Progress")
        .description("Quran completion — home & lock screen")
        .supportedFamilies([
            .systemSmall,
            .accessoryCircular,
            .accessoryRectangular,
        ])
    }
}
