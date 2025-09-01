// uploadhandler.js
import multer from 'multer';
import slugify from 'slugify'; // Pra gerar slugs maneiros
import { Article } from './db.js'; // Seu modelo de artigo
import fs from 'fs/promises'; // Pra ler o arquivo upado

const storage = multer.memoryStorage(); // Armazena o arquivo em memória para processamento
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Garante que só arquivos .md sejam aceitos
        if (file.mimetype === 'text/markdown') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos Markdown (.md) são permitidos!'), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 10 // Limita o tamanho do arquivo a 10MB
    }
}).single('articleFile'); // 'articleFile' é o nome do input type="file" no HTML

async function uploadArticle(req, res) {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Erro no upload: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        // Verifique se o arquivo e o título são obrigatórios. Tags também.
        // short_description pode ser opcional.
        if (!req.file || !req.body.title || !req.body.tags) {
            return res.status(400).json({ error: 'Título, tags e o arquivo do artigo são obrigatórios!' });
        }

        // Adicione short_description aqui
        const { title, tags, short_description } = req.body; // <-- Pegando o short_description
        const markdownContent = req.file.buffer.toString('utf8');
        
        const generatedSlug = slugify(title, {
            lower: true,
            strict: true,
            locale: 'pt',
        });

        try {
            const existingArticle = await Article.findOne({ where: { slug: generatedSlug } });
            if (existingArticle) {
                return res.status(409).json({ error: `Já existe um artigo com o slug "${generatedSlug}". Por favor, escolha um título diferente.` });
            }

            // Salvar no banco de dados, incluindo short_description
            const newArticle = await Article.create({
                title: title,
                slug: generatedSlug,
                content: markdownContent,
                short_description: short_description || null, // <-- Passando o short_description (se não vier, salva null)
                tags: tags.split(',').map(tag => tag.trim()),
            });

            console.log('Artigo salvo com sucesso:', newArticle.toJSON());
            res.status(201).json({ message: 'Artigo enviado e salvo com sucesso!', article: newArticle.toJSON() });

        } catch (error) {
            console.error('Erro ao salvar artigo no DB:', error);
            res.status(500).json({ error: 'Erro interno do servidor ao salvar o artigo.' });
        }
    });
}

export { uploadArticle };