import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Next Prayer Widget — Small
// Shows countdown to the next prayer time
// ═══════════════════════════════════════════════════════════════════

struct PrayerEntry: TimelineEntry {
    let date: Date
    let prayer: NextPrayerData?
}

struct PrayerProvider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerEntry {
        PrayerEntry(date: Date(), prayer: NextPrayerData(
            name: "Asr", time: "15:27", timestamp: Date().timeIntervalSince1970 + 3600
        ))
    }
    
    func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
        completion(PrayerEntry(date: Date(), prayer: WidgetDataStore.shared.getNextPrayer()))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
        let prayer = WidgetDataStore.shared.getNextPrayer()
        let entry = PrayerEntry(date: Date(), prayer: prayer)
        // Refresh every 15 minutes for countdown accuracy
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

struct PrayerSmallView: View {
    let entry: PrayerEntry
    
    private var prayerIcon: String {
        switch entry.prayer?.name.lowercased() {
        case "fajr": return "sunrise.fill"
        case "sunrise": return "sun.horizon.fill"
        case "dhuhr": return "sun.max.fill"
        case "asr": return "sun.min.fill"
        case "maghrib": return "sunset.fill"
        case "isha": return "moon.stars.fill"
        default: return "clock.fill"
        }
    }
    
    private var countdown: String {
        guard let prayer = entry.prayer else { return "" }
        let diff = prayer.timestamp - Date().timeIntervalSince1970
        guard diff > 0 else { return "Now" }
        let hours = Int(diff) / 3600
        let minutes = (Int(diff) % 3600) / 60
        if hours > 0 {
            return "in \(hours)h \(minutes)m"
        }
        return "in \(minutes)m"
    }
    
    var body: some View {
        if let prayer = entry.prayer {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "0F1419"), Color(hex: "1A2535")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                VStack(spacing: 6) {
                    // Prayer icon
                    Image(systemName: prayerIcon)
                        .font(.system(size: 22))
                        .foregroundColor(Color(hex: "D4A853"))
                    
                    // "NEXT PRAYER" label
                    Text("NEXT PRAYER")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(Color(hex: "8892B0"))
                        .tracking(1)
                    
                    // Prayer name
                    Text(prayer.name)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)
                    
                    // Time
                    Text(prayer.time)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(hex: "5B7FFF"))
                    
                    // Countdown
                    Text(countdown)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(Color(hex: "8892B0"))
                }
                .padding(8)
                
                // QuranNotes branding - bottom right corner
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Circle()
                            .fill(Color(hex: "5B7FFF"))
                            .frame(width: 4, height: 4)
                    }
                }
                .padding(10)
            }
        } else {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "0F1419"), Color(hex: "1A2535")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                VStack(spacing: 6) {
                    Image(systemName: "clock.fill")
                        .font(.system(size: 22))
                        .foregroundColor(Color(hex: "D4A853"))
                    Text("Open app for\nprayer times")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(hex: "8892B0"))
                        .multilineTextAlignment(.center)
                }
            }
        }
    }
}

struct PrayerWidget: Widget {
    let kind = "PrayerWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerProvider()) { entry in
            if #available(iOS 17.0, *) {
                PrayerSmallView(entry: entry)
                    .containerBackground(.clear, for: .widget)
            } else {
                PrayerSmallView(entry: entry)
            }
        }
        .configurationDisplayName("Next Prayer")
        .description("Countdown to the next prayer time")
        .supportedFamilies([.systemSmall])
    }
}
