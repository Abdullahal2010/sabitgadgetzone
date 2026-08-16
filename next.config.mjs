/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Wide open so admin-entered "Image URL" values (any host) render via
    // next/image in this demo. Lock this down to specific hostnames (e.g.
    // your CDN, images.unsplash.com) before using this in production.
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
  }
};

export default nextConfig;
