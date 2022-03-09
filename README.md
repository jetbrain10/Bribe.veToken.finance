# Gauge Vote Incentivisation

A screen with a URL param to specify the reward_token
Then we just iterate through all the gauges and display if there is any claimable tokens
And an add reward option, where you just give a token address, and choose a gauge and amount

# Nribe NextJS website heroku deployment procedure

This is an instruction of deploying bribe.vetoken.finance on heroku


## Summary
 Three parts of the workflow as below 

  - Deploy to heroku
  - Add subdomain to heroku
  - Add DNS mapping on Cloudfare
  - Get SSL certificate from Cloudfare 
  - Convert heroku box to paid version(hobby), set up SSL certificate
  

## Procedure

### Local run
* get your project infra key from https://infura.io/, it is used in stores/connectors/connectors.js, make it env variable
```sh
export NEXT_PUBLIC_PROVIDER='key from infra project'
for example, 'https://rinkeby.infura.io/v3/bd80ce1ca1f94da48e151bb6868bb150'
```
```sh
 npm install
```
```sh
 npm run dev
```
* to check production build on local machine
```sh
 export PORT = 3000
 npm run build
 npm run start
```
* open brower at http://localhost:3000/ 

### Heroku deployment 
if deploy to current setup, please contact karen.

### Heroku deployment from scratch
https://github.com/mars/heroku-nextjs#production-deployment

* Add a heroku configuration variable via command line
```sh
 heroku config:set NEXT_PUBLIC_PROVIDER='key from infra project'
```
* Configure package.json, set the start stage script as "start": "node server.js" ,add node version and npm version if needed
```sh
"scripts": {
    "start": "next start -p $PORT"
  }
```
* Create the Heroku app
```sh
heroku create $APP_NAME
```
* Check Heroku app is setup 
```sh
git remote -v
```
* Commit changes and push to heroku 
```sh
git commit -m "add changes"
git push heroku master'
```

* login into heroku website  https://dashboard.heroku.com/apps, click the deployed app to convert to a hobby app
* follow https://devcenter.heroku.com/articles/custom-domains to add custom domain, get mapping and add to cloudfare DNS 
* follow https://support.cloudflare.com/hc/en-us/articles/205893698-Configure-Cloudflare-and-Heroku-over-HTTPS to create a certificate and add to heroku

