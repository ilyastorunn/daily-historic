import SwiftUI
import UIKit
import WidgetKit

private enum WidgetConstants {
  static let appGroup = "group.com.ilyastorun.histora"
  static let payloadKey = "home_hero_payload_v1"
  static let widgetKind = "HistoriqHomeHeroWidget"
  static let timelineHours = 24
}

private struct HomeHeroWidgetPayload: Decodable {
  let version: Int
  let generatedAt: String
  let baseTimestamp: String
  let baseIndex: Int
  let rotationCadence: String
  let timezone: String?
  let deepLinkTemplate: String
  let events: [HomeHeroWidgetEventSnapshot]
  let theme: HomeHeroWidgetThemeSet
}

private struct HomeHeroWidgetThemeSet: Decodable {
  let light: HomeHeroWidgetStyleTokens
  let dark: HomeHeroWidgetStyleTokens
}

private struct HomeHeroWidgetEventSnapshot: Decodable {
  let id: String
  let imageUri: String?
  let content: HomeHeroWidgetEventContent
}

private struct HomeHeroWidgetEventContent: Decodable {
  let systemMedium: HomeHeroWidgetFamilyContent
  let systemLarge: HomeHeroWidgetFamilyContent
}

private struct HomeHeroWidgetFamilyContent: Decodable {
  let title: String
  let summary: String
  let meta: String?
  let yearLabel: String
  let titleMaxLines: Int
  let summaryMaxLines: Int
  let metaMaxLines: Int
}

private struct HomeHeroWidgetStyleTokens: Decodable {
  let colors: HomeHeroWidgetColorTokens
  let layout: HomeHeroWidgetLayoutTokens
  let typography: HomeHeroWidgetTypographySet
  let vignette: [HomeHeroWidgetVignetteStop]
}

private struct HomeHeroWidgetColorTokens: Decodable {
  let heroBackground: String
  let borderSubtle: String
  let textPrimary: String
  let textSecondary: String
  let textTertiary: String
  let accentPrimary: String
}

private struct HomeHeroWidgetLayoutTokens: Decodable {
  let cardCornerRadius: Double
  let bodyHorizontalPadding: Double
  let bodyVerticalPadding: Double
  let bodyGap: Double
  let yearPillHorizontalPadding: Double
  let yearPillVerticalPadding: Double
  let yearPillBorderWidth: Double
}

private struct HomeHeroWidgetTypographySet: Decodable {
  let year: HomeHeroWidgetTypographyToken
  let title: HomeHeroWidgetTypographyToken
  let summary: HomeHeroWidgetTypographyToken
  let meta: HomeHeroWidgetTypographyToken
}

private struct HomeHeroWidgetTypographyToken: Decodable {
  let fontSize: Double
  let lineHeight: Double
  let letterSpacing: Double?
  let textTransform: String?
}

private struct HomeHeroWidgetVignetteStop: Decodable {
  let offset: Double
  let color: String
}

private struct HomeHeroWidgetEntry: TimelineEntry {
  let date: Date
  let payload: HomeHeroWidgetPayload
  let event: HomeHeroWidgetEventSnapshot
  let eventIndex: Int
  let imageData: Data?
}

private struct HomeHeroWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> HomeHeroWidgetEntry {
    HomeHeroWidgetEntry(
      date: Date(),
      payload: .placeholder,
      event: .placeholder,
      eventIndex: 0,
      imageData: nil
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (HomeHeroWidgetEntry) -> Void) {
    let payload = loadPayload() ?? .placeholder
    let event = payload.events.first ?? .placeholder
    Task {
      let imageData = await downloadImage(from: event.imageUri)
      completion(HomeHeroWidgetEntry(
        date: Date(),
        payload: payload,
        event: event,
        eventIndex: 0,
        imageData: imageData
      ))
    }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<HomeHeroWidgetEntry>) -> Void) {
    let payload = loadPayload() ?? .placeholder
    let now = Date()

    Task {
      let imageDataMap = await downloadAllImages(for: payload)

      var entries: [HomeHeroWidgetEntry] = [buildEntry(for: now, payload: payload, imageDataMap: imageDataMap)]
      for hour in 1...WidgetConstants.timelineHours {
        let futureDate = now.addingTimeInterval(Double(hour) * 3600)
        entries.append(buildEntry(for: futureDate, payload: payload, imageDataMap: imageDataMap))
      }

      completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(3600))))
    }
  }

  private func downloadAllImages(for payload: HomeHeroWidgetPayload) async -> [String: Data] {
    var imageDataMap: [String: Data] = [:]
    await withTaskGroup(of: (String, Data?).self) { group in
      for event in payload.events {
        let eventId = event.id
        let imageUri = event.imageUri
        group.addTask {
          let data = await downloadImage(from: imageUri)
          return (eventId, data)
        }
      }
      for await (id, data) in group {
        if let data = data {
          imageDataMap[id] = data
        }
      }
    }
    return imageDataMap
  }

  private func loadPayload() -> HomeHeroWidgetPayload? {
    guard let defaults = UserDefaults(suiteName: WidgetConstants.appGroup) else {
      return nil
    }

    guard let rawPayload = defaults.string(forKey: WidgetConstants.payloadKey), !rawPayload.isEmpty else {
      return nil
    }

    guard let data = rawPayload.data(using: .utf8) else {
      return nil
    }

    do {
      return try JSONDecoder().decode(HomeHeroWidgetPayload.self, from: data)
    } catch {
      return nil
    }
  }

  private func buildEntry(
    for date: Date,
    payload: HomeHeroWidgetPayload,
    imageDataMap: [String: Data] = [:]
  ) -> HomeHeroWidgetEntry {
    let resolvedIndex = resolvedEventIndex(for: date, payload: payload)
    let safeIndex = min(max(resolvedIndex, 0), max(payload.events.count - 1, 0))
    let event = payload.events.isEmpty ? HomeHeroWidgetEventSnapshot.placeholder : payload.events[safeIndex]
    let imageData = imageDataMap[event.id]

    return HomeHeroWidgetEntry(
      date: date,
      payload: payload,
      event: event,
      eventIndex: payload.events.isEmpty ? 0 : safeIndex,
      imageData: imageData
    )
  }

  private func resolvedEventIndex(for date: Date, payload: HomeHeroWidgetPayload) -> Int {
    guard !payload.events.isEmpty else {
      return 0
    }

    let count = payload.events.count
    let normalizedBaseIndex = ((payload.baseIndex % count) + count) % count
    let baseDate = parseISODate(payload.baseTimestamp) ?? date
    let elapsedHours = max(0, Int(floor(date.timeIntervalSince(baseDate) / 3600)))

    return (normalizedBaseIndex + elapsedHours) % count
  }

  private func parseISODate(_ value: String) -> Date? {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    if let date = formatter.date(from: value) {
      return date
    }

    formatter.formatOptions = [.withInternetDateTime]
    return formatter.date(from: value)
  }
}

private func downloadImage(from urlString: String?) async -> Data? {
  guard let urlString = urlString, let url = URL(string: urlString) else {
    return nil
  }
  do {
    let (data, response) = try await URLSession.shared.data(from: url)
    guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
      return nil
    }
    return data
  } catch {
    return nil
  }
}

private struct HomeHeroWidgetEntryView: View {
  @Environment(\.widgetFamily) private var family
  @Environment(\.colorScheme) private var colorScheme

  let entry: HomeHeroWidgetEntry

  var body: some View {
    let style = colorScheme == .dark ? entry.payload.theme.dark : entry.payload.theme.light
    let content = family == .systemLarge ? entry.event.content.systemLarge : entry.event.content.systemMedium
    let backgroundColor = parseColor(style.colors.heroBackground, fallback: colorScheme == .dark ? .black : .white)
    let borderColor = parseColor(style.colors.borderSubtle, fallback: .gray.opacity(0.24))

    let widgetBody = GeometryReader { proxy in
      let mediaRatio = family == .systemLarge ? 0.56 : 0.52
      let mediaHeight = max(120, proxy.size.height * mediaRatio)

      VStack(spacing: 0) {
        ZStack {
          backgroundColor

          if let imageData = entry.imageData, let uiImage = UIImage(data: imageData) {
            Image(uiImage: uiImage)
              .resizable()
              .scaledToFill()
          }

          LinearGradient(
            gradient: Gradient(stops: style.vignette.map { stop in
              Gradient.Stop(
                color: parseColor(stop.color, fallback: Color.black.opacity(0.3)),
                location: min(max(stop.offset / 100.0, 0), 1)
              )
            }),
            startPoint: .top,
            endPoint: .bottom
          )
        }
        .frame(height: mediaHeight)
        .clipped()

        VStack(alignment: .leading, spacing: style.layout.bodyGap) {
          Text(content.yearLabel.uppercased())
            .font(.system(size: style.typography.year.fontSize, weight: .medium, design: .default))
            .foregroundStyle(parseColor(style.colors.accentPrimary, fallback: .green))
            .padding(.horizontal, style.layout.yearPillHorizontalPadding)
            .padding(.vertical, style.layout.yearPillVerticalPadding)
            .overlay(
              Capsule().stroke(parseColor(style.colors.accentPrimary, fallback: .green), lineWidth: style.layout.yearPillBorderWidth)
            )

          Text(content.title)
            .font(.system(size: style.typography.title.fontSize, weight: .regular, design: .serif))
            .foregroundStyle(parseColor(style.colors.textPrimary, fallback: .primary))
            .lineLimit(content.titleMaxLines)

          Text(content.summary)
            .font(.system(size: style.typography.summary.fontSize, weight: .regular, design: .default))
            .foregroundStyle(parseColor(style.colors.textSecondary, fallback: .secondary))
            .lineLimit(content.summaryMaxLines)

          if let meta = content.meta, !meta.isEmpty {
            Text(meta)
              .font(.system(size: style.typography.meta.fontSize, weight: .regular, design: .default))
              .foregroundStyle(parseColor(style.colors.textTertiary, fallback: .secondary.opacity(0.8)))
              .lineLimit(content.metaMaxLines)
          }

          Spacer(minLength: 0)
        }
        .padding(.horizontal, style.layout.bodyHorizontalPadding)
        .padding(.vertical, style.layout.bodyVerticalPadding)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(backgroundColor)
      }
      .frame(width: proxy.size.width, height: proxy.size.height)
      .background(backgroundColor)
      .clipShape(RoundedRectangle(cornerRadius: style.layout.cardCornerRadius, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: style.layout.cardCornerRadius, style: .continuous)
          .stroke(borderColor, lineWidth: 0.6)
      )
    }

    if #available(iOS 17.0, *) {
      widgetBody
        .containerBackground(backgroundColor, for: .widget)
        .widgetURL(makeWidgetURL())
    } else {
      widgetBody
        .background(backgroundColor)
        .widgetURL(makeWidgetURL())
    }
  }

  private func makeWidgetURL() -> URL? {
    let encodedID = entry.event.id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? entry.event.id
    let urlString = entry.payload.deepLinkTemplate
      .replacingOccurrences(of: "{id}", with: encodedID)
      .replacingOccurrences(of: "{index}", with: String(entry.eventIndex))

    return URL(string: urlString)
  }

  private func parseColor(_ raw: String, fallback: Color) -> Color {
    let value = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

    if value.hasPrefix("#") {
      return parseHexColor(value, fallback: fallback)
    }

    if value.hasPrefix("rgba(") || value.hasPrefix("rgb(") {
      return parseRGBAColor(value, fallback: fallback)
    }

    return fallback
  }

  private func parseHexColor(_ value: String, fallback: Color) -> Color {
    var hex = value.replacingOccurrences(of: "#", with: "")

    if hex.count == 3 {
      hex = hex.map { "\($0)\($0)" }.joined()
    }

    guard hex.count == 6 || hex.count == 8,
          let intValue = UInt64(hex, radix: 16)
    else {
      return fallback
    }

    let r: Double
    let g: Double
    let b: Double
    let a: Double

    if hex.count == 8 {
      r = Double((intValue & 0xFF000000) >> 24) / 255.0
      g = Double((intValue & 0x00FF0000) >> 16) / 255.0
      b = Double((intValue & 0x0000FF00) >> 8) / 255.0
      a = Double(intValue & 0x000000FF) / 255.0
    } else {
      r = Double((intValue & 0xFF0000) >> 16) / 255.0
      g = Double((intValue & 0x00FF00) >> 8) / 255.0
      b = Double(intValue & 0x0000FF) / 255.0
      a = 1.0
    }

    return Color(.sRGB, red: r, green: g, blue: b, opacity: a)
  }

  private func parseRGBAColor(_ value: String, fallback: Color) -> Color {
    guard let start = value.firstIndex(of: "("),
          let end = value.lastIndex(of: ")"),
          start < end
    else {
      return fallback
    }

    let componentsString = value[value.index(after: start)..<end]
    let components = componentsString
      .split(separator: ",")
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }

    guard components.count == 3 || components.count == 4,
          let r = Double(components[0]),
          let g = Double(components[1]),
          let b = Double(components[2])
    else {
      return fallback
    }

    let alpha: Double
    if components.count == 4, let parsedAlpha = Double(components[3]) {
      alpha = parsedAlpha
    } else {
      alpha = 1.0
    }

    return Color(.sRGB, red: r / 255.0, green: g / 255.0, blue: b / 255.0, opacity: alpha)
  }
}

struct HistoriqHomeHeroWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: WidgetConstants.widgetKind, provider: HomeHeroWidgetProvider()) { entry in
      HomeHeroWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Daily Historic")
    .description("Home carousel events in a rotating medium and large widget.")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}

private extension HomeHeroWidgetPayload {
  static var placeholder: HomeHeroWidgetPayload {
    HomeHeroWidgetPayload(
      version: 2,
      generatedAt: Date().ISO8601Format(),
      baseTimestamp: Date().ISO8601Format(),
      baseIndex: 0,
      rotationCadence: "hourly",
      timezone: TimeZone.current.identifier,
      deepLinkTemplate: "historiq://event/{id}?source=home-widget&index={index}",
      events: [.placeholder],
      theme: .placeholder
    )
  }
}

private extension HomeHeroWidgetThemeSet {
  static var placeholder: HomeHeroWidgetThemeSet {
    HomeHeroWidgetThemeSet(
      light: .placeholderLight,
      dark: .placeholderDark
    )
  }
}

private extension HomeHeroWidgetStyleTokens {
  static var placeholderLight: HomeHeroWidgetStyleTokens {
    HomeHeroWidgetStyleTokens(
      colors: HomeHeroWidgetColorTokens(
        heroBackground: "#EDE7DE",
        borderSubtle: "#e5d9c8",
        textPrimary: "#1c1a16",
        textSecondary: "#6d675c",
        textTertiary: "#8d867a",
        accentPrimary: "#708C77"
      ),
      layout: HomeHeroWidgetLayoutTokens(
        cardCornerRadius: 16,
        bodyHorizontalPadding: 24,
        bodyVerticalPadding: 18,
        bodyGap: 8,
        yearPillHorizontalPadding: 12,
        yearPillVerticalPadding: 4,
        yearPillBorderWidth: 1
      ),
      typography: HomeHeroWidgetTypographySet(
        year: HomeHeroWidgetTypographyToken(fontSize: 12, lineHeight: 14, letterSpacing: 0.8, textTransform: "uppercase"),
        title: HomeHeroWidgetTypographyToken(fontSize: 30, lineHeight: 36, letterSpacing: -0.3, textTransform: nil),
        summary: HomeHeroWidgetTypographyToken(fontSize: 16, lineHeight: 22, letterSpacing: nil, textTransform: nil),
        meta: HomeHeroWidgetTypographyToken(fontSize: 13, lineHeight: 18, letterSpacing: nil, textTransform: nil)
      ),
      vignette: [
        HomeHeroWidgetVignetteStop(offset: 0, color: "rgba(12, 10, 6, 0.1)"),
        HomeHeroWidgetVignetteStop(offset: 100, color: "rgba(12, 10, 6, 0.55)"),
      ]
    )
  }

  static var placeholderDark: HomeHeroWidgetStyleTokens {
    HomeHeroWidgetStyleTokens(
      colors: HomeHeroWidgetColorTokens(
        heroBackground: "#353128",
        borderSubtle: "rgba(214, 206, 192, 0.35)",
        textPrimary: "#EDE7DE",
        textSecondary: "#c8c0b3",
        textTertiary: "#9f978a",
        accentPrimary: "#9bbb92"
      ),
      layout: HomeHeroWidgetLayoutTokens(
        cardCornerRadius: 16,
        bodyHorizontalPadding: 24,
        bodyVerticalPadding: 18,
        bodyGap: 8,
        yearPillHorizontalPadding: 12,
        yearPillVerticalPadding: 4,
        yearPillBorderWidth: 1
      ),
      typography: HomeHeroWidgetTypographySet(
        year: HomeHeroWidgetTypographyToken(fontSize: 12, lineHeight: 14, letterSpacing: 0.8, textTransform: "uppercase"),
        title: HomeHeroWidgetTypographyToken(fontSize: 30, lineHeight: 36, letterSpacing: -0.3, textTransform: nil),
        summary: HomeHeroWidgetTypographyToken(fontSize: 16, lineHeight: 22, letterSpacing: nil, textTransform: nil),
        meta: HomeHeroWidgetTypographyToken(fontSize: 13, lineHeight: 18, letterSpacing: nil, textTransform: nil)
      ),
      vignette: [
        HomeHeroWidgetVignetteStop(offset: 0, color: "rgba(12, 10, 6, 0.1)"),
        HomeHeroWidgetVignetteStop(offset: 100, color: "rgba(12, 10, 6, 0.55)"),
      ]
    )
  }
}

private extension HomeHeroWidgetEventSnapshot {
  static var placeholder: HomeHeroWidgetEventSnapshot {
    HomeHeroWidgetEventSnapshot(
      id: "placeholder-event",
      imageUri: nil,
      content: HomeHeroWidgetEventContent(
        systemMedium: HomeHeroWidgetFamilyContent(
          title: "Daily Historic",
          summary: "Moments from history, curated for today.",
          meta: "Widget Preview",
          yearLabel: "Today",
          titleMaxLines: 2,
          summaryMaxLines: 3,
          metaMaxLines: 1
        ),
        systemLarge: HomeHeroWidgetFamilyContent(
          title: "Daily Historic",
          summary: "Moments from history, curated for today.",
          meta: "Widget Preview",
          yearLabel: "Today",
          titleMaxLines: 3,
          summaryMaxLines: 5,
          metaMaxLines: 2
        )
      )
    )
  }
}
