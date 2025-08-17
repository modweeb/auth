// auth.js
const parseJwt = (token) => {
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
};

const handleCredentialResponse = (response) => {
  const responsePayload = parseJwt(response.credential);
  if (responsePayload) {
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('userName', responsePayload.name);
    localStorage.setItem('userPicture', responsePayload.picture);
    localStorage.setItem('userEmail', responsePayload.email);
    localStorage.setItem('userJoinDate', new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }));

    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('redirect_to');
    const source = params.get('source');

    if (redirectTo === 'account.html') {
      window.location.href = 'https://modweeb.github.io/auth-login/account.html';
    } else if (source === 'blog') {
      if (window.opener) {
        window.opener.postMessage({
          type: 'loginSuccess',
          user: {
            name: responsePayload.name,
            image: responsePayload.picture,
            email: responsePayload.email,
          },
        }, 'https://www.modweeb.com');
      }
      window.close();
    } else {
      window.close();
    }
  } else {
    console.error("فشل في استلام بيانات المستخدم.");
  }
};

// استدعاء الدوال في الصفحات
document.addEventListener('DOMContentLoaded', () => {
  updateAccountStatus();
});

window.addEventListener('storage', updateAccountStatus);
