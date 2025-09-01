import { Sequelize, DataTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(path.join(__filename));
console.log(path.join(__dirname, "..", "_db", 'database.sqlite'))
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, "..", "_db", 'database.sqlite'),
    logging: false,
});

const Article = sequelize.define('Article', {
    slug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    short_description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    tags: {
        type: DataTypes.STRING,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('tags');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('tags', JSON.stringify(value));
        },
    },
}, {
    timestamps: true,
});

export const initDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to DB has been established successfully.');
        await sequelize.sync();
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

export { Article };