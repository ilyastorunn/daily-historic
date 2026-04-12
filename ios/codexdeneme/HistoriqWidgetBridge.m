#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#if __has_include("codexdeneme-Swift.h")
#import "codexdeneme-Swift.h"
#endif

static NSString *const kHistoriqWidgetAppGroup = @"group.com.ilyastorun.histora";
static NSString *const kHistoriqWidgetPayloadKey = @"home_hero_payload_v1";
static NSString *const kHistoriqWidgetKind = @"HistoriqHomeHeroWidget";

@interface HistoriqWidgetBridge : NSObject <RCTBridgeModule>
@end

@implementation HistoriqWidgetBridge

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_REMAP_METHOD(setHomeHeroPayload,
                 setHomeHeroPayload:(NSString *)payloadJson
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (![payloadJson isKindOfClass:[NSString class]] || payloadJson.length == 0) {
    reject(@"E_WIDGET_PAYLOAD_EMPTY", @"Widget payload is empty.", nil);
    return;
  }

  NSUserDefaults *sharedDefaults = [[NSUserDefaults alloc] initWithSuiteName:kHistoriqWidgetAppGroup];
  if (sharedDefaults == nil) {
    reject(@"E_WIDGET_APP_GROUP_UNAVAILABLE", @"App Group user defaults are unavailable.", nil);
    return;
  }

  [sharedDefaults setObject:payloadJson forKey:kHistoriqWidgetPayloadKey];
  BOOL synced = [sharedDefaults synchronize];

#if __has_include("codexdeneme-Swift.h")
  [HistoriqWidgetReloader reloadTimelinesOfKind:kHistoriqWidgetKind];
#endif

  resolve(@{
    @"ok": @YES,
    @"synced": @(synced),
  });
}

RCT_REMAP_METHOD(reloadAllTimelines,
                 reloadAllTimelinesWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
#if __has_include("codexdeneme-Swift.h")
  [HistoriqWidgetReloader reloadAllTimelines];
  resolve(@{
    @"ok": @YES,
  });
  return;
#else
  reject(@"E_WIDGETKIT_UNAVAILABLE", @"WidgetKit is unavailable on this OS version.", nil);
#endif
}

@end
