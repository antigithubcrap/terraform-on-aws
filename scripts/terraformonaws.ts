import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');
import mod = require('./terraformonawsmod');

async function run() {
    try {
        console.log(process.env["PT7HOME"]);
        let tool: trm.ToolRunner;
        if (process.platform == 'win32') {
            let cmdPath = tl.which('cmd');
            tool = tl.tool(cmdPath).arg('/c').arg('echo ' + tl.getInput('samplestring', true));
        }
        else {
            let echoPath = tl.which('echo');
            tool = tl.tool(echoPath).arg(tl.getInput('samplestring', true));
        }

        let rc1: number = await tool.exec();

        if (rc1 == 0) {
            mod.sayHello();
        }

        console.log('Task done! ' + rc1);
    } catch (e) {
        tl.setResult(tl.TaskResult.Failed, e.message);
    }
}

run();