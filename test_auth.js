const res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=AIzaSyC_ciJWsHoUvBHEkeUOUZ-Buq6wnX-tnGw', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: "+919999999990", recaptchaToken: "fake-token" })
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
