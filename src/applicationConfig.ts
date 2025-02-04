import { DateTime } from 'luxon';

interface OperationRestriction {
  readonly asset: string;
  readonly restrictionEnd: DateTime;
  readonly operation: 'swap' | 'liquidity';
}

interface ApplicationConfig {
  readonly api: string;
  readonly social: {
    readonly twitter: string;
    readonly telegram: string;
    readonly discord: string;
    readonly medium: string;
    readonly reddit: string;
  };
  readonly support: {
    readonly discord: string;
    readonly telegram: string;
  };
  readonly applicationTick: number;
  readonly hiddenAssets: string[];
  readonly blacklistedPools: string[];
  readonly operationsRestrictions: OperationRestriction[];
  readonly requestRetryCount: number;
  readonly iconsRepository: string;
}

export const applicationConfig: ApplicationConfig = {
  api: 'https://api.ergodex.io/v1/',
  requestRetryCount: 3,
  social: {
    twitter: 'https://twitter.com/ErgoDex',
    telegram: 'https://t.me/ergodex_community',
    discord: 'https://discord.com/invite/6MFFG4Fn4Y',
    medium: 'https://ergodex.medium.com/',
    reddit: 'https://www.reddit.com/r/ergodex/',
  },
  support: {
    discord: 'https://discord.gg/Jya72kjDfq',
    telegram: 'https://t.me/ergodex_community',
  },
  applicationTick: 10 * 1000,
  hiddenAssets: [],
  blacklistedPools: [
    'bee300e9c81e48d7ab5fc29294c7bbb536cf9dcd9c91ee3be9898faec91b11b6',
    '4e497db00769f6402580c351c092ec6ae0306f08575c7a9c719267c84049c840',
    '61a579c46d92f2718576fc9839a2a1983f172e889ec234af8504b5bbf10edd89',
    'e24d17f85ac406827b0436a648f3960d8965e677700949ff28ab0ca9a37dd50e',
  ],
  operationsRestrictions: [
    {
      asset: 'd71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413',
      restrictionEnd: DateTime.utc(2022, 2, 2, 19, 0, 0),
      operation: 'swap',
    },
  ],
  iconsRepository:
    'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master',
};
