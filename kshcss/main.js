import { initDropDown } from "./script/dropDown.js";
import { initAddDropBtn } from "./script/addDropDown.js";
import { initSearch } from "./script/searchInput.js";
import { setInitialWidgetPosition, initWidget } from "./script/widget.js";


window.addEventListener('DOMContentLoaded', () => {
    
    // 창 변경사항에 따라 초기위치 설정
    window.addEventListener('load', setInitialWidgetPosition);
    // window.addEventListener('resize', setInitialWidgetPosition);

    initSearch()
    initDropDown()
    initAddDropBtn()
    initWidget()

})
