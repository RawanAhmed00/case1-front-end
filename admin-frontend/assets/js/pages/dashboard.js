(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", async function () {

        const P = window.TL && window.TL.Pages
            ? window.TL.Pages
            : null;

        /*
         * ------------------------------------------------------------
         * SAFETY HELPERS
         * ------------------------------------------------------------
         */

        function display(value, fallback = "—") {
            if (P && typeof P.display === "function") {
                return P.display(value);
            }

            if (value === null || value === undefined || value === "") {
                return fallback;
            }

            return String(value);
        }

        function escape(value) {
            if (P && typeof P.escape === "function") {
                return P.escape(display(value));
            }

            return String(display(value))
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function empty(title, message, icon = "bi-info-circle") {
            if (P && typeof P.empty === "function") {
                return P.empty(title, message, icon);
            }

            return `
                <div class="tl-empty">
                    <div class="tl-empty__icon">
                        <i class="bi ${icon}"></i>
                    </div>
                    <h3>${escape(title)}</h3>
                    <p class="tl-text-secondary">
                        ${escape(message)}
                    </p>
                </div>
            `;
        }

        function error(message) {
            if (P && typeof P.error === "function") {
                return P.error(message);
            }

            return `
                <div class="tl-empty">
                    <div class="tl-empty__icon">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <h3>Unable to load data</h3>
                    <p class="tl-text-secondary">
                        ${escape(message || "An unexpected error occurred.")}
                    </p>
                </div>
            `;
        }

        /*
         * ------------------------------------------------------------
         * SAFE RESPONSE DATA EXTRACTION
         * ------------------------------------------------------------
         *
         * API responses can be:
         *
         * {
         *   data: {...}
         * }
         *
         * or:
         *
         * {
         *   data: {
         *      data: {...}
         *   }
         * }
         *
         * or directly:
         *
         * {
         *   total_trips: 10
         * }
         *
         * We handle all of these without crashing.
         */

        function getData(response) {

            if (!response) {
                return {};
            }

            if (
                typeof response === "object" &&
                response !== null &&
                Object.prototype.hasOwnProperty.call(response, "data")
            ) {
                return response.data || {};
            }

            return response;
        }

        /*
         * ------------------------------------------------------------
         * ELEMENTS
         * ------------------------------------------------------------
         */

        const totalTripsEl =
            document.getElementById("kpiTotalTrips");

        const tripsTodayEl =
            document.getElementById("kpiTripsToday");

        const tripsMonthEl =
            document.getElementById("kpiTripsMonth");

        const analyticsStatusEl =
            document.getElementById("kpiAnalyticsStatus");

        const latestTripsEl =
            document.getElementById("latestTrips");

        const topUsersEl =
            document.getElementById("topUsers");

        const analyticsPayloadEl =
            document.getElementById("analyticsPayloadState");


        /*
         * ------------------------------------------------------------
         * INITIAL STATE
         * ------------------------------------------------------------
         */

        if (totalTripsEl) {
            totalTripsEl.textContent = "Loading…";
        }

        if (tripsTodayEl) {
            tripsTodayEl.textContent = "Loading…";
        }

        if (tripsMonthEl) {
            tripsMonthEl.textContent = "Loading…";
        }

        if (analyticsStatusEl) {
            analyticsStatusEl.textContent = "Loading…";
        }

        if (latestTripsEl) {
            latestTripsEl.innerHTML = empty(
                "Loading latest trips",
                "Fetching the latest travel activity.",
                "bi-map"
            );
        }

        if (topUsersEl) {
            topUsersEl.innerHTML = empty(
                "Loading top users",
                "Fetching traveler statistics.",
                "bi-people"
            );
        }

        if (analyticsPayloadEl) {
            analyticsPayloadEl.innerHTML = empty(
                "Loading analytics",
                "Fetching dashboard analytics.",
                "bi-bar-chart"
            );
        }


        /*
         * ------------------------------------------------------------
         * CHECK REQUIRED API MODULES
         * ------------------------------------------------------------
         */

        if (!window.TL) {
            console.error("Tailora: window.TL is not available.");

            if (analyticsStatusEl) {
                analyticsStatusEl.textContent = "Unavailable";
            }

            return;
        }

        if (!window.TL.Trips) {
            console.error(
                "Tailora: TL.Trips is not loaded. " +
                "Make sure assets/js/api/trips.js is loaded before dashboard.js."
            );

            if (totalTripsEl) {
                totalTripsEl.textContent = "Unavailable";
            }

            if (tripsTodayEl) {
                tripsTodayEl.textContent = "Unavailable";
            }

            if (tripsMonthEl) {
                tripsMonthEl.textContent = "Unavailable";
            }

            if (latestTripsEl) {
                latestTripsEl.innerHTML = error(
                    "Trips API module is not loaded."
                );
            }
        }

        if (!window.TL.Analytics) {
            console.error(
                "Tailora: TL.Analytics is not loaded. " +
                "Make sure assets/js/api/analytics.js is loaded before dashboard.js."
            );

            if (analyticsStatusEl) {
                analyticsStatusEl.textContent = "Unavailable";
            }

            if (analyticsPayloadEl) {
                analyticsPayloadEl.innerHTML = error(
                    "Analytics API module is not loaded."
                );
            }
        }


        /*
         * ------------------------------------------------------------
         * LOAD TRIP STATISTICS
         * ------------------------------------------------------------
         */

        let tripsResult = null;

        if (
            window.TL.Trips &&
            typeof window.TL.Trips.getTripStatistics === "function"
        ) {

            try {

                tripsResult =
                    await window.TL.Trips.getTripStatistics();

                console.log(
                    "Tailora trip statistics response:",
                    tripsResult
                );

                const data = getData(tripsResult);

                /*
                 * KPI: TOTAL TRIPS
                 */

                if (totalTripsEl) {
                    totalTripsEl.textContent =
                        display(data.total_trips);
                }

                /*
                 * KPI: TRIPS TODAY
                 */

                if (tripsTodayEl) {
                    tripsTodayEl.textContent =
                        display(data.trips_created_today);
                }

                /*
                 * KPI: TRIPS THIS MONTH
                 */

                if (tripsMonthEl) {
                    tripsMonthEl.textContent =
                        display(data.trips_this_month);
                }


                /*
                 * ----------------------------------------------------
                 * LATEST TRIPS
                 * ----------------------------------------------------
                 */

                const latestTrips =
                    Array.isArray(data.latest_trips)
                        ? data.latest_trips
                        : [];

                if (latestTripsEl) {

                    if (latestTrips.length === 0) {

                        latestTripsEl.innerHTML = empty(
                            "No latest trips",
                            "The trip statistics endpoint returned no latest_trips records.",
                            "bi-map"
                        );

                    } else {

                        const rows = latestTrips
                            .slice(0, 8)
                            .map(function (trip) {

                                return `
                                    <tr>
                                        <td>
                                            ${escape(trip.id)}
                                        </td>

                                        <td>
                                            ${escape(trip.dis_country)}
                                        </td>

                                        <td>
                                            ${escape(trip.travel_style)}
                                        </td>

                                        <td>
                                            ${escape(trip.num_days)}
                                        </td>

                                        <td>
                                            ${escape(trip.created_at)}
                                        </td>
                                    </tr>
                                `;

                            })
                            .join("");

                        latestTripsEl.innerHTML = `
                            <div class="tl-table-wrap">

                                <table class="tl-table">

                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Destination</th>
                                            <th>Style</th>
                                            <th>Days</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        ${rows}
                                    </tbody>

                                </table>

                            </div>
                        `;
                    }
                }


                /*
                 * ----------------------------------------------------
                 * TOP USERS
                 * ----------------------------------------------------
                 */

                const topUsers =
                    Array.isArray(data.top_users)
                        ? data.top_users
                        : [];

                if (topUsersEl) {

                    if (topUsers.length === 0) {

                        topUsersEl.innerHTML = empty(
                            "No top users",
                            "The trip statistics endpoint returned no top_users records.",
                            "bi-people"
                        );

                    } else {

                        const rows = topUsers
                            .slice(0, 8)
                            .map(function (user) {

                                return `
                                    <tr>
                                        <td>
                                            ${escape(user.id)}
                                        </td>

                                        <td>
                                            ${escape(user.name)}
                                        </td>

                                        <td>
                                            ${escape(user.email)}
                                        </td>
                                    </tr>
                                `;

                            })
                            .join("");

                        topUsersEl.innerHTML = `
                            <div class="tl-table-wrap">

                                <table class="tl-table">

                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        ${rows}
                                    </tbody>

                                </table>

                            </div>
                        `;
                    }
                }

            } catch (tripError) {

                console.error(
                    "Tailora trip statistics error:",
                    tripError
                );

                if (totalTripsEl) {
                    totalTripsEl.textContent = "Unavailable";
                }

                if (tripsTodayEl) {
                    tripsTodayEl.textContent = "Unavailable";
                }

                if (tripsMonthEl) {
                    tripsMonthEl.textContent = "Unavailable";
                }

                if (latestTripsEl) {
                    latestTripsEl.innerHTML = error(
                        tripError?.message ||
                        "Failed to load trip statistics."
                    );
                }

                if (topUsersEl) {
                    topUsersEl.innerHTML = error(
                        tripError?.message ||
                        "Failed to load top users."
                    );
                }
            }
        }


        /*
         * ------------------------------------------------------------
         * LOAD ANALYTICS
         * ------------------------------------------------------------
         *
         * IMPORTANT:
         * Analytics is completely independent from Trips.
         *
         * If:
         *
         * GET /api/admin/analytics/dashboard
         *
         * returns 422, the dashboard will NOT crash.
         */

        if (
            window.TL.Analytics &&
            typeof window.TL.Analytics.getDashboardAnalytics === "function"
        ) {

            try {

                const analyticsResult =
                    await window.TL.Analytics.getDashboardAnalytics();

                console.log(
                    "Tailora analytics response:",
                    analyticsResult
                );

                const analyticsData =
                    getData(analyticsResult);

                /*
                 * The API documentation currently does not define
                 * concrete KPI field names for analytics.
                 *
                 * Therefore we don't invent numbers or charts.
                 */

                const renderable =
                    analyticsData &&
                    typeof analyticsData === "object" &&
                    !Array.isArray(analyticsData);

                if (analyticsStatusEl) {

                    analyticsStatusEl.textContent =
                        renderable
                            ? "Available"
                            : "Received";
                }

                if (analyticsPayloadEl) {

                    if (renderable) {

                        analyticsPayloadEl.innerHTML = empty(
                            "Analytics data received",
                            "The analytics endpoint returned structured data, but no documented KPI field names are available yet. No fields are guessed.",
                            "bi-bar-chart"
                        );

                    } else {

                        analyticsPayloadEl.innerHTML = empty(
                            "Analytics data received",
                            "The analytics endpoint returned data, but its internal schema is not defined.",
                            "bi-bar-chart"
                        );
                    }
                }

            } catch (analyticsError) {

                /*
                 * 422 / 401 / 500 etc. should NOT break dashboard.
                 */

                console.error(
                    "Tailora analytics error:",
                    analyticsError
                );

                if (analyticsStatusEl) {
                    analyticsStatusEl.textContent = "Unavailable";
                }

                if (analyticsPayloadEl) {

                    analyticsPayloadEl.innerHTML = error(
                        analyticsError?.message ||
                        "Analytics endpoint returned an error."
                    );
                }
            }

        } else {

            if (analyticsStatusEl) {
                analyticsStatusEl.textContent = "Unavailable";
            }

            if (analyticsPayloadEl) {
                analyticsPayloadEl.innerHTML = error(
                    "Analytics API module is not available."
                );
            }
        }


        /*
         * ------------------------------------------------------------
         * FINAL
         * ------------------------------------------------------------
         */

        console.log(
            "Tailora dashboard finished loading."
        );

    });

})();