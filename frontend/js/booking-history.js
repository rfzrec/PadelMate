console.log("=== PADELMATE BOOKING HISTORY BERHASIL DIMUAT ===");

const API_URL = window.PADEL_API_URL || "http://localhost:3000";


// ======================================================
// ELEMENT
// ======================================================

const bookingList =
    document.getElementById("booking-list");


// ======================================================
// LOAD BOOKINGS
// ======================================================

async function loadBookings() {

    console.log("Memuat booking history...");

    try {

        // API_URL dan authentication
        // berasal dari auth.js
        const response =
            await fetch(`${API_URL}/api/bookings`);


        console.log(
            "Status API bookings:",
            response.status
        );


        if (!response.ok) {

            const errorData =
                await response.json().catch(() => ({}));

            throw new Error(
                errorData.message ||
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Data bookings dari API:",
            data
        );


        // ==================================================
        // NORMALISASI RESPONSE
        // ==================================================

        let bookings = [];


        if (Array.isArray(data)) {

            bookings = data;

        } else if (
            data &&
            Array.isArray(data.bookings)
        ) {

            bookings = data.bookings;

        } else {

            throw new Error(
                "Format data booking tidak valid"
            );

        }


        console.log(
            "Semua bookings:",
            bookings
        );


        // ==================================================
        // USER LOGIN
        // ==================================================

        const currentUser =
            getCurrentUser();


        if (!currentUser) {

            throw new Error(
                "User belum login."
            );

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


        // ==================================================
        // FILTER BOOKING MILIK USER
        // ==================================================

        const myBookings =
            bookings.filter(
                booking =>
                    Number(booking.user_id) ===
                    userId
            );


        console.log(
            "Booking milik user:",
            myBookings
        );


        // ==================================================
        // TIDAK ADA BOOKING
        // ==================================================

        if (myBookings.length === 0) {

            bookingList.innerHTML = `

                <div class="empty-booking">

                    <h3>
                        Belum ada booking
                    </h3>

                    <p>
                        Kamu belum memiliki booking
                        lapangan.
                    </p>

                    <a href="booking.html">

                        <button class="confirm-btn">
                            Book Court
                        </button>

                    </a>

                </div>

            `;

            return;
        }


        // ==================================================
        // BERSIHKAN LIST
        // ==================================================

        bookingList.innerHTML = "";


        // ==================================================
        // TAMPILKAN BOOKING
        // ==================================================

        myBookings.forEach(
            booking => {

                const totalPrice =
                    Number(
                        booking.total_price
                    ).toLocaleString("id-ID");


                const bookingDate =
                    formatDate(
                        booking.booking_date
                    );


                const card =
                    document.createElement("div");


                card.className =
                    "booking-history-card";


                card.innerHTML = `

                    <div class="booking-history-header">

                        <div>

                            <h3>
                                ${booking.court_name || "Court"}
                            </h3>

                            <span class="booking-id">
                                Booking #${booking.id}
                            </span>

                        </div>


                        <span
                            class="status ${booking.status}"
                        >
                            ${booking.status}
                        </span>

                    </div>


                    <div class="booking-history-info">


                        <div>

                            <strong>
                                📅 Tanggal
                            </strong>

                            <span>
                                ${bookingDate}
                            </span>

                        </div>


                        <div>

                            <strong>
                                🕐 Waktu
                            </strong>

                            <span>
                                ${formatTime(booking.start_time)}
                                -
                                ${formatTime(booking.end_time)}
                            </span>

                        </div>


                        <div>

                            <strong>
                                💰 Total
                            </strong>

                            <span>
                                Rp${totalPrice}
                            </span>

                        </div>


                    </div>


                    <div class="booking-history-actions">

                        ${
                            booking.status !== "cancelled"
                            ?
                            `
                            <button
                                class="cancel-booking-btn"
                                onclick="cancelBooking(${booking.id})"
                            >
                                Cancel Booking
                            </button>
                            `
                            :
                            `
                            <span class="cancelled-text">
                                Booking dibatalkan
                            </span>
                            `
                        }

                    </div>

                `;


                bookingList.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "Error load bookings:",
            error
        );


        bookingList.innerHTML = `

            <div class="empty-booking">

                <h3>
                    Gagal mengambil data booking
                </h3>

                <p>
                    ${error.message}
                </p>

            </div>

        `;

    }

}


// ======================================================
// CANCEL BOOKING
// ======================================================

async function cancelBooking(
    bookingId
) {

    const confirmation =
        confirm(
            "Apakah kamu yakin ingin membatalkan booking ini?"
        );


    if (!confirmation) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/bookings/${bookingId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        console.log(
            "Cancel booking response:",
            result
        );


        if (!response.ok) {

            alert(
                result.message ||
                "Gagal membatalkan booking."
            );

            return;

        }


        alert(
            "Booking berhasil dibatalkan."
        );


        await loadBookings();


    } catch (error) {

        console.error(
            "Error cancel booking:",
            error
        );


        alert(
            "Tidak dapat terhubung ke server."
        );

    }

}


// ======================================================
// FORMAT DATE
// ======================================================

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


// ======================================================
// FORMAT TIME
// ======================================================

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


// ======================================================
// INITIAL LOAD
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadBookings();

    }
);