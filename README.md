# ddenzuComunity-승뮤니티
Node.js + Express + EJS + MongoDB 커뮤니티 웹사이트


## 🖥️ 프로젝트 소개
친구들과 일상을 공유하기 위해 개발 운영중인 커뮤니티 웹사이트입니다.
<br>

## 📌 개요
### 🌎 배포 주소
 - https://www.ddenzu.store/

### 📋 API 문서화
 - https://ddenzucomunity-api-ddenzu.koyeb.app/swagger/

### 📃 세부 내용
 - https://tidal-sky-46b.notion.site/Seung-Ju-Kim-ce8841c405754d8da3b302c3e7abfbc8?p=022199140ed443ce8e28c54f87803f57&pm=c

### 🕰️ 개발 시작일
 - 23.10.25일 

### 🧑‍🤝‍🧑 맴버구성
 - 1인 개인 프로젝트

### ⚙️ 개발 환경
- `Node.js v20.10.0`
- **IDE** : Visual Studio Code
- **Framework** : Express(4.19.2)
- **Database** : MongoDB, AWS S3
- **Template Engine** : EJS

## 📌 주요 기능
#### 로그인
- DB값 검증
- passport 를 사용하여 로그인 시 쿠키 및 세션 생성
#### 회원가입
- 아이디 중복 체크
- 아이디, 비밀번호 포맷 체크
- bcrypt 를 사용하여 비밀번호를 해싱하여 저장
#### 마이페이지
- 닉네임 변경
- 프로필 사진 변경
- 로그아웃
#### 메인페이지
- 게시물 CRUD
- 게시물 검색
- 페이지네이션
- 드래그가능한 웹소켓 채팅박스
#### 게시물 상세페이지
- 게시물의 제목, 작성자, 작성일, 텍스트 내용, 이미지파일, 동영상파일 기재
- YouTube 링크를 동영상으로 변환, 그 외의 링크는 일반 하이퍼링크로 변환
- 댓글과 대댓글을 작성, 삭제
- 게시물 좋아요 카운트
- 유저의 프로필 사진을 클릭 시 유저와 채팅
#### 채팅룸
- MongoDB 의 Change Stream 을 사용하여 실시간 채팅 구현
- 채팅방 리스트 중 한 곳을 선택하여 해당 유저와 채팅 진행
- 채팅방 삭제 기능
## 🌎 배포
#### AWS
- AWS Elastic Beanstalk 를 사용하여 배포
- 로드 밸런싱을 사용하여 사이트 주소에 접근할 때 https 로 리디렉션
- 구입한 도메인을 Route53 에 등록하여 사용
