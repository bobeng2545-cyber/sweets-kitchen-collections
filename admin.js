// ==========================================
// SWEET's KITCHEN & COLLECTIONS
// COMPLETE ADMIN DASHBOARD
// ORDERS + INVENTORY + FLASH SALES
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
// FLASH SALES ELEMENTS
// ==========================================

const flashSaleElements = {
    panel: document.getElementById("flashSalesPanel"),
    form: document.getElementById("flashSaleForm"),
    id: document.getElementById("flashSaleId"),
    product: document.getElementById("flashSaleProduct"),
    discount: document.getElementById("flashSaleDiscount"),
    start: document.getElementById("flashSaleStart"),
    end: document.getElementById("flashSaleEnd"),
    active: document.getElementById("flashSaleActive"),
    saveButton: document.getElementById("saveFlashSaleButton"),
    cancelButton: document.getElementById("cancelFlashSaleButton"),
    addButton: document.getElementById("addFlashSaleButton"),
    refreshButton: document.getElementById("refreshFlashSalesButton"),
    tableBody: document.getElementById("flashSalesTableBody"),
    message: document.getElementById("flashSalesMessage"),
    formTitle: document.getElementById("flashSaleFormTitle")
};

let flashSales = [];
let flashSalesLoading = false;

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

function showFlashSalesMessage(message, isError = false) {
    if (!flashSaleElements.message) return;

    flashSaleElements.message.textContent = message;
    flashSaleElements.message.style.color =
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
            await loadFlashSales();

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
            flashSales = [];

            if (ordersTableBody) ordersTableBody.replaceChildren();

            if (inventoryElements.tableBody) {
                inventoryElements.tableBody.replaceChildren();
            }

            if (flashSaleElements.tableBody) {
                flashSaleElements.tableBody.replaceChildren();
            }

            resetFlashSaleForm();

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

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editProduct(product));

        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.textContent =
            product.active === true ? "Deactivate" : "Activate";

        toggleButton.addEventListener("click", () =>
            changeProductAvailability(product)
        );

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

    // Update the Flash Sale product selector after inventory loads.
    populateFlashSaleProducts();
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
// FLASH SALES: FORMAT DATE
// ==========================================

function formatFlashSaleDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString("en-GH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Convert datetime-local value to ISO timestamp.
function localDateTimeToISO(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error("Please enter a valid sale date and time.");
    }

    return date.toISOString();
}

// Convert an ISO timestamp into a datetime-local input value.
function isoToLocalDateTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
}

// ==========================================
// FLASH SALES: API REQUEST
// ==========================================

async function callFlashSalesFunction(method = "GET", body) {
    const options = { method };

    if (body !== undefined) {
        options.body = body;
    }

    const { data, error } =
        await supabaseClient.functions.invoke("admin-flash-sales", options);

    if (error) {
        let detail = error.message || "Flash sale request failed.";

        if (error.context && typeof error.context.json === "function") {
            try {
                const responseBody = await error.context.json();

                if (responseBody.error) {
                    detail = responseBody.error;
                }
            } catch (_) {}
        }

        throw new Error(detail);
    }

    if (data?.error) {
        throw new Error(data.error);
    }

    return data;
}

// ==========================================
// FLASH SALES: POPULATE PRODUCT SELECT
// ==========================================

function populateFlashSaleProducts(selectedProduct = "") {
    const select = flashSaleElements.product;

    if (!select) {
        console.error("Flash Sale product dropdown was not found.");
        return;
    }

    // Keep the default option
    select.innerHTML = '<option value="">Choose a product</option>';

    // Add every product loaded from Inventory Management
    inventoryProducts.forEach(product => {
        if (!product.product_name) return;

        const option = document.createElement("option");

        option.value = product.product_name;
        option.textContent = product.product_name;

        if (product.product_name === selectedProduct) {
            option.selected = true;
        }

        select.appendChild(option);
    });

    console.log(
        "Products available for Flash Sales:",
        inventoryProducts.map(product => product.product_name)
    );
}
// ==========================================
// FLASH SALES: DETERMINE STATUS
// ==========================================

function getFlashSaleStatus(sale) {
    if (sale.is_active !== true) {
        return "Inactive";
    }

    const now = Date.now();
    const start = new Date(sale.starts_at).getTime();
    const end = new Date(sale.ends_at).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return "Invalid dates";
    }

    if (now < start) {
        return "Scheduled";
    }

    if (now >= end) {
        return "Expired";
    }

    return "Live";
}

// ==========================================
// FLASH SALES: DISPLAY TABLE
// ==========================================

function renderFlashSales() {
    const tableBody = flashSaleElements.tableBody;

    if (!tableBody) return;

    tableBody.replaceChildren();

    if (!flashSales.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent = "No flash sales found.";

        row.appendChild(cell);
        tableBody.appendChild(row);

        return;
    }

    flashSales.forEach(sale => {
        const row = document.createElement("tr");

        row.appendChild(createCell(sale.product_name || "Unknown product"));

        row.appendChild(
            createCell(`${Number(sale.discount_percentage).toFixed(2)}%`)
        );

        row.appendChild(createCell(formatFlashSaleDate(sale.starts_at)));
        row.appendChild(createCell(formatFlashSaleDate(sale.ends_at)));

        const status = getFlashSaleStatus(sale);
        const statusCell = createCell(status);

        statusCell.classList.add("flash-sale-status");

        if (status === "Live") {
            statusCell.style.color = "#15803d";
        } else if (status === "Expired" || status === "Inactive") {
            statusCell.style.color = "#b91c1c";
        } else {
            statusCell.style.color = "#b45309";
        }

        row.appendChild(statusCell);

        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "secondary-btn";

        editButton.addEventListener("click", () => {
            editFlashSale(sale);
        });

        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.textContent =
            sale.is_active === true ? "Deactivate" : "Activate";

        toggleButton.className = "secondary-btn";

        toggleButton.addEventListener("click", () => {
            toggleFlashSale(sale);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "danger-btn";

        deleteButton.addEventListener("click", () => {
            deleteFlashSale(sale);
        });

        actionsCell.append(
            editButton,
            toggleButton,
            deleteButton
        );

        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}

// ==========================================
// FLASH SALES: LOAD SALES
// ==========================================

async function loadFlashSales() {
    if (flashSalesLoading) return;

    if (!flashSaleElements.tableBody) return;

    flashSalesLoading = true;

    if (flashSaleElements.refreshButton) {
        flashSaleElements.refreshButton.disabled = true;
    }

    showFlashSalesMessage("Loading flash sales...");

    try {
        const data = await callFlashSalesFunction("GET");

        flashSales = Array.isArray(data)
            ? data
            : Array.isArray(data?.sales)
                ? data.sales
                : [];

        renderFlashSales();

        showFlashSalesMessage(
            `Loaded ${flashSales.length} flash sale(s).`
        );

    } catch (error) {
        console.error("Loading flash sales failed:", error);

        showFlashSalesMessage(
            "Could not load flash sales: " + error.message,
            true
        );
    } finally {
        flashSalesLoading = false;

        if (flashSaleElements.refreshButton) {
            flashSaleElements.refreshButton.disabled = false;
        }
    }
}

// ==========================================
// FLASH SALES: RESET FORM
// ==========================================

function resetFlashSaleForm() {
    if (!flashSaleElements.form) return;

    flashSaleElements.form.reset();

    if (flashSaleElements.id) {
        flashSaleElements.id.value = "";
    }

    if (flashSaleElements.active) {
        flashSaleElements.active.checked = true;
    }

    if (flashSaleElements.formTitle) {
        flashSaleElements.formTitle.textContent = "Create Flash Sale";
    }

    if (flashSaleElements.saveButton) {
        flashSaleElements.saveButton.textContent = "Save Flash Sale";
        flashSaleElements.saveButton.disabled = false;
    }

    if (flashSaleElements.cancelButton) {
        flashSaleElements.cancelButton.hidden = true;
    }

    populateFlashSaleProducts();
}

// ==========================================
// FLASH SALES: EDIT SALE
// ==========================================

function editFlashSale(sale) {
    if (!flashSaleElements.form) return;

    if (!sale.id) {
        showFlashSalesMessage(
            "This flash sale does not have a valid ID.",
            true
        );
        return;
    }

    flashSaleElements.id.value = sale.id;

    populateFlashSaleProducts(sale.product_name);

    flashSaleElements.discount.value = sale.discount_percentage;

    flashSaleElements.start.value =
        isoToLocalDateTime(sale.starts_at);

    flashSaleElements.end.value =
        isoToLocalDateTime(sale.ends_at);

    flashSaleElements.active.checked = sale.is_active === true;

    if (flashSaleElements.formTitle) {
        flashSaleElements.formTitle.textContent = "Edit Flash Sale";
    }

    if (flashSaleElements.saveButton) {
        flashSaleElements.saveButton.textContent = "Update Flash Sale";
    }

    if (flashSaleElements.cancelButton) {
        flashSaleElements.cancelButton.hidden = false;
    }

    showFlashSalesMessage(
        `You are editing the flash sale for ${sale.product_name}.`
    );

    flashSaleElements.form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ==========================================
// FLASH SALES: SAVE NEW OR UPDATED SALE
// ==========================================

if (flashSaleElements.form) {
    flashSaleElements.form.addEventListener("submit", async event => {
        event.preventDefault();

        const id = flashSaleElements.id?.value.trim();
        const productName = flashSaleElements.product?.value.trim();
        const discount = Number(flashSaleElements.discount?.value);

        const startValue = flashSaleElements.start?.value;
        const endValue = flashSaleElements.end?.value;

        const isActive = flashSaleElements.active?.checked === true;

        if (!productName) {
            showFlashSalesMessage(
                "Please select a product.",
                true
            );
            return;
        }

        if (
            !Number.isFinite(discount) ||
            discount <= 0 ||
            discount > 100
        ) {
            showFlashSalesMessage(
                "Discount must be greater than 0 and not more than 100%.",
                true
            );
            return;
        }

        if (!startValue || !endValue) {
            showFlashSalesMessage(
                "Please enter both the start and end dates.",
                true
            );
            return;
        }

        let startsAt;
        let endsAt;

        try {
            startsAt = localDateTimeToISO(startValue);
            endsAt = localDateTimeToISO(endValue);
        } catch (error) {
            showFlashSalesMessage(error.message, true);
            return;
        }

        if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
            showFlashSalesMessage(
                "The sale end date must be later than the start date.",
                true
            );
            return;
        }

        const existingSaleForProduct = flashSales.find(sale =>
            sale.product_name === productName &&
            String(sale.id) !== String(id || "")
        );

        if (existingSaleForProduct) {
            showFlashSalesMessage(
                "This product already has a flash sale. Edit its existing sale instead.",
                true
            );
            return;
        }

        const payload = {
            product_name: productName,
            discount_percentage: discount,
            starts_at: startsAt,
            ends_at: endsAt,
            is_active: isActive
        };

        if (id) {
            payload.id = id;
        }

        if (flashSaleElements.saveButton) {
            flashSaleElements.saveButton.disabled = true;
        }

        showFlashSalesMessage(
            id ? "Updating flash sale..." : "Creating flash sale..."
        );

        try {
            const data = await callFlashSalesFunction(
                id ? "PATCH" : "POST",
                payload
            );

            if (data?.error) {
                throw new Error(data.error);
            }

            resetFlashSaleForm();

            await loadFlashSales();

            showFlashSalesMessage(
                id
                    ? "Flash sale updated successfully."
                    : "Flash sale created successfully."
            );

        } catch (error) {
            console.error("Saving flash sale failed:", error);

            showFlashSalesMessage(
                "Could not save flash sale: " + error.message,
                true
            );
        } finally {
            if (flashSaleElements.saveButton) {
                flashSaleElements.saveButton.disabled = false;
            }
        }
    });
}

// ==========================================
// FLASH SALES: ACTIVATE OR DEACTIVATE
// ==========================================

async function toggleFlashSale(sale) {
    if (!sale.id) {
        showFlashSalesMessage(
            "Flash sale ID is missing.",
            true
        );
        return;
    }

    const newStatus = sale.is_active !== true;

    const action = newStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
        `Are you sure you want to ${action} the flash sale for ${sale.product_name}?`
    );

    if (!confirmed) return;

    try {
        showFlashSalesMessage(`${action}ing flash sale...`);

        await callFlashSalesFunction("PATCH", {
            id: sale.id,
            is_active: newStatus
        });

        await loadFlashSales();

        showFlashSalesMessage(
            `Flash sale ${action}d successfully.`
        );

    } catch (error) {
        console.error("Changing flash sale status failed:", error);

        showFlashSalesMessage(
            "Could not change flash sale status: " + error.message,
            true
        );
    }
}

// ==========================================
// FLASH SALES: DELETE
// ==========================================

async function deleteFlashSale(sale) {
    if (!sale.id) {
        showFlashSalesMessage(
            "Flash sale ID is missing.",
            true
        );
        return;
    }

    const confirmed = window.confirm(
        `Permanently delete the flash sale for "${sale.product_name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
        showFlashSalesMessage("Deleting flash sale...");

        await callFlashSalesFunction("DELETE", {
            id: sale.id
        });

        if (
            String(flashSaleElements.id?.value || "") ===
            String(sale.id)
        ) {
            resetFlashSaleForm();
        }

        await loadFlashSales();

        showFlashSalesMessage("Flash sale deleted successfully.");

    } catch (error) {
        console.error("Deleting flash sale failed:", error);

        showFlashSalesMessage(
            "Could not delete flash sale: " + error.message,
            true
        );
    }
}

// ==========================================
// FLASH SALES: BUTTON EVENTS
// ==========================================

if (flashSaleElements.refreshButton) {
    flashSaleElements.refreshButton.addEventListener(
        "click",
        loadFlashSales
    );
}

if (flashSaleElements.addButton) {
    flashSaleElements.addButton.addEventListener("click", () => {
        resetFlashSaleForm();

        showFlashSalesMessage("Ready to create a new flash sale.");

        flashSaleElements.form?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}

if (flashSaleElements.cancelButton) {
    flashSaleElements.cancelButton.addEventListener("click", () => {
        resetFlashSaleForm();

        showFlashSalesMessage("Flash sale editing cancelled.");
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
        await loadFlashSales();

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

console.log(
    "SWEET's KITCHEN admin dashboard initialized with Flash Sales."
);
