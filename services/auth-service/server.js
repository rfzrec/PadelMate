require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./config/database");
const crypto = require("crypto");
const { createToken, authRequired } = require("./auth");
const app = express();

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}
function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    if (!stored || !stored.includes(":")) return resolve(password === stored);
    const [salt, key] = stored.split(":");
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      const expected = Buffer.from(key, "hex");
      resolve(expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey));
    });
  });
}

app.use(cors());
app.use(express.json());

app.post(
    "/api/auth/register",
    async (req, res) => {

        try {

            const {
                name,
                email,
                password
            } = req.body;


            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "Nama, email, dan password wajib diisi."

                });

            }


            if (
                password.length < 6
            ) {

                return res.status(400).json({

                    message:
                        "Password minimal 6 karakter."

                });

            }


            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();


            const cleanName =
                name.trim();


            if (
                cleanName.length < 2
            ) {

                return res.status(400).json({

                    message:
                        "Nama minimal 2 karakter."

                });

            }


            // CEK EMAIL

            const [existing] =
                await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE email = ?
                    `,
                    [
                        normalizedEmail
                    ]
                );


            if (
                existing.length > 0
            ) {

                return res.status(409).json({

                    message:
                        "Email sudah terdaftar."

                });

            }


            // HASH PASSWORD

            const passwordHash =
                await hashPassword(
                    password
                );


            // INSERT USER

            const [result] =
                await db.query(
                    `
                    INSERT INTO users
                    (
                        name,
                        email,
                        password,
                        role
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        'user'
                    )
                    `,
                    [
                        cleanName,
                        normalizedEmail,
                        passwordHash
                    ]
                );


            const user = {

                id:
                    result.insertId,

                name:
                    cleanName,

                email:
                    normalizedEmail,

                role:
                    "user"

            };


            const token =
                createToken(user);


            res.status(201).json({

                message:
                    "Registrasi berhasil.",

                user,

                token

            });

        } catch (error) {

            console.error(
                "Register error:",
                error
            );


            res.status(500).json({

                message:
                    "Gagal melakukan registrasi."

            });

        }

    }
);


// ============================================================
// LOGIN
// ============================================================

app.post(
    "/api/auth/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "Email dan password wajib diisi."

                });

            }


            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();


            const [rows] =
                await db.query(
                    `
                    SELECT
                        id,
                        name,
                        email,
                        password,
                        role

                    FROM users

                    WHERE email = ?
                    `,
                    [
                        normalizedEmail
                    ]
                );


            if (
                rows.length === 0
            ) {

                return res.status(401).json({

                    message:
                        "Email atau password salah."

                });

            }


            const row =
                rows[0];


            const valid =
                await verifyPassword(
                    password,
                    row.password
                );


            if (!valid) {

                return res.status(401).json({

                    message:
                        "Email atau password salah."

                });

            }


            // Upgrade akun lama
            // yang masih plaintext.

            if (
                !row.password.includes(":")
            ) {

                const upgraded =
                    await hashPassword(
                        password
                    );


                await db.query(
                    `
                    UPDATE users

                    SET password = ?

                    WHERE id = ?
                    `,
                    [
                        upgraded,
                        row.id
                    ]
                );

            }


            const user = {

                id:
                    row.id,

                name:
                    row.name,

                email:
                    row.email,

                role:
                    row.role

            };


            const token =
                createToken(user);


            res.json({

                message:
                    "Login berhasil.",

                user,

                token

            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            res.status(500).json({

                message:
                    "Gagal melakukan login."

            });

        }

    }
);


// ============================================================
// CURRENT USER
// ============================================================

app.get(
    "/api/auth/me",
    authRequired,
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT
                        id,
                        name,
                        email,
                        role,
                        created_at

                    FROM users

                    WHERE id = ?
                    `,
                    [
                        req.user.id
                    ]
                );


            if (
                rows.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "User tidak ditemukan."

                });

            }


            res.json(rows[0]);

        } catch (error) {

            console.error(
                "Profile error:",
                error
            );


            res.status(500).json({

                message:
                    "Gagal mengambil profil."

            });

        }

    }
);


// ============================================================
// FRONTEND
// ============================================================

// const frontendPath = path.join(__dirname, "../../frontend");
// app.use(
//     express.static(
//         frontendPath
//     )
// );


// ============================================================
// HOME
// ============================================================

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", service: "auth-service", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", service: "auth-service", database: "disconnected", error: error.message });
  }
});

const PORT = Number(process.env.PORT || 3004);
app.listen(PORT, "0.0.0.0", () => console.log(`auth-service running on port ${PORT}`));
