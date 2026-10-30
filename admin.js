
// ==========================================
// SWEET's KITCHEN & COLLECTIONS
// COMPLETE ADMIN DASHBOARD
// ==========================================

const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_jOGj9C6m_fFryLL8yrcQmw_5wyZoidy";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ==========================================
// ADMIN HTML ELEMENTS
// ==========================================

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

// ==========================================
// INVENTORY ELEMENTS
// ==========================================

const inventoryElements = {
    panel: document.getElementById("inventoryPanel"),
    activeCount: document.getElementById("activeProductsCount"),
    totalStock: document.getElementById("totalStockCount"),
    lowStock: document.getElementById("lowStockCount"),
    refreshButton: document.getElementById("refreshInventoryButton"),
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

let inventoryProducts = [];
let inventoryLoading = false;

// ==========================================
// MESSAGE FUNCTIONS
// ==========================================

function showLoginMessage(message, isError = true) {
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.style.color = isError ? "red" : "green";
}

function showOrdersMessage(message, isError = false) {
    if (!ordersMessage) return;

    ordersMessage.textContent = message;
    ordersMessage.style.color = isError ? "red" : "#687386";
}

function showInventoryMessage(message, isError = false) {
    if (!inventoryElements.message) return;

    inventoryElements.message.textContent = message;
    inventoryElements.message.style.color =
        isError ? "#b91c1c" : "#166534";
}

// ==========================================
// ADMIN ACCESS VERIFICATION
// ==========================================

async function checkAdminAccess() {
    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) return false;

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

// ==========================================
// SHOW AND HIDE DASHBOARD
// ==========================================

function showDashboard() {
    if (loginPanel) loginPanel.hidden = true;
    if (dashboard) dashboard.hidden = false;
    if (logoutButton) logoutButton.hidden = false;
}

function showLoginPanel() {
    if (loginPanel) loginPanel.hidden = false;
    if (dashboard) dashboard.hidden = true;
    if (logoutButton) logoutButton.hidden = true;
}

// ==========================================
// LOGIN
// ==========================================

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("adminEmail")?.value.trim();
        const password = document.getElementById("adminPassword")?.value;

        if (!email || !password) {
            showLoginMessage("Enter your email and password.");
            return;
        }

        if (loginButton) loginButton.disabled = true;

        showLoginMessage("Signing in...", false);

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            await checkAdminAccess();

            showDashboard();

            await loadAdminOrders();
            await loadInventory();

            showLoginMessage("Administrator login successful.", false);

        } catch (error) {
            showLoginMessage("Sign-in failed: " + error.message);
        } finally {
            if (loginButton) loginButton.disabled = false;
        }
    });
}

// ==========================================
// LOGOUT
// ==========================================

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;

        try {
            const { error } = await supabaseClient.auth.signOut();

            if (error) throw error;

            allOrders = [];
            inventoryProducts = [];

            if (ordersTableBody) ordersTableBody.replaceChildren();
            if (inventoryElements.tableBody) {
                inventoryElements.tableBody.replaceChildren();
            }

            showLoginPanel();

            if (loginForm) loginForm.reset();

            showLoginMessage("You have signed out.", false);

        } catch (error) {
            showLoginMessage("Sign-out failed: " + error.message);
        } finally {
            logoutButton.disabled = false;
        }
    });
}

// ==========================================
// LOAD CUSTOMER ORDERS
// ==========================================

async function loadAdminOrders() {
    if (!ordersTableBody) return;

    if (refreshOrdersBtn) refreshOrdersBtn.disabled = true;

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

        if (error) throw error;

        const orders = Array.isArray(data) ? data : data?.orders;

        if (!Array.isArray(orders)) {
            throw new Error("Unexpected orders response.");
        }

        allOrders = orders;

        updateOrderSummary();
        renderOrders();

        showOrdersMessage(`Loaded ${allOrders.length} order(s).`);

    } catch (error) {
        console.error("Loading orders failed:", error);

        showOrdersMessage(
            "Could not load orders: " + error.message,
            true
        );
    } finally {
        if (refreshOrdersBtn) refreshOrdersBtn.disabled = false;
    }
}

// ==========================================
// ORDER SUMMARY
// ==========================================

function updateOrderSummary() {
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
}

// ==========================================
// DISPLAY ORDERS
// ==========================================

function renderOrders() {
    if (!ordersTableBody) return;

    const searchTerm = (searchOrders?.value || "").trim().toLowerCase();

    const filteredOrders = allOrders.filter(order =>
        String(order.order_reference || "").toLowerCase().includes(searchTerm)
    );

    ordersTableBody.replaceChildren();

    if (!filteredOrders.length) {
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

        const referenceCell = document.createElement("td");
        referenceCell.textContent = order.order_reference || "N/A";

        const totalCell = document.createElement("td");
        const total = Number(order.total_amount);

        totalCell.textContent = Number.isFinite(total)
            ? total.toFixed(2)
            : "N/A";

        const paymentCell = document.createElement("td");
        paymentCell.textContent = order.payment_status || "pending";

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
                    throw new Error("Your session has expired.");
                }

                const { data, error } =
                    await supabaseClient.functions.invoke("admin-orders", {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${session.access_token}`
                        },
                        body: {
                            id: order.id,
                            order_status: statusSelect.value
                        }
                    });

                if (error) throw error;

                if (!data?.order) {
                    throw new Error("The server did not confirm the update.");
                }

                order.order_status = data.order.order_status;
                statusSelect.value = data.order.order_status;

                updateOrderSummary();

                feedback.textContent = "Status updated successfully.";
                showOrdersMessage("Order status updated successfully.");

            } catch (error) {
                feedback.textContent = "Update failed: " + error.message;
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

if (searchOrders) {
    searchOrders.addEventListener("input", renderOrders);
}

if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener("click", loadAdminOrders);
}

// ==========================================
// INVENTORY HELPERS
// ==========================================

function getActiveValue() {
    const field = inventoryElements.active;

    if (!field) return false;

    return field.type === "checkbox"
        ? field.checked
        : field.value === "true" || field.value === "active";
}

function setActiveValue(isActive) {
    const field = inventoryElements.active;

    if (!field) return;

    if (field.type === "checkbox") {
        field.checked = isActive;
    } else {
        field.value = isActive ? "true" : "false";
    }
}

function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "N/A";

    return "GH₵ " + amount.toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text ?? "—";
    cell.style.padding = "10px";
    return cell;
}

// ==========================================
// INVENTORY TABLE AND SUMMARY
// ==========================================

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
        Number(product.stock_quantity || 0) <=
        Number(product.low_stock_threshold || 0)
    );

    if (inventoryElements.activeCount) {
        inventoryElements.activeCount.textContent = activeProducts.length;
    }

    if (inventoryElements.totalStock) {
        inventoryElements.totalStock.textContent = totalUnits;
    }

    if (inventoryElements.lowStock) {
        inventoryElements.lowStock.textContent = lowStockProducts.length;
    }

    if (!inventoryElements.tableBody) return;

    inventoryElements.tableBody.replaceChildren();

    if (!inventoryProducts.length) {
        const row = document.createElement("tr");
        const cell = createCell("No products found.");

        cell.colSpan = 7;
        row.appendChild(cell);
        inventoryElements.tableBody.appendChild(row);
        return;
    }

    inventoryProducts.forEach(product => {
        const row = document.createElement("tr");

        const quantity = Number(product.stock_quantity || 0);
        const threshold = Number(product.low_stock_threshold || 0);

        const isLow =
            product.active === true && quantity <= threshold;

        row.appendChild(createCell(product.product_name));
        row.appendChild(createCell(product.category || "—"));
        row.appendChild(createCell(formatMoney(product.unit_price)));
        row.appendChild(createCell(String(quantity)));

        const warningCell = createCell(String(threshold));

        if (isLow) {
            warningCell.classList.add("low-stock");
            warningCell.textContent += " (LOW)";
        } else {
            warningCell.classList.add("in-stock");
        }

        row.appendChild(warningCell);

        row.appendChild(createCell(
            product.active === true ? "Active" : "Inactive"
        ));

        const actionCell = document.createElement("td");
        actionCell.style.padding = "10px";

        // EDIT BUTTON
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editProduct(product));

        // ACTIVATE / DEACTIVATE BUTTON
        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.textContent =
            product.active === true ? "Deactivate" : "Activate";

        toggleButton.addEventListener("click", () =>
            changeProductAvailability(product)
        );

        // PERMANENT DELETE BUTTON
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.style.backgroundColor = "#b91c1c";
        deleteButton.style.color = "#ffffff";
        deleteButton.style.marginLeft = "6px";

        deleteButton.addEventListener("click", () =>
            permanentlyDeleteProduct(product)
        );

        actionCell.append(editButton, toggleButton, deleteButton);
        row.appendChild(actionCell);

        inventoryElements.tableBody.appendChild(row);
    });
}

// ==========================================
// CALL INVENTORY EDGE FUNCTION
// ==========================================

async function callInventoryFunction(method = "GET", body) {
    const options = { method };

    if (body !== undefined) {
        options.body = body;
    }

    const { data, error } =
        await supabaseClient.functions.invoke("admin-inventory", options);

    if (error) {
        let detail = error.message || "Request failed.";

        if (error.context && typeof error.context.json === "function") {
            try {
                const responseBody = await error.context.json();
                if (responseBody.error) detail = responseBody.error;
            } catch (_) {}
        }

        throw new Error(detail);
    }

    if (data?.error) throw new Error(data.error);

    return data;
}

// ==========================================
// LOAD INVENTORY
// ==========================================

async function loadInventory() {
    if (inventoryLoading) return;

    if (!inventoryElements.panel || !inventoryElements.tableBody) return;

    inventoryLoading = true;

    if (inventoryElements.refreshButton) {
        inventoryElements.refreshButton.disabled = true;
    }

    showInventoryMessage("Loading products...");

    try {
        const data = await callInventoryFunction("GET");

        inventoryProducts = Array.isArray(data?.products)
            ? data.products
            : [];

        renderInventory();

        showInventoryMessage("Inventory loaded successfully.");

    } catch (error) {
        console.error("Inventory loading failed:", error);

        showInventoryMessage(
            "Could not load inventory: " + error.message,
            true
        );
    } finally {
        inventoryLoading = false;

        if (inventoryElements.refreshButton) {
            inventoryElements.refreshButton.disabled = false;
        }
    }
}

// ==========================================
// RESET PRODUCT FORM
// ==========================================

function resetProductForm() {
    if (!inventoryElements.form) return;

    inventoryElements.form.reset();

    if (inventoryElements.originalName) {
        inventoryElements.originalName.value = "";
    }

    if (inventoryElements.name) {
        inventoryElements.name.disabled = false;
    }

    if (inventoryElements.saveButton) {
        inventoryElements.saveButton.textContent = "Update Product";
    }

    const formTitle = document.getElementById("productFormTitle");

    if (formTitle) {
        formTitle.textContent = "Edit existing product";
    }

    const imagePreview = document.getElementById("productImagePreview");
    const imageMessage = document.getElementById("productImageMessage");
    const imageInput = document.getElementById("productImage");

    if (imagePreview) {
        imagePreview.src = "";
        imagePreview.hidden = true;
    }

    if (imageInput) imageInput.value = "";

    if (imageMessage) {
        imageMessage.textContent = "Select an image to preview it.";
    }
}

// ==========================================
// EDIT AND RENAME PRODUCT
// ==========================================

function editProduct(product) {
    if (!inventoryElements.form) return;

    inventoryElements.form.hidden = false;

    inventoryElements.originalName.value = product.product_name;
    inventoryElements.name.value = product.product_name;

    // Renaming is enabled.
    inventoryElements.name.disabled = false;

    inventoryElements.price.value = product.unit_price;
    inventoryElements.stock.value = product.stock_quantity;
    inventoryElements.threshold.value = product.low_stock_threshold;

    setActiveValue(product.active);

    const formTitle = document.getElementById("productFormTitle");

    if (formTitle) {
        formTitle.textContent = "Edit or Rename Product";
    }

    if (inventoryElements.saveButton) {
        inventoryElements.saveButton.textContent = "Update Product";
    }

    const imageInput = document.getElementById("productImage");
    const imagePreview = document.getElementById("productImagePreview");
    const imageMessage = document.getElementById("productImageMessage");

    if (imageInput) imageInput.value = "";

    if (imagePreview) {
        imagePreview.src = "";
        imagePreview.hidden = true;
    }

    if (imageMessage) {
        imageMessage.textContent =
            "Image replacement is not enabled in this update form.";
    }

    showInventoryMessage("Editing " + product.product_name);

    inventoryElements.form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ==========================================
// ACTIVATE OR DEACTIVATE PRODUCT
// ==========================================

async function changeProductAvailability(product) {
    const newStatus = product.active !== true;
    const action = newStatus ? "activate" : "deactivate";

    if (!window.confirm(
        `Are you sure you want to ${action} ${product.product_name}?`
    )) return;

    try {
        // PATCH changes availability. It does NOT delete the product.
        await callInventoryFunction("PATCH", {
            original_product_name: product.product_name,
            product_name: product.product_name,
            unit_price: Number(product.unit_price),
            stock_quantity: Number(product.stock_quantity),
            low_stock_threshold: Number(product.low_stock_threshold),
            active: newStatus
        });

        showInventoryMessage(`Product ${action}d successfully.`);

        await loadInventory();

    } catch (error) {
        console.error("Product availability update failed:", error);

        showInventoryMessage(
            "Could not change availability: " + error.message,
            true
        );
    }
}

// ==========================================
// PERMANENTLY DELETE PRODUCT
// ==========================================

async function permanentlyDeleteProduct(product) {
    const confirmed = window.confirm(
        `WARNING: Permanently delete "${product.product_name}"?\n\n` +
        "This action cannot be undone. Existing order records will not be intentionally deleted.\n\n" +
        "Continue?"
    );

    if (!confirmed) return;

    try {
        showInventoryMessage("Deleting " + product.product_name + "...");

        // DELETE is reserved only for permanent deletion.
        await callInventoryFunction("DELETE", {
            product_name: product.product_name
        });

        showInventoryMessage(
            product.product_name + " was permanently deleted."
        );

        await loadInventory();

    } catch (error) {
        console.error("Permanent deletion failed:", error);

        showInventoryMessage(
            "Product could not be deleted: " + error.message,
            true
        );
    }
}

// ==========================================
// UPDATE EXISTING PRODUCT
// NO ADD PRODUCT FUNCTION
// ==========================================

if (inventoryElements.form) {
    inventoryElements.form.addEventListener("submit", async event => {
        event.preventDefault();

        const originalName =
            inventoryElements.originalName?.value.trim();

        if (!originalName) {
            showInventoryMessage(
                "Select an existing product before updating.",
                true
            );
            return;
        }

        const productName = inventoryElements.name.value.trim();
        const unitPrice = Number(inventoryElements.price.value);
        const stockQuantity = Number(inventoryElements.stock.value);
        const lowStockThreshold = Number(inventoryElements.threshold.value);

        if (!productName) {
            showInventoryMessage("Product name is required.", true);
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
            original_product_name: originalName,
            product_name: productName,
            unit_price: unitPrice,
            stock_quantity: stockQuantity,
            low_stock_threshold: lowStockThreshold,
            active: getActiveValue()
        };

        if (inventoryElements.saveButton) {
            inventoryElements.saveButton.disabled = true;
        }

        showInventoryMessage("Updating product...");

        try {
            await callInventoryFunction("PATCH", payload);

            resetProductForm();
            inventoryElements.form.hidden = true;

            await loadInventory();

            showInventoryMessage("Product updated successfully.");

        } catch (error) {
            console.error("Updating product failed:", error);

            showInventoryMessage(
                "Could not update product: " + error.message,
                true
            );
        } finally {
            if (inventoryElements.saveButton) {
                inventoryElements.saveButton.disabled = false;
            }
        }
    });
}

// ==========================================
// REFRESH INVENTORY
// ==========================================

if (inventoryElements.refreshButton) {
    inventoryElements.refreshButton.addEventListener(
        "click",
        loadInventory
    );
}

// ==========================================
// CANCEL PRODUCT EDITING
// ==========================================

if (inventoryElements.cancelButton) {
    inventoryElements.cancelButton.addEventListener("click", () => {
        resetProductForm();

        inventoryElements.form.hidden = true;

        showInventoryMessage("Product editing cancelled.");
    });
}

// ==========================================
// INITIALIZE ADMIN DASHBOARD
// ==========================================

async function initializeAdminDashboard() {
    showLoginPanel();

    try {
        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error) throw error;
        if (!session) return;

        await checkAdminAccess();

        showDashboard();

        await loadAdminOrders();
        await loadInventory();

    } catch (error) {
        console.error("Dashboard initialization failed:", error);

        showLoginPanel();

        showLoginMessage(
            error.message || "Please sign in to continue."
        );
    }
}

// START DASHBOARD
initializeAdminDashboard();

console.log("SWEET's KITCHEN admin dashboard initialized.");
