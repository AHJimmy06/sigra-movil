# Native guard and resident workflow

Guards sign in with their administrator-provisioned account. Gate authorization is enforced by the API; a forbidden response asks the guard to contact an administrator. Guards never enter resident tabs or run resident synchronization.

Allow camera access, scan a SIGRA QR, review the read-only resident/unit, enter the visitor name, choose entry or exit, and confirm. Preview never records an event. Final confirmation revalidates the pass and gate authorization. Network retries retain the same request identity while the QR, visitor and direction are unchanged. No offline authorization is offered. Scanned credentials remain only in screen memory, never preferences or logs. Camera operation is limited to the focused, foreground scanner.

Residents see their own successful entries in the home arrival inbox. The first response is historical; subsequent new event IDs show a banner. Polling runs every 15 seconds while this screen is focused and the application is active. Refresh and foreground resume retry the feed. This is not push delivery: no notification is promised while the application is closed. Identity changes discard the prior inbox and late responses.

Camera permission text is configured with the expo-camera plugin without audio recording. A native build incorporating the plugin is required. Real-device camera/permission/settings, light/dark contrast and lifecycle checks remain necessary before release; automated mocked tests do not prove device compatibility.
