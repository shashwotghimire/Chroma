# Agent Instructions (AGENTS.md)

This document contains the core guidelines, commands, and style preferences for AI coding agents operating within the **Chroma** repository. Agents must read and adhere to these rules before planning or executing changes.

## 1. Project Overview & Tech Stack

- **Project Name**: Chroma
- **Description**: A minimal infinite runner mobile game built with React Native and Expo. The player controls a ball matching path colors, with speed increasing over time.
- **Primary Language**: JavaScript (ES6+) / React
- **Key Frameworks/Libraries**: React Native, Expo, React Native Reanimated, Expo AV, Expo Haptics, AsyncStorage.
- **Architecture**: Expo file-based routing (`app/` directory).

## 2. Build, Lint, and Test Commands

Agents should verify their changes using the following commands. NEVER assume standard commands; always use the ones specified below.

### Build & Run

- **Start Metro Bundler**: `npx expo start`
- **Clear Cache**: `npx expo start -c`
- **EAS Build (Android/Play Store target)**: `eas build --platform android --profile production`

### Linting & Formatting

- **Lint**: `npm run lint` (assumes ESLint is configured)
- **Format**: `npx prettier --write .` (or `npm run format`)

### Testing (Jest)

- **Run All Tests**: `npm test`
- **Run a Single Test (Crucial for TDD)**: `npm test -- path/to/test_file.test.js -t "specific test name"`
- **Run Tests in Watch Mode**: `npm test -- --watch`

## 3. Code Style Guidelines

### 3.1. Formatting & Imports

- **Formatting**: Rely strictly on Prettier. Do not manually tweak formatting that conflicts with the tool. Use 2 spaces for indentation.
- **Imports**: Group imports logically with blank lines between groups:
  1. React and React Native core modules.
  2. Expo modules (e.g., `expo-haptics`, `expo-av`).
  3. Third-party libraries (e.g., `react-native-reanimated`).
  4. Local components, hooks, and constants.

### 3.2. Types & Data Flow

- **JavaScript Strictness**: While using `.jsx`/`.js`, ensure strict equality (`===`) and handle `undefined`/`null` explicitly.
- **State Management**: Prefer local component state and custom hooks (`hooks/useGameLoop.js`) over global state management for this V0 scope.
- **Animations**: Use `react-native-reanimated` for performance-critical animations (like the core game loop and ball movement). AVOID using standard React state for 60fps game loop updates, as it will cause UI thread blocking and lag.

### 3.3. Naming Conventions

- **React Components**: `PascalCase` (e.g., `ScoreDisplay.jsx`, `Ball.jsx`).
- **Hooks**: `camelCase` starting with `use` (e.g., `useGameLoop.js`, `useHighScore.js`).
- **Functions/Variables**: `camelCase` (e.g., `handleTap`, `currentScore`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `COLOR_A`, `MAX_SPEED` in `constants/colors.js`).
- **Files**: Component/Screen files use `PascalCase.jsx` or lowercase for Expo Router paths (`app/index.jsx`). Hook/utility files use `camelCase.js`.

### 3.4. Error Handling

- **Fail Fast**: Validate inputs to custom hooks early.
- **Async Storage**: Always wrap `AsyncStorage` calls (like fetching/saving high scores) in `try...catch` blocks.
- **Silent Failures**: Log errors using `console.error` during development. Do not use empty `catch` blocks.

## 4. Agent Directives & Workflows

1. **Information Gathering**: Before writing code, use search tools (`glob`, `grep`) and file reading (`read`) to understand the surrounding context. Check `app.json` for Expo configuration.
2. **Minimal Edits**: When editing files, keep changes localized. Do not refactor unrelated code unless requested.
3. **Expo Router**: Remember that navigation is handled via the `app/` directory structure. Do not install `react-navigation`.
4. **Game Feel**: When modifying game logic or UI, prioritize zero input lag. Use `expo-haptics` for immediate physical feedback on death/interactions as specified in `SPECS.md`.
5. **Placeholders**: For audio files in `assets/sounds/`, assume they exist or use silent mocks if instructed to test audio logic.
6. **Cursor/Copilot Rules**: If `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` are added to the repository in the future, their contents will supersede the general guidelines in this file. (Currently none exist).
7. **Commits**: After every feature/major change, commit and push the code to main.

---

_Note to Agents: When in doubt about a design decision, especially regarding game loop performance or Expo constraints, ask the user for clarification rather than making an assumption._
