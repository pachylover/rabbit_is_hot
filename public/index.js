const chzzkClientId = ''; // 여기에 실제 clientId 넣기
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

  if (document.querySelector('#connectSocketBtn')) {
    document.querySelector('#connectSocketBtn').addEventListener('click', function () {
      // 현재 세션 스토리지에 엑세스 토큰이 있는 경우
      if (localStorage.getItem('accessToken') && localStorage.getItem('accessToken') !== 'undefined') {
        //소켓 세션 생성
        createSocketSession();
      } else {
        alert('로그인이 필요합니다.');
      }
    });
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
        // 세션스토리지에 엑세스 토큰 저장
        localStorage.setItem('accessToken', data.content.accessToken);

        location.href = 'http://localhost:3000';
      })
      .catch((error) => console.error('Error:', error));
  }
}

// 소켓 세션 생성
function createSocketSession(chakCallback, donationCallback) {
  const accessToken = localStorage.getItem('accessToken');

  fetch('/create-socket-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken }),
  })
    .then((response) => response.json())
    .then((data) => {
      connectSocketIO(data.content.url, chakCallback, donationCallback);
    })
    .catch((error) => {
      //에러 발생시 throw
      console.error('Error:', error);
      throw new Error('소켓 세션 생성 중 오류 발생');
    });
}

// 채팅, 도네이션 구독
function subscribeSocketIO() {
  const sessionKey = localStorage.getItem('sessionKey');
  const accessToken = localStorage.getItem('accessToken');

  fetch('/subscribe-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken, sessionKey }),
  })
    .then((response) => response.json())
    .then((data) => {
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
    })
    .catch((error) => console.error('Error:', error));

}

function connectSocketIO(url, chatCallback, donationCallback) {
  const socketDataWrap = document.querySelector('#socketData');

  const socket = io(url, {
    transports: ['websocket'],
    auth: {
      accessToken: localStorage.getItem('accessToken'),
    },
  });

  socket.on('connect', () => {
    if (socketDataWrap) socketDataWrap.innerHTML = 'Socket connected';
  });

  socket.on('disconnect', () => {
    if (socketDataWrap) socketDataWrap.innerHTML = 'Socket disconnected';
  });

  socket.on('connect_error', (data) => {
    if (socketDataWrap) socketDataWrap.innerHTML = 'Socket connection error: ' + data;
  });

  socket.on('SYSTEM', (data) => {
    data = JSON.parse(data);
    if (data && data.type === 'connected') {
      //세션에 세션키 저장
      localStorage.setItem('sessionKey', data.data.sessionKey);

      subscribeSocketIO();
    }
  });

  if (chatCallback) {
    socket.on('CHAT', chatCallback);
  }
  if (donationCallback) {
    socket.on('DONATION', donationCallback);
  }
  // socket.on('CHAT', (data) => {
  //   socketDataWrap.innerHTML = 'MESSAGE: ' + data;
  // });
  // socket.on('DONATION', (data) => {
  //   socketDataWrap.innerHTML = 'MESSAGE: ' + data;
  // });
}