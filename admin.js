
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


/* ==========================================
   INVENTORY MANAGEMENT
   Connects to the admin-inventory Edge Function.
   Keeps existing login and order code separate.
========================================== */

(() => {
    // Prevent duplicate event listeners if this code is loaded twice.
    if (window.inventoryManagerInitialized) return;
    window.inventoryManagerInitialized = true;

    const inventoryElements = {
        panel: document.getElementById("inventoryPanel"),
        activeCount: document.getElementById("activeProductsCount"),
        totalStock: document.getElementById("totalStockCount"),
        lowStock: document.getElementById("lowStockCount"),

        refreshButton: document.getElementById("refreshInventoryButton"),
        addButton: document.getElementById("addProductButton"),

        form: document.getElementById("productForm"),
        originalName: document.getElementById("originalProductName"),
        name: document.getElementById("productName"),
        price: document.getElementById("productPrice"),
        stock: document.getElementById("productStock"),
        threshold: document.getElementById("productLowStock"),
        active: document.getElementById("productActive"),

        saveButton: document.getElementById("saveProductButton"),
        cancelButton: document.getElementById("cancelProductButton"),

        tableBody: document.getElementById("productsTableBody"),
        message: document.getElementById("inventoryMessage")
    };

    // Do not interfere if the inventory HTML has not been added.
    if (
        !inventoryElements.panel ||
        !inventoryElements.form ||
        !inventoryElements.tableBody
    ) {
        console.warn("Inventory HTML elements were not found.");
        return;
    }

    // Uses the existing Supabase client created by admin.js.
    if (typeof supabaseClient === "undefined") {
        console.error("The existing supabaseClient was not found.");
        return;
    }

    let inventoryProducts = [];
    let inventoryLoading = false;

    function showInventoryMessage(message, isError = false) {
        inventoryElements.message.textContent = message;
        inventoryElements.message.style.color = isError
            ? "#b91c1c"
            : "#166534";
    }

    function getActiveValue() {
        const field = inventoryElements.active;

        if (field.type === "checkbox") {
            return field.checked;
        }

        return field.value === "true" || field.value === "active";
    }

    function setActiveValue(isActive) {
        const field = inventoryElements.active;

        if (field.type === "checkbox") {
            field.checked = isActive;
        } else {
            field.value = isActive ? "true" : "false";
        }
    }

    function formatMoney(value) {
        return "GH₵ " + Number(value).toLocaleString("en-GH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function createCell(text) {
        const cell = document.createElement("td");
        cell.textContent = text;
        cell.style.padding = "10px";
        return cell;
    }

    function renderInventory() {
        const activeProducts = inventoryProducts.filter(
            product => product.active === true
        );

        const totalUnits = inventoryProducts.reduce(
            (total, product) =>
                total + Number(product.stock_quantity || 0),
            0
        );

        const lowStockProducts = activeProducts.filter(product =>
            Number(product.stock_quantity) <=
            Number(product.low_stock_threshold)
        );

        inventoryElements.activeCount.textContent =
            activeProducts.length;

        inventoryElements.totalStock.textContent = totalUnits;

        inventoryElements.lowStock.textContent =
            lowStockProducts.length;

        inventoryElements.tableBody.replaceChildren();

        if (inventoryProducts.length === 0) {
            const row = document.createElement("tr");
            const cell = createCell("No products found. Add your first product.");
            cell.colSpan = 6;
            row.appendChild(cell);
            inventoryElements.tableBody.appendChild(row);
            return;
        }

        inventoryProducts.forEach(product => {
            const row = document.createElement("tr");

            const quantity = Number(product.stock_quantity || 0);
            const threshold = Number(product.low_stock_threshold || 0);
            const isLow = product.active && quantity <= threshold;

            row.appendChild(createCell(product.product_name));
            row.appendChild(createCell(formatMoney(product.unit_price)));
            row.appendChild(createCell(String(quantity)));

            const stockCell = createCell(
                isLow ? "LOW STOCK" : "OK"
            );

            stockCell.style.color = isLow ? "#b91c1c" : "#166534";
            stockCell.style.fontWeight = "bold";
            row.appendChild(stockCell);

            row.appendChild(
                createCell(product.active ? "Active" : "Inactive")
            );

            const actionCell = document.createElement("td");
            actionCell.style.padding = "10px";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.style.marginRight = "6px";

            editButton.addEventListener("click", () => {
                editProduct(product);
            });

            actionCell.appendChild(editButton);

            const toggleButton = document.createElement("button");
            toggleButton.type = "button";
            toggleButton.textContent = product.active
                ? "Deactivate"
                : "Activate";

            toggleButton.addEventListener("click", () => {
                changeProductAvailability(product);
            });

            actionCell.appendChild(toggleButton);
            row.appendChild(actionCell);

            inventoryElements.tableBody.appendChild(row);
        });
    }

    async function callInventoryFunction(method = "GET", body) {
        const options = { method };

        if (body !== undefined) {
            options.body = body;
        }

        const { data, error } = await supabaseClient.functions.invoke(
            "admin-inventory",
            options
        );

        if (error) {
            // The function may return a useful message in its response body.
            let detail = error.message || "Request failed.";

            if (error.context && typeof error.context.json === "function") {
                try {
                    const responseBody = await error.context.json();

                    if (responseBody.error) {
                        detail = responseBody.error;
                    }
                } catch (_) {
                    // Keep the original error message.
                }
            }

            throw new Error(detail);
        }

        if (data && data.error) {
            throw new Error(data.error);
        }

        return data;
    }

    async function loadInventory() {
        if (inventoryLoading) return;

        inventoryLoading = true;
        inventoryElements.refreshButton.disabled = true;
        showInventoryMessage("Loading products...");

        try {
            const data = await callInventoryFunction("GET");

            inventoryProducts = Array.isArray(data.products)
                ? data.products
                : [];

            renderInventory();
            showInventoryMessage(
                "Inventory loaded successfully."
            );
        } catch (error) {
            console.error("Inventory loading failed:", error);

            showInventoryMessage(
                "Could not load inventory: " + error.message,
                true
            );
        } finally {
            inventoryLoading = false;
            inventoryElements.refreshButton.disabled = false;
        }
    }

    function resetProductForm() {
        inventoryElements.form.reset();
        inventoryElements.originalName.value = "";
        inventoryElements.name.disabled = false;
        inventoryElements.saveButton.textContent = "Save Product";
        showInventoryMessage("");
    }

    
function editProduct(product) {
    // Show the hidden product form first.
    inventoryElements.form.hidden = false;

    inventoryElements.originalName.value = product.product_name;
    inventoryElements.name.value = product.product_name;

    // Keep the rest of your existing editProduct code below.


        // Product names are database references, so renaming is disabled.
        inventoryElements.name.disabled = true;

        inventoryElements.price.value = product.unit_price;
        inventoryElements.stock.value = product.stock_quantity;
        inventoryElements.threshold.value =
            product.low_stock_threshold;

        setActiveValue(product.active);

        inventoryElements.saveButton.textContent = "Update Product";

        showInventoryMessage(
            "Editing " + product.product_name +
            ". Product names cannot be changed yet."
        );

        inventoryElements.form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    async function changeProductAvailability(product) {
        const action = product.active ? "deactivate" : "activate";

        if (!window.confirm(
            "Are you sure you want to " + action +
            " " + product.product_name + "?"
        )) {
            return;
        }

        try {
            if (product.active) {
                await callInventoryFunction("DELETE", {
                    product_name: product.product_name
                });
            } else {
                await callInventoryFunction("PATCH", {
                    original_product_name: product.product_name,
                    product_name: product.product_name,
                    unit_price: Number(product.unit_price),
                    stock_quantity: Number(product.stock_quantity),
                    low_stock_threshold:
                        Number(product.low_stock_threshold),
                    active: true
                });
            }

            showInventoryMessage(
                "Product " + action + "d successfully."
            );

            await loadInventory();
        } catch (error) {
            console.error("Product availability update failed:", error);

            showInventoryMessage(
                "Could not change availability: " + error.message,
                true
            );
        }
    }

    inventoryElements.form.addEventListener("submit", async event => {
        event.preventDefault();

        const originalName =
            inventoryElements.originalName.value.trim();

        const productName = inventoryElements.name.value.trim();
        const unitPrice = Number(inventoryElements.price.value);
        const stockQuantity = Number(inventoryElements.stock.value);
        const lowStockThreshold =
            Number(inventoryElements.threshold.value);

        if (!productName) {
            showInventoryMessage("Enter a product name.", true);
            return;
        }

        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
            showInventoryMessage(
                "Enter a price greater than zero.",
                true
            );
            return;
        }

        if (
            !Number.isSafeInteger(stockQuantity) ||
            stockQuantity < 0 ||
            !Number.isSafeInteger(lowStockThreshold) ||
            lowStockThreshold < 0
        ) {
            showInventoryMessage(
                "Stock and warning level must be whole numbers of zero or more.",
                true
            );
            return;
        }

        const payload = {
            product_name: productName,
            unit_price: unitPrice,
            stock_quantity: stockQuantity,
            low_stock_threshold: lowStockThreshold,
            active: getActiveValue()
        };

        const isEditing = Boolean(originalName);

        if (isEditing) {
            payload.original_product_name = originalName;
        }

        inventoryElements.saveButton.disabled = true;
        showInventoryMessage(
            isEditing ? "Updating product..." : "Adding product..."
        );

        try {
            await callInventoryFunction(
                isEditing ? "PATCH" : "POST",
                payload
            );

            resetProductForm();

            showInventoryMessage(
                isEditing
                    ? "Product updated successfully."
                    : "Product added successfully."
            );

            await loadInventory();
        } catch (error) {
            console.error("Saving product failed:", error);

            showInventoryMessage(
                "Could not save product: " + error.message,
                true
            );
        } finally {
            inventoryElements.saveButton.disabled = false;
        }
    });

    inventoryElements.refreshButton.addEventListener(
        "click",
        loadInventory
    );

    
inventoryElements.addButton.addEventListener("click", () => {
    resetProductForm();

    // Show the hidden product form.
    inventoryElements.form.hidden = false;

    // Allow a new product name to be entered.
    inventoryElements.name.disabled = false;

    // Update the form heading.
    const formTitle = document.getElementById("productFormTitle");
    if (formTitle) {
        formTitle.textContent = "Add a new product";
    }

    inventoryElements.form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    inventoryElements.name.focus();
});


    
inventoryElements.cancelButton.addEventListener("click", () => {
    resetProductForm();

    // Hide the product form again.
    inventoryElements.form.hidden = true;
});


    // Load inventory when the existing admin dashboard becomes visible.
    // This avoids changing your existing login or order handlers.
    function dashboardIsVisible() {
        const dashboard = document.getElementById("dashboard");

        return dashboard &&
            dashboard.style.display !== "none" &&
            window.getComputedStyle(dashboard).display !== "none";
    }

    const dashboard = document.getElementById("dashboard");

    if (dashboard) {
        const observer = new MutationObserver(() => {
            if (dashboardIsVisible()) {
                loadInventory();
            }
        });

        observer.observe(dashboard, {
            attributes: true,
            attributeFilter: ["style", "class", "hidden"]
        });

        if (dashboardIsVisible()) {
            loadInventory();
        }
    }

    console.log("Inventory management initialized.");
})();
