import Foundation
import WidgetKit

@objc(HistoriqWidgetReloader)
final class HistoriqWidgetReloader: NSObject {
  @objc
  static func reloadTimelinesOfKind(_ kind: String) {
    guard #available(iOS 14.0, *) else {
      return
    }

    WidgetCenter.shared.reloadTimelines(ofKind: kind)
  }

  @objc
  static func reloadAllTimelines() {
    guard #available(iOS 14.0, *) else {
      return
    }

    WidgetCenter.shared.reloadAllTimelines()
  }
}
