class ColorLegend {
    constructor(el) {
        this.el = el;

        const labels = el.dataset.labels ? el.dataset.labels.split(',').map(label => label.trim()) : ['0', '100']

        // 1. 설정값 중앙 관리
        this.config = {
            isVert: (el.dataset.orientation || "vertical") === "vertical",
            width: parseInt(el.dataset.width) || 30,
            height: parseInt(el.dataset.height) || 100,
            colors: el.dataset.colors ? el.dataset.colors.split(',').map(c => c.trim()) : ['#fff', '#000'],
            offset: 5, // 마커 및 여백 상수     
            labels: labels,
            min: parseFloat(labels[0]),
            max: parseFloat(labels[labels.length - 1])
        };

        // 2. 인스턴스 변수 초기화
        this.canvasGrad = null;
        this.ctxGrad = null;
        this.canvasMark = null;
        this.ctxMark = null;

        this._init();
    }

    _init() {
        this._createGradientCanvas();
        this._createLabels();

        // data-mark="true"면 마커 기능 활성화
        if (this.el.dataset.mark === 'true') {
            this._enableMarker();
        }
    }

    _getPosition(value) {
        const { isVert, min, max, width, height, offset } = this.config;
        
        // 범위를 0~100으로 정규화
        const ratio = (value - min) / (max - min);
        const mainDim = isVert ? height : width;
        return (ratio * mainDim) + offset
    }

    // 그라데이션 캔버스 생성 및 그리기
    _createGradientCanvas() {
        const { isVert, width, height, offset, colors } = this.config;

        this.canvasGrad = document.createElement('canvas');
        this.canvasGrad.classList.add('canvasGrad');
        this.ctxGrad = this.canvasGrad.getContext('2d', { willReadFrequently: true });

        // 가로/세로 모드 반영
        let grad = null;
        if (isVert) {

            this.canvasGrad.width = width;
            this.canvasGrad.height = height + offset * 2;
            grad = this.ctxGrad.createLinearGradient(0, offset, 0, height + offset);

        } else {

            this.canvasGrad.width = width + offset * 2;
            this.canvasGrad.height = height
            grad = this.ctxGrad.createLinearGradient(offset, 0, width + offset, 0)

        }


        colors.forEach((color, index) => {
            grad.addColorStop(index * (1 / (colors.length - 1)), color);
        });


        this.ctxGrad.fillStyle = grad;
        if (isVert) {
            this.ctxGrad.fillRect(0, offset, width, height);
        } else {
            this.ctxGrad.fillRect(offset, 0, width, height);
        }
        this.el.appendChild(this.canvasGrad);
    }

    // 라벨(Min/Max) 생성
    _createLabels() {
        const { isVert, width, height, offset, labels } = this.config;

        const labelContainer = document.createElement('div');
        labelContainer.classList.add('legendLabel');
        // 가로/세로 모드 반영
        if (isVert) {

            labelContainer.classList.add('vertical')
            labelContainer.style.height = `${height + offset * 2}px`;
            labelContainer.style.padding = `${offset}px 0`;

        } else {

            labelContainer.classList.add('horizontal');
            labelContainer.style.width = `${width + offset * 2}px`;
            labelContainer.style.padding = `0 ${offset}px`;

        }

        labels.forEach(label => {
            const labelEl = document.createElement('div');
            labelEl.textContent = label;
            labelContainer.appendChild(labelEl);
        })

        this.el.appendChild(labelContainer);
    }

    // 마커 기능 활성화 및 이벤트 바인딩
    _enableMarker() {
        const { isVert, width, height, offset } = this.config;

        this.canvasMark = document.createElement('canvas');
        // 가로/세로 모드 반영
        if (isVert) {

            this.canvasMark.width = 10;
            this.canvasMark.height = height + offset * 2;

        } else {

            this.canvasMark.width = width + offset * 2;
            this.canvasMark.height = 10
        }
        this.canvasMark.classList.add('canvasMark');
        this.ctxMark = this.canvasMark.getContext('2d');
        this.el.appendChild(this.canvasMark);


    }

    // 수치에 해당하는 색상 추출 (캔버스 활용)
    getColor(value) {
        const { isVert, offset } = this.config;


        let pixel = null;
        const position = this._getPosition(value)
        if (isVert) {

            // 캔버스 범위 내로 y좌표 제한
            const y = Math.max(offset, Math.min(this.canvasGrad.height - offset - 1, position));
            pixel = this.ctxGrad.getImageData(0, y, 1, 1).data;

        } else {

            const x = Math.max(offset, Math.min(this.canvasGrad.width - offset - 1, position));
            pixel = this.ctxGrad.getImageData(x, 0, 1, 1).data;

        }

        return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    }

    // 마커(화살표) 위치 업데이트
    updateMarker(value) {
        if (!this.ctxMark) return;

        const markerSize = 10;
        const size = markerSize / 2;
        const { isVert, offset } = this.config;
        const position = this._getPosition(value);


        if (isVert) {
            
            this.ctxMark.clearRect(0, 0, markerSize, this.canvasMark.height);
            this.ctxMark.beginPath();
            this.ctxMark.moveTo(0, position - size);
            this.ctxMark.lineTo(0, position + size);
            this.ctxMark.lineTo(markerSize, position);
            
        } else {
            
            this.ctxMark.clearRect(0, 0, this.canvasMark.width, markerSize);
            this.ctxMark.beginPath();
            this.ctxMark.moveTo(position - size, 0);
            this.ctxMark.lineTo(position + size, 0);
            this.ctxMark.lineTo(position, this.canvasMark.height);
            
        }
        this.ctxMark.fillStyle = 'black';
        this.ctxMark.fill();
    }

    // 데이터를 받아서 화면(container)에 표시
    showFeatures(features, container) {
        // fragement 사용하여 렌더링 성능 향상
        const fragment = document.createDocumentFragment()
        features.forEach(val => {
            const div = document.createElement('div');
            div.className = 'feature-item';
            div.textContent = val;
            div.dataset.targetLegend = this.el.id; // 범례와 연결

            // 자신의getColor 메서드 활용
            div.style.backgroundColor = this.getColor(val);
            fragment.appendChild(div)
        });
        container.appendChild(fragment);
    }
}

// 자동 초기화 및 인스턴스 관리
window.addEventListener('DOMContentLoaded', () => {
    const legends = document.querySelectorAll('.legendContainer');
    window.colorLegends = {}; // 전역 저장소 (필요 시 접근 가능)

    legends.forEach(el => {
        if (el.id) {
            window.colorLegends[el.id] = new ColorLegend(el);
        }
    });

    // 이벤트 리스너 등록
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.feature-item');
        if (!item) return;

        const targetId = item.dataset.targetLegend;
        const instance = window.colorLegends[targetId]

        instance.updateMarker(parseFloat(item.textContent));
    });
});

// 하위 호환성을 위한 헬퍼 함수 (기존 HTML script 태그에서 호출하는 경우 대비)
function showFeatures(features, legendEl, containerEl) {
    const instance = window.colorLegends[legendEl.id];
    if (instance) {
        instance.showFeatures(features, containerEl);
    } else {
        console.warn(`ID가 ${legendEl.id}인 ColorLegend 인스턴스를 찾을 수 없습니다.`);
    }
}
