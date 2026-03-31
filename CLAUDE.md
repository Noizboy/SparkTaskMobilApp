# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (use --legacy-peer-deps — required due to peer dep conflicts between lucide-react-native and React 19)
npm install --legacy-peer-deps

# Start dev server (port 8081 is often taken; use an explicit port)
npx expo start --port 8082

# Check project health
npx expo-doctor

# Fix SDK-incompatible package versions
npx expo install --fix -- --legacy-peer-deps
```

There are no tests in this project.

## Stack

- **Expo SDK 54** / React Native 0.81 / React 19
- **Navigation**: React Navigation v6 — bottom tabs (`MainTabNavigator`) nested inside a root `NativeStackNavigator`
- **State**: Single `AppContext` (React Context) — all job data, auth, and UI state live here; persisted to `AsyncStorage` via `src/utils/storage.ts`
- **Animations**: `react-native-reanimated` 4.x for tab screen transitions and UI animations
- **Gestures**: `react-native-gesture-handler` 2.28 — `GestureHandlerRootView` is already set up in `App.tsx`
- **UI**: `react-native-paper` + custom theme from `src/constants/theme.ts`; icons from `lucide-react-native`; fonts are Poppins via `@expo-google-fonts/poppins`

## Architecture

### Navigation structure
```
RootNavigator (NativeStack, animation: fade)
├── Login
├── Onboarding
└── MainTabs (BottomTab, custom tab bar)
    ├── Home
    ├── Calendar
    ├── Notifications
    └── Profile
    (stack screens pushed on top of MainTabs:)
    ├── JobInfo
    ├── Checklist
    ├── OrderDetails
    ├── DayJobs
    └── PhotoGallery
```

Tab screens are wrapped with `withAnimation()` in `RootNavigator.tsx` which adds a slide-up entrance animation via `useFocusEffect` + Reanimated.

### Data flow

`AppContext` is the single source of truth. It loads jobs from `AsyncStorage` (key `cleanerJobs`) on login, falling back to `src/data/mockJobs.ts`. Every mutation (toggleTodo, photosChange, completeJob, etc.) updates state and immediately persists to AsyncStorage.

Auth is a simple boolean flag stored in AsyncStorage — no real backend. Login just sets `AUTH_TOKEN = 'true'`.

### Job lifecycle
`upcoming` → `in-progress` (via `startJob`) → `completed` (via `completeJob`)  
Canceling an in-progress job resets it to `upcoming` and clears all photos/todos.

### Key type: `Job`
Defined in `src/types/index.ts`. Each job has `sections[]` (each with `beforePhotos[]`, `afterPhotos[]`, `todos[]`, optional `skipReason`) and optional `addOns[]`.

### Screen responsibilities
- **HomeScreen**: today's upcoming + in-progress jobs; navigates to `JobInfo`
- **CalendarScreen**: week strip calendar; tapping a day navigates to `DayJobs`
- **JobInfoScreen**: job details + start/cancel actions; navigates to `Checklist`
- **ChecklistScreen**: section-by-section todo list, photo capture (camera/library), skip sections; navigates to `PhotoGallery` on photo tap
- **OrderDetailsScreen**: read-only summary of a completed/in-progress job; navigates to `PhotoGallery` on photo tap
- **PhotoGalleryScreen**: full-screen grid of before/after photos for a section + carousel modal viewer

### Styling conventions
All colors, spacing, radii, shadows, and fonts are in `src/constants/theme.ts` — always use these constants, never hardcode values. The only exception is black (`#000000`) and white (`#FFFFFF`) used in the carousel viewer.

### Adding a new stack screen
1. Add the route to `RootStackParamList` in `src/types/index.ts`
2. Register it in `RootNavigator.tsx` under the `MainTabs` block
3. Navigate with `useNavigation<NativeStackNavigationProp<RootStackParamList>>()`

