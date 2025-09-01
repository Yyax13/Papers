import e from "express";
import cors from 'cors';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
if (!(fs.existsSync(path.join(__dirname, "_db")))) {
    fs.mkdirSync(path.join(__dirname, "_db"))
    
}

const app = e()
app.use(cors());
app.use(e.json());
app.use('/styles', e.static(path.join(__dirname, 'public', 'styles')));

import routes from "./src/routes.js";
import { initDb } from "./src/db.js";

initDb()
app.use(routes)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));

});

app.get('/upload', (req, res, next) => {
    const auth = req.query[process.env.AHeader] == process.env.AHVal
    if (auth) {
        next()
        return
    
    } else {
        res.status(404).send((fs.readFileSync(path.join(__dirname, "templates", "404.html"))).toString("utf8"))
        return

    }

}, (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'upload-article.html'));

});

app.get('/articles', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'articles-index.html'));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'templates', '404.html'));

})

app.listen("8080", () => {
    console.log("LISTENING IN PORT 8080: http://0.0.0.0:8080")

})
