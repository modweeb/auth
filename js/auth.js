// ملف: js/auth.js
// الوصف: يحتوي على دوال التوثيق وإدارة الحساب المشتركة بين الصفحات

/**
 * تحليل رمز JWT لاستخراج بيانات المستخدم
 * @param {string} token - رمز JWT
 * @returns {Object|null} بيانات المستخدم أو null في حالة الخطأ
 */
function parseJwt(token) {
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        console.error("رمز JWT غير صالح:", token);
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
 * معالجة استجابة بيانات الاعتماد من Google
 * @param {Object} response - استجابة بيانات الاعتماد
 */
function handleCredentialResponse(response) {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    const responsePayload = parseJwt(response.credential);
    
    if (responsePayload) {
        // تخزين بيانات المستخدم في localStorage
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userName', responsePayload.name || 'مستخدم');
        localStorage.setItem('userPicture', responsePayload.picture || '');
        localStorage.setItem('userEmail', responsePayload.email || '');
        localStorage.setItem('userJoinDate', new Date().toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
        
        // التحقق من معلمات الرابط
        const params = new URLSearchParams(window.location.search);
        const source = params.get('source');
        const returnUrl = params.get('return');
        
        // مزامنة حالة تسجيل الدخول بين التبويبات
        const event = new StorageEvent('storage', {
            key: 'userLoggedIn',
            newValue: 'true',
            url: window.location.href,
            storageArea: localStorage
        });
        window.dispatchEvent(event);
        
        // إرسال رسالة إلى النافذة الأم إذا كان المصدر هو المدونة
        if (source === 'blog' && window.opener) {
            window.opener.postMessage({
                type: 'userStatusChanged',
                loggedIn: true,
                user: {
                    name: responsePayload.name,
                    image: responsePayload.picture,
                    email: responsePayload.email
                }
            }, '*');
        }
        
        // إعادة التوجيه بعد تأخير بسيط
        setTimeout(() => {
            if (source === 'blog' && returnUrl) {
                window.location.href = decodeURIComponent(returnUrl);
            } else if (window.location.pathname.includes('/login')) {
                window.location.href = 'https://modweeb.github.io/auth-login/account/';
            }
            
            if (loading) loading.style.display = 'none';
        }, 1000);
    } else {
        console.error("فشل في استلام بيانات المستخدم الصالحة.");
        if (loading) loading.style.display = 'none';
        alert('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    }
}

/**
 * تسجيل الخروج وإعادة التوجيه
 */
function handleLogoutAndRedirect() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    
    // إرسال رسالة إلى النوافذ الأخرى لتحديث حالة تسجيل الخروج
    window.postMessage({
        type: 'userStatusChanged',
        loggedIn: false
    }, '*');
    
    // إرسال رسالة إلى النافذة الأم إذا كانت هذه نافذة منبثقة
    if (window.opener) {
        window.opener.postMessage({
            type: 'userStatusChanged',
            loggedIn: false
        }, '*');
    }
    
    // إزالة بيانات المستخدم من التخزين المحلي
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userJoinDate');
    
    // إعادة التوجيه بعد تأخير بسيط
    setTimeout(() => {
        if (window.location.pathname.includes('/account')) {
            window.location.href = 'https://mdwnplus.blogspot.com';
        } else {
            window.location.reload();
        }
        
        if (loading) loading.style.display = 'none';
    }, 1000);
}

/**
 * تحديث معلومات الحساب في واجهة المستخدم
 */
function updateAccountInfo() {
    const accountInfo = document.getElementById('accountInfo');
    if (!accountInfo) return;
    
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    const userPicture = localStorage.getItem('userPicture');
    const userEmail = localStorage.getItem('userEmail');
    const userJoinDate = localStorage.getItem('userJoinDate');
    
    if (isLoggedIn && userName && userEmail) {
        accountInfo.innerHTML = `
            <div class="flex flex-col items-center">
                <img 
                    src="${userPicture || 'https://via.placeholder.com/150?text=صورة+المستخدم'}" 
                    alt="${userName}" 
                    class="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                >
                <div class="mt-4">
                    <p class="text-xl font-bold text-gray-900 dark:text-white">${userName}</p>
                    <p class="text-gray-600 dark:text-gray-300 mt-1">${userEmail}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mt-6">
                <div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow text-center">
                    <div class="text-2xl font-bold text-blue-500">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <p class="text-gray-700 dark:text-gray-300 mt-2">تاريخ الانضمام</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${userJoinDate || 'غير محدد'}</p>
                </div>
                
                <div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow text-center">
                    <div class="text-2xl font-bold text-green-500">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <p class="text-gray-700 dark:text-gray-300 mt-2">حالة الحساب</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">نشط</p>
                </div>
            </div>
            
            <div class="mt-8">
                <button onclick="handleLogoutAndRedirect()" class="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center">
                    <i class="fas fa-sign-out-alt ml-2"></i>
                    تسجيل الخروج
                </button>
            </div>
        `;
    } else {
        accountInfo.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-user-slash text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-300 mb-6">لم تقم بتسجيل الدخول بعد</p>
                <a href="https://modweeb.github.io/auth-login/login/" class="inline-block bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition duration-300">
                    <i class="fas fa-sign-in-alt ml-2"></i>
                    تسجيل الدخول
                </a>
            </div>
        `;
    }
}

/**
 * تحديث حالة الحساب في شريط التنقل (للمدونة)
 */
function updateAccountStatus() {
    const accountWindow = document.querySelector('.acntW');
    const accountIconSpan = document.querySelector('.tAcnt > span');
    
    if (!accountWindow || !accountIconSpan) return;
    
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    const userPicture = localStorage.getItem('userPicture');
    
    if (isLoggedIn) {
        accountWindow.innerHTML = `
            <a href="https://modweeb.github.io/auth-login/account/" aria-label="Account">
                <svg class='line' viewBox='0 0 24 24'>
                    <path d='M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z'></path>
                    <path d='M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22'></path>
                </svg>
            </a>
            <button type="button" aria-label="Logout" onclick="handleLogoutAndRedirect()">
                <svg class='line' viewBox='0 0 24 24'>
                    <path d='M17.4399 14.62L19.9999 12.06L17.4399 9.5'></path>
                    <path d='M9.76001 12.0601H19.93'></path>
                    <path d='M11.76 20C7.34001 20 3.76001 17 3.76001 12C3.76001 7 7.34001 4 11.76 4'></path>
                </svg>
            </button>
        `;
        
        // عرض صورة المستخدم أو الحرف الأول من الاسم
        if (userPicture) {
            accountIconSpan.innerHTML = `<img src='${userPicture}' alt='${userName || "User Profile"}' class='w-8 h-8 rounded-full' crossorigin='anonymous'/>`;
        } else if (userName) {
            accountIconSpan.innerHTML = `<div class='w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold'>${userName[0]}</div>`;
        } else {
            accountIconSpan.innerHTML = `<div class='w-8 h-8 rounded-full bg-gray-200'></div>`;
        }
    } else {
        accountWindow.innerHTML = `
            <a href="javascript:void(0)" aria-label="Login" onclick="showLoginPopup()">
                <svg class='line' viewBox='0 0 24 24'>
                    <path d='M11.6801 14.62L14.2401 12.06L11.6801 9.5' stroke-miterlimit='10'/>
                    <path d='M4 12.0601H14.17' stroke-miterlimit='10'/>
                    <path d='M12 4C16.42 4 20 7 20 12C20 17 16.42 20 12 20' stroke-miterlimit='10'/>
                </svg>
            </a>
        `;
        accountIconSpan.innerHTML = `<div class='w-8 h-8 rounded-full bg-gray-200'></div>`;
    }
}

/**
 * مزامنة حالة تسجيل الدخول بين التبويبات
 */
function syncLoginState() {
    const event = new StorageEvent('storage', {
        key: 'userLoggedIn',
        newValue: localStorage.getItem('userLoggedIn'),
        url: window.location.href,
        storageArea: localStorage
    });
    window.dispatchEvent(event);
}

// جعل الدوال متاحة عالميًا للاستدعاء من HTML
window.parseJwt = parseJwt;
window.handleCredentialResponse = handleCredentialResponse;
window.handleLogoutAndRedirect = handleLogoutAndRedirect;
window.updateAccountInfo = updateAccountInfo;
window.updateAccountStatus = updateAccountStatus;
window.syncLoginState = syncLoginState;
