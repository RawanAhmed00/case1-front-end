(function () {
  "use strict";

  // ============================================================
  // STATE
  // ============================================================

  const state = {
    map: null,
    allLocations: [],
    markers: [],
    markerCluster: null,

    activeType: "all",
    search: "",

    routeLayer: null,

    start: null,
    end: null,

    startMarker: null,
    endMarker: null,
    userMarker: null
  };

  const labels = {
    attraction: "Attraction",
    hotel: "Hotel",
    restaurant: "Restaurant"
  };

  // ============================================================
  // HELPERS
  // ============================================================

  function list(response) {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    if (
      response &&
      response.data &&
      Array.isArray(response.data.data)
    ) {
      return response.data.data;
    }

    return [];
  }

  function esc(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function val(object, keys, fallback = null) {
    for (const key of keys) {
      const value = key
        .split(".")
        .reduce(
          (current, part) =>
            current &&
            current[part] !== undefined
              ? current[part]
              : undefined,
          object
        );

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return fallback;
  }

  function coords(object) {
    const lat = Number(
      val(object, [
        "latitude",
        "lat",
        "location.latitude",
        "location.lat",
        "coordinates.latitude",
        "coordinates.lat"
      ])
    );

    const lng = Number(
      val(object, [
        "longitude",
        "lng",
        "lon",
        "location.longitude",
        "location.lng",
        "location.lon",
        "coordinates.longitude",
        "coordinates.lng",
        "coordinates.lon"
      ])
    );

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }

    return [lat, lng];
  }

  function normalize(object, type) {
    const position = coords(object);

    if (!position) {
      return null;
    }

    return {
      id: val(object, [
        "id",
        type + "_id"
      ]),

      type,

      name: String(
        val(
          object,
          [
            "name",
            "title",
            type + "_name"
          ],
          "Unnamed location"
        )
      ),

      city: String(
        val(
          object,
          [
            "city",
            "location.city",
            "address.city"
          ],
          ""
        )
      ),

      rating: val(object, [
        "rating",
        "stars"
      ]),

      price: val(object, [
        "price_per_night",
        "price",
        "average_price"
      ]),

      lat: position[0],
      lng: position[1]
    };
  }

  // ============================================================
  // MAP INITIALIZATION
  // ============================================================

  function init() {
    const mapElement =
      document.getElementById("tailora-map");

    if (!mapElement) {
      console.error(
        "Map element #tailora-map was not found."
      );
      return false;
    }

    if (typeof L === "undefined") {
      console.error(
        "Leaflet was not loaded."
      );
      return false;
    }

    state.map = L.map(
      "tailora-map",
      {
        zoomControl: true,
        attributionControl: true
      }
    ).setView(
      [20, 0],
      2
    );

    // OpenStreetMap tiles
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        minZoom: 2,
        attribution:
          "&copy; OpenStreetMap contributors"
      }
    ).addTo(state.map);

    // Marker Cluster
    if (
      typeof L.markerClusterGroup === "function"
    ) {
      state.markerCluster =
        L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
          animate: true,

          // At this zoom level individual markers
          // become visible instead of staying clustered.
          disableClusteringAtZoom: 8,

          maxClusterRadius: 55
        });

      state.map.addLayer(
        state.markerCluster
      );
    } else {
      console.warn(
        "Leaflet MarkerCluster was not loaded. Normal markers will be used."
      );
    }

    // Click on empty map = start / destination
    state.map.on(
      "click",
      function (event) {
        if (!state.start) {
          setStart({
            name: "Map point",
            lat: event.latlng.lat,
            lng: event.latlng.lng
          });
        } else if (!state.end) {
          setEnd({
            name: "Map point",
            lat: event.latlng.lat,
            lng: event.latlng.lng
          });
        }
      }
    );

    // Fix Leaflet rendering inside layout
    setTimeout(
      function () {
        if (state.map) {
          state.map.invalidateSize(true);
        }
      },
      300
    );

    setTimeout(
      function () {
        if (state.map) {
          state.map.invalidateSize(true);
        }
      },
      1000
    );

    return true;
  }

  // ============================================================
  // MARKER ICON
  // ============================================================

  function icon(type) {
    return L.divIcon({
      className: "",

      html:
        '<div class="tl-map-marker tl-map-marker--' +
        type +
        '">' +
        "<span></span>" +
        "</div>",

      iconSize: [28, 28],

      iconAnchor: [14, 28],

      popupAnchor: [0, -27]
    });
  }

  // ============================================================
  // POPUP
  // ============================================================

  function popup(location) {
    return (
      '<div class="tl-map-popup">' +

        '<div class="tl-map-popup-type">' +
          esc(labels[location.type]) +
        "</div>" +

        "<h3>" +
          esc(location.name) +
        "</h3>" +

        (
          location.city
            ? "<p>" +
              esc(location.city) +
              "</p>"
            : ""
        ) +

        (
          location.rating !== null &&
          location.rating !== undefined
            ? "<p>Rating: " +
              esc(location.rating) +
              "</p>"
            : ""
        ) +

        (
          location.type === "hotel" &&
          location.price !== null &&
          location.price !== undefined
            ? "<p>Price/night: " +
              esc(location.price) +
              "</p>"
            : ""
        ) +

        '<div class="tl-map-popup-actions">' +

          '<button type="button" ' +
            'data-route-action="start" ' +
            'data-id="' +
              esc(location.id) +
            '" ' +
            'data-type="' +
              location.type +
            '">' +
            "Start here" +
          "</button>" +

          '<button type="button" ' +
            'data-route-action="end" ' +
            'data-id="' +
              esc(location.id) +
            '" ' +
            'data-type="' +
              location.type +
            '">' +
            "Go here" +
          "</button>" +

        "</div>" +

      "</div>"
    );
  }

  // ============================================================
  // ROUTE POINTS
  // ============================================================

  function setStart(location) {
    state.start = location;

    if (state.startMarker) {
      state.map.removeLayer(
        state.startMarker
      );
    }

    state.startMarker =
      L.marker([
        location.lat,
        location.lng
      ]).addTo(state.map);

    const input =
      document.getElementById(
        "route-start"
      );

    if (input) {
      input.value =
        location.name +
        " (" +
        location.lat.toFixed(5) +
        ", " +
        location.lng.toFixed(5) +
        ")";
    }

    updateButton();
  }

  function setEnd(location) {
    state.end = location;

    if (state.endMarker) {
      state.map.removeLayer(
        state.endMarker
      );
    }

    state.endMarker =
      L.marker([
        location.lat,
        location.lng
      ]).addTo(state.map);

    const input =
      document.getElementById(
        "route-end"
      );

    if (input) {
      input.value =
        location.name +
        " (" +
        location.lat.toFixed(5) +
        ", " +
        location.lng.toFixed(5) +
        ")";
    }

    updateButton();
  }

  function updateButton() {
    const button =
      document.getElementById(
        "route-build"
      );

    if (!button) {
      return;
    }

    button.disabled =
      !(state.start && state.end);
  }

  // ============================================================
  // FILTER
  // ============================================================

  function matches(location) {
    if (
      state.activeType !== "all" &&
      location.type !== state.activeType
    ) {
      return false;
    }

    const query =
      state.search
        .trim()
        .toLowerCase();

    if (!query) {
      return true;
    }

    return [
      location.name,
      location.city,
      location.type
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  }

  // ============================================================
  // RENDER MARKERS
  // ============================================================

  function render() {
    if (!state.map) {
      return;
    }

    // Remove old cluster
    if (state.markerCluster) {
      state.map.removeLayer(
        state.markerCluster
      );

      state.markerCluster = null;
    }

    // Remove old normal markers
    state.markers.forEach(
      function (marker) {
        state.map.removeLayer(
          marker
        );
      }
    );

    state.markers = [];

    // Create a new cluster
    if (
      typeof L.markerClusterGroup === "function"
    ) {
      state.markerCluster =
        L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
          animate: true,
          disableClusteringAtZoom: 8,
          maxClusterRadius: 55
        });

      state.map.addLayer(
        state.markerCluster
      );
    }

    const visible =
      state.allLocations.filter(
        matches
      );

    visible.forEach(
      function (location) {
        const marker =
          L.marker(
            [
              location.lat,
              location.lng
            ],
            {
              icon:
                icon(location.type)
            }
          )
          .bindPopup(
            popup(location)
          );

        marker.on(
          "popupopen",
          function (event) {
            const popupElement =
              event.popup.getElement();

            if (!popupElement) {
              return;
            }

            popupElement
              .querySelectorAll(
                "[data-route-action]"
              )
              .forEach(
                function (button) {
                  button.onclick =
                    function () {

                      const selected =
                        state.allLocations.find(
                          function (item) {
                            return (
                              String(
                                item.id
                              ) ===
                                String(
                                  button.dataset.id
                                ) &&
                              item.type ===
                                button.dataset.type
                            );
                          }
                        );

                      if (!selected) {
                        return;
                      }

                      if (
                        button.dataset
                          .routeAction ===
                        "start"
                      ) {
                        setStart(
                          selected
                        );
                      } else {
                        setEnd(
                          selected
                        );
                      }

                      event.popup.remove();
                    };
                }
              );
          }
        );

        if (state.markerCluster) {
          state.markerCluster.addLayer(
            marker
          );
        } else {
          marker.addTo(
            state.map
          );

          state.markers.push(
            marker
          );
        }
      }
    );

    updateCounts(
      visible.length
    );
  }

  // ============================================================
  // COUNTS
  // ============================================================

  function updateCounts(
    visibleCount
  ) {
    const counts = {
      attraction: 0,
      hotel: 0,
      restaurant: 0
    };

    state.allLocations.forEach(
      function (location) {
        if (
          counts[
            location.type
          ] !== undefined
        ) {
          counts[
            location.type
          ]++;
        }
      }
    );

    const countElement =
      document.getElementById(
        "map-counts"
      );

    if (countElement) {
      countElement.innerHTML =
        "Showing <strong>" +
        visibleCount +
        "</strong> mapped locations." +
        "<br>Attractions: " +
        counts.attraction +
        "<br>Hotels: " +
        counts.hotel +
        "<br>Restaurants: " +
        counts.restaurant;
    }
  }

  // ============================================================
  // LOAD LOCATIONS
  // ============================================================

  async function load() {
    const loading =
      document.getElementById(
        "map-loading"
      );

    const errorElement =
      document.getElementById(
        "map-error"
      );

    try {
      if (loading) {
        loading.hidden = false;
      }

      if (errorElement) {
        errorElement.hidden = true;
        errorElement.textContent = "";
      }

    const [
  attractionsResponse,
  hotelsResponse,
  restaurantsResponse
] = await Promise.all([
 window.TL.Attractions.all(),
window.TL.Hotels.all(),
window.TL.Restaurants.all()
]);

      state.allLocations = [
        ...list(
          attractionsResponse
        )
          .map(
            function (item) {
              return normalize(
                item,
                "attraction"
              );
            }
          ),

        ...list(
          hotelsResponse
        )
          .map(
            function (item) {
              return normalize(
                item,
                "hotel"
              );
            }
          ),

        ...list(
          restaurantsResponse
        )
          .map(
            function (item) {
              return normalize(
                item,
                "restaurant"
              );
            }
          )
      ].filter(Boolean);

      render();

      if (
        state.allLocations.length
      ) {
        const bounds =
          L.latLngBounds(
            state.allLocations.map(
              function (location) {
                return [
                  location.lat,
                  location.lng
                ];
              }
            )
          );

        if (bounds.isValid()) {
          state.map.fitBounds(
            bounds.pad(0.08)
          );
        }
      }

      setTimeout(
        function () {
          if (state.map) {
            state.map.invalidateSize(
              true
            );
          }
        },
        300
      );

    } catch (error) {
      console.error(
        "Failed to load map locations:",
        error
      );

      if (errorElement) {
        errorElement.hidden = false;

        errorElement.textContent =
          error.message ||
          "Failed to load map locations.";
      }

    } finally {
      if (loading) {
        loading.hidden = true;
      }
    }
  }

  // ============================================================
  // ROUTING
  // ============================================================

  async function route() {
    if (
      !state.start ||
      !state.end
    ) {
      return;
    }

    const button =
      document.getElementById(
        "route-build"
      );

    const summary =
      document.getElementById(
        "route-summary"
      );

    if (!button) {
      return;
    }

    button.disabled = true;
    button.textContent =
      "Calculating...";

    try {
      const start =
        state.start;

      const end =
        state.end;

      const url =
        "https://router.project-osrm.org/route/v1/driving/" +
        start.lng +
        "," +
        start.lat +
        ";" +
        end.lng +
        "," +
        end.lat +
        "?overview=full&geometries=geojson";

      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Routing service request failed."
        );
      }

      const data =
        await response.json();

      if (
        data.code !== "Ok" ||
        !data.routes ||
        !data.routes.length
      ) {
        throw new Error(
          "No route found."
        );
      }

      if (state.routeLayer) {
        state.map.removeLayer(
          state.routeLayer
        );
      }

      state.routeLayer =
        L.geoJSON(
          data.routes[0].geometry,
          {
            style: {
              weight: 5,
              opacity: 0.9
            }
          }
        ).addTo(
          state.map
        );

      state.map.fitBounds(
        state.routeLayer
          .getBounds()
          .pad(0.12)
      );

      const kilometers =
        data.routes[0].distance /
        1000;

      const minutes =
        data.routes[0].duration /
        60;

      if (summary) {
        summary.hidden = false;

        summary.innerHTML =
          "<strong>" +
          kilometers.toFixed(1) +
          " km</strong> Estimated driving time: " +
          (
            minutes < 60
              ? Math.round(minutes) +
                " min"
              : Math.floor(
                  minutes / 60
                ) +
                "h " +
                Math.round(
                  minutes % 60
                ) +
                "min"
          );
      }

    } catch (error) {
      if (summary) {
        summary.hidden = false;

        summary.innerHTML =
          "<strong>Could not calculate route.</strong> " +
          esc(error.message);
      }

    } finally {
      button.textContent =
        "Get Directions";

      updateButton();
    }
  }

  // ============================================================
  // CLEAR ROUTE
  // ============================================================

  function clear() {
    state.start = null;
    state.end = null;

    if (state.routeLayer) {
      state.map.removeLayer(
        state.routeLayer
      );
    }

    if (state.startMarker) {
      state.map.removeLayer(
        state.startMarker
      );
    }

    if (state.endMarker) {
      state.map.removeLayer(
        state.endMarker
      );
    }

    state.routeLayer = null;
    state.startMarker = null;
    state.endMarker = null;

    const startInput =
      document.getElementById(
        "route-start"
      );

    const endInput =
      document.getElementById(
        "route-end"
      );

    if (startInput) {
      startInput.value = "";
    }

    if (endInput) {
      endInput.value = "";
    }

    const summary =
      document.getElementById(
        "route-summary"
      );

    if (summary) {
      summary.hidden = true;
      summary.innerHTML = "";
    }

    updateButton();
  }

  // ============================================================
  // USER LOCATION
  // ============================================================

  function locate() {
    if (
      !navigator.geolocation
    ) {
      alert(
        "Geolocation is not supported by this browser."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {

        const location = {
          name: "My location",

          lat:
            position.coords.latitude,

          lng:
            position.coords.longitude
        };

        setStart(
          location
        );

        state.map.setView(
          [
            location.lat,
            location.lng
          ],
          14
        );

        if (state.userMarker) {
          state.map.removeLayer(
            state.userMarker
          );
        }

        state.userMarker =
          L.circleMarker(
            [
              location.lat,
              location.lng
            ],
            {
              radius: 8
            }
          ).addTo(
            state.map
          );
      },

      function () {
        alert(
          "Could not get your location. Please allow location access."
        );
      }
    );
  }

  // ============================================================
  // INITIALIZE PAGE
  // ============================================================

  document.addEventListener(
    "DOMContentLoaded",
    function () {

      const initialized =
        init();

      if (!initialized) {
        return;
      }

      const search =
        document.getElementById(
          "map-search"
        );

      if (search) {
        search.oninput =
          function (event) {

            state.search =
              event.target.value;

            render();
          };
      }

      document
        .querySelectorAll(
          ".tl-map-filter"
        )
        .forEach(
          function (button) {

            button.onclick =
              function () {

                document
                  .querySelectorAll(
                    ".tl-map-filter"
                  )
                  .forEach(
                    function (item) {

                      item.classList.remove(
                        "is-active"
                      );
                    }
                  );

                button.classList.add(
                  "is-active"
                );

                state.activeType =
                  button.dataset.type;

                render();
              };
          }
        );

      const routeButton =
        document.getElementById(
          "route-build"
        );

      if (routeButton) {
        routeButton.onclick =
          route;
      }

      const clearButton =
        document.getElementById(
          "map-clear-route"
        );

      if (clearButton) {
        clearButton.onclick =
          clear;
      }

      const locationButton =
        document.getElementById(
          "route-use-location"
        );

      if (locationButton) {
        locationButton.onclick =
          locate;
      }

      load();
    }
  );

})();