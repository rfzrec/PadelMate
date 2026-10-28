require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/database");
const { authRequired } = require("./auth");

const app = express();
app.use(cors());
app.use(express.json());


// ============================================================
// GET BOOKINGS (milik user yang login)
// ============================================================
app.get("/api/bookings", authRequired, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         bookings.id,
         bookings.user_id,
         bookings.court_id,
         bookings.booking_date,
         bookings.start_time,
         bookings.end_time,
         bookings.total_price,
         bookings.status,
         bookings.created_at,
         courts.name AS court_name,
         courts.type AS court_type,
         (SELECT matches.id FROM matches
            WHERE matches.booking_id = bookings.id
              AND matches.status != 'closed'
            LIMIT 1) AS match_id
       FROM bookings
       JOIN courts ON bookings.court_id = courts.id
       WHERE bookings.user_id = ?
       ORDER BY bookings.booking_date DESC, bookings.start_time DESC, bookings.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ message: "Gagal mengambil data booking", error: error.message });
  }
});

app.post(
    "/api/bookings",
    authRequired,
    async (req, res) => {

        try {

            const {
                court_id,
                booking_date,
                start_time,
                end_time
            } = req.body;


            const user_id =
                req.user.id;


            if (
                !court_id ||
                !booking_date ||
                !start_time ||
                !end_time
            ) {

                return res.status(400).json({

                    message:
                        "Semua data booking wajib diisi"

                });

            }


            // ====================================================
            // CEK USER
            // ====================================================

            const [users] =
                await db.query(
                    `
                    SELECT id

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
            // CEK COURT
            // ====================================================

            const [courts] =
                await db.query(
                    `
                    SELECT
                        id,
                        price_per_hour,
                        status

                    FROM courts

                    WHERE id = ?
                    `,
                    [
                        court_id
                    ]
                );


            if (
                courts.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Lapangan tidak ditemukan"

                });

            }


            if (
                courts[0].status ===
                "maintenance"
            ) {

                return res.status(400).json({

                    message:
                        "Lapangan sedang maintenance"

                });

            }


            // ====================================================
            // HITUNG DURASI
            // ====================================================

            const [
                startHour,
                startMinute
            ] =
                start_time
                    .split(":")
                    .map(Number);


            const [
                endHour,
                endMinute
            ] =
                end_time
                    .split(":")
                    .map(Number);


            const startMinutes =
                startHour * 60 +
                startMinute;


            const endMinutes =
                endHour * 60 +
                endMinute;


            const durationMinutes =
                endMinutes -
                startMinutes;


            if (
                durationMinutes <= 0
            ) {

                return res.status(400).json({

                    message:
                        "Waktu booking tidak valid. Jam selesai harus setelah jam mulai."

                });

            }


            // ====================================================
            // SMART SLOT AVAILABILITY
            // ====================================================

            const [conflicts] =
                await db.query(
                    `
                    SELECT id

                    FROM bookings

                    WHERE court_id = ?

                      AND booking_date = ?

                      AND status != 'cancelled'

                      AND start_time < ?

                      AND end_time > ?
                    `,
                    [
                        court_id,
                        booking_date,
                        end_time,
                        start_time
                    ]
                );


            if (
                conflicts.length > 0
            ) {

                return res.status(409).json({

                    message:
                        "Lapangan sudah dibooking pada waktu tersebut"

                });

            }


            // ====================================================
            // HITUNG HARGA
            // ====================================================

            const durationHours =
                durationMinutes / 60;


            const total_price =
                durationHours *
                Number(
                    courts[0]
                        .price_per_hour
                );


            // ====================================================
            // CREATE BOOKING
            // ====================================================

            const [result] =
                await db.query(
                    `
                    INSERT INTO bookings
                    (
                        user_id,
                        court_id,
                        booking_date,
                        start_time,
                        end_time,
                        total_price,
                        status
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'confirmed'
                    )
                    `,
                    [
                        user_id,
                        court_id,
                        booking_date,
                        start_time,
                        end_time,
                        total_price
                    ]
                );


            res.status(201).json({

                message:
                    "Booking berhasil dibuat",

                id:
                    result.insertId,

                total_price,

                status:
                    "confirmed"

            });

        } catch (error) {

            console.error(
                "Create booking error:",
                error
            );


            res.status(500).json({

                message:
                    "Gagal membuat booking",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// CANCEL BOOKING
// ============================================================

app.delete(
    "/api/bookings/:id",
    authRequired,
    async (req, res) => {

        let connection;


        try {

            const bookingId =
                req.params.id;


            connection =
                await db.getConnection();


            await connection.beginTransaction();


            // ====================================================
            // CEK BOOKING
            // ====================================================

            const [bookings] =
                await connection.query(
                    `
                    SELECT
                        id,
                        user_id,
                        status

                    FROM bookings

                    WHERE id = ?

                    FOR UPDATE
                    `,
                    [
                        bookingId
                    ]
                );


            if (
                bookings.length === 0
            ) {

                await connection.rollback();


                return res.status(404).json({

                    message:
                        "Booking tidak ditemukan"

                });

            }


            if (
                Number(
                    bookings[0].user_id
                ) !==
                Number(req.user.id)
            ) {

                await connection.rollback();


                return res.status(403).json({

                    message:
                        "Kamu hanya dapat membatalkan booking milikmu."

                });

            }


            if (
                bookings[0].status ===
                "cancelled"
            ) {

                await connection.rollback();


                return res.status(400).json({

                    message:
                        "Booking sudah dibatalkan"

                });

            }


            // ====================================================
            // CANCEL BOOKING
            // ====================================================

            await connection.query(
                `
                UPDATE bookings

                SET status = 'cancelled'

                WHERE id = ?
                `,
                [
                    bookingId
                ]
            );


            // ====================================================
            // TUTUP OPEN MATCH
            // ====================================================

            await connection.query(
                `
                UPDATE matches

                SET status = 'closed'

                WHERE booking_id = ?
                `,
                [
                    bookingId
                ]
            );


            await connection.commit();


            res.json({

                message:
                    "Booking berhasil dibatalkan",

                id:
                    Number(bookingId),

                status:
                    "cancelled"

            });

        } catch (error) {

            if (connection) {

                try {

                    await connection.rollback();

                } catch (
                    rollbackError
                ) {

                    console.error(
                        "Rollback error:",
                        rollbackError
                    );

                }

            }


            console.error(
                "Cancel booking error:",
                error
            );


            res.status(500).json({

                message:
                    "Gagal membatalkan booking",

                error:
                    error.message

            });

        } finally {

            if (connection) {

                connection.release();

            }

        }

    }
);


// ============================================================
// OPEN MATCH
// ============================================================


// ============================================================
// CREATE OPEN MATCH
// ============================================================

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", service: "booking-service", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", service: "booking-service", database: "disconnected", error: error.message });
  }
});

const PORT = Number(process.env.PORT || 3002);
app.listen(PORT, "0.0.0.0", () => console.log(`booking-service running on port ${PORT}`));
