import { Article } from "./db.js";

export const lastest = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5; // Pega o limite da query string, padrão 5
        const articles = await Article.findAll({
            order: [['createdAt', 'DESC']], // Mais recentes primeiro
            limit: limit,
            attributes: ['title', 'slug', 'short_description', 'createdAt'], // Retorna apenas o que precisa
        });
        res.json(articles);
    } catch (error) {
        console.error('Erro ao buscar artigos para API:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
};

export const all = async (req, res) => {
    try {
        const articles = await Article.findAll({
            order: [['createdAt', 'DESC']], // Pode ordenar por data, título, etc.
            attributes: ['title', 'slug', 'short_description', 'tags', 'createdAt'], // Retorna o que precisa
        });
        res.json(articles);
    } catch (error) {
        console.error('Erro ao buscar todos os artigos para API:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
};