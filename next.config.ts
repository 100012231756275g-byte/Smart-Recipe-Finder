import type { NextConfig } from "next";

// 🔥 สร้างรายการ IP เผื่อไว้เลยตั้งแต่ 192.168.1.0 ถึง 192.168.1.255
const allLocalIPs = Array.from({ length: 256 }, (_, i) => `192.168.1.${i}`);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // ยัด IP ทั้งซอยใส่เข้าไป ทีนี้เร้าเตอร์จะสุ่มเปลี่ยนเป็นเลขอะไรก็เข้าได้หมด!
  allowedDevOrigins: [
    'localhost:3000',
    ...allLocalIPs, 
  ],
};

export default nextConfig;