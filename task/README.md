# Terraform VSTS build/release task for AWS  

Run Terraform on the build agent linux host.  

The Terraform task allows you to:  

- Run Terraform common commands.  
- Manage Terraform's state in S3.  
- Read IAM permissions from the EC2's IAM Instance Profile.  

## Prerequisites  

- EC2 Instance with IAM's Instance Profile ([EC2 Role](https://www.terraform.io/docs/providers/aws/index.html)).  
- Pre-installed Terraform ([downloads](https://www.terraform.io/downloads.html)).  

## Task: Terraform on AWS  

### Display Name (required)  

Task's name

### Templates path (required)  

Path where Terraform templates are stored (also this path becomes the working folder).  

### Command (required)  

Terraform command to execute.  

- [Plan](https://www.terraform.io/docs/commands/plan.html)  
- [Apply](https://www.terraform.io/docs/commands/apply.html)  

### Variables  

Terraform variables (one per line to avoid incorrect configuration).  

Variables must be set with the pattern: -var name=value

- No leading spaces.
- No quotations (unless within the variable value).

>> Examples:
>>  
>> -var region=us-east-1  
>> -var string-with-spaces=This is a string with spaces!  
>> -var filepath=/one/path/file.txt  
>> -var path=\another\path

### Use variables file  

Option: Check if you want to use a variables file.  

#### Variables File Path (required)  

Path to variables file.  

### Manage State in S3  

Option: Check if you want to manage Terraform's state in S3.  

#### Create a S3 Backend File  

Option: Check if you want to create a backend file specification (backed.tf), if not, a S3 backend specification must exist.  

#### AWS Region (required)  

AWS region name  

#### AWS Bucket Name (required)  

AWS bucket name  

#### AWS Bucket Target Folder (required)  

AWS bucket target folder where to upload/download Terraform's state

----

**Advanced**  

### Terraform Path  

Path where Terraform executable is located, leave it empty if using environment variable (export).  

### Validate Templates  

Option: Check if you want template validation before using them ([terraform validate]((https://www.terraform.io/docs/commands/validate.html))).  

### Fail On Standard Error  

Option: Check if you want to fail this task if any errors are written to the StandardError stream.  

## IAM  

All IAM policies must be set before running this task.  
