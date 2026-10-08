// ======================================================
// PADELMATE AUTH.JS
// ======================================================

// Gunakan window agar tidak bentrok dengan script JavaScript lain
window.PADEL_API_URL = "http://localhost:3000";
window.API_URL = window.PADEL_API_URL;

// ======================================================
// AUTH TOKEN
// ======================================================

function getAuthToken() {

    return localStorage.getItem(
        "padelmate_token"
    );

}


// ======================================================
// CURRENT USER
// ======================================================

function getCurrentUser() {

    try {

        return JSON.parse(
            localStorage.getItem("padelmate_user")
        ) || null;

    } catch (error) {

        return null;

    }

}


function getCurrentUserId() {

    return Number(
        getCurrentUser()?.id
    ) || null;

}


// ======================================================
// LOGIN STATUS
// ======================================================

function isLoggedIn() {

    return (
        !!getAuthToken() &&
        !!getCurrentUser()
    );

}


// ======================================================
// LOGOUT
// ======================================================

function logout() {

    localStorage.removeItem(
        "padelmate_token"
    );

    localStorage.removeItem(
        "padelmate_user"
    );

    window.location.href =
        "login.html";

}


// ======================================================
// REQUIRE AUTH
// ======================================================

function requireAuth() {

    if (!isLoggedIn()) {

        const currentPage =
            window.location.pathname
                .split("/")
                .pop() +
            window.location.search;

        window.location.href =
            `login.html?redirect=${encodeURIComponent(currentPage)}`;

        return false;

    }

    return true;

}


// ======================================================
// FETCH DENGAN TOKEN OTOMATIS
// ======================================================

const originalFetch =
    window.fetch.bind(window);


window.fetch = function (
    url,
    options = {}
) {

    const apiUrl =
        window.PADEL_API_URL;

    const isApi =
        typeof url === "string" &&
        url.startsWith(apiUrl);


    if (
        isApi &&
        getAuthToken()
    ) {

        options = {

            ...options,

            headers: {

                ...(options.headers || {}),

                Authorization:
                    `Bearer ${getAuthToken()}`

            }

        };

    }


    return originalFetch(
        url,
        options
    );

};


// ======================================================
// AUTH UI
// ======================================================

function setupAuthUI() {

    const user =
        getCurrentUser();


    document
        .querySelectorAll(".login-btn")
        .forEach(btn => {

            if (user) {

                const firstName =
                    user.name
                        ? user.name.split(" ")[0]
                        : "User";


                btn.textContent =
                    `Hi, ${firstName}`;


                btn.classList.add(
                    "user-btn"
                );


                btn.onclick = () => {

                    if (
                        confirm(
                            "Logout dari PadelMate?"
                        )
                    ) {

                        logout();

                    }

                };

            } else {

                btn.textContent =
                    "Login";


                btn.onclick = () => {

                    window.location.href =
                        "login.html";

                };

            }

        });

}


// ======================================================
// DOM READY
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupAuthUI();


        if (
            document.body?.dataset.authRequired ===
            "true"
        ) {

            requireAuth();

        }

    }
);