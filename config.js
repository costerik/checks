const staging = {
  httpPort: 3000,
  httpsPort: 3001,
  env: 'staging',
  hashingSecret: 'thisIsASecret',
  maxChecks: 5,
};

const production = {
  httpPort: 5000,
  httpsPort: 5001,
  env: 'production',
  hashingSecret: 'thisIsAlsoASecret',
  maxChecks: 5,
};

const environments = {
  staging,
  production,
};

module.exports = environments[(process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()) || 'staging'];
