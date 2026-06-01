# Structra v3.0 — Enterprise Field Operations Management

[![Status](https://img.shields.io/badge/Status-v3.0.0--Stable-success?style=for-the-badge)](https://github.com/thrhead/Structra)
[![Tech](https://img.shields.io/badge/Stack-Next.js%2014%20|%20Expo-blue?style=for-the-badge)](https://github.com/thrhead/Structra)

Structra is a high-performance, end-to-end field service and installation management platform designed for the 2026 enterprise landscape. It digitizes complex field operations, from manufacturing exits to final customer approval, providing millisecond-level traceability and visual evidence.

---

## 🌍 English Version

### 🚀 Project Overview
Structra bridges the "visibility gap" in field operations. It transforms chaotic phone-based coordination into a streamlined digital ecosystem, ensuring that every assembly step, cost, and GPS location is accounted for in real-time.

### 🌟 Key Features
- **Multi-Layered RBAC**: Specialized portals for **Admin**, **Manager**, **Field Worker**, and **Customer**.
- **Resilient Offline Sync**: Field workers can continue logging data in areas with zero connectivity; the system automatically syncs via a robust queue once online.
- **Digital Evidence Protocol**: Mandatory photo uploads and GPS verification for every task step ensures quality and accountability.
- **Smart Analytics**: Real-time cost tracking, budget variance analysis, and automated PDF/Excel service reports.
- **Real-time Ecosystem**: Instant push notifications and live status updates powered by Socket.IO.

### 🛠️ Technical Architecture
- **Web**: Next.js 14 (App Router), TailwindCSS, shadcn/ui.
- **Mobile**: Expo SDK 51, React Native (Optimized for low-RAM devices).
- **Backend**: Node.js API Routes, Prisma ORM, PostgreSQL (Optimized with 15+ indexes).
- **Infrastructure**: NextAuth.js (JWT), Socket.IO, Ably (Optional), Cloudinary.

### 📦 Quick Start
```bash
# 1. Clone & Install
git clone https://github.com/thrhead/Structra.git
npm install && cd apps/mobile && npm install

# 2. Setup Environment
# Create .env in root with DATABASE_URL, NEXTAUTH_SECRET, etc.

# 3. Database Push
npx prisma db push && npx prisma db seed

# 4. Launch
npm run dev # Web
cd apps/mobile && npx expo start # Mobile
```

---

## 🇹🇷 Türkçe Bölüm

### 🚀 Proje Özeti
Structra, saha operasyonlarındaki "görünmezlik" problemini ortadan kaldıran, yüksek performanslı bir dijital yönetim platformudur. Fabrika çıkışından son müşteri onayına kadar tüm süreci; fotoğraf kanıtlı checklist'ler, GPS doğrulaması ve anlık maliyet takibi ile dijitalleştirir.

### 🌟 Öne Çıkan Özellikler
- **Çok Katmanlı Yetkilendirme**: **Admin**, **Yönetici**, **Saha Personeli** ve **Müşteri** için özelleşmiş paneller.
- **Kesintisiz Çevrimdışı Çalışma**: İnternet olmayan sahalarda veri girişi yapabilme ve bağlantı geldiğinde otomatik senkronizasyon.
- **Dijital Kanıt Protokolü**: Her iş adımı için zorunlu fotoğraf yükleme ve konum doğrulaması ile tam denetim.
- **Akıllı Analiz ve Raporlama**: Anlık maliyet takibi, bütçe sapma analizleri ve tek tıkla PDF/Excel servis raporları.
- **Anlık Bildirim Merkezi**: Socket.IO ile güçlendirilmiş gerçek zamanlı durum güncellemeleri ve mobil bildirimler.

### 🛠️ Teknik Mimari
- **Web**: Next.js 14 (App Router), TailwindCSS, shadcn/ui.
- **Mobil**: Expo SDK 51, React Native (Düşük RAM kullanımı için optimize edildi).
- **Backend**: Node.js API Routes, Prisma ORM, PostgreSQL (15+ kritik indeks ile hızlandırıldı).
- **Güvenlik**: NextAuth.js (JWT), Role-Based Access Control (RBAC).

### 📦 Hızlı Başlangıç
```bash
# 1. Klonla ve Kur
git clone https://github.com/thrhead/Structra.git
npm install && cd apps/mobile && npm install

# 2. Ortam Değişkenleri
# Kök dizinde .env dosyası oluşturun (DATABASE_URL, NEXTAUTH_SECRET vb.)

# 3. Veritabanı Yapılandırması
npx prisma db push && npx prisma db seed

# 4. Çalıştır
npm run dev # Web Paneli
cd apps/mobile && npx expo start # Mobil Uygulama
```

---

## 📖 Documentation & Resources / Dokümantasyon

- [Architecture & Patterns / Mimari Yapı](memory-bank/systemPatterns.md)
- [Technical Context / Teknik Detaylar](memory-bank/techContext.md)
- [Project Roadmap / Yol Haritası](memory-bank/progress.md)
- [API Reference / API Dokümantasyonu](docs/API_REFERENCE.md)

*Future-proof your field operations today with Structra.*
*Saha operasyonlarınızı Structra ile bugünden geleceğe hazırlayın.*
