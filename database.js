
const sqlite3 = require("sqlite3").verbose();
const sqlite = require("sqlite");

const dbPromise = sqlite.open({
    filename: "./books.db",
    driver: sqlite3.Database
});

async function initializeDatabase() {
    const db = await dbPromise;

    await db.exec(`
        CREATE TABLE IF NOT EXISTS book (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            price REAL NOT NULL,
            pages INTEGER
        )
    `);

    const result = await db.get("SELECT COUNT(*) AS count FROM book");

    if (result.count === 0) {
        const books = [
            ["Wings of Fire", "A.P.J. Abdul Kalam", 250, 180],
            ["The Alchemist", "Paulo Coelho", 300, 208],
            ["Atomic Habits", "James Clear", 450, 320],
            ["Rich Dad Poor Dad", "Robert Kiyosaki", 350, 336],
            ["The Power of Habit", "Charles Duhigg", 400, 371],
            ["Ikigai", "Hector Garcia", 200, 208],
            ["Think Like a Monk", "Jay Shetty", 380, 352],
            ["Deep Work", "Cal Newport", 420, 304],
            ["The 5 AM Club", "Robin Sharma", 390, 336],
            ["Mindset", "Carol Dweck", 320, 276]
        ];

        const statement = await db.prepare(
            "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)"
        );

        for (const book of books) {
            await statement.run(...book);
        }

        await statement.finalize();
    }

    console.log("Database initialized successfully!");
}

module.exports = {
    dbPromise,
    initializeDatabase
};
