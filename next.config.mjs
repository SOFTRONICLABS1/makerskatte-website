import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** Keep production builds from overwriting files served by the dev server. */
export default function nextConfig(phase) {
  return {
    reactStrictMode: true,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next'
  };
}
