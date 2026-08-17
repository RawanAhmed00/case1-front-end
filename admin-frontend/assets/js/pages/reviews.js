(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {

    const P = TL.Pages;
    const state = document.getElementById("reviewsState");
    const refreshButton = document.getElementById("reviewsRefresh");


    // ============================================================
    // LOAD REVIEWS
    // ============================================================

    async function load() {

      if (!state) {
        return;
      }

      state.innerHTML = `
        <div class="tl-inline-loader">
          <div class="tl-spinner"></div>
        </div>
      `;


      try {

        const response = await TL.Reviews.getReviews();

        /*
         * Support the common Laravel API response formats:
         *
         * { data: [...] }
         * { data: { data: [...] } }
         * [...]
         */

        const rows =
          response?.data?.data ||
          response?.data ||
          response;


        if (!Array.isArray(rows)) {

          state.innerHTML = P.empty(
            "Review data unavailable",
            "The API response does not contain a review collection.",
            "bi-star"
          );

          return;
        }


        if (rows.length === 0) {

          state.innerHTML = P.empty(
            "No reviews available",
            "The API returned an empty review collection.",
            "bi-star"
          );

          return;
        }


        // ========================================================
        // REVIEW TABLE
        // ========================================================

        state.innerHTML = `
          <div class="tl-table-wrap">

            <table class="tl-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Rating</th>
                  <th>Content</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                ${rows.map(function (review) {

          const user =
            review.user?.name ??
            review.user ??
            review.user_name ??
            "—";

          const content =
            review.review_text ??
            review.comment ??
            review.content ??
            "—";

          const rating =
            review.rating ??
            "—";

          const status =
            review.status ??
            "—";


          return `
                    <tr>

                      <td>
                        ${P.escape(P.display(review.id))}
                      </td>

                      <td>
                        ${P.escape(P.display(user))}
                      </td>

                      <td>
                        ${P.escape(P.display(rating))}
                      </td>

                      <td>
                        ${P.escape(P.display(content))}
                      </td>

                      <td>
                        ${P.badge(status)}
                      </td>

                      <td>

                        <div class="tl-table-actions">

                          <button
                            type="button"
                            class="tl-btn tl-btn--outline tl-btn--sm"
                            data-approve="${P.escape(review.id)}">
                            Approve
                          </button>

                          <button
                            type="button"
                            class="tl-btn tl-btn--outline tl-btn--sm"
                            data-reject="${P.escape(review.id)}">
                            Reject
                          </button>

                          <button
                            type="button"
                            class="tl-btn tl-btn--danger tl-btn--sm"
                            data-review-delete="${P.escape(review.id)}">
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  `;

        }).join("")}

              </tbody>

            </table>

          </div>
        `;

      } catch (e) {

        console.error("Failed to load reviews:", e);

        state.innerHTML = P.error(
          e.message || "Failed to load reviews."
        );

      }

    }


    // ============================================================
    // REFRESH
    // ============================================================

    if (refreshButton) {

      refreshButton.addEventListener("click", function () {
        load();
      });

    }


    // ============================================================
    // ACTIONS
    // ============================================================

    if (state) {

      state.addEventListener("click", async function (e) {

        const approveButton =
          e.target.closest("[data-approve]");

        const rejectButton =
          e.target.closest("[data-reject]");

        const deleteButton =
          e.target.closest("[data-review-delete]");


        try {

          // ------------------------------------------------------
          // APPROVE
          // ------------------------------------------------------

          if (approveButton) {

            const id = approveButton.dataset.approve;

            await TL.Reviews.approveReview(id);

            TL.showToast(
              "Review approved.",
              "success"
            );

            load();

            return;
          }


          // ------------------------------------------------------
          // REJECT
          // ------------------------------------------------------

          if (rejectButton) {

            const id = rejectButton.dataset.reject;

            await TL.Reviews.rejectReview(id);

            TL.showToast(
              "Review rejected.",
              "success"
            );

            load();

            return;
          }


          // ------------------------------------------------------
          // DELETE
          // ------------------------------------------------------

          if (deleteButton) {

            const id =
              deleteButton.dataset.reviewDelete;


            if (
              !P.confirm(
                "Delete this review? This cannot be undone."
              )
            ) {
              return;
            }


            await TL.Reviews.deleteReview(id);

            TL.showToast(
              "Review deleted.",
              "success"
            );

            load();

          }

        } catch (err) {

          console.error(
            "Review action failed:",
            err
          );

          TL.showToast(
            err.message || "Review action failed.",
            "error"
          );

        }

      });

    }


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    load();

  });

})();