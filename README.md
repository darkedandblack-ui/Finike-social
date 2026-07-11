# Finike Social

Finike'nin yerel sosyal platformu — etkinlikler, paylaşımlar, mesajlaşma ve topluluk.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Firebase Authentication**
- **Firestore Database**
- **Framer Motion**

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Firebase projesi oluştur

1. [Firebase Console](https://console.firebase.google.com) üzerinde yeni proje oluşturun
2. **Authentication** → Email/Password ve Google sağlayıcılarını etkinleştirin
3. **Firestore Database** oluşturun (production mode)
4. Web uygulaması ekleyip config bilgilerini alın

### 3. Ortam değişkenlerini ayarla

```bash
cp .env.example .env.local
```

`.env.local` dosyasını Firebase bilgilerinizle doldurun.

### 4. Güvenlik kurallarını deploy et

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

`firestore.rules` dosyası projede hazır. **Storage kullanılmıyor** — fotoğraf yükleme yok, ek maliyet yok.

### 5. Geliştirme sunucusunu başlat

```bash
npm run dev
```

http://localhost:3000 adresinde açılır.

## Proje Yapısı

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── (auth)/login/            # Giriş
│   ├── (auth)/register/         # Kayıt
│   ├── onboarding/              # 4 adımlı onboarding
│   ├── (main)/
│   │   ├── feed/                # Ana akış
│   │   ├── create/              # Gönderi oluştur
│   │   ├── profile/             # Profil
│   │   ├── messages/            # Mesajlaşma
│   │   ├── notifications/       # Bildirimler
│   │   └── events/              # Etkinlikler
│   ├── admin/                   # Admin panel
│   └── api/                     # API routes
├── components/
│   ├── ui/                      # Button, Card, Modal, Avatar...
│   ├── layout/                  # Navbar, Sidebar, BottomNav
│   ├── posts/                   # PostCard, CommentSection
│   ├── events/                  # EventCard
│   ├── chat/                    # ChatBox
│   ├── profile/                 # ProfileCard
│   └── notifications/           # NotificationItem
├── contexts/                    # AuthContext
├── lib/
│   ├── firebase/                # Firebase config, auth, firestore
│   ├── utils.ts
│   └── validations.ts
└── types/                       # TypeScript tipleri
```

## Sayfalar

| Sayfa | Route |
|-------|-------|
| Landing | `/` |
| Giriş | `/login` |
| Kayıt | `/register` |
| Onboarding | `/onboarding` |
| Akış | `/feed` |
| Gönderi Oluştur | `/create` |
| Profil | `/profile` |
| Mesajlar | `/messages` |
| Bildirimler | `/notifications` |
| Etkinlikler | `/events` |
| Admin Panel | `/admin` |

## Admin Kullanıcısı

Firestore'da bir kullanıcının `role` alanını `admin` olarak ayarlayın:

```
users/{userId} → role: "admin"
```

## Deploy (Vercel)

1. GitHub repo'yu Vercel'e bağlayın
2. Ortam değişkenlerini ekleyin
3. `CRON_SECRET` değişkenini ayarlayın (etkinlik hatırlatmaları için)

## Lisans

MIT
