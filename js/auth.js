// دوال التوثيق وإدارة الحساب

function parseJwt(token) {
    if (!token || token.split('.').length !== 3) {
        console.error("رمز JWT غير صالح.");
        return null;
    }

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`;
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("فشل في فك تشفير JWT:", e);
        return null;
    }
}

// دالة لمعالجة رد جوجل بعد المصادقة
function handleCredentialResponse(response) {
    const responsePayload = parseJwt(response.credential);
    
    if (responsePayload && responsePayload.name && responsePayload.email) {
        // تخزين البيانات في localStorage
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userName', responsePayload.name);
        localStorage.setItem('userPicture', responsePayload.picture || '');
        localStorage.setItem('userEmail', responsePayload.email);
        localStorage.setItem('userJoinDate', new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }));
        
        const params = new URLSearchParams(window.location.search);
        const isFromBlog = params.get('cbu') === '1';

        if (isFromBlog) {
            // المستخدم قادم من المدونة
            if (window.opener) {
                window.opener.postMessage({
                    type: 'loginSuccess',
                    user: {
                        name: responsePayload.name,
                        image: responsePayload.picture,
                        email: responsePayload.email
                    }
                }, '*'); // استخدم '*' لضمان إرسال الرسالة لأي نطاق
            }
            window.close(); // إغلاق النافذة المنبثقة
        } else {
            // المستخدم قادم مباشرة إلى صفحة تسجيل الدخول
            window.location.href = 'https://modweeb.github.io/auth-login/account/';
        }
    } else {
        console.error("فشل في استلام بيانات المستخدم الصالحة.");
    }
}

// دالة تسجيل الخروج وإعادة التوجيه
function handleLogoutAndRedirect() {
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPicture');
    localStorage.removeItem('userJoinDate');
    
    // عرض رسالة تأكيد
    alert("تم تسجيل الخروج بنجاح.");
    
    // إعادة التوجيه إلى الصفحة الرئيسية لمستودع GitHub
    window.location.href = 'https://modweeb.github.io/auth-login/';
}

// دالة تحديث واجهة المستخدم في صفحة الحساب
function updateAccountInfo() {
    const accountInfo = document.getElementById('accountInfo');
    if (!accountInfo) {
        console.error("عنصر HTML 'accountInfo' غير موجود.");
        return;
    }

    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    const userPicture = localStorage.getItem('userPicture');
    const userEmail = localStorage.getItem('userEmail');
    const userJoinDate = localStorage.getItem('userJoinDate');

    if (isLoggedIn && userName && userEmail) {
        accountInfo.innerHTML = `
            <div class="flex items-center justify-center mb-4">
                <img src="${userPicture || 'https://via.placeholder.com/150'}" alt="${userName}" class="w-16 h-16 rounded-full">
            </div>
            <p class="text-lg font-semibold">${userName}</p>
            <p class="text-neutral-500">${userEmail}</p>
            <p class="text-neutral-500">تاريخ الانضمام: ${userJoinDate || 'غير محدد'}</p>
        `;
    } else {
        accountInfo.innerHTML = `
            <p class="text-neutral-500">لم يتم تسجيل الدخول.</p>
            <a href="https://modweeb.github.io/auth-login/login/?redirect_to=account.html" class="button button-black mt-4">تسجيل الدخول</a>
        `;
    }
}

