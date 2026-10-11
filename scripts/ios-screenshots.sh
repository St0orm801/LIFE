#!/usr/bin/env bash
set -euo pipefail
mkdir -p build-ios/screenshots
xcrun simctl list devices available -j > build-ios/devices.json
for kind in iphone ipad; do
  device=$(node -e 'const f=require("fs"); const k=process.argv[1]; const all=Object.values(JSON.parse(f.readFileSync("build-ios/devices.json")).devices).flat(); const d=all.find(d=>d.isAvailable && (k==="iphone" ? /iPhone.*Pro Max/.test(d.name) : /iPad Pro.*13-inch/.test(d.name))); if(!d)throw Error("Required screenshot simulator unavailable: "+k); process.stdout.write(d.udid)' "$kind")
  xcrun simctl boot "$device" || true
  xcrun simctl bootstatus "$device" -b
  xcrun simctl status_bar "$device" override --time '9:41' --batteryState charged --batteryLevel 100
  xcrun simctl install "$device" build-ios/Build/Products/Debug-iphonesimulator/App.app
  xcrun simctl launch "$device" com.st0orm801.life
  sleep 12
  xcrun simctl io "$device" screenshot "build-ios/screenshots/$kind-today.png"
  xcrun simctl shutdown "$device"
done
