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
  // pdf-parse v2 and mammoth are ESM packages — tell Next.js not to bundle them
  // so Node.js can import them directly at runtime
  serverExternalPackages: ["pdf-parse", "mammoth"],
};
module.exports = nextConfig;
