const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

(async () => {
  try {
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const options = {
      keySize: 2048,
      days: 365,
      algorithm: 'sha256',
      extensions: [{ name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }, { type: 7, ip: '127.0.0.1' }] }],
    };

    const certs = await selfsigned.generate(attrs, options);
    const certDir = path.resolve(__dirname, '..', 'certs');
    fs.mkdirSync(certDir, { recursive: true });

    const keyPath = path.join(certDir, 'localhost.key');
    const certPath = path.join(certDir, 'localhost.crt');

    fs.writeFileSync(keyPath, certs.private);
    fs.writeFileSync(certPath, certs.cert);

    console.log('Wrote cert files:');
    console.log('  key:', keyPath);
    console.log('  cert:', certPath);
  } catch (error) {
    console.error('Certificate generation failed:', error);
    process.exit(1);
  }
})();
