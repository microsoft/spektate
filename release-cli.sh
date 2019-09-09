#!/usr/bin/env bash

rm -rf spex-* 
tsc -p . 
pkg build/dist/cli/spex.js --out-path spex-linux --target latest-linux-x64
pkg build/dist/cli/spex.js --out-path spex-macos --target latest-macos-x64
pkg build/dist/cli/spex.js --out-path spex-win --target latest-win-x64