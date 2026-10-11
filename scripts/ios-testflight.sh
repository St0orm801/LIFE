#!/bin/bash
set -euo pipefail
# Credentials exist only in the protected CI environment and temporary keychain.
for name in LIFE_P12_BASE64 LIFE_P12_PASSWORD LIFE_PROFILE_BASE64 LIFE_ASC_KEY_BASE64 LIFE_ASC_KEY_ID LIFE_ASC_ISSUER_ID LIFE_TEAM_ID; do
  if [ -z "${!name:-}" ]; then echo "Missing required signing setting: $name"; exit 1; fi
done
signing_dir=$(mktemp -d)
keychain_path="$signing_dir/life-signing.keychain-db"
keychain_password=$(openssl rand -hex 24)
profile_path=""
cleanup() {
  security delete-keychain "$keychain_path" >/dev/null 2>&1 || true
  if [ -n "$profile_path" ]; then rm -f "$profile_path"; fi
  rm -rf "$signing_dir"
}
trap cleanup EXIT
export LIFE_SIGNING_DIR="$signing_dir"
python3 - <<'PY'
import base64, os, pathlib
p=pathlib.Path(os.environ['LIFE_SIGNING_DIR'])
for name,file in [('LIFE_P12_BASE64','certificate.p12'),('LIFE_PROFILE_BASE64','profile.mobileprovision'),('LIFE_ASC_KEY_BASE64','AuthKey_'+os.environ['LIFE_ASC_KEY_ID']+'.p8')]:
    (p/file).write_bytes(base64.b64decode(os.environ[name], validate=True))
PY
security create-keychain -p "$keychain_password" "$keychain_path"
security set-keychain-settings -lut 21600 "$keychain_path"
security unlock-keychain -p "$keychain_password" "$keychain_path"
security import "$signing_dir/certificate.p12" -P "$LIFE_P12_PASSWORD" -A -t cert -f pkcs12 -k "$keychain_path" >/dev/null
security set-key-partition-list -S apple-tool:,apple: -k "$keychain_password" "$keychain_path" >/dev/null
security list-keychains -d user -s "$keychain_path" login.keychain-db
security cms -D -i "$signing_dir/profile.mobileprovision" > "$signing_dir/profile.plist"
profile_uuid=$(/usr/libexec/PlistBuddy -c 'Print UUID' "$signing_dir/profile.plist")
profile_name=$(/usr/libexec/PlistBuddy -c 'Print Name' "$signing_dir/profile.plist")
application_id=$(/usr/libexec/PlistBuddy -c 'Print Entitlements:application-identifier' "$signing_dir/profile.plist")
if [ "$application_id" != "$LIFE_TEAM_ID.com.st0orm801.life" ]; then echo 'Provisioning profile does not match LIFE'; exit 1; fi
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
profile_path="$HOME/Library/MobileDevice/Provisioning Profiles/$profile_uuid.mobileprovision"
cp "$signing_dir/profile.mobileprovision" "$profile_path"
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath "$signing_dir/LIFE.xcarchive" DEVELOPMENT_TEAM="$LIFE_TEAM_ID" CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY='Apple Distribution' PROVISIONING_PROFILE_SPECIFIER="$profile_name" CURRENT_PROJECT_VERSION="$LIFE_BUILD_NUMBER" archive
export LIFE_PROFILE_NAME="$profile_name"
python3 - <<'PY'
import os, plistlib, pathlib
p=pathlib.Path(os.environ['LIFE_SIGNING_DIR'])/'ExportOptions.plist'
with p.open('wb') as f:
    plistlib.dump({'method':'app-store-connect','signingStyle':'manual','teamID':os.environ['LIFE_TEAM_ID'],'provisioningProfiles':{'com.st0orm801.life':os.environ['LIFE_PROFILE_NAME']},'testFlightInternalTestingOnly':True,'manageAppVersionAndBuildNumber':False},f)
PY
xcodebuild -exportArchive -archivePath "$signing_dir/LIFE.xcarchive" -exportPath "$signing_dir/export" -exportOptionsPlist "$signing_dir/ExportOptions.plist"
ipa_path=$(find "$signing_dir/export" -maxdepth 1 -name '*.ipa' -print -quit)
if [ -z "$ipa_path" ]; then echo 'No signed IPA was produced'; exit 1; fi
API_PRIVATE_KEYS_DIR="$signing_dir" xcrun altool --upload-app --type ios --file "$ipa_path" --apiKey "$LIFE_ASC_KEY_ID" --apiIssuer "$LIFE_ASC_ISSUER_ID"
echo 'Uploaded for internal TestFlight processing. App Review was not submitted.'
