type EnvironmentType = {
  httpPort: number;
  httpsPort: number;
  env: 'staging' | 'production';
  hashingSecret: string;
  maxChecks: number;
  twilio: {
    accountSid: string;
    authToken: string;
    fromPhone: string;
  };
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
  twilio: {
    accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006',
  },
};

const production: EnvironmentType = {
  httpPort: 5000,
  httpsPort: 5001,
  env: 'production',
  hashingSecret: 'thisIsAlsoASecret',
  maxChecks: 5,
  twilio: {
    accountSid: '',
    authToken: '',
    fromPhone: '',
  },
};

const environments: EnvironmentsType = {
  staging,
  development: staging,
  production,
};

console.log((process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()) || 'staging');
console.log(environments[(process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()) || 'staging']);

export default environments[(process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()) || 'staging'];
