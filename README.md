# 치지직 채팅 위젯

실시간 스트리밍을 위한 치지직 채팅 오버레이 위젯입니다. OBS Studio에서 브라우저 소스로 사용할 수 있습니다.

## 주요 기능

- 실시간 치지직 채팅 표시
- OBS Studio 호환 브라우저 소스
- 투명한 배경 지원
- 커스터마이징 가능한 디자인

## 설치 및 실행

### 1. 프로젝트 다운로드
```bash
git clone https://github.com/pachylover/rabbit_is_hot
cd rabbit_is_hot
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 애플리케이션 실행
```bash
npm start
```

## OBS Studio 설정

### 1. 브라우저 소스 추가
1. OBS Studio를 실행합니다
2. **소스** 패널에서 **+** 버튼을 클릭합니다
3. **브라우저**를 선택합니다

### 2. 브라우저 소스 설정
- **URL**: `http://localhost:3000`
- **너비**: `800`
- **높이**: `200`

### 3. 사용자 지정 CSS 적용
다음 CSS 코드를 **사용자 지정 CSS** 필드에 입력합니다:

```css
body { 
    background-color: transparent; 
    margin: 0px auto; 
    overflow: hidden; 
}
#settings-panel {
    display: none;
}
```

### 4. 설정 완료
**확인** 버튼을 클릭하여 설정을 저장하고 송출을 시작합니다.
