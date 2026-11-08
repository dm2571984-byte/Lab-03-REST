
const express = require("express");
const { dbPromise, initializeDatabase } = require("./database");

const app = express();
const PORT = 3000;

app.use(express.json());

// HOME PAGE
app.get("/", (req, res) => {
    res.send("Welcome to Sai Rashmitha's Lab 3 REST API!");
});

// GET all books with search, sorting, pagination and price filter
app.get("/books", async (req, res) => {
    try {
        const db = await dbPromise;

        const {
            search_q = "",
            order_by = "id",
            order = "ASC",
            limit = "10",
            offset = "0",
            min_price,
            max_price
        } = req.query;

        const allowedColumns = ["id", "title", "author", "price", "pages"];

        const sortColumn = allowedColumns.includes(order_by)
            ? order_by
            : "id";

        const sortOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

        const pageLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
        const pageOffset = Math.max(parseInt(offset) || 0, 0);

        let sql = "SELECT * FROM book WHERE title LIKE ?";
        const params = [`%${search_q}%`];

        if (min_price !== undefined && max_price !== undefined) {
            const min = Number(min_price);
            const max = Number(max_price);

            if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
                return res.status(400).json({
                    message: "Invalid price range"
                });
            }

            sql += " AND price BETWEEN ? AND ?";
            params.push(min, max);
        } else {
            if (min_price !== undefined) {
                const min = Number(min_price);

                if (!Number.isFinite(min)) {
                    return res.status(400).json({
                        message: "Invalid minimum price"
                    });
                }

                sql += " AND price >= ?";
                params.push(min);
            }

            if (max_price !== undefined) {
                const max = Number(max_price);

                if (!Number.isFinite(max)) {
                    return res.status(400).json({
                        message: "Invalid maximum price"
                    });
                }

                sql += " AND price <= ?";
                params.push(max);
            }
        }

        sql += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
        params.push(pageLimit, pageOffset);

        const books = await db.all(sql, params);

        res.status(200).json({
            message: "Books retrieved successfully",
            count: books.length,
            books
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve books"
        });
    }
});

// GET book by ID
app.get("/books/:id", async (req, res) => {
    try {
        const db = await dbPromise;

        const book = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [req.params.id]
        );

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            message: "Book retrieved successfully",
            book
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve book"
        });
    }
});

// POST create a new book
app.post("/books", async (req, res) => {
    try {
        const { title, author, price, pages } = req.body;

        if (
            typeof title !== "string" || !title.trim() ||
            typeof author !== "string" || !author.trim() ||
            price === undefined || price === null ||
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            return res.status(400).json({
                message: "Title, author and a valid numeric price are required"
            });
        }

        if (
            pages !== undefined &&
            (!Number.isInteger(pages) || pages < 1)
        ) {
            return res.status(400).json({
                message: "Pages must be a positive integer"
            });
        }

        const db = await dbPromise;

        const result = await db.run(
            "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)",
            [title.trim(), author.trim(), price, pages ?? null]
        );

        const newBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [result.lastID]
        );

        res.status(201).json({
            message: "Book created successfully",
            book: newBook
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create book"
        });
    }
});

// PUT update a book
app.put("/books/:id", async (req, res) => {
    try {
        const { title, author, price, pages } = req.body;

        if (
            typeof title !== "string" || !title.trim() ||
            typeof author !== "string" || !author.trim() ||
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            return res.status(400).json({
                message: "Title, author and valid numeric price are required"
            });
        }

        if (
            pages !== undefined &&
            (!Number.isInteger(pages) || pages < 1)
        ) {
            return res.status(400).json({
                message: "Pages must be a positive integer"
            });
        }

        const db = await dbPromise;

        const result = await db.run(
            `UPDATE book
             SET title = ?, author = ?, price = ?, pages = ?
             WHERE id = ?`,
            [title.trim(), author.trim(), price, pages ?? null, req.params.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            message: "Book updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update book"
        });
    }
});

// DELETE a book
app.delete("/books/:id", async (req, res) => {
    try {
        const db = await dbPromise;

        const result = await db.run(
            "DELETE FROM book WHERE id = ?",
            [req.params.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            message: "Book deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete book"
        });
    }
});

// START SERVER AFTER DATABASE INITIALIZATION
async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log("Database initialized successfully!");
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error);
    }
}

startServer();
