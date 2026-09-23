
const measureSpan = document.createElement('span');
measureSpan.style.fontFamily = "'Poppins', sans-serif";
measureSpan.style.fontSize = '1.1rem'; 
measureSpan.style.fontWeight = '300';  
measureSpan.style.position = 'absolute';
measureSpan.style.visibility = 'hidden';
measureSpan.style.whiteSpace = 'pre'; 
document.body.appendChild(measureSpan);

function createExplosion(x, y) {
    const particleCount = 8; 

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('typing-particle');
        document.body.appendChild(particle);

        const size = Math.random() * 5 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        const angle = Math.random() * Math.PI * 2; 
        const distance = 30 + Math.random() * 40; 
        
        const destinationX = x + Math.cos(angle) * distance;
        const destinationY = y + Math.sin(angle) * distance;

        const animation = particle.animate([
            { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 },
            { transform: `translate(${destinationX}px, ${destinationY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 400 + Math.random() * 200, 
            easing: 'cubic-bezier(0, .9, .57, 1)',
            fill: 'forwards'
        });

        animation.onfinish = () => particle.remove();
    }
}

const inputs = document.querySelectorAll('.username input, .password input');
inputs.forEach(input => {
    input.addEventListener('input', (e) => {
        let textToMeasure = input.value;
        if (input.type === 'password') {
            textToMeasure = '•'.repeat(input.value.length);
        }
        measureSpan.textContent = textToMeasure;

        const rect = input.getBoundingClientRect();
        const textWidth = measureSpan.offsetWidth;

        const paddingLeftOffset = 55; 

        const explosionX = rect.left + paddingLeftOffset + textWidth - 50;
        const explosionY = rect.top + (rect.height / 2);
        
        if (input.value.length > 0) {
            createExplosion(explosionX, explosionY);
        }
    });
});

const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
        passwordInput.dispatchEvent(new Event('input'));
    });
}

const loginButton = document.getElementById('login-button');
if (loginButton) {
    loginButton.addEventListener('click', function (e) {
        e.preventDefault();
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        fetch('login/users.txt')
            .then(res => {
                if (!res.ok) throw new Error('Không tìm thấy file users.txt');
                return res.text();
            })
            .then(data => {
                const lines = data.split('\n');
                const found = lines.some(line => {
                    if (!line.includes(',')) return false; 
                    const [user, pass] = line.trim().split(',');
                    return user === username && pass === password;
                });
                
                if (found) {
                    localStorage.setItem('loggedInUser', username);
                    window.location.href = 'Main/Chamcong.html'; 
                } else {
                    alert('Sai tài khoản hoặc mật khẩu!');
                }
            })
            .catch(error => {
                console.error(error);
                alert('Lỗi: ' + error.message);
            });
    });
}