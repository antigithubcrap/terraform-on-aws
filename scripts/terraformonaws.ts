import path = require('path');
import tl = require('vsts-task-lib/task');
import tr = require('vsts-task-lib/toolrunner');

async function run() {
    try {
        var templatesFilePath: string = tl.getPathInput('templatesFilePath', true, true);
        var commandPickList: string = tl.getInput('commandPickList', true);
        var useVariablesFileBoolean: boolean = tl.getBoolInput('useVariablesFileBoolean', false);
        var variablesMultiline: string = tl.getInput('variablesMultiline', false);
        var variablesFilePath: string = tl.getPathInput('variablesFilePath', true, useVariablesFileBoolean);
        var manageStateBoolean: boolean = tl.getBoolInput('manageStateBoolean', false);
        var createBackendFileBoolean: boolean = tl.getBoolInput('createBackendFileBoolean', false);
        var awsRegionString: string = tl.getInput('awsRegionString', manageStateBoolean);
        var awsBucketNameString: string = tl.getInput('awsBucketNameString', manageStateBoolean);
        var awsBucketTargeFolderString: string = tl.getInput('awsBucketTargeFolderString', manageStateBoolean);
        var terraformFilePath: string = tl.getPathInput('terraformFilePath', true, true);
        var validateTemplatesBoolean: boolean = tl.getBoolInput('validateTemplatesBoolean', false);
        var failOnStdErrBoolean: boolean = tl.getBoolInput('failOnStdErrBoolean', false);

        tl.cd(templatesFilePath);

        var terraformVersion: tr.ToolRunner = tl.tool(terraformFilePath);
        var terraformInit: tr.ToolRunner = tl.tool(terraformFilePath);
        var terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);
        var terraformValidate: tr.ToolRunner = tl.tool(terraformFilePath);

        await terraformVersion.arg('--version').exec(<any>{ failOnStdErr: failOnStdErrBoolean });

        terraformInit.arg('init');

        if (manageStateBoolean) {

            if (createBackendFileBoolean) {
                tl.writeFile('backend.tf', 'terraform { backend "s3" {} }');
            }

            terraformInit
                .arg('-backend-config=bucket=' + awsBucketNameString)
                .arg('-backend-config=key=' + awsBucketTargeFolderString + '/terraform.tfstate')
                .arg('-backend-config=region=' + awsRegionString)
                .arg('-input=false');
        }

        if (commandPickList == 'commandplan') {
            terraformCommand
                .arg('plan');
        }
        else if (commandPickList == 'commandapply') {
            terraformCommand
                .arg('apply')
                .arg('-auto-approve');
        }

        var commandArgs = variablesMultiline.match(/\-var (\w+(\-{0,1}\w)*)+=.*[^\s]/gm);

        terraformCommand.argIf(useVariablesFileBoolean, '-var-file=' + variablesFilePath)

        if (commandArgs !== null) {
            for (var a = 0; a < commandArgs.length; a++) {
                terraformCommand.arg(commandArgs[a].replace('-var ', '-var='));
            }
        }

        terraformCommand.arg('-input=false');

        await terraformInit.exec(<any>{ failOnStdErr: failOnStdErrBoolean });

        if (validateTemplatesBoolean) {
            terraformValidate
                .arg('validate')
                .arg('-check-variables=true')
                .argIf(useVariablesFileBoolean, '-var-file=' + variablesFilePath);

            if (commandArgs !== null) {
                for (var a = 0; a < commandArgs.length; a++) {
                    terraformValidate.arg(commandArgs[a].replace('-var ', '-var='));
                }
            }

            await terraformValidate.exec(<any>{ failOnStdErr: failOnStdErrBoolean });
        }

        let terraformResult: number = await terraformCommand.exec(<any>{ failOnStdErr: failOnStdErrBoolean });

        tl.setResult(tl.TaskResult.Succeeded, terraformResult.toString());
    }
    catch (e) {
        tl.setResult(tl.TaskResult.Failed, e.message);
    }
}

function isNullOrWhiteSpace(string: string) {
    if (string && string.match(/^ *$/) === null) { return false; }
    return true;
}

run();