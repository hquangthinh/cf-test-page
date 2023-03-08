// Read ARM base URL from configuration then redirect to target ARM site
window.PbsArmLauncherAppRedirect = (function ($, appUtil) {
  let armBaseUrl = '';
  const ARM_RETURN_URL_MAP = {
    'ARMReqTracker': '/requisitions',
    'ARMReqEntry': '/requisitions/new_requisition'
  };
  $(document).ready(function () {
    // setup event handlers
    //console.log(`ARMLauncher is ready`);console.log(appUtil);
    const jsAppContainer = window.parent.document.getElementById("arm-js-app-container");
    if (jsAppContainer) {
      jsAppContainer.style.display = "none";
    }
    // load context data
    appUtil.getKineticAuthObjectFromParentWindowCookie();
    appUtil.getKineticUserInfoFromLocalStorage();
    appUtil.getArmConfigurationData()
      .then(function (response) {
        console.log(`response`); console.log(response.data);
        if (response && response.data) {
          armConfigModel = appUtil.transformDsToConfigModel(response.data);
          armBaseUrl = armConfigModel.Key5;
          // Doing redirect to ARM
          if (armBaseUrl && armBaseUrl !== '') {
            //console.log('redirecting to'); console.log(armBaseUrl); console.log(window.parent.location);
            if(window.parent.location.href.indexOf('Erp.UI.ARMReqEntry') > -1) {
              const returnUrl = encodeURIComponent(ARM_RETURN_URL_MAP['ARMReqEntry']);
              window.parent.location.href = `${armBaseUrl}/AppAccount/SSOHandler?provider=epicor&returnUrl=${returnUrl}`;
            }
          }
        }
      })
      .catch(function (error) {
        console.log(`error.message`); console.log(error.message);
      });
  });
}($, window.PbsArmLauncherAppUtil));
