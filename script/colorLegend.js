export default class ColorLegend {

    container = null;
    config = null;

    gradientCanvas = null;
    gradientCtx = null;
    markerCanvas = null;
    markerCtx = null;
    tooltip = null;

    // 인스턴스를 저장하는 정적 맵 (ID를 키로 사용)
    static instances = new Map();

    constructor(container) {
        this.container = container;

        // 이미 초기화된 요소는 건너뛰기
        if (this.container.dataset.clInitialized) {
            return;
        }

        const labels = container.dataset.labels ? container.dataset.labels.split(',').map(label => label.trim()) : ['0', '100']
        const markerSize = parseInt(container.dataset.markerSize) || parseInt(container.dataset.markersize) || 10;

        // 1. 설정값 중앙 관리
        const orientation = container.dataset.orientation || (container.classList.contains('horizontal') ? 'horizontal' : 'vertical');

        this.config = {
            isVert: orientation === "vertical",
            width: parseInt(container.dataset.width) || 30,
            height: parseInt(container.dataset.height) || 100,
            colors: container.dataset.colors ? container.dataset.colors.split(',').map(c => c.trim()) : ['#fff', '#000'],
            markerSize: markerSize,
            offset: markerSize / 2, // marker가 잘리지 않게 여백 계산용
            labels: labels,
            min: parseFloat(labels[0]),
            max: parseFloat(labels[labels.length - 1]),
        };

        this._init();

        // 초기화 완료 플래그
        this.container.dataset.clInitialized = 'true';

        // 인스턴스 저장 (ID가 있을 경우)
        if (this.container.id) {
            ColorLegend.instances.set(this.container.id, this);
        }
    }

    _init() {
        this._createGradientCanvas();
        this._createLabels();
        this._createTooltip();

        // data-mark="true"면 마커 기능 활성화
        if (this.container.dataset.mark === 'true') {
            this._enableMarker();
        }

        // 범례 클릭 시 해당되는 데이터 추출
        this.container.addEventListener('click', (e) => {
            const { isVert } = this.config;
            let value;

            // 클릭 위치로 데이터 값 찾기
            if (isVert) {
                value = this._getValue(e.offsetY)
            } else {
                value = this._getValue(e.offsetX)
            }

            // 마커 실행(이벤트 표시용)
            this._updateMarker(value)

            const data = document.querySelectorAll('.cl-feature-item')
            data.forEach(div => {
                // 해당 범례이고 div.textContent == value인 데이터div 찾기
                if (div.dataset.targetLegend == this.container.id && div.textContent == value) {
                    div.classList.add('selected') // 스타일 적용
                }
            });
        })

        // 범례 위로 마우스 올릴 시 tooltip 활성화
        this.container.addEventListener('mousemove', (e) => {
            if (!e.target.classList.contains('cl-gradient')) return;

            const { isVert } = this.config;
            let value;

            // 클릭 위치로 데이터 값 찾기
            if (isVert) {
                value = this._getValue(e.offsetY)
            } else {
                value = this._getValue(e.offsetX)
            }

            this.tooltip.style.display = '';
            this.tooltip.textContent = value;
            this.tooltip.style.left = `${e.clientX - 15}px`
            this.tooltip.style.top = `${e.clientY + 15}px`


        })

        // tootip 비활성화
        this.container.addEventListener('mouseleave', (e) => {
            this.tooltip.style.display = 'none';
        })
    }

    // 데이터가 범례에서 위치하는 좌표 표출
    _getPosition(value) {
        const { isVert, min, max, width, height, offset } = this.config;

        // 범위를 정규화
        const ratio = (value - min) / (max - min);
        const mainDim = isVert ? height : width;
        return (ratio * mainDim) + offset
    }

    // 범례 위치가 가지는 데이터 표출
    _getValue(position) {
        const { isVert, min, max, width, height, offset } = this.config;


        const mainDim = isVert ? height : width;
        const ratio = (position - offset) / mainDim;
        const result = Math.round((ratio * (max - min)) + min);
        return Math.min(max,Math.max(min,result));
    }

    // 그라데이션 캔버스 생성 및 그리기
    _createGradientCanvas() {
        const { isVert, width, height, offset, colors } = this.config;

        this.gradientCanvas = document.createElement('canvas');
        this.gradientCanvas.classList.add('cl-gradient');
        this.gradientCtx = this.gradientCanvas.getContext('2d', { willReadFrequently: true });

        // 가로/세로 모드 반영
        let grad = null;
        if (isVert) {

            this.gradientCanvas.width = width;
            this.gradientCanvas.height = height + offset * 2;
            grad = this.gradientCtx.createLinearGradient(0, offset, 0, height + offset);

        } else {

            this.gradientCanvas.width = width + offset * 2;
            this.gradientCanvas.height = height
            grad = this.gradientCtx.createLinearGradient(offset, 0, width + offset, 0)

        }

        colors.forEach((color, index) => {
            grad.addColorStop(index * (1 / (colors.length - 1)), color);
        });

        this.gradientCtx.fillStyle = grad;
        if (isVert) {
            this.gradientCtx.fillRect(0, offset, width, height);
        } else {
            this.gradientCtx.fillRect(offset, 0, width, height);
        }
        this.container.appendChild(this.gradientCanvas);
    }

    // 라벨(Min/Max) 생성
    _createLabels() {
        const { isVert, width, height, offset, labels } = this.config;

        const labelContainer = document.createElement('div');
        labelContainer.classList.add('cl-label');
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
            labelEl.classList.add('cl-label-el');
            labelContainer.appendChild(labelEl);
        })

        this.container.appendChild(labelContainer);

        // ColorLegend 객체에 업데이트
        this.labelContainer = labelContainer;
    }

    // tooltip 생성
    _createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.classList.add('cl-tooltip');
        // this.tooltip.style.display = 'none';

        document.body.appendChild(this.tooltip);
    }

    // 마커 기능 활성화 및 이벤트 바인딩
    _enableMarker() {
        const { isVert, width, height, offset, markerSize } = this.config;

        this.markerCanvas = document.createElement('canvas');
        // 가로/세로 모드 반영
        if (isVert) {

            this.markerCanvas.width = markerSize;
            this.markerCanvas.height = height + offset * 2;

        } else {

            this.markerCanvas.width = width + offset * 2;
            this.markerCanvas.height = markerSize

        }
        this.markerCanvas.classList.add('cl-marker');
        this.markerCtx = this.markerCanvas.getContext('2d');
        this.container.appendChild(this.markerCanvas);
    }

    // 수치에 해당하는 색상 추출 (캔버스 활용)
    _getColor(value) {
        const { isVert, offset } = this.config;

        let pixel = null;
        const position = this._getPosition(value)
        if (isVert) {

            // 캔버스 범위 내로 y좌표 제한
            const y = Math.max(offset, Math.min(this.gradientCanvas.height - offset - 1, position));
            pixel = this.gradientCtx.getImageData(0, y, 1, 1).data;

        } else {

            const x = Math.max(offset, Math.min(this.gradientCanvas.width - offset - 1, position));
            pixel = this.gradientCtx.getImageData(x, 0, 1, 1).data;

        }

        return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    }

    // 마커(화살표) 위치 업데이트
    _updateMarker(value) {
        if (!this.markerCtx) return;

        const { isVert, offset, markerSize } = this.config;
        const size = markerSize / 2;
        const position = this._getPosition(value);


        if (isVert) {

            this.markerCtx.clearRect(0, 0, markerSize, this.markerCanvas.height);
            this.markerCtx.beginPath();
            this.markerCtx.moveTo(0, position - size);
            this.markerCtx.lineTo(0, position + size);
            this.markerCtx.lineTo(markerSize, position);

        } else {

            this.markerCtx.clearRect(0, 0, this.markerCanvas.width, markerSize);
            this.markerCtx.beginPath();
            this.markerCtx.moveTo(position - size, 0);
            this.markerCtx.lineTo(position + size, 0);
            this.markerCtx.lineTo(position, this.markerCanvas.height);

        }
        this.markerCtx.fillStyle = 'black';
        this.markerCtx.fill();
    }

    // 데이터 범위로 라벨 업데이트
    _updateLabel(items) {

        // 데이터 정렬 후 최대최소 뽑기
        const defineItems = items.map(item => String(item).padStart(2, '0')).sort().map(i => Number(i));
        
        // this.config.labels/min/max 재 설정
        this.config.min = defineItems[0];
        this.config.max = defineItems[defineItems.length - 1];
        this.config.labels = [this.config.min, this.config.max];


        // cl-container 초기화
        const containerChild = Array.from(this.container.children)
        containerChild.forEach(el => el.remove())
        console.log(containerChild)

        // cl-container 재생성
        this._init()
        
    }

    // 데이터를 받아서 화면(container)에 표시
    render(items, targetContainer) {
        // fragment 사용하여 렌더링 성능 향상
        const fragment = document.createDocumentFragment()
        items.forEach(val => {
            const div = document.createElement('div');
            div.className = 'cl-feature-item';
            div.textContent = val;
            div.dataset.targetLegend = this.container.id; // 범례와 연결

            // 자신의 _getColor 메서드 활용
            div.style.backgroundColor = this._getColor(val);

            // 아이템 클릭 시 해당 범례의 마커 업데이트
            div.addEventListener('click', () => {
                this._updateMarker(val);
            });

            fragment.appendChild(div)
        });
        targetContainer.appendChild(fragment);

        // 라벨 업데이트(따로 지정한 라벨이 없다면)
        if(!this.container.dataset.labels){ this._updateLabel(items) }

    }

    // 페이지 내의 지정된 클래스를 가진 모든 요소를 찾아 인스턴스화
    static initAll(selector = '.cl-container') {
        const legends = document.querySelectorAll(selector);
        const instances = [];
        legends.forEach(el => {
            instances.push(new ColorLegend(el));
        });
        return instances;
    }

    // ID로 특정 인스턴스 가져오기
    static getById(id) {
        return ColorLegend.instances.get(id);
    }


}

// 브라우저 환경인 경우 전역에 노출 및 자동 초기화
if (typeof window !== 'undefined') {
    window.ColorLegend = ColorLegend;

    // DOM이 로드되면 자동으로 범례 초기화
    window.addEventListener('DOMContentLoaded', () => {
        ColorLegend.initAll();
    });
}
