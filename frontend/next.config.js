/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  turbopack: { root: __dirname },
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    return [{ source: '/api/:path*', destination: backend + '/api/:path*' }, { source: '/uploads/:path*', destination: backend + '/uploads/:path*' }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
