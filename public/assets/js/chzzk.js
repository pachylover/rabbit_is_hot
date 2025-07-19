import { ChzzkClient, ChzzkChat } from "https://cdn.skypack.dev/chzzk";

const options = {
  baseUrls: {
      chzzkBaseUrl: "https://api.chzzk.naver.com",
      gameBaseUrl: "https://comm-api.game.naver.com/nng_main"
  }
};

async function initializeChzzkClient(channelId, chatEvt) {
  const client = new ChzzkClient(options);
  // 채팅 인스턴스 생성
  const chzzkChat = client.chat({
    channelId: channelId,
    pollInterval: 30 * 1000,
  });

  chzzkChat.on("connect", () => {
    console.log("Connected");

    // 최근 50개의 채팅 및 고정 메시지를 요청 (선택사항, 도네 및 시스템 메시지 포함이므로 주의)
    chzzkChat.requestRecentChat(50);
  });

  // 재연결 (방송 시작 시)
  chzzkChat.on("reconnect", (newChatChannelId) => {
    console.log(`Reconnected to ${newChatChannelId}`);
  });

  // 일반 채팅
  chzzkChat.on("chat", (chat) => {
    const message = chat.hidden ? "[블라인드 처리 됨]" : chat.message;
    console.log(`${chat.profile.nickname}: ${message}`);

    // 유저의 팔로우 일시 불러오기
    // client.chat.profileCard(chzzkChat.chatChannelId, chat.profile.userIdHash).then(profile => {
    //     const following = profile.streamingProperty.following
    //     console.log(following ? `${following.followDate} 에 팔로우 함` : "팔로우 안함")
    // })
  });

  // 후원 채팅
  chzzkChat.on("donation", (donation) => {
    console.log(
      `\n>> ${donation.profile?.nickname ?? "익명의 후원자"} 님의 ${
        donation.extras.payAmount
      }원 ${donationTypeName(donation.extras.donationType)}`
    );
    if (donation.message) {
      console.log(`>> ${donation.message}`);
    }
    console.log();
  });

  // 구독
  chzzkChat.on("subscription", (subscription) => {
    console.log(
      `${subscription.profile.nickname} 님이 ${subscription.extras.month} 개월 동안 ${subscription.extras.tierName} 구독중`
    );
  });

  // 시스템 메시지 (채팅 제한, 활동 제한, 운영자 임명 등)
  chzzkChat.on("systemMessage", (systemMessage) => {
    console.log(systemMessage.extras.description);
  });

  // 고정 메시지
  chzzkChat.on("notice", (notice) => {
    // 고정 해제 시 null
    console.log(notice);
  });

  await chzzkChat.connect()

  console.log(chzzkChat);
}

export { initializeChzzkClient, ChzzkChat, options };