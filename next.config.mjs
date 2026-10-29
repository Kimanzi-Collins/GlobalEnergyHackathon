/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow Africa's Talking raw webhook form-data / XML payloads
  experimental: {
    serverComponentsExternalPackages: ['africastalking'],
  },
};

export default nextConfig;
