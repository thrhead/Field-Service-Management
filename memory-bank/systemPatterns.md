# System Patterns and Architectural Standards / Sistem Desenleri ve Mimari Standartlar

## 🌍 English Version

Structra adopts modern software design patterns to provide a high-performance, scalable, and sustainable structure.

### Architectural Layers

#### 1. Presentation Layer
- **Web (Next.js 14)**: Default choice of Server Components for data fetching and auth; Client Components for interactive structures (maps, charts).
- **Mobile (Expo)**: Centralized route management with React Navigation; Atomic UI components in `src/components`.

#### 2. Business & Service Layer
- **Service Pattern**: Centralized service files for API calls (`src/lib/data/*` and `mobile/src/services/*`).
- **Hook-based Logic**: Business logic abstracted from UI components and gathered under `src/hooks`.
- **Validation**: All input data (forms, API payloads) validated with Zod schemas.

#### 3. Data & Persistence Layer
- **Prisma ORM**: Type-safe database access and automated migration management.
- **Caching**: Next.js Data Cache & `unstable_cache` on Web; `AsyncStorage` for GET request caching on Mobile.
- **Offline Queue**: `QueueService` and `SyncManager` for offline mutations (POST/PATCH).

---

## 🇹🇷 Türkçe Versiyon

Structra, yüksek performanslı, ölçeklenebilir ve sürdürülebilir bir yapı sunmak için modern yazılım tasarım desenlerini benimser.

### Mimari Katmanlar

#### 1. Sunum Katmanı (Presentation Layer)
- **Web (Next.js 14)**: Veri çekme ve yetkilendirme için Server Components; interaktif yapılar (harita, grafik) için Client Components.
- **Mobil (Expo)**: React Navigation ile merkezi rota yönetimi; `src/components` altında atomik UI bileşenleri.

#### 2. İş ve Servis Katmanı (Business & Service Layer)
- **Servis Deseni**: API çağrıları için merkezi servis dosyaları (`src/lib/data/*` ve `mobile/src/services/*`).
- **Hook-tabanlı Mantık**: İş mantığı UI bileşenlerinden soyutlanarak `src/hooks` altında toplanır.
- **Doğrulama**: Tüm giriş verileri (formlar, API yükleri) Zod şemaları ile doğrulanır.

#### 3. Veri ve Kalıcılık Katmanı (Data & Persistence Layer)
- **Prisma ORM**: Tip güvenli veritabanı erişimi ve otomatik migration yönetimi.
- **Önbelleğe Alma**: Web'de Next.js Data Cache ve `unstable_cache`; Mobil'de GET istekleri için `AsyncStorage`.
- **Çevrimdışı Kuyruk**: Çevrimdışı mutasyonlar (POST/PATCH) için `QueueService` ve `SyncManager` yapısı.

---

## Critical Design Patterns / Kritik Tasarım Desenleri
- **RBAC**: Middleware level route protection and role-based UI rendering.
- **Event-driven**: Socket.IO for real-time notifications and status updates.
- **DB Indexing**: Automatic indexes for FKs and composite indexes for common filters.
