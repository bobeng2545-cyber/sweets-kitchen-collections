
const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";

// This is your public publishable key, not your service-role key.
const SUPABASE_ANON_KEY =
    "sb_publishable_QN5w738LNyUrYy2X93M1OQ_md6F2xTN";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// HTML elements
const loginPanel = document.getElementById("loginPanel");
const loginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");
const dashboard = document.getElementById("dashboard");
const logoutButton = document.getElementById("logoutButton");

const ordersTableBody = document.getElementById("ordersTableBody");
const ordersMessage = document.getElementById("ordersMessage");
const refreshOrdersBtn = document.getElementById("refreshOrdersButton");
const searchOrders = document.getElementById("searchOrders");

const paidOrdersCount = document.getElementById("paidOrdersCount");
const pendingOrdersCount = document.getElementById("pendingOrdersCount");

const allowedStatuses = [
    "pending",
    "preparing",
    "ready",
    "delivered",
    "cancelled"
];

let allOrders = [];

// Display login messages
function showLoginMessage(message, isError = true) {
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.style.color = isError ? "red" : "green";
}

// Display order messages
function showOrdersMessage(message, isError = false) {
    if (!ordersMessage) return;

    ordersMessage.textContent = message;
    ordersMessage.style.color = isError ? "red" : "#687386";
}

// Check whether the signed-in user is an administrator
async function checkAdminAccess() {
    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        return false;
    }

    const { data, error } = await supabaseClient
        .from("store_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        throw new Error(
            "Could not verify administrator access: " + error.message
        );
    }

    if (!data) {
        await supabaseClient.auth.signOut();
        throw new Error(
            "This account is not authorized as an administrator."
        );
    }

    return true;
}

// Show the dashboard after administrator verification
function showDashboard() {
    if (loginPanel) loginPanel.hidden = true;
    if (dashboard) dashboard.hidden = false;
    if (logoutButton) logoutButton.hidden = false;
}

// Return to the login screen
function showLoginPanel() {
    if (loginPanel) loginPanel.hidden = false;
    if (dashboard) dashboard.hidden = true;
    if (logoutButton) logoutButton.hidden = true;
}

// Administrator login
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document
            .getElementById("adminEmail")
            .value.trim();

        const password = document
            .getElementById("adminPassword")
            .value;

        loginButton.disabled = true;
        showLoginMessage("Signing in...", false);

        try {
            const { error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {
                showLoginMessage("Sign-in failed: " + error.message);
                return;
            }

            const isAdmin = await checkAdminAccess();

            if (!isAdmin) return;

            showDashboard();
            showLoginMessage("Administrator login successful.", false);

            await loadAdminOrders();

        } catch (error) {
            showLoginMessage(
                error.message || "An unexpected login error occurred."
            );
        } finally {
            loginButton.disabled = false;
        }
    });
}

// Sign out
if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;

        try {
            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                showLoginMessage("Sign-out failed: " + error.message);
                return;
            }

            allOrders = [];
            showLoginPanel();
            loginForm?.reset();
            showLoginMessage("You have signed out.", false);

        } catch (error) {
            showLoginMessage("Sign-out failed: " + error.message);
        } finally {
            logoutButton.disabled = false;
        }
    });
}

// Load orders from the protected Supabase Edge Function
async function loadAdminOrders() {
    if (!ordersTableBody) {
        console.error("Could not find ordersTableBody in admin.html.");
        return;
    }

    if (refreshOrdersBtn) {
        refreshOrdersBtn.disabled = true;
    }

    showOrdersMessage("Loading orders...");
    ordersTableBody.replaceChildren();

    try {
        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession();

        if (sessionError || !session) {
            throw new Error("Your session has expired. Please sign in again.");
        }

        const { data, error } =
            await supabaseClient.functions.invoke("admin-orders", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

        if (error) {
            throw error;
        }

        const orders = Array.isArray(data)
            ? data
            : data?.orders;

        if (!Array.isArray(orders)) {
            throw new Error(
                "The server returned an unexpected orders response."
            );
        }

        allOrders = orders;

        // Update summary counts
        if (paidOrdersCount) {
            paidOrdersCount.textContent = allOrders.filter(
                order =>
                    String(order.payment_status || "").toLowerCase() === "paid"
            ).length;
        }

        if (pendingOrdersCount) {
            pendingOrdersCount.textContent = allOrders.filter(
                order =>
                    String(order.order_status || "").toLowerCase() === "pending"
            ).length;
        }

        renderOrders();

        showOrdersMessage(`Loaded ${allOrders.length} order(s).`);

    } catch (error) {
        console.error("Loading admin orders failed:", error);

        ordersTableBody.replaceChildren();

        showOrdersMessage(
            "Could not load orders: " +
            (error.message || "An unexpected error occurred."),
            true
        );
    } finally {
        if (refreshOrdersBtn) {
            refreshOrdersBtn.disabled = false;
        }
    }
}

// Display orders in the HTML table
function renderOrders() {
    if (!ordersTableBody) return;

    const searchTerm = (searchOrders?.value || "")
        .trim()
        .toLowerCase();

    const filteredOrders = allOrders.filter(order =>
        String(order.order_reference || "")
            .toLowerCase()
            .includes(searchTerm)
    );

    ordersTableBody.replaceChildren();

    if (filteredOrders.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = searchTerm
            ? "No orders match your search."
            : "No orders found.";

        row.appendChild(cell);
        ordersTableBody.appendChild(row);
        return;
    }

    filteredOrders.forEach(order => {
        const row = document.createElement("tr");

        // Order reference
        const referenceCell = document.createElement("td");
        referenceCell.textContent = order.order_reference || "N/A";

        // Total amount
        const totalCell = document.createElement("td");
        const total = Number(order.total_amount);

        totalCell.textContent = Number.isFinite(total)
            ? total.toFixed(2)
            : "N/A";

        // Payment status
        const paymentCell = document.createElement("td");
        paymentCell.textContent = order.payment_status || "pending";

        // Order status selector
        const statusCell = document.createElement("td");
        const statusSelect = document.createElement("select");

        statusSelect.setAttribute(
            "aria-label",
            `Status for order ${order.order_reference || order.id}`
        );

        allowedStatuses.forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent =
                status.charAt(0).toUpperCase() + status.slice(1);

            statusSelect.appendChild(option);
        });

        const currentStatus = String(
            order.order_status || "pending"
        ).toLowerCase();

        statusSelect.value = allowedStatuses.includes(currentStatus)
            ? currentStatus
            : "pending";

        statusCell.appendChild(statusSelect);

        // Save button and feedback
        const actionCell = document.createElement("td");
        const saveButton = document.createElement("button");
        const feedback = document.createElement("small");

        saveButton.type = "button";
        saveButton.textContent = "Save Status";

        feedback.setAttribute("aria-live", "polite");
        feedback.style.display = "block";
        feedback.style.marginTop = "6px";

        saveButton.addEventListener("click", async () => {
            if (!order.id) {
                feedback.textContent = "Order ID is missing.";
                return;
            }

            saveButton.disabled = true;
            statusSelect.disabled = true;
            feedback.textContent = "Saving...";

            try {
                const {
                    data: { session },
                    error: sessionError
                } = await supabaseClient.auth.getSession();

                if (sessionError || !session) {
                    throw new Error(
                        "Your session has expired. Please sign in again."
                    );
                }

                const { data, error } =
                    await supabaseClient.functions.invoke("admin-orders", {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${session.access_token}`
                        },
                        body: {
                            // The Edge Function expects "id", not "order_id".
                            id: order.id,
                            order_status: statusSelect.value
                        }
                    });

                if (error) throw error;

                if (!data?.order) {
                    throw new Error(
                        "The server did not confirm the status update."
                    );
                }

                order.order_status = data.order.order_status;

                statusSelect.value = data.order.order_status;

                // Refresh counts and the visible order table.
                if (pendingOrdersCount) {
                    pendingOrdersCount.textContent = allOrders.filter(
                        item =>
                            String(item.order_status || "").toLowerCase() ===
                            "pending"
                    ).length;
                }

                feedback.textContent = "Status updated successfully.";
                showOrdersMessage("Order status updated successfully.");

            } catch (error) {
                console.error("Updating order status failed:", error);

                feedback.textContent =
                    "Update failed: " +
                    (error.message || "Please try again.");

            } finally {
                saveButton.disabled = false;
                statusSelect.disabled = false;
            }
        });

        actionCell.append(saveButton, feedback);

        row.append(
            referenceCell,
            totalCell,
            paymentCell,
            statusCell,
            actionCell
        );

        ordersTableBody.appendChild(row);
    });
}

// Search by order reference
if (searchOrders) {
    searchOrders.addEventListener("input", renderOrders);
}

// Refresh orders
if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener("click", loadAdminOrders);
}

// Restore the dashboard when an administrator already has a valid session
async function initializeAdminDashboard() {
    showLoginPanel();

    try {
        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (!session) return;

        const isAdmin = await checkAdminAccess();

        if (!isAdmin) return;

        showDashboard();
        await loadAdminOrders();

    } catch (error) {
        console.error("Dashboard initialization failed:", error);

        showLoginPanel();

        showLoginMessage(
            error.message || "Please sign in to continue."
        );
    }
}

initializeAdminDashboard();
