import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Prayer Widget
// Home screen (.systemSmall) + Lock screen (.accessoryRectangular,
// .accessoryCircular, .accessoryInline)
//
// Prayer is the MOST useful lock screen content for a Muslim user:
// visible 80+ times/day before unlocking. Every family is designed
// to be maximally glanceable.
// ═══════════════════════════════════════════════════════════════════

struct NextPrayerEntry: TimelineEntry {
    let date: Date
    let prayer: NextPrayerData?
    let palette: TimePalette
}

struct PrayerProvider: TimelineProvider {
    func placeholder(in context: Context) -> NextPrayerEntry {
        NextPrayerEntry(date: Date(),
            prayer: NextPrayerData(name: "Fajr", time: "05:30",
                timestamp: Date().timeIntervalSince1970 + 8100),
            palette: .current())
    }
    func getSnapshot(in context: Context, completion: @escaping (NextPrayerEntry) -> Void) {
        completion(NextPrayerEntry(date: Date(),
            prayer: WidgetDataStore.shared.getNextPrayer(), palette: .current()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<NextPrayerEntry>) -> Void) {
        let prayer = WidgetDataStore.shared.getNextPrayer()
        let now = Date()
        var entries: [NextPrayerEntry] = []
        for offset in 0..<4 {
            if let d = Calendar.current.date(byAdding: .minute, value: offset * 15, to: now) {
                entries.append(NextPrayerEntry(date: d, prayer: prayer,
                    palette: TimePalette.forHour(Calendar.current.component(.hour, from: d))))
            }
        }
        completion(Timeline(entries: entries,
            policy: .after(Calendar.current.date(byAdding: .minute, value: 15, to: now) ?? now)))
    }
}

// ── Helpers ───────────────────────────────────────────────────────

private func prayerIcon(for name: String) -> String {
    switch name.lowercased() {
    case "fajr":    return "moon.stars.fill"
    case "sunrise": return "sunrise.fill"
    case "dhuhr":   return "sun.max.fill"
    case "asr":     return "sun.min.fill"
    case "maghrib": return "sunset.fill"
    case "isha":    return "moon.fill"
    default:        return "clock.fill"
    }
}

private func countdown(from entry: NextPrayerEntry, prayer: NextPrayerData) -> String {
    let secs = prayer.timestamp - entry.date.timeIntervalSince1970
    guard secs > 0 else { return "Now" }
    let h = Int(secs) / 3600
    let m = (Int(secs) % 3600) / 60
    return h > 0 ? "in \(h)h \(m)m" : "in \(m)m"
}

// ── Views ─────────────────────────────────────────────────────────

struct PrayerWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: NextPrayerEntry

    var body: some View {
        if let prayer = entry.prayer {
            let cd = countdown(from: entry, prayer: prayer)
            switch family {

            // ── Lock screen: rectangular — most detail ─────────────
            case .accessoryRectangular:
                HStack(alignment: .center, spacing: 10) {
                    Image(systemName: prayerIcon(for: prayer.name))
                        .font(.system(size: 28, weight: .medium))
                        .widgetAccentable()

                    VStack(alignment: .leading, spacing: 3) {
                        Text(prayer.name.uppercased())
                            .font(.system(size: 10, weight: .bold))
                            .kerning(0.6)
                            .foregroundStyle(.secondary)
                        Text(prayer.time)
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundStyle(.primary)
                        Text(cd)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.secondary)
                            .widgetAccentable()
                    }
                    Spacer()
                }

            // ── Lock screen: circular — icon + time ───────────────
            case .accessoryCircular:
                VStack(spacing: 2) {
                    Image(systemName: prayerIcon(for: prayer.name))
                        .font(.system(size: 18, weight: .medium))
                        .widgetAccentable()
                    Text(prayer.time)
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(.primary)
                        .minimumScaleFactor(0.7)
                }

            // ── Lock screen: inline — one line above clock ─────────
            case .accessoryInline:
                Label("\(prayer.name) · \(prayer.time) · \(cd)",
                      systemImage: prayerIcon(for: prayer.name))

            // ── Home screen: systemSmall ───────────────────────────
            default:
                VStack(alignment: .leading, spacing: 0) {
                    Image(systemName: prayerIcon(for: prayer.name))
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(entry.palette.accent)
                        .padding(.bottom, 6)
                    Spacer()
                    Text(prayer.name.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .kerning(0.6)
                        .foregroundColor(entry.palette.secondaryText)
                    Text(prayer.time)
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundColor(entry.palette.primaryText)
                        .padding(.top, 1)
                    Text(cd)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(entry.palette.accent)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .padding(14)
            }

        } else {
            // No data state (all families)
            VStack(spacing: 6) {
                Image(systemName: "moon.stars.fill")
                    .font(.system(size: 22))
                    .foregroundColor(TimePalette.current().accent)
                Text("Open app\nfor prayer times")
                    .font(.system(size: 11))
                    .foregroundColor(TimePalette.current().secondaryText)
                    .multilineTextAlignment(.center)
            }
        }
    }
}

// ── Widget ────────────────────────────────────────────────────────

struct PrayerWidget: Widget {
    let kind = "PrayerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerProvider()) { entry in
            if #available(iOS 17.0, *) {
                PrayerWidgetView(entry: entry)
                    .containerBackground(entry.palette.gradient, for: .widget)
            } else {
                ZStack {
                    entry.palette.gradient
                    PrayerWidgetView(entry: entry)
                }
            }
        }
        .configurationDisplayName("Next Prayer")
        .description("Upcoming prayer time — home & lock screen")
        .supportedFamilies([
            .systemSmall,
            .accessoryRectangular,
            .accessoryCircular,
            .accessoryInline,
        ])
    }
}
