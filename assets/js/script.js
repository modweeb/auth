// --- الدوال المخصصة للتنبيهات المنبثقة ---
function showCustomAlert(message, title = 'تنبيه') {
    return new Promise(resolve => {
        const modal = document.getElementById('custom-modal-backdrop');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalButtons = document.getElementById('modal-buttons');

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalButtons.innerHTML = `<button class="button button-black flex-1" onclick="closeCustomModal(true)">حسنًا</button>`;
        
        modal.style.display = 'flex';
        window.closeCustomModal = function(result) {
            modal.style.display = 'none';
            resolve(result);
        };
    });
}

function showCustomConfirm(message, title = 'تأكيد') {
    return new Promise(resolve => {
        const modal = document.getElementById('custom-modal-backdrop');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalButtons = document.getElementById('modal-buttons');

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalButtons.innerHTML = `
            <button class="button button-outline flex-1" onclick="closeCustomModal(false)">إلغاء</button>
            <button class="button button-black flex-1" onclick="closeCustomModal(true)">تأكيد</button>
        `;

        modal.style.display = 'flex';
        window.closeCustomModal = function(result) {
            modal.style.display = 'none';
            resolve(result);
        };
    });
}


// --- الدوال الأساسية للموقع (صفحة الحساب) ---
function updateUserInfo() {
    const userName = localStorage.getItem('userName');
    const userPicture = localStorage.getItem('userPicture');
    const userEmail = localStorage.getItem('userEmail');
    const userJoinDate = localStorage.getItem('userJoinDate') || 'غير متوفر';

    if (userName) {
        document.getElementById('user-name-display').textContent = userName;
        document.getElementById('email-info').textContent = userEmail || 'غير متوفر';
        document.getElementById('join-date-info').textContent = userJoinDate;
    }
    if (userPicture) {
        document.getElementById('user-picture').src = userPicture;
    }
}

async function handleLogout() {
    const confirmLogout = await showCustomConfirm("هل أنت متأكد من رغبتك في تسجيل الخروج؟");
    if (confirmLogout) {
        localStorage.clear();
        window.location.href = '../login'; // إعادة التوجيه إلى صفحة تسجيل الدخول
    }
}

// --- الدوال الأساسية للموقع (صفحة تسجيل الدخول) ---
function parseJwt(token) {
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to parse JWT", e);
        return null;
    }
}

function handleCredentialResponse(response) {
    const responsePayload = parseJwt(response.credential);
    
    if (responsePayload) {
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userName', responsePayload.name);
        localStorage.setItem('userPicture', responsePayload.picture);
        localStorage.setItem('userEmail', responsePayload.email);
        localStorage.setItem('userJoinDate', new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }));
        
        window.location.href = '../account'; // إعادة التوجيه إلى صفحة الحساب
    } else {
        console.error("فشل في استلام بيانات المستخدم.");
    }
}


// --- إضافة مستمعي الأحداث عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من حالة تسجيل الدخول عند تحميل صفحة الحساب
    const isAccountPage = window.location.pathname.includes('/account');
    if (isAccountPage) {
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        if (!isLoggedIn) {
            window.location.href = '../login';
        } else {
            updateUserInfo();
            document.getElementById('logout-button').addEventListener('click', handleLogout);
        }
    }
});
