import express from "express";
import axios from "axios";
import cors from "cors";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { ChzzkClient, ChzzkChat } from "chzzk";
import http from "http";
import WebSocket from "ws";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;
const channelId = '8c10d0b3eca53a19d8396e276bed1e17'; // 채널 ID 설정

// Express 서버 생성
const server = http.createServer(app);
// WebSocket 서버 생성
const wss = new WebSocket.Server({ server });

dotenv.config();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 서버 시작
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// GET, 루트 요청 처리
app.get("/", (req, res) => {
  //public/index.html 파일을 클라이언트에게 전송
  res.sendFile(__dirname + "/public/index.html");
});

// GET, 투표위젯페이지 요청 처리
app.get("/poll", (req, res) => {
  //public/index.html 파일을 클라이언트에게 전송
  res.sendFile(__dirname + "/public/poll-widget.html");
});

// POST, 설정 저장 라우트
app.post("/settings", (req, res) => {
    const settings = req.body; // 클라이언트로부터 전송된 설정 데이터
    console.log("Settings received:", settings);

    // settings.json 파일로 설정 저장
    fs.writeFile(path.join(__dirname, "settings.json"), JSON.stringify(settings, null, 2), (err) => {
        if (err) {
            // 파일 저장 중 오류 발생 시
            console.error("Error saving settings:", err);
            return res.status(500).send("Error saving settings"); // 클라이언트에 오류 응답 전송
        }
        console.log("Settings saved successfully");

        // 파일 저장이 성공한 후에 소켓을 통해 연결된 모든 클라이언트에게 화면 변경 알림
        // (예: 설정이 변경되었으니 화면을 업데이트하라는 신호)
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                // 'settings' 타입의 메시지와 함께 변경된 설정 데이터를 전송
                client.send(JSON.stringify({ type: "settings", settings }));
            }
        });

        // 클라이언트에 성공 응답 전송
        res.status(200).send("Settings saved successfully");
    });
});

//POST, 설정 초기화
app.post("/reset-settings", (req, res) => {
    // default-settings.json 파일을 읽어 settings.json으로 저장
    const defaultSettingsPath = path.join(__dirname, "default-settings.json");
    fs.readFile(defaultSettingsPath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading default settings:", err);
            return res.status(500).send("Error resetting settings");
        }

        fs.writeFile(path.join(__dirname, "settings.json"), data, (writeErr) => {
            if (writeErr) {
                console.error("Error writing settings:", writeErr);
                return res.status(500).send("Error resetting settings");
            }

            console.log("Settings reset to default successfully");

            // 모든 클라이언트에게 초기화된 설정 전송
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "settings", settings: JSON.parse(data) }));
                }
            });

            res.status(200).send("Settings reset to default successfully");
        });
    });
});

wss.on("connection", (ws) => {
  //settings.json.이 있으면 settings.json, 없으면 default-settings.json 파일을 읽어 클라이언트에게 전송
  const settingsPath = path.join(__dirname, "settings.json");
  const defaultSettingsPath = path.join(__dirname, "default-settings.json");
  fs.readFile(settingsPath, "utf8", (err, data) => {
    if (err) {
      // settings.json 파일이 없으면 default-settings.json 파일을 읽음
      fs.readFile(defaultSettingsPath, "utf8", (defaultErr, defaultData) => {
        if (defaultErr) {
          console.error("Error reading default settings:", defaultErr);
          ws.send(JSON.stringify({ type: "error", message: "Could not load settings" }));
        } else {
          console.log("Sending default settings to client");
          ws.send(JSON.stringify({ type: "settings", settings: JSON.parse(defaultData) })); // 클라이언트에게 기본 설정 전송
        }
      });
    } else {
      console.log("Sending settings to client");
      ws.send(JSON.stringify({ type: "settings", settings: JSON.parse(data) })); // 클라이언트에게 설정 전송
    }
  });
});

//치지직 채널과 연결
const client = new ChzzkClient();
const chzzkChat = client.chat({
    channelId: channelId,
    pollInterval: 30 * 1000
});

chzzkChat.on('chat', chat => {
    //클라이언트 모두에게 메시지 전송
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
              type: 'chat',
              data: chat
          }));
      }
    });
});

chzzkChat.connect();