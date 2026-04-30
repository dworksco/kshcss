// 그라데이션 범례 만들기
// createGradientLegend(.legendContainer, 범례 최소값, 범례 최대값, 범례 넓이, 범례 높이, 범례 색상)
function createGradientLegend(el, min, max, width, height, ...colors) {

    const canvasGrad = document.createElement('canvas');
    const offset = 5; // 삼각형 크기 절반 (마커가 범위를 벗어날 가능성 예방)
    canvasGrad.width = width;
    canvasGrad.height = height + offset * 2;
    canvasGrad.classList.add('canvasGrad');
    const ctxGrad = canvasGrad.getContext('2d');
    el.appendChild(canvasGrad)

    const grad = ctxGrad.createLinearGradient(0, offset, 0, height + offset);

    // 중단점 생성
    colors.forEach((color, index) => {
        grad.addColorStop(index * (1 / (colors.length - 1)), color)
    });

    ctxGrad.fillStyle = grad;
    ctxGrad.fillRect(0, offset, width, height);

    // 범례 라벨 생성
    const labelContainer = document.createElement('div')
    labelContainer.classList.add('legendLabel')
    labelContainer.style.height = height + offset * 2;

    // 라벨 텍스트 생성
    const labelMin = document.createElement('div')
    labelMin.textContent = min;
    const labelMax = document.createElement('div')
    labelMax.textContent = max;

    labelContainer.appendChild(labelMin)
    labelContainer.appendChild(labelMax)
    el.appendChild(labelContainer)


}

// 그라데이션에서 색상을 추출하는 함수
// getGradientColor(데이터 값, CanvasGrad의 context)
function getGradientColor(percent, ctxGrad) {

    const offset = 5; // 삼각형 크기 절반
    const canvasHeight = ctxGrad.canvas.height;
    const legendHeight = canvasHeight - offset * 2; // 실제 색상이 그려진 영역의 높이

    // percent(0~100)를 실제 픽셀 좌표(0~legendHeight)로 변환
    const scaledY = percent * (legendHeight / 100);

    // offset을 더해 실제 캔버스 상의 y좌표를 계산하고, 범위를 제한함 (투명 영역 방지)
    const y = Math.max(offset, Math.min(canvasHeight - offset - 1, scaledY + offset));

    const pixel = ctxGrad.getImageData(0, y, 1, 1).data;
    return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

}

// 범례에 맞춰 화면에 출력
// showFeatures(데이터, 범례, 데이터 뿌릴 div)
function showFeatures(features, legend, container) {

    const ctxGrad = legend.querySelector('.canvasGrad').getContext('2d')


    features.forEach(val => {
        const div = document.createElement('div');
        div.className = 'feature-item';
        div.textContent = val;

        // 이 아이템이 속한 범례 
        div.dataset.targetLegend = legend.id;

        div.style.backgroundColor = getGradientColor(val, ctxGrad);

        container.appendChild(div);
    });

}

// 선택한 데이터의 범례 위치 알려주기
function showMark(el) {

    const canvasGrad = el.querySelector('.canvasGrad')
    if (!canvasGrad) return;

    // create 마커 canvas
    const canvasMark = document.createElement('canvas')
    canvasMark.width = 10;
    canvasMark.height = canvasGrad.height;
    canvasMark.classList.add('canvasMark')
    const ctxMark = canvasMark.getContext('2d')
    el.appendChild(canvasMark)

    document.addEventListener('click', e => {
        const choice = e.target.closest('.feature-item');
        if (!choice) return;

        if(choice.dataset.targetLegend !== el.id) return; // 클릭이벤트가 속한 범례와 showMark가 진행되는 범례가 동일한지 체크

        // 이전 마커를 지우고 새로 그립니다.
        ctxMark.clearRect(0, 0, canvasMark.width, canvasMark.height);

        const size = canvasMark.width / 2; // 마커 삼각형 크기 절반
        const offset = 5; // 그라데이션 시작 여백 (createGradientLegend와 일치해야 함)
        const legendHeight = canvasGrad.height - offset * 2;

        // 데이터 값(0~100)을 높이 비율에 맞춰 좌표로 변환
        const y = (Number(choice.textContent) * (legendHeight / 100)) + offset;

        ctxMark.fillStyle = 'black';
        ctxMark.beginPath();

        // 마커 → ▶ (y 좌표를 중심으로 삼각형 그림)
        ctxMark.moveTo(0, y - size);                 // 왼쪽 위
        ctxMark.lineTo(0, y + size);                 // 왼쪽 아래
        ctxMark.lineTo(canvasMark.width, y);         // 오른쪽 끝 꼭지점
        ctxMark.fill();

    });
}

// HTML의 data-* 속성을 읽어 자동으로 범례를 생성하는 로직
window.addEventListener('DOMContentLoaded', () => {
    const legends = document.querySelectorAll('.legendContainer');
    legends.forEach(el => {
        const min = el.dataset.min || 0;
        const max = el.dataset.max || 100;
        const width = parseInt(el.dataset.width) || 30;
        const height = parseInt(el.dataset.height) || 100;
        const colors = el.dataset.colors ? el.dataset.colors.split(',').map(c => c.trim()) : ['#fff', '#000'];

        // 범례 생성
        createGradientLegend(el, min, max, width, height, ...colors);

        // data-mark="true" 설정이 있으면 마커 기능도 활성화
        if (el.dataset.mark === 'true') showMark(el);

    });
});
