# Naver Blog Auto Publisher

이 저장소는 네이버 블로그에 자동으로 글을 작성하고 업로드할 수 있는 간단한 CLI 도구를 제공합니다. 기본적으로는 제공된 템플릿을 기반으로 글을 생성하며, 필요에 따라 다양한 주제와 키워드를 적용할 수 있습니다.

## 요구 사항

- Python 3.9 이상
- Naver Developers 애플리케이션 (블로그 쓰기 권한 필요)

## 설치

1. 저장소 클론 후 의존성을 설치합니다.

   ```bash
   pip install -r requirements.txt
   ```

2. 환경 변수를 설정합니다. `.env` 파일을 사용한다면 다음과 같이 작성할 수 있습니다.

   ```env
   NAVER_BLOG_CLIENT_ID=your_client_id
   NAVER_BLOG_CLIENT_SECRET=your_client_secret
   NAVER_BLOG_ACCESS_TOKEN=your_access_token
   NAVER_BLOG_BLOG_ID=your_blog_id
   # 필요시 기본 API URL 재정의
   # NAVER_BLOG_API_BASE_URL=https://openapi.naver.com/blog/writePost.json
   ```

## 사용 방법

토픽과 키워드를 인자로 주어 실행하면 됩니다.

```bash
python main.py "AI 트렌드" --keywords 생성형AI 챗봇 --dry-run
```

- `--dry-run`: 실제 업로드 없이 생성된 글만 출력합니다.
- `--title-prefix`: 제목 앞에 접두사를 붙입니다.

실제로 업로드하려면 `--dry-run` 옵션을 제거하고 실행합니다.

```bash
python main.py "데이터 분석" --keywords 파이썬 판다스
```

## 구조

```
naver-blog-auto/
├── main.py          # 메인 실행 스크립트
├── config.py        # 환경 변수 기반 설정 로더
├── requirements.txt # 필요한 라이브러리 명세
├── README.md        # 사용 설명서
└── .gitignore       # Git 제외 파일 목록
```

## 주의 사항

- 네이버 API 정책에 따라 적절한 호출 빈도를 유지해야 합니다.
- 실제 서비스에 사용하기 전에 `--dry-run`으로 충분히 테스트하세요.
