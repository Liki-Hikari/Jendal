const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "tuwghenflwgsvioswemc.supabase.co"
      }
    ]
  }
};

export default nextConfig;
