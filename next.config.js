// next.config.js
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
  