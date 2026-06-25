# Realtime Task Dashboard

A React Native CLI/Web application demonstrating an offline-first architecture, intelligent synchronization, and virtualization for large datasets.

---

## Quick Start

### Web (Recommended for Evaluation)
```bash
npm install
npm run web
```
Open [http://localhost:3000/](http://localhost:3000/) in your browser.

### Native (Mobile)
```bash
npm install
npx react-native start          # Start Metro bundler
npx react-native run-android    # Run on Android
# or
npx react-native run-ios        # Run on iOS
```

---

## Core Features

* **High-Performance List:** Displays 2,000+ mock tasks utilizing `FlatList` virtualization, memoized card rendering, and debounced searching.
* **Lexicographical Sorting:** Highly optimized date sorting using fast ISO string comparison.
* **Auto-Save Drafts:** Saves task details and notes automatically every 5 seconds to prevent data loss. Drafts are restored upon application launch.
* **Offline Queue:** Edits made offline are queued locally using `AsyncStorage`. Once online connectivity is restored, the queue is drained automatically.
* **Exponential Backoff Retry:** Retries failed API updates intelligently (1s → 2s → 4s → 8s → 16s) up to 5 attempts.

---

## Architecture Decisions

* **Zustand:** Selected for lightweight global state management, low boilerplate, and external store access from our background sync worker.
* **Deduplication:** The offline queue is structured as a map keyed by task ID. Edits to the same task overwrite prior queued states to ensure only the latest state is synced.
* **Race Condition Mitigation:** 
  * *Version-matching dequeue* prevents newer offline edits from being deleted when older syncs finish.
  * *Timestamp-based updates* prevent old server responses from overwriting newer optimistic store updates.
  * *Queue bypass check* prevents out-of-order writes by forcing new edits into the queue if pending updates already exist.
