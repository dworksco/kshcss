
const searchInput = document.getElementById('searchInput');
const items = document.querySelectorAll('.search-item');
const stars = document.querySelectorAll('.star')

// Text Search Function
export function searchByText() {

    searchInput.addEventListener('input', (e) => {
        const filter = e.target.value.toLowerCase(); // 입력값을 소문자로 변환

        items.forEach(item => {
            const text = item.textContent.toLowerCase();

            // 3. 텍스트 포함 여부 확인
            if (text.includes(filter)) {
                item.style.display = ""; // 보임
            } else {
                item.style.display = "none"; // 숨김
            }
        });
    });

}


// click 즐겨찾기 button 
export function clickStarBtn() {

    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            const nowStar = e.currentTarget;
            star.classList.toggle('active');

            const starText = nowStar.querySelector('.star-text')
            starText.textContent = nowStar.classList.contains('active') ? 'starred' : 'star';
        })
    })

}

