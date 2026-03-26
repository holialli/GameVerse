const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

const getProductionSecrets = async () => {
  const secretName = process.env.AWS_SECRET_NAME || 'prod/Gameverse';

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  if (!response.SecretString) {
    throw new Error('SecretString is empty for configured AWS secret');
  }

  return JSON.parse(response.SecretString);
};

module.exports = {
  getProductionSecrets,
};
