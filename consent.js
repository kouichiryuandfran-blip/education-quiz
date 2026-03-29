const CONSENT_KEY = "quiz_app_consent_v1";

function checkConsent() {
  const agreed = localStorage.getItem(CONSENT_KEY);

  if (!agreed) {
    showConsentScreen();
  }
}

function showConsentScreen() {
  document.body.innerHTML = `
    <div class="container">
      <div class="card">
        <h2>利用規約への同意</h2>
        <p style="font-size:14px; line-height:1.6;">
          本アプリは教育目的の補助ツールです。<br><br>
          ・内容の正確性は保証されません<br>
          ・業務判断には使用しないでください<br>
          ・無断転載・外部共有は禁止です<br><br>
          利用する場合は、下記に同意してください。
        </p>
        <button class="main-btn" onclick="agreeConsent()">同意して利用する</button>
      </div>
    </div>
  `;
}

function agreeConsent() {
  localStorage.setItem(CONSENT_KEY, "true");
  location.reload();
}