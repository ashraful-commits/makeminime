export function getEnv() {
  return {
    BG_REMOVER_API_KEY: process.env.BG_REMOVER_API_KEY,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CONSUMER_KEY_TEST: process.env.CONSUMER_KEY_TEST,
    CONSUMER_SECRET_TEST: process.env.CONSUMER_SECRET_TEST,
    SITE_URL: process.env.SITE_URL,
    APP_URL: process.env.APP_URL,
  };
}
