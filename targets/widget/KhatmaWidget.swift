import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Khatma Progress Widget — Small
// Shows Quran completion progress ring
// ═══════════════════════════════════════════════════════════════════

struct KhatmaEntry: TimelineEntry {
    let date: Date
    let khatma: KhatmaData?
}

struct KhatmaProvider: TimelineProvider {
    func placeholder(in context: Context) -> KhatmaEntry {
        KhatmaEntry(date: Date(), khatma: KhatmaData(completedJuz: 5, totalJuz: 30, completedSurahs: 20))
    }
    
    func getSnapshot(in context: Context, completion: @escaping (KhatmaEntry) -> Void) {
        completion(KhatmaEntry(date: Date(), khatma: WidgetDataStore.shared.getKhatma()))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<KhatmaEntry>) -> Void) {
        let khatma = WidgetDataStore.shared.getKhatma()
        let entry = KhatmaEntry(date: Date(), khatma: khatma)
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 2, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

struct KhatmaSmallView: View {
    let entry: KhatmaEntry
    
    private var progress: Double {
        guard let k = entry.khatma, k.totalJuz > 0 else { return 0 }
        return Double(k.completedJuz) / Double(k.totalJuz)
    }
    
    var body: some View {
        if let khatma = entry.khatma {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "0F1419"), Color(hex: "1A2020")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                VStack(spacing: 6) {
                    // Progress ring
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.1), lineWidth: 5)
                            .frame(width: 56, height: 56)
                        
                        Circle()
                            .trim(from: 0, to: progress)
                            .stroke(
                                LinearGradient(
                                    colors: [Color(hex: "D4A853"), Color(hex: "E8C872")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                style: StrokeStyle(lineWidth: 5, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                            .frame(width: 56, height: 56)
                        
                        VStack(spacing: 0) {
                            Text("\(khatma.completedJuz)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(Color(hex: "D4A853"))
                            Text("/\(khatma.totalJuz)")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(Color(hex: "8892B0"))
                        }
                    }
                    
                    Text("Khatma")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)
                    
                    Text(khatma.completedJuz >= khatma.totalJuz
                         ? "Complete! 🏆"
                         : "\(khatma.totalJuz - khatma.completedJuz) remaining")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(Color(hex: "8892B0"))
                }
                .padding(8)
                
                // Branding dot
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Circle()
                            .fill(Color(hex: "D4A853"))
                            .frame(width: 4, height: 4)
                    }
                }
                .padding(10)
            }
        } else {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "0F1419"), Color(hex: "1A2020")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                VStack(spacing: 6) {
                    Image(systemName: "book.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(Color(hex: "D4A853"))
                    Text("Open app to\nstart Khatma")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(hex: "8892B0"))
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
        .description("Track your Quran completion progress")
        .supportedFamilies([.systemSmall])
    }
}
