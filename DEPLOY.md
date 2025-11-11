# 배포 가이드

이 문서는 수능 타임캡슐 앱을 Vercel과 Supabase를 사용하여 배포하는 방법을 설명합니다.

## 1. Supabase 설정

### 1.1 Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - Name: 프로젝트 이름
   - Database Password: 강력한 비밀번호 설정
   - Region: 가장 가까운 지역 선택
4. **Create new project** 클릭

### 1.2 데이터베이스 테이블 생성

1. Supabase 대시보드에서 **SQL Editor** 클릭
2. **New query** 클릭
3. `supabase/migrations/001_create_capsules_table.sql` 파일의 내용을 복사하여 붙여넣기
4. **Run** 클릭하여 실행
5. 성공 메시지 확인

### 1.3 API 키 확인

1. **Settings** > **API** 메뉴로 이동
2. 다음 정보 확인:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 2. GitHub 저장소 생성

### 2.1 로컬 저장소 초기화

```bash
git init
git add .
git commit -m "Initial commit: 수능 타임캡슐 앱"
```

### 2.2 GitHub에 푸시

```bash
# GitHub에서 새 저장소 생성 후
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

## 3. Vercel 배포

### 3.1 Vercel 프로젝트 생성

1. [Vercel](https://vercel.com) 접속
2. **Sign Up** 또는 **Log In** (GitHub 계정으로 로그인 권장)
3. **Add New** > **Project** 클릭
4. GitHub 저장소 선택
5. 프로젝트 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.2 환경 변수 설정

1. **Environment Variables** 섹션으로 이동
2. 다음 환경 변수 추가:

   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Save** 클릭

### 3.3 배포

1. **Deploy** 클릭
2. 배포 완료 대기 (약 1-2분)
3. 배포 완료 후 제공되는 URL로 접속 테스트

## 4. 배포 확인

### 4.1 기능 테스트

1. 캡슐 생성 테스트
2. 캡슐 열기 테스트
3. 캡슐 드래그 테스트
4. 데이터 영구 저장 확인

### 4.2 Supabase 데이터 확인

1. Supabase 대시보드에서 **Table Editor** 클릭
2. `capsules` 테이블 확인
3. 생성된 캡슐 데이터 확인

## 5. 커스텀 도메인 설정 (선택사항)

1. Vercel 프로젝트 설정에서 **Domains** 클릭
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 도메인 설정
4. SSL 인증서 자동 발급 (약 1-2분 소요)

## 6. 문제 해결

### 배포 실패

- 환경 변수가 올바르게 설정되었는지 확인
- 빌드 로그 확인
- Supabase 연결 확인

### 데이터 저장 실패

- Supabase RLS 정책 확인
- API 키 권한 확인
- 네트워크 연결 확인

### 빌드 에러

- Node.js 버전 확인
- 의존성 설치 확인
- 빌드 명령어 확인

## 7. 업데이트 배포

코드를 수정한 후 GitHub에 푸시하면 Vercel이 자동으로 재배포합니다:

```bash
git add .
git commit -m "업데이트 내용"
git push
```

## 참고 자료

- [Supabase 문서](https://supabase.com/docs)
- [Vercel 문서](https://vercel.com/docs)
- [Vite 문서](https://vitejs.dev)

