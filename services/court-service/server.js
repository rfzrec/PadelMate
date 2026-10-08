require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/database");
const { authRequired } = require("./auth");

const app = express();
app.use(cors());
app.use(express.json());


function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Hanya admin yang dapat mengelola lapangan." });
  }
  next();
}

// ============================================================
// GET ALL COURTS (publik)
// ============================================================
app.get("/api/courts", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, type, price_per_hour, status, created_at
       FROM courts
       ORDER BY id ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Get courts error:", error);
    res.status(500).json({ message: "Gagal mengambil data lapangan", error: error.message });
  }
});

// ============================================================
// GET COURT DETAIL (publik)
// ============================================================
app.get("/api/courts/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, type, price_per_hour, status, created_at
       FROM courts WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Lapangan tidak ditemukan" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Get court error:", error);
    res.status(500).json({ message: "Gagal mengambil data lapangan", error: error.message });
  }
});

// ============================================================
// UPDATE COURT (admin)
// ============================================================
app.put("/api/courts/:id", authRequired, adminOnly, async (req, res) => {
  try {
    const { name, type, price_per_hour, status } = req.body;
    if (!name || !price_per_hour) {
      return res.status(400).json({ message: "Nama dan harga lapangan wajib diisi" });
    }
    if (status && !["available", "maintenance"].includes(status)) {
      return res.status(400).json({ message: "Status lapangan tidak valid" });
    }
    const [result] = await db.query(
      `UPDATE courts
       SET name = ?, type = ?, price_per_hour = ?, status = ?
       WHERE id = ?`,
      [name.trim(), type || "Outdoor", price_per_hour, status || "available", req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Lapangan tidak ditemukan" });
    }
    res.json({ message: "Lapangan berhasil diperbarui" });
  } catch (error) {
    console.error("Update court error:", error);
    res.status(500).json({ message: "Gagal memperbarui lapangan", error: error.message });
  }
});

app.post(
    "/api/courts",
    authRequired,
    adminOnly,
    async (req, res) => {

        try {

            const {
                name,
                type,
                price_per_hour,
                status
            } = req.body;


            if (
                !name ||
                !price_per_hour
            ) {

                return res.status(400).json({

                    message:
                        "Nama dan harga lapangan wajib diisi"

                });

            }


            const [result] =
                await db.query(
                    `
                    INSERT INTO courts
                    (
                        name,
                        type,
                        price_per_hour,
                        status
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        name.trim(),
                        type || "Outdoor",
                        price_per_hour,
                        status || "available"
                    ]
                );


            res.status(201).json({

                message:
                    "Lapangan berhasil ditambahkan",

                id:
                    result.insertId

            });

        } catch (error) {

            console.error(
                "Create court error:",
                error
            );


            res.status(500).json({

                message:
                    "Gagal menambahkan lapangan",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// DELETE COURT
// ============================================================

app.delete(
    "/api/courts/:id",
    authRequired,
    adminOnly,
    async (req, res) => {

        try {

            const [result] =
                await db.query(
                    `
                    DELETE FROM courts

                    WHERE id = ?
                    `,
                    [
                        req.params.id
                    ]
                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    message:
                        "Lapangan tidak ditemukan"

                });

            }


            res.json({

                message:
                    "Lapangan berhasil dihapus"

            });

        } catch (error) {

            console.error(
                "Delete court error:",
                error
            );

            if (error.code === "ER_ROW_IS_REFERENCED_2") {
                return res.status(409).json({
                    message:
                        "Lapangan tidak dapat dihapus karena sudah memiliki booking"
                });
            }


            res.status(500).json({

                message:
                    "Gagal menghapus lapangan",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// BOOKINGS
// ============================================================


// ============================================================
// GET ALL BOOKINGS
// ============================================================

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", service: "court-service", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", service: "court-service", database: "disconnected", error: error.message });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, "0.0.0.0", () => console.log(`court-service running on port ${PORT}`));
