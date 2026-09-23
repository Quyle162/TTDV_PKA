document.addEventListener('DOMContentLoaded', function() {
    
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        alert('Bạn phải đăng nhập để truy cập trang này!');
        window.location.href = '../index.html';
    }

    const chamCongButton = document.getElementById('cham-cong-button');
    if (chamCongButton) {
        chamCongButton.addEventListener('click', function() {
            window.location.href = 'Chamcong.html'; 
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            const confirmLogout = confirm('Bạn có chắc chắn muốn đăng xuất?');
            if (confirmLogout) {
                localStorage.removeItem('loggedInUser');
                window.location.href = '../index.html';
            }
        });
    }
});