import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8002;

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

app.use(routes);

app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`rental-service listening on ${PORT}`);
});
