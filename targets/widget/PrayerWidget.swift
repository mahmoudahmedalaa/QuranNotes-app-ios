import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Prayer Widget — Next Prayer (Small)
// Same containerBackground pattern as DailyVerseWidget
// ═══════════════════════════════════════════════════════════════════

struct NextPrayerEntry: TimelineEntry {
    let date: Date
    let prayer: NextPrayerData?
    let palette: TimePalette
}

struct PrayerProvider: TimelineProvider {
    func placeholder(in context: Context) -> NextPrayerEntry {
        NextPrayerEntry(
            date: Date(),
            prayer: NextPrayerData(name: "Fajr", time: "05:30", countdown: "in 2h 15m"),
            palette: .current()
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (NextPrayerEntry) -> Void) {
        completion(NextPrayerEntry(
            date: Date(),
            prayer: WidgetDataStore.shared.getNextPrayer(),
            palette: .current()
        ))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NextPrayerEntry>) -> Void) {
        var entries: [NextPrayerEntry] = []
        let now = Date()
        let prayer = WidgetDataStore.shared.getNextPrayer()

        for offset in 0..<4 {
            if let date = Calendar.current.date(byAdding: .minute, value: offset * 15, to: now) {
                let hour = Calendar.current.component(.hour, from: date)
                entries.append(NextPrayerEntry(date: date, prayer: prayer, palette: TimePalette.forHour(hour)))
            }
        }

        let reload = Calendar.current.date(byAdding: .minute, value: 15, to: now) ?? now
        completion(Timeline(entries: entries, policy: .after(reload)))
    }
}

// ── Prayer Icon mapping ───────────────────────────────────────────

private func prayerIcon(for name: String) -> String {
    switch name.lowercased() {
    case "fajr":   return "moon.stars.fill"
    case "sunrise": return "sunrise.fill"
    case "dhuhr":  return "sun.max.fill"
    case "asr":    return "sun.min.fill"
    case "maghrib": return "sunset.fill"
    case "isha":   return "moon.fill"
    default:       return "clock.fill"
    }
}

// ── View ──────────────────────────────────────────────────────────

struct PrayerWidgetView: View {
    let entry: NextPrayerEntry

    var body: some View {
        ZStack {
            // Top glow
            EllipticalGradient(
                colors: [entry.palette.accent.opacity(0.3), entry.palette.accent.opacity(0)],
                center: .top,
                startRadiusFraction: 0,
                endRadiusFraction: 0.5
            )

            if let prayer = entry.prayer {
                VStack(spacing: 0) {
                    // Prayer icon with glowing circle
                    ZStack {
                        // Outer glow ring
                        Circle()
                            .fill(entry.palette.accent.opacity(0.15))
                            .frame(width: 46, height: 46)
                        // Inner circle
                        Circle()
                            .fill(.white.opacity(0.12))
                            .frame(width: 36, height: 36)
                        Image(systemName: prayerIcon(for: prayer.name))
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(entry.palette.accent)
                    }
                    .padding(.bottom, 6)

                    // Prayer name
                    Text(prayer.name)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)

                    // Time in accent colour
                    Text(prayer.time)
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(entry.palette.accent)
                        .padding(.top, 1)

                    // Countdown pill
                    Text(prayer.countdown)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.white.opacity(0.8))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(
                            Capsule().fill(.white.opacity(0.12))
                        )
                        .padding(.top, 5)
                }
            } else {
                VStack(spacing: 6) {
                    Image(systemName: "moon.stars.fill")
                        .font(.system(size: 24))
                        .foregroundColor(entry.palette.accent)
                    Text("Open app\nfor times")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.65))
                        .multilineTextAlignment(.center)
                }
            }
        }
    }
}

// ── Widget ────────────────────────────────────────────────────────

struct PrayerWidget: Widget {
    let kind = "PrayerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerProvider()) { entry in
            let gradient = LinearGradient(
                colors: entry.palette.gradientColors,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            PrayerWidgetContent(entry: entry, gradient: gradient)
        }
        .configurationDisplayName("Next Prayer")
        .description("Next prayer time with a countdown, adapts to time of day")
        .supportedFamilies([.systemSmall])
    }
}

private struct PrayerWidgetContent: View {
    let entry: NextPrayerEntry
    let gradient: LinearGradient

    var body: some View {
        if #available(iOS 17.0, *) {
            PrayerWidgetView(entry: entry)
                .containerBackground(gradient, for: .widget)
        } else {
            ZStack {
                gradient
                PrayerWidgetView(entry: entry)
            }
        }
    }
}
