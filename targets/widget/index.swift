import WidgetKit
import SwiftUI

@main
struct QuranNotesWidgetBundle: WidgetBundle {
    var body: some Widget {
        DailyVerseWidget()
        PrayerWidget()
        KhatmaWidget()
    }
}
