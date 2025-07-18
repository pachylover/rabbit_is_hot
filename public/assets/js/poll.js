document.addEventListener('DOMContentLoaded', () => {
    // 현재 세션 스토리지에 엑세스 토큰이 있는 경우
    if (localStorage.getItem('accessToken') && localStorage.getItem('accessToken') !== 'undefined') {
        //소켓 세션 생성
        createSocketSession(pollChatEvt);
        document.querySelector('#loginBtn').style.display = 'none'; // 버튼 숨김
        setEvt(); // 설정 이벤트 리스너 설정
        loadSettings(); // 저장된 설정 로드
        updatePollDisplay(); // 초기 화면 렌더링
    } else {
        alert('로그인 후 투표 기능을 사용할 수 있습니다.\n로그인 버튼을 클릭하여 로그인해주세요.');
    }
});

const pollContainer = document.getElementById('poll-container');
const pollTitleElement = document.getElementById('poll-title');
const pollBarContainer = document.querySelector('.poll-bar-container');

// 설정 UI 요소
const pollMainTitleInput = document.getElementById('poll-main-title');
const pollMainTitleColorHexInput = document.getElementById('poll-main-title-color-hex');
const pollMainTitleColorPicker = document.getElementById('poll-main-title-color-picker');
const pollBackgroundHexInput = document.getElementById('poll-background-hex');
const pollBackgroundPicker = document.getElementById('poll-background-picker');
const pollBackgroundOpacityInput = document.getElementById('poll-background-opacity');
const pollBackgroundOpacityValue = document.getElementById('poll-background-opacity-value');
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
const resetSettingButton = document.getElementById('reset-setting-button');

// 투표 상태를 저장할 객체 (초기값)
let pollState = {
    title: '선호하는 과일은?',
    mainTitleColor: '#00FFA3', // 투표 제목 색상
    backgroundColor: '#000', // 투표창 배경색
    backgroundOpacity: 0.8, // 투표창 배경 투명도
    options: [
        {
            id: 'option-1',
            name: '딸기',
            color: '#000000',
            fontColor: '#00FFA3', // 기본 글자색
            currentWidth: 0,
            votedUsers: [], // 중복 투표 방지를 위한 투표 참여자 리스트
        },
        {
            id: 'option-2',
            name: '바나나',
            color: '#00FFA3',
            fontColor: '#000000', // 기본 글자색
            currentWidth: 0,
            votedUsers: [], // 중복 투표 방지를 위한 투표 참여자 리스
        },
    ],
    isPollingActive: false, // 투표 활성화 여부
};

// 로컬 스토리지에서 설정 불러오기 (OBS 새로고침 시 유지)
function loadSettings() {
    const savedSettings = localStorage.getItem('pollSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        //투표창 배경 설정
        pollState.backgroundColor = settings.backgroundColor || '#000'; // 기본 배경색
        pollState.backgroundOpacity = settings.backgroundOpacity || 0.8; // 기본 투명

        // 제목 세팅
        pollState.title = settings.pollTitle;
        pollState.mainTitleColor = settings.pollMainTitleColor || '#4CAF50'; // 기본 색상

        // 옵션 세팅
        pollState.options[0].name = settings.option1Name;
        pollState.options[0].color = settings.option1Color;
        pollState.options[0].fontColor = settings.option1FontColor || '#ffffff'; // 기본 글자색
        pollState.options[1].name = settings.option2Name;
        pollState.options[1].color = settings.option2Color;
        pollState.options[1].fontColor = settings.option2FontColor || '#ffffff'; // 기본 글자색

        // 투표 활성화 상태
        pollState.isPollingActive = settings.isPollingActive || false; // 투표 활성화 상태 로드

        //투표자 수 세팅
        pollState.options[0].votedUsers = settings.option1VotedUsers || [];
        pollState.options[1].votedUsers = settings.option2VotedUsers || [];

        // currentWidth는 저장하지 않으므로 초기화 또는 다시 계산될 것
        pollState.options[0].currentWidth = 0;
        pollState.options[1].currentWidth = 0;

        updateUI();
    }
}

// 로컬 스토리지에 현재 설정 저장
function saveSettingsToLocalStorage() {
    localStorage.setItem(
        'pollSettings',
        JSON.stringify({
            backgroundColor: pollState.backgroundColor,
            backgroundOpacity: pollState.backgroundOpacity,
            pollTitle: pollState.title,
            pollMainTitleColor: pollState.mainTitleColor,
            option1Name: pollState.options[0].name,
            option1Color: pollState.options[0].color,
            option1FontColor: pollState.options[0].fontColor || '#ffffff', // 기본 글자색
            option1VotedUsers: pollState.options[0].votedUsers,
            option2Name: pollState.options[1].name,
            option2Color: pollState.options[1].color,
            option2FontColor: pollState.options[1].fontColor || '#ffffff', // 기본 글자색
            option2VotedUsers: pollState.options[1].votedUsers,
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
    const totalVotes = pollState.options[0].votedUsers.length + pollState.options[1].votedUsers.length;

    if (pollState.isPollingActive || totalVotes > 0) {
        pollTitleElement.textContent = pollState.title;
        pollBarContainer.classList.add('active'); // CSS 트랜지션으로 나타나게

        let targetPercent1 =
            totalVotes === 0
                ? 0
                : (pollState.options[0].votedUsers.length / totalVotes) * 100;
        let targetPercent2 =
            totalVotes === 0
                ? 0
                : (pollState.options[1].votedUsers.length / totalVotes) * 100;

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

function castVote(optionIndex, userId) {
    const otherOptionIndex = optionIndex === 0 ? 1 : 0;
    if (!pollState.isPollingActive) {
        console.log('투표가 시작되지 않아 투표를 받을 수 없습니다.');
        return false;
    }
    if (pollState.options[optionIndex].votedUsers.includes(userId)) {
        console.log(`${userId}님은 이미 투표했습니다.`);
        return false;
    } else if (pollState.options[otherOptionIndex].votedUsers.includes(userId)) {
        // 다른 옵션에 투표한 경우, 해당 투표를 취소하고 새 옵션으로 변경
        const index = pollState.options[otherOptionIndex].votedUsers.indexOf(userId);
        if (index > -1) {
            pollState.options[otherOptionIndex].votedUsers.splice(index, 1);
        }
        console.log(`${userId}님은 ${pollState.options[otherOptionIndex].name}에 투표했으나, ${pollState.options[optionIndex].name}으로 변경합니다.`);
    }

    pollState.options[optionIndex].votedUsers.push(userId);
    updatePollDisplay();
    saveSettingsToLocalStorage();
    return true;
}

const pollChatEvt = (data) => {
    const json = JSON.parse(data);
    const channelId = json.senderChannelId;
    const content = json.content;

    // content가 ! + pollState.options[0].name이거나 pollState.options[1].name이면 투표로 인식
    if (!pollState.isPollingActive) {
        return; // 투표가 활성화되지 않은 경우 무시
    }

    if (content.startsWith('!')) {
        const option1Name = pollState.options[0].name;
        const option2Name = pollState.options[1].name;

        if (content === `!${option1Name}`) {
            castVote(0, channelId); // 첫 번째 옵션에 투표
            return;
        } else if (content === `!${option2Name}`) {
            castVote(1, channelId); // 두 번째 옵션에 투표
            return;
        }
    }
}

function hexToRgba (hex, opacity) {
    // 16진수 색상 코드를 RGB로 변환
    const hexValue = hex.startsWith('#') ? hex.slice(1) : hex; // #을 제거
    let r, g, b;
    console.log(hexValue);

    if (hexValue.length === 3) {
        // 3자리 16진수 (예: "000", "FFF")
        r = parseInt(hexValue[0] + hexValue[0], 16);
        g = parseInt(hexValue[1] + hexValue[1], 16);
        b = parseInt(hexValue[2] + hexValue[2], 16);
    } else if (hexValue.length === 6) {
        // 6자리 16진수 (예: "000000", "FFFFFF")
        r = parseInt(hexValue.substring(0, 2), 16);
        g = parseInt(hexValue.substring(2, 4), 16);
        b = parseInt(hexValue.substring(4, 6), 16);
    } else {
        return null; // 유효하지 않은 16진수 길이
    }

    // RGBA 문자열 반환
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function saveSettings() {
    pollState.title = pollMainTitleInput.value;
    pollState.mainTitleColor = pollMainTitleColorHexInput.value || '#4CAF50'; // 기본 색상
    pollState.backgroundColor = pollBackgroundHexInput.value || '#000'; // 기본 배경색
    pollState.backgroundOpacity = parseFloat(pollBackgroundOpacityInput.value); // 기본 투명도
    // 옵션 설정
    pollState.options[0].name = option1NameInput.value;
    pollState.options[0].color = option1ColorHexInput.value;
    pollState.options[0].fontColor =
        option1FontColorHexInput.value || '#ffffff'; // 기본 글자색
    pollState.options[1].name = option2NameInput.value;
    pollState.options[1].color = option2ColorHexInput.value;
    pollState.options[1].fontColor =
        option2FontColorHexInput.value || '#ffffff'; // 기본 글자색
}

function updateUI() {
    // UI 업데이트
    // 투표창 배경색과 투명도 설정
    pollContainer.style.backgroundColor = hexToRgba(pollState.backgroundColor, pollState.backgroundOpacity);
    pollBackgroundHexInput.value = pollState.backgroundColor;
    pollBackgroundPicker.value = pollState.backgroundColor;
    pollBackgroundOpacityInput.value = pollState.backgroundOpacity;
    pollBackgroundOpacityValue.textContent = pollState.backgroundOpacity.toFixed(2); // 소수점 둘째 자리까지 표시
    // 투표 제목 설정
    pollTitleElement.textContent = pollState.title;
    pollTitleElement.style.color = pollState.mainTitleColor || '#4CAF50';
    pollMainTitleInput.value = pollState.title;
    pollMainTitleColorHexInput.value = pollState.mainTitleColor;
    pollMainTitleColorPicker.value = pollState.mainTitleColor;
    // 옵션 설정
    //옵션 이름
    option1NameInput.value = pollState.options[0].name;
    option2NameInput.value = pollState.options[1].name;
    //옵션 색상
    option1ColorPicker.value = pollState.options[0].color;
    option1ColorHexInput.value = pollState.options[0].color;
    option1FontColorHexInput.value = pollState.options[0].fontColor;
    option1FontColorPicker.value = pollState.options[0].fontColor;

    option2ColorPicker.value = pollState.options[1].color;
    option2ColorHexInput.value = pollState.options[1].color;
    option2FontColorHexInput.value = pollState.options[1].fontColor;
    option2FontColorPicker.value = pollState.options[1].fontColor;

    updatePollDisplay();
}

function setEvt() {
    // 설정 저장 버튼 이벤트 리스너
    saveSettingsButton.addEventListener('click', () => {
        saveSettings();
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

    // 투표/설정 초기화 버튼 이벤트 리스너
    resetSettingButton.addEventListener('click', () => {
        if (confirm('정말로 투표와 설정을 초기화할까요?\n모든 설정이 초기화되고, 투표는 비활성화됩니다.')) {
            localStorage.removeItem('pollSettings'); // 로컬 스토리지 초기화
            alert('투표와 설정이 초기화되었습니다. 페이지가 새로고침됩니다.');
            location.reload(); // 페이지 새로고침
        }
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
        pollState.options[0].votedUsers = []; // 투표 참여자 초기화
        pollState.options[1].votedUsers = []; // 투표 참여자 초기화
        pollState.isPollingActive = false; // 투표 비활성화

        saveSettingsToLocalStorage();
        updatePollDisplay(); // 화면 업데이트 (제목 변경 및 바 숨김)
        alert('투표가 초기화되었습니다.');
    });

    // 컬러 피커와 HEX 입력 필드 동기화
    pollMainTitleColorPicker.addEventListener('input', (event) => {
        pollMainTitleColorHexInput.value = event.target.value.toUpperCase();
        saveSettings();
        updateUI();
    });
    pollMainTitleColorHexInput.addEventListener('input', (event) => {
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
            pollMainTitleColorPicker.value = event.target.value;
            saveSettings();
            updateUI();
        }
    });
    option1FontColorPicker.addEventListener('input', (event) => {
        option1FontColorHexInput.value = event.target.value.toUpperCase();
        saveSettings();
        updateUI();
    });
    option1FontColorHexInput.addEventListener('input', (event) => {
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
            option1FontColorPicker.value = event.target.value;
            saveSettings();
            updateUI();
        }
    });
    option2FontColorPicker.addEventListener('input', (event) => {
        option2FontColorHexInput.value = event.target.value.toUpperCase();
        saveSettings();
        updateUI();
    });
    option2FontColorHexInput.addEventListener('input', (event) => {
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
            option2FontColorPicker.value = event.target.value;
            saveSettings();
            updateUI();
        }
    });
    option1ColorPicker.addEventListener('input', (event) => {
        option1ColorHexInput.value = event.target.value.toUpperCase();
        saveSettings();
        updateUI();
    });
    option1ColorHexInput.addEventListener('input', (event) => {
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
            option1ColorPicker.value = event.target.value;
            saveSettings();
            updateUI();
        }
    });
    option2ColorPicker.addEventListener('input', (event) => {
        option2ColorHexInput.value = event.target.value.toUpperCase();
        saveSettings();
        updateUI();
    });
    option2ColorHexInput.addEventListener('input', (event) => {
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
            option2ColorPicker.value = event.target.value;
            saveSettings();
            updateUI();
        }
    });

    //입력 input 이벤트 리스너
    pollMainTitleInput.addEventListener('input', () => {
        pollState.title = pollMainTitleInput.value;
        saveSettings();
        updateUI();
    });
    option1NameInput.addEventListener('input', () => {
        pollState.options[0].name = option1NameInput.value;
        saveSettings();
        updateUI();
    });
    option2NameInput.addEventListener('input', () => {
        pollState.options[1].name = option2NameInput.value;
        saveSettings();
        updateUI();
    });

    // 투표창 배경색과 투명도 설정
    pollBackgroundPicker.addEventListener('input', (event) => {
        pollBackgroundHexInput.value = event.target.value.toUpperCase();
        pollState.backgroundColor = event.target.value;
        saveSettings();
        updateUI();
    });
    pollBackgroundHexInput.addEventListener('input', (event) => {
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(event.target.value)) {
            pollBackgroundPicker.value = event.target.value;
            pollState.backgroundColor = event.target.value;
            saveSettings();
            updateUI();
        }
    });
    // 투표창 배경 투명도 설정
    pollBackgroundOpacityInput.addEventListener('input', (event) => {
        const opacity = parseFloat(event.target.value);
        pollState.backgroundOpacity = opacity;
        pollBackgroundOpacityValue.textContent = opacity.toFixed(2); // 소수점 둘째 자리까지 표시
        saveSettings();
        updateUI();
    });
}