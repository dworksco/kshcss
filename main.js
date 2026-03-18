import { clickModeButton, clickModeMenu } from "./dropDown.js";
import { clickAddButton, uploadFiles, selectFiles } from "./addDropDown.js";
import { searchByText, clickStarBtn } from "./searchInput.js";
import { setInitialWidgetPosition, clickWidgetToggleBtn, dragWidget, clickCloseBtn } from "./widget.js";

clickModeButton()
clickModeMenu()

clickAddButton()
uploadFiles()
selectFiles()

searchByText()
clickStarBtn()

// 창 변경사항에 따라 초기위치 설정
window.addEventListener('load', setInitialWidgetPosition);
// window.addEventListener('resize', setInitialWidgetPosition);

clickCloseBtn()
clickWidgetToggleBtn()
dragWidget()