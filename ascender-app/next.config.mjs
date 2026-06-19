/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pacotes nativos usados apenas no servidor (não devem ser empacotados pelo bundler)
  serverExternalPackages: ["@node-rs/argon2", "pg"],
};

export default nextConfig;
