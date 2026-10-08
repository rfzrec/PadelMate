// ========================================
// PADELMATE APP
// ========================================


// ========================================
// API URL
// ========================================

function getApiUrl() {

    return window.PADEL_API_URL ||
           "http://localhost:3000";

}


// ========================================
// USER TESTING
// ========================================

function getCurrentUserId() {

    return Number(
        JSON.parse(
            localStorage.getItem("padelmate_user") || "null"
        )?.id
    ) || null;

}


// ========================================
// FORMAT TANGGAL
// ========================================

function formatBookingDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

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
// FORMAT RUPIAH
// ========================================

function formatRupiah(value) {

    return Number(value || 0).toLocaleString("id-ID");

}


// ========================================
// LOAD COURTS
// ========================================

async function loadCourts() {

    console.log("=== LOAD COURTS ===");

    const container =
        document.getElementById("courts-container");


    if (!container) {

        console.log(
            "courts-container tidak ditemukan."
        );

        return;

    }


    try {

        const apiUrl = getApiUrl();

        console.log(
            "Mengambil courts dari:",
            `${apiUrl}/api/courts`
        );


        const response =
            await fetch(
                `${apiUrl}/api/courts`
            );


        console.log(
            "Courts status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const courts =
            await response.json();


        console.log(
            "Courts berhasil:",
            courts
        );


        container.innerHTML = "";


        if (!Array.isArray(courts)) {

            throw new Error(
                "Format data courts tidak valid"
            );

        }


        if (courts.length === 0) {

            container.innerHTML = `
                <p>
                    Belum ada lapangan tersedia.
                </p>
            `;

            return;

        }


        courts.forEach(court => {

            const price =
                formatRupiah(
                    court.price_per_hour
                );


            const card =
                document.createElement("div");


            card.className =
                "court-card";


            card.innerHTML = `

                <div class="court-image"></div>

                <div class="court-content">

                    <span class="status ${court.status}">
                        ${court.status}
                    </span>

                    <h3>
                        ${court.name}
                    </h3>

                    <p class="court-type">
                        ${court.type}
                    </p>

                    <p class="court-price">
                        Rp ${price} / jam
                    </p>

                    <button
                        class="book-btn"
                        onclick="bookCourt(${court.id})"
                    >
                        Book Court
                    </button>

                </div>

            `;


            container.appendChild(card);

        });


        console.log(
            "=== COURTS SELESAI DIMUAT ==="
        );


    } catch (error) {

        console.error(
            "ERROR LOAD COURTS:",
            error
        );


        container.innerHTML = `
            <p>
                Gagal mengambil data lapangan.
            </p>
        `;

    }

}


// ========================================
// LOAD OPEN MATCH
// ========================================

async function loadMatches() {

    console.log("=== LOAD OPEN MATCH ===");

    const container =
        document.getElementById(
            "matches-container"
        );


    if (!container) {

        console.log(
            "matches-container tidak ditemukan."
        );

        return;

    }


    try {

        const apiUrl = getApiUrl();


        console.log(
            "Mengambil matches dari:",
            `${apiUrl}/api/matches`
        );


        const response =
            await fetch(
                `${apiUrl}/api/matches`
            );


        console.log(
            "Matches status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const matches =
            await response.json();


        console.log(
            "Matches berhasil:",
            matches
        );


        container.innerHTML = "";


        if (!Array.isArray(matches)) {

            throw new Error(
                "Format data matches tidak valid"
            );

        }


        if (matches.length === 0) {

            container.innerHTML = `
                <p>
                    Belum ada Open Match tersedia.
                </p>
            `;

            return;

        }


        matches.forEach(match => {

            const totalPrice =
                Number(
                    match.total_price || 0
                );


            const playerCount =
                Number(
                    match.player_count || 0
                );


            const maxPlayers =
                Number(
                    match.max_players || 4
                );


            // ====================================
            // SPLIT PAYMENT
            // ====================================

            let splitPaymentText;


            if (playerCount > 0) {

                const splitPayment =
                    totalPrice / playerCount;


                splitPaymentText =
                    `Rp ${formatRupiah(
                        splitPayment
                    )} / player`;

            } else {

                const estimatedSplit =
                    totalPrice / maxPlayers;


                splitPaymentText =
                    `Rp ${formatRupiah(
                        estimatedSplit
                    )} / player`;

            }


            // ====================================
            // STATUS PEMAIN
            // ====================================

            let playerStatusText;


            if (playerCount >= maxPlayers) {

                playerStatusText =
                    "Match sudah penuh";

            } else {

                const remaining =
                    maxPlayers - playerCount;


                playerStatusText =
                    `${remaining} slot tersisa`;

            }


            // ====================================
            // CREATE CARD
            // ====================================

            const card =
                document.createElement("div");


            card.className =
                "match-card";


            card.style.cursor =
                "pointer";


            card.addEventListener(
                "click",
                function(event) {

                    if (
                        event.target.closest(
                            "button"
                        )
                    ) {

                        return;

                    }


                    window.location.href =
                        `match-detail.html?id=${match.id}`;

                }
            );


            // ====================================
            // CARD CONTENT
            // ====================================

            card.innerHTML = `

                <span class="status ${match.status}">
                    ${match.status}
                </span>


                <h3>
                    ${match.title}
                </h3>


                <div class="match-info">

                    <span>
                        🏟️ ${match.court_name}
                    </span>


                    <span>
                        📅
                        ${formatBookingDate(
                            match.booking_date
                        )}
                    </span>


                    <span>
                        🕐
                        ${match.start_time}
                        -
                        ${match.end_time}
                    </span>


                    <span>
                        💰
                        Rp ${formatRupiah(
                            totalPrice
                        )}
                    </span>

                </div>


                <!-- PLAYER INFO -->

                <div class="match-player-section">

                    <div class="player-count">

                        👥

                        <strong>
                            ${playerCount}/${maxPlayers}
                        </strong>

                        Players

                    </div>


                    <div class="player-status">

                        ${playerStatusText}

                    </div>

                </div>


                <!-- SPLIT PAYMENT -->

                <div class="split-payment-box">

                    <div class="split-payment-title">

                        💰 Split Payment

                    </div>


                    <div class="split-payment-price">

                        ${splitPaymentText}

                    </div>


                    <small>

                        ${
                            playerCount > 0
                            ?
                            `Dibagi ${playerCount} pemain saat ini`
                            :
                            `Estimasi jika ${maxPlayers} pemain`
                        }

                    </small>

                </div>


                <!-- ACTION -->

                <div class="match-bottom">

                    ${
                        match.status === "open"
                        ?
                        `
                            <button
                                class="join-btn"
                                onclick="joinMatch(${match.id})"
                            >
                                Join Match
                            </button>
                        `
                        :
                        `
                            <span>
                                Match Full
                            </span>
                        `
                    }

                </div>

            `;


            container.appendChild(card);

        });


        console.log(
            "=== OPEN MATCH SELESAI DIMUAT ==="
        );


    } catch (error) {

        console.error(
            "ERROR LOAD MATCHES:",
            error
        );


        container.innerHTML = `
            <p>
                Gagal mengambil data Open Match.
            </p>
        `;

    }

}


// ========================================
// BOOK COURT
// ========================================

function bookCourt(courtId) {

    console.log(
        "Book court:",
        courtId
    );


    window.location.href =
        `booking.html?court_id=${courtId}`;

}


// ========================================
// JOIN MATCH
// ========================================

async function joinMatch(matchId) {

    console.log(
        "Join match:",
        matchId
    );


    try {

        const apiUrl =
            getApiUrl();


        const response =
            await fetch(
                `${apiUrl}/api/matches/${matchId}/join`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        console.log(
            "Join status:",
            response.status
        );


        const result =
            await response.json();


        console.log(
            "Join response:",
            result
        );


        alert(
            result.message ||
            "Berhasil bergabung ke Open Match."
        );


        if (response.ok) {

            await loadMatches();

        }


    } catch (error) {

        console.error(
            "ERROR JOIN MATCH:",
            error
        );


        alert(
            "Gagal bergabung ke Open Match."
        );

    }

}


// ========================================
// INITIAL LOAD
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "=== PADELMATE APP BERHASIL DIMUAT ==="
        );


        loadCourts();

        loadMatches();

    }
);