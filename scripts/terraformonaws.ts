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

        await version(terraformFilePath, failOnStdErrBoolean);

        await init(terraformFilePath, templatesFilePath, failOnStdErrBoolean);

        let commandResult: number = 0;

        switch (commandPickList) {
            case 'commandplan':
                commandResult = await plan(terraformFilePath, templatesFilePath, failOnStdErrBoolean, validateTemplatesBoolean);
                break;
            case 'commandapply':
                commandResult = await apply(terraformFilePath, templatesFilePath, failOnStdErrBoolean, validateTemplatesBoolean);
                break;
            case 'commanddestroy':
                commandResult = await destroy(terraformFilePath, templatesFilePath, failOnStdErrBoolean, validateTemplatesBoolean);
                break;
            case 'commandoutput':
                commandResult = await output(terraformFilePath, templatesFilePath, failOnStdErrBoolean, validateTemplatesBoolean);
        }

        tl.setResult(tl.TaskResult.Succeeded, commandResult.toString());
    }
    catch (e) {
        
        tl.setResult(tl.TaskResult.Failed, e.message);
    }
}

async function version(terraformFilePath: string, failOnStdErrBoolean: boolean) {
    
    var terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);

    await terraformCommand
        .arg('--version')
        .exec(<any>{ failOnStdErr: failOnStdErrBoolean });
}

async function init(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean) {
    
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

    await terraformCommand.exec(<any>{ failOnStdErr: failOnStdErrBoolean });
}

async function validate(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean) {
    
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

    return terraformCommand.exec(<any>{ failOnStdErr: failOnStdErrBoolean });
}

async function plan(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean, validateTemplatesBoolean: boolean) {

    var saveGeneratedExecutionPlanBoolean: boolean = tl.getBoolInput('saveGeneratedExecutionPlanBoolean', false);
    var generatedExecutionPlanName: string = tl.getInput('generatedExecutionPlanName', saveGeneratedExecutionPlanBoolean);
    var useVariablesFileBoolean: boolean = tl.getBoolInput('useVariablesFileBoolean', false);
    var variablesFilePath: string = tl.getPathInput('variablesFilePath', true, useVariablesFileBoolean);
    var destroyPlanBoolean: boolean = tl.getBoolInput('destroyPlanBoolean', false);

    if (validateTemplatesBoolean) {

        let validationResult: number = await validate(terraformFilePath, templatesFilePath, failOnStdErrBoolean);

        console.log('Validation result: ' + validationResult);

        if (validationResult > 0) {

            tl.setResult(tl.TaskResult.Succeeded, validationResult.toString());

            return new Promise<number>((resolve) => { resolve(validationResult); });
        }
    }
    
    var terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);

    terraformCommand
        .arg('plan')
        .argIf(destroyPlanBoolean, '-destroy')
        .argIf(saveGeneratedExecutionPlanBoolean && !destroyPlanBoolean, '-out=' + generatedExecutionPlanName);

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

async function apply(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean, validateTemplatesBoolean: boolean) {
    
    var useSavedExecutionPlanBoolean: boolean = tl.getBoolInput('useSavedExecutionPlanBoolean', false);
    var savedExecutionPlanName: string = tl.getInput('savedExecutionPlanName', useSavedExecutionPlanBoolean);
    var useVariablesFileBoolean: boolean = tl.getBoolInput('useVariablesFileBoolean', false);
    var variablesFilePath: string = tl.getPathInput('variablesFilePath', true, useVariablesFileBoolean);

    if (validateTemplatesBoolean && !useSavedExecutionPlanBoolean) {

        let validationResult: number = await validate(terraformFilePath, templatesFilePath, failOnStdErrBoolean);

        console.log('Validation result: ' + validationResult);

        if (validationResult > 0) {

            tl.setResult(tl.TaskResult.Succeeded, validationResult.toString());

            return new Promise<number>((resolve) => { resolve(validationResult); });
        }
    }

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

async function destroy(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean, validateTemplatesBoolean: boolean) {
    
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

async function output(terraformFilePath: string, templatesFilePath: string, failOnStdErrBoolean: boolean, validateTemplatesBoolean: boolean) {

    let useJsonFormatBoolean: boolean = tl.getBoolInput('useJsonFormatBoolean', false);
    let outputVariablesMultiline: string = tl.getInput('outputVariablesMultiline', false);

    if (!outputVariablesMultiline) {

        console.log("No variables specified, performing a full output...");

        let terraformCommand: tr.ToolRunner = tl.tool(terraformFilePath);

        terraformCommand
            .arg('output')
            .argIf(useJsonFormatBoolean, '-json')
            .execSync(<any>{ failOnStdErr: failOnStdErrBoolean });
    }
    else {

        let variables2Set = outputVariablesMultiline.match(/.+=.*[^\s]/gm);

        if (variables2Set) {

            for (let a = 0; a < variables2Set.length; a++) {

                let terraformOutput: tr.ToolRunner = tl.tool(terraformFilePath);

                let output = terraformOutput
                    .arg('output')
                    .argIf(useJsonFormatBoolean, '-json')
                    .arg(variables2Set[a].split('=', 2)[1])
                    .execSync(<any>{ failOnStdErr: failOnStdErrBoolean });

                console.log('Setting ' + variables2Set[a].split('=', 2)[0] + ' variable with value: ' + output.stdout.replace(/[\r\n\t]/gm, ""));
                console.log("##vso[task.setvariable variable=" + variables2Set[a].split('=', 2)[0] + "]" + output.stdout.replace(/[\r\n\t]/gm, ""));
            }
        }

        let variables2Output = outputVariablesMultiline.match(/^[\w\-\.]+$/gm);

        if (variables2Output) {

            for (let a = 0; a < variables2Output.length; a++) {

                let terraformOutput: tr.ToolRunner = tl.tool(terraformFilePath);

                let output = terraformOutput
                    .arg('output')
                    .argIf(useJsonFormatBoolean, '-json')
                    .arg(variables2Output[a])
                    .execSync(<any>{ failOnStdErr: failOnStdErrBoolean });

                console.log("Variable " + output.stdout + ": " + variables2Output[a]);
            }
        }
    }

    return new Promise<number>((resolve) => { resolve(0); });
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
