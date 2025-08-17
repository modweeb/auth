// دوال المصادقة وإدارة الحساب - النسخة المحدثة
// تاريخ التحديث: 2023-11-15

/**
 * فك تشفير token JWT
 * @param {string} token - رمز JWT
 * @returns {object|null} بيانات المستخدم أو null إذا فشل التحليل
 */
function parseJwt(token) {
    if (!token || token.split('.').length !== 3) {
        console.error("رمز JWT غير صالح.");
        return null;
    }

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("فشل في فك تشفير JWT:", e);
        return null;
    }
}

/**
 * معالجة استجابة مصادقة جوجل
 * @param {object} response - استجابة المصادقة من جوجل
 */
function handleCredentialResponse(response) {
    const responsePayload = parseJwt(response.credential);
    
    if (responsePayload?.name && responsePayload?.email) {
        // تخزين بيانات المستخدم
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userName', responsePayload.name);
        localStorage.setItem('userPicture', responsePayload.picture || '');
        localStorage.setItem('userEmail', responsePayload.email);
        localStorage.setItem('userJoinDate', 
            new Date().toLocaleDateString('ar-SA', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })
        );

        // تحديد مسار الإعادة
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirect_to');
        const source = params.get('source');

        if (source === 'blog') {
            // إرسال البيانات إلى المدونة
            if (window.opener) {
                window.opener.postMessage({
                    type: 'loginSuccess',
                    user: {
                        name: responsePayload.name,
                        image: responsePayload.picture,
                        email: responsePayload.email
                    }
                }, 'https://mdwnplus.blogspot.com');
            }
            window.close();
        } else if (redirectTo === 'account') {
            window.location.href = 'https://modweeb.github.io/auth-login/account';
        } else {
            window.location.href = 'https://modweeb.github.io/auth-login/login';
        }
    } else {
        console.error("بيانات المستخدم غير مكتملة");
        alert("حدث خطأ في المصادقة. يرجى المحاولة مرة أخرى.");
    }
}

/**
 * تسجيل الخروج وإعادة التوجيه
 */
function handleLogoutAndRedirect() {
    // مسح بيانات الجلسة
    const keys = [
        'userLoggedIn',
        'userName',
        'userEmail',
        'userPicture',
        'userJoinDate'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    
    // إعادة التوجيه مع تأخير بسيط
    setTimeout(() => {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/account')) {
            window.location.href = 'https://modweeb.github.io/auth-login/login';
        } else {
            window.location.href = 'https://mdwnplus.blogspot.com';
        }
    }, 300);
}

/**
 * تحديث واجهة معلومات الحساب
 */
function updateAccountInfo() {
    const accountInfo = document.getElementById('accountInfo');
    if (!accountInfo) {
        console.warn('عنصر عرض معلومات الحساب غير موجود');
        return;
    }

    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userData = {
        name: localStorage.getItem('userName'),
        picture: localStorage.getItem('userPicture'),
        email: localStorage.getItem('userEmail'),
        joinDate: localStorage.getItem('userJoinDate')
    };

    if (isLoggedIn && userData.name && userData.email) {
        accountInfo.innerHTML = `
            <div class="flex items-center justify-center mb-4">
                <img src="${userData.picture || 'https://via.placeholder.com/150'}" 
                     alt="${userData.name}" 
                     class="w-16 h-16 rounded-full"
                     onerror="this.src='https://via.placeholder.com/150'">
            </div>
            <p class="text-lg font-semibold">${userData.name}</p>
            <p class="text-neutral-500">${userData.email}</p>
            <p class="text-neutral-500">
                تاريخ الانضمام: ${userData.joinDate || 'غير محدد'}
            </p>
        `;
    } else {
        accountInfo.innerHTML = `
            <div class="text-center">
                <p class="text-neutral-500 mb-4">لم يتم تسجيل الدخول.</p>
                <a href="https://modweeb.github.io/auth-login/login" 
                   class="button button-black">
                   تسجيل الدخول
                </a>
            </div>
        `;
        
        // إذا كان في صفحة الحساب، إعادة التوجيه بعد فترة
        if (window.location.pathname.includes('/account')) {
            setTimeout(() => {
                window.location.href = 'https://modweeb.github.io/auth-login/login?redirect_to=account';
            }, 1500);
        }
    }
}

// دالة مساعدة للتحقق من صحة المصادقة
function validateAuth() {
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const requiredFields = ['userName', 'userEmail'];
    const isValid = isLoggedIn && requiredFields.every(field => 
        localStorage.getItem(field)
    );
    
    if (!isValid && window.location.pathname.includes('/account')) {
        window.location.href = 'https://modweeb.github.io/auth-login/login?redirect_to=account';
    }
    
    return isValid;
}
