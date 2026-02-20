import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Khatma Progress Widget — Small
// Beautiful progress ring with time-adaptive styling
// ═══════════════════════════════════════════════════════════════════

struct KhatmaEntry: TimelineEntry {
    let date: Date
    let khatma: KhatmaData?
    let timeOfDay: TimeOfDay
}

struct KhatmaProvider: TimelineProvider {
    func placeholder(in context: Context) -> KhatmaEntry {
        KhatmaEntry(date: Date(), khatma: KhatmaData(completedJuz: 5, totalJuz: 30, completedSurahs: 20), timeOfDay: .current())
    }
    
    func getSnapshot(in context: Context, completion: @escaping (KhatmaEntry) -> Void) {
        completion(KhatmaEntry(
            date: Date(),
            khatma: WidgetDataStore.shared.getKhatma(),
            timeOfDay: .current()
        ))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<KhatmaEntry>) -> Void) {
        let khatma = WidgetDataStore.shared.getKhatma()
        var entries: [KhatmaEntry] = []
        let now = Date()
        
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
            entries.append(KhatmaEntry(date: date, khatma: khatma, timeOfDay: tod))
        }
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 6, to: now)!
        completion(Timeline(entries: entries, policy: .after(nextUpdate)))
    }
}

struct KhatmaSmallView: View {
    let entry: KhatmaEntry
    
    private var progress: Double {
        guard let k = entry.khatma, k.totalJuz > 0 else { return 0 }
        return Double(k.completedJuz) / Double(k.totalJuz)
    }
    
    private var isComplete: Bool {
        guard let k = entry.khatma else { return false }
        return k.completedJuz >= k.totalJuz
    }
    
    var body: some View {
        let tod = entry.timeOfDay
        
        if let khatma = entry.khatma {
            ZStack {
                // Time-adaptive gradient
                LinearGradient(
                    colors: tod.gradientColors,
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                // Soft glow behind ring
                RadialGradient(
                    colors: [tod.accentColor.opacity(0.1), Color.clear],
                    center: .center,
                    startRadius: 0,
                    endRadius: 70
                )
                
                VStack(spacing: 5) {
                    // Progress ring
                    ZStack {
                        // Background track
                        Circle()
                            .stroke(Color.white.opacity(0.08), lineWidth: 6)
                            .frame(width: 62, height: 62)
                        
                        // Progress arc with gradient
                        Circle()
                            .trim(from: 0, to: progress)
                            .stroke(
                                AngularGradient(
                                    colors: [
                                        tod.accentColor.opacity(0.6),
                                        tod.accentColor,
                                        tod.accentColor.opacity(0.8),
                                    ],
                                    center: .center
                                ),
                                style: StrokeStyle(lineWidth: 6, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                            .frame(width: 62, height: 62)
                            .shadow(color: tod.accentColor.opacity(0.4), radius: 4)
                        
                        // Center content
                        VStack(spacing: 0) {
                            if isComplete {
                                Image(systemName: "checkmark.seal.fill")
                                    .font(.system(size: 20))
                                    .foregroundColor(tod.accentColor)
                            } else {
                                Text("\(khatma.completedJuz)")
                                    .font(.system(size: 20, weight: .bold, design: .rounded))
                                    .foregroundColor(.white)
                                Text("of \(khatma.totalJuz)")
                                    .font(.system(size: 8, weight: .medium))
                                    .foregroundColor(tod.subtextColor)
                            }
                        }
                    }
                    
                    // Label
                    Text("Khatma")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    
                    // Status
                    Text(isComplete
                         ? "Complete! ✨"
                         : "\(khatma.totalJuz - khatma.completedJuz) Juz remaining")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(tod.subtextColor)
                }
                .padding(8)
                
                // Branding
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Image(systemName: "book.fill")
                            .font(.system(size: 5))
                            .foregroundColor(tod.subtextColor.opacity(0.5))
                    }
                }
                .padding(8)
            }
        } else {
            ZStack {
                LinearGradient(colors: tod.gradientColors, startPoint: .topLeading, endPoint: .bottomTrailing)
                VStack(spacing: 8) {
                    ZStack {
                        Circle().fill(tod.accentColor.opacity(0.12)).frame(width: 44, height: 44)
                        Image(systemName: "book.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(tod.accentColor)
                    }
                    Text("Open app to\ntrack Khatma")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(tod.subtextColor)
                        .multilineTextAlignment(.center)
                }
            }
        }
    }
}

struct KhatmaWidget: Widget {
    let kind = "KhatmaWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KhatmaProvider()) { entry in
            if #available(iOS 17.0, *) {
                KhatmaSmallView(entry: entry)
                    .containerBackground(.clear, for: .widget)
            } else {
                KhatmaSmallView(entry: entry)
            }
        }
        .configurationDisplayName("Khatma Progress")
        .description("Your Quran completion journey at a glance")
        .supportedFamilies([.systemSmall])
    }
}
