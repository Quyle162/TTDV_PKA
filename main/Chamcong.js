document.addEventListener('DOMContentLoaded', () => {
  
    const loggedInUser = localStorage.getItem('loggedInUser');

    if (!loggedInUser || loggedInUser.trim() === '' || loggedInUser === 'Khách') {
        alert('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục!');
        window.location.href = '../index.html'; 
        return; 
    }

    const $ = (id) => document.getElementById(id);
    const currentUserSpan = $('current-user');
    const checkInBtn = $('check-in-btn');
    const checkOutBtn = $('check-out-btn');
    const statusMessage = $('status-message');
    const shiftSelect = $('shift-select');
    const logTableBody = document.querySelector('#log-table tbody');
    
    currentUserSpan.textContent = loggedInUser;
    const shiftMapping = {
        "TN-S1": "Sáng 3Sao-Cơm",
        "TN-S2": "Sáng 3Sao-Bánh mì",
        "TN-Tr1": "Trưa 3Sao",
        "TN-Tr2": "Trưa D6",
        "PV": "Trưa T2D6",
        "TN-C": "Chiều",
        "TN-T": "Tối",
        "PV-TC": "Tăng Cường"
    };

    const shiftStartTimes = {
        "TN-S1": "06:00",
        "TN-S2": "06:00",
        "TN-Tr1": "10:00",
        "TN-Tr2": "10:00",
        "PV": "10:00",
        "TN-C": "13:00",
        "TN-T": "17:00",
        "PV-TC": "" 
    };

    const CONFIG = {
        GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby4Be4x95MlYuwItEbrWN_SLPMxwwj8dSsHftD2bSKd2mMFpS7a08fJFS4i55F212UW/exec',
        LOCATIONS: [
            { name: "D6", lat: 20.962632250215897, lon: 105.74876993308236, radius: 50 },
            { name: "3Sao", lat: 20.960579771367236, lon: 105.74848140331994, radius: 50 }
        ],
        DEVICE_COOLDOWN: 3600000
    };
    
    const userTimeLogKey = `timeLog_${loggedInUser}`;
    let timeLog = JSON.parse(localStorage.getItem(userTimeLogKey)) || [];

    const saveLog = () => localStorage.setItem(userTimeLogKey, JSON.stringify(timeLog));
    
    const showStatus = (msg, color) => {
        statusMessage.textContent = msg;
        statusMessage.style.color = color;
    };

    function isValidCheckInTime(shiftCode) {
        const startTimeStr = shiftStartTimes[shiftCode];
        if (!startTimeStr) return true; 

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = startTimeStr.split(':').map(Number);
        const startMinutes = startH * 60 + startM;

        const diffMinutes = Math.abs(currentMinutes - startMinutes);
        return diffMinutes <= 120; 
    }

    function validateShiftSelection() {
        const selectedShift = shiftSelect.value;

        if (!isValidCheckInTime(selectedShift)) {
            checkInBtn.disabled = true; 
            checkInBtn.style.opacity = 0.5;
            const friendlyShiftName = shiftMapping[selectedShift] || selectedShift;
            showStatus(`Quá giờ Check-in ca: ${friendlyShiftName}` + ' rồi bro', '#e74c3c');
        } else {
            checkInBtn.disabled = false; 
            checkInBtn.style.opacity = 1;
            showStatus('', 'black'); 
        }
    }

    function updateButtonStates() {
        const last = timeLog.at(-1);
        const isCheckedIn = last?.status === 'Check In';
        
        checkOutBtn.disabled = !isCheckedIn;
        checkOutBtn.style.opacity = !isCheckedIn ? 0.5 : 1;
        
        shiftSelect.disabled = isCheckedIn;
        
        if (isCheckedIn) {
            checkInBtn.disabled = true;
            checkInBtn.style.opacity = 0.5;
            if (last?.shift) shiftSelect.value = last.shift;
            showStatus('', 'black'); 
        } else {
            validateShiftSelection();
        }
    }

    shiftSelect.addEventListener('change', () => {
        const last = timeLog.at(-1);
        if (last?.status !== 'Check In') {
            validateShiftSelection();
        }
    });

    function renderLog() {
        logTableBody.innerHTML = timeLog.slice().reverse().map(log => {
            const friendlyShiftName = shiftMapping[log.shift] || log.shift || 'Không rõ';
            return `<tr>
                <td style="color:${log.status === 'Check In' ? '#2ecc71' : '#e74c3c'}"><b>${log.status}</b></td>
                <td>${friendlyShiftName}</td>
                <td>${log.timeDisplay}</td>
            </tr>`;
        }).join("");
    }

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const r = Math.PI / 180;
        const φ1 = lat1 * r, φ2 = lat2 * r;
        const Δφ = (lat2 - lat1) * r, Δλ = (lon2 - lon1) * r;
        const a = Math.sin(Δφ / 2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    function getLocationStatus(lat, lon) {
        for (const loc of CONFIG.LOCATIONS) {
            if (getDistance(loc.lat, loc.lon, lat, lon) <= loc.radius) return loc.name;
        }
        return null;
    }
    // bắn sang gg sheet
    async function logToGoogleSheet(status, locationName, button) {
        showStatus('Đang xử lý dữ liệu...', '#3498db');
        button.disabled = true;

        const now = new Date();
        const selectedShift = shiftSelect.value;

        const result = {
            username: loggedInUser,
            status: status,
            shift: selectedShift,
            time: now.toLocaleTimeString('vi-VN'),
            date: now.toLocaleDateString('vi-VN'),
            location: locationName,
            deviceNote: getDeviceWarning(loggedInUser) || ""
        };

        try {
            const res = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(result),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            });

            const json = await res.json();
            if (json.status !== "success") throw new Error(json.message);

            showStatus('Thành công!', '#2ecc71');
            
            timeLog.push({
                user: loggedInUser,
                status,
                shift: selectedShift,
                timeDisplay: now.toLocaleTimeString('vi-VN') + " " + now.toLocaleDateString('vi-VN'),
                timeForCalc: now.toISOString()
            });
            saveLog();
            renderLog();
            updateButtonStates();

            if (status === 'Check In') {
                localStorage.setItem('deviceCheckInLock', JSON.stringify({
                    user: loggedInUser,
                    timestamp: Date.now()
                }));
            }
        } catch (err) {
            showStatus(`Lỗi: ${err.message}`, '#e74c3c');
            button.disabled = false;
        }
    }

    function getDeviceWarning(user) {
        const lock = JSON.parse(localStorage.getItem('deviceCheckInLock'));
        if (!lock || lock.user === user) return null;
        if (Date.now() - lock.timestamp < CONFIG.DEVICE_COOLDOWN) {
            return `Thiết bị đã dùng bởi ${lock.user}`;
        }
        return null;
    }

    function handleCheck(status, button, invalidMsg) {
        const selectedShift = shiftSelect.value;

        if (selectedShift === "PV-TC") {
            logToGoogleSheet(status, "Ca Tăng Cường", button);
            return;
        }

        if (!navigator.geolocation) return alert('Định vị không hỗ trợ trên trình duyệt này!');
        
        showStatus('Kiểm tra vị trí...', '#f39c12');
        navigator.geolocation.getCurrentPosition(
            async pos => {
                const locName = getLocationStatus(pos.coords.latitude, pos.coords.longitude);
                if (!locName) {
                    showStatus(invalidMsg, '#e74c3c');
                    return alert(invalidMsg);
                }
                logToGoogleSheet(status, locName, button);
            },
            () => {
                showStatus('Lỗi định vị!', '#e74c3c');
                alert('Vui lòng cấp quyền bật định vị và load lại trang');
            }
        );
    }

    checkInBtn.addEventListener('click', () => {
        handleCheck("Check In", checkInBtn, 'Bạn đang không ở trong phạm vi cửa hàng (D6/3Sao)');
    });

    checkOutBtn.addEventListener('click', () => {
        handleCheck("Check Out", checkOutBtn, 'Bạn đang không ở trong phạm vi cửa hàng (D6/3Sao)');
    });

    renderLog();
    updateButtonStates();
});