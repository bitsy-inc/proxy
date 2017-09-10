# Bitsy Proxy

The Bitsy Proxy is a man in the middle proxy to test compression and decompression of HTTP requests against any real world API, website or service.

Bitsy was a project myself (@braydo25) and Nasa Rouf (@nasarouf) had worked on over the course of about a month. We wanted to try different approaches for optimizing data transfer between client / server, specifically starting with JSON data transfer, although we knew this tech could apply to any data with inferrable structure. For our proof of concept, we focused specifically on JSON responses from API's like Instagram and Facebook. We noticed that common approaches for data transfer savings overlooks the recurring redundant response structures for a given response from a given API endpoint. 

With Bitsy, once a response from some endoint has been received by the client for the first time, a client can determine a rough model of the next expected response structure of the endpoint for future requests. We can confirm the expected response structure by sending a small hash of the response structure the client extrapolated to the server. The server can take this hash and verify that we can exclude the response structure in the current response. If the response the server would send does not have a structure hash of the one we included in our request, it'll send the entire response with structure included - the client can then improve upon the accuracy of it's model for a given endpoint with each subsequent request, eventually getting to a point where all requests have known response structure models, saving large amounts of throughput.

This proxy is a rough proof of concept, we've primarily trialed it while browsing Instagram via our web browser, routing all requests through the proxy - or using Facebook messenger (Any service will work though). We typically saw savings of data throughput well over 50% just after the first few minutes of browsing once the models for common API endpoint requests had been built.

If you want to take a look at the meat of the codebase that does the heavy lifting, check out  the /libs/compression/models/jsonModel.js file.

Also, check out the index.js file - you can configure a handful of things there, like which content type's to run the modeling & caching algorithms on a so-forth.

Here's a screenshot of data savings from the Instagram timeline endpoint.

![Savings Screenshot](https://ibb.co/iKCNZF)

## Installation

1. Go to terminal, cd to the Bitsy-Proxy directory.
2. run `npm install`

## Running It

1. Open the terminal, cd to Bitsy-Proxy directory.
2. Run `sudo node index.js`
3. This will start the proxy on whichever port is specified in index.js - by default this is port 8080.
4. You'll need to trust the generated root certificate on the machine that will be connected to the proxy, even if the machine is the same as the one running the proxy.
5. You can now proxy through the IP address of the machine running the proxy on whatever port you're running it on. By default that will be port 8080.
6. You can watch the terminal window running the node index.js process. As you browse, it'll show real time savings per request made. 

## Trusting the generated root certificate to work with SSL.

1. After running the proxy, a .http-mitm-proxy directory will be created in the Bitsy-Proxy directory.
2. Open .http-mitm-proxy/certs, look for ca.pem - this is the root certificate your machine or device must trust.
