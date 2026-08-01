import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedUrl: string | null = null;
let cachedKey: string | null = null;

export function getSupabaseClient(customUrl?: string, customAnonKey?: string): SupabaseClient | null {
  const env = (import.meta as any).env || {};
  const url = customUrl || env.VITE_SUPABASE_URL || '';
  const anonKey = customAnonKey || env.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !anonKey || url === 'https://your-project-id.supabase.co') {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedUrl = url;
    cachedKey = anonKey;
    cachedClient = createClient(url, anonKey);
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'Harap masukkan Supabase URL dan Anon Key.' };
  }

  try {
    const client = createClient(url, anonKey);
    const { error } = await client.auth.getSession();
    if (error) {
      return { success: false, message: `Gagal terhubung ke Supabase: ${error.message}` };
    }
    return { success: true, message: 'Koneksi Supabase berhasil diverifikasi!' };
  } catch (err: any) {
    return { success: false, message: `Error koneksi: ${err?.message || 'Tidak dapat terhubung'}` };
  }
}
