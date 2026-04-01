export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const LEGAL_LAST_UPDATED = 'March 31, 2026';

export const PRIVACY_POLICY_INTRO =
  'This Privacy Policy explains how Historiq collects, uses, stores, and shares information when you use the Historiq mobile application.';

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    title: '1. Information We Collect',
    bullets: [
      'Account and identity data. When you launch the app, Historiq creates an anonymous Firebase account identifier. If you choose to sign in or link your account with Apple, Google, or email and password, we may receive and store your provider identifiers, email address, and optional display name.',
      'Preference data. We store the preferences you set in the app, including your time zone, selected categories, selected eras, theme preference, onboarding status, notification preference, and reminder time.',
      'Engagement data. We store the events you save, like, and react to so the app can sync that state across sessions and devices.',
      'Search data. When you use Explore search, your query and selected filters are sent to our hosted search provider, Algolia, to return relevant results.',
      'On-device storage. Historiq stores temporary caches and preference data on your device using local storage, including recommendation cache entries and local "not interested" state.',
      'Support data. If you contact us through the support channel listed on the app support page or App Store product page, we receive the information you choose to share with us.',
    ],
  },
  {
    title: '2. Information We Do Not Intentionally Collect',
    bullets: [
      'We do not intentionally collect your precise location, contacts, photos, camera, microphone, health data, or advertising identifiers.',
      'We do not currently use third-party advertising SDKs in the app.',
      'We do not currently use a third-party analytics provider in production. Some events may be logged locally in development builds for debugging.',
    ],
  },
  {
    title: '3. How We Use Information',
    bullets: [
      'To create and maintain your account, including anonymous guest sessions.',
      'To personalize historical content based on your selected eras, categories, and preferences.',
      'To sync saved events, likes, reactions, and profile settings across sessions.',
      'To deliver search results and core app functionality.',
      'To cache content locally so the app loads faster and works more reliably.',
      'To debug, secure, and improve the app, and to comply with legal obligations.',
    ],
  },
  {
    title: '4. How Information Is Shared',
    paragraphs: [
      'We do not sell your personal information and we do not share it for third-party advertising.',
      'We share information only with service providers and third parties needed to operate the app or when you choose to use a specific feature.',
    ],
    bullets: [
      'Firebase Authentication and Cloud Firestore, provided by Google, are used for account management and profile storage.',
      'Apple and Google may process information when you use Sign in with Apple or Google Sign-In.',
      'Algolia processes search requests when you use the Explore search feature.',
      'Wikimedia and related public-content endpoints may receive standard network request data from your device when the app requests public history content.',
      'If you use the native share feature or open an external link, the selected operating system service or website will receive the information needed to complete that action.',
    ],
  },
  {
    title: '5. Data Retention and Deletion',
    paragraphs: [
      'We retain account, profile, and engagement data for as long as it is needed to operate your account and the app, unless a longer retention period is required by law.',
      'If you created a non-anonymous account, you can delete that account inside the app from Profile > Delete account.',
      'If you use Historiq only as a guest, some server-side records tied to the anonymous account identifier may remain until they are removed from our systems. You can also delete the app and clear local device storage at any time.',
      'We may retain limited information when required to comply with law, resolve disputes, prevent abuse, or enforce our agreements.',
    ],
  },
  {
    title: '6. Your Choices',
    bullets: [
      'You can use the app as a guest without creating a named account.',
      'You can update your content preferences, time zone, theme, and reminder settings inside the app.',
      'You can remove saved events, likes, and reactions at any time inside the app.',
      'If you linked Apple or Google sign-in, you can also manage that relationship through your provider account settings.',
      'If you want to request deletion, correction, or another privacy action that the app does not yet support directly, use the support channel listed on the app support page or App Store product page.',
    ],
  },
  {
    title: '7. Children',
    paragraphs: [
      'Historiq is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided personal information through the app, contact us through the listed support channel so we can review and delete it if appropriate.',
    ],
  },
  {
    title: '8. International Processing',
    paragraphs: [
      'Your information may be processed in countries where our service providers operate. By using the app, you understand that data may be transferred to and processed outside your country of residence, subject to applicable law.',
    ],
  },
  {
    title: '9. Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. If we make material changes, we may update the in-app policy, the public policy URL, or both. Your continued use of the app after an update means the updated policy applies.',
      'If Historiq adds subscriptions, additional analytics, advertising, or new categories of personal data in a future version, this policy will be updated before that processing begins.',
    ],
  },
];

export const TERMS_OF_USE_INTRO =
  'These Terms of Use and End User License Agreement govern your use of the Historiq mobile application.';

export const TERMS_OF_USE_SECTIONS: LegalSection[] = [
  {
    title: '1. Agreement',
    paragraphs: [
      'By downloading, installing, accessing, or using Historiq, you agree to these Terms. If you do not agree, do not use the app.',
      'This agreement is between you and the developer of Historiq, not Apple, and the developer is solely responsible for the app and its content except where platform rules say otherwise.',
    ],
  },
  {
    title: '2. License Grant',
    paragraphs: [
      'Subject to these Terms, we grant you a limited, personal, non-exclusive, non-transferable, revocable license to use Historiq on devices you own or control, solely as permitted by the applicable app marketplace rules.',
    ],
    bullets: [
      'You may not copy, sell, resell, rent, lease, sublicense, reverse-engineer, decompile, or modify the app except where applicable law expressly allows it.',
      'You may not use the app in a way that interferes with its operation, security, or availability.',
    ],
  },
  {
    title: '3. Accounts and Access',
    paragraphs: [
      'Historiq may allow guest access, Sign in with Apple, Google sign-in, or email-based accounts.',
      'You are responsible for the accuracy of the information you provide and for maintaining the security of any credentials you use.',
      'If you created a non-anonymous account, you can delete it from the app settings screen. We may suspend or terminate access if you violate these Terms or misuse the service.',
    ],
  },
  {
    title: '4. App Content and Availability',
    paragraphs: [
      'Historiq is an educational and informational product. Historical content may come from public or third-party sources and may contain omissions, delays, or inaccuracies.',
      'We may change, update, pause, or discontinue features, content, or parts of the service at any time.',
    ],
  },
  {
    title: '5. Paid Features, Subscriptions, and Purchases',
    paragraphs: [
      'If a version of Historiq offers premium features, subscriptions, or other paid digital content, pricing, billing period, and included benefits will be shown before purchase.',
      'If you buy an auto-renewable subscription, payment will be charged to your Apple ID or other applicable store account at confirmation of purchase. The subscription renews automatically unless you cancel at least 24 hours before the end of the current period.',
      'You can manage or cancel subscriptions through your App Store or marketplace account settings. If a free trial is offered, any unused portion may be forfeited when you purchase a subscription.',
      'Except where required by law, digital purchases are non-refundable once delivered. Storefront operators, including Apple, may apply their own refund rules.',
    ],
  },
  {
    title: '6. Acceptable Use',
    bullets: [
      'Do not use Historiq for unlawful, fraudulent, abusive, or misleading activity.',
      'Do not attempt to scrape, mirror, bulk-download, or extract the app data in an unauthorized way.',
      'Do not bypass paywalls, account controls, rate limits, or technical restrictions.',
      'Do not use the app in a way that could damage, disable, or overburden the service or other users.',
    ],
  },
  {
    title: '7. Third-Party Services',
    paragraphs: [
      'Historiq relies on third-party services and may link to third-party websites or services, including Apple, Google, Firebase, Algolia, and Wikimedia. Their use of your information is governed by their own terms and privacy policies.',
      'We are not responsible for third-party services, content, or websites that are not controlled by us.',
    ],
  },
  {
    title: '8. Intellectual Property',
    paragraphs: [
      'The Historiq app, its design, branding, software, and original compilations are owned by the developer and protected by applicable intellectual property laws.',
      'Historical facts themselves may not be owned by us, but the app experience, presentation, organization, and original materials are protected.',
    ],
  },
  {
    title: '9. Termination',
    paragraphs: [
      'These Terms remain in effect until terminated by you or us. You may terminate them at any time by uninstalling the app and stopping all use.',
      'We may suspend or terminate your access if you violate these Terms, misuse the service, or where required to protect the app, our users, or our rights.',
    ],
  },
  {
    title: '10. Disclaimers and Limitation of Liability',
    paragraphs: [
      'To the maximum extent permitted by law, Historiq is provided "as is" and "as available" without warranties of any kind, whether express, implied, or statutory.',
      'To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, goodwill, or business opportunity arising from your use of the app.',
      'Nothing in these Terms limits rights that cannot be waived under applicable consumer law.',
    ],
  },
  {
    title: '11. Apple-Specific Terms',
    bullets: [
      'Apple has no obligation to furnish maintenance or support services for Historiq.',
      'To the maximum extent permitted by law, Apple has no warranty obligation with respect to Historiq. If the app fails to conform to an applicable warranty, you may notify Apple, and Apple may refund any purchase price paid for the app if required under its policies or applicable law.',
      'Apple is not responsible for addressing any claims by you or a third party relating to Historiq, including product liability claims, regulatory claims, consumer protection claims, or intellectual property claims.',
      'Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you.',
    ],
  },
  {
    title: '12. Changes to These Terms',
    paragraphs: [
      'We may update these Terms from time to time. If we make material changes, we may update the in-app terms, the public terms URL, or both. Your continued use of Historiq after an update means you accept the revised Terms.',
    ],
  },
];
