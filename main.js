import { initDropDown } from "./dropDown.js";
import { initAddDropBtn } from "./addDropDown.js";
import { initSearch } from "./searchInput.js";
import { setInitialWidgetPosition, initWidget } from "./widget.js";


window.addEventListener('DOMContentLoaded', () => {
    
    // 창 변경사항에 따라 초기위치 설정
    window.addEventListener('load', setInitialWidgetPosition);
    // window.addEventListener('resize', setInitialWidgetPosition);

    initSearch()
    initDropDown()
    initAddDropBtn()
    initWidget()

})
