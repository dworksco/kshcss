const map = document.querySelector('#cesiumContainer');
const widget = document.querySelectorAll('.overlay');
const widgetHeader = document.querySelector('.widget-header')
const widgetToggleBtn = document.querySelectorAll('.widget-toggle-btn')

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

const widgetPanel = document.querySelector('.widget-panel')
const closeBtn = document.querySelectorAll('.btn-close')

// widget 초기 위치 설정
export function setInitialWidgetPosition() {
    const rect = map.getBoundingClientRect();

    widget.forEach(widget => {
        widget.style.top = `${rect.top + 32}px`;
        widget.style.left = `${rect.left + 16}px`;
    })
}

// click widget toggle btn
export function clickWidgetToggleBtn() {

    widgetToggleBtn.forEach(btn => {
        btn.addEventListener('click', e => {
            const toggle = e.currentTarget.closest('.overlay')
            const widget = toggle.previousElementSibling

            toggle.classList.remove('visible')
            toggle.classList.add('hidden')

            widget.classList.remove('hidden')
            widget.classList.add('visible')
        })
    })

}

// drag widget
export function dragWidget() {

    widgetHeader.addEventListener('mousedown', e => {
        // 닫기 버튼을 눌렀을 때는 드래그 X
        if (e.target.closest('.btn-close')) return;

        isDragging = true;

        const rect = widgetPanel.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        document.body.style.userSelect = 'none';
    })

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;

        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        // 화면 밖으로 너무 나가지 않게 제한
        const maxLeft = window.innerWidth - widgetPanel.offsetWidth;
        const maxTop = window.innerHeight - widgetPanel.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        widgetPanel.style.left = `${newLeft}px`
        widgetPanel.style.top = `${newTop}px`

    })

    document.addEventListener('mouseup', e => {
        isDragging = false;
        document.body.style.userSelect = '';
    })
}

// click close button
export function clickCloseBtn() {

    closeBtn.forEach(btn => {
        btn.addEventListener('click', e => {
            const widget = e.currentTarget.closest('.overlay')
            const widgetToggleBtn = document.querySelector('.widget-toggle-btn')
            widget.classList.remove('visible');
            widget.classList.add('hidden');

            widgetToggleBtn.classList.remove('hidden');
            widgetToggleBtn.classList.add('visible');

        })
    });

}


