const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// CORS 설정
app.use(cors());

// JSON body 파싱
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 엑세스 토큰 요청 라우터
app.post('/get-access-token', async (req, res) => {
  const { code, state } = req.body;

  // 파라미터가 없는 경우 처리
  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  // 요청 URL과 데이터 설정
  const url = 'https://chzzk.naver.com/auth/v1/token';
  const params = {
    grantType: 'authorization_code',
    clientId: 'YOUR-CLIENT_ID',  // 여기에 실제 clientId 넣기
    clientSecret: 'YOUR_SECRET',  // 여기에 실제 clientSecret 넣기
    code: code,
    state: state,
  };

  try {
    // API 요청
    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 성공적으로 응답받으면 토큰을 리턴
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching access token:', error);
    res.status(500).send('Error fetching access token');
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// GET, 루트 요청 처리
app.get('/', (req, res) => {
  //public/index.html 파일을 클라이언트에게 전송
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/create-socket-session', async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'accessToken is required' });
  }

  try {
    const response = await axios.get(
      'https://openapi.chzzk.naver.com/open/v1/sessions/auth',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('소켓 세션 생성 성공:', response.data);

    res.json(response.data);
  } catch (err) {
    console.error('소켓 세션 생성 실패:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create socket session' });
  }
});

app.post('/subscribe-chat', async (req, res) => {
  const { accessToken, sessionKey } = req.body;
  const chatUrl = 'https://openapi.chzzk.naver.com/open/v1/sessions/events/subscribe/chat';

  console.log('accessToken:', accessToken);
  console.log('sessionKey:', sessionKey);
  if (!accessToken || !sessionKey) {
    return res.status(400).json({ error: 'accessToken and sessionKey are required' });
  }

  const FormData = require('form-data');

  const formData = new FormData();
  formData.append('sessionKey', sessionKey);
  // 채팅 연결
  try {
    const chatResponse = await axios.post(
      chatUrl,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log('채팅 연결 성공:', chatResponse.data);
    res.json(chatResponse.data);
  } catch (err) {
    console.error('채팅 연결 실패:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to connect to chat' });
  }
});

app.post('/subscribe-donation', async (req, res) => {
  // 후원 연결
  const { accessToken, sessionKey } = req.body;
  const donationUrl = 'https://openapi.chzzk.naver.com/open/v1/sessions/events/subscribe/donation';

  console.log('accessToken:', accessToken);
  console.log('sessionKey:', sessionKey);
  if (!accessToken || !sessionKey) {
    return res.status(400).json({ error: 'accessToken and sessionKey are required' });
  }

  const FormData = require('form-data');

  const formData = new FormData();
  formData.append('sessionKey', sessionKey);
  try {
    const donationResponse = await axios.post(
      donationUrl,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log('후원 연결 성공:', donationResponse.data);
    res.json(donationResponse.data);
  } catch (err) {
    console.error('후원 연결 실패:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to connect to donation' });
  }
});