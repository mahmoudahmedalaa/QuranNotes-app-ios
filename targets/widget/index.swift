import WidgetKit
import SwiftUI

@main
struct QuranNotesWidgetBundle: WidgetBundle {
    var body: some Widget {
        DailyVerseWidget()
        DailyHadithWidget()
        PrayerWidget()
        KhatmaWidget()
    }
}
