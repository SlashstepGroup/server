# Install mkcert
MKCERT_VERSION="v1.4.4"
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/${MKCERT_VERSION}/mkcert-${MKCERT_VERSION}-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/mkcert

# Install mkcert CA
mkcert -install

# Generate SSL certificates
cd certificates
mkcert localhost 127.0.0.1 ::1