import { createApp } from "../src/app";

const app = createApp();

import { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
