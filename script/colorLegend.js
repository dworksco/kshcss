// 그라데이션 범례 만들기
function createGradientColor(...colors) {
    const legend = document.querySelector('.linearGradient')

    const canvasGrad = document.createElement('canvas');
    canvasGrad.width = 30;
    canvasGrad.height = 110;
    canvasGrad.classList.add('canvasGrad')
    const ctxGrad = canvasGrad.getContext('2d');
    legend.appendChild(canvasGrad)

    const grad = ctxGrad.createLinearGradient(0, 5, 0, 105);

    colors.forEach((color, index) => {
        grad.addColorStop(index * (1 / (colors.length - 1)), color)
    });

    ctxGrad.fillStyle = grad;
    ctxGrad.fillRect(0, 5, 30, 100);

    return ctxGrad;

}

// 그라데이션에서 색상을 추출하는 함수
function getGradientColor(percent, ctxGrad) {

    const offset = 5; // 삼각형 크기 절반 (마커가 범위를 벗어날 가능성 예방)

    const y = Math.max(offset, Math.min(99 + offset, percent + offset)); // 0, 100에 지정되어서 투명 값이 나오는 것을 방지
    const pixel = ctxGrad.getImageData(0, y, 1, 1).data;
    return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

}

// 범례에 맞춰 화면에 출력
function showFeatures(features, ctxGrad) {

    const container = document.getElementById('feature-list');

    features.forEach(val => {
        const div = document.createElement('div');
        div.className = 'feature-item';
        div.textContent = val;

        div.style.backgroundColor = getGradientColor(val, ctxGrad);

        container.appendChild(div);
    });

}

// 선택한 데이터의 범례 위치 알려주기
function showMark() {

    const legend = document.querySelector('.linearGradient')

    // create 마커 canvas
    const canvasMark = document.createElement('canvas')
    canvasMark.width = 10;
    canvasMark.height = 110;
    canvasMark.classList.add('canvasMark')
    const ctxMark = canvasMark.getContext('2d')
    legend.appendChild(canvasMark)

    document.addEventListener('click', e => {
        const choice = e.target.closest('.feature-item');
        if (!choice) return;

        // 이전 마커를 지우고 새로 그립니다.
        ctxMark.clearRect(0, 0, canvasMark.width, canvasMark.height);

        const size = canvasMark.width / 2; // 삼각형 크기 절반
        const y = Number(choice.textContent) + size;

        ctxMark.fillStyle = 'black';
        ctxMark.beginPath();

        // 마커 → ▶
        ctxMark.moveTo(0, y - size);                 // 왼쪽 위
        ctxMark.lineTo(0, y + size);                 // 왼쪽 아래
        ctxMark.lineTo(canvasMark.width, y);         // 오른쪽 끝 꼭지점
        ctxMark.fill();
    });
}