# Bitsy Proxy

The Bitsy Proxy is a man in the middle proxy to test compression and decompression of HTTP requests against any real world API, website or service.

## Installation

1. Go to terminal, cd to the Bitsy-Proxy directory.
2. run `npm install`

## Running It

1. Open the terminal, cd to Bitsy-Proxy directory.
2. Run `sudo node index.js`
3. This will start the proxy on whichever port is specified in index.js - by default this is port 8080.
4. You'll need to trust the generated root certificate on the machine that will be connected to the proxy, even if the machine is the same as the one running the proxy.
5. You can now proxy to through the IP address of the machine running the proxy on whatever port you're running it on. By default that will be port 8080.

## Trusting the generated root certificate to work with SSL.

1. After running the proxy, a .http-mitm-proxy directory will be created in the Bitsy-Proxy directory.
2. Open .http-mitm-proxy/certs, look for ca.pem - this is the root certificate your machine or device must trust.
