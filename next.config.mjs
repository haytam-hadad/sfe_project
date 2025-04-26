/** @type {import('next').NextConfig} */

import withPWA from 'next-pwa';

const nextConfig = withPWA({
  experimental: {
    turbo: true, // Enable Turbopack
  },
  pwa: {
    dest: 'public',
    cacheOnFrontEndNav: true, // Corrected property name
    disable: process.env.NODE_ENV === 'development', // Disable PWA in development
    reloadOnOnline: true,
    swcMinify: true,
    workboxOptions: {
      skipWaiting: true, // Ensures the new service worker activates immediately
      clientsClaim: true, // Allows the service worker to control clients as soon as it's active
      disableDevLogs: true, // Suppresses logs in development
    },
  },
});

export default nextConfig;

