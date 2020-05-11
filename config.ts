type EnvironmentType = {
  httpPort: number;
  httpsPort: number;
  env: 'staging' | 'production';
  hashingSecret: string;
  maxChecks: number;
};

type EnvironmentsType = {
  [key: string]: EnvironmentType;
};

const staging: EnvironmentType = {
  httpPort: 3000,
  httpsPort: 3001,
  env: 'staging',
  hashingSecret: 'thisIsASecret',
  maxChecks: 5,
};

const production: EnvironmentType = {
  httpPort: 5000,
  httpsPort: 5001,
  env: 'production',
  hashingSecret: 'thisIsAlsoASecret',
  maxChecks: 5,
};

const environments: EnvironmentsType = {
  staging,
  development: staging,
  production,
};

console.log((process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()) || 'staging');
console.log(environments[(process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()) || 'staging']);

export default environments[(process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()) || 'staging'];
