# Install mkcert CA
mkcert -install

# Generate SSL certificates
$scriptDirectory = $PSScriptRoot
$certificatesDirectory = Join-Path $scriptDirectory "..\certificates"
mkcert -cert-file $certificatesDirectory\localhost+2.pem -key-file $certificatesDirectory\localhost+2-key.pem localhost 127.0.0.1 ::1