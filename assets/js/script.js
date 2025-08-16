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
        // تخزين البيانات في localStorage
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userName', responsePayload.name);
        localStorage.setItem('userPicture', responsePayload.picture);
        localStorage.setItem('userEmail', responsePayload.email);
        localStorage.setItem('userJoinDate', new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }));
        
        // التحقق من محددات الرابط لتحديد وجهة إعادة التوجيه
        const params = new URLSearchParams(window.location.search);
        const source = params.get('source');
        const redirectTo = params.get('redirect_to');

        if (redirectTo === 'account.html') {
            // المستخدم قادم من صفحة الحساب، أعده إليها
            window.location.href = 'https://modweeb.github.io/auth-login/account.html';
        } else if (source === 'blog') {
            // المستخدم قادم من المدونة، أرسل رسالة للنافذة الأم وأغلق النافذة المنبثقة
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
        } else {
            // حالة احتياطية، أغلق النافذة المنبثقة
            window.close();
        }
    } else {
        console.error("فشل في استلام بيانات المستخدم.");
    }
}
