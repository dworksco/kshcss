const map = document.querySelector('#cesiumContainer');
const widget = document.querySelectorAll('.overlay');
const widgetHeader = document.querySelector('.widget-header')

// widget 초기 위치 설정
function setInitialWidgetPosition() {
    const rect = map.getBoundingClientRect();

    widget.forEach(widget => {
        widget.style.top = `${rect.top + 32}px`;
        widget.style.left = `${rect.left + 16}px`;
    })
}

// 창 변경사항에 따라 초기위치 설정
window.addEventListener('load', setInitialWidgetPosition);
window.addEventListener('resize', setInitialWidgetPosition);

const widgetToggleBtn = document.querySelectorAll('.widget-toggle-btn')
// click widget toggle btn
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

let isDragging = false;
let offsetX = 0;
let offsetY = 0;
const widgetPannel = document.querySelector('.widget-pannel')

// drag widget
widgetHeader.addEventListener('mousedown', e => {
    // 닫기 버튼을 눌렀을 때는 드래그 X
    if (e.currentTarget.closest('.btn-close')) return;

    isDragging = true;

    const rect = widgetPannel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    document.body.style.userSelect = 'none';
})

document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    // 화면 밖으로 너무 나가지 않게 제한
    const maxLeft = window.innerWidth - widgetPannel.offsetWidth;
    const maxTop = window.innerHeight - widgetPannel.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    widgetPannel.style.left = `${newLeft}px`
    widgetPannel.style.top = `${newTop}px`

})

document.addEventListener('mouseup', e => {
    isDragging = false;
    document.body.style.userSelect = '';
})
