# Technical Context: Stack and Installation / Teknik Bağlam: Teknoloji Yığını ve Kurulum

## 🌍 English Version

### Tech Stack
- **Web/Backend**: Next.js 14 (App Router), TypeScript, TailwindCSS + shadcn/ui, PostgreSQL, Prisma, NextAuth.js v4, Socket.IO.
- **Mobile**: React Native 0.74+, Expo SDK 51, React Navigation 6, AsyncStorage, NetInfo, Maps.
- **Infrastructure**: Vercel (Web), Neon/Supabase (DB), Cloudinary (Images), Resend (Email).

### Project Structure
```
Structra/
├── src/                      # Main App (Next.js)
├── apps/mobile/              # Mobile App (React Native)
├── prisma/                   # DB Schema & Migrations
├── public/                   # Static Assets & Uploads
└── memory-bank/              # Project Documentation
```

### Installation
1. `git clone https://github.com/thrhead/Structra.git`
2. `npm install && cd apps/mobile && npm install`
3. Create `.env` with `DATABASE_URL`, `NEXTAUTH_SECRET`, etc.
4. `npx prisma db push && npx prisma db seed`
5. `npm run dev` (Web) / `npx expo start` (Mobile)

---

## 🇹🇷 Türkçe Versiyon

### Teknoloji Yığını
- **Web/Backend**: Next.js 14 (App Router), TypeScript, TailwindCSS + shadcn/ui, PostgreSQL, Prisma, NextAuth.js v4, Socket.IO.
- **Mobil**: React Native 0.74+, Expo SDK 51, React Navigation 6, AsyncStorage, NetInfo, Haritalar.
- **Altyapı**: Vercel (Web), Neon/Supabase (DB), Cloudinary (Görsel), Resend (E-posta).

### Proje Yapısı
```
Structra/
├── src/                      # Ana Uygulama (Next.js)
├── apps/mobile/              # Mobil Uygulama (React Native)
├── prisma/                   # DB Şeması ve Migration'lar
├── public/                   # Statik Dosyalar ve Yüklemeler
└── memory-bank/              # Proje Dokümantasyonu
```

### Kurulum
1. `git clone https://github.com/thrhead/Structra.git`
2. `npm install && cd apps/mobile && npm install`
3. `DATABASE_URL`, `NEXTAUTH_SECRET` vb. ile `.env` dosyasını oluşturun.
4. `npx prisma db push && npx prisma db seed`
5. `npm run dev` (Web) / `npx expo start` (Mobil)

---

## Performance Notes / Performans Notları
- **Image Optimization**: `next/image` on Web and optimized `resizeMode` on Mobile.
- **Bundle Size**: Code splitting with `next/dynamic`.
- **DB Indexing**: All FK fields and common filter fields are indexed.
