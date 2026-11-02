```javascript
(() => {
    "use strict";

    /* =========================================================
       SWEET's KITCHEN & COLLECTIONS
       COMPLETE ADMIN DASHBOARD
       Supabase + Products + Orders + Flash Sales + Store Control
    ========================================================= */

    /* =========================================================
       1. SUPABASE CONNECTION
    ========================================================= */

    const SUPABASE_URL =
        "https://vbrlprrbtumonmroybdv.supabase.co";

    const SUPABASE_PUBLIC_KEY =
        "sb_publishable_QN5w738LnyUrYy2X93M1OQ_md6F2xTN";

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

    // Store control settings
    let storeSettings = {
    id: true,
    is_open: true,
    closed_message: "Our store is temporarily closed. Please check back soon."
};

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

        /* Store control — IDs matching admin.html */

    const storeStatusText =
        document.getElementById("storeStatusText");

    const storeStatusDescription =
        document.getElementById("storeStatusDescription");

    const storeClosedMessage =
        document.getElementById("storeClosedMessage");

    const saveStoreMessageButton =
        document.getElementById("saveStoreMessageButton");

    const toggleStoreButton =
        document.getElementById("toggleStoreButton");

    const storeControlMessage =
        document.getElementById("storeControlMessage");


    /* =========================================================
       4. GENERAL HELPERS
    ========================================================= */

    function formatMoney(amount) {
        return CURRENCY.format(Number(amount) || 0);
    }

    function formatDate(dateValue) {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "—";

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

    function setButtonLoading(
        button,
        loading,
        loadingText = "Please wait..."
    ) {
        if (!button) return;

        if (loading) {
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.textContent;
            }

            button.textContent = loadingText;
            button.disabled = true;
        } else {
            button.textContent =
                button.dataset.originalText || button.textContent;

            delete button.dataset.originalText;
            button.disabled = false;
        }
    }

    function createCell(text, className = "") {
        const td = document.createElement("td");

        td.textContent = text ?? "";

        if (className) td.className = className;

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
        if (!tbody) return;

        tbody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = columns;
        cell.className = "empty-cell";
        cell.textContent = message;

        row.appendChild(cell);
        tbody.appendChild(row);
    }

    function createActionButton(
        text,
        action,
        id,
        className = "secondary-button"
    ) {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = text;
        button.className = `small-button ${className}`;

        button.dataset.action = action;
        button.dataset.id = id;

        return button;
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
            const modal = document.getElementById(
                button.dataset.closeModal
            );

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

        const avatar = document.querySelector(".admin-avatar");

        if (avatar) avatar.textContent = firstLetter || "A";

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
                "Could not verify administrator access: " +
                error.message
            );
        }

        if (!data) {
            throw new Error(
                "This account is not registered as a store administrator."
            );
        }

        return true;
    }

    adminLoginForm.addEventListener("submit", async event => {
        event.preventDefault();

        hideMessage(loginMessage);

        setButtonLoading(loginButton, true, "Signing in...");

        const email = adminEmail.value.trim();
        const password = adminPassword.value;

        try {
            const { data, error } =
                await supabase.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            await verifyAdministrator(data.user);

            showMessage(
                loginMessage,
                "Login successful.",
                "success"
            );

            showDashboard(data.user);

        } catch (error) {
            await supabase.auth.signOut();

            showMessage(
                loginMessage,
                error.message || "Login failed.",
                "error"
            );

        } finally {
            setButtonLoading(loginButton, false);
        }
    });

    async function restoreAdminSession() {
        try {
            const { data, error } =
                await supabase.auth.getSession();

            if (error) throw error;

            const user = data.session?.user;

            if (!user) {
                showLogin();
                return;
            }

            await verifyAdministrator(user);

            showDashboard(user);

        } catch (error) {
            console.error("Session restoration:", error);

            await supabase.auth.signOut();

            showLogin();
        }
    }

    logoutButton.addEventListener("click", async () => {
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
        customers: "Customer Management",
        "store-control": "Store Control"
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

        if (sectionName === "store-control") {
            loadStoreSettings();
        }
    }

    document.querySelectorAll("[data-section]").forEach(button => {
        button.addEventListener("click", () => {
            navigateToSection(button.dataset.section);
        });
    });

    function openSidebar() {
        sidebar.classList.add("open");
        sidebarOverlay.classList.add("show");
    }

    function closeSidebar() {
        if (!sidebar || !sidebarOverlay) return;

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
                loadFlashSales(),
                loadStoreSettings()
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

        if (navPendingCount) {
            navPendingCount.textContent = pendingCount;
        }

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
                created_at
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        allProducts = data || [];

        renderProducts();
        updateCategoryFilter();
        updateFlashSaleProductOptions();
    }

    function renderProducts() {
        const search = searchProducts.value.trim().toLowerCase();
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
            showEmptyRow(productsTableBody, "No products found.", 6);
            return;
        }

        filteredProducts.forEach(product => {
            const row = document.createElement("tr");

            const productCell = document.createElement("td");
            const productContainer = document.createElement("div");

            productContainer.className = "table-product";

            const image = document.createElement("img");
            image.src = product.image_url || "";
            image.alt = product.name || "Product";

            image.onerror = () => {
                image.style.display = "none";
            };

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
            row.appendChild(createCell(formatMoney(product.price)));
            row.appendChild(createCell(String(product.stock ?? 0)));

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
                createActionButton("Edit", "edit-product", product.id),
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

    /* Product image preview */

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

        if (productImagePreview.dataset.previewUrl) {
            URL.revokeObjectURL(
                productImagePreview.dataset.previewUrl
            );
        }

        const previewURL = URL.createObjectURL(file);

        productImagePreview.dataset.previewUrl = previewURL;
        productImagePreview.src = previewURL;
        productImagePreview.hidden = false;

        hideMessage(productFormMessage);
    });

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
            throw new Error("Use a JPG, PNG, WEBP or GIF image.");
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            throw new Error("Image size must not exceed 5 MB.");
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

    productForm.addEventListener("submit", async event => {
        event.preventDefault();

        hideMessage(productFormMessage);

        const name = productName.value.trim();
        const description = productDescription.value.trim();
        const category = productCategory.value.trim();

        const price = Number(productPrice.value);
        const stock = Number(productStock.value);

        let imageUrl = productImage.value.trim();

        if (!name || !category) {
            showMessage(
                productFormMessage,
                "Product name and category are required.",
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

        if (!Number.isInteger(stock) || stock < 0) {
            showMessage(
                productFormMessage,
                "Stock must be a whole number of zero or more.",
                "error"
            );
            return;
        }

        const selectedImage = productImageFile.files[0];

        setButtonLoading(
            saveProductButton,
            true,
            selectedImage ? "Uploading image..." : "Saving..."
        );

        try {
            if (selectedImage) {
                imageUrl = await uploadProductImage(selectedImage);
            }

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

            if (editingProductId) {
                result = await supabase
                    .from("store_products")
                    .update(productData)
                    .eq("id", editingProductId)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from("store_products")
                    .insert(productData)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            const wasEditing = Boolean(editingProductId);

            editingProductId = null;

            closeModal(productModal);

            await loadProducts();
            updateDashboardStatistics();

            showGlobalMessage(
                wasEditing
                    ? "Product updated successfully."
                    : "Product added successfully."
            );

        } catch (error) {
            console.error("Product save error:", error);

            showMessage(
                productFormMessage,
                error.message || "Unable to save product.",
                "error"
            );

        } finally {
            setButtonLoading(saveProductButton, false);
        }
    });

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

        const productIds = [
            ...new Set(
                allOrders.flatMap(order =>
                    Array.isArray(order.items)
                        ? order.items
                            .map(item => item.productId)
                            .filter(Boolean)
                        : []
                )
            )
        ];

        const imageMap = new Map();

        if (productIds.length) {
            const { data: products, error: imageError } =
                await supabase
                    .from("store_products")
                    .select("id, image_url")
                    .in("id", productIds);

            if (imageError) throw imageError;

            (products || []).forEach(product => {
                imageMap.set(product.id, product.image_url);
            });
        }

        allOrders.forEach(order => {
            if (!Array.isArray(order.items)) {
                order.items = [];
                return;
            }

            order.items = order.items.map(item => ({
                ...item,
                image_url: imageMap.get(item.productId) || ""
            }));
        });

        renderOrders();
        updateDashboardStatistics();
    }

    function renderOrders() {
        const search = searchOrders.value.trim().toLowerCase();
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
            showEmptyRow(ordersTableBody, "No orders found.", 6);
            return;
        }

        filteredOrders.forEach(order => {
            const row = document.createElement("tr");

            row.appendChild(
                createCell(order.order_reference || order.id)
            );

            row.appendChild(createCell(formatDate(order.created_at)));
            row.appendChild(createCell(formatMoney(order.total_amount)));

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

            actionCell.appendChild(
                createActionButton(
                    "View Products",
                    "view-order",
                    order.id
                )
            );

            row.appendChild(actionCell);
            ordersTableBody.appendChild(row);

            /* Expandable order details */

            const detailsRow = document.createElement("tr");

            detailsRow.className = "order-details-row";
            detailsRow.hidden = true;
            detailsRow.dataset.orderDetails = order.id;

            const detailsCell = document.createElement("td");
            detailsCell.colSpan = 6;

            const detailsContainer = document.createElement("div");
            detailsContainer.className = "order-details-container";

            const customerHeading = document.createElement("h3");
            customerHeading.textContent = "Customer Information";

            const customerInfo = document.createElement("div");
            customerInfo.className = "order-customer-info";

            [
                ["Name", order.customer_name],
                ["Email", order.customer_email],
                ["Phone", order.customer_phone],
                ["Delivery Address", order.delivery_address],
                ["Payment Status", order.payment_status],
                ["Order Status", order.order_status],
                ["Order Date", formatDate(order.created_at)]
            ].forEach(([label, value]) => {
                const paragraph = document.createElement("p");

                const strong = document.createElement("strong");
                strong.textContent = `${label}: `;

                paragraph.append(
                    strong,
                    document.createTextNode(value || "Not provided")
                );

                customerInfo.appendChild(paragraph);
            });

            const productsHeading = document.createElement("h3");
            productsHeading.textContent = "Products Purchased";

            const productsList = document.createElement("div");
            productsList.className = "order-products-list";

            if (!order.items || !order.items.length) {
                const empty = document.createElement("p");
                empty.textContent =
                    "No product details found for this order.";

                productsList.appendChild(empty);

            } else {
                order.items.forEach(item => {
                    const productCard = document.createElement("div");
                    productCard.className = "order-product-item";

                    const image = document.createElement("img");

                    image.className = "order-item-image";
                    image.src = item.image_url || "";
                    image.alt = item.name || "Purchased product";
                    image.loading = "lazy";

                    image.onerror = () => {
                        image.style.display = "none";
                    };

                    const productInfo = document.createElement("div");
                    productInfo.className = "order-product-info";

                    const name = document.createElement("h4");
                    name.textContent = item.name || "Unnamed product";

                    const quantity = document.createElement("p");
                    quantity.textContent =
                        `Quantity: ${Number(item.quantity) || 0}`;

                    const unitPrice = document.createElement("p");
                    unitPrice.textContent =
                        `Unit Price: ${formatMoney(item.unitPrice)}`;

                    const lineTotal = document.createElement("strong");
                    lineTotal.textContent =
                        `Total: ${formatMoney(item.lineTotal)}`;

                    productInfo.append(
                        name,
                        quantity,
                        unitPrice,
                        lineTotal
                    );

                    productCard.append(image, productInfo);
                    productsList.appendChild(productCard);
                });
            }

            const total = document.createElement("p");
            total.className = "order-details-total";

            const totalLabel = document.createElement("strong");
            totalLabel.textContent =
                `Order Total: ${formatMoney(order.total_amount)}`;

            total.appendChild(totalLabel);

            detailsContainer.append(
                customerHeading,
                customerInfo,
                productsHeading,
                productsList,
                total
            );

            detailsCell.appendChild(detailsContainer);
            detailsRow.appendChild(detailsCell);

            ordersTableBody.appendChild(detailsRow);
        });
    }

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

            row.appendChild(createCell(formatDate(order.created_at)));
            row.appendChild(createCell(formatMoney(order.total_amount)));

            const statusCell = document.createElement("td");
            statusCell.appendChild(
                createStatusBadge(order.order_status)
            );

            row.appendChild(statusCell);
            recentOrdersBody.appendChild(row);
        });
    }

    searchOrders.addEventListener("input", renderOrders);
    orderStatusFilter.addEventListener("change", renderOrders);

    ordersTableBody.addEventListener("click", event => {
        const button = event.target.closest(
            'button[data-action="view-order"]'
        );

        if (!button) return;

        const orderId = button.dataset.id;

        const detailsRow = Array.from(
            ordersTableBody.querySelectorAll("[data-order-details]")
        ).find(row => row.dataset.orderDetails === orderId);

        if (!detailsRow) return;

        const isHidden = detailsRow.hidden;
        detailsRow.hidden = !isHidden;

        button.textContent = isHidden
            ? "Hide Products"
            : "View Products";
    });

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
                .update({ order_status: newStatus })
                .eq("id", orderId);

            if (error) throw error;

            const order = allOrders.find(item => item.id === orderId);

            if (order) order.order_status = newStatus;

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

        if (allProducts.some(product => product.id === selected)) {
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

            row.appendChild(
                createCell(
                    sale.product?.name || "Product unavailable"
                )
            );

            row.appendChild(
                createCell(`${sale.discount_percentage}%`)
            );

            row.appendChild(createCell(formatDate(sale.starts_at)));
            row.appendChild(createCell(formatDate(sale.ends_at)));

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

    addFlashSaleButton.addEventListener("click", () => {
        flashSaleForm.reset();

        hideMessage(
            document.getElementById("saleFormMessage")
        );

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

            showGlobalMessage(
                "Flash sale created successfully."
            );

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
            .update({ is_active: !sale.is_active })
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
       12. STORE CONTROL
       Table: store_settings
       BOOLEAN id = true
       Columns: is_open, closed_message, updated_at
    ========================================================= */

    function renderStoreSettings() {
        const isOpen = storeSettings.is_open === true;

        // Display current store status
        if (storeStatusText) {
            storeStatusText.textContent =
                isOpen ? "STORE OPEN" : "STORE CLOSED";

            storeStatusText.className =
                isOpen ? "store-open" : "store-closed";
        }

        // Display status explanation
        if (storeStatusDescription) {
            storeStatusDescription.textContent = isOpen
                ? "Your store is currently open. Customers can browse products and place orders."
                : "Your store is currently closed. New payment initialization is blocked.";
        }

        // Display saved customer message
        if (storeClosedMessage) {
            storeClosedMessage.value =
                storeSettings.closed_message || "";
        }

        // Update toggle button
        if (toggleStoreButton) {
            toggleStoreButton.disabled = false;

            toggleStoreButton.textContent =
                isOpen ? "CLOSE STORE" : "OPEN STORE";

            toggleStoreButton.className =
                isOpen ? "danger-button" : "primary-button";
        }
    }


    // Load settings from Supabase
    async function loadStoreSettings() {
        if (!storeControlMessage) return;

        hideMessage(storeControlMessage);

        if (toggleStoreButton) {
            toggleStoreButton.disabled = true;
            toggleStoreButton.textContent = "Loading...";
        }

        try {
            const { data, error } = await supabase
                .from("store_settings")
                .select("id, is_open, closed_message, updated_at")
                .eq("id", true)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                throw new Error(
                    "Store settings record was not found. Check that the record with id = true exists in Supabase."
                );
            }

            storeSettings = {
                id: data.id,
                is_open: data.is_open === true,
                closed_message: data.closed_message || "",
                updated_at: data.updated_at
            };

            renderStoreSettings();

        } catch (error) {
            console.error("Store settings loading error:", error);

            if (storeStatusText) {
                storeStatusText.textContent = "STATUS UNAVAILABLE";
            }

            if (storeStatusDescription) {
                storeStatusDescription.textContent =
                    "The store status could not be verified. Please check your database connection.";
            }

            if (toggleStoreButton) {
                toggleStoreButton.disabled = true;
                toggleStoreButton.textContent = "Unavailable";
            }

            showMessage(
                storeControlMessage,
                "Unable to load store settings: " + error.message,
                "error"
            );
        }
    }


    // Save only the customer maintenance message
    if (saveStoreMessageButton) {
        saveStoreMessageButton.addEventListener("click", async () => {
            hideMessage(storeControlMessage);

            if (!currentAdmin) {
                showMessage(
                    storeControlMessage,
                    "Please sign in as an administrator.",
                    "error"
                );
                return;
            }

            const message = storeClosedMessage.value.trim();

            if (!message) {
                showMessage(
                    storeControlMessage,
                    "Please enter a maintenance message.",
                    "error"
                );
                return;
            }

            if (message.length > 500) {
                showMessage(
                    storeControlMessage,
                    "The maintenance message cannot exceed 500 characters.",
                    "error"
                );
                return;
            }

            setButtonLoading(
                saveStoreMessageButton,
                true,
                "Saving message..."
            );

            try {
                const { data, error } = await supabase
                    .from("store_settings")
                    .update({
                        closed_message: message,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", true)
                    .select("id, is_open, closed_message, updated_at")
                    .single();

                if (error) throw error;

                storeSettings = {
                    id: data.id,
                    is_open: data.is_open === true,
                    closed_message: data.closed_message || "",
                    updated_at: data.updated_at
                };

                renderStoreSettings();

                showMessage(
                    storeControlMessage,
                    "Customer maintenance message saved successfully.",
                    "success"
                );

            } catch (error) {
                console.error("Saving maintenance message:", error);

                showMessage(
                    storeControlMessage,
                    "Unable to save the message: " + error.message,
                    "error"
                );

            } finally {
                setButtonLoading(
                    saveStoreMessageButton,
                    false
                );
            }
        });
    }


    // Open or close the store
    if (toggleStoreButton) {
        toggleStoreButton.addEventListener("click", async () => {
            hideMessage(storeControlMessage);

            if (!currentAdmin) {
                showMessage(
                    storeControlMessage,
                    "Please sign in as an administrator.",
                    "error"
                );
                return;
            }

            const newStatus = !storeSettings.is_open;

            const confirmation = window.confirm(
                newStatus
                    ? "Are you sure you want to OPEN your online store? Customers will be able to place new orders."
                    : "Are you sure you want to CLOSE your online store? Customers will no longer be able to initialize new payments."
            );

            if (!confirmation) return;

            setButtonLoading(
                toggleStoreButton,
                true,
                "Updating store..."
            );

            try {
                const { data, error } = await supabase
                    .from("store_settings")
                    .update({
                        is_open: newStatus,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", true)
                    .select("id, is_open, closed_message, updated_at")
                    .single();

                if (error) throw error;

                storeSettings = {
                    id: data.id,
                    is_open: data.is_open === true,
                    closed_message: data.closed_message || "",
                    updated_at: data.updated_at
                };

                renderStoreSettings();

                const successMessage = storeSettings.is_open
                    ? "Your store is now OPEN. Customers can place new orders."
                    : "Your store is now CLOSED. New payment initialization is blocked.";

                showMessage(
                    storeControlMessage,
                    successMessage,
                    "success"
                );

                showGlobalMessage(successMessage);

            } catch (error) {
                console.error("Store status update error:", error);

                showMessage(
                    storeControlMessage,
                    "Unable to change store status: " + error.message,
                    "error"
                );

                await loadStoreSettings();

            } finally {
                setButtonLoading(
                    toggleStoreButton,
                    false
                );
            }
        });
    }


    /* =========================================================
       13. REFRESH BUTTONS
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
            setButtonLoading(
                refreshDashboardButton,
                false
            );
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
            setButtonLoading(
                refreshOrdersButton,
                false
            );
        }
    });


    /* =========================================================
       14. START APPLICATION
    ========================================================= */

    restoreAdminSession();

})();
```
