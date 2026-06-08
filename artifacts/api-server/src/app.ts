import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieSession from "cookie-session";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "session",
    secret: process.env.SESSION_SECRET ?? "fallback-dev-secret",
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  }),
);

app.use("/api", router);

const frontendDist = path.resolve(process.cwd(), "artifacts/student-portal/dist/public");
app.use(express.static(frontendDist));

app.get("{*splat}", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

export default app;
