// 建立sdk管理器與authentication client 2-legged token
const { SdkManagerBuilder } = require('@aps_sdk/autodesk-sdkmanager');
const { AuthenticationClient, Scopes } = require('@aps_sdk/authentication');
const { APS_CLIENT_ID, APS_CLIENT_SECRET } = require('../config.js');

const sdkManager = SdkManagerBuilder.create().build();
// 向aps authentication 申請token
const authenticationClient = new AuthenticationClient(sdkManager);

// 快取取得public token，不用每次都呼叫aps api
let _credentials = null;
// 取得public token方法
async function getPublicToken() {
    if (!_credentials || _credentials.expires_at < Date.now()) {
        _credentials = await authenticationClient.getTwoLeggedToken(APS_CLIENT_ID, APS_CLIENT_SECRET, [Scopes.ViewablesRead]);
        _credentials.expires_at = Date.now() + _credentials.expires_in * 1000;
    }
    return _credentials;
}

module.exports = {
    getPublicToken
};
