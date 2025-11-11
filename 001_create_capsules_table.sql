-- 캡슐 테이블 생성
CREATE TABLE IF NOT EXISTS capsules (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  image TEXT,
  current_feeling TEXT,
  future_message TEXT,
  position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  velocity JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_capsules_created_at ON capsules(created_at DESC);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (공개)
CREATE POLICY "Anyone can read capsules"
  ON capsules
  FOR SELECT
  USING (true);

-- 모든 사용자가 캡슐 생성 가능
CREATE POLICY "Anyone can create capsules"
  ON capsules
  FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 캡슐 업데이트 가능
CREATE POLICY "Anyone can update capsules"
  ON capsules
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_capsules_updated_at
  BEFORE UPDATE ON capsules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

