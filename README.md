📁 프로젝트 구조
├── index.html          # 진입점 — 전체 레이아웃 및 CesiumJS 초기화
├── main.js             # 모듈 초기화 (DOMContentLoaded 진입점)
│
├── dropDown.js         # 모드 선택 드롭다운 (Ask / Agent 전환)
├── addDropDown.js      # 파일 추가 드롭다운 (파일 업로드 / 파일시스템)
├── searchInput.js      # 텍스트 검색 + 즐겨찾기(star) 기능
├── widget.js           # 위젯 패널 드래그 이동 / 열기·닫기
│
├── style.css           # 유틸리티 클래스 (Flex, spacing, button 등)
└── dashboard.css       # 컴포넌트 스타일 (드롭다운, 타임라인, 위젯)

🧩 레이아웃 구조
body (CSS Grid)
├── header                  ─ 상단 전체
│   ├── header-left         로고, 햄버거 메뉴
│   ├── header-center       타이틀, 검색 아이콘
│   └── header-right        저장, 유저 프로필
│
├── sidebar                 ─ 좌측 패널 (40dvw)
│   ├── 텍스트 검색 + 즐겨찾기 목록
│   ├── 모드 드롭다운 (Ask / Agent)
│   └── 파일 추가 드롭다운
│
└── content                 ─ 우측 지도 영역 (1fr)
    ├── #cesiumContainer    CesiumJS 3D 지도
    └── .overlay            드래그 가능한 위젯 패널
