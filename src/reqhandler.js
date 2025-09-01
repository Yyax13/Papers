import path from 'path';
import fs from 'fs';
import { __dirname } from '../server.js';
import renderMarkdown from './parsemd.js';
import { Article } from './db.js';
import { Op } from 'sequelize';

const renderFullHtmlPage = (title, renderedMarkdownHtml, suggestionsHtml) => {
    return (fs.readFileSync(path.join(__dirname, "templates", "article.html")).toString("utf8"))
        .replaceAll("__insert_the_title_here", title)
        .replaceAll("__insert_suggestions_here", suggestionsHtml)
        .replaceAll("__insert_content_here", renderedMarkdownHtml)

    ;
    
};

async function articleViewer(req, res) {
    const { slug: articleName } = req.params;
    const articleSlug = articleName.toLowerCase().replaceAll(" ", "-");

    try {
        const article = await Article.findOne({ where: { slug: articleSlug } });
        if (!article) {
            return res.status(404).send((fs.readFileSync(path.join(__dirname, "templates", "404.html"))).toString("utf8"));
        }

        const renderedMarkdownHtml = await renderMarkdown(article.content);
        const suggestedArticles = await Article.findAll({
            where: { slug: { [Op.ne]: articleSlug } },
            order: [['createdAt', 'DESC']],
            limit: 5,

        });

        const suggestionsHtml = suggestedArticles.map(sugg => `
            <li><a href="/articles/${sugg.slug}">${sugg.title}</a></li>
        `).join('');

        const content = renderFullHtmlPage(article.title, renderedMarkdownHtml, suggestionsHtml);
        res.status(200).send(content);

    } catch (err) {
        console.error("Erro ao buscar artigo ou renderizar:", err);
        res.status(500).send(fs.readFileSync(path.join(__dirname, "templates", "500.html")).toString("utf8"));
    }
}

export { articleViewer };