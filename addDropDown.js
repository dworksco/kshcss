const addDropDownContainer = document.querySelector('#addDropDownContainer')
const addDropDownMenu = addDropDownContainer.querySelector('.drop-down-menu')
const addDropDownButton = document.querySelector('#addDropDownButton')
const fileInput = document.querySelector('#fileInput')
const uploadBtn = document.querySelector('#uploadBtn')

// click add drop down button
function clickAddBtn() {
    addDropDownButton.addEventListener('click', e => {
        addDropDownMenu.classList.toggle('show')
    })
}

// upload file from computer 기능 구현
function uploadFiles() {
    addDropDownMenu.addEventListener('click', e => {
        const item = e.target.closest('.drop-down-list')

        if (item === uploadBtn) {
            fileInput.click();
        }
    })
}

// select file in file system
function selectFiles() {

    fileInput.addEventListener('change', e => {
    const selectedFiles = e.target.files
    Array.from(selectedFiles).forEach(file => {

        // create file button
        const uploadedFile = document.createElement('button');
        uploadedFile.classList = 'btn btn-sm'
        uploadedFile.innerHTML = `<div>${file.name}</div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                        <path fill="currentColor"
                                        d="M7.616 20q-.672 0-1.144-.472T6 18.385V6H5V5h4v-.77h6V5h4v1h-1v12.385q0 .69-.462 1.153T16.384 20zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.23 0 .423-.192t.192-.424zM9.808 17h1V8h-1zm3.384 0h1V8h-1zM7 6v13z" />
                                        </svg>`
        addDropDownContainer.append(uploadedFile)

        const deleteSvg = uploadedFile.querySelector('svg')
        // delete file button
        deleteSvg.addEventListener('click', e => {
            uploadedFile.remove();
        })
    })

    // 2.fold drop down button Menu
    addDropDownMenu.classList.remove('show')
})

}


export function initAddDropBtn() {
    clickAddBtn()
    uploadFiles()
    selectFiles()
}