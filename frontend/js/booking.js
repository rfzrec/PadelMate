console.log("=== PADELMATE BOOKING.JS BERHASIL DIMUAT ===");


// ========================================
// ELEMENT
// ========================================

const courtSelect = document.getElementById("court");
const bookingDate = document.getElementById("booking-date");
const startTime = document.getElementById("start-time");
const endTime = document.getElementById("end-time");

const pricePerHourElement =
    document.getElementById("price-per-hour");

const durationElement =
    document.getElementById("duration");

const totalPriceElement =
    document.getElementById("total-price");

const confirmButton =
    document.getElementById("confirm-booking");

const messageElement =
    document.getElementById("booking-message");


// ========================================
// DATA
// ========================================

let courts = [];


// ========================================
// LOAD COURTS
// ========================================

async function loadCourts() {

    console.log("Memulai load courts...");

    try {

        courtSelect.innerHTML = `
            <option value="">
                Memuat court...
            </option>
        `;


        const response = await fetch(
            `${API_URL}/api/courts`
        );


        console.log(
            "Status API courts:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data = await response.json();


        console.log(
            "Data courts dari API:",
            data
        );


        // ========================================
        // VALIDASI RESPONSE
        // ========================================

        if (!Array.isArray(data)) {

            throw new Error(
                "Format data courts tidak valid"
            );

        }


        // ========================================
        // NORMALISASI STATUS
        // ========================================

        courts = data.filter(court => {

            const status =
                String(court.status || "")
                    .trim()
                    .toLowerCase();

            console.log(
                `Court ${court.id}:`,
                court.name,
                "status =",
                status
            );

            return status === "available";

        });


        console.log(
            "Courts tersedia:",
            courts
        );


        // ========================================
        // TIDAK ADA COURT
        // ========================================

        if (courts.length === 0) {

            courtSelect.innerHTML = `
                <option value="">
                    Tidak ada court tersedia
                </option>
            `;

            pricePerHourElement.textContent =
                "Rp0";

            console.warn(
                "Tidak ada court dengan status available."
            );

            return;
        }


        // ========================================
        // TAMPILKAN COURTS
        // ========================================

        courtSelect.innerHTML = `
            <option value="">
                -- Pilih Court --
            </option>
        `;


        courts.forEach(court => {

            const option =
                document.createElement("option");


            option.value =
                court.id;


            option.textContent =
                `${court.name} - ${formatRupiah(
                    court.price_per_hour
                )}/jam`;


            courtSelect.appendChild(
                option
            );

        });


        console.log(
            "Court berhasil dimasukkan ke dropdown."
        );

    } catch (error) {

        console.error(
            "Error load courts:",
            error
        );


        courtSelect.innerHTML = `
            <option value="">
                Gagal memuat court
            </option>
        `;


        showMessage(
            "Gagal mengambil data court. Pastikan backend PadelMate sedang berjalan.",
            "error"
        );

    }

}


// COURT CHANGE
// ========================================

courtSelect.addEventListener(
    "change",
    function () {

        const courtId =
            Number(this.value);


        const selectedCourt =
            courts.find(
                court =>
                    Number(court.id) === courtId
            );


        if (!selectedCourt) {

            pricePerHourElement.textContent =
                "Rp0";

            calculatePrice();

            return;
        }


        pricePerHourElement.textContent =
            formatRupiah(
                selectedCourt.price_per_hour
            );


        calculatePrice();

    }
);


// ========================================
// TIME CHANGE
// ========================================

startTime.addEventListener(
    "change",
    calculatePrice
);

endTime.addEventListener(
    "change",
    calculatePrice
);


// ========================================
// DATE
// ========================================

function setMinimumDate() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    const todayString =
        `${year}-${month}-${day}`;


    bookingDate.min =
        todayString;


    if (!bookingDate.value) {

        bookingDate.value =
            todayString;

    }

}


bookingDate.addEventListener("change", () => {
    clearMessage();
    startTime.value = "";
    endTime.value = "";
});



// ========================================
// CALCULATE PRICE
// ========================================

function calculatePrice() {

    const courtId =
        Number(courtSelect.value);


    const selectedCourt =
        courts.find(
            court =>
                Number(court.id) === courtId
        );


    if (!selectedCourt) {

        durationElement.textContent =
            "0 jam";

        totalPriceElement.textContent =
            "Rp0";

        return;

    }


    if (
        !startTime.value ||
        !endTime.value
    ) {

        durationElement.textContent =
            "0 jam";

        totalPriceElement.textContent =
            "Rp0";

        return;

    }


    const startMinutes =
        timeToMinutes(
            startTime.value
        );


    const endMinutes =
        timeToMinutes(
            endTime.value
        );


    if (
        endMinutes <= startMinutes
    ) {

        durationElement.textContent =
            "Waktu tidak valid";

        totalPriceElement.textContent =
            "Rp0";

        return;

    }


    const durationMinutes =
        endMinutes - startMinutes;


    const durationHours =
        durationMinutes / 60;


    const price =
        Number(
            selectedCourt.price_per_hour
        );


    const total =
        price * durationHours;


    if (
        Number.isInteger(
            durationHours
        )
    ) {

        durationElement.textContent =
            `${durationHours} jam`;

    } else {

        durationElement.textContent =
            `${durationHours.toFixed(1)} jam`;

    }


    totalPriceElement.textContent =
        formatRupiah(total);

}


// ========================================
// SUBMIT BOOKING
// ========================================

confirmButton.addEventListener(
    "click",
    createBooking
);


async function createBooking() {

    clearMessage();


    const courtId =
        Number(courtSelect.value);


    if (!courtId) {

        showMessage(
            "Silakan pilih court terlebih dahulu.",
            "error"
        );

        return;

    }


    if (!bookingDate.value) {

        showMessage(
            "Silakan pilih tanggal booking.",
            "error"
        );

        return;

    }


    if (
        !startTime.value ||
        !endTime.value
    ) {

        showMessage(
            "Silakan pilih jam mulai dan jam selesai.",
            "error"
        );

        return;

    }


    const startMinutes =
        timeToMinutes(
            startTime.value
        );


    const endMinutes =
        timeToMinutes(
            endTime.value
        );


    if (
        endMinutes <= startMinutes
    ) {

        showMessage(
            "Jam selesai harus lebih besar dari jam mulai.",
            "error"
        );

        return;

    }


    const durationMinutes =
        endMinutes - startMinutes;


    if (durationMinutes < 60) {

        showMessage(
            "Minimal durasi booking adalah 1 jam.",
            "error"
        );

        return;

    }


    const selectedCourt =
        courts.find(
            court =>
                Number(court.id) === courtId
        );


    if (!selectedCourt) {

        showMessage(
            "Court tidak ditemukan.",
            "error"
        );

        return;

    }


    const durationHours =
        durationMinutes / 60;


    const totalPrice =
        Number(
            selectedCourt.price_per_hour
        ) * durationHours;


    confirmButton.disabled =
        true;


    confirmButton.textContent =
        "Processing...";


    try {

        // ========================================
        // AMBIL TOKEN LOGIN
        // ========================================

        const token =
            localStorage.getItem(
                "padelmate_token"
            );


        if (!token) {

            showMessage(
                "Silakan login terlebih dahulu.",
                "error"
            );

            return;

        }


        // ========================================
        // DATA BOOKING
        // ========================================

        const bookingData = {

            court_id:
                courtId,

            booking_date:
                bookingDate.value,

            start_time:
                startTime.value,

            end_time:
                endTime.value,

            total_price:
                totalPrice

        };


        console.log(
            "Booking data:",
            bookingData
        );


        // ========================================
        // SEND TO BACKEND
        // ========================================

        const response =
            await fetch(
                `${API_URL}/api/bookings`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify(
                            bookingData
                        )

                }
            );


        const result =
            await response.json();


        console.log(
            "Booking response:",
            result
        );


        // ========================================
        // ERROR
        // ========================================

        if (!response.ok) {

            showMessage(
                result.message ||
                "Gagal membuat booking.",
                "error"
            );

            return;

        }


        // ========================================
        // SUCCESS
        // ========================================

        showMessage(
            "Booking berhasil dibuat!",
            "success"
        );


        startTime.value = "";
        endTime.value = "";
    

        durationElement.textContent =
            "0 jam";


        totalPriceElement.textContent =
            "Rp0";


        setTimeout(
            () => {

                window.location.href =
                    "booking-history.html";

            },
            1200
        );


    } catch (error) {

        console.error(
            "Error create booking:",
            error
        );


        showMessage(
            "Tidak dapat terhubung ke server.",
            "error"
        );


    } finally {

        confirmButton.disabled =
            false;


        confirmButton.textContent =
            "Confirm Booking";

    }

}


// ========================================
// TIME TO MINUTES
// ========================================

function timeToMinutes(time) {

    const parts =
        time.split(":");


    const hours =
        Number(parts[0]);


    const minutes =
        Number(parts[1]);


    return (
        hours * 60 +
        minutes
    );

}


// ========================================
// FORMAT RUPIAH
// ========================================

function formatRupiah(value) {

    return (
        "Rp" +
        Number(value || 0)
            .toLocaleString("id-ID")
    );

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
// INITIAL LOAD
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setMinimumDate();

        loadCourts();

    }
);