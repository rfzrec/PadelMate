console.log("=== PADELMATE BOOKING.JS BERHASIL DIMUAT ===");


// ========================================
// ELEMENT
// ========================================

const courtSelect = document.getElementById("court");
const bookingDate = document.getElementById("booking-date");
const startTime = document.getElementById("start-time");
const endTime = document.getElementById("end-time");
const availabilityCalendar = document.getElementById("availability-calendar");
const availabilityMessage = document.getElementById("availability-message");
const availabilityDateLabel = document.getElementById("availability-date-label");

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
        loadWeekAvailability();

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


// ========================================
// KALENDER KETERSEDIAAN LAPANGAN — TAMPILAN MINGGUAN
let weekBookings = [];
let selectedAvailabilitySlot = "";
let weekAvailabilityRequestId = 0;
let displayedWeekStart = "";

const monthCalendarGrid = document.getElementById("availability-month-grid");
const monthCalendarTitle = document.getElementById("availability-month-title");
const previousMonthButton = document.getElementById("availability-prev-month");
const nextMonthButton = document.getElementById("availability-next-month");
const todayButton = document.getElementById("availability-today");

function localDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function parseLocalDate(value) {
    return new Date(`${value}T00:00:00`);
}
function formatAvailabilityDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
    if (!value) return "Pilih tanggal";
    return new Intl.DateTimeFormat("id-ID", options).format(parseLocalDate(value));
}
function timeToMinutes(value) {
    if (!value) return 0;
    const parts = String(value).slice(0, 5).split(":").map(Number);
    return (parts[0] * 60) + parts[1];
}
function normalizeBookingDate(value) {
    if (!value) return "";
    if (value instanceof Date) return localDateString(value);
    return String(value).slice(0, 10);
}
function showAvailabilityMessage(message = "", type = "") {
    if (!availabilityMessage) return;
    availabilityMessage.textContent = message;
    availabilityMessage.className = `availability-message${type ? ` ${type}` : ""}`;
}
function startOfWeek(date) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const weekday = (result.getDay() + 6) % 7; // Senin sebagai hari pertama
    result.setDate(result.getDate() - weekday);
    return result;
}
function bookingsForDate(date) {
    return weekBookings.filter(booking => normalizeBookingDate(booking.booking_date) === date);
}
function getWeekDate(offset) {
    const date = parseLocalDate(displayedWeekStart);
    date.setDate(date.getDate() + offset);
    return localDateString(date);
}
async function loadWeekAvailability() {
    if (!monthCalendarGrid) return;
    const courtId = courtSelect.value;
    if (!displayedWeekStart) {
        const anchor = bookingDate.value ? parseLocalDate(bookingDate.value) : new Date();
        displayedWeekStart = localDateString(startOfWeek(anchor));
    }
    const requestId = ++weekAvailabilityRequestId;
    const lastDate = getWeekDate(6);
    const firstMonth = formatAvailabilityDate(displayedWeekStart, { month: "long", year: "numeric" });
    const lastMonth = formatAvailabilityDate(lastDate, { month: "long", year: "numeric" });
    monthCalendarTitle.textContent = firstMonth === lastMonth ? firstMonth : `${firstMonth} – ${lastMonth}`;

    if (!courtId) {
        weekBookings = [];
        renderWeekCalendar();
        monthCalendarGrid.innerHTML = '<p class="availability-placeholder">Pilih court terlebih dahulu untuk melihat slot.</p>';
        return;
    }

    monthCalendarGrid.innerHTML = '<p class="availability-placeholder">Memuat jadwal ketersediaan…</p>';
    try {
        const response = await fetch(`${API_URL}/api/bookings/week-availability?court_id=${encodeURIComponent(courtId)}&start_date=${encodeURIComponent(displayedWeekStart)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat jadwal.");
        if (requestId !== weekAvailabilityRequestId) return;
        weekBookings = Array.isArray(result.bookings) ? result.bookings : [];
        renderWeekCalendar();
    } catch (error) {
        if (requestId !== weekAvailabilityRequestId) return;
        console.error("Gagal memuat jadwal mingguan:", error);
        monthCalendarGrid.innerHTML = '<p class="availability-placeholder">Jadwal tidak dapat dimuat. Periksa koneksi backend.</p>';
    }
}
function renderWeekCalendar() {
    if (!monthCalendarGrid || !displayedWeekStart) return;
    monthCalendarGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const timeHead = document.createElement("div");
    timeHead.className = "week-time-head";
    timeHead.textContent = "Jam";
    fragment.appendChild(timeHead);

    const today = localDateString(new Date());
    const selectedDate = bookingDate.value;
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = getWeekDate(dayIndex);
        const dayDate = parseLocalDate(date);
        const header = document.createElement("button");
        header.type = "button";
        header.className = `week-day-head${date === selectedDate ? " selected" : ""}${date === today ? " today" : ""}`;
        header.disabled = date < today;
        header.setAttribute("aria-pressed", date === selectedDate ? "true" : "false");
        header.innerHTML = `<span class="week-day-name">${new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(dayDate)}</span><strong>${dayDate.getDate()}</strong><small>${new Intl.DateTimeFormat("id-ID", { month: "short" }).format(dayDate)}</small>`;
        header.addEventListener("click", () => selectCalendarDate(date));
        fragment.appendChild(header);
    }

    for (let hour = 8; hour < 22; hour++) {
        const timeLabel = document.createElement("div");
        timeLabel.className = "week-time-label";
        timeLabel.textContent = `${String(hour).padStart(2, "0")}:00`;
        fragment.appendChild(timeLabel);

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const date = getWeekDate(dayIndex);
            const start = `${String(hour).padStart(2, "0")}:00`;
            const end = `${String(hour + 1).padStart(2, "0")}:00`;
            const isPast = date < today;
            const conflict = bookingsForDate(date).some(booking =>
                booking.status !== "cancelled" &&
                timeToMinutes(booking.start_time) < (hour + 1) * 60 &&
                timeToMinutes(booking.end_time) > hour * 60
            );
            const slot = document.createElement("button");
            slot.type = "button";
            slot.className = `week-slot ${conflict ? "booked" : "available"}${date === selectedDate && selectedAvailabilitySlot === start ? " selected" : ""}`;
            slot.disabled = isPast || conflict;
            slot.title = `${formatAvailabilityDate(date)} · ${start}–${end} · ${conflict ? "Sudah dibooking" : "Tersedia"}`;
            slot.setAttribute("aria-label", slot.title);
            slot.innerHTML = `<span>${conflict ? "Terisi" : "Tersedia"}</span>`;
            if (!conflict && !isPast) {
                slot.addEventListener("click", () => {
                    bookingDate.value = date;
                    selectedAvailabilitySlot = start;
                    startTime.value = start;
                    endTime.value = end;
                    renderWeekCalendar();
                    calculatePrice();
                    clearMessage();
                    showAvailabilityMessage(`Slot ${formatAvailabilityDate(date)} pukul ${start}–${end} dipilih.`);
                });
            }
            fragment.appendChild(slot);
        }
    }
    monthCalendarGrid.appendChild(fragment);
}
function selectCalendarDate(date) {
    bookingDate.value = date;
    selectedAvailabilitySlot = "";
    startTime.value = "";
    endTime.value = "";
    if (date < localDateString(new Date())) return;
    const monday = localDateString(startOfWeek(parseLocalDate(date)));
    if (monday !== displayedWeekStart) {
        displayedWeekStart = monday;
        loadWeekAvailability();
    } else {
        renderWeekCalendar();
    }
    calculatePrice();
    clearMessage();
}
previousMonthButton?.addEventListener("click", () => {
    const date = parseLocalDate(displayedWeekStart);
    date.setDate(date.getDate() - 7);
    displayedWeekStart = localDateString(date);
    loadWeekAvailability();
});
nextMonthButton?.addEventListener("click", () => {
    const date = parseLocalDate(displayedWeekStart);
    date.setDate(date.getDate() + 7);
    displayedWeekStart = localDateString(date);
    loadWeekAvailability();
});
todayButton?.addEventListener("click", () => {
    const today = localDateString(new Date());
    bookingDate.value = today;
    displayedWeekStart = localDateString(startOfWeek(parseLocalDate(today)));
    selectedAvailabilitySlot = "";
    loadWeekAvailability();
    calculatePrice();
});

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
            loadWeekAvailability();
            loadWeekAvailability();

            return;
        }


        pricePerHourElement.textContent =
            formatRupiah(
                selectedCourt.price_per_hour
            );


        calculatePrice();
        loadWeekAvailability();

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
    selectedAvailabilitySlot = "";
    startTime.value = "";
    endTime.value = "";
    if (bookingDate.value) displayedWeekStart = localDateString(startOfWeek(parseLocalDate(bookingDate.value)));
    loadWeekAvailability();
});

startTime.addEventListener("change", () => {
    selectedAvailabilitySlot = startTime.value;
    renderWeekCalendar();
});
endTime.addEventListener("change", () => {
    selectedAvailabilitySlot = startTime.value;
    renderWeekCalendar();
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
        selectedAvailabilitySlot = "";


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