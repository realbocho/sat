import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경 변수가 없으면 null 반환 (localStorage 폴백 사용)
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Supabase 클라이언트 생성 실패:', error);
  }
} else {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. localStorage를 사용합니다.');
}

export { supabase };

