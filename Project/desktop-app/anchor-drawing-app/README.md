# Anchor Drawing App

앵커 삽도 생성 파이썬 데스크톱 애플리케이션

## 개요

이 애플리케이션은 test-app의 "앵커 삽도" 기능을 파이썬 기반의 설치형 로컬 앱으로 구현한 것입니다.

## 주요 기능

- 2D 삽도(단면도) 생성
- 앵커 배치 및 그리드 생성
- SVG 형식으로 결과물 저장
- 실시간 미리보기

## 설치 방법

```bash
# 가상환경 생성 (권장)
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

## 실행 방법

```bash
python main.py
```

## 프로젝트 구조

```
anchor-drawing-app/
├── main.py                 # 메인 진입점
├── gui/                    # GUI 관련 모듈
│   ├── __init__.py
│   ├── main_window.py      # 메인 윈도우
│   └── widgets.py          # 커스텀 위젯
├── core/                   # 핵심 로직
│   ├── __init__.py
│   ├── section_generator.py  # 삽도 생성 로직
│   ├── anchor_calculator.py  # 앵커 계산 로직
│   └── svg_renderer.py      # SVG 렌더링
├── models/                 # 데이터 모델
│   ├── __init__.py
│   └── data_models.py       # 데이터 모델 정의
├── requirements.txt        # 의존성 목록
└── README.md              # 프로젝트 설명
```

## 개발 참고

이 앱은 `inno-spec-monorepo/packages/test-app/src/components/SectionView.tsx`의 로직을 파이썬으로 포팅한 것입니다.

