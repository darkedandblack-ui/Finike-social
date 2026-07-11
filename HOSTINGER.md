# Hostinger'a Finike Social Yükleme (Node.js GEREKMEZ)

Bu proje **statik site** olarak export edilir. Hostinger'ın normal web hosting'i (Premium/Business shared hosting) yeterli.

Firebase (giriş + veritabanı) bulutta çalışır. Hostinger sadece HTML/JS dosyalarını sunar.

---

## Adım 1 — Bilgisayarında build al

`.env.local` dosyan dolu olmalı (Firebase anahtarları).

```powershell
cd C:\Users\brand\Projects\finike-social
npm install
npm run build
```

Build bitince **`out`** klasörü oluşur. Yayına gidecek dosyalar burada.

---

## Adım 2 — `out` klasörünü Hostinger'a yükle

### Yöntem A: hPanel File Manager

1. [hostinger.com](https://hostinger.com) → **hPanel**
2. **Websites** → siteni seç → **File Manager**
3. **`public_html`** klasörüne gir
4. İçindeki eski dosyaları sil (yedek aldıysan)
5. Bilgisayarındaki **`out`** klasörünün **içindeki tüm dosyaları** `public_html`'e yükle  
   (`out` klasörünün kendisini değil, içindekileri)

Yükleme sonrası `public_html` şöyle görünmeli:

```
public_html/
  index.html
  feed/
  login/
  .htaccess
  _next/
  ...
```

### Yöntem B: FileZilla (FTP)

1. hPanel → **FTP Accounts** → bilgileri al
2. FileZilla ile bağlan
3. Uzak tarafta `public_html`
4. Local tarafta `out` içeriğini sürükle-bırak

---

## Adım 3 — SSL aç

hPanel → **SSL** → domain için **Let's Encrypt** etkinleştir.

Site `https://senindomain.com` ile açılmalı.

---

## Adım 4 — Firebase ayarı (Google giriş için)

1. [Firebase Console](https://console.firebase.google.com) → **Authentication**
2. **Settings** → **Authorized domains**
3. Domain'ini ekle: `senindomain.com`

---

## Adım 5 — Test et

- Ana sayfa açılıyor mu?
- Kayıt / giriş
- Gönderi + etkinlik oluştur
- Mesaj gönder
- Mobilde dene

---

## Site güncelleme

Kod değiştirdikten sonra:

```powershell
npm run build
```

Yeni `out` içeriğini tekrar `public_html`'e yükle (üzerine yaz).

---

## Sık sorunlar

### Beyaz sayfa / 404
→ `public_html`'e `out` **içeriği** mi yüklendi? `.htaccess` var mı?

### Firebase hatası
→ Build alırken `.env.local` dolu muydu? Env değişkenleri build'e gömülür — değiştirince **yeniden build** şart.

### Google giriş çalışmıyor
→ Firebase Authorized domains'e domain eklendi mi?

### Mesaj / feed boş
→ Firebase Console → Firestore → Indexes → hepsi **Enabled** olmalı

---

## Özet

| Ne | Nerede |
|----|--------|
| Site dosyaları | Hostinger `public_html` |
| Kullanıcı verisi | Firebase Firestore |
| Giriş | Firebase Auth |
| Node.js | **Gerekmez** |
