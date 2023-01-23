import 'dotenv/config';

export default {
  mongoUrl: `mongodb://${process.env.MONGO_HOST_NAME}/${process.env.MONGO_DB_NAME}`,
};
