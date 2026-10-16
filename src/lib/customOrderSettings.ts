import { db } from './firebaseAdmin';

const SETTINGS_COLLECTION = 'appSettings';
const SETTINGS_DOC_ID = 'customOrder';

export type CustomOrderSettings = {
  enabled: boolean;
  message: string;
  instagramUsername: string;
};

export function normalizeInstagramUsername(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const username = trimmed
    .replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, '')
    .replace(/^https?:\/\/(?:www\.)?ig\.me\/m\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(username) ? username : null;
}

const defaultMessage = 'We are currently not accepting custom orders. You can contact us on +91 8095047273.';

export function getDefaultCustomOrderSettings(): CustomOrderSettings {
  return {
    enabled: true,
    message: defaultMessage,
    instagramUsername: 'makerskatte'
  };
}

export async function getCustomOrderSettings(): Promise<CustomOrderSettings> {
  const ref = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
  const snap = await ref.get();
  if (!snap.exists) return getDefaultCustomOrderSettings();

  const data = snap.data() as Record<string, unknown>;
  const enabled = typeof data.customOrderEnabled === 'boolean' ? data.customOrderEnabled : true;
  const message = typeof data.customOrderDisabledMessage === 'string' && data.customOrderDisabledMessage.trim()
    ? data.customOrderDisabledMessage.trim()
    : defaultMessage;
  const instagramUsername = typeof data.instagramUsername === 'string'
    ? normalizeInstagramUsername(data.instagramUsername) ?? ''
    : 'makerskatte';

  return { enabled, message, instagramUsername };
}

export async function setCustomOrderSettings(input: Partial<CustomOrderSettings>) {
  const current = await getCustomOrderSettings();
  const next: CustomOrderSettings = {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : current.enabled,
    message: typeof input.message === 'string' && input.message.trim() ? input.message.trim() : current.message,
    instagramUsername: typeof input.instagramUsername === 'string'
      ? normalizeInstagramUsername(input.instagramUsername) ?? current.instagramUsername
      : current.instagramUsername
  };

  const ref = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
  await ref.set(
    {
      customOrderEnabled: next.enabled,
      customOrderDisabledMessage: next.message,
      instagramUsername: next.instagramUsername,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return next;
}
