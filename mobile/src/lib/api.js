import { supabase } from './supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://your-backend/api';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getMachineByQr(qrId) {
  // Prefer a consolidated endpoint that returns machine + training_content + signed URLs
  const res = await fetch(`${API_BASE}/qr/${qrId}`);
  if (!res.ok) throw new Error('Failed to load machine');
  return res.json();
}

export async function updateProgress({ userId, contentId, status }) {
  const res = await fetch(`${API_BASE}/employee/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, contentId, status }),
  });
  if (!res.ok) throw new Error('Failed to update progress');
  return res.json();
}

export async function refreshSignedUrl(publicUrl) {
  // Optional: add a backend endpoint that issues short-lived signed URLs for storage items
  const res = await fetch(`${API_BASE}/media/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: publicUrl })
  });
  if (!res.ok) throw new Error('Failed to sign URL');
  return res.json();
}
