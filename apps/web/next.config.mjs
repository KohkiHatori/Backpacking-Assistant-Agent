/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/trpc'],
  // Disable static optimization to avoid React 19 RC build issues
  experimental: {
    // This helps with React 19 RC compatibility
    reactCompiler: false,
  },
  // Skip static generation for error pages
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;
