import WidgetKit
import SwiftUI

// ═══════════════════════════════════════════════════════════════════
// Khatma Widget — Progress Ring (Small)
// Same containerBackground pattern + shared TimePalette
// ═══════════════════════════════════════════════════════════════════

struct KhatmaEntry: TimelineEntry {
    let date: Date
    let khatma: KhatmaData?
    let palette: TimePalette
}

struct KhatmaProvider: TimelineProvider {
    func placeholder(in context: Context) -> KhatmaEntry {
        KhatmaEntry(
            date: Date(),
            khatma: KhatmaData(completedJuz: 12, completedSurahs: 0, totalJuz: 30),
            palette: .current()
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (KhatmaEntry) -> Void) {
        completion(KhatmaEntry(
            date: Date(),
            khatma: WidgetDataStore.shared.getKhatma(),
            palette: .current()
        ))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<KhatmaEntry>) -> Void) {
        let khatma = WidgetDataStore.shared.getKhatma()
        var entries: [KhatmaEntry] = []
        let now = Date()

        for offset in 0..<6 {
            if let date = Calendar.current.date(byAdding: .hour, value: offset, to: now) {
                let hour = Calendar.current.component(.hour, from: date)
                entries.append(KhatmaEntry(date: date, khatma: khatma, palette: TimePalette.forHour(hour)))
            }
        }

        let reload = Calendar.current.date(byAdding: .hour, value: 6, to: now) ?? now
        completion(Timeline(entries: entries, policy: .after(reload)))
    }
}

// ── View ──────────────────────────────────────────────────────────

struct KhatmaWidgetView: View {
    let entry: KhatmaEntry

    var body: some View {
        ZStack {
            // Top glow
            EllipticalGradient(
                colors: [entry.palette.accent.opacity(0.28), entry.palette.accent.opacity(0)],
                center: .top,
                startRadiusFraction: 0,
                endRadiusFraction: 0.5
            )

            if let khatma = entry.khatma {
                let progress = Double(khatma.completedJuz) / Double(khatma.totalJuz)
                let isComplete = khatma.completedJuz >= khatma.totalJuz

                VStack(spacing: 4) {
                    // Progress ring
                    ZStack {
                        // Track ring
                        Circle()
                            .stroke(.white.opacity(0.1), lineWidth: 5)
                            .frame(width: 60, height: 60)

                        // Progress arc with angular gradient
                        Circle()
                            .trim(from: 0, to: progress)
                            .stroke(
                                AngularGradient(
                                    gradient: Gradient(colors: [
                                        entry.palette.accent,
                                        entry.palette.accent.opacity(0.6)
                                    ]),
                                    center: .center,
                                    startAngle: .degrees(-90),
                                    endAngle: .degrees(270)
                                ),
                                style: StrokeStyle(lineWidth: 5, lineCap: .round)
                            )
                            .frame(width: 60, height: 60)
                            .rotationEffect(.degrees(-90))
                            // Glow shadow on the arc
                            .shadow(color: entry.palette.accent.opacity(0.5), radius: 4, x: 0, y: 0)

                        // Center content
                        VStack(spacing: 0) {
                            if isComplete {
                                Image(systemName: "star.fill")
                                    .font(.system(size: 18))
                                    .foregroundColor(entry.palette.accent)
                            } else {
                                Text("\(khatma.completedJuz)")
                                    .font(.system(size: 16, weight: .black, design: .rounded))
                                    .foregroundColor(.white)
                                Text("of \(khatma.totalJuz)")
                                    .font(.system(size: 7, weight: .medium))
                                    .foregroundColor(.white.opacity(0.5))
                            }
                        }
                    }

                    // Label
                    Text(isComplete ? "Complete!" : "Khatma")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    // Progress sub-label or completion badge
                    if isComplete {
                        HStack(spacing: 2) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 8))
                            Text("30/30 Juz")
                                .font(.system(size: 9, weight: .semibold))
                        }
                        .foregroundColor(entry.palette.accent)
                    } else {
                        let remaining = khatma.totalJuz - khatma.completedJuz
                        Text("\(remaining) remaining")
                            .font(.system(size: 10))
                            .foregroundColor(.white.opacity(0.55))
                    }
                }
            } else {
                VStack(spacing: 6) {
                    Image(systemName: "book.closed.fill")
                        .font(.system(size: 24))
                        .foregroundColor(entry.palette.accent)
                    Text("Start your\nKhatma")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.65))
                        .multilineTextAlignment(.center)
                }
            }
        }
    }
}

// ── Widget ────────────────────────────────────────────────────────

struct KhatmaWidget: Widget {
    let kind = "KhatmaWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KhatmaProvider()) { entry in
            let gradient = LinearGradient(
                colors: entry.palette.gradientColors,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            KhatmaWidgetContent(entry: entry, gradient: gradient)
        }
        .configurationDisplayName("Khatma Progress")
        .description("Your Quran completion progress, adapts beautifully to time of day")
        .supportedFamilies([.systemSmall])
    }
}

private struct KhatmaWidgetContent: View {
    let entry: KhatmaEntry
    let gradient: LinearGradient

    var body: some View {
        if #available(iOS 17.0, *) {
            KhatmaWidgetView(entry: entry)
                .containerBackground(gradient, for: .widget)
        } else {
            ZStack {
                gradient
                KhatmaWidgetView(entry: entry)
            }
        }
    }
}
