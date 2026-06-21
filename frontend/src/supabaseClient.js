import { createClient } from '@supabase/supabase-js';

// Đọc thông số kết nối từ file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Cảnh báo: Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env. Vui lòng cấu hình đầy đủ để kết nối Supabase.'
  );
}

// Khởi tạo Supabase Client công khai
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
