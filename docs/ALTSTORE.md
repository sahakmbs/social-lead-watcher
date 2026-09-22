# AltStore / native iOS install

## Honest status

**There is no signed IPA in this public repo today.** Distributing via AltStore (or Sideloadly / TrollStore) requires an Apple-signed `.ipa` built with your team credentials.

The **zero-friction path that works now** is the PWA:

1. Open https://sahakmbs.github.io/social-lead-watcher/ in **Safari** on iPhone
2. Share → **Add to Home Screen**
3. Use it like an app (offline demo store included)

## If you want a real AltStore IPA later

1. Create an [Expo](https://expo.dev) account and link EAS
2. From `apps/mobile`:

```bash
npx eas-cli login
npx eas build --platform ios --profile preview
```

3. Download the `.ipa` from the EAS build page
4. Install with [AltStore](https://altstore.io) / AltServer on your Mac/PC (refresh every 7 days on free Apple ID)
5. Or use a paid Apple Developer account for longer-lived signing

We will **not** check in an unsigned or fake IPA. When an EAS-built artifact exists for Fedok’s Apple team, link it here.
