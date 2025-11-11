# 수능 타임캡슐 🎓

모바일 전용 수능 타임캡슐 웹 애플리케이션입니다.

## 기능

- ✨ 개인별 이름과 비밀번호로 캡슐 생성
- 🔒 2025년 11월 13일 오후 6시 이후에만 캡슐 개봉 가능
- 📸 이미지 업로드 지원
- 💭 현재 심정과 수능 후 메시지 작성
- 🎮 물리 엔진 기반 캡슐 드래그 앤 드롭
- 💾 Supabase를 통한 영구 데이터 저장
- 📱 모바일 터치 최적화
- ☁️ Vercel을 통한 무료 배포

## 설치 및 실행

### 필수 요구사항

- Node.js 16 이상
- npm 또는 yarn
- Supabase 계정 (무료)

### 1. Supabase 설정

1. [Supabase](https://supabase.com)에서 계정 생성 및 새 프로젝트 생성
2. 프로젝트 대시보드에서 **SQL Editor**로 이동
3. `supabase/migrations/001_create_capsules_table.sql` 파일의 내용을 복사하여 실행
4. **Settings > API**에서 다음 정보 확인:
   - Project URL
   - anon/public key

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 설치

```bash
npm install
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

### 5. 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 사용 방법

1. **캡슐 생성**
   - "새 캡슐 만들기" 버튼을 클릭
   - 이름과 비밀번호 입력 (필수)
   - 이미지, 현재 심정, 수능 후 메시지 입력 (선택)
   - "생성" 버튼 클릭

2. **캡슐 열기**
   - 2025년 11월 13일 오후 6시 이후
   - 캡슐을 탭하여 선택
   - 비밀번호 입력
   - 캡슐 내용 확인

3. **캡슐 이동**
   - 캡슐을 길게 눌러 드래그
   - 원하는 위치에 놓기
   - 중력이 작용하여 자연스럽게 떨어집니다

## 기술 스택

- React 18
- Vite
- Tailwind CSS
- Lucide React (아이콘)
- Supabase (데이터베이스)
- Vercel (배포)

## 모바일 최적화

- 터치 이벤트 지원
- 반응형 디자인
- 모바일 브라우저 최적화
- 터치 영역 최적화 (최소 44px)
- 스크롤 성능 최적화

## 데이터 저장

모든 데이터는 Supabase 데이터베이스에 영구 저장됩니다.
- 브라우저를 닫아도 데이터가 유지됩니다
- 다른 기기에서도 동일한 데이터에 접근할 수 있습니다
- Supabase 연결 실패 시 localStorage로 자동 폴백됩니다

## Vercel 배포

### GitHub 연동 배포

1. **GitHub에 저장소 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Vercel에 프로젝트 연결**
   - [Vercel](https://vercel.com)에 로그인
   - **New Project** 클릭
   - GitHub 저장소 선택
   - 프로젝트 설정:
     - Framework Preset: **Vite**
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **환경 변수 설정**
   - Vercel 프로젝트 설정에서 **Environment Variables** 추가:
     - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
     - `VITE_SUPABASE_ANON_KEY`: Supabase anon key
   - **Save** 후 재배포

4. **배포 완료**
   - 자동으로 배포가 시작됩니다
   - 배포 완료 후 제공되는 URL로 접속 가능합니다

### Vercel CLI 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

## 환경 변수

프로젝트를 실행하기 위해 다음 환경 변수가 필요합니다:

- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon/public key

## 데이터베이스 스키마

`capsules` 테이블 구조:

- `id` (BIGINT): 캡슐 고유 ID
- `name` (TEXT): 캡슐 이름
- `password` (TEXT): 비밀번호
- `image` (TEXT): 이미지 데이터 (base64)
- `current_feeling` (TEXT): 현재 심정
- `future_message` (TEXT): 수능 후 메시지
- `position` (JSONB): 캡슐 위치
- `velocity` (JSONB): 캡슐 속도
- `created_at` (TIMESTAMP): 생성 시간
- `updated_at` (TIMESTAMP): 수정 시간

## 문제 해결

### Supabase 연결 실패

- 환경 변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- RLS (Row Level Security) 정책이 올바르게 설정되었는지 확인
- 네트워크 연결 확인

### 빌드 실패

- Node.js 버전 확인 (16 이상 필요)
- `npm install` 재실행
- 캐시 삭제: `rm -rf node_modules package-lock.json && npm install`

## 라이선스

MIT

