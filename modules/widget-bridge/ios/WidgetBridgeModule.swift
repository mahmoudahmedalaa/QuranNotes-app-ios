import ExpoModulesCore
import WidgetKit

public class WidgetBridgeModule: Module {
    public func definition() -> ModuleDefinition {
        Name("WidgetBridge")
        
        // Write JSON data to shared UserDefaults
        Function("setWidgetData") { (key: String, jsonString: String) -> Bool in
            guard let defaults = UserDefaults(suiteName: "group.com.mahmoudahmedalaa.qurannotes") else {
                return false
            }
            guard let data = jsonString.data(using: .utf8) else {
                return false
            }
            defaults.set(data, forKey: "widgetData_\(key)")
            defaults.synchronize()
            return true
        }
        
        // Force all widgets to refresh
        Function("reloadAllWidgets") {
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
        
        // Reload a specific widget
        Function("reloadWidget") { (kind: String) in
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadTimelines(ofKind: kind)
            }
        }
    }
}
