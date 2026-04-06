const detectionConfig = {
    bruteForce: {
      threshold: 5,
      windowSec: 60,
      cooldownSec: 300
    },
    credentialStuffing: {
      threshold: 5,
      windowSec: 60,
      cooldownSec: 300
    },
    distributedAttack: {
      threshold: 5,
      windowSec: 60,
      cooldownSec: 300
    },
    possibleCompromise: {
      failedThreshold: 5,
      windowSec: 120,
      cooldownSec: 300
    },
    requestAbuse: {
      threshold: 100,
      windowSec: 60,
      cooldownSec: 120
    }
  };
  
  module.exports = detectionConfig;
