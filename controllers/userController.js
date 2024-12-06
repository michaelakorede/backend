const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const poolPromise = require('../models/dbConfig');
const sql = require('mssql');

// JWT secret key (use environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Register a new user
 */
const registerUser = async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const pool = await poolPromise;

        // Check if user already exists
        const userExists = await pool
            .request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        if (userExists.recordset.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into database
        await pool
            .request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .query('INSERT INTO Users (Username, Email, Password) VALUES (@username, @email, @password)');

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

/**
 * Login a user
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const pool = await poolPromise;

        // Fetch user by email
        const user = await pool
            .request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        if (user.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const userData = user.recordset[0];

        // Compare passwords
        const isMatch = await bcrypt.compare(password, userData.Password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: userData.Id, username: userData.Username, email: userData.Email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to login user' });
    }
};

/**
 * Get current user profile
 */
const getUserProfile = async (req, res) => {
    const userId = req.user.id; // Retrieved from middleware after JWT validation

    try {
        const pool = await poolPromise;

        // Fetch user by ID
        const user = await pool
            .request()
            .input('id', sql.Int, userId)
            .query('SELECT Id, Username, Email FROM Users WHERE Id = @id');

        if (user.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

module.exports = { registerUser, loginUser, getUserProfile };
