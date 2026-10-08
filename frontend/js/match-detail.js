const API_URL = "http://localhost:3000";


// ========================================
// USER TESTING
// ========================================

let currentUserId =
    Number(JSON.parse(localStorage.getItem("padelmate_user") || "null")?.id) || null;


// ========================================
// FORMAT TANGGAL
// ========================================

function formatBookingDate(dateValue) {

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
// FORMAT RUPIAH
// ========================================

function formatRupiah(value) {

    return Number(value)
        .toLocaleString("id-ID");

}


// ========================================
// AMBIL ID MATCH DARI URL
// ========================================

const params =
    new URLSearchParams(
        window.location.search
    );


const matchId =
    params.get("id");


// ========================================
// LOAD MATCH DETAIL
// ========================================

async function loadMatchDetail() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/matches/${matchId}`
            );


        if (!response.ok) {

            throw new Error(
                "Gagal mengambil detail match"
            );

        }


        const match =
            await response.json();


        renderMatchDetail(match);


    } catch (error) {

        console.error(error);


        const container =
            document.getElementById(
                "match-detail-container"
            );


        if (container) {

            container.innerHTML = `

                <div
                    class="booking-message error"
                >

                    Gagal mengambil data Open Match.

                    <br><br>

                    Pastikan backend berjalan.

                </div>

            `;

        }

    }

}


// ========================================
// RENDER DETAIL MATCH
// ========================================

function renderMatchDetail(match) {

    const container =
        document.getElementById(
            "match-detail-container"
        );


    if (!container) {

        console.error(
            "match-detail-container tidak ditemukan"
        );

        return;

    }


    const players =
        match.players || [];


    const playerCount =
        Number(
            match.player_count
        );


    const maxPlayers =
        Number(
            match.max_players
        );


    const totalPrice =
        Number(
            match.total_price
        );


    // ====================================
    // CEK USER SUDAH JOIN
    // ====================================

    const isJoined =
        players.some(
            player =>
                Number(player.id) ===
                Number(currentUserId)
        );


    // ====================================
    // HITUNG SPLIT PAYMENT
    // ====================================

    let splitPayment;


    if (playerCount > 0) {

        splitPayment =
            totalPrice /
            playerCount;

    } else {

        splitPayment =
            totalPrice /
            maxPlayers;

    }


    // ====================================
    // PLAYER LIST
    // ====================================

    let playerListHTML =
        "";


    if (players.length === 0) {

        playerListHTML = `

            <p class="empty-player">
                Belum ada pemain.
            </p>

        `;

    } else {

        playerListHTML =
            players.map(
                (player, index) => {

                    return `

                        <div
                            class="player-item"
                        >

                            <div
                                class="player-number"
                            >
                                ${index + 1}
                            </div>


                            <div
                                class="player-name"
                            >
                                ${player.name}
                            </div>

                        </div>

                    `;

                }
            ).join("");

    }


    // ====================================
    // TOMBOL ACTION
    // ====================================

    let actionHTML =
        "";


    // USER SUDAH JOIN
    if (isJoined) {

        actionHTML = `

            <button
                class="leave-btn"
                onclick="leaveMatch(${match.id})"
            >
                Leave Match
            </button>

        `;

    }


    // USER BELUM JOIN
    else if (
        match.status === "open" &&
        playerCount < maxPlayers
    ) {

        actionHTML = `

            <button
                class="join-btn"
                onclick="joinMatch(${match.id})"
            >
                Join Match
            </button>

        `;

    }


    // MATCH FULL / CLOSED
    else {

        actionHTML = `

            <button
                class="join-btn"
                disabled
            >
                Match Full
            </button>

        `;

    }


    // ====================================
    // HTML DETAIL
    // ====================================

    container.innerHTML = `


        <div
            class="match-detail-card"
        >


            <div
                class="match-detail-header"
            >

                <span
                    class="status ${match.status}"
                >
                    ${match.status}
                </span>


                <h1>
                    ${match.title}
                </h1>

            </div>


            <!-- INFO BOOKING -->

            <div
                class="match-detail-info"
            >


                <div
                    class="detail-info-item"
                >

                    <span>
                        🏟️ Court
                    </span>

                    <strong>
                        ${match.court_name}
                    </strong>

                </div>


                <div
                    class="detail-info-item"
                >

                    <span>
                        📅 Tanggal
                    </span>

                    <strong>

                        ${
                            formatBookingDate(
                                match.booking_date
                            )
                        }

                    </strong>

                </div>


                <div
                    class="detail-info-item"
                >

                    <span>
                        🕐 Waktu
                    </span>

                    <strong>

                        ${match.start_time}
                        -
                        ${match.end_time}

                    </strong>

                </div>


                <div
                    class="detail-info-item"
                >

                    <span>
                        💰 Total Court
                    </span>

                    <strong>

                        Rp
                        ${formatRupiah(
                            totalPrice
                        )}

                    </strong>

                </div>


            </div>


            <!-- PLAYERS -->

            <div
                class="players-section"
            >

                <div
                    class="section-title"
                >

                    <h2>
                        Players
                    </h2>


                    <span>

                        ${playerCount}/${maxPlayers}
                        Players

                    </span>

                </div>


                <div
                    class="players-list"
                >

                    ${playerListHTML}

                </div>

            </div>


            <!-- SPLIT PAYMENT -->

            <div
                class="detail-split-payment"
            >

                <div
                    class="split-payment-title"
                >

                    💰 Split Payment

                </div>


                <div
                    class="split-payment-price"
                >

                    Rp
                    ${formatRupiah(
                        splitPayment
                    )}
                    / player

                </div>


                <small>

                    ${
                        playerCount > 0
                        ?
                        `Saat ini dibagi ${playerCount} pemain.`
                        :
                        `Estimasi jika ${maxPlayers} pemain.`
                    }

                </small>

            </div>


            <!-- ACTION -->

            <div
                class="match-action"
            >

                ${actionHTML}

            </div>


            <div
                id="match-message"
                class="booking-message"
            ></div>


        </div>

    `;


    // ====================================
    // USER SELECTOR
    // ====================================

    const userSelect =
        document.getElementById(
            "test-user-select"
        );


    if (userSelect) {

        userSelect.addEventListener(
            "change",
            function () {

                currentUserId =
                    Number(
                        this.value
                    );


                localStorage.setItem(
                    "padelmate_test_user",
                    currentUserId
                );


                loadMatchDetail();

            }
        );

    }

}


// ========================================
// JOIN MATCH
// ========================================

async function joinMatch(matchId) {

    try {

        const response =
            await fetch(
                `${API_URL}/api/matches/${matchId}/join`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        user_id:
                            currentUserId

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Gagal bergabung ke match"
            );

            return;

        }


        alert(
            result.message ||
            "Berhasil bergabung ke match"
        );


        loadMatchDetail();


    } catch (error) {

        console.error(error);


        alert(
            "Tidak dapat terhubung ke server."
        );

    }

}


// ========================================
// LEAVE MATCH
// ========================================

async function leaveMatch(matchId) {

    const confirmLeave =
        confirm(
            "Apakah kamu yakin ingin keluar dari Open Match?"
        );


    if (!confirmLeave) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/matches/${matchId}/leave`,
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        user_id:
                            currentUserId

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Gagal keluar dari match"
            );

            return;

        }


        alert(
            result.message ||
            "Berhasil keluar dari Open Match"
        );


        loadMatchDetail();


    } catch (error) {

        console.error(error);


        alert(
            "Tidak dapat terhubung ke server."
        );

    }

}


// ========================================
// LOAD
// ========================================

if (matchId) {

    loadMatchDetail();

} else {

    console.error(
        "ID match tidak ditemukan di URL"
    );

}