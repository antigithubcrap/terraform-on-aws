# VSTS Terraform on AWS  

This is the home page for the VSTS Terraform on AWS (with best practices) task source code repositories.  

Terraform on AWS (with best practices) is a open-source and cross-platform VSTS task that enables terraforming capabilities over the AWS Cloud. It was created to provide an optimized and secure way to terraform on AWS.  

## Tools  

[TypeScript 2.9.2 or greater](https://www.npmjs.com/package/typescript)  

[tfx-cli 0.5.14 or greater](https://www.npmjs.com/package/tfx-cli)  

[Gulp 3.9.1 or greater](https://www.npmjs.com/package/gulp)  

[GraphicsMagick 1.3.28 or greater](http://www.graphicsmagick.org/)  

[Node 8.11.3 (LST) or greater (comes with NPM >=5.6.0)](https://nodejs.org/)  

## Get Started  

Just follow the next 4 tasks.  

### Download sources  

Type **git clone https://github.com/antigithubcrap/vsts-terraform-on-aws.git**  

### Compile  

Type **tsc** from the root of the task folder. That should have compiled all the **.ts** files.  

### Gulp  

Type **gulp** from the root of the task folder (install GraphicsMagick before gulping).  

### TFX  

Type **tfx extension create --manifest vss-extension.json** from the root of the task folder.  