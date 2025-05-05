require("dotenv").config();

const express = require("express");
const app = express();
const PORT = process.env.PORT;

const database = require("./database");

app.get("/api/products", (req, res) => {
    database.query("SELECT * FROM products", (error, results) => {
        if (error) {
            return res.status(500).json({ error: "An error occurred" });
        }

        res.json(results);
    });
});

app.get("/api/products/:id", (req, res) => {
    const productId = req.params.id;

    database.query(
        "SELECT * FROM products WHERE uri = ? LIMIT 1",
        [productId],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred" });
            }

            res.json(results);
        }
    );
});

// Returns 3 products from that category
app.get("/api/products/related/:id", (req, res) => {
    const category = req.params.id;

    database.query(
        "SELECT * FROM products WHERE category = ? LIMIT 4;",
        [category],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: "An error occurred" });
            }

            res.json(results);
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Middleware to parse JSON
app.use(express.json());

// Secret key for JWT
const JWT_SECRET = "your_jwt_secret_key";

// User signup
app.post("/api/signup", async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        database.query(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            [username, hashedPassword],
            (error, results) => {
                if (error) {
                    return res.status(500).json({ error: "User already exists" });
                }
                res.status(201).json({ message: "User created successfully" });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "An error occurred" });
    }
});

// User login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    database.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (error, results) => {
            if (error || results.length === 0) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const user = results[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
                expiresIn: "1h",
            });

            res.json({ token });
        }
    );
});

// Protected route example
app.get("/api/protected", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ message: "Protected data", user: decoded });
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});