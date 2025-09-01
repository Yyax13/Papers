import "dotenv/config"
import e from 'express';
import { articleViewer } from './reqhandler.js';
import { uploadArticle } from './uploadhandler.js';
import { all, lastest } from "./api.js";

const routes = e.Router()

routes.get("/articles/:slug", articleViewer);
routes.post("/api/articles", uploadArticle);
routes.get('/api/articles/latest', lastest);
routes.get('/api/articles/all', all);

export default routes
