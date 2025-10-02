# Daily Historic

Daily Historic is an Expo + React Native project that delivers tailored historical insights based on a short, engaging onboarding flow. Anonymous Firebase Authentication is used to create a user the moment the app launches, and Firestore stores the preferences captured during onboarding. Once completing the flow, users land on the main experience and no longer see onboarding unless they reinstall or clear app data.

## Features

- **Expo Router navigation** with a file-based structure in the `app/` directory.
- **Onboarding flow** that collects preferred eras, categories, and notification intent.
- **Anonymous authentication** via `@react-native-firebase/auth` during first launch.
- **Firestore persistence** for preferences (`Users/{uid}` documents) once onboarding concludes.
- **Context-driven state management** using `contexts/onboarding-context.tsx` and `contexts/user-context.tsx`.

## Project Structure

```
.
├── app/                     # File-based routes (onboarding flow, tabs, modals)
├── components/              # Shared UI components and onboarding steps
├── contexts/                # React Context providers (onboarding + user)
├── documentations/          # Product documentation including onboarding flow specs
├── services/                # Firebase helpers
├── theme/                   # Design tokens and styles
└── types/                   # Shared TypeScript definitions (e.g., user profile)
```

Key entry points:

- `app/_layout.tsx` – Wraps the application with the theme provider and `UserProvider` context.
- `app/index.tsx` – Router landing screen, redirects to onboarding or tabs based on user status.
- `app/onboarding/index.tsx` – Main onboarding flow orchestrator.
- `contexts/user-context.tsx` – Anonymous sign-in, Firestore subscription, and onboarding completion helper.
- `services/firebase.ts` – Exposes configured Firebase instances.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Firebase**

   Ensure `GoogleService-Info.plist` and `google-services.json` are placed at the project root. Update the Firebase project settings as needed for iOS and Android.

3. **Run the app**

   ```bash
   npm run start
   ```

   Use the Expo CLI output to open the project in Expo Go, an iOS simulator, or an Android emulator.

## Working With Onboarding

- The onboarding visual steps are located under `components/onboarding/steps/`.
- The state shape for onboarding lives in `contexts/onboarding-context.tsx`.
- Completion writes data to `Users/{uid}` with the structure defined in `types/user.ts`.
- The main flow allows an "anonymous" path or email/social placeholders. Email validation ensures realism, even though actual credential creation is not yet wired.

## Development Tips

- Refresh Metro (`r`) or reload the app after changes to the context or Firebase configuration.
- Logs from `completeOnboarding` will indicate if Firestore writes fail. Check security rules to ensure authenticated users can write.
- Run linting via `npm run lint` to maintain consistency.

## Contributing

1. Fork the repository and create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

2. Make changes and lint:

   ```bash
   npm run lint
   ```

3. Commit using conventional messages (e.g., `feat: add onboarding analytics`).
4. Push the branch and open a pull request.

## License

This project is currently private and does not specify a license. Contact the maintainers if you need clarification on usage rights.

## Contact

- Project owner: Daily Historic Team
- Issues & feedback: please open a GitHub issue or contact the maintainers directly.
