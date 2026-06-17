# İş Detayları Sayfası ve Audit Log Sistemi Tasarımı

## Özet
Admin panelindeki iş detayları sayfasının, müşteri bilgilerini daha erişilebilir kılmak ve "İş Geçmişi" (Audit Log) özelliğini ekleyerek izlenebilirliği artırmak amacıyla yeniden tasarlanması.

## Tasarım Değişiklikleri

### 1. Layout Yapısı (Detaylar Sekmesi)
- Mevcut yapı `grid-cols-2` düzeninde korunacak.
- **Sol Kolon:**
    - "İş Bilgileri" kartı: Müşteri bilgileri kartın en üstüne bir alt bölüm olarak entegre edilecek.
- **Sağ Kolon:**
    - "İş Geçmişi" kartı: Yeni eklenecek.
    - `h-full` (tam yükseklik) ve `overflow-y-auto` (scroll edilebilir) özelliklerine sahip olacak.
    - Üst kısmında filtreleme (onaylar, masraflar, yüklemeler vb.) için bir bar bulunacak.

### 2. Audit Log Sistemi
- `src/lib/audit.ts` dosyasına yeni `AuditAction` tipleri eklenecek:
    - `COST_CREATE`
    - `COST_APPROVE`
    - `COST_REJECT`
    - `JOB_CUSTOMER_ACCEPT`
    - `JOB_CUSTOMER_REJECT`
- Bu aksiyonlar, ilgili API rotalarında `logAudit` çağrıları ile tetiklenecek.
- "İş Geçmişi" bileşeni, audit log kayıtlarını ve mevcut işin tarih bazlı verilerini birleştirerek listeleyecek.

## Teknik Uygulama Adımları

1.  **Audit Enum Güncellemesi:** `src/lib/audit.ts` dosyasının güncellenmesi.
2.  **API Güncellemeleri:** Masraf ve müşteri onay/red süreçlerinin olduğu API rotalarında audit log çağrılarının eklenmesi.
3.  **Bileşen Oluşturma:** `JobAuditHistory` bileşeninin `src/components/admin/job-audit-history.tsx` içerisinde oluşturulması (filtreleme dahil).
4.  **Layout Güncelleme:** `src/components/admin/job-details-tabs.tsx` dosyasındaki detay sekmesinin grid yapısının güncellenmesi.

---
Tarih: 2026-06-17
Durum: Onaylandı
