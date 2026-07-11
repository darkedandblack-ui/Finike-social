/**
 * scripts/wipe-auth-users.mjs
 *
 * Firestore tarafındaki "Tüm Verileri Temizle" admin butonu yalnızca
 * Firestore belgelerini siler. Firebase Authentication hesapları (Authentication
 * sekmesindeki e-posta/şifre ve Google girişleri) client SDK ile silinemez —
 * bunun için Admin SDK + bir servis hesabı (service account) gerekir.
 *
 * KULLANIM:
 *   1) Firebase Console > Project Settings > Service Accounts > Generate new
 *      private key ile bir JSON dosyası indir.
 *   2) Bu dosyayı proje köküne `service-account.json` olarak kaydet
 *      (ASLA git'e ekleme — .gitignore'da olduğundan emin ol).
 *   3) Korumak istediğin admin e-postalarını KEEP_EMAILS dizisine ekle.
 *   4) Çalıştır:
 *        node scripts/wipe-auth-users.mjs            -> sadece ne silineceğini listeler (dry-run)
 *        node scripts/wipe-auth-users.mjs --confirm   -> gerçekten siler
 */

import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// 👇 Silinmesini İSTEMEDİĞİN (korunacak) admin/test-dışı hesapların e-postaları
const KEEP_EMAILS = [
  // "admin@finikesocial.com",
];

const SERVICE_ACCOUNT_PATH = new URL("../service-account.json", import.meta.url);

function loadServiceAccount() {
  try {
    return JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
  } catch {
    console.error(
      "\n❌ service-account.json bulunamadı.\n" +
        "Firebase Console > Project Settings > Service Accounts > Generate new private key\n" +
        "ile indirip proje köküne `service-account.json` olarak kaydet.\n"
    );
    process.exit(1);
  }
}

async function main() {
  const isConfirmed = process.argv.includes("--confirm");
  const serviceAccount = loadServiceAccount();

  initializeApp({ credential: cert(serviceAccount) });
  const auth = getAuth();

  const toDelete = [];
  let nextPageToken;

  do {
    const result = await auth.listUsers(1000, nextPageToken);
    for (const userRecord of result.users) {
      if (KEEP_EMAILS.includes(userRecord.email ?? "")) continue;
      toDelete.push(userRecord);
    }
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  console.log(`\nToplam ${toDelete.length} hesap silinecek:`);
  toDelete.forEach((u) => console.log(`  - ${u.email ?? u.uid}`));

  if (!isConfirmed) {
    console.log(
      "\n(Bu bir ön izlemedir, hiçbir şey silinmedi. Gerçekten silmek için " +
        "`node scripts/wipe-auth-users.mjs --confirm` çalıştırın.)\n"
    );
    return;
  }

  const uids = toDelete.map((u) => u.uid);
  const chunkSize = 1000; // deleteUsers max 1000 per call
  let deletedCount = 0;

  for (let i = 0; i < uids.length; i += chunkSize) {
    const chunk = uids.slice(i, i + chunkSize);
    const result = await auth.deleteUsers(chunk);
    deletedCount += result.successCount;
    if (result.failureCount > 0) {
      console.error(`  ${result.failureCount} hesap silinemedi:`, result.errors);
    }
  }

  console.log(`\n✅ ${deletedCount} hesap silindi.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
