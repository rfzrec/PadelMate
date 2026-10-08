require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/database");
const { authRequired } = require("./auth");

const app = express();
app.use(cors());
app.use(express.json());

app.get(
    "/api/matches",
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT

                        matches.id,
                        matches.title,
                        matches.booking_id,
                        matches.max_players,
                        matches.status,

                        bookings.booking_date,
                        bookings.start_time,
                        bookings.end_time,
                        bookings.total_price,

                        courts.name AS court_name,

                        COUNT(
                            match_players.id
                        ) AS player_count

                    FROM matches

                    JOIN bookings
                        ON matches.booking_id =
                           bookings.id

                    JOIN courts
                        ON bookings.court_id =
                           courts.id

                    LEFT JOIN match_players
                        ON matches.id =
                           match_players.match_id

                    WHERE bookings.status =
                          'confirmed'

                      AND matches.status !=
                          'closed'

                    GROUP BY

                        matches.id,
                        matches.title,
                        matches.booking_id,
                        matches.max_players,
                        matches.status,
                        bookings.booking_date,
                        bookings.start_time,
                        bookings.end_time,
                        bookings.total_price,
                        courts.name

                    ORDER BY
                        matches.id DESC
                    `
                );


            res.json(rows);

        } catch (error) {

            console.error(
                "Get matches error:",
                error
            );


            res.status(500).json({

                message:
                    "Gagal mengambil data Open Match",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// GET DETAIL OPEN MATCH
// ============================================================


// ============================================================
// CREATE OPEN MATCH
// ============================================================
app.post("/api/matches", authRequired, async (req, res) => {
  let connection;
  try {
    const bookingId = Number(req.body.booking_id);
    const title = String(req.body.title || "").trim();
    const maxPlayers = Number(req.body.max_players || 4);

    if (!bookingId || !title) {
      return res.status(400).json({ message: "Booking dan nama match wajib diisi." });
    }
    if (title.length < 3) {
      return res.status(400).json({ message: "Nama match minimal 3 karakter." });
    }
    if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 4) {
      return res.status(400).json({ message: "Maksimal pemain harus 2 sampai 4." });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [bookings] = await connection.query(
      `SELECT id, user_id, status FROM bookings WHERE id = ? FOR UPDATE`,
      [bookingId]
    );
    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Booking tidak ditemukan." });
    }
    if (Number(bookings[0].user_id) !== Number(req.user.id)) {
      await connection.rollback();
      return res.status(403).json({ message: "Kamu hanya dapat membuat Open Match dari booking milikmu." });
    }
    if (bookings[0].status !== "confirmed") {
      await connection.rollback();
      return res.status(400).json({ message: "Booking harus berstatus confirmed." });
    }

    const [existing] = await connection.query(
      `SELECT id FROM matches WHERE booking_id = ? AND status != 'closed'`,
      [bookingId]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "Booking ini sudah memiliki Open Match." });
    }

    const [result] = await connection.query(
      `INSERT INTO matches (booking_id, title, max_players, status) VALUES (?, ?, ?, 'open')`,
      [bookingId, title, maxPlayers]
    );

    // Pembuat match otomatis menjadi pemain pertama.
    await connection.query(
      `INSERT INTO match_players (match_id, user_id) VALUES (?, ?)`,
      [result.insertId, req.user.id]
    );

    await connection.commit();
    res.status(201).json({
      message: "Open Match berhasil dibuat.",
      id: result.insertId,
      booking_id: bookingId,
      title,
      max_players: maxPlayers
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (e) { console.error("Rollback error:", e); }
    }
    console.error("Create match error:", error);
    res.status(500).json({ message: "Gagal membuat Open Match.", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.get(
    "/api/matches/:id",
    async (req, res) => {

        try {

            const [matches] =
                await db.query(
                    `
                    SELECT

                        matches.id,
                        matches.title,
                        matches.booking_id,
                        matches.max_players,
                        matches.status,

                        bookings.booking_date,
                        bookings.start_time,
                        bookings.end_time,
                        bookings.total_price,

                        courts.name AS court_name

                    FROM matches

                    JOIN bookings
                        ON matches.booking_id =
                           bookings.id

                    JOIN courts
                        ON bookings.court_id =
                           courts.id

                    WHERE matches.id = ?
                    `,
                    [
                        req.params.id
                    ]
                );


            if (
                matches.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Open Match tidak ditemukan"

                });

            }


            const [players] =
                await db.query(
                    `
                    SELECT

                        users.id,
                        users.name,
                        users.email,

                        match_players.joined_at

                    FROM match_players

                    JOIN users
                        ON match_players.user_id =
                           users.id

                    WHERE match_players.match_id = ?

                    ORDER BY
                        match_players.joined_at
                    `,
                    [
                        req.params.id
                    ]
                );


            // ====================================================
            // SPLIT PAYMENT
            // ====================================================

            const totalPrice =
                Number(
                    matches[0]
                        .total_price
                );


            const playerCount =
                players.length;


            const splitPayment =
                playerCount > 0
                    ? totalPrice /
                      playerCount
                    : totalPrice;


            res.json({

                ...matches[0],

                players,

                player_count:
                    playerCount,

                split_payment:
                    splitPayment

            });

        } catch (error) {

            console.error(
                "Get match detail error:",
                error
            );


            res.status(500).json({

                message:
                    "Gagal mengambil detail Open Match",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// JOIN OPEN MATCH
// ============================================================

app.post(
    "/api/matches/:id/join",
    authRequired,
    async (req, res) => {

        try {

            const user_id =
                req.user.id;


            // ====================================================
            // CEK MATCH
            // ====================================================

            const [matches] =
                await db.query(
                    `
                    SELECT
                        id,
                        max_players,
                        status

                    FROM matches

                    WHERE id = ?
                    `,
                    [
                        req.params.id
                    ]
                );


            if (
                matches.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Open Match tidak ditemukan"

                });

            }


            if (
                matches[0].status !==
                "open"
            ) {

                return res.status(400).json({

                    message:
                        "Open Match sudah tidak tersedia"

                });

            }


            // ====================================================
            // CEK BOOKING
            // ====================================================

            const [bookingCheck] =
                await db.query(
                    `
                    SELECT
                        status

                    FROM bookings

                    WHERE id = (
                        SELECT booking_id

                        FROM matches

                        WHERE id = ?
                    )
                    `,
                    [
                        req.params.id
                    ]
                );


            if (
                bookingCheck.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Booking untuk Open Match tidak ditemukan"

                });

            }


            if (
                bookingCheck[0].status !==
                "confirmed"
            ) {

                return res.status(400).json({

                    message:
                        "Booking sudah tidak aktif"

                });

            }


            // ====================================================
            // CEK USER
            // ====================================================

            const [users] =
                await db.query(
                    `
                    SELECT
                        id,
                        name

                    FROM users

                    WHERE id = ?
                    `,
                    [
                        user_id
                    ]
                );


            if (
                users.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "User tidak ditemukan"

                });

            }


            // ====================================================
            // CEK DUPLIKAT
            // ====================================================

            const [alreadyJoined] =
                await db.query(
                    `
                    SELECT id

                    FROM match_players

                    WHERE match_id = ?

                      AND user_id = ?
                    `,
                    [
                        req.params.id,
                        user_id
                    ]
                );


            if (
                alreadyJoined.length > 0
            ) {

                return res.status(409).json({

                    message:
                        "User sudah bergabung dalam match"

                });

            }


            // ====================================================
            // HITUNG PLAYER
            // ====================================================

            const [playerCount] =
                await db.query(
                    `
                    SELECT
                        COUNT(*) AS total

                    FROM match_players

                    WHERE match_id = ?
                    `,
                    [
                        req.params.id
                    ]
                );


            const currentPlayers =
                Number(
                    playerCount[0].total
                );


            if (
                currentPlayers >=
                matches[0].max_players
            ) {

                await db.query(
                    `
                    UPDATE matches

                    SET status = 'full'

                    WHERE id = ?
                    `,
                    [
                        req.params.id
                    ]
                );


                return res.status(400).json({

                    message:
                        "Open Match sudah penuh"

                });

            }


            // ====================================================
            // JOIN
            // ====================================================

            await db.query(
                `
                INSERT INTO match_players
                (
                    match_id,
                    user_id
                )

                VALUES (?, ?)
                `,
                [
                    req.params.id,
                    user_id
                ]
            );


            const newPlayerCount =
                currentPlayers + 1;


            // ====================================================
            // TOTAL PRICE
            // ====================================================

            const [bookingPrice] =
                await db.query(
                    `
                    SELECT
                        bookings.total_price

                    FROM matches

                    JOIN bookings
                        ON matches.booking_id =
                           bookings.id

                    WHERE matches.id = ?
                    `,
                    [
                        req.params.id
                    ]
                );


            const totalPrice =
                Number(
                    bookingPrice[0]
                        .total_price
                );


            const splitPayment =
                totalPrice /
                newPlayerCount;


            // ====================================================
            // FULL
            // ====================================================

            if (
                newPlayerCount >=
                matches[0].max_players
            ) {

                await db.query(
                    `
                    UPDATE matches

                    SET status = 'full'

                    WHERE id = ?
                    `,
                    [
                        req.params.id
                    ]
                );

            }


            res.status(201).json({

                message:
                    "Berhasil bergabung ke Open Match",

                player_count:
                    newPlayerCount,

                max_players:
                    matches[0].max_players,

                split_payment:
                    splitPayment

            });

        } catch (error) {

            console.error(
                "Join match error:",
                error
            );


            res.status(500).json({

                message:
                    "Gagal bergabung ke Open Match",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// LEAVE OPEN MATCH
// ============================================================

app.delete(
    "/api/matches/:id/leave",
    authRequired,
    async (req, res) => {

        try {

            const user_id =
                req.user.id;


            // ====================================================
            // CEK MATCH
            // ====================================================

            const [matches] =
                await db.query(
                    `
                    SELECT
                        id,
                        status

                    FROM matches

                    WHERE id = ?
                    `,
                    [
                        req.params.id
                    ]
                );


            if (
                matches.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Open Match tidak ditemukan"

                });

            }


            if (
                matches[0].status ===
                "closed"
            ) {

                return res.status(400).json({

                    message:
                        "Open Match sudah ditutup"

                });

            }


            // ====================================================
            // DELETE PLAYER
            // ====================================================

            const [result] =
                await db.query(
                    `
                    DELETE FROM match_players

                    WHERE match_id = ?

                      AND user_id = ?
                    `,
                    [
                        req.params.id,
                        user_id
                    ]
                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    message:
                        "User tidak tergabung dalam match"

                });

            }


            // ====================================================
            // HITUNG PLAYER
            // ====================================================

            const [playerCount] =
                await db.query(
                    `
                    SELECT
                        COUNT(*) AS total

                    FROM match_players

                    WHERE match_id = ?
                    `,
                    [
                        req.params.id
                    ]
                );


            const newPlayerCount =
                Number(
                    playerCount[0].total
                );


            // ====================================================
            // OPEN KEMBALI
            // ====================================================

            await db.query(
                `
                UPDATE matches

                SET status = 'open'

                WHERE id = ?
                `,
                [
                    req.params.id
                ]
            );


            res.json({

                message:
                    "Berhasil keluar dari Open Match",

                player_count:
                    newPlayerCount

            });

        } catch (error) {

            console.error(
                "Leave match error:",
                error
            );


            res.status(500).json({

                message:
                    "Gagal keluar dari Open Match",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", service: "match-service", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", service: "match-service", database: "disconnected", error: error.message });
  }
});

const PORT = Number(process.env.PORT || 3003);
app.listen(PORT, "0.0.0.0", () => console.log(`match-service running on port ${PORT}`));
