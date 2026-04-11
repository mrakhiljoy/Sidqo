/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // mammoth is an ESM package — tell Next.js not to bundle it
  serverExternalPackages: ["mammoth"],
};
module.exports = nextConfig;
