

import withNextIntl from 'next-intl/plugin';

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*", // Spring Boot backend
      },
    ];
  },
};

export default withNextIntl()(nextConfig);

