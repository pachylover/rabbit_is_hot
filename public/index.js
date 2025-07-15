const chzzkClientId = 'ID'; // 여기에 실제 clientId 넣기
const redirectUrl = 'http://localhost:3000'; // 동일하게 맞춰주기기

document.addEventListener('DOMContentLoaded', function () {
  //로그인 버튼 클릭 이벤트
  if (document.querySelector('#loginBtn')) {
    document.querySelector('#loginBtn').addEventListener('click', function () {
      authenticate();
    });
  }
  //URL 파라미터에 code가 있는 경우
  if (window.location.search.includes('code=')) {
    getAccessToken();
  }

  // 현재 세션 스토리지에 엑세스 토큰이 있는 경우
  if (sessionStorage.getItem('accessToken') && sessionStorage.getItem('accessToken') !== 'undefined') {
    //소켓 세션 생성
    createSocketSession();
  }
});

//인증
function authenticate() {
  let url = 'https://chzzk.naver.com/account-interlock';
  const method = 'GET';

  url += '?clientId=' + chzzkClientId;
  url += '&redirectUri=' + redirectUrl;
  url += '&state=' + Math.random().toString(36).substring(2, 15);
  location.href = url;
}

//엑세스 토큰 요청
function getAccessToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  if (code && state) {
    const apiUrl = 'http://localhost:3000/get-access-token';

    const params = {
      code: code,
      state: state,
    };

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
      .then((response) => response.json())
      .then((data) => {
        alert('엑세스 토큰 발급 완료');
        console.log('data: ', data);
        alert('data: ' + JSON.stringify(data));
        // 세션스토리지에 엑세스 토큰 저장
        sessionStorage.setItem('accessToken', data.content.accessToken);

        location.href = 'http://localhost:3000';
      })
      .catch((error) => console.error('Error:', error));
  }
}

// 소켓 세션 생성
function createSocketSession() {
  const accessToken = sessionStorage.getItem('accessToken');

  fetch('/create-socket-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert('소켓 세션 생성 완료');
      alert('data: ' + JSON.stringify(data));
      connectSocketIO(data.content.url);
    })
    .catch((error) => console.error('Error:', error));
}

// 채팅, 도네이션 구독
function subscribeSocketIO() {
  const sessionKey = sessionStorage.getItem('sessionKey');
  const accessToken = sessionStorage.getItem('accessToken');

  fetch('/subscribe-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken, sessionKey }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert('구독 완료');
      alert('data: ' + JSON.stringify(data));
    })
    .catch((error) => console.error('Error:', error));

  fetch('/subscribe-donation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken, sessionKey }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert('구독 완료');
      alert('data: ' + JSON.stringify(data));
    })
    .catch((error) => console.error('Error:', error));

}

function connectSocketIO(url){
  const socketDataWrap = document.querySelector('#socketData');

  const socket = io(url, {
    transports: ['websocket'],
    auth: {
      accessToken: sessionStorage.getItem('accessToken'),
    },
  });

  socket.on('connect', () => {
    socketDataWrap.innerHTML = 'Socket connected';
  });

  socket.on('disconnect', () => {
    socketDataWrap.innerHTML = 'Socket disconnected';
  });

  socket.on('connect_error', (data) => {
    socketDataWrap.innerHTML = 'Socket connection error: ' + data;
  });

  socket.on('SYSTEM', (data) => {
    data = JSON.parse(data);
    if (data && data.type === 'connected') {
      //세션에 세션키 저장
      sessionStorage.setItem('sessionKey', data.data.sessionKey);

      subscribeSocketIO();
    }
  });

  socket.on('CHAT', (data) => {
    socketDataWrap.innerHTML = 'CHAT: ' + data;
  });

  socket.on('DONATION', (data) => {
    socketDataWrap.innerHTML = 'MESSAGE: ' + data;
  });
}