
/* =====================================================
   SWEET's KITCHEN & COLLECTIONS
   PROFESSIONAL ADMIN DASHBOARD
   admin.js

   Supabase authentication
   Orders management
   Product management
   Flash sales management
   Dashboard statistics
===================================================== */


/* =====================================================
   1. SUPABASE CONNECTION
===================================================== */

const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";

const SUPABASE_PUBLIC_KEY =
    "sb_publishable_QN5w738LNyUrYy2X93M1OQ_md6F2xTN";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY
);


/* =====================================================
   2. GLOBAL VARIABLES
===================================================== */

let currentAdmin = null;
let allOrders = [];
let allProducts = [];
let allFlashSales = [];

let editingProductId = null;
let editingFlashSaleId = null;

let isLoadingDashboard = false;


/* =====================================================
   3. HTML ELEMENTS
===================================================== */

// Login
const loginPanel = document.getElementById("loginPanel");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

// Dashboard
const dashboard = document.getElementById("dashboard");
const adminName = document.getElementById("adminName");
const adminEmailDisplay = document.getElementById("adminEmailDisplay");
const logoutButton = document.getElementById("logoutButton");

// Overview
const todayDate = document.getElementById("todayDate");
const totalSales = document.getElementById("totalSales");
const totalOrders = document.getElementById("totalOrders");
const pendingOrders = document.getElementById("pendingOrders");
const totalProducts = document.getElementById("totalProducts");
const recentOrdersBody = document.getElementById("recentOrdersBody");

// Orders
const refreshOrdersButton = document.getElementById("refreshOrdersButton");
const searchOrders = document.getElementById("searchOrders");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const ordersMessage = document.getElementById("ordersMessage");
const ordersTableBody = document.getElementById("ordersTableBody");

// Products
const addProductButton = document.getElementById("addProductButton");
const searchProducts = document.getElementById("searchProducts");
const productCategoryFilter = document.getElementById("productCategoryFilter");
const productsMessage = document.getElementById("productsMessage");
const productsTableBody = document.getElementById("productsTableBody");

// Flash sales
const addFlashSaleButton = document.getElementById("addFlashSaleButton");
const salesMessage = document.getElementById("salesMessage");
const flashSalesTableBody = document.getElementById("flashSalesTableBody");

// Product modal
const productModal = document.getElementById("productModal");
const productForm = document.getElementById("productForm");
const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productImage = document.getElementById("productImage");
const productActive = document.getElementById("productActive");
const productFormMessage = document.getElementById("productFormMessage");
const saveProductButton = document.getElementById("saveProductButton");

// Flash sale modal
const flashSaleModal = document.getElementById("flashSaleModal");
const flashSaleForm = document.getElementById("flashSaleForm");
const saleProduct = document.getElementById("saleProduct");
const saleDiscount = document.getElementById("saleDiscount");
const saleStart = document.getElementById("saleStart");
const saleEnd = document.getElementById("saleEnd");
const saleFormMessage = document.getElementById("saleFormMessage");
const saveFlashSaleButton = document.getElementById("saveFlashSaleButton");


/* =====================================================
   4. GENERAL HELPER FUNCTIONS
===================================================== */

function formatMoney(amount) {
    const number = Number(amount) || 0;

    return new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
        minimumFractionDigits: 2
    }).format(number);
}


function formatDate(dateValue) {
    if (!dateValue) return "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return new Intl.DateTimeFormat("en-GH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Accra"
    }).format(date);
}


function todayInGhana() {
    return new Intl.DateTimeFormat("en-GH", {
        dateStyle: "full",
        timeZone: "Africa/Accra"
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


function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
}


function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text ?? "—";
    return cell;
}


function createStatusBadge(status) {
    const safeStatus = String(status || "unknown").toLowerCase();

    const badge = createElement(
        "span",
        `status-badge ${safeStatus}`,
        safeStatus.replaceAll("_", " ")
    );

    return badge;
}


function setButtonLoading(button, loading, normalText) {
    if (!button) return;

    button.disabled = loading;
    button.textContent = loading ? "Please wait..." : normalText;
}


function showModal(modal) {
    if (!modal) return;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
}


function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
}


function getErrorMessage(error) {
    return error?.message || "Something went wrong. Please try again.";
}


/* =====================================================
   5. SHOW LOGIN OR DASHBOARD
===================================================== */

function showLogin() {
    if (loginPanel) {
        loginPanel.style.display = "flex";
    }

    if (dashboard) {
        dashboard.classList.remove("show-dashboard");
    }

    currentAdmin = null;
}


function showDashboard(user) {
    currentAdmin = user;

    if (loginPanel) {
        loginPanel.style.display = "none";
    }

    if (dashboard) {
        dashboard.classList.add("show-dashboard");
    }

    if (adminName) {
        adminName.textContent =
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Administrator";
    }

    if (adminEmailDisplay) {
        adminEmailDisplay.textContent = user.email || "";
    }

    if (todayDate) {
        todayDate.textContent = todayInGhana();
    }
}


/* =====================================================
   6. VERIFY ADMINISTRATOR ACCESS
===================================================== */

async function verifyAdministrator(user) {
    if (!user) return false;

    try {
        const { data, error } = await supabaseClient
            .from("store_admins")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            console.error("Admin verification error:", error);
            return false;
        }

        return Boolean(data);
    } catch (error) {
        console.error("Admin verification failed:", error);
        return false;
    }
}


/* =====================================================
   7. ADMIN LOGIN
===================================================== */

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        hideMessage(loginMessage);

        const email = adminEmail?.value.trim();
        const password = adminPassword?.value;

        if (!email || !password) {
            showMessage(
                loginMessage,
                "Enter your email address and password.",
                "error"
            );
            return;
        }

        setButtonLoading(loginButton, true, "Sign In");

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            const user = data.user;

            const isAdmin = await verifyAdministrator(user);

            if (!isAdmin) {
                await supabaseClient.auth.signOut();

                throw new Error(
                    "Access denied. This account is not registered as an administrator."
                );
            }

            showDashboard(user);

            adminLoginForm.reset();

            await loadDashboardData();

        } catch (error) {
            console.error("Login error:", error);

            showMessage(
                loginMessage,
                getErrorMessage(error),
                "error"
            );
        } finally {
            setButtonLoading(loginButton, false, "Sign In");
        }
    });
}


/* =====================================================
   8. RESTORE EXISTING ADMIN SESSION
===================================================== */

async function restoreAdminSession() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        const user = data.session?.user;

        if (!user) {
            showLogin();
            return;
        }

        const isAdmin = await verifyAdministrator(user);

        if (!isAdmin) {
            await supabaseClient.auth.signOut();
            showLogin();
            return;
        }

        showDashboard(user);

        await loadDashboardData();

    } catch (error) {
        console.error("Session restoration error:", error);
        showLogin();
    }
}


/* =====================================================
   9. LOGOUT
===================================================== */

if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
        const confirmed = window.confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmed) return;

        try {
            const { error } = await supabaseClient.auth.signOut();

            if (error) throw error;

            showLogin();

        } catch (error) {
            alert("Logout failed: " + getErrorMessage(error));
        }
    });
}


/* =====================================================
   10. DASHBOARD NAVIGATION
===================================================== */

const navigationLinks = document.querySelectorAll("[data-section]");

navigationLinks.forEach(link => {
    link.addEventListener("click", function () {
        const sectionName = this.dataset.section;

        document.querySelectorAll(".dashboard-section").forEach(section => {
            section.classList.remove("active-section");
        });

        document.querySelectorAll(".nav-link").forEach(nav => {
            nav.classList.remove("active");
        });

        const selectedSection = document.getElementById(
            sectionName + "Section"
        );

        if (selectedSection) {
            selectedSection.classList.add("active-section");
        }

        this.classList.add("active");

        closeMobileSidebar();
    });
});


/* =====================================================
   11. MOBILE SIDEBAR
===================================================== */

const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebar = document.querySelector(".sidebar");
const sidebarOverlay = document.querySelector(".sidebar-overlay");


function openMobileSidebar() {
    sidebar?.classList.add("open");
    sidebarOverlay?.classList.add("show");
}


function closeMobileSidebar() {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("show");
}


if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", openMobileSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeMobileSidebar);
}


/* =====================================================
   12. LOAD ALL DASHBOARD DATA
===================================================== */

async function loadDashboardData() {
    if (isLoadingDashboard) return;

    isLoadingDashboard = true;

    try {
        await Promise.allSettled([
            loadProducts(),
            loadFlashSales(),
            loadOrders()
        ]);

        updateDashboardStatistics();

    } finally {
        isLoadingDashboard = false;
    }
}


/* =====================================================
   13. LOAD ORDERS FROM EDGE FUNCTION
===================================================== */

async function loadOrders() {
    if (!ordersTableBody) return;

    ordersTableBody.replaceChildren(
        createElement("tr", "loading", "Loading orders...")
    );

    hideMessage(ordersMessage);

    try {
        const { data: sessionData } =
            await supabaseClient.auth.getSession();

        const session = sessionData.session;

        if (!session) {
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

        if (Array.isArray(data)) {
            allOrders = data;
        } else if (Array.isArray(data?.orders)) {
            allOrders = data.orders;
        } else {
            allOrders = [];
        }

        renderOrders();
        renderRecentOrders();
        updateDashboardStatistics();

    } catch (error) {
        console.error("Orders loading error:", error);

        allOrders = [];

        ordersTableBody.replaceChildren(
            createElement("tr", "table-empty", getErrorMessage(error))
        );

        showMessage(
            ordersMessage,
            "Unable to retrieve orders. Check that the admin-orders Edge Function is deployed and accessible.",
            "error"
        );

        renderRecentOrders();
        updateDashboardStatistics();
    }
}


/* =====================================================
   14. DISPLAY ORDERS
===================================================== */

function renderOrders() {
    if (!ordersTableBody) return;

    ordersTableBody.replaceChildren();

    const searchText = searchOrders?.value.trim().toLowerCase() || "";
    const selectedStatus = orderStatusFilter?.value || "all";

    const filteredOrders = allOrders.filter(order => {
        const reference = String(order.order_reference || "").toLowerCase();
        const customer = String(order.user_id || "").toLowerCase();
        const status = String(order.order_status || "").toLowerCase();

        const matchesSearch =
            reference.includes(searchText) ||
            customer.includes(searchText);

        const matchesStatus =
            selectedStatus === "all" ||
            status === selectedStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    if (filteredOrders.length === 0) {
        ordersTableBody.appendChild(
            createElement("tr", "table-empty", "No orders found.")
        );
        return;
    }

    filteredOrders.forEach(order => {
        const row = document.createElement("tr");

        row.appendChild(
            createCell(order.order_reference || order.id || "—")
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

            if (status === String(order.order_status || "").toLowerCase()) {
                option.selected = true;
            }

            statusSelect.appendChild(option);
        });

        statusSelect.addEventListener("change", async function () {
            await updateOrderStatus(order, this.value, this);
        });

        statusCell.appendChild(statusSelect);
        row.appendChild(statusCell);

        ordersTableBody.appendChild(row);
    });
}


/* =====================================================
   15. UPDATE ORDER STATUS
===================================================== */

async function updateOrderStatus(order, newStatus, selectElement) {
    const previousStatus = order.order_status;

    if (!order.id) {
        alert("This order does not have an ID. The status cannot be updated.");
        selectElement.value = previousStatus;
        return;
    }

    if (newStatus === previousStatus) return;

    const confirmed = window.confirm(
        `Change order ${order.order_reference || order.id} to ${newStatus}?`
    );

    if (!confirmed) {
        selectElement.value = previousStatus;
        return;
    }

    selectElement.disabled = true;

    try {
        const { data: sessionData } =
            await supabaseClient.auth.getSession();

        const session = sessionData.session;

        if (!session) {
            throw new Error("Your session has expired. Please sign in again.");
        }

        const { data, error } =
            await supabaseClient.functions.invoke("admin-orders", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                body: {
                    id: order.id,
                    order_status: newStatus
                }
            });

        if (error) throw error;

        const updatedOrder = data?.order;

        if (!updatedOrder) {
            throw new Error(
                "The server did not confirm the order update."
            );
        }

        const orderIndex = allOrders.findIndex(
            item => item.id === order.id
        );

        if (orderIndex !== -1) {
            allOrders[orderIndex] = {
                ...allOrders[orderIndex],
                ...updatedOrder
            };
        }

        renderOrders();
        renderRecentOrders();

        showMessage(
            ordersMessage,
            "Order status updated successfully.",
            "success"
        );

    } catch (error) {
        console.error("Order update error:", error);

        alert("Could not update order: " + getErrorMessage(error));

        selectElement.value = previousStatus;

    } finally {
        selectElement.disabled = false;
    }
}


/* =====================================================
   16. RECENT ORDERS ON OVERVIEW
===================================================== */

function renderRecentOrders() {
    if (!recentOrdersBody) return;

    recentOrdersBody.replaceChildren();

    const recentOrders = [...allOrders]
        .sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        })
        .slice(0, 5);

    if (recentOrders.length === 0) {
        recentOrdersBody.appendChild(
            createElement("tr", "table-empty", "No recent orders available.")
        );
        return;
    }

    recentOrders.forEach(order => {
        const row = document.createElement("tr");

        row.appendChild(
            createCell(order.order_reference || order.id || "—")
        );

        row.appendChild(
            createCell(formatDate(order.created_at))
        );

        row.appendChild(
            createCell(formatMoney(order.total_amount))
        );

        const statusCell = document.createElement("td");
        statusCell.appendChild(createStatusBadge(order.order_status));

        row.appendChild(statusCell);

        recentOrdersBody.appendChild(row);
    });
}


/* =====================================================
   17. SEARCH AND FILTER ORDERS
===================================================== */

if (searchOrders) {
    searchOrders.addEventListener("input", renderOrders);
}

if (orderStatusFilter) {
    orderStatusFilter.addEventListener("change", renderOrders);
}

if (refreshOrdersButton) {
    refreshOrdersButton.addEventListener("click", loadOrders);
}


/* =====================================================
   18. LOAD PRODUCTS FROM SUPABASE
===================================================== */

async function loadProducts() {
    if (!productsTableBody) return;

    productsTableBody.replaceChildren(
        createElement("tr", "loading", "Loading products...")
    );

    hideMessage(productsMessage);

    try {
        const { data, error } = await supabaseClient
            .from("store_products")
            .select("id, product_name, category, unit_price, image_url, active")
            .order("product_name", { ascending: true });

        if (error) throw error;

        allProducts = data || [];

        renderProducts();
        updateProductCategoryFilter();
        populateFlashSaleProducts();
        updateDashboardStatistics();

    } catch (error) {
        console.error("Products loading error:", error);

        allProducts = [];

        productsTableBody.replaceChildren(
            createElement("tr", "table-empty", getErrorMessage(error))
        );

        showMessage(
            productsMessage,
            "Unable to load products. Confirm that store_products has the expected columns and that your admin account has permission to read them.",
            "error"
        );

        updateDashboardStatistics();
    }
}


/* =====================================================
   19. DISPLAY PRODUCTS
===================================================== */

function renderProducts() {
    if (!productsTableBody) return;

    productsTableBody.replaceChildren();

    const searchText = searchProducts?.value.trim().toLowerCase() || "";
    const selectedCategory = productCategoryFilter?.value || "all";

    const filteredProducts = allProducts.filter(product => {
        const name = String(product.product_name || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();

        const matchesSearch =
            name.includes(searchText) ||
            category.includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory.toLowerCase();

        return matchesSearch && matchesCategory;
    });

    if (filteredProducts.length === 0) {
        productsTableBody.appendChild(
            createElement("tr", "table-empty", "No products found.")
        );
        return;
    }

    filteredProducts.forEach(product => {
        const row = document.createElement("tr");

        const productCell = document.createElement("td");
        const productInfo = createElement("div", "table-product");

        if (product.image_url) {
            const image = document.createElement("img");
            image.src = product.image_url;
            image.alt = product.product_name || "Product image";
            image.loading = "lazy";

            image.addEventListener("error", function () {
                this.style.display = "none";
            });

            productInfo.appendChild(image);
        }

        const details = document.createElement("div");

        details.appendChild(
            createElement("strong", "", product.product_name || "Unnamed product")
        );

        details.appendChild(
            createElement("small", "", product.category || "Uncategorised")
        );

        productInfo.appendChild(details);
        productCell.appendChild(productInfo);
        row.appendChild(productCell);

        row.appendChild(
            createCell(formatMoney(product.unit_price))
        );

        row.appendChild(
            createCell(product.category || "—")
        );

        const activeCell = document.createElement("td");
        activeCell.appendChild(
            createStatusBadge(product.active ? "active" : "inactive")
        );
        row.appendChild(activeCell);

        const actionCell = document.createElement("td");
        const actions = createElement("div", "button-group");

        const editButton = createElement(
            "button",
            "small-button secondary-button",
            "Edit"
        );

        editButton.type = "button";

        editButton.addEventListener("click", () => {
            openProductEditor(product);
        });

        const toggleButton = createElement(
            "button",
            "small-button secondary-button",
            product.active ? "Deactivate" : "Activate"
        );

        toggleButton.type = "button";

        toggleButton.addEventListener("click", () => {
            toggleProductStatus(product);
        });

        const deleteButton = createElement(
            "button",
            "small-button danger-button",
            "Delete"
        );

        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            deleteProduct(product);
        });

        actions.append(editButton, toggleButton, deleteButton);
        actionCell.appendChild(actions);
        row.appendChild(actionCell);

        productsTableBody.appendChild(row);
    });
}


/* =====================================================
   20. PRODUCT CATEGORY FILTER
===================================================== */

function updateProductCategoryFilter() {
    if (!productCategoryFilter) return;

    const selectedValue = productCategoryFilter.value;

    const categories = [
        ...new Set(
            allProducts
                .map(product => product.category)
                .filter(Boolean)
        )
    ].sort();

    productCategoryFilter.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All Categories";
    productCategoryFilter.appendChild(allOption);

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;

        productCategoryFilter.appendChild(option);
    });

    if (
        [...productCategoryFilter.options]
            .some(option => option.value === selectedValue)
    ) {
        productCategoryFilter.value = selectedValue;
    }
}


if (searchProducts) {
    searchProducts.addEventListener("input", renderProducts);
}

if (productCategoryFilter) {
    productCategoryFilter.addEventListener("change", renderProducts);
}


/* =====================================================
   21. OPEN PRODUCT FORM
===================================================== */

function openProductEditor(product = null) {
    if (!productForm) return;

    productForm.reset();

    hideMessage(productFormMessage);

    editingProductId = product?.id || null;

    if (productId) {
        productId.value = product?.id || "";
    }

    if (productName) {
        productName.value = product?.product_name || "";
    }

    if (productCategory) {
        productCategory.value = product?.category || "";
    }

    if (productPrice) {
        productPrice.value = product?.unit_price ?? "";
    }

    if (productImage) {
        productImage.value = product?.image_url || "";
    }

    if (productActive) {
        productActive.checked = product ? Boolean(product.active) : true;
    }

    const modalTitle = productModal?.querySelector(".modal-header h2");

    if (modalTitle) {
        modalTitle.textContent = product ? "Edit Product" : "Add New Product";
    }

    if (saveProductButton) {
        saveProductButton.textContent = product ? "Update Product" : "Save Product";
    }

    showModal(productModal);
}


if (addProductButton) {
    addProductButton.addEventListener("click", () => {
        openProductEditor();
    });
}


/* =====================================================
   22. SAVE PRODUCT
===================================================== */

if (productForm) {
    productForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        hideMessage(productFormMessage);

        const name = productName?.value.trim();
        const category = productCategory?.value.trim();
        const price = Number(productPrice?.value);
        const image = productImage?.value.trim() || null;
        const active = productActive?.checked ?? true;

        if (!name || !category || !productPrice?.value.trim()) {
            showMessage(
                productFormMessage,
                "Complete all required product fields.",
                "error"
            );
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            showMessage(
                productFormMessage,
                "Enter a valid product price.",
                "error"
            );
            return;
        }

        const productData = {
            product_name: name,
            category,
            unit_price: price,
            image_url: image,
            active
        };

        setButtonLoading(
            saveProductButton,
            true,
            editingProductId ? "Update Product" : "Save Product"
        );

        try {
            let result;

            if (editingProductId) {
                result = await supabaseClient
                    .from("store_products")
                    .update(productData)
                    .eq("id", editingProductId);
            } else {
                result = await supabaseClient
                    .from("store_products")
                    .insert([productData]);
            }

            if (result.error) {
                throw result.error;
            }

            showMessage(
                productsMessage,
                editingProductId
                    ? "Product updated successfully."
                    : "Product added successfully.",
                "success"
            );

            closeModal(productModal);

            await loadProducts();

        } catch (error) {
            console.error("Product save error:", error);

            showMessage(
                productFormMessage,
                getErrorMessage(error),
                "error"
            );

        } finally {
            setButtonLoading(
                saveProductButton,
                false,
                editingProductId ? "Update Product" : "Save Product"
            );
        }
    });
}


/* =====================================================
   23. ACTIVATE / DEACTIVATE PRODUCT
===================================================== */

async function toggleProductStatus(product) {
    const newStatus = !product.active;

    const confirmed = window.confirm(
        `${newStatus ? "Activate" : "Deactivate"} ${product.product_name}?`
    );

    if (!confirmed) return;

    if (!product.id) {
        alert("Product ID is missing. Cannot update this product.");
        return;
    }

    try {
        const { error } = await supabaseClient
            .from("store_products")
            .update({ active: newStatus })
            .eq("id", product.id);

        if (error) throw error;

        showMessage(
            productsMessage,
            `Product ${newStatus ? "activated" : "deactivated"} successfully.`,
            "success"
        );

        await loadProducts();

    } catch (error) {
        console.error("Product status error:", error);

        alert("Unable to update product: " + getErrorMessage(error));
    }
}


/* =====================================================
   24. DELETE PRODUCT
===================================================== */

async function deleteProduct(product) {
    const confirmed = window.confirm(
        `Are you sure you want to permanently delete "${product.product_name}"?`
    );

    if (!confirmed) return;

    if (!product.id) {
        alert("Product ID is missing. Cannot delete this product.");
        return;
    }

    try {
        const { error } = await supabaseClient
            .from("store_products")
            .delete()
            .eq("id", product.id);

        if (error) throw error;

        showMessage(
            productsMessage,
            "Product deleted successfully.",
            "success"
        );

        await loadProducts();

    } catch (error) {
        console.error("Product deletion error:", error);

        alert(
            "Unable to delete product. It may be linked to existing records. " +
            getErrorMessage(error)
        );
    }
}


/* =====================================================
   25. LOAD FLASH SALES
===================================================== */

async function loadFlashSales() {
    if (!flashSalesTableBody) return;

    flashSalesTableBody.replaceChildren(
        createElement("tr", "loading", "Loading flash sales...")
    );

    hideMessage(salesMessage);

    try {
        const { data, error } = await supabaseClient
            .from("store_flash_sales")
            .select("id, product_name, discount_percentage, starts_at, ends_at, is_active")
            .order("starts_at", { ascending: false });

        if (error) throw error;

        allFlashSales = data || [];

        renderFlashSales();
        updateDashboardStatistics();

    } catch (error) {
        console.error("Flash sales loading error:", error);

        allFlashSales = [];

        flashSalesTableBody.replaceChildren(
            createElement("tr", "table-empty", getErrorMessage(error))
        );

        showMessage(
            salesMessage,
            "Unable to load flash sales. Confirm that store_flash_sales has the expected columns and that your admin account has permission to read them.",
            "error"
        );

        updateDashboardStatistics();
    }
}


/* =====================================================
   26. DISPLAY FLASH SALES
===================================================== */

function renderFlashSales() {
    if (!flashSalesTableBody) return;

    flashSalesTableBody.replaceChildren();

    if (allFlashSales.length === 0) {
        flashSalesTableBody.appendChild(
            createElement("tr", "table-empty", "No flash sales available.")
        );
        return;
    }

    allFlashSales.forEach(sale => {
        const row = document.createElement("tr");

        row.appendChild(
            createCell(sale.product_name)
        );

        row.appendChild(
            createCell(`${Number(sale.discount_percentage) || 0}%`)
        );

        row.appendChild(
            createCell(formatDate(sale.starts_at))
        );

        row.appendChild(
            createCell(formatDate(sale.ends_at))
        );

        const statusCell = document.createElement("td");

        const now = new Date();
        const start = new Date(sale.starts_at);
        const end = new Date(sale.ends_at);

        let displayStatus = "inactive";

        if (sale.is_active && now >= start && now <= end) {
            displayStatus = "active";
        } else if (sale.is_active && now < start) {
            displayStatus = "pending";
        } else if (sale.is_active && now > end) {
            displayStatus = "inactive";
        }

        statusCell.appendChild(createStatusBadge(displayStatus));
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");
        const actions = createElement("div", "button-group");

        const toggleButton = createElement(
            "button",
            "small-button secondary-button",
            sale.is_active ? "Deactivate" : "Activate"
        );

        toggleButton.type = "button";

        toggleButton.addEventListener("click", () => {
            toggleFlashSale(sale);
        });

        const deleteButton = createElement(
            "button",
            "small-button danger-button",
            "Delete"
        );

        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            deleteFlashSale(sale);
        });

        actions.append(toggleButton, deleteButton);
        actionCell.appendChild(actions);
        row.appendChild(actionCell);

        flashSalesTableBody.appendChild(row);
    });
}


/* =====================================================
   27. POPULATE FLASH SALE PRODUCT SELECT
===================================================== */

function populateFlashSaleProducts() {
    if (!saleProduct) return;

    const previousValue = saleProduct.value;

    saleProduct.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a product";
    saleProduct.appendChild(placeholder);

    allProducts
        .filter(product => product.active)
        .forEach(product => {
            const option = document.createElement("option");

            option.value = product.product_name;
            option.textContent = product.product_name;

            saleProduct.appendChild(option);
        });

    if (
        [...saleProduct.options]
            .some(option => option.value === previousValue)
    ) {
        saleProduct.value = previousValue;
    }
}


/* =====================================================
   28. OPEN FLASH SALE FORM
===================================================== */

function openFlashSaleEditor() {
    if (!flashSaleForm) return;

    flashSaleForm.reset();

    editingFlashSaleId = null;

    hideMessage(saleFormMessage);

    populateFlashSaleProducts();

    const modalTitle = flashSaleModal?.querySelector(".modal-header h2");

    if (modalTitle) {
        modalTitle.textContent = "Create Flash Sale";
    }

    if (saveFlashSaleButton) {
        saveFlashSaleButton.textContent = "Create Flash Sale";
    }

    showModal(flashSaleModal);
}


if (addFlashSaleButton) {
    addFlashSaleButton.addEventListener("click", openFlashSaleEditor);
}


/* =====================================================
   29. CREATE FLASH SALE
===================================================== */

if (flashSaleForm) {
    flashSaleForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        hideMessage(saleFormMessage);

        const product = saleProduct?.value;
        const discount = Number(saleDiscount?.value);
        const startValue = saleStart?.value;
        const endValue = saleEnd?.value;

        if (!product || !startValue || !endValue) {
            showMessage(
                saleFormMessage,
                "Complete all flash sale fields.",
                "error"
            );
            return;
        }

        if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
            showMessage(
                saleFormMessage,
                "Discount must be greater than 0 and not more than 100%.",
                "error"
            );
            return;
        }

        const startDate = new Date(startValue);
        const endDate = new Date(endValue);

        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            endDate <= startDate
        ) {
            showMessage(
                saleFormMessage,
                "The end date must be later than the start date.",
                "error"
            );
            return;
        }

        const saleData = {
            product_name: product,
            discount_percentage: discount,
            starts_at: startDate.toISOString(),
            ends_at: endDate.toISOString(),
            is_active: true
        };

        setButtonLoading(
            saveFlashSaleButton,
            true,
            "Create Flash Sale"
        );

        try {
            const { error } = await supabaseClient
                .from("store_flash_sales")
                .insert([saleData]);

            if (error) throw error;

            showMessage(
                salesMessage,
                "Flash sale created successfully.",
                "success"
            );

            closeModal(flashSaleModal);

            await loadFlashSales();

        } catch (error) {
            console.error("Flash sale creation error:", error);

            showMessage(
                saleFormMessage,
                getErrorMessage(error),
                "error"
            );

        } finally {
            setButtonLoading(
                saveFlashSaleButton,
                false,
                "Create Flash Sale"
            );
        }
    });
}


/* =====================================================
   30. ACTIVATE / DEACTIVATE FLASH SALE
===================================================== */

async function toggleFlashSale(sale) {
    const newStatus = !sale.is_active;

    const confirmed = window.confirm(
        `${newStatus ? "Activate" : "Deactivate"} the flash sale for ${sale.product_name}?`
    );

    if (!confirmed) return;

    if (!sale.id) {
        alert("Flash sale ID is missing. Cannot update this sale.");
        return;
    }

    try {
        const { error } = await supabaseClient
            .from("store_flash_sales")
            .update({ is_active: newStatus })
            .eq("id", sale.id);

        if (error) throw error;

        showMessage(
            salesMessage,
            `Flash sale ${newStatus ? "activated" : "deactivated"} successfully.`,
            "success"
        );

        await loadFlashSales();

    } catch (error) {
        console.error("Flash sale status error:", error);

        alert("Unable to update flash sale: " + getErrorMessage(error));
    }
}


/* =====================================================
   31. DELETE FLASH SALE
===================================================== */

async function deleteFlashSale(sale) {
    const confirmed = window.confirm(
        `Delete the flash sale for "${sale.product_name}"?`
    );

    if (!confirmed) return;

    if (!sale.id) {
        alert("Flash sale ID is missing. Cannot delete this sale.");
        return;
    }

    try {
        const { error } = await supabaseClient
            .from("store_flash_sales")
            .delete()
            .eq("id", sale.id);

        if (error) throw error;

        showMessage(
            salesMessage,
            "Flash sale deleted successfully.",
            "success"
        );

        await loadFlashSales();

    } catch (error) {
        console.error("Flash sale deletion error:", error);

        alert("Unable to delete flash sale: " + getErrorMessage(error));
    }
}


/* =====================================================
   32. DASHBOARD STATISTICS
===================================================== */

function updateDashboardStatistics() {
    // All-time sales count only verified paid orders.
    const paidSales = allOrders
        .filter(order => {
            return String(order.payment_status || "").toLowerCase() === "paid";
        })
        .reduce((total, order) => {
            return total + (Number(order.total_amount) || 0);
        }, 0);

    const numberOfOrders = allOrders.length;

    const numberOfPendingOrders = allOrders.filter(order => {
        return String(order.order_status || "").toLowerCase() === "pending";
    }).length;

    const numberOfActiveProducts = allProducts.filter(product => {
        return product.active === true;
    }).length;

    if (totalSales) {
        totalSales.textContent = formatMoney(paidSales);
    }

    if (totalOrders) {
        totalOrders.textContent = numberOfOrders.toLocaleString("en-GH");
    }

    if (pendingOrders) {
        pendingOrders.textContent =
            numberOfPendingOrders.toLocaleString("en-GH");
    }

    if (totalProducts) {
        totalProducts.textContent =
            numberOfActiveProducts.toLocaleString("en-GH");
    }
}


/* =====================================================
   33. CLOSE MODALS
===================================================== */

document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", function () {
        const modal = this.closest(".modal");

        closeModal(modal);
    });
});


/* Close modal when clicking outside its content */

[productModal, flashSaleModal].forEach(modal => {
    if (!modal) return;

    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});


/* Close modal with Escape key */

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeModal(productModal);
        closeModal(flashSaleModal);
        closeMobileSidebar();
    }
});


/* =====================================================
   34. INITIALIZE DASHBOARD
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
    if (todayDate) {
        todayDate.textContent = todayInGhana();
    }

    restoreAdminSession();
});
