console.log("=== PADELMATE CREATE MATCH BERHASIL DIMUAT ===");
const API_URL = window.PADEL_API_URL || "http://localhost:3000";


// ========================================
// ELEMENT
// ========================================

const bookingSelect =
    document.getElementById("booking");

const matchTitle =
    document.getElementById("match-title");

const maxPlayers =
    document.getElementById("max-players");

const bookingDetail =
    document.getElementById("booking-detail");

const createButton =
    document.getElementById("create-match-btn");

const messageElement =
    document.getElementById("match-message");


let bookings = [];


// ========================================
// LOAD BOOKINGS
// ========================================

async function loadBookings() {

    console.log(
        "Memuat booking untuk Open Match..."
    );


    try {

        const currentUser =
            getCurrentUser();


        if (!currentUser) {

            showMessage(
                "Silakan login terlebih dahulu.",
                "error"
            );

            return;

        }


        const userId =
            Number(currentUser.id);


        console.log(
            "User login:",
            currentUser
        );


        console.log(
            "User ID:",
            userId
        );


        // ========================================
        // REQUEST BOOKING
        // ========================================

        const response =
            await fetch(
                `${API_URL}/api/bookings`
            );


        console.log(
            "Status API bookings:",
            response.status
        );


        if (!response.ok) {

            const errorData =
                await response.json().catch(
                    () => ({})
                );

            throw new Error(
                errorData.message ||
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Data booking dari API:",
            data
        );


        // ========================================
        // NORMALISASI RESPONSE
        // ========================================

        let allBookings = [];


        if (Array.isArray(data)) {

            allBookings = data;

        } else if (
            data &&
            Array.isArray(data.bookings)
        ) {

            allBookings =
                data.bookings;

        } else {

            throw new Error(
                "Format data booking tidak valid."
            );

        }


        console.log(
            "Semua booking:",
            allBookings
        );


        // ========================================
        // FILTER BOOKING USER
        // ========================================

        bookings =
            allBookings.filter(
                booking => {

                    return (
                        Number(
                            booking.user_id
                        ) === userId
                        &&
                        String(
                            booking.status
                        ).toLowerCase() ===
                        "confirmed"
                    );

                }
            );


        console.log(
            "Booking user yang confirmed:",
            bookings
        );


        // ========================================
        // RESET SELECT
        // ========================================

        bookingSelect.innerHTML = `

            <option value="">
                -- Pilih Booking --
            </option>

        `;


        // ========================================
        // TIDAK ADA BOOKING
        // ========================================

        if (bookings.length === 0) {

            bookingSelect.innerHTML = `

                <option value="">
                    Belum ada booking yang dapat digunakan
                </option>

            `;


            bookingDetail.innerHTML = `

                <p>
                    Buat booking terlebih dahulu
                    untuk membuat Open Match.
                </p>

            `;


            return;

        }


        // ========================================
        // TAMPILKAN BOOKING
        // ========================================

        bookings.forEach(
            booking => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    booking.id;


                option.textContent =
                    `#${booking.id} - ` +
                    `${booking.court_name || "Court"} - ` +
                    `${formatDate(
                        booking.booking_date
                    )} - ` +
                    `${formatTime(
                        booking.start_time
                    )} - ` +
                    `${formatTime(
                        booking.end_time
                    )}`;


                bookingSelect.appendChild(
                    option
                );

            }
        );


        console.log(
            "Booking berhasil dimasukkan ke dropdown."
        );

    } catch (error) {

        console.error(
            "Error load bookings:",
            error
        );


        bookingSelect.innerHTML = `

            <option value="">
                Gagal memuat booking
            </option>

        `;


        bookingDetail.innerHTML = `

            <p>
                ${error.message}
            </p>

        `;


        showMessage(
            "Gagal mengambil data booking.",
            "error"
        );

    }

}


// ========================================
// BOOKING SELECT
// ========================================

bookingSelect.addEventListener(
    "change",
    function () {

        const bookingId =
            Number(
                this.value
            );


        console.log(
            "Booking yang dipilih:",
            bookingId
        );


        const booking =
            bookings.find(
                item =>
                    Number(item.id) ===
                    bookingId
            );


        if (!booking) {

            bookingDetail.innerHTML = `

                <p>
                    Pilih booking untuk
                    melihat detail.
                </p>

            `;

            return;

        }


        const total =
            Number(
                booking.total_price
            ).toLocaleString(
                "id-ID"
            );


        bookingDetail.innerHTML = `

            <h3>
                ${booking.court_name || "Court"}
            </h3>


            <p>
                📅
                ${formatDate(
                    booking.booking_date
                )}
            </p>


            <p>
                🕐
                ${formatTime(
                    booking.start_time
                )}
                -
                ${formatTime(
                    booking.end_time
                )}
            </p>


            <p>
                💰
                Rp${total}
            </p>


            <p>
                Status:
                <strong>
                    ${booking.status}
                </strong>
            </p>

        `;

    }
);


// ========================================
// CREATE MATCH
// ========================================

createButton.addEventListener(
    "click",
    async function () {

        clearMessage();


        const bookingId =
            Number(
                bookingSelect.value
            );


        const title =
            matchTitle.value.trim();


        const players =
            Number(
                maxPlayers.value
            );


        // ========================================
        // VALIDASI BOOKING
        // ========================================

        if (!bookingId) {

            showMessage(
                "Silakan pilih booking terlebih dahulu.",
                "error"
            );

            return;

        }


        // ========================================
        // VALIDASI TITLE
        // ========================================

        if (!title) {

            showMessage(
                "Nama match wajib diisi.",
                "error"
            );

            return;

        }


        if (title.length < 3) {

            showMessage(
                "Nama match minimal 3 karakter.",
                "error"
            );

            return;

        }


        // ========================================
        // VALIDASI PLAYER
        // ========================================

        if (
            players < 2 ||
            players > 4
        ) {

            showMessage(
                "Jumlah pemain harus antara 2 sampai 4.",
                "error"
            );

            return;

        }


        // ========================================
        // CEK BOOKING
        // ========================================

        const selectedBooking =
            bookings.find(
                booking =>
                    Number(
                        booking.id
                    ) === bookingId
            );


        if (!selectedBooking) {

            showMessage(
                "Booking yang dipilih tidak ditemukan.",
                "error"
            );

            return;

        }


        try {

            createButton.disabled =
                true;


            createButton.textContent =
                "Creating...";


            // ========================================
            // CREATE MATCH
            // ========================================

            const response =
                await fetch(
                    `${API_URL}/api/matches`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                booking_id:
                                    bookingId,

                                title:
                                    title,

                                max_players:
                                    players

                            })
                    }
                );


            const result =
                await response.json();


            console.log(
                "Create match response:",
                result
            );


            // ========================================
            // ERROR
            // ========================================

            if (!response.ok) {

                showMessage(
                    result.message ||
                    "Gagal membuat Open Match.",
                    "error"
                );

                return;

            }


            // ========================================
            // SUCCESS
            // ========================================

            showMessage(
                `Open Match berhasil dibuat! Match ID: ${result.id}`,
                "success"
            );


            matchTitle.value =
                "";


            bookingSelect.value =
                "";


            bookingDetail.innerHTML = `

                <p>
                    Open Match berhasil dibuat.
                </p>

            `;


            // Refresh booking
            await loadBookings();


        } catch (error) {

            console.error(
                "Error create match:",
                error
            );


            showMessage(
                "Tidak dapat terhubung ke server.",
                "error"
            );


        } finally {

            createButton.disabled =
                false;


            createButton.textContent =
                "Create Open Match";

        }

    }
);


// ========================================
// FORMAT DATE
// ========================================

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "-";

    }


    const date =
        new Date(dateValue);


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Jakarta"
        }
    );

}


// ========================================
// FORMAT TIME
// ========================================

function formatTime(
    timeValue
) {

    if (!timeValue) {

        return "-";

    }


    return String(
        timeValue
    ).substring(0, 5);

}


// ========================================
// MESSAGE
// ========================================

function showMessage(
    message,
    type
) {

    messageElement.textContent =
        message;


    messageElement.className =
        `booking-message ${type}`;

}


function clearMessage() {

    messageElement.textContent =
        "";


    messageElement.className =
        "booking-message";

}


// ========================================
// START
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadBookings();

    }
);