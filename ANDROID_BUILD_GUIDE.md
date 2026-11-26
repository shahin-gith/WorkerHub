# WorkerHub Singapore — Android Offline APK & Play Store AAB Guide

WorkerHub Singapore is configured as a **100% offline Android Capacitor application** (`com.workerhub.singapore`) with zero `.env` / environment-variable dependencies.

## Build Outputs Ready in `/android/`
All web assets (`dist/`) are synced into `/android/app/src/main/assets/public/`.

### Option 1: Build via Android Studio (Recommended)
1. Open the `/android` folder in **Android Studio** (Ladybug or newer, JDK 21).
2. Let Gradle sync finish.
3. For sideload testing APK: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. For Google Play Store `.aab`:
   - Copy `android/keystore.properties.example` to `android/keystore.properties` and generate an upload keystore (`keytool -genkey -v -keystore workerhub-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias workerhub`).
   - Run **Build → Generate Signed Bundle / APK → Android App Bundle (`.aab`)**.

### Option 2: Build via Command Line (macOS / Linux / Windows / CI)
```bash
npm install
npm run android:sync
cd android
./gradlew assembleRelease bundleRelease
```
Generated files will appear at:
- **APK**: `android/app/build/outputs/apk/release/`
- **Play Store AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
