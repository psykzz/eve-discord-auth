'use strict';

module.exports = {
  SSO_CLIENT_ID: process.env.SSO_CLIENT_ID,
  SSO_SECRET_KEY: process.env.SSO_SECRET_KEY,
  SSO_CALLBACK_URL: process.env.SSO_CALLBACK_URL,
  MONGO_URL: process.env.MONGO_URL ,
  EVE_CORP_ID: process.env.EVE_CORP_ID,
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CORP_ROLE: process.env.DISCORD_CORP_ROLE,
  DISCORD_ALLIANCE_ROLE: process.env.DISCORD_ALLIANCE_ROLE,
  APP_URL: process.env.APP_URL,
  LISTEN_PORT: process.env.LISTEN_PORT || process.env.PORT || "3000"
};
