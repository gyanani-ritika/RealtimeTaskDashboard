# Architecture Notes & Decision Log

Here's a breakdown of the technical decisions, architecture, and optimizations made for the Realtime Task Dashboard project.

## State Management (Zustand)
I went with Zustand instead of Redux or React Context. Redux is just too much boilerplate for a small dashboard app, and standard Context causes unnecessary re-renders across the tree when a single item changes. 
Zustand keeps the state updates extremely clean. More importantly, it lets us call state actions directly from outside React components. This was essential for the offline sync worker (`syncService.ts`), which runs in the background and needs to write updates to the store without hooking into React lifecycle methods or components.

## Offline Queue Implementation
The offline synchronization queue is built on top of AsyncStorage.
- **Queue Structure:** The queue is stored as a dictionary object keyed by `taskId` (`Record<string, QueueItem>`). 
- **How it syncs:** A NetInfo listener detects when the connection comes back online and triggers the background sync loop. The worker drains the queue one item at a time, retrying failed requests using exponential backoff (starting at 1s up to 5 retries). Once an update succeeds on the server, the item is removed from the queue.

## Preventing Duplicates (Latest Wins)
Because the queue is structured as a Map (keyed by task ID), if a user makes multiple edits to the same task while offline (e.g. updating notes three times), only one payload is kept in storage. The latest changes overwrite the previous ones, so when we go back online, we only send one request (the final state) instead of spamming the API with duplicate updates.

## Avoiding Concurrency Race Conditions
To prevent server and client states from clashing during background syncs, I added three safety checks:
1. **Version-Matching Dequeue:** Every queue item has a `version` counter. When the sync worker completes a task update, it only removes the item from the queue if the version in storage matches the one it just synced. If the user edited the task again while the sync was in-flight, the storage version would be higher, so the dequeue call is skipped to avoid losing the new change.
2. **Timestamp-Based Updates:** When the sync worker receives a response from the server, it only updates the local store if the task's current timestamp in Zustand isn't newer than the queued item's `updatedAt`. If the user edited the task locally in the meantime, we discard the server response to avoid overwriting their latest work.
3. **Queue Bypass Gating:** If the app is online but there's a pending change for a task already in the queue, we route the edit through the queue instead of sending it directly. This guarantees that edits are sent to the server in the correct order (FIFO).

## Performance Measures
- **Render Optimizations:** With 2,000 tasks, standard rendering would lag. I optimized FlatList configuration (`initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, `removeClippedSubviews`) and wrapped `TaskCard` in `React.memo` with a custom comparison function so cards only re-render if their content actually changes.
- **Date Sorting:** Sorting 2,000 dates on every search/filter change can block the main thread if you parse `new Date()` in the comparison loop. Since dates are formatted as ISO-8601 strings, I replaced date parsing with lexicographical string comparisons (`b.updatedAt.localeCompare(a.updatedAt)`), which is significantly faster.
- **Auto-Save writes:** The 5-second auto-save interval uses a dirty-tracking ref (`isDirtyRef`) so we only write to AsyncStorage if the user has actually modified the draft since the last save, reducing disk overhead.
