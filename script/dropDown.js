const modeDropDownButton = document.querySelector('#modeDropDownButton')
const modeDropDownContainer = document.querySelector('#modeDropDownContainer')
const modeDropDownMenu = modeDropDownContainer.querySelector('.drop-down-menu')


// list of drop down button's icon path
const modeDropDownButtonIconPaths = modeDropDownButton.querySelectorAll('svg')[0].querySelectorAll('path')

// ask/agent mode drop down button clicked
function clickModeBtn() {

    modeDropDownButton.addEventListener('click', e => {
        modeDropDownMenu.classList.toggle('show')
    })

}

// click drop down list
function clickModeMenu() {

    modeDropDownMenu.addEventListener('click', e => {
        const item = e.target.closest('.drop-down-list')
        if (!item) return;

        // selected text of drop down button list 
        const selectedText = item.querySelector('div').textContent;

        // 1.change drop down button text
        modeDropDownButton.querySelector('div').textContent = selectedText;

        // 2.change drop down button icon
        const isAgent = selectedText === 'Agent';
        modeDropDownButtonIconPaths[0].style.opacity = isAgent ? "0" : "1";
        modeDropDownButtonIconPaths[1].style.opacity = isAgent ? "1" : "0";

        // 3.check icon update
        const modeDropDownList = modeDropDownMenu.querySelectorAll('.drop-down-list')
        // reset all check icon
        modeDropDownList.forEach(li => { li.querySelector('svg:first-child').style.opacity = "0" })
        item.querySelector('svg:first-child').style.opacity = "1";

        // 4. fold drop down menu
        modeDropDownMenu.classList.remove('show')
    })

}

export function initDropDown() {
    clickModeBtn()
    clickModeMenu()
}