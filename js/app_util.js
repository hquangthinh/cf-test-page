// Share app functions
window.PbsArmLauncherAppUtil = (function (axios) {
  const ARM_BASE_URL = 'https://abc.com';
  let kineticBaseUrl = '';
  let currentUserName = '';
  let currentCompany = '';
  let kineticAuthObj = {};
  let kineticAppInfo = {};
  let armConfigModel = {};

  // controls
  function getControlById(type, id) {
    return window.parent.document.querySelector(`${type}#${id}`);
  }

  // read the parent window cookie string then parse into kinetic auth object
  // the kinetic app contains JS/Website widget which is iframe embedded inside kinetic UI
  function getKineticAuthObjectFromParentWindowCookie() {
    const kineticCookie = window.parent.document.cookie;
    //console.log(`kineticCookie - ${kineticCookie}`);
    const cookieToken = kineticCookie.split(';');
    if (cookieToken && cookieToken.length > 0) {
      const kineticAuthCookie = decodeURIComponent(cookieToken[0]);
      const kineticAuthStr = kineticAuthCookie.split('=')[1];
      kineticAuthObj = JSON.parse(kineticAuthStr);
      //console.log(`kineticAuthStr - ${kineticAuthStr}`);
    }
  }

  function getKineticUserInfoFromLocalStorage() {
    const pathName = window.parent.location.pathname.toLocaleLowerCase();
    const storageKey = `appData.khp${pathName}`;
    const appStorageValStr = window.parent.localStorage.getItem(storageKey);
    if (appStorageValStr) {
      kineticAppInfo = JSON.parse(appStorageValStr);
      if (kineticAppInfo && kineticAppInfo.khp && kineticAppInfo.khp.settings && kineticAppInfo.khp.settings.CurrentUser
        && kineticAppInfo.khp.settings.CurrentCompany) {
        currentUserName = kineticAppInfo.khp.settings.CurrentUser.UserID;
        currentCompany = kineticAppInfo.khp.settings.CurrentCompany.companyId;
        kineticBaseUrl = kineticAppInfo.khp.settings.AppServerUrl;
        //console.log(`context info - ${currentUserName} - ${currentCompany} - ${kineticBaseUrl}`);
      }
    }
  }

  // In the context of Kinetic app the basic auth header is attached to request
  function createHttpClient() {
    const httpClient = axios.create({
      baseURL: kineticBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kineticAuthObj.token}`
      }
    });
    return httpClient;
  }

  function getArmConfigurationData() {
    const httpClient = createHttpClient();
    const whereClauseUD100 = encodeURIComponent(`Company='${currentCompany}' AND Key1='PBS' AND Key2='ARM' AND Key3='Configuration' AND Key4='BaseURL'`);
    return httpClient.get(`/api/v1/Ice.BO.UD100Svc/GetRows?whereClauseUD100=${whereClauseUD100}&whereClauseUD100Attch=&whereClauseUD100A=&whereClauseUD100AAttch=&pageSize=1&absolutePage=1`);
  }

  function getArmConfiguration() {
    const getArmConfigDataPromise = getArmConfigurationData();
    getArmConfigDataPromise
      .then(function (response) {
        console.log(`response`); console.log(response);
        if (response && response.data) {
          armConfigModel = transformDsToConfigModel(response.data);
          const txtBaseUrl = getControlById("input", "erp-text-box-arm-base-url");
          txtBaseUrl.value = armConfigModel.Key5;
        }
      })
      .catch(function (error) {
        console.log(`error.message`); console.log(error.message);
        const txtBaseUrl = getControlById("input", "erp-text-box-arm-base-url");
        txtBaseUrl.value = ARM_BASE_URL;
      });
  }

  // transform the UD100 dataset to the config model object
  function transformDsToConfigModel(ud100Ds) {
    if (ud100Ds && ud100Ds.returnObj && ud100Ds.returnObj.UD100.length > 0) {
      const ud100Row = ud100Ds.returnObj.UD100[0];
      return transformUD100RowToConfigModel(ud100Row);
    }
    return {};
  }

  function transformUD100RowToConfigModel(ud100Row) {
    return {
      Company: ud100Row.Company,
      Key1: ud100Row.Key1,
      Key2: ud100Row.Key2,
      Key3: ud100Row.Key3,
      Key4: ud100Row.Key4,
      Key5: ud100Row.Key5,
      SysRevID: ud100Row.SysRevID,
      SysRowID: ud100Row.SysRowID
    };
  }

  function saveArmConfiguration(armBaseUrl) {
    const httpClient = createHttpClient();
    const ud100Ds = {
      ds: {
        UD100: [
          {
            Company: currentCompany,
            Key1: "PBS",
            Key2: "ARM",
            Key3: "Configuration",
            Key4: "BaseURL",
            Key5: armBaseUrl,
            SysRevID: 0,
            SysRowID: "00000000-0000-0000-0000-000000000000",
            RowMod: "A"
          }
        ]
      }
    };
    if (armConfigModel && armConfigModel.Company
      && armConfigModel.Key1 && armConfigModel.Key2 && armConfigModel.Key3 && armConfigModel.Key4 && armConfigModel.Key5) {
      // Update config record
      ud100Ds.ds.UD100[0].Key5 = armBaseUrl;
      ud100Ds.ds.UD100[0].SysRevID = armConfigModel.SysRevID;
      ud100Ds.ds.UD100[0].SysRowID = armConfigModel.SysRowID;
      ud100Ds.ds.UD100[0].RowMod = "U";
    }
    httpClient.post('/api/v1/Ice.BO.UD100Svc/Update', ud100Ds)
      .then(function (response) {
        console.log(response);
        if (response && response.data
          && response.data.parameters && response.data.parameters.ds
          && response.data.parameters.ds.UD100 && response.data.parameters.ds.UD100.length > 0) {
          const ud100Row = response.data.parameters.ds.UD100[0];
          armConfigModel = transformUD100RowToConfigModel(ud100Row);
          showSuccessMessage();
        }
      })
      .catch(function (error) {
        showErrorMessage(error);
      });
  }

  function showSuccessMessage() {
    const btnShowMsg = getControlById("button", "erp-button-show-message");
    if (btnShowMsg) {
      btnShowMsg.click();
    }
  }

  function showErrorMessage(error) {
    console.log(error);
    console.log(`error.message`); console.log(error.message);
  }

  return {
    createHttpClient,
    getArmConfigurationData,
    getArmConfiguration,
    saveArmConfiguration,
    transformDsToConfigModel,
    getControlById,
    getKineticAuthObjectFromParentWindowCookie,
    getKineticUserInfoFromLocalStorage
  };
})(axios);
