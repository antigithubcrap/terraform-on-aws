import path = require('path');
import tl = require('vsts-task-lib/task');
import tr = require('vsts-task-lib/toolrunner');

async function run() {

    try {

        var templatesFilePath: string = tl.getPathInput('templatesFilePath', true, true);
        var commandPickList: string = tl.getInput('commandPickList', true);
        var terraformFilePath: string = tl.getPathInput('terraformFilePath', true, true);
        var validateTemplatesBoolean: boolean = tl.getBoolInput('validateTemplatesBoolean', false);
        var failOnStdErrBoolean: boolean = tl.getBoolInput('failOnStdErrBoolean', false);

        tl.cd(templatesFilePath);

        version(terraformFilePath, failOnStdErrBoolean);

        init(terraformFilePath, templatesFilePath, failOnStdErrBoolean);

        let terraformResult: number = 0;

        if (validateTemplatesBoolean) {
            
            validate(terraformFilePath, templatesFilePath, failOnStdErrBoolean);
        }

        switch (commandPickList) {
            case 'commandplan':
                plan(terraformFilePath, templatesFilePath, failOnStdErrBoolean);
                break;
            case 'commandapply':
                apply(terraformFilePath, templatesFilePath, failOnStdErrBoolean);
                break;
            case 'commanddestroy':
                destroy(terraformFilePath, templatesFilePath, failOnStdErrBoolean);
                break;
        }

        tl.setResult(tl.TaskResult.Succeeded, terraformResult.toString());
    }
    catch (e) {
        
        tl.setResult(tl.TaskResult.Failed, e.message);
    }
}

function version(terraformFilePath: string, failOnStdErrBoolean: boolean) {
    
        var terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);

        terraformCommand
            .arg('--version')
            .exec(<any>{ failOnStdErr: failOnStdErrBoolean });
}

function init(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean) {
    
    var manageStateBoolean: boolean = tl.getBoolInput('manageStateBoolean', false);
    var createBackendFileBoolean: boolean = tl.getBoolInput('createBackendFileBoolean', false);
    var awsRegionString: string = tl.getInput('awsRegionString', manageStateBoolean);
    var awsBucketNameString: string = tl.getInput('awsBucketNameString', manageStateBoolean);
    var awsBucketTargeFolderString: string = tl.getInput('awsBucketTargeFolderString', manageStateBoolean);

    var terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);

    terraformCommand.arg('init');

    if (manageStateBoolean) {

        if (createBackendFileBoolean) {
            
            tl.writeFile('backend.tf', 'terraform { backend "s3" {} }');
        }

        terraformCommand
            .arg('-backend-config=bucket=' + awsBucketNameString)
            .arg('-backend-config=key=' + awsBucketTargeFolderString + '/terraform.tfstate')
            .arg('-backend-config=region=' + awsRegionString)
            .arg('-input=false');
    }

    terraformCommand.exec(<any>{ failOnStdErr: failOnStdErrBoolean });
}

function validate(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean) {
    
    var validateTemplatesVariablesBoolean: boolean = tl.getBoolInput('validateTemplatesVariablesBoolean', false);
    var useVariablesFileBoolean: boolean = tl.getBoolInput('useVariablesFileBoolean', false);
    var variablesFilePath: string = tl.getPathInput('variablesFilePath', true, useVariablesFileBoolean);

    var terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);

    terraformCommand
                .arg('validate')
                .argIf(!validateTemplatesVariablesBoolean, '-check-variables=false')
                .argIf(useVariablesFileBoolean, '-var-file=' + variablesFilePath);

    var variables = getVariables();

    if (variables) {
        for (var a = 0; a < variables.length; a++) {
            terraformCommand.arg(variables[a].replace('-var ', '-var='));
        }
    }

    terraformCommand.exec(<any>{ failOnStdErr: failOnStdErrBoolean });
}

function plan(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean) {

    var saveGeneratedExecutionPlanBoolean: boolean = tl.getBoolInput('saveGeneratedExecutionPlanBoolean', false);
    var generatedExecutionPlanName: string = tl.getInput('generatedExecutionPlanName', saveGeneratedExecutionPlanBoolean);
    var useVariablesFileBoolean: boolean = tl.getBoolInput('useVariablesFileBoolean', false);
    var variablesFilePath: string = tl.getPathInput('variablesFilePath', true, useVariablesFileBoolean);
    
    var terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);

    terraformCommand
        .arg('plan')
        .argIf(saveGeneratedExecutionPlanBoolean, '-out=' + generatedExecutionPlanName);

    var variables = getVariables();

    if (variables) {
        
        for (var a = 0; a < variables.length; a++) {
            
            terraformCommand.arg(variables[a].replace('-var ', '-var='));
        }
    }

    terraformCommand
        .argIf(useVariablesFileBoolean, '-var-file=' + variablesFilePath)
        .arg('-input=false');

    return terraformCommand.exec(<any>{ failOnStdErr: failOnStdErrBoolean });
}

function apply(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean) {
    
    var useSavedExecutionPlanBoolean: boolean = tl.getBoolInput('useSavedExecutionPlanBoolean', false);
    var savedExecutionPlanName: string = tl.getInput('savedExecutionPlanName', useSavedExecutionPlanBoolean);
    var useVariablesFileBoolean: boolean = tl.getBoolInput('useVariablesFileBoolean', false);
    var variablesFilePath: string = tl.getPathInput('variablesFilePath', true, useVariablesFileBoolean);

    var terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);

    terraformCommand
            .arg('apply')
            .arg('-auto-approve');

    var variables = getVariables();

    if (variables && !useSavedExecutionPlanBoolean) {
        
        for (var a = 0; a < variables.length; a++) {
            
            terraformCommand.arg(variables[a].replace('-var ', '-var='));
        }
    }

    terraformCommand
        .argIf(useVariablesFileBoolean && !useSavedExecutionPlanBoolean, '-var-file=' + variablesFilePath)
        .arg('-input=false')
        .argIf(useSavedExecutionPlanBoolean, savedExecutionPlanName);

    return terraformCommand.exec(<any>{ failOnStdErr: failOnStdErrBoolean });
}

function destroy(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean) {
    
    var useVariablesFileBoolean: boolean = tl.getBoolInput('useVariablesFileBoolean', false);
    var variablesFilePath: string = tl.getPathInput('variablesFilePath', true, useVariablesFileBoolean);

    var terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);

    terraformCommand
        .arg('destroy')
        .arg('-force');

    var variables = getVariables();

    if (variables) {
        
        for (var a = 0; a < variables.length; a++) {
            
            terraformCommand.arg(variables[a].replace('-var ', '-var='));
        }
    }

    terraformCommand
        .argIf(useVariablesFileBoolean, '-var-file=' + variablesFilePath)
        .arg('-input=false');

    return terraformCommand.exec(<any>{ failOnStdErr: failOnStdErrBoolean });
}

function output(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean) {

    var terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);

    var outputJsonFormat: boolean = tl.getBoolInput('outputJsonFormat', false);

    terraformCommand
        .arg('output')
        .argIf(outputJsonFormat, '-json');

    return terraformCommand.exec(<any>{ failOnStdErr: failOnStdErrBoolean });
}

function getVariables() {
    
        var variablesMultiline: string = tl.getInput('variablesMultiline', false);

        return variablesMultiline !== null ? variablesMultiline.match(/\-var (\w+(\-{0,1}\w)*)+=.*[^\s]/gm) : null;
}

function isNullOrWhiteSpace(string: string) {
    if (string && string.match(/^ *$/) === null) { return false; }
    return true;
}

run();
