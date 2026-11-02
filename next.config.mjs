/** @type {import('next').NextConfig} */
const nextConfig = {
  // exceljs memakai beberapa API Node; biarkan di-resolve sebagai server module.
  // (better-sqlite3 sudah tidak dipakai sejak pindah ke Neon.)
  experimental: {
    serverComponentsExternalPackages: ["exceljs"],
  },
};

export default nextConfig;
