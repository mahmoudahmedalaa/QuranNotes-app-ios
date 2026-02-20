import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Next Prayer Widget — Small
// Time-adaptive, beautiful countdown to next prayer
// ═══════════════════════════════════════════════════════════════════

struct PrayerEntry: TimelineEntry {
    let date: Date
    let prayer: NextPrayerData?
    let timeOfDay: TimeOfDay
}

struct PrayerProvider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerEntry {
        PrayerEntry(date: Date(), prayer: NextPrayerData(
            name: "Asr", time: "15:27", timestamp: Date().timeIntervalSince1970 + 3600
        ), timeOfDay: .current())
    }
    
    func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
        completion(PrayerEntry(
            date: Date(),
            prayer: WidgetDataStore.shared.getNextPrayer(),
            timeOfDay: .current()
        ))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
        let prayer = WidgetDataStore.shared.getNextPrayer()
        var entries: [PrayerEntry] = []
        let now = Date()
        
        // Update every 15 minutes for countdown + gradient changes
        for minuteOffset in stride(from: 0, to: 120, by: 15) {
            let date = Calendar.current.date(byAdding: .minute, value: minuteOffset, to: now)!
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
            entries.append(PrayerEntry(date: date, prayer: prayer, timeOfDay: tod))
        }
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 2, to: now)!
        completion(Timeline(entries: entries, policy: .after(nextUpdate)))
    }
}

struct PrayerSmallView: View {
    let entry: PrayerEntry
    
    private var prayerIcon: String {
        switch entry.prayer?.name.lowercased() {
        case "fajr":    return "sunrise.fill"
        case "sunrise": return "sun.horizon.fill"
        case "dhuhr":   return "sun.max.fill"
        case "asr":     return "sun.min.fill"
        case "maghrib": return "sunset.fill"
        case "isha":    return "moon.stars.fill"
        default:        return "clock.fill"
        }
    }
    
    private var countdown: String {
        guard let prayer = entry.prayer else { return "" }
        let diff = prayer.timestamp - entry.date.timeIntervalSince1970
        guard diff > 0 else { return "Now" }
        let hours = Int(diff) / 3600
        let minutes = (Int(diff) % 3600) / 60
        if hours > 0 { return "in \(hours)h \(minutes)m" }
        return "in \(minutes)m"
    }
    
    var body: some View {
        let tod = entry.timeOfDay
        
        if let prayer = entry.prayer {
            ZStack {
                // Time-adaptive gradient
                LinearGradient(
                    colors: tod.gradientColors,
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                // Subtle glow behind icon
                RadialGradient(
                    colors: [tod.accentColor.opacity(0.15), Color.clear],
                    center: .center,
                    startRadius: 0,
                    endRadius: 80
                )
                
                VStack(spacing: 6) {
                    // Prayer icon with glow
                    ZStack {
                        Circle()
                            .fill(tod.accentColor.opacity(0.12))
                            .frame(width: 38, height: 38)
                        Image(systemName: prayerIcon)
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(tod.accentColor)
                            .shadow(color: tod.accentColor.opacity(0.5), radius: 4)
                    }
                    
                    // Prayer name
                    Text(prayer.name)
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    
                    // Time
                    Text(prayer.time)
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(tod.accentColor)
                    
                    // Countdown pill
                    Text(countdown)
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(.white.opacity(0.9))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(
                            Capsule().fill(Color.white.opacity(0.12))
                        )
                }
                .padding(8)
                
                // QuranNotes branding dot
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        HStack(spacing: 2) {
                            Image(systemName: "book.fill")
                                .font(.system(size: 5))
                                .foregroundColor(tod.subtextColor.opacity(0.5))
                        }
                    }
                }
                .padding(8)
            }
        } else {
            ZStack {
                LinearGradient(colors: tod.gradientColors, startPoint: .topLeading, endPoint: .bottomTrailing)
                VStack(spacing: 8) {
                    ZStack {
                        Circle().fill(tod.accentColor.opacity(0.12)).frame(width: 38, height: 38)
                        Image(systemName: "clock.fill")
                            .font(.system(size: 18))
                            .foregroundColor(tod.accentColor)
                    }
                    Text("Open app for\nprayer times")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(tod.subtextColor)
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
        .description("Beautiful countdown to the next prayer")
        .supportedFamilies([.systemSmall])
    }
}
