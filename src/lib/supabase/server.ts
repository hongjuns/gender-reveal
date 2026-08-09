import { createClient } from '@supabase/supabase-js';

export interface GenderRevealEventRow {
  id: string;
  baby_nickname: string;
  due_date: string;
  recipient_name: string;
  gender: string;
  share_link: string;
  link_expires_at: string;
  created_at: string;
}

export interface GenderRevealCommentRow {
  id: string;
  event_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

// Supabase의 GenericSchema는 Tables/Views 값 타입에 대한 구조적 assignability를 요구하는데,
// named interface를 그대로 참조하면 인덱스 시그니처 호환 체크가 깨진다. 순수 매핑 타입으로
// "fresh"하게 펼쳐 통과시킨다.
type Fresh<T> = { [K in keyof T]: T[K] };

interface Database {
  public: {
    Tables: {
      gender_reveal_events: {
        Row: Fresh<GenderRevealEventRow>;
        Insert: Fresh<GenderRevealEventRow>;
        Update: Fresh<Partial<GenderRevealEventRow>>;
        Relationships: [];
      };
      gender_reveal_comments: {
        Row: Fresh<GenderRevealCommentRow>;
        Insert: Fresh<Omit<GenderRevealCommentRow, 'id' | 'created_at'>>;
        Update: Fresh<Partial<GenderRevealCommentRow>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

let cachedClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseServerClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY)가 설정되지 않았습니다.');
  }

  cachedClient = createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
