if (!sessionStorage.getItem('secure_bal')) sessionStorage.setItem('secure_bal', btoa('0'));

// 🔴 THAY ĐƯỜNG LINK GOOGLE SCRIPT CỦA BẠN VÀO ĐÂY ĐỂ CHẠY CHỨC NĂNG BẮN TELEGRAM
const GOOGLE_API_URL = "LINK_GOOGLE_APPS_SCRIPT_CỦA_BẠN"; 

let wrongKeyCounter = 0;

// Cấu hình Link mặc định lưu trong LocalStorage
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

// Khởi tạo mã Key ngẫu nhiên lần đầu cho máy nếu chưa có sẵn
if (!localStorage.getItem('key_task_1')) localStorage.setItem('key_task_1', generateRandomKey());
if (!localStorage.getItem('key_task_2')) localStorage.setItem('key_task_2', generateRandomKey());
if (!localStorage.getItem('key_task_3')) localStorage.setItem('key_task_3', generateRandomKey());

function getBalance() {
    try { 
        let bal = sessionStorage.getItem('secure_bal');
        return bal ? parseInt(atob(bal)) : 0; 
    } 
    catch(e) { 
        reportCheat("Can thiệp cấu trúc mã hóa bộ nhớ ví (SessionStorage)");
        return 0; 
    }
}

function setBalance(amount) {
    sessionStorage.setItem('secure_bal', btoa(amount.toString()));
}

// ================= HÀM CHẶN GIAN LẬN VÀ KHÓA CỨNG TRANG WEB =================
function reportCheat(reason) {
    fetch(GOOGLE_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason })
    }).catch(err => console.log("Lỗi log bảo mật."));
    
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

// BẪY HACK 1: QUÉT SỐ DƯ HIỂN THỊ LIÊN TỤC MỖI 2 GIÂY (Chống sửa số tiền bằng Inspect Element)
setInterval(function() {
    const displayBalance = document.getElementById('user-balance');
    if (displayBalance && displayBalance.offsetParent !== null) {
        let cleanText = displayBalance.innerText.replace(/[^0-9]/g, '');
        let textVal = cleanText === "" ? 0 : parseInt(cleanText);
        
        if (!isNaN(textVal) && textVal !== getBalance()) {
            reportCheat("Cố tình sửa đổi giá trị số dư hiển thị (Inspect Element)");
        }
    }
}, 2000);

// Khóa phím tắt nhà phát triển (F12, Ctrl+U, chuột phải)
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if (e.keyCode == 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'C'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || 
        (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
        return false;
    }
};

// ================= LOGIC ĐIỀU HƯỚNG CÁC TAB (CÓ KHÓA MẬT KHẨU ADMIN) =================
function showSection(sectionId) {
    // Nếu bấm vào tab Admin, bắt buộc phải check mật khẩu chính xác
    if (sectionId === 'admin') {
        let password = prompt("🔑 Vui lòng nhập mật khẩu cấp cao dành cho Admin:");
        
        // Bạn có thể đổi chữ "Crockcity2026" thành mật khẩu riêng của bạn ở đây
        if (password !== "Crockcity2026") { 
            alert("❌ Mật khẩu Admin không chính xác! Bạn không có quyền truy cập khu vực này.");
            return; // Chặn đứng tại đây, không cho chuyển tab
        }
    }

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
    updateTaskDisplay();
}

function updateTaskDisplay() {
    const balEl = document.getElementById('user-balance');
    if (balEl) {
        balEl.innerText = getBalance().toLocaleString('vi-VN') + ' đ';
    }
    
    for (let i = 1; i <= 3; i++) {
        const countEl = document.getElementById(`count-task-${i}`);
        if (countEl) {
            let count = localStorage.getItem(`count_task_${i}`) || '0';
            countEl.innerText = `Đã làm: ${count}/2 lần`;
        }
        // Đồng bộ hiển thị mã Key hiện tại lên màn hình Admin
        if (document.getElementById(`adminKeyShow${i}`)) {
            document.getElementById(`adminKeyShow${i}`).innerText = localStorage.getItem(`key_task_${i}`);
        }
    }
}

function startTask(taskId) {
    localStorage.setItem(`last_click_${taskId}`, Date.now());
    let currentKey = localStorage.getItem(`key_task_${taskId}`);
    alert(`THÔNG BÁO CHO ADMIN: Mã xác nhận hiện tại của link này là [ ${currentKey} ]. Bạn hãy dùng mã này cài làm key đích trên trang rút gọn link của bạn.`);
    window.open(taskLinks[taskId], '_blank');
}

function verifyKey(taskId) {
    let lastClick = parseInt(localStorage.getItem(`last_click_${taskId}`) || '0');
    // BẪY HACK 2: Chống vượt link siêu tốc dưới 12 giây bằng Tool Auto Bypass
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
        let newCount = parseInt(localStorage.getItem(`count_task_${taskId}`) || '0') + 1;
        localStorage.setItem(`count_task_${taskId}`, newCount);
        setBalance(getBalance() + 500);
        
        alert("🎉 Thành công! +500 đ đã được cộng vào tài khoản.");
        
        // HỦY KEY CŨ -> TỰ RANDOM RA KEY MỚI TINH CHO LƯỢT TIẾP THEO
        let newRandomKey = generateRandomKey();
        localStorage.setItem(`key_task_${taskId}`, newRandomKey);
        
        inputField.value = "";
        updateTaskDisplay();
    } else {
        wrongKeyCounter++;
        // BẪY HACK 3: Chống Spam mã đoán bừa quá 5 lần liên tiếp để dò Key
        if (wrongKeyCounter >= 5) {
            reportCheat("Spam mã sai liên tục quá 5 lần để dò tìm Key hệ thống");
            return;
        }
        alert(`❌ Mã số không đúng! Bạn còn ${5 - wrongKeyCounter} lần thử.`);
    }
}

function submitUserWithdraw(event) {
    event.preventDefault();
    const method = document.getElementById('userPayMethod').value;
    const info = document.getElementById('userPayInfo').value.trim();
    const amount = parseInt(document.getElementById('userPayAmount').value);
    let currentBal = getBalance();

    if (amount > currentBal) { alert("Tài khoản của bạn không đủ số dư!"); return; }

    setBalance(currentBal - amount);
    alert("✓ Gửi yêu cầu rút tiền lên hệ thống thành công!");
    
    const tbody = document.getElementById('admin-withdraw-list');
    if (tbody) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><b>Thành Viên</b></td>
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

// Tính năng đổi mã thủ công bằng tay ngay trên trang quản lý Admin nếu muốn
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

document.addEventListener("DOMContentLoaded", function() {
    for (let i = 1; i <= 3; i++) {
        if (document.getElementById(`adminLink${i}`)) {
            document.getElementById(`adminLink${i}`).value = taskLinks[i];
        }
    }
    updateTaskDisplay();
});
