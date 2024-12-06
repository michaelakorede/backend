const poolPromise = require('../models/dbConfig');

const getProducts = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Products');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

const getProductById = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { id } = req.params;
        const result = await pool
            .request()
            .input('Id', sql.Int, id)
            .query('SELECT * FROM Products WHERE Id = @Id');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

module.exports = { getProducts, getProductById };
