
(() => {

/* =========================================================
   SWEET's KITCHEN & COLLECTIONS
   COMPLETE ADMIN DASHBOARD
   Supabase + Products + Orders + Flash Sales
========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL =
    "https://vbrlprrbtumonmroybdv.supabase.co";

const SUPABASE_PUBLIC_KEY =
    "sb_publishable_jOGj9C6m_fFryLL8yrcQmw_5wyZoidy";

if (!window.supabase) {
    throw new Error(
        "Supabase library failed to load. Check your internet connection."
    );
}

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY
);


/* =========================================================
   2. GLOBAL VARIABLES
========================================================= */

let currentAdmin = null;

let allProducts = [];
let allOrders = [];
let allFlashSales = [];

let editingProductId = null;
let dashboardLoading = false;

const CURRENCY = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2
});


/* =========================================================
   3. DOM ELEMENTS
========================================================= */

const loginPanel = document.getElementById("loginPanel");
const dashboard = document.getElementById("dashboard");

const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const adminName = document.getElementById("adminName");
const adminEmailDisplay = document.getElementById("adminEmailDisplay");
const logoutButton = document.getElementById("logoutButton");

const pageTitle = document.getElementById("pageTitle");
const refreshDashboardButton =
    document.getElementById("refreshDashboardButton");

const globalMessage = document.getElementById("globalMessage");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const sidebar = document.getElementById("sidebar");
const sidebarOverlay =
    document.getElementById("sidebarOverlay");


/* Dashboard statistics */

const todayDate = document.getElementById("todayDate");
const totalSales = document.getElementById("totalSales");
const totalOrders = document.getElementById("totalOrders");
const pendingOrders = document.getElementById("pendingOrders");
const totalProducts = document.getElementById("totalProducts");
const navPendingCount =
    document.getElementById("navPendingCount");

const recentOrdersBody =
    document.getElementById("recentOrdersBody");


/* Orders */

const ordersTableBody =
    document.getElementById("ordersTableBody");

const ordersMessage =
    document.getElementById("ordersMessage");

const searchOrders =
    document.getElementById("searchOrders");

const orderStatusFilter =
    document.getElementById("orderStatusFilter");

const refreshOrdersButton =
    document.getElementById("refreshOrdersButton");


/* Products */

const productsTableBody =
    document.getElementById("productsTableBody");

const productsMessage =
    document.getElementById("productsMessage");

const searchProducts =
    document.getElementById("searchProducts");

const productCategoryFilter =
    document.getElementById("productCategoryFilter");

const addProductButton =
    document.getElementById("addProductButton");


/* Product modal */

const productModal =
    document.getElementById("productModal");

const productForm =
    document.getElementById("productForm");

const productModalTitle =
    document.getElementById("productModalTitle");

const productId =
    document.getElementById("productId");

const productName =
    document.getElementById("productName");

const productDescription =
    document.getElementById("productDescription");

const productCategory =
    document.getElementById("productCategory");

const productPrice =
    document.getElementById("productPrice");

const productStock =
    document.getElementById("productStock");

const productImage =
    document.getElementById("productImage");

const productImageFile =
    document.getElementById("productImageFile");

const productImagePreview =
    document.getElementById("productImagePreview");

productImageFile.addEventListener("change", () => {
    const file = productImageFile.files[0];

    if (!file) {
        productImagePreview.removeAttribute("src");
        productImagePreview.hidden = true;
        return;
    }

    if (!file.type.startsWith("image/")) {
        showMessage(
            productFormMessage,
            "Please select a valid image file.",
            "error"
        );

        productImageFile.value = "";
        productImagePreview.hidden = true;
        return;
    }

    const previewURL = URL.createObjectURL(file);

    productImagePreview.src = previewURL;
    productImagePreview.hidden = false;

    hideMessage(productFormMessage);
});

const productActive =
    document.getElementById("productActive");

const productFormMessage =
    document.getElementById("productFormMessage");

const saveProductButton =
    document.getElementById("saveProductButton");


/* Flash sales */

const addFlashSaleButton =
    document.getElementById("addFlashSaleButton");

const flashSaleModal =
    document.getElementById("flashSaleModal");

const flashSaleForm =
    document.getElementById("flashSaleForm");

const saleProduct =
    document.getElementById("saleProduct");

const saleDiscount =
    document.getElementById("saleDiscount");

const saleStart =
    document.getElementById("saleStart");

const saleEnd =
    document.getElementById("saleEnd");

const saveFlashSaleButton =
    document.getElementById("saveFlashSaleButton");

const salesMessage =
    document.getElementById("salesMessage");

const flashSalesTableBody =
    document.getElementById("flashSalesTableBody");


/* =========================================================
   4. GENERAL HELPERS
========================================================= */

function formatMoney(amount) {
    return CURRENCY.format(Number(amount) || 0);
}


function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-GH", {
        timeZone: "Africa/Accra",
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}


function todayInGhana() {
    return new Intl.DateTimeFormat("en-GH", {
        timeZone: "Africa/Accra",
        dateStyle: "full"
    }).format(new Date());
}


function showMessage(element, message, type = "info") {
    if (!element) return;

    element.textContent = message;
    element.className = `message show ${type}`;
}


function hideMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.className = "message";
}


function showTableMessage(element, message) {
    if (!element) return;

    element.textContent = message;
    element.classList.add("show");
}


function hideTableMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.classList.remove("show");
}


function showGlobalMessage(message) {
    if (!globalMessage) return;

    globalMessage.textContent = message;
    globalMessage.classList.add("show");
}


function clearGlobalMessage() {
    if (!globalMessage) return;

    globalMessage.textContent = "";
    globalMessage.classList.remove("show");
}


function setButtonLoading(button, loading, loadingText = "Please wait...") {
    if (!button) return;

    if (loading) {
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
        button.disabled = true;
    } else {
        button.textContent =
            button.dataset.originalText || button.textContent;

        button.disabled = false;
    }
}


function createCell(text, className = "") {
    const td = document.createElement("td");

    td.textContent = text ?? "";

    if (className) {
        td.className = className;
    }

    return td;
}


function createStatusBadge(status) {
    const badge = document.createElement("span");

    const safeStatus = String(status || "unknown").toLowerCase();

    badge.className = `status-badge ${safeStatus}`;
    badge.textContent = safeStatus.replaceAll("_", " ");

    return badge;
}


function showEmptyRow(tbody, message, columns) {
    tbody.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = columns;
    cell.className = "empty-cell";
    cell.textContent = message;

    row.appendChild(cell);
    tbody.appendChild(row);
}


function createActionButton(text, action, id, className = "secondary-button") {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = text;
    button.className = `small-button ${className}`;

    button.dataset.action = action;
    button.dataset.id = id;

    return button;
}


function escapeForAttribute(value) {
    return String(value ?? "").replace(/["&<>]/g, character => {
        const replacements = {
            '"': "&quot;",
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;"
        };

        return replacements[character];
    });
}


/* =========================================================
   5. MODAL FUNCTIONS
========================================================= */

function openModal(modal) {
    if (!modal) return;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
}


function closeModal(modal) {
    if (!modal) return;

    modal.hidden = true;
    document.body.style.overflow = "";
}


document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => {
        const modalId = button.dataset.closeModal;
        const modal = document.getElementById(modalId);

        closeModal(modal);
    });
});


document.querySelectorAll(".modal-backdrop").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});


document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        document.querySelectorAll(".modal-backdrop").forEach(modal => {
            closeModal(modal);
        });
    }
});


/* =========================================================
   6. LOGIN AND ADMIN VERIFICATION
========================================================= */

function showLogin() {
    dashboard.hidden = true;
    loginPanel.hidden = false;

    currentAdmin = null;
}

function showDashboard(user) {
    currentAdmin = user;

    loginPanel.hidden = true;
    dashboard.hidden = false;

    adminName.textContent =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "Administrator";

    adminEmailDisplay.textContent = user.email || "";

    const firstLetter = adminName.textContent
        .trim()
        .charAt(0)
        .toUpperCase();

    document.querySelector(".admin-avatar").textContent =
        firstLetter || "A";

    todayDate.textContent = todayInGhana();

    navigateToSection("overview");

    loadDashboardData();
}

async function verifyAdministrator(user) {
    const { data, error } = await supabase
        .from("store_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        throw new Error(
            "Administrator verification failed: " + error.message
        );
    }

    if (!data) {
        throw new Error(
            "This account is not registered as a store administrator."
        );
    }

    return true;
}


/* SIGN IN */

adminLoginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    hideMessage(loginMessage);

    const email = adminEmail.value.trim();
    const password = adminPassword.value;

    if (!email || !password) {
        showMessage(
            loginMessage,
            "Please enter your email and password.",
            "error"
        );
        return;
    }

    setButtonLoading(loginButton, true, "Signing in...");

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("Unable to retrieve your account.");
        }

        await verifyAdministrator(data.user);

        showMessage(
            loginMessage,
            "Login successful!",
            "success"
        );

        showDashboard(data.user);

    } catch (error) {
        console.error("ADMIN LOGIN ERROR:", error);

        await supabase.auth.signOut();

        showMessage(
            loginMessage,
            error.message || "Login failed. Please try again.",
            "error"
        );

    } finally {
        setButtonLoading(loginButton, false);
    }
});


/* RESTORE EXISTING SESSION */

async function restoreAdminSession() {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        const user = data.session?.user;

        if (!user) {
            showLogin();
            return;
        }

        await verifyAdministrator(user);

        showDashboard(user);

    } catch (error) {
        console.error("SESSION RESTORATION ERROR:", error);

        await supabase.auth.signOut();

        showLogin();
    }
}


/* LOGOUT */

logoutButton.addEventListener("click", async function() {
    const confirmed = window.confirm(
        "Are you sure you want to sign out?"
    );

    if (!confirmed) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
        showGlobalMessage(error.message);
        return;
    }

    closeSidebar();

    showLogin();

    adminPassword.value = "";
});


/* =========================================================
   7. NAVIGATION
========================================================= */

const sectionTitles = {
    overview: "Dashboard Overview",
    orders: "Order Management",
    products: "Product Management",
    "flash-sales": "Flash Sales",
    customers: "Customer Management"
};


function navigateToSection(sectionName) {
    const target = document.getElementById(
        `section-${sectionName}`
    );

    if (!target) return;

    document.querySelectorAll(".dashboard-section").forEach(section => {
        section.classList.remove("active-section");
    });

    target.classList.add("active-section");

    document.querySelectorAll("[data-section]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === sectionName
        );
    });

    pageTitle.textContent =
        sectionTitles[sectionName] || "Dashboard";

    closeSidebar();
}


document.querySelectorAll("[data-section]").forEach(button => {
    button.addEventListener("click", () => {
        navigateToSection(button.dataset.section);
    });
});


/* Mobile sidebar */

function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("show");
}


function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
}


mobileMenuButton.addEventListener("click", () => {
    if (sidebar.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});


sidebarOverlay.addEventListener("click", closeSidebar);


/* =========================================================
   8. DASHBOARD DATA
========================================================= */

async function loadDashboardData() {
    if (dashboardLoading) return;

    dashboardLoading = true;

    clearGlobalMessage();

    try {
        await Promise.all([
            loadProducts(),
            loadOrders(),
            loadFlashSales()
        ]);

        updateDashboardStatistics();

    } catch (error) {
        console.error("Dashboard loading error:", error);

        showGlobalMessage(
            "Some dashboard information could not be loaded: " +
            error.message
        );

    } finally {
        dashboardLoading = false;
    }
}


function updateDashboardStatistics() {
    const paidOrders = allOrders.filter(order =>
        String(order.payment_status).toLowerCase() === "paid"
    );

    const sales = paidOrders.reduce((sum, order) => {
        return sum + Number(order.total_amount || 0);
    }, 0);

    const pendingCount = allOrders.filter(order =>
        String(order.order_status).toLowerCase() === "pending"
    ).length;

    const activeProducts = allProducts.filter(product =>
        product.is_active === true
    ).length;

    totalSales.textContent = formatMoney(sales);

    totalOrders.textContent = allOrders.length;

    pendingOrders.textContent = pendingCount;

    totalProducts.textContent = activeProducts;

    navPendingCount.textContent = pendingCount;

    renderRecentOrders();
}



/* =========================================================
   9. PRODUCTS
========================================================= */

async function loadProducts() {
    hideTableMessage(productsMessage);

    const { data, error } = await supabase
        .from("store_products")
        .select(`
            id,
            name,
            description,
            price,
            category,
            image_url,
            stock,
            is_active,
            created_at,
            updated_at
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("PRODUCT LOADING ERROR:", error);
        throw error;
    }

    allProducts = data || [];

    renderProducts();

    updateCategoryFilter();

    updateFlashSaleProductOptions();
}



function renderProducts() {
    const search = searchProducts.value
        .trim()
        .toLowerCase();

    const category = productCategoryFilter.value;

    const filteredProducts = allProducts.filter(product => {
        const matchesSearch =
            String(product.name || "").toLowerCase().includes(search);

        const matchesCategory =
            !category || product.category === category;

        return matchesSearch && matchesCategory;
    });

    productsTableBody.replaceChildren();

    if (!filteredProducts.length) {
        showEmptyRow(
            productsTableBody,
            "No products found.",
            6
        );

        return;
    }

    filteredProducts.forEach(product => {
        const row = document.createElement("tr");

        const productCell = document.createElement("td");

        const productContainer = document.createElement("div");
        productContainer.className = "table-product";

        const image = document.createElement("img");

image.className = "admin-product-image";
image.alt = product.name || "Product";
image.loading = "lazy";

if (product.image_url) {
    image.src = product.image_url;

    image.onerror = () => {
        image.src = "images/no-image.png";
        image.onerror = null;
    };
} else {
    image.src = "images/no-image.png";
}

        const productDetails = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = product.name;

        const description = document.createElement("small");
        description.textContent =
            product.description || "No description";

        productDetails.append(name, description);

        productContainer.append(image, productDetails);

        productCell.appendChild(productContainer);

        row.appendChild(productCell);

        row.appendChild(createCell(product.category));

        row.appendChild(
            createCell(formatMoney(product.price))
        );

        row.appendChild(
            createCell(String(product.stock ?? 0))
        );

        const visibilityCell = document.createElement("td");

        visibilityCell.appendChild(
            createStatusBadge(
                product.is_active ? "active" : "inactive"
            )
        );

        row.appendChild(visibilityCell);

        const actionCell = document.createElement("td");

        const actionGroup = document.createElement("div");
        actionGroup.className = "button-group";

        actionGroup.append(
            createActionButton(
                "Edit",
                "edit-product",
                product.id
            ),
            createActionButton(
                product.is_active ? "Hide" : "Show",
                "toggle-product",
                product.id
            ),
            createActionButton(
                "Delete",
                "delete-product",
                product.id,
                "danger-button"
            )
        );

        actionCell.appendChild(actionGroup);

        row.appendChild(actionCell);

        productsTableBody.appendChild(row);
    });
}


/* Category filter */

function updateCategoryFilter() {
    const selectedCategory = productCategoryFilter.value;

    const categories = [
        ...new Set(
            allProducts
                .map(product => product.category)
                .filter(Boolean)
        )
    ].sort();

    productCategoryFilter.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All categories";

    productCategoryFilter.appendChild(allOption);

    categories.forEach(category => {
        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        productCategoryFilter.appendChild(option);
    });

    if (categories.includes(selectedCategory)) {
        productCategoryFilter.value = selectedCategory;
    }
}


searchProducts.addEventListener("input", renderProducts);

productCategoryFilter.addEventListener("change", renderProducts);


/* Open new product modal */

function openNewProductModal() {
    editingProductId = null;

    productForm.reset();

   productImagePreview.removeAttribute("src");
   productImagePreview.hidden = true;

    productId.value = "";
    productStock.value = "0";
    productActive.checked = true;

    productModalTitle.textContent = "Add New Product";
    saveProductButton.textContent = "Save Product";

    hideMessage(productFormMessage);

    openModal(productModal);
}


addProductButton.addEventListener("click", openNewProductModal);


/* Edit product */

function openEditProductModal(id) {
    const product = allProducts.find(item => item.id === id);

    if (!product) return;

    editingProductId = product.id;

    productId.value = product.id;

    productName.value = product.name || "";
    productDescription.value = product.description || "";
    productCategory.value = product.category || "";
    productPrice.value = product.price ?? 0;
    productStock.value = product.stock ?? 0;
    productImage.value = product.image_url || "";
   productImageFile.value = "";
   productImagePreview.hidden = true;

if (product.image_url) {
    productImagePreview.src = product.image_url;
    productImagePreview.hidden = false;
}
    productActive.checked = product.is_active === true;

    productModalTitle.textContent = "Edit Product";
    saveProductButton.textContent = "Update Product";

    hideMessage(productFormMessage);

    openModal(productModal);
}

   async function uploadProductImage(file) {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error(
            "Use a JPG, PNG, WEBP or GIF image."
        );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
        throw new Error(
            "Image size must not exceed 5 MB."
        );
    }

    const fileExtension = file.name
        .split(".")
        .pop()
        .toLowerCase();

    const filePath =
        `${crypto.randomUUID()}.${fileExtension}`;

    const { error } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
        });

    if (error) throw error;

    const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

    if (!data?.publicUrl) {
        throw new Error(
            "Image uploaded, but its public URL could not be generated."
        );
    }

    return data.publicUrl;
}



/* Save product */

productForm.addEventListener("submit", async event => {
    event.preventDefault();

    hideMessage(productFormMessage);

    const name = productName.value.trim();
    const description = productDescription.value.trim();
    const category = productCategory.value.trim();

    const price = Number(productPrice.value);
    const stock = Number(productStock.value);

    let imageUrl = productImage.value.trim();

    // Validate product name and category
    if (!name || !category) {
        showMessage(
            productFormMessage,
            "Product name and category are required.",
            "error"
        );
        return;
    }

    // Validate price
    if (!Number.isFinite(price) || price < 0) {
        showMessage(
            productFormMessage,
            "Enter a valid product price.",
            "error"
        );
        return;
    }

    // Validate stock
    if (!Number.isInteger(stock) || stock < 0) {
        showMessage(
            productFormMessage,
            "Stock must be a whole number of zero or more.",
            "error"
        );
        return;
    }

    // Get selected image
    const selectedImage =
        productImageFile.files[0];

    // Start loading before uploading or saving
    setButtonLoading(
        saveProductButton,
        true,
        selectedImage ? "Uploading image..." : "Saving..."
    );

    try {

        // Upload image to Supabase Storage
        if (selectedImage) {
            imageUrl = await uploadProductImage(selectedImage);
        }

        // Prepare product information
        const productData = {
            name,
            description,
            category,
            price,
            stock,
            image_url: imageUrl,
            is_active: productActive.checked
        };

        let result;

        // Update existing product
        if (editingProductId) {

            result = await supabase
                .from("store_products")
                .update(productData)
                .eq("id", editingProductId)
                .select()
                .single();

        } else {

            // Add new product
            result = await supabase
                .from("store_products")
                .insert(productData)
                .select()
                .single();
        }

        if (result.error) {
            throw result.error;
        }

        showMessage(
            productFormMessage,
            editingProductId
                ? "Product updated successfully."
                : "Product added successfully.",
            "success"
        );

        editingProductId = null;

        closeModal(productModal);

        // Reload products and dashboard statistics
        await loadProducts();

        updateDashboardStatistics();

        showGlobalMessage(
            "Product saved successfully."
        );

    } catch (error) {

        console.error("Product save error:", error);

        showMessage(
            productFormMessage,
            error.message || "Unable to save product.",
            "error"
        );

    } finally {

        // Always restore the save button
        setButtonLoading(
            saveProductButton,
            false
        );
    }
});



/* Product table actions */

productsTableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit-product") {
        openEditProductModal(id);
        return;
    }

    if (action === "toggle-product") {
        await toggleProduct(id);
        return;
    }

    if (action === "delete-product") {
        await deleteProduct(id);
    }
});


async function toggleProduct(id) {
    const product = allProducts.find(item => item.id === id);

    if (!product) return;

    const newStatus = !product.is_active;

    const { error } = await supabase
        .from("store_products")
        .update({ is_active: newStatus })
        .eq("id", id);

    if (error) {
        showGlobalMessage(error.message);
        return;
    }

    await loadProducts();

    updateDashboardStatistics();

    showGlobalMessage(
        newStatus
            ? "Product is now visible in the store."
            : "Product has been hidden from the store."
    );
}


async function deleteProduct(id) {
    const product = allProducts.find(item => item.id === id);

    if (!product) return;

    const confirmed = window.confirm(
        `Delete "${product.name}" permanently?`
    );

    if (!confirmed) return;

    const { error } = await supabase
        .from("store_products")
        .delete()
        .eq("id", id);

    if (error) {
        showGlobalMessage(error.message);
        return;
    }

    await loadProducts();
    await loadFlashSales();

    updateDashboardStatistics();

    showGlobalMessage("Product deleted successfully.");
}


/* =========================================================
   10. ORDERS
========================================================= */


async function loadOrders() {
    hideTableMessage(ordersMessage);

    const { data, error } = await supabase
        .from("orders")
        .select(`
            id,
            order_reference,
            user_id,
            total_amount,
            payment_status,
            order_status,
            customer_name,
            customer_email,
            customer_phone,
            delivery_address,
            items,
            created_at
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;

    allOrders = data || [];

    renderOrders();
    updateDashboardStatistics();
}



function renderOrders() {
    const search = searchOrders.value
        .trim()
        .toLowerCase();

    const selectedStatus = orderStatusFilter.value;

    const filteredOrders = allOrders.filter(order => {
        const reference = String(
            order.order_reference || ""
        ).toLowerCase();

        const matchesSearch = reference.includes(search);

        const matchesStatus =
            !selectedStatus ||
            order.order_status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    ordersTableBody.replaceChildren();

    if (!filteredOrders.length) {
        showEmptyRow(
            ordersTableBody,
            "No orders found.",
            6
        );

        return;
    }

    filteredOrders.forEach(order => {
        const row = document.createElement("tr");

        row.appendChild(
            createCell(order.order_reference || order.id)
        );

        row.appendChild(
            createCell(formatDate(order.created_at))
        );

        row.appendChild(
            createCell(formatMoney(order.total_amount))
        );

        const paymentCell = document.createElement("td");

        paymentCell.appendChild(
            createStatusBadge(order.payment_status)
        );

        row.appendChild(paymentCell);

        const statusCell = document.createElement("td");

        const statusSelect = document.createElement("select");

        statusSelect.className = "filter-select";

        statusSelect.dataset.action = "update-order-status";
        statusSelect.dataset.id = order.id;

        const statuses = [
            "pending",
            "preparing",
            "ready",
            "delivered",
            "cancelled"
        ];

        statuses.forEach(status => {
            const option = document.createElement("option");

            option.value = status;
            option.textContent =
                status.charAt(0).toUpperCase() + status.slice(1);

            if (status === order.order_status) {
                option.selected = true;
            }

            statusSelect.appendChild(option);
        });

        statusCell.appendChild(statusSelect);
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");

        const detailsButton = createActionButton(
            "Details",
            "view-order",
            order.id
        );

        actionCell.appendChild(detailsButton);

        row.appendChild(actionCell);

        ordersTableBody.appendChild(row);
    });
}


/* Recent orders */

function renderRecentOrders() {
    recentOrdersBody.replaceChildren();

    const recent = allOrders.slice(0, 5);

    if (!recent.length) {
        showEmptyRow(
            recentOrdersBody,
            "No orders have been received yet.",
            4
        );

        return;
    }

    recent.forEach(order => {
        const row = document.createElement("tr");

        row.appendChild(
            createCell(order.order_reference || order.id)
        );

        row.appendChild(
            createCell(formatDate(order.created_at))
        );

        row.appendChild(
            createCell(formatMoney(order.total_amount))
        );

        const statusCell = document.createElement("td");

        statusCell.appendChild(
            createStatusBadge(order.order_status)
        );

        row.appendChild(statusCell);

        recentOrdersBody.appendChild(row);
    });
}


/* Search and filter */

searchOrders.addEventListener("input", renderOrders);

orderStatusFilter.addEventListener("change", renderOrders);


/* Order status update */

ordersTableBody.addEventListener("change", async event => {
    const select = event.target.closest(
        'select[data-action="update-order-status"]'
    );

    if (!select) return;

    const orderId = select.dataset.id;
    const newStatus = select.value;

    const confirmed = window.confirm(
        `Change this order's status to "${newStatus}"?`
    );

    if (!confirmed) {
        renderOrders();
        return;
    }

    select.disabled = true;

    try {
        const { error } = await supabase
            .from("orders")
            .update({
                order_status: newStatus
            })
            .eq("id", orderId);

        if (error) throw error;

        const order = allOrders.find(item => item.id === orderId);

        if (order) {
            order.order_status = newStatus;
        }

        renderOrders();

        updateDashboardStatistics();

        showGlobalMessage("Order status updated successfully.");

    } catch (error) {
        console.error("Order update error:", error);

        showGlobalMessage(
            "Unable to update order: " + error.message
        );

        renderOrders();
    }
});



/* =========================================================
   10. ORDERS
   ADMIN ORDER MANAGEMENT + PRODUCT DETAILS POPUP
========================================================= */


/* LOAD ORDERS */

async function loadOrders() {
    hideTableMessage(ordersMessage);

    const { data, error } = await supabase
        .from("orders")
        .select(`
            id,
            order_reference,
            user_id,
            total_amount,
            payment_status,
            order_status,
            customer_name,
            customer_email,
            customer_phone,
            delivery_address,
            items,
            created_at
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;

    allOrders = data || [];

    renderOrders();
    updateDashboardStatistics();
}


/* RENDER ORDERS TABLE */

function renderOrders() {
    const search = searchOrders.value.trim().toLowerCase();
    const selectedStatus = orderStatusFilter.value;

    const filteredOrders = allOrders.filter(order => {
        const reference = String(
            order.order_reference || ""
        ).toLowerCase();

        const customer = String(
            order.customer_name || ""
        ).toLowerCase();

        const matchesSearch =
            reference.includes(search) ||
            customer.includes(search);

        const matchesStatus =
            !selectedStatus ||
            order.order_status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    ordersTableBody.replaceChildren();

    if (!filteredOrders.length) {
        showEmptyRow(
            ordersTableBody,
            "No orders found.",
            6
        );
        return;
    }

    filteredOrders.forEach(order => {
        const row = document.createElement("tr");

        row.appendChild(
            createCell(order.order_reference || order.id)
        );

        row.appendChild(
            createCell(formatDate(order.created_at))
        );

        row.appendChild(
            createCell(formatMoney(order.total_amount))
        );

        const paymentCell = document.createElement("td");

        paymentCell.appendChild(
            createStatusBadge(order.payment_status)
        );

        row.appendChild(paymentCell);

        const statusCell = document.createElement("td");

        const statusSelect = document.createElement("select");

        statusSelect.className = "filter-select";
        statusSelect.dataset.action = "update-order-status";
        statusSelect.dataset.id = order.id;

        const statuses = [
            "pending",
            "preparing",
            "ready",
            "delivered",
            "cancelled"
        ];

        statuses.forEach(status => {
            const option = document.createElement("option");

            option.value = status;
            option.textContent =
                status.charAt(0).toUpperCase() + status.slice(1);

            option.selected = status === order.order_status;

            statusSelect.appendChild(option);
        });

        statusCell.appendChild(statusSelect);
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");

        actionCell.appendChild(
            createActionButton(
                "View Details",
                "view-order",
                order.id
            )
        );

        row.appendChild(actionCell);

        ordersTableBody.appendChild(row);
    });
}


/* RECENT ORDERS */

function renderRecentOrders() {
    recentOrdersBody.replaceChildren();

    const recent = allOrders.slice(0, 5);

    if (!recent.length) {
        showEmptyRow(
            recentOrdersBody,
            "No orders have been received yet.",
            4
        );
        return;
    }

    recent.forEach(order => {
        const row = document.createElement("tr");

        row.appendChild(
            createCell(order.order_reference || order.id)
        );

        row.appendChild(
            createCell(formatDate(order.created_at))
        );

        row.appendChild(
            createCell(formatMoney(order.total_amount))
        );

        const statusCell = document.createElement("td");

        statusCell.appendChild(
            createStatusBadge(order.order_status)
        );

        row.appendChild(statusCell);

        recentOrdersBody.appendChild(row);
    });
}


/* SEARCH AND FILTER */

searchOrders.addEventListener("input", renderOrders);

orderStatusFilter.addEventListener("change", renderOrders);


/* UPDATE ORDER STATUS */

ordersTableBody.addEventListener("change", async event => {
    const select = event.target.closest(
        'select[data-action="update-order-status"]'
    );

    if (!select) return;

    const orderId = select.dataset.id;
    const newStatus = select.value;

    const confirmed = window.confirm(
        `Change this order's status to "${newStatus}"?`
    );

    if (!confirmed) {
        renderOrders();
        return;
    }

    select.disabled = true;

    try {
        const { error } = await supabase
            .from("orders")
            .update({
                order_status: newStatus
            })
            .eq("id", orderId);

        if (error) throw error;

        const order = allOrders.find(
            item => item.id === orderId
        );

        if (order) {
            order.order_status = newStatus;
        }

        renderOrders();
        updateDashboardStatistics();

        showGlobalMessage(
            "Order status updated successfully."
        );

    } catch (error) {
        console.error("Order update error:", error);

        showGlobalMessage(
            "Unable to update order: " + error.message
        );

        renderOrders();
    }
});


/* =========================================================
   ADMIN ORDER DETAILS POPUP
========================================================= */


/* ADD POPUP STYLES */

function addAdminOrderStyles() {
    if (document.getElementById("adminOrderModalStyles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "adminOrderModalStyles";

    style.textContent = `
        .admin-order-overlay {
            position: fixed;
            inset: 0;
            z-index: 20000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 18px;
            background: rgba(0,0,0,.65);
            backdrop-filter: blur(5px);
        }

        .admin-order-overlay[hidden] {
            display: none !important;
        }

        .admin-order-modal {
            width: 100%;
            max-width: 850px;
            max-height: 90vh;
            overflow-y: auto;
            background: #fff;
            color: #222;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,.3);
        }

        .admin-order-header {
            position: sticky;
            top: 0;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 20px;
            background: #fff;
            border-bottom: 1px solid #eee;
        }

        .admin-order-header h2 {
            margin: 0 0 5px;
            font-size: 21px;
        }

        .admin-order-header p {
            margin: 0;
            color: #777;
            font-size: 13px;
            overflow-wrap: anywhere;
        }

        .admin-order-close {
            flex-shrink: 0;
            width: 38px;
            height: 38px;
            border: none;
            border-radius: 50%;
            background: #f1f1f1;
            color: #333;
            font-size: 27px;
            cursor: pointer;
        }

        .admin-order-content {
            padding: 20px;
        }

        .admin-order-section {
            margin-bottom: 24px;
        }

        .admin-order-section h3 {
            margin: 0 0 14px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
            font-size: 16px;
        }

        .admin-order-product {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 0;
            border-bottom: 1px solid #eee;
        }

        .admin-order-product img {
            width: 76px;
            height: 76px;
            flex-shrink: 0;
            object-fit: cover;
            border-radius: 10px;
            background: #f5f5f5;
        }

        .admin-order-product-info {
            flex: 1;
            min-width: 0;
        }

        .admin-order-product-info strong {
            display: block;
            margin-bottom: 5px;
        }

        .admin-order-product-info small {
            display: block;
            margin-top: 4px;
            color: #777;
        }

        .admin-order-product-price {
            font-weight: 700;
            white-space: nowrap;
        }

        .admin-order-info-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }

        .admin-order-info-item {
            min-width: 0;
            padding: 13px;
            background: #f7f7f7;
            border-radius: 9px;
            overflow-wrap: anywhere;
        }

        .admin-order-info-item small {
            display: block;
            margin-bottom: 6px;
            color: #777;
        }

        .admin-order-info-item strong {
            font-size: 13px;
        }

        .admin-order-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 18px;
            background: #fff1e5;
            border-radius: 10px;
            font-size: 17px;
        }

        .admin-order-total strong {
            color: #e66b20;
        }

        .admin-order-no-products {
            padding: 20px;
            text-align: center;
            color: #777;
            background: #f7f7f7;
            border-radius: 10px;
        }

        @media (max-width: 600px) {
            .admin-order-overlay {
                padding: 8px;
            }

            .admin-order-modal {
                max-height: 95vh;
            }

            .admin-order-content {
                padding: 13px;
            }

            .admin-order-info-grid {
                grid-template-columns: 1fr;
            }

            .admin-order-product img {
                width: 58px;
                height: 58px;
            }

            .admin-order-product {
                gap: 9px;
            }

            .admin-order-product-price {
                font-size: 12px;
            }
        }
    `;

    document.head.appendChild(style);
}


/* CREATE POPUP */

function createAdminOrderModal() {
    let modal = document.getElementById(
        "adminOrderDetailsModal"
    );

    if (modal) return modal;

    modal = document.createElement("div");

    modal.id = "adminOrderDetailsModal";
    modal.className = "admin-order-overlay";
    modal.hidden = true;

    const section = document.createElement("section");

    section.className = "admin-order-modal";
    section.setAttribute("role", "dialog");
    section.setAttribute("aria-modal", "true");
    section.setAttribute("aria-labelledby", "adminOrderTitle");

    section.innerHTML = `
        <header class="admin-order-header">
            <div>
                <h2 id="adminOrderTitle">Order Details</h2>
                <p id="adminOrderReference"></p>
            </div>

            <button
                type="button"
                id="closeAdminOrderModal"
                class="admin-order-close"
                aria-label="Close">
                &times;
            </button>
        </header>

        <div class="admin-order-content">

            <div class="admin-order-section">
                <h3>Products Ordered</h3>
                <div id="adminOrderProducts"></div>
            </div>

            <div class="admin-order-section">
                <h3>Customer Information</h3>
                <div id="adminOrderCustomer"></div>
            </div>

            <div class="admin-order-section">
                <h3>Order Information</h3>
                <div id="adminOrderInformation"></div>
            </div>

            <div class="admin-order-total">
                <span>Total Amount</span>
                <strong id="adminOrderTotal"></strong>
            </div>

        </div>
    `;

    modal.appendChild(section);
    document.body.appendChild(modal);

    document.getElementById("closeAdminOrderModal")
        .addEventListener("click", closeAdminOrderModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeAdminOrderModal();
        }
    });

    return modal;
}


/* CLOSE POPUP */

function closeAdminOrderModal() {
    const modal = document.getElementById(
        "adminOrderDetailsModal"
    );

    if (modal) {
        modal.hidden = true;
    }

    document.body.style.overflow = "";
}


/* CREATE INFORMATION BOX */

function createOrderInfoItem(label, value) {
    const item = document.createElement("div");

    item.className = "admin-order-info-item";

    const heading = document.createElement("small");
    heading.textContent = label;

    const content = document.createElement("strong");
    content.textContent =
        value === null || value === undefined || value === ""
            ? "Not provided"
            : String(value);

    item.append(heading, content);

    return item;
}


/* DISPLAY ORDER PRODUCTS */

function renderAdminOrderProducts(order) {
    const container = document.getElementById(
        "adminOrderProducts"
    );

    container.replaceChildren();

    const items = Array.isArray(order.items)
        ? order.items
        : [];

    if (!items.length) {
        const empty = document.createElement("div");

        empty.className = "admin-order-no-products";

        empty.textContent =
            "Product details are not available in this order record.";

        container.appendChild(empty);
        return;
    }

    items.forEach(item => {
        const product = document.createElement("div");

        product.className = "admin-order-product";

        const image = document.createElement("img");

        image.alt = item.name || "Ordered product";

        if (item.image_url) {
            image.src = item.image_url;
        } else {
            image.hidden = true;
        }

        image.onerror = () => {
            image.hidden = true;
        };

        const information = document.createElement("div");

        information.className = "admin-order-product-info";

        const name = document.createElement("strong");

        name.textContent =
            item.name || "Unnamed product";

        const quantity = document.createElement("small");

        quantity.textContent =
            `Quantity: ${Number(item.quantity) || 0}`;

        const unitPrice = document.createElement("small");

        unitPrice.textContent =
            `Unit price: ${formatMoney(
                item.unitPrice ?? item.originalUnitPrice ?? 0
            )}`;

        information.append(name, quantity, unitPrice);

        if (Number(item.discountPercentage) > 0) {
            const discount = document.createElement("small");

            discount.textContent =
                `Discount: ${item.discountPercentage}%`;

            information.appendChild(discount);
        }

        const price = document.createElement("div");

        price.className = "admin-order-product-price";

        const lineTotal =
            item.lineTotal ??
            (
                Number(item.unitPrice || 0) *
                Number(item.quantity || 0)
            );

        price.textContent = formatMoney(lineTotal);

        product.append(image, information, price);

        container.appendChild(product);
    });
}


/* OPEN SELECTED ORDER */

function openAdminOrderDetails(order) {
    addAdminOrderStyles();

    const modal = createAdminOrderModal();

    document.getElementById(
        "adminOrderReference"
    ).textContent =
        order.order_reference || order.id;

    renderAdminOrderProducts(order);

    const customer = document.getElementById(
        "adminOrderCustomer"
    );

    customer.replaceChildren();

    const customerGrid = document.createElement("div");

    customerGrid.className = "admin-order-info-grid";

    customerGrid.append(
        createOrderInfoItem(
            "Customer Name",
            order.customer_name
        ),
        createOrderInfoItem(
            "Email Address",
            order.customer_email
        ),
        createOrderInfoItem(
            "Phone Number",
            order.customer_phone
        ),
        createOrderInfoItem(
            "Delivery Address",
            order.delivery_address
        )
    );

    customer.appendChild(customerGrid);

    const information = document.getElementById(
        "adminOrderInformation"
    );

    information.replaceChildren();

    const infoGrid = document.createElement("div");

    infoGrid.className = "admin-order-info-grid";

    infoGrid.append(
        createOrderInfoItem(
            "Order Reference",
            order.order_reference || order.id
        ),
        createOrderInfoItem(
            "Payment Status",
            order.payment_status
        ),
        createOrderInfoItem(
            "Order Status",
            order.order_status
        ),
        createOrderInfoItem(
            "Order Date",
            formatDate(order.created_at)
        )
    );

    information.appendChild(infoGrid);

    document.getElementById(
        "adminOrderTotal"
    ).textContent = formatMoney(order.total_amount);

    modal.hidden = false;

    document.body.style.overflow = "hidden";
}


/* VIEW DETAILS BUTTON */

ordersTableBody.addEventListener("click", event => {
    const button = event.target.closest(
        'button[data-action="view-order"]'
    );

    if (!button) return;

    const order = allOrders.find(
        item => item.id === button.dataset.id
    );

    if (!order) {
        showGlobalMessage(
            "Unable to find the selected order."
        );
        return;
    }

    openAdminOrderDetails(order);
});


/* ESCAPE KEY CLOSES ORDER POPUP */

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeAdminOrderModal();
    }
});



/* =========================================================
   11. FLASH SALES
========================================================= */

async function loadFlashSales() {
    hideTableMessage(salesMessage);

    const { data, error } = await supabase
        .from("store_flash_sales")
        .select(`
            id,
            product_id,
            discount_percentage,
            starts_at,
            ends_at,
            is_active,
            product:store_products(name)
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;

    allFlashSales = data || [];

    renderFlashSales();

    updateFlashSaleProductOptions();
}


function updateFlashSaleProductOptions() {
    if (!saleProduct) return;

    const selected = saleProduct.value;

    saleProduct.replaceChildren();

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "Select a product";

    saleProduct.appendChild(placeholder);

    allProducts.forEach(product => {
        const option = document.createElement("option");

        option.value = product.id;
        option.textContent =
            `${product.name} — ${formatMoney(product.price)}`;

        saleProduct.appendChild(option);
    });

    if (
        allProducts.some(product => product.id === selected)
    ) {
        saleProduct.value = selected;
    }
}


function getFlashSaleStatus(sale) {
    if (!sale.is_active) return "inactive";

    const now = Date.now();

    const start = new Date(sale.starts_at).getTime();
    const end = new Date(sale.ends_at).getTime();

    if (now < start) return "upcoming";

    if (now >= end) return "expired";

    return "active";
}


function renderFlashSales() {
    flashSalesTableBody.replaceChildren();

    if (!allFlashSales.length) {
        showEmptyRow(
            flashSalesTableBody,
            "No flash sales have been created.",
            6
        );

        return;
    }

    allFlashSales.forEach(sale => {
        const row = document.createElement("tr");

        const productName =
            sale.product?.name || "Product unavailable";

        row.appendChild(createCell(productName));

        row.appendChild(
            createCell(`${sale.discount_percentage}%`)
        );

        row.appendChild(
            createCell(formatDate(sale.starts_at))
        );

        row.appendChild(
            createCell(formatDate(sale.ends_at))
        );

        const statusCell = document.createElement("td");

        statusCell.appendChild(
            createStatusBadge(getFlashSaleStatus(sale))
        );

        row.appendChild(statusCell);

        const actionCell = document.createElement("td");

        const actionGroup = document.createElement("div");

        actionGroup.className = "button-group";

        actionGroup.append(
            createActionButton(
                sale.is_active ? "Deactivate" : "Activate",
                "toggle-sale",
                sale.id
            ),
            createActionButton(
                "Delete",
                "delete-sale",
                sale.id,
                "danger-button"
            )
        );

        actionCell.appendChild(actionGroup);

        row.appendChild(actionCell);

        flashSalesTableBody.appendChild(row);
    });
}


/* Open flash sale modal */

addFlashSaleButton.addEventListener("click", () => {
    flashSaleForm.reset();

    hideMessage(document.getElementById("saleFormMessage"));

    updateFlashSaleProductOptions();

    if (!allProducts.length) {
        showMessage(
            document.getElementById("saleFormMessage"),
            "Add a product before creating a flash sale.",
            "error"
        );
    }

    openModal(flashSaleModal);
});


/* Create flash sale */

flashSaleForm.addEventListener("submit", async event => {
    event.preventDefault();

    const formMessage =
        document.getElementById("saleFormMessage");

    hideMessage(formMessage);

    const productIdValue = saleProduct.value;

    const discount = Number(saleDiscount.value);

    const start = new Date(saleStart.value);
    const end = new Date(saleEnd.value);

    if (!productIdValue) {
        showMessage(
            formMessage,
            "Please select a product.",
            "error"
        );

        return;
    }

    if (
        !Number.isFinite(discount) ||
        discount <= 0 ||
        discount >= 100
    ) {
        showMessage(
            formMessage,
            "Discount must be between 1 and 99 percent.",
            "error"
        );

        return;
    }

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
    ) {
        showMessage(
            formMessage,
            "The end date must be later than the start date.",
            "error"
        );

        return;
    }

    const saleData = {
        product_id: productIdValue,
        discount_percentage: discount,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        is_active: true
    };

    setButtonLoading(
        saveFlashSaleButton,
        true,
        "Creating..."
    );

    try {
        const { error } = await supabase
            .from("store_flash_sales")
            .insert(saleData);

        if (error) throw error;

        closeModal(flashSaleModal);

        await loadFlashSales();

        showGlobalMessage("Flash sale created successfully.");

    } catch (error) {
        console.error("Flash sale creation error:", error);

        showMessage(
            formMessage,
            error.message || "Unable to create flash sale.",
            "error"
        );

    } finally {
        setButtonLoading(saveFlashSaleButton, false);
    }
});


/* Flash sale actions */

flashSalesTableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "toggle-sale") {
        await toggleFlashSale(id);
    }

    if (action === "delete-sale") {
        await deleteFlashSale(id);
    }
});


async function toggleFlashSale(id) {
    const sale = allFlashSales.find(item => item.id === id);

    if (!sale) return;

    const { error } = await supabase
        .from("store_flash_sales")
        .update({
            is_active: !sale.is_active
        })
        .eq("id", id);

    if (error) {
        showGlobalMessage(error.message);
        return;
    }

    await loadFlashSales();

    showGlobalMessage("Flash sale status updated.");
}


async function deleteFlashSale(id) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this flash sale?"
    );

    if (!confirmed) return;

    const { error } = await supabase
        .from("store_flash_sales")
        .delete()
        .eq("id", id);

    if (error) {
        showGlobalMessage(error.message);
        return;
    }

    await loadFlashSales();

    showGlobalMessage("Flash sale deleted successfully.");
}


/* =========================================================
   12. REFRESH BUTTONS
========================================================= */

refreshDashboardButton.addEventListener("click", async () => {
    setButtonLoading(
        refreshDashboardButton,
        true,
        "Refreshing..."
    );

    try {
        await loadDashboardData();

    } finally {
        setButtonLoading(refreshDashboardButton, false);
    }
});


refreshOrdersButton.addEventListener("click", async () => {
    setButtonLoading(
        refreshOrdersButton,
        true,
        "Loading..."
    );

    try {
        await loadOrders();

    } catch (error) {
        showGlobalMessage(error.message);

    } finally {
        setButtonLoading(refreshOrdersButton, false);
    }
});


/* =========================================================
   13. START APPLICATION
========================================================= */

restoreAdminSession();


})();
