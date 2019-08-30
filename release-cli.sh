#!/usr/bin/env bash

rm -rf spex-* 
tsc -p . 
pkg build/dist/cli/spex.js --out-path spex-linux --target node12-linux-x64
pkg build/dist/cli/spex.js --out-path spex-macos --target node12-macos-x64
pkg build/dist/cli/spex.js --out-path spex-win --target node12-win-x64