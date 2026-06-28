const path = require('path');
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  basePath: '/hub',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@test/ui', '@test/shared', '@test/api-client',
    '@test/hub-feature'],
};
