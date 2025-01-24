// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

// Handle `.cjs` files properly
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'cjs'); // Exclude `.cjs` from assets
config.resolver.sourceExts.push('cjs'); // Add `.cjs` as a source extension

// Ensure compatibility with NativeWind and global CSS
module.exports = withNativeWind(config, { input: "./global.css" });