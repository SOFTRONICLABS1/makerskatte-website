import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function loadDotEnv() {
  try {
    const raw = readFileSync('.env', 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex <= 0) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value.replace(/^"(.*)"$/, '$1');
      }
    }
  } catch {
    // no-op if file cannot be read
  }
}

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: required('FIREBASE_PROJECT_ID'),
        clientEmail: required('FIREBASE_CLIENT_EMAIL'),
        privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n')
      })
    });
  }
  return getFirestore();
}

async function main() {
  loadDotEnv();
  const email = required('ADMIN_EMAIL').trim().toLowerCase();
  const password = required('ADMIN_PASSWORD');
  const db = getDb();

  const passwordHash = await bcrypt.hash(password, 10);
  const snap = await db.collection('adminUsers').where('email', '==', email).limit(1).get();
  const now = new Date().toISOString();

  if (snap.empty) {
    const ref = db.collection('adminUsers').doc();
    await ref.set({
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now
    });
    console.log(`Created admin user: ${email}`);
    return;
  }

  const ref = snap.docs[0].ref;
  await ref.set(
    {
      email,
      passwordHash,
      updatedAt: now
    },
    { merge: true }
  );
  console.log(`Updated admin user password: ${email}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
