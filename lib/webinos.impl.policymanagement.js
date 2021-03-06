/*******************************************************************************
 *  Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *******************************************************************************/
(function () {
    "use strict";

    var fs = require('fs');
    var xml2js = require('xml2js');
    var convert2xml = require('data2xml')({attrProp:'$'});
    var path = require('path');
    var webinosPath = require("webinos-utilities").webinosPath.webinosPath();
    var pmModule= require("webinos-policy");

    var policyFiles = [
        path.join(webinosPath, "policies/policy.xml")
    ];
    var rootPolicyFile = path.join(webinosPath, "policies/rootPolicy.xml")
    var policyTestFile = path.join(webinosPath, "policies/policy_tmp.xml");
    var policyTestRootFile = path.join(webinosPath, "policies/rootPolicy_tmp.xml");

    var dashboard = null;
    try {
        dashboard = require('webinos-dashboard');
    } catch (e) {
        logger.log("webinos Dashboard is not installed.");
    }
    if (dashboard != null) {
        dashboard.registerModule("policyeditor", "Policy Editor", path.join(__dirname, '../dashboard-policyeditor/'));
    }

    function getPolicy(id, successCB, errorCB) {
        console.log(id);
        console.log(policyFiles[id]);

        var xmlParser = new xml2js.Parser(xml2js.defaults['0.2']);
        var xmlPolicy = fs.readFileSync(policyFiles[id]);
        xmlParser.parseString(xmlPolicy, function(err, data) {
            if (data['policy-set'] !== undefined) {
                successCB(data['policy-set']);
            } else if (data['policy'] !== undefined) {
                successCB({'policy':[data['policy']]});
            } else {
                errorCB("Policy-set or policy not found");
            }
        });
    }

    function setPolicy(id, policy, successCB, errorCB) {
        var data = convert2xml('policy-set', JSON.parse(policy));
        fs.writeFileSync(policyFiles[id], data);
        pmModule.updatePolicyVersion();
        successCB(data);
    }

    function testPolicy(id, request, successCB, errorCB){
        console.log("******** TEST POLICY ********");

        var policyManager = new pmModule.policyManager(policyFiles[id]);
        policyManager.testRequest(JSON.parse(request), successCB);
    }

    function testNewPolicy(policy, request, successCB, errorCB){
        var data = convert2xml('policy-set', JSON.parse(policy));
        fs.writeFileSync(policyTestFile, data);
        var root = fs.readFileSync(rootPolicyFile, 'utf8');
        root = root.replace('policy.xml', 'policy_tmp.xml')
        fs.writeFileSync(policyTestRootFile, root);
        var tmpPolicyManager = new pmModule.policyManager(policyTestRootFile);
        tmpPolicyManager.testRequest(JSON.parse(request), function(res) {
            fs.unlinkSync(policyTestFile);
            fs.unlinkSync(policyTestRootFile);
            successCB(res);
        });
    }

    exports.getPolicy = getPolicy;
    exports.setPolicy = setPolicy;
    exports.testPolicy = testPolicy;
    exports.testNewPolicy = testNewPolicy;

})(module.exports);
