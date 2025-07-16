const pollTitleElement = document.getElementById('poll-title');
const pollBarContainer = document.querySelector('.poll-bar-container');

// 설정 UI 요소
const pollMainTitleInput = document.getElementById('poll-main-title');
const pollMainTitleColorHexInput = document.getElementById('poll-main-title-color-hex');
const pollMainTitleColorPicker = document.getElementById('poll-main-title-color-picker');
const option1NameInput = document.getElementById('option1-name');
const option1ColorHexInput = document.getElementById('option1-color-hex');
const option1ColorPicker = document.getElementById('option1-color-picker');
const option1FontColorHexInput = document.getElementById('option1-font-color-hex');
const option1FontColorPicker = document.getElementById('option1-font-color-picker');
const option2FontColorHexInput = document.getElementById('option2-font-color-hex');
const option2FontColorPicker = document.getElementById('option2-font-color-picker');
const option2NameInput = document.getElementById('option2-name');
const option2ColorHexInput = document.getElementById('option2-color-hex');
const option2ColorPicker = document.getElementById('option2-color-picker');
const saveSettingsButton = document.getElementById('save-settings');
const startPollButton = document.getElementById('start-poll-button');
const resetPollButton = document.getElementById('reset-poll-button');

// 투표 상태를 저장할 객체 (초기값)
let pollState = {
    title: '선호하는 과일은?',
    mainTitleColor: '#4CAF50', // 투표 제목 색상
    options: [
        {
            id: 'option-1',
            name: '딸기',
            votes: 0,
            color: '#4CAF50',
            currentWidth: 0,
        },
        {
            id: 'option-2',
            name: '바나나',
            votes: 0,
            color: '#2196F3',
            currentWidth: 0,
        },
    ],
    isPollingActive: false, // 투표 활성화 여부
    votedUsers: new Map(), // 중복 투표 방지를 위한 투표 참여자 맵 (실제로는 백엔드에서 관리)
};

// 로컬 스토리지에서 설정 불러오기 (OBS 새로고침 시 유지)
function loadSettings() {
    const savedSettings = localStorage.getItem('pollSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        pollState.title = settings.pollTitle;
        pollState.mainTitleColor = settings.pollMainTitleColor || '#4CAF50'; // 기본 색상
        pollState.options[0].name = settings.option1Name;
        pollState.options[0].color = settings.option1Color;
        pollState.options[0].fontColor = settings.option1FontColor || '#ffffff'; // 기본 글자색
        pollState.options[0].votes = settings.option1Votes || 0; // 득표수 초기화
        pollState.options[1].name = settings.option2Name;
        pollState.options[1].color = settings.option2Color;
        pollState.options[1].fontColor = settings.option2FontColor || '#ffffff'; // 기본 글자색
        pollState.options[1].votes = settings.option2Votes || 0; // 득표수 초기화
        pollState.isPollingActive = settings.isPollingActive || false; // 투표 활성화 상태 로드

        // currentWidth는 저장하지 않으므로 초기화 또는 다시 계산될 것
        pollState.options[0].currentWidth = 0;
        pollState.options[1].currentWidth = 0;

        // UI 업데이트
        pollTitleElement.style.color = settings.pollMainTitleColor || '#4CAF50';
        pollMainTitleInput.value = settings.pollTitle;
        pollMainTitleColorHexInput.value = settings.pollMainTitleColor;
        pollMainTitleColorPicker.value = settings.pollMainTitleColor;
        option1NameInput.value = settings.option1Name;
        option1ColorHexInput.value = settings.option1Color;
        option1FontColorHexInput.value = settings.option1FontColor;
        option1ColorPicker.value = settings.option1Color;
        option1FontColorPicker.value = settings.option1FontColor;
        option2NameInput.value = settings.option2Name;
        option2ColorHexInput.value = settings.option2Color;
        option2FontColorHexInput.value = settings.option2FontColor;
        option2ColorPicker.value = settings.option2Color;
        option2FontColorPicker.value = settings.option2FontColor;
    }
}

// 로컬 스토리지에 현재 설정 저장
function saveSettingsToLocalStorage() {
    localStorage.setItem(
        'pollSettings',
        JSON.stringify({
            pollTitle: pollState.title,
            pollMainTitleColor: pollState.mainTitleColor,
            option1Name: pollState.options[0].name,
            option1Color: pollState.options[0].color,
            option1FontColor: pollState.options[0].fontColor || '#ffffff', // 기본 글자색
            option1Votes: pollState.options[0].votes,
            option2Name: pollState.options[1].name,
            option2Color: pollState.options[1].color,
            option2FontColor: pollState.options[1].fontColor || '#ffffff', // 기본 글자색
            option2Votes: pollState.options[1].votes,
            isPollingActive: pollState.isPollingActive,
        })
    );
}

// 텍스트 정렬 클래스 업데이트
function updateTextAlignment(segment, percent) {
    segment.classList.remove('align-left', 'align-right', 'align-center');
    if (percent > 0 && percent < 20) {
        segment.classList.add('align-left'); // 왼쪽 정렬
    } else if (percent >= 20) {
        segment.classList.add('align-center'); // 중앙 정렬
    }
}

// 투표바 업데이트 함수
function updatePollDisplay() {
    const totalVotes = pollState.options[0].votes + pollState.options[1].votes;

    if (pollState.isPollingActive || totalVotes > 0) {
        pollTitleElement.textContent = pollState.title;
        pollBarContainer.classList.add('active'); // CSS 트랜지션으로 나타나게

        let targetPercent1 =
            totalVotes === 0
                ? 0
                : (pollState.options[0].votes / totalVotes) * 100;
        let targetPercent2 =
            totalVotes === 0
                ? 0
                : (pollState.options[1].votes / totalVotes) * 100;

        // 기존 바가 없으면 새로 생성 (초기 상태)
        let segment1 = document.getElementById('segment-option1');
        let segment2 = document.getElementById('segment-option2');

        if (totalVotes === 0) {
            pollBarContainer.innerHTML = ''; // 기존 내용 비우기
        } else if (!segment1 || !segment2) {
            pollBarContainer.innerHTML = ''; // 기존 내용 비우기

            segment1 = document.createElement('div');
            segment1.id = 'segment-option1';
            segment1.className = 'poll-segment';
            segment1.style.backgroundColor = pollState.options[0].color;
            segment1.style.color = pollState.options[0].fontColor; // 기본 글자색
            // 초기에 0% width로 설정 (애니메이션 시작점)
            segment1.style.width = '0%';
            segment1.textContent = `${pollState.options[0].name} ${Math.round(
                targetPercent1
            )}%`;
            pollBarContainer.appendChild(segment1);

            segment2 = document.createElement('div');
            segment2.id = 'segment-option2';
            segment2.className = 'poll-segment';
            segment2.style.backgroundColor = pollState.options[1].color;
            segment2.style.color = pollState.options[1].fontColor; // 기본 글자색
            // 초기에 0% width로 설정 (애니메이션 시작점)
            segment2.style.width = '0%';
            segment2.textContent = `${pollState.options[1].name} ${Math.round(
                targetPercent2
            )}%`;
            pollBarContainer.appendChild(segment2);

            // DOM에 요소가 추가된 후 다음 프레임에서 width를 설정하여 애니메이션 트리거
            requestAnimationFrame(() => {
                segment1.style.width = `${targetPercent1}%`;
                segment2.style.width = `${targetPercent2}%`;
                pollState.options[0].currentWidth = targetPercent1;
                pollState.options[1].currentWidth = targetPercent2;
                updateTextAlignment(segment1, targetPercent1);
                updateTextAlignment(segment2, targetPercent2);
            });
        } else {
            // 기존 바가 있으면 현재 width와 비교하여 애니메이션 방향 결정
            const prevPercent1 = pollState.options[0].currentWidth;
            const prevPercent2 = pollState.options[1].currentWidth;

            // 텍스트 업데이트
            segment1.textContent = `${pollState.options[0].name} ${Math.round(
                targetPercent1
            )}%`;
            segment2.textContent = `${pollState.options[1].name} ${Math.round(
                targetPercent2
            )}%`;

            // 0%일 때는 텍스트도 숨김
            if (targetPercent1 === 0 && totalVotes > 0)
                segment1.textContent = '';
            if (targetPercent2 === 0 && totalVotes > 0)
                segment2.textContent = '';

            // requestAnimationFrame을 사용하여 애니메이션 실행
            requestAnimationFrame(() => {
                segment1.style.width = `${targetPercent1}%`;
                segment2.style.width = `${targetPercent2}%`;

                // 텍스트 정렬 업데이트
                updateTextAlignment(segment1, targetPercent1);
                updateTextAlignment(segment2, targetPercent2);
            });

            //색깔 업데이트
            segment1.style.backgroundColor = pollState.options[0].color;
            segment1.style.color = pollState.options[0].fontColor; // 기본 글자색
            segment2.style.backgroundColor = pollState.options[1].color;
            segment2.style.color = pollState.options[1].fontColor; // 기본 글자색
        }

        // 현재 width 값 저장
        pollState.options[0].currentWidth = targetPercent1;
        pollState.options[1].currentWidth = targetPercent2;
    } else {
        // 투표 비활성화 또는 데이터 없을 때 투표바 숨김
        pollTitleElement.textContent = '투표가 시작되지 않았습니다.';
        pollBarContainer.classList.remove('active'); // CSS 트랜지션으로 사라지게
        pollBarContainer.innerHTML = ''; // 내용 비우기
        // currentWidth 초기화 (숨김 상태이므로)
        pollState.options[0].currentWidth = 0;
        pollState.options[1].currentWidth = 0;
    }
}

// 설정 저장 버튼 이벤트 리스너
saveSettingsButton.addEventListener('click', () => {
    pollState.title = pollMainTitleInput.value;
    pollState.mainTitleColor = pollMainTitleColorHexInput.value || '#4CAF50'; // 기본 색상
    pollState.options[0].name = option1NameInput.value;
    pollState.options[0].color = option1ColorHexInput.value;
    pollState.options[0].fontColor =
        option1FontColorHexInput.value || '#ffffff'; // 기본 글자색
    pollState.options[1].name = option2NameInput.value;
    pollState.options[1].color = option2ColorHexInput.value;
    pollState.options[1].fontColor =
        option2FontColorHexInput.value || '#ffffff'; // 기본 글자색

    saveSettingsToLocalStorage();
    updatePollDisplay(); // 화면 업데이트
    alert('설정이 저장되었습니다!');
});

// 투표 시작 버튼 이벤트 리스너
startPollButton.addEventListener('click', () => {
    if (pollState.isPollingActive) {
        alert('투표가 이미 진행 중입니다!');
        return;
    }
    pollState.isPollingActive = true;
    saveSettingsToLocalStorage();
    updatePollDisplay(); // 화면 업데이트 (제목 변경 및 바 표시)
    alert('투표가 시작되었습니다!');
});

// 투표 일시정지 버튼 이벤트 리스너
document.getElementById('stop-poll-button').addEventListener('click', () => {
    if (!pollState.isPollingActive) {
        alert('투표가 진행 중이 아닙니다!');
        return;
    }
    pollState.isPollingActive = false;
    saveSettingsToLocalStorage();
    updatePollDisplay(); // 화면 업데이트 (제목 변경 및 바 숨김)
    alert('투표가 일시정지되었습니다.');
});

// 투표 초기화 버튼 이벤트 리스너
resetPollButton.addEventListener('click', () => {
    if (
        !confirm(
            '정말로 투표를 초기화하시겠습니까? 모든 득표수가 0이 되고, 투표는 비활성화됩니다.'
        )
    ) {
        return; // 사용자가 취소하면 아무것도 하지 않음
    }
    pollState.options[0].votes = 0;
    pollState.options[1].votes = 0;
    pollState.votedUsers.clear(); // 투표한 사용자 목록 초기화 (백엔드에서도 필요)
    pollState.isPollingActive = false; // 투표 비활성화

    saveSettingsToLocalStorage();
    updatePollDisplay(); // 화면 업데이트 (제목 변경 및 바 숨김)
    alert('투표가 초기화되었습니다.');
});

// 컬러 피커와 HEX 입력 필드 동기화
pollMainTitleColorPicker.addEventListener('input', (event) => {
    pollMainTitleColorHexInput.value = event.target.value.toUpperCase();
});
pollMainTitleColorHexInput.addEventListener('input', (event) => {
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
        pollMainTitleColorPicker.value = event.target.value;
    }
});
option1FontColorPicker.addEventListener('input', (event) => {
    option1FontColorHexInput.value = event.target.value.toUpperCase();
});
option1FontColorHexInput.addEventListener('input', (event) => {
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
        option1FontColorPicker.value = event.target.value;
    }
});
option2FontColorPicker.addEventListener('input', (event) => {
    option2FontColorHexInput.value = event.target.value.toUpperCase();
});
option2FontColorHexInput.addEventListener('input', (event) => {
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
        option2FontColorPicker.value = event.target.value;
    }
});
option1ColorPicker.addEventListener('input', (event) => {
    option1ColorHexInput.value = event.target.value.toUpperCase();
});
option1ColorHexInput.addEventListener('input', (event) => {
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
        option1ColorPicker.value = event.target.value;
    }
});
option2ColorPicker.addEventListener('input', (event) => {
    option2ColorHexInput.value = event.target.value.toUpperCase();
});
option2ColorHexInput.addEventListener('input', (event) => {
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
        option2ColorPicker.value = event.target.value;
    }
});

// --- 초기 로드 시 실행 ---
loadSettings(); // 저장된 설정 로드
updatePollDisplay(); // 초기 화면 렌더링

// --- 임시 투표 함수 (백엔드 없이 브라우저에서 테스트용) ---
// 이 함수들은 실제 배포 시에는 백엔드 로직으로 대체되어야 합니다.
// 투표가 시작되지 않았으면 투표를 받지 않습니다.
function castVote(optionIndex, userId) {
    if (!pollState.isPollingActive) {
        console.log('투표가 시작되지 않아 투표를 받을 수 없습니다.');
        return false;
    }
    if (pollState.votedUsers.has(userId)) {
        console.log(`${userId}님은 이미 투표했습니다.`);
        return false;
    }

    pollState.options[optionIndex].votes++;
    pollState.votedUsers.set(userId, true);
    updatePollDisplay();
    console.log(
        `${userId}님이 ${pollState.options[optionIndex].name}에 투표했습니다.`
    );
    return true;
}

// 예시: 1초마다 투표 시뮬레이션 (개발용)
let simulatedUserCount = 0;
let pollInterval; // interval 관리를 위한 변수

startPollButton.addEventListener('click', () => {
    if (!pollInterval) {
        simulatedUserCount = 0; // 시뮬레이션 시작 시 사용자 카운트 초기화
        pollInterval = setInterval(() => {
            const randomOption = Math.random() < 0.5 ? 0 : 1;
            const userId = `user_${simulatedUserCount++}`;
            castVote(randomOption, userId);
        }, 1000);
    }
});

resetPollButton.addEventListener('click', () => {
    if (pollInterval) {
        clearInterval(pollInterval); // 시뮬레이션 정지
        pollInterval = null;
    }
});
