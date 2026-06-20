// ================= CONFIG FIREBASE (CƠ SỞ DỮ LIỆU) =================
// 🔴 BẠN CẦN LÊN FIREBASE TẠO MỘT DỰ ÁN MIỄN PHÍ VÀ THAY THÔNG TIN THẬT VÀO ĐÂY NHÉ
const firebaseConfig = {
    apiKey: "AIzaSyA...",
    authDomain: "dự-án-của-bạn.firebaseapp.com",
    databaseURL: "https://dự-án-của-bạn-default-rtdb.firebaseio.com/",
    projectId: "dự-án-của-bạn",
    storageBucket: "dự-án-của-bạn.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456:web:abcde"
};

// Khởi tạo Firebase nếu thư viện đã tải thành công
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Biến lưu thông tin người dùng đang đăng nhập hệ thống toàn cục
let currentUsername = "";
let currentUserData = { balance: 0, task1: 0, task2: 0, task3: 0 };
let isAdminLoggedIn = false;

// ================= 🔴 KHU VỰC CẤU HÌNH TOKEN BOT TELEGRAM ADMIN =================
const TELEGRAM_TOKEN = "ĐIỀN_TOKEN_BOT_CỦA_BẠN_VÀO_ĐÂY"; 
const TELEGRAM_CHAT_ID = "ĐIỀN_CHAT_ID_CỦA_BẠN_VÀO_ĐÂY"; 
const GOOGLE_API_URL = "LINK_GOOGLE_APPS_SCRIPT_CỦA_BẠN"; 

let wrongKeyCounter = 0;

// Cấu hình Link mặc định của 3 nhiệm vụ lưu trong LocalStorage
let taskLinks = {
    1: localStorage.getItem('link_task_1') || "https://link4m.com/xxxxx",
    2: localStorage.getItem('link_task_2') || "https://layma.net/xxxxx",
    3: localStorage.getItem('link_task_3') || "https://linktot.pro/xxxxx"
};

// Hàm tự động sinh một mã ngẫu nhiên bảo mật (Ví dụ: CR98F2)
function generateRandomKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'CR'; 
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

if (!localStorage.getItem('key_task_1')) localStorage.setItem('key_task_1', generateRandomKey());
if (!localStorage.getItem('key_task_2')) localStorage.setItem('key_task_2', generateRandomKey());
if (!localStorage.getItem('key_task_3')) localStorage.setItem('key_task_3', generateRandomKey());

// ================= LOGIC ĐĂNG KÝ / ĐĂNG NHẬP ĐÁM MÂY CLOUD =================
function toggleAuthForm(showLogin) {
    document.getElementById('auth-login-form').style.display = showLogin ? 'block' : 'none';
    document.getElementById('auth-register-form').style.display = showLogin ? 'none' : 'block';
}

function handleUserRegister() {
    let user = document.getElementById('authUserReg').value.trim().toLowerCase();
    let pass = document.getElementById('authPassReg').value.trim();
    
    if (user === "" || pass.length < 6) {
        alert("❌ Tên tài khoản không được để trống và mật khẩu phải từ 6 ký tự trở lên!");
        return;
    }
    
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        alert("⚠️ Hệ thống Firebase chưa được cấu hình. Vui lòng kết nối Firebase Config trước!");
        return;
    }

    // Kiểm tra xem tài khoản đã tồn tại trên Firebase chưa
    firebase.database().ref('users/' + user).once('value').then((snapshot) => {
        if (snapshot.exists()) {
            alert("❌ Tên tài khoản này đã có người sử dụng!");
        } else {
            // Tạo cấu trúc tài khoản mới lưu lên database
            firebase.database().ref('users/' + user).set({
                password: CryptoJS.MD5(pass).toString(), // Mã hóa mật khẩu bảo mật MD5
                balance: 0,
                task1: 0,
                task2: 0,
                task3: 0
            }).then(() => {
                alert("🎉 Đăng ký tài khoản thành công! Hãy đăng nhập nhé.");
                toggleAuthForm(true);
            });
        }
    }).catch(err => alert("Lỗi kết nối database: " + err.message));
}

function handleUserLogin() {
    let user = document.getElementById('authUserLogin').value.trim().toLowerCase();
    let pass = document.getElementById('authPassLogin').value.trim();
    
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        alert("⚠️ Hệ thống Firebase chưa được cấu hình!");
        return;
    }

    firebase.database().ref('users/' + user).once('value').then((snapshot) => {
        if (snapshot.exists()) {
            let data = snapshot.val();
            // So khớp mật khẩu băm mã hóa MD5
            if (data.password === CryptoJS.MD5(pass).toString()) {
                currentUsername = user;
                currentUserData = data;
                
                // Ẩn hoàn toàn màn hình khóa đăng nhập
                document.getElementById('user-auth-screen').style.display = 'none';
                alert(`👋 Chào mừng quay trở lại, ${user}!`);
                
                updateTaskDisplay();
            } else {
                alert("❌ Mật khẩu không chính xác!");
            }
        } else {
            alert("❌ Tài khoản không tồn tại trên hệ thống!");
        }
    }).catch(err => alert("Lỗi đăng nhập: " + err.message));
}

function userLogout() {
    currentUsername = "";
    currentUserData = { balance: 0, task1: 0, task2: 0, task3: 0 };
    
    // Hiện lại màn hình khóa đăng nhập
    document.getElementById('user-auth-screen').style.display = 'flex';
    document.getElementById('authUserLogin').value = "";
    document.getElementById('authPassLogin').value = "";
    
    alert("🚪 Bạn đã đăng xuất tài khoản thành công!");
}

function syncDataToFirebase() {
    if (currentUsername && typeof firebase !== 'undefined' && firebase.apps.length) {
        firebase.database().ref('users/' + currentUsername).update({
            balance: currentUserData.balance,
            task1: currentUserData.task1,
            task2: currentUserData.task2,
            task3: currentUserData.task3
        });
    }
}

// ================= HÀM CHẶN GIAN LẬN VÀ KHÓA CỨNG TRANG WEB =================
function reportCheat(reason) {
    if (GOOGLE_API_URL && GOOGLE_API_URL !== "LINK_GOOGLE_APPS_SCRIPT_CỦA_BẠN") {
        fetch(GOOGLE_API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: reason })
        }).catch(err => console.log("Lỗi log bảo mật."));
    }
    
    document.body.innerHTML = `
        <div style="color: #e74c3c; text-align:center; padding: 120px 20px; font-family: sans-serif; background:#0f141c; height:100vh; width:100vw; position:fixed; top:0; left:0; z-index:999999;">
            <h1 style="font-size: 38px; margin-bottom: 20px;">🛑 KẾT NỐI BỊ ĐÓNG BĂNG</h1>
            <p style="color: #8b949e; font-size: 16px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                Hệ thống bảo mật phát hiện hành vi gian lận (Auto-click/Spam mã/Sửa số dư hiển thị). 
                Hồ sơ vi phạm của bạn đã được mã hóa gửi trực tiếp về Ban quản trị hệ thống.
            </p>
        </div>
    `;
}

// BẪY HACK 1: CHỐNG INSPECT ELEMENT SỬA SỐ DƯ HIỂN THỊ (Quét mỗi 2 giây)
setInterval(function() {
    const displayBalance = document.getElementById('user-balance');
    if (displayBalance && displayBalance.offsetParent !== null && currentUsername !== "") {
        let cleanText = displayBalance.innerText.replace(/[^0-9]/g, '');
        let textVal = cleanText === "" ? 0 : parseInt(cleanText);
        
        if (!isNaN(textVal) && textVal !== currentUserData.balance) {
            reportCheat("Cố tình sửa đổi giá trị số dư hiển thị (Inspect Element)");
        }
    }
}, 2000);

// Khóa chuột phải và phím F12 để tăng cường bảo mật
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if (e.keyCode == 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'C'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || 
        (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
        return false;
    }
};

// ================= LOGIC ĐIỀU HƯỚNG CÁC TAB =================
function showSection(sectionId) {
    const sections = ['home', 'tasks', 'withdraw', 'admin'];
    sections.forEach(sec => {
        const el = document.getElementById(`page-${sec}`);
        if (el) el.style.display = 'none';
        
        const menuEl = document.getElementById(`menu-${sec}`);
        if (menuEl) menuEl.classList.remove('active');
    });
    
    const activePage = document.getElementById(`page-${sectionId}`);
    if (activePage) activePage.style.display = 'block';
    
    const activeMenu = document.getElementById(`menu-${sectionId}`);
    if (activeMenu) activeMenu.classList.add('active');
    
    window.scrollTo(0, 0);

    if (sectionId === 'admin') {
        const loginForm = document.getElementById('admin-login-form');
        const mainContent = document.getElementById('admin-main-content');
        
        if (isAdminLoggedIn) {
            if (loginForm) loginForm.style.display = 'none';
            if (mainContent) mainContent.style.display = 'block';
        } else {
            if (loginForm) loginForm.style.display = 'block';
            if (mainContent) mainContent.style.display = 'none';
        }
    }

    updateTaskDisplay();
}

// ================= HÀM XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT ADMIN BẢO MẬT MD5 =================
function checkAdminLogin() {
    const passwordInput = document.getElementById('adminPasswordInput');
    if (!passwordInput) return;

    let hashedPassword = CryptoJS.MD5(passwordInput.value).toString();

    // Chuỗi mã hóa MD5 tương ứng của mật khẩu cấp cao: Crockcity2026
    if (hashedPassword === "84b77f9cd99351de83626786a344933a") {
        isAdminLoggedIn = true;
        passwordInput.value = ""; 
        
        document.getElementById('admin-login-form').style.display = 'none';
        document.getElementById('admin-main-content').style.display = 'block';
        
        alert("🎉 Đăng nhập quyền Admin thành công!");
        updateTaskDisplay();
    } else {
        alert("❌ Mật khẩu Admin không chính xác!");
        passwordInput.value = "";
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    document.getElementById('admin-login-form').style.display = 'block';
    document.getElementById('admin-main-content').style.display = 'none';
    alert("🚪 Đã đăng xuất khỏi tài khoản Admin.");
}

function updateTaskDisplay() {
    const balEl = document.getElementById('user-balance');
    if (balEl) {
        balEl.innerText = currentUserData.balance.toLocaleString('vi-VN') + ' đ';
    }
    
    for (let i = 1; i <= 3; i++) {
        const countEl = document.getElementById(`count-task-${i}`);
        let count = currentUserData[`task${i}`] || 0;
        
        if (countEl) {
            countEl.innerText = `Đã làm: ${count}/2 lần`;
        }

        // TỰ ĐỘNG KHÓA HOẶC MỞ NÚT LÀM NHIỆM VỤ NẾU QUÁ 2 LẦN
        const taskBtn = document.querySelector(`#page-tasks .card:nth-of-type(${i}) .btn-primary`);
        if (count >= 2 && taskBtn) {
            taskBtn.innerText = "🔒 Đã hết lượt hôm nay";
            taskBtn.style.background = "#4b5563";
            taskBtn.style.cursor = "not-allowed";
        } else if (count < 2 && taskBtn) {
            taskBtn.innerText = "Làm Nhiệm Vụ 🚀";
            taskBtn.style.background = ""; 
            taskBtn.style.cursor = "pointer";
        }

        if (document.getElementById(`adminKeyShow${i}`)) {
            document.getElementById(`adminKeyShow${i}`).innerText = localStorage.getItem(`key_task_${i}`);
        }
    }
}

function startTask(taskId) {
    let count = currentUserData[`task${taskId}`] || 0;
    
    // CẢNH BÁO 1: Khóa cứng không cho bấm làm nếu đã đạt giới hạn 2 lần
    if (count >= 2) {
        alert("❌ Bạn đã hoàn thành tối đa 2 lượt làm nhiệm vụ này trong ngày hôm nay! Vui lòng quay lại vào ngày mai.");
        return;
    }

    localStorage.setItem(`last_click_${taskId}`, Date.now());
    let currentKey = localStorage.getItem(`key_task_${taskId}`);
    alert(`THÔNG BÁO CHO ADMIN: Mã xác nhận hiện tại của link này là [ ${currentKey} ]. Bạn hãy dùng mã này cài làm key đích trên trang rút gọn link của bạn.`);
    window.open(taskLinks[taskId], '_blank');
}

function verifyKey(taskId) {
    let count = currentUserData[`task${taskId}`] || 0;
    
    // CẢNH BÁO 2: Chặn spam nút nhập mã khi đã hết lượt làm nhiệm vụ
    if (count >= 2) {
        alert("❌ Nhiệm vụ này đã đạt giới hạn 2 lần làm. Hệ thống không đồng ý cộng thêm tiền!");
        return;
    }

    let lastClick = parseInt(localStorage.getItem(`last_click_${taskId}`) || '0');
    // BẪY HACK 2: Chống Tool Auto Bypass vượt link siêu tốc dưới 12 giây
    if (lastClick === 0 || (Date.now() - lastClick < 12000)) {
        reportCheat(`Sử dụng Tool vượt link siêu tốc (Thời gian hoàn thành: ${(Date.now() - lastClick)/1000} giây)`);
        return;
    }

    const inputField = document.getElementById(`inputKey${taskId}`);
    if (!inputField) return;
    
    const codeEntered = inputField.value.trim().toUpperCase(); 
    if (codeEntered === "") { alert("Vui lòng điền mã số!"); return; }

    let correctKey = localStorage.getItem(`key_task_${taskId}`);

    if (codeEntered === correctKey) {
        wrongKeyCounter = 0; 
        currentUserData[`task${taskId}`] += 1; // Tăng số lượt làm của User
        currentUserData.balance += 500; // Cộng tiền thưởng
        
        alert("🎉 Thành công! +500 đ đã được cộng vào tài khoản.");
        
        let newRandomKey = generateRandomKey();
        localStorage.setItem(`key_task_${taskId}`, newRandomKey);
        
        inputField.value = "";
        
        syncDataToFirebase(); // Đẩy đồng bộ thẳng lên mây Firebase
        updateTaskDisplay();
    } else {
        wrongKeyCounter++;
        // BẪY HACK 3: Chống Spam mã sai liên tục quá 5 lần để dò Key trái phép
        if (wrongKeyCounter >= 5) {
            reportCheat("Spam mã sai liên tục quá 5 lần để dò tìm Key hệ thống");
            return;
        }
        alert(`❌ Mã số không đúng! Bạn còn ${5 - wrongKeyCounter} lần thử.`);
    }
}

// ================= HÀM XỬ LÝ RÚT TIỀN & AUTOMATION BẮN TELEGRAM =================
function submitUserWithdraw(event) {
    event.preventDefault();
    
    const method = document.getElementById('userPayMethod').value;
    const info = document.getElementById('userPayInfo').value.trim();
    const amount = parseInt(document.getElementById('userPayAmount').value);

    if (amount > currentUserData.balance) { 
        alert("Tài khoản của bạn không đủ số dư!"); 
        return; 
    }

    currentUserData.balance -= amount; // Trừ tiền tài khoản
    syncDataToFirebase(); // Đồng bộ số dư mới bị trừ lên Firebase
    alert("✓ Gửi yêu cầu rút tiền lên hệ thống thành công!");
    
    // Automation: Tự động soạn văn bản và kích hoạt bot Telegram bắn thông tin về máy Admin
    if (TELEGRAM_TOKEN !== "ĐIỀN_TOKEN_BOT_CỦA_BẠN_VÀO_ĐÂY") {
        const messageText = `🚨 <b>CROCKCITY MMO - CÓ LỆNH RÚT TIỀN MỚI!</b>\n\n` +
                            `👤 <b>Tài khoản:</b> ${currentUsername}\n` +
                            `💳 <b>Hình thức:</b> ${method}\n` +
                            `📌 <b>Thông tin nhận:</b> <code>${info}</code>\n` +
                            `💰 <b>Số tiền rút:</b> ${amount.toLocaleString('vi-VN')} đ\n\n` +
                            `⚡ <i>Vui lòng vào duyệt tiền cho thành viên!</i>`;

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        
        fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: messageText,
                parse_mode: "HTML"
            })
        }).catch(err => console.error("Lỗi gửi Telegram:", err));
    }

    const tbody = document.getElementById('admin-withdraw-list');
    if (tbody) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><b>${currentUsername}</b></td>
            <td>${method}</td>
            <td>${info}</td>
            <td>${amount.toLocaleString('vi-VN')} đ</td>
            <td><span class="badge badge-pending">Chờ Duyệt</span></td>
            <td><button style="background:#2ecc71; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" onclick="this.parentElement.previousElementSibling.innerHTML='Đã Duyệt'; this.remove();">Duyệt</button></td>
        `;
        tbody.appendChild(row);
    }

    document.getElementById('userPayInfo').value = "";
    document.getElementById('userPayAmount').value = "";
    updateTaskDisplay();
}

function updateAdminLink(taskId) {
    const inputLink = document.getElementById(`adminLink${taskId}`).value.trim();
    if (inputLink === "") return;
    taskLinks[taskId] = inputLink;
    localStorage.setItem('link_task_' + taskId, inputLink);
    alert(`✅ Đã lưu link mới cho nhiệm vụ số ${taskId}!`);
}

function adminChangeKeyManually(taskId) {
    let newCustomKey = prompt(`Nhập mã Key mới cho nhiệm vụ ${taskId} (Để trống hệ thống sẽ tự động random):`);
    if (newCustomKey === null) return;
    
    if (newCustomKey.trim() === "") {
        newCustomKey = generateRandomKey();
    } else {
        newCustomKey = newCustomKey.trim().toUpperCase();
    }
    
    localStorage.setItem(`key_task_${taskId}`, newCustomKey);
    alert(`✅ Đã đổi Key nhiệm vụ ${taskId} thành: ${newCustomKey}`);
    updateTaskDisplay();
}

// ================= HIỆU ỨNG CHẠY POPUP RÚT TIỀN GIẢ LẬP TRANG CHỦ =================
const sampleUsers = ["nguyenvan***", "tranmmo***", "ducvinh***", "hoang9x***", "linhchi***", "crypto***", "mmo_king***", "vuanhiemvu***", "lamgiau***"];
const sampleAmounts = ["10.000 đ", "20.000 đ", "50.000 đ", "100.000 đ"];
const sampleMethods = ["MoMo", "ZaloPay", "ViettelPay", "Thẻ Cào"];

function runLiveWithdrawTicker() {
    const tickerText = document.getElementById('ticker-text');
    if (!tickerText) return;

    setInterval(() => {
        let randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
        let randomAmount = sampleAmounts[Math.floor(Math.random() * sampleAmounts.length)];
        let randomMethod = sampleMethods[Math.floor(Math.random() * sampleMethods.length)];
        
        tickerText.style.opacity = 0;
        setTimeout(() => {
            tickerText.innerHTML = `🎉 Thành viên <b style="color:#e5e7eb;">${randomUser}</b> vừa rút thành công <b style="color:#ffd700;">${randomAmount}</b> về <b>${randomMethod}</b> (Cách đây vài giây)`;
            tickerText.style.opacity = 1;
        }, 500);

    }, 4000);
}

// ================= KHỞI CHẠY KHI TẢI TRANG =================
document.addEventListener("DOMContentLoaded", function() {
    for (let i = 1; i <= 3; i++) {
        if (document.getElementById(`adminLink${i}`)) {
            document.getElementById(`adminLink${i}`).value = taskLinks[i];
        }
    }
    
    const passInput = document.getElementById('adminPasswordInput');
    if (passInput) {
        passInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') checkAdminLogin();
        });
    }

    runLiveWithdrawTicker();
    updateTaskDisplay();
});
