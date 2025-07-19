// 치치직 라이브러리 import
const { ChzzkClient, donationTypeName } = require('chzzk');

// 로그인 옵션 (선택사항)
const options = {
    nidAuth: "l6NWsKTLgqBG7iF2JcynmJGUDC6Gnss6lKQol82Qhno98FpAGBXDtg7Nc1KaDQnN",
    nidSession: "AAABw0lA45k7I3vzruA42e3rc1nwi7q/ACVZWdHwuLWifIYhZiDH3P3kE+3IZco161PstJkW2PpDrZ9Ap//9goeZhYOJ+Ya7KIWPTLejdB7eNd8IXetdc0EM6HBEb2FzYSgBZqcwTGhnVb5+JHXtnyATZvxblh/vxN26iY6Gf37PYqYBDAjUXpGOe0XnNKIUt4E68zO9WMmUXk7J25TAEMMtgmFzENdtPgPNCJBgy76LUbyApRnmKYYYaDe5HP4t4kgFXQM05HY8KO2GwwPJs0R/ewqUX5oiBJDTXOL1UFsentdpNE2UrcPA7XGvWKcgiTZQ5Tvrm2VfA7uolR3UZjfHcmY/w8jqyT79aMNCcktZ4+3is0qpIFyESsWDM25/7lpmBzWuv6oNl0xgch4a2xguZwoknQBxFoe+AMH9GfaTEn0Rr4lFKpKYEYd+qo52n58GZAU5i8YqqJv3Q2Zkc10nOkAveCzrmzCIJmugR9TX2xtBUGjPIj6F120cWDOsezyF9giwfaNNrAumiBeX8GnWWPfw5m7uwnLQlEh4AHTHJ0LiIGXJz48PUz1JnDJrKJ3GIe2y3n3HmAfhSpbznMEdbcSp9O/w5/iXRgemZykczHzT"
}

const client = new ChzzkClient(options)
// 채널 검색
const result = await client.search.channels("녹두로")
const channel = result.channels[0]

// 설정된 방송 정보, 방송 중이 아닐 경우에도 정보가 존재할 수 있음
const liveDetail = await client.live.detail(channel.channelId)

if (liveDetail) {
    const media = liveDetail.livePlayback.media // 방송 중이 아닐 경우 비어있음
    const hls = media.find(media => media.mediaId === "HLS") // HLS, LLHLS

    if (hls) {
        const m3u8 = await client.fetch(hls.path).then(r => r.text())
        console.log(m3u8)
    }
}

// 채팅 인스턴스 생성
const chzzkChat = client.chat({
    channelId: channel.channelId,
    // chatChannelId 의 변경을 감지하기 위한 polling 요청의 주기 (선택사항, ms 단위)
    // channelId를 지정할 경우 자동으로 30초로 설정됨, 0초로 설정 시 polling 요청을 하지 않음
    pollInterval: 30 * 1000
})

chzzkChat.on('connect', () => {
    console.log('Connected')

    // 최근 50개의 채팅 및 고정 메시지를 요청 (선택사항, 도네 및 시스템 메시지 포함이므로 주의)
    chzzkChat.requestRecentChat(50)
})

// 재연결 (방송 시작 시)
chzzkChat.on('reconnect', newChatChannelId => {
    console.log(`Reconnected to ${newChatChannelId}`)
})

// 일반 채팅
chzzkChat.on('chat', chat => {
    const message = chat.hidden ? "[블라인드 처리 됨]" : chat.message
    console.log(`${chat.profile.nickname}: ${message}`)

    // 유저의 팔로우 일시 불러오기
    // client.chat.profileCard(chzzkChat.chatChannelId, chat.profile.userIdHash).then(profile => {
    //     const following = profile.streamingProperty.following
    //     console.log(following ? `${following.followDate} 에 팔로우 함` : "팔로우 안함")
    // })
})

// 후원 채팅
chzzkChat.on('donation', donation => {
    console.log(`\n>> ${donation.profile?.nickname ?? "익명의 후원자"} 님의 ${donation.extras.payAmount}원 ${donationTypeName(donation.extras.donationType)}`)
    if (donation.message) {
        console.log(`>> ${donation.message}`)
    }
    console.log()
})

// 구독
chzzkChat.on('subscription', subscription => {
    console.log(`${subscription.profile.nickname} 님이 ${subscription.extras.month} 개월 동안 ${subscription.extras.tierName} 구독중`)
})

// 시스템 메시지 (채팅 제한, 활동 제한, 운영자 임명 등)
chzzkChat.on('systemMessage', systemMessage => {
    console.log(systemMessage.extras.description)
})

// 고정 메시지
chzzkChat.on('notice', notice => {
    // 고정 해제 시 null
    console.log(notice)
})

// RAW 이벤트
// chzzkChat.on('raw', raw => {
//     console.log(raw)
// })

// 채팅 연결
await chzzkChat.connect()