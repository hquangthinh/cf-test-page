// App configuration screen
window.PbsArmLauncherAppConfiguration = (function ($, appUtil) {
  $(window.parent.document).ready(function () {
    // setup event handlers
    //console.log(`ARMLauncher is ready`);console.log(appUtil);
    const jsAppContainer = window.parent.document.getElementById("arm-js-app-container");
    if(jsAppContainer) {
      jsAppContainer.style.display = "none";
    }
    const saveConfigBtn = window.parent.document.querySelector("button#erp-button-save-config");
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener("click", function (event) {
        const txtBaseUrl = appUtil.getControlById("input", "erp-text-box-arm-base-url");
        appUtil.saveArmConfiguration(txtBaseUrl.value);
      }, false);
    }

    // load context data
    appUtil.getKineticAuthObjectFromParentWindowCookie();
    appUtil.getKineticUserInfoFromLocalStorage();
    appUtil.getArmConfiguration();
  });
})($, window.PbsArmLauncherAppUtil);
