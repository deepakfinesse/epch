/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mongoose'],
  allowedDevOrigins: ['10.5.48.54', '192.168.1.6'],
};

export default nextConfig;
