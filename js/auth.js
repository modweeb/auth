// دوال التوثيق وإدارة الحساب

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`;
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

        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirect_to');

        if (redirectTo === 'account.html') {
            window.location.href = 'account.html';
        } else {
            window.location.href = '/'; // أو أي صفحة افتراضية
        }
    } else {
        console.error("فشل في استلام بيانات المستخدم.");
    }
}

function handleLogoutAndRedirect() {
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPicture');
    window.location.href = '/'; // إعادة التوجيه إلى الصفحة الرئيسية
}

function updateAccountInfo() {
    const accountInfo = document.getElementById('accountInfo');
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
            <p class="text-neutral-500">تاريخ الانضمام: ${userJoinDate}</p>
        `;
    } else {
        accountInfo.innerHTML = `
            <p class="text-neutral-500">لم يتم تسجيل الدخول.</p>
            <a href="login.html" class="button button-black mt-4">تسجيل الدخول</a>
        `;
    }
}
