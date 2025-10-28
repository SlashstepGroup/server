$scriptDirectory = $PSScriptRoot
$secretsDirectory = Join-Path $scriptDirectory "..\secrets"
openssl rsa -in $secretsDirectory\private_key.pem -pubout -out $secretsDirectory\public_key.pem