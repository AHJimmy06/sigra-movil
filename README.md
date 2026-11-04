# SIGRA Resident Mobile

Expo SDK 57 / React Native resident application for announcements, offline resident QR passes, deferred maintenance requests, and an always-available local directory.

## Runtime requirements

- Node.js 22.13+, 24.3+, or 26+ (this project was scaffolded with Node 26)
- npm
- Android Studio/SDK for local Android builds, or an EAS account for remote development builds
- SIGRA API with the resident provisioning endpoint

This app includes React Native MMKV, a native Nitro Module. **Expo Go is not sufficient.** Use a development build.

## Environment

```bash
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` to the API `/api` base URL. The Android emulator default is `http://10.0.2.2:3300/api`:

- Android emulator: `http://10.0.2.2:3300/api`
- iOS simulator: `http://localhost:3300/api`
- Physical device: `http://<your-computer-LAN-IP>:3300/api`; the phone and computer must share a network, the API must listen on a reachable interface, and the firewall must allow the port.
- Production: use `https://.../api`. Plain HTTP is only for isolated local development.

`localhost` on a physical phone refers to the phone, not the development computer.

## Install and development build

```bash
npm install
npx expo prebuild
npm run android
```

On macOS with Xcode, use `npx expo run:ios`. For an EAS development build:

```bash
npm install -g eas-cli
eas build:configure
eas build --profile development --platform android
npm run start -- --dev-client
```

Rebuild the development client after adding or changing native modules.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run doctor
npm run export
```

The export command bundles Android and iOS non-interactively. Web is not an MVP target because the persistence and secure-native boundaries are mobile-first.

## Seeded resident exercise

The API creates resident credentials through the ADMIN resident flow rather than fixed production credentials. Use the resident account created in your local seed/data:

1. Start the existing API and PostgreSQL, run API migrations, and confirm `/api/health`.
2. Sign in with a RESIDENT account. ADMIN and GUARD accounts are rejected by the app.
3. Create a seven-day pass while online. The app provisions that pass immediately and stores the seed in SecureStore.
4. Disable connectivity. The pass continues generating `sigra.access.v1` QR payloads.
5. Reconnect and refresh. Revocation/expiry metadata updates from the API.
6. Create a ticket offline with a photo, then reconnect. The same `clientRequestId` is retried until the API accepts it.

## Offline and security boundaries

- JWTs and TOTP seeds are stored only in Expo SecureStore, never SQLite or MMKV.
- SQLite stores announcements, pass metadata, the maintenance queue, and local directory defaults.
- MMKV stores only non-sensitive synchronization metadata.
- Selected ticket photos are copied into the app document directory before queue insertion.
- The QR contract is `{"v":1,"passId":"uuid","token":"123456"}`. SHA1, six digits, and a 30-second period come from the provisioning response.
- Offline generation does **not** prove current authorization. A provisioned or copied seed can generate codes until expiry. API revocation is enforced by online guard validation; an offline resident device reports revocation as unknown after its last sync.
- Guard clients never receive secrets and remain online-authoritative.
- Logout removes JWTs, provisioned seeds, resident pass/ticket state, queued photos, and sync metadata. Non-sensitive announcements and explicit local directory defaults remain cached.

## Directory limitation

The MVP seeds emergency guidance and basic building rules locally. It does not pretend these entries are server-managed. Building-specific contact numbers and exact rules must be confirmed with administration until an API-backed management model is added.
