/* =========================================================
   SWEET'S KITCHEN & COLLECTIONS
   COMPLETE MAIN.JS
   Supabase + Products + Cart + Search + Flash Sales
   Profile + Paystack + Orders + Theme + Notifications
========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_jOGj9C6m_fFryLL8yrcQmw_5wyZoidy";

if (!window.supabase) {
    throw new Error(
        "Supabase library is missing. Load Supabase before main.js."
    );
}

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.sweetSupabase = supabaseClient;


/* =========================================================
   2. COMMON HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const CART_STORAGE_KEY = "sweetKitchenCart";

function getProductKey(name) {
    return String(name || "").trim().toLowerCase();
}

function formatStoreMoney(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value)) return "GH₵0.00";

    return "GH₵" + value.toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showMessage(message) {
    alert(message);
}

function safeText(value) {
    return String(value ?? "").trim();
}

function saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error("Cart could not be saved:", error);
    }
}


/* =========================================================
   3. MOBILE NAVIGATION
========================================================= */

const menuButton = $("menuButton");
const navMenu = $("nav");

if (menuButton && navMenu) {
    menuButton.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("show");

        menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("show");
            menuButton.setAttribute("aria-expanded", "false");
        });
    });
}


/* =========================================================
   4. SHOPPING CART
========================================================= */

let cart = [];

try {
    const savedCart = JSON.parse(
        localStorage.getItem(CART_STORAGE_KEY) || "[]"
    );

    if (Array.isArray(savedCart)) {
        cart = savedCart
            .filter(item =>
                item &&
                typeof item.name === "string" &&
                Number.isFinite(Number(item.price)) &&
                Number.isInteger(Number(item.quantity)) &&
                Number(item.quantity) > 0
            )
            .map(item => ({
                name: item.name,
                price: Number(item.price),
                quantity: Number(item.quantity)
            }));
    }
} catch (error) {
    console.error("Could not restore cart:", error);
}

const cartOverlay = $("cartOverlay");
const cartItem = $("cartItem");
const cartTotal = $("cartTotal");
const cartCount = $("cartCount");
const cartButton = $("cartButton");
const closeCart = $("closeCart");
const checkoutButton = $("checkoutButton");
const productsGrid = $("productsGrid");


function openCart() {
    if (!cartOverlay) return;

    cartOverlay.hidden = false;
    cartOverlay.classList.add("show");
}

function closeCartWindow() {
    if (!cartOverlay) return;

    cartOverlay.classList.remove("show");
    cartOverlay.hidden = true;
}

cartButton?.addEventListener("click", openCart);
closeCart?.addEventListener("click", closeCartWindow);


function updateProductCartButtons() {
    if (!productsGrid) return;

    productsGrid.querySelectorAll(".add-to-cart").forEach(button => {
        const alreadyAdded = cart.some(item =>
            getProductKey(item.name) ===
            getProductKey(button.dataset.name)
        );

        button.textContent = alreadyAdded
            ? "Added to Cart"
            : "Add to Cart";

        button.disabled = alreadyAdded;
    });
}


function updateCart() {
    saveCart();

    if (!cartItem || !cartCount || !cartTotal) {
        console.warn("Some cart HTML elements are missing.");
        updateProductCartButtons();
        return;
    }

    cartItem.replaceChildren();

    let total = 0;
    let itemCount = 0;

    if (cart.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-cart";
        emptyMessage.textContent = "Your cart is empty.";

        cartItem.appendChild(emptyMessage);
    }

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        itemCount += item.quantity;

        const wrapper = document.createElement("div");
        wrapper.className = "cart-item";

        const info = document.createElement("div");
        info.className = "cart-item-info";

        const name = document.createElement("h3");
        name.textContent = item.name;

        const price = document.createElement("p");
        price.textContent = formatStoreMoney(item.price);

        info.append(name, price);

        const controls = document.createElement("div");
        controls.className = "quantity-controls";

        const decrease = document.createElement("button");
        decrease.type = "button";
        decrease.className = "decrease";
        decrease.dataset.index = index;
        decrease.textContent = "−";

        const quantity = document.createElement("span");
        quantity.textContent = String(item.quantity);

        const increase = document.createElement("button");
        increase.type = "button";
        increase.className = "increase";
        increase.dataset.index = index;
        increase.textContent = "+";

        controls.append(decrease, quantity, increase);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-item";
        remove.dataset.index = index;
        remove.textContent = "Remove";

        wrapper.append(info, controls, remove);
        cartItem.appendChild(wrapper);
    });

    cartCount.textContent = String(itemCount);
    cartTotal.textContent = formatStoreMoney(total);

    updateProductCartButtons();
}


/* ADD PRODUCTS TO CART */

document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest(".add-to-cart");

    if (!button) return;

    event.preventDefault();

    const name = safeText(button.dataset.name);
    const price = Number(button.dataset.price);

    if (!name || !Number.isFinite(price) || price < 0) {
        showMessage("This product has invalid information.");
        return;
    }

    const existing = cart.find(item =>
        getProductKey(item.name) === getProductKey(name)
    );

    if (existing) {
        showMessage("This product is already in your cart.");
        return;
    }

    cart.push({
        name,
        price,
        quantity: 1
    });

    updateCart();
    showMessage(name + " has been added to your cart.");
});


/* CHANGE QUANTITY OR REMOVE PRODUCTS */

cartItem?.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest(
        ".increase, .decrease, .remove-item"
    );

    if (!button) return;

    const index = Number(button.dataset.index);

    if (!Number.isInteger(index) || !cart[index]) return;

    if (button.classList.contains("increase")) {
        cart[index].quantity++;
    }

    if (button.classList.contains("decrease")) {
        cart[index].quantity--;

        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
    }

    if (button.classList.contains("remove-item")) {
        cart.splice(index, 1);
    }

    updateCart();
});

updateCart();


/* =========================================================
   5. SEARCH AND CATEGORY FILTERING
========================================================= */

const searchInput = $("searchInput");
const searchButton = $("searchButton");
const categoryButtons = document.querySelectorAll(".category-btn");
const productSection = $("products");

let selectedCategory = "all";

let searchMessage = $("searchMessage");

if (productsGrid && !searchMessage) {
    searchMessage = document.createElement("p");
    searchMessage.id = "searchMessage";
    searchMessage.textContent = "No matching products found.";
    searchMessage.style.textAlign = "center";
    searchMessage.style.padding = "20px";
    searchMessage.hidden = true;

    productsGrid.insertAdjacentElement("afterend", searchMessage);
}


function filterProducts() {
    if (!productsGrid) return;

    const searchTerm = safeText(searchInput?.value).toLowerCase();

    const cards = productsGrid.querySelectorAll(".product-card");

    let visibleCount = 0;

    cards.forEach(card => {
        const name = safeText(
            card.dataset.name ||
            card.querySelector("h3")?.textContent
        ).toLowerCase();

        const category = safeText(
            card.dataset.category ||
            card.querySelector(".products-category")?.textContent
        ).toLowerCase();

        const matchesSearch =
            name.includes(searchTerm) ||
            category.includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;

        const visible = matchesSearch && matchesCategory;

        card.hidden = !visible;
        card.style.display = visible ? "" : "none";

        if (visible) visibleCount++;
    });

    if (searchMessage) {
        searchMessage.hidden = visibleCount > 0;
    }
}


function scrollToProducts() {
    productSection?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

searchInput?.addEventListener("input", filterProducts);

searchInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        filterProducts();
        scrollToProducts();
    }
});

searchButton?.addEventListener("click", () => {
    filterProducts();
    scrollToProducts();
});

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedCategory = safeText(
            button.dataset.category || "all"
        ).toLowerCase();

        categoryButtons.forEach(item =>
            item.classList.remove("active")
        );

        button.classList.add("active");

        filterProducts();
        scrollToProducts();
    });
});


/* =========================================================
   6. SUPABASE PRODUCTS AND FLASH SALES
========================================================= */

const flashSalesMap = new Map();
const originalProductPrices = new Map();

let productsRealtimeChannel = null;
let flashSalesRealtimeChannel = null;


function getCurrentFlashSale(productName) {
    const sale = flashSalesMap.get(getProductKey(productName));

    if (!sale || sale.is_active !== true) return null;

    const start = new Date(sale.starts_at).getTime();
    const end = new Date(sale.ends_at).getTime();
    const now = Date.now();

    if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        now < start ||
        now >= end
    ) {
        return null;
    }

    return sale;
}


function getDiscountedPrice(price, percentage) {
    return Math.round(
        (price * (1 - percentage / 100) + Number.EPSILON) * 100
    ) / 100;
}


/* CREATE PRODUCT CARD */

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    card.dataset.name = safeText(product.product_name);
    card.dataset.category = safeText(
        product.category || "general"
    ).toLowerCase();

    const imageContainer = document.createElement("div");
    imageContainer.className = "product-image";

    const image = document.createElement("img");

    image.src = getProductImageUrl(product.image_url);
    image.alt = safeText(product.product_name);
    image.loading = "lazy";

    image.onerror = function () {
        this.onerror = null;
        this.src = "./images/product-placeholder.png";
    };

    const favouriteButton = document.createElement("button");
    favouriteButton.type = "button";
    favouriteButton.className = "favourite-button";
    favouriteButton.textContent = "♡";
    favouriteButton.setAttribute(
        "aria-label",
        "Favourite " + product.product_name
    );

    favouriteButton.addEventListener("click", () => {
        favouriteButton.classList.toggle("active");

        favouriteButton.textContent =
            favouriteButton.classList.contains("active")
                ? "♥"
                : "♡";
    });

    imageContainer.append(image, favouriteButton);

    const info = document.createElement("div");
    info.className = "product-info";

    const category = document.createElement("p");
    category.className = "products-category";
    category.textContent = product.category || "General";

    const name = document.createElement("h3");
    name.textContent = product.product_name;

    info.append(category, name);

    const bottom = document.createElement("div");
    bottom.className = "product-bottom";

    const price = document.createElement("strong");
    price.textContent = formatStoreMoney(product.unit_price);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-to-cart";
    addButton.dataset.name = product.product_name;
    addButton.dataset.price = String(product.unit_price);
    addButton.textContent = "Add to Cart";

    bottom.append(price, addButton);

    card.append(imageContainer, info, bottom);

    return card;
}


/* UPDATE FLASH SALE DISPLAY */

function updateProductSaleDisplay(card, basePrice) {
    const productName = safeText(card.dataset.name);
    const priceElement = card.querySelector(".product-bottom > strong");
    const addButton = card.querySelector(".add-to-cart");

    if (!productName || !Number.isFinite(basePrice)) return;

    const sale = getCurrentFlashSale(productName);

    let displayedPrice = basePrice;

    if (sale) {
        const discount = Number(sale.discount_percentage);

        if (
            !Number.isFinite(discount) ||
            discount <= 0 ||
            discount >= 100
        ) {
            return;
        }

        displayedPrice = getDiscountedPrice(basePrice, discount);

        if (priceElement) {
            const oldPrice = document.createElement("del");
            oldPrice.textContent = formatStoreMoney(basePrice);

            const newPrice = document.createElement("span");
            newPrice.className = "flash-sale-new-price";
            newPrice.textContent = formatStoreMoney(displayedPrice);

            priceElement.replaceChildren(
                oldPrice,
                document.createTextNode(" "),
                newPrice
            );
        }

        let badge = card.querySelector(".flash-sale-badge");

        if (!badge) {
            badge = document.createElement("span");
            badge.className = "flash-sale-badge";
            card.appendChild(badge);
        }

        badge.textContent = "FLASH SALE -" + discount + "%";

    } else {
        if (priceElement) {
            priceElement.textContent = formatStoreMoney(basePrice);
        }

        card.querySelector(".flash-sale-badge")?.remove();
    }

    if (addButton) {
        addButton.dataset.price = String(displayedPrice);
    }
}


/* REFRESH FLASH SALES */

function refreshFlashSaleDisplays() {
    if (!productsGrid) return;

    productsGrid.querySelectorAll(".product-card").forEach(card => {
        const name = card.dataset.name;
        const basePrice = originalProductPrices.get(getProductKey(name));

        if (Number.isFinite(basePrice)) {
            updateProductSaleDisplay(card, basePrice);
        }
    });
}


/* RENDER PRODUCTS */

function renderStoreProducts(products) {
    if (!productsGrid) return;

    productsGrid.replaceChildren();
    originalProductPrices.clear();

    if (!products || products.length === 0) {
        const message = document.createElement("p");
        message.className = "products-empty";
        message.textContent = "No products are currently available.";

        productsGrid.appendChild(message);

        if (searchMessage) searchMessage.hidden = true;

        return;
    }

    const fragment = document.createDocumentFragment();

    products.forEach(product => {
        const price = Number(product.unit_price);

        if (
            !product.product_name ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            console.warn("Invalid product skipped:", product);
            return;
        }

        originalProductPrices.set(
            getProductKey(product.product_name),
            price
        );

        fragment.appendChild(createProductCard(product));
    });

    productsGrid.appendChild(fragment);

    refreshFlashSaleDisplays();
    filterProducts();
    updateProductCartButtons();
}


/* LOAD PRODUCTS */

async function loadLiveStoreProducts() {
    if (!productsGrid) return;

    productsGrid.setAttribute("aria-busy", "true");

    productsGrid.innerHTML =
        '<p class="products-loading">Loading products...</p>';

    try {
        const { data, error } = await supabaseClient
            .from("store_products")
            .select(
                "product_name, category, unit_price, image_url, active"
            )
            .eq("active", true)
            .order("product_name", { ascending: true });

        if (error) throw error;

        renderStoreProducts(data || []);

        console.log("Products loaded:", data?.length || 0);

    } catch (error) {
        console.error("Product loading error:", error);

        productsGrid.innerHTML =
            '<p class="products-error">Products could not be loaded. Please try again.</p>';

    } finally {
        productsGrid.setAttribute("aria-busy", "false");
    }
}


/* LOAD FLASH SALES */

async function loadFlashSales() {
    try {
        const { data, error } = await supabaseClient
            .from("store_flash_sales")
            .select(
                "product_name, discount_percentage, starts_at, ends_at, is_active"
            );

        if (error) throw error;

        flashSalesMap.clear();

        (data || []).forEach(sale => {
            flashSalesMap.set(
                getProductKey(sale.product_name),
                sale
            );
        });

        refreshFlashSaleDisplays();

        console.log("Flash sales loaded.");

    } catch (error) {
        console.error("Flash sale loading error:", error);
    }
}


/* START PRODUCT REALTIME */

function startProductRealtime() {
    if (productsRealtimeChannel) {
        supabaseClient.removeChannel(productsRealtimeChannel);
    }

    productsRealtimeChannel = supabaseClient
        .channel("store-products-live-updates")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "store_products"
            },
            () => loadLiveStoreProducts()
        )
        .subscribe();
}


/* START FLASH SALE REALTIME */

function startFlashSalesRealtime() {
    if (flashSalesRealtimeChannel) {
        supabaseClient.removeChannel(flashSalesRealtimeChannel);
    }

    flashSalesRealtimeChannel = supabaseClient
        .channel("store-flash-sales-live-updates")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "store_flash_sales"
            },
            () => loadFlashSales()
        )
        .subscribe();
}


/* =========================================================
   7. CUSTOMER PROFILE
========================================================= */

function setupCustomerProfile() {
    const profileButton = $("profileButton");
    const profileArea = $("profileArea");
    const profileMenu = $("profileMenu");
    const profileName = $("profileName");
    const profileNameDisplay = $("profileNameDisplay");
    const profileEmail = $("profileEmail");
    const accountLink = $("accountLink");
    const logoutButton = $("logoutButton");

    if (!profileButton || !profileArea || !profileMenu) {
        console.warn("Profile HTML elements are missing.");
        return;
    }

    function showSignedOut() {
        if (profileName) profileName.textContent = "Sign in";
        if (profileNameDisplay) {
            profileNameDisplay.textContent = "My Account";
        }
        if (profileEmail) profileEmail.textContent = "";

        if (accountLink) {
            accountLink.hidden = false;
            accountLink.href = "./account.html";
            accountLink.textContent = "My Account";
        }

        if (logoutButton) logoutButton.hidden = true;
    }

    function showSignedIn(user) {
        const fullName = safeText(user.user_metadata?.full_name);

        const firstName =
            fullName.split(/\s+/)[0] ||
            user.email?.split("@")[0] ||
            "Customer";

        if (profileName) profileName.textContent = firstName;
        if (profileNameDisplay) {
            profileNameDisplay.textContent = firstName;
        }
        if (profileEmail) profileEmail.textContent = user.email || "";

        if (accountLink) accountLink.hidden = true;
        if (logoutButton) logoutButton.hidden = false;
    }

    function closeProfileMenu() {
        profileMenu.hidden = true;
        profileButton.setAttribute("aria-expanded", "false");
    }

    async function refreshProfile() {
        try {
            const { data, error } = await supabaseClient.auth.getUser();

            if (error || !data.user) {
                showSignedOut();
            } else {
                showSignedIn(data.user);
            }
        } catch (error) {
            console.error("Profile loading error:", error);
            showSignedOut();
        }
    }

    profileButton.addEventListener("click", async event => {
        event.preventDefault();
        event.stopPropagation();

        const { data, error } = await supabaseClient.auth.getUser();

        if (error || !data.user) {
            window.location.href = "./login.html";
            return;
        }

        const shouldOpen = profileMenu.hidden;

        profileMenu.hidden = !shouldOpen;
        profileButton.setAttribute("aria-expanded", String(shouldOpen));
    });

    document.addEventListener("click", event => {
        if (!profileArea.contains(event.target)) {
            closeProfileMenu();
        }
    });

    logoutButton?.addEventListener("click", async event => {
        event.preventDefault();
        event.stopPropagation();

        logoutButton.disabled = true;

        try {
            const { error } = await supabaseClient.auth.signOut();

            if (error) throw error;

            closeProfileMenu();
            window.location.href = "./login.html";

        } catch (error) {
            console.error("Logout error:", error);
            showMessage("Unable to log out. Please try again.");

        } finally {
            logoutButton.disabled = false;
        }
    });

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            showSignedIn(session.user);
        } else {
            showSignedOut();
            closeProfileMenu();
        }
    });

    refreshProfile();
}


/* =========================================================
   8. PAYSTACK CHECKOUT
========================================================= */

function setupPaystackCheckout() {
    const paymentOverlay = $("paymentOverlay");
    const closePayment = $("closePayment");
    const closePaymentBottom = $("closePaymentBottom");

    const paymentNetwork = $("paymentNetwork");
    const paymentTotal = $("paymentTotal");
    const paymentReference = $("paymentReference");

    const customerEmail = $("customerEmail");
    const customerName = $("customerName");
    const customerPhone = $("customerPhone");

    const deliveryRegion = $("deliveryRegion");
    const deliveryTown = $("deliveryTown");
    const deliveryAddress = $("deliveryAddress");
    const ghanaPostAddress = $("ghanaPostAddress");
    const deliveryInstructions = $("deliveryInstructions");

    const confirmButton = $("confirmPaymentInstructions");

    if (
        !checkoutButton ||
        !paymentOverlay ||
        !paymentNetwork ||
        !paymentTotal ||
        !customerEmail ||
        !customerName ||
        !customerPhone ||
        !deliveryAddress ||
        !confirmButton
    ) {
        console.warn("Checkout HTML elements are missing.");
        return;
    }

    function closePaymentWindow() {
        paymentOverlay.hidden = true;
        paymentOverlay.style.display = "none";
    }

    checkoutButton.addEventListener("click", async event => {
        event.preventDefault();

        if (cart.length === 0) {
            showMessage("Your cart is empty.");
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.getUser();

            if (error || !data.user) {
                saveCart();
                window.location.href = "./login.html?redirect=checkout";
                return;
            }

            const subtotal = cart.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );

            const serviceCharge = subtotal * 0.01;
            const total = subtotal + serviceCharge;

            paymentTotal.textContent = formatStoreMoney(total);

            if (paymentReference) {
                paymentReference.textContent =
                    "Generated securely when checkout starts.";
            }

            paymentNetwork.value = "";

            paymentOverlay.hidden = false;
            paymentOverlay.style.display = "flex";

        } catch (error) {
            console.error("Checkout opening error:", error);
            showMessage("Unable to open checkout. Please try again.");
        }
    });

    confirmButton.addEventListener("click", async event => {
        event.preventDefault();

        if (
            !customerEmail.value.trim() ||
            !customerEmail.checkValidity() ||
            !customerName.value.trim() ||
            !customerPhone.value.trim() ||
            !deliveryAddress.value.trim()
        ) {
            showMessage(
                "Please complete your name, valid email, phone number and delivery address."
            );
            return;
        }

        const network = paymentNetwork.value;

        if (!["mtn", "telecel", "at"].includes(network)) {
            showMessage("Please select your Mobile Money network.");
            return;
        }

        if (cart.length === 0) {
            showMessage("Your cart is empty.");
            return;
        }

        const originalText = confirmButton.textContent;

        confirmButton.disabled = true;
        confirmButton.textContent = "Connecting to Paystack...";

        try {
            const checkoutBody = {
                action: "initialize",
                email: customerEmail.value.trim(),
                customerName: customerName.value.trim(),
                customerPhone: customerPhone.value.trim(),
                deliveryAddress: deliveryAddress.value.trim(),
                network,
                items: cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity
                }))
            };

            if (deliveryRegion) {
                checkoutBody.deliveryRegion = deliveryRegion.value.trim();
            }

            if (deliveryTown) {
                checkoutBody.deliveryTown = deliveryTown.value.trim();
            }

            if (ghanaPostAddress) {
                checkoutBody.ghanaPostAddress =
                    ghanaPostAddress.value.trim();
            }

            if (deliveryInstructions) {
                checkoutBody.deliveryInstructions =
                    deliveryInstructions.value.trim();
            }

            const { data, error } =
                await supabaseClient.functions.invoke(
                    "initialize-paystack",
                    { body: checkoutBody }
                );

            if (error) {
                console.error("Paystack function error:", error);

                if (error.context) {
                    try {
                        console.error(
                            "Server response:",
                            await error.context.clone().text()
                        );
                    } catch (_) {}
                }

                throw new Error("Payment connection failed.");
            }

            if (!data?.authorization_url) {
                throw new Error(
                    data?.error || "Paystack did not return a payment link."
                );
            }

            window.location.href = data.authorization_url;

        } catch (error) {
            console.error("Paystack checkout error:", error);

            showMessage(error.message || "Payment could not start.");

            confirmButton.disabled = false;
            confirmButton.textContent = originalText;
        }
    });

    closePayment?.addEventListener("click", closePaymentWindow);
    closePaymentBottom?.addEventListener("click", closePaymentWindow);

    closePaymentWindow();
}


/* VERIFY PAYMENT AFTER RETURN */

async function verifyPaymentOnReturn() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("payment") !== "return") return;

    const reference =
        params.get("reference") ||
        params.get("trxref");

    if (!reference) {
        showMessage("Payment reference is missing.");
        return;
    }

    try {
        const { data, error } =
            await supabaseClient.functions.invoke(
                "initialize-paystack",
                {
                    body: {
                        action: "verify",
                        reference
                    }
                }
            );

        if (error) throw error;

        if (data?.paid !== true) {
            showMessage(
                data?.message ||
                data?.error ||
                "Payment has not been confirmed."
            );
            return;
        }

        cart = [];
        localStorage.removeItem(CART_STORAGE_KEY);

        updateCart();

        showMessage(
            "Payment verified successfully! Your order has been paid."
        );

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    } catch (error) {
        console.error("Payment verification error:", error);

        showMessage(
            error.message || "Payment verification failed."
        );
    }
}


/* =========================================================
   9. MY ORDERS
========================================================= */

function formatOrderDateTime(dateValue) {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-GH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Africa/Accra"
    }).format(date);
}


async function loadMyOrders(targetOrderId = null) {
    const list = $("myOrdersList");
    const message = $("ordersMessage");
    const refreshButton = $("refreshOrdersBtn");

    if (!list) return;

    list.replaceChildren();

    if (message) {
        message.hidden = false;
        message.textContent = "Loading your orders...";
    }

    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";
    }

    try {
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
            if (message) {
                message.textContent =
                    "Please sign in to view your orders.";
            }
            return;
        }

        const { data: orders, error } = await supabaseClient
            .from("orders")
            .select(`
                id,
                order_reference,
                subtotal,
                service_charge,
                total_amount,
                payment_network,
                payment_status,
                order_status,
                user_id,
                created_at
            `)
            .eq("user_id", userData.user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            if (message) {
                message.textContent =
                    "You have not placed any orders yet.";
            }
            return;
        }

        if (message) {
            message.textContent = orders.length + " order(s) found.";
        }

        let targetFound = false;

        orders.forEach(order => {
            const card = document.createElement("article");
            card.className = "order-card";
            card.id = "order-card-" + String(order.id);

            if (
                targetOrderId !== null &&
                String(order.id) === String(targetOrderId)
            ) {
                card.classList.add("order-card-highlight");
                targetFound = true;
            }

            const header = document.createElement("div");
            header.className = "order-card-header";

            const referenceBlock = document.createElement("div");

            const label = document.createElement("p");
            label.textContent = "ORDER REFERENCE";

            const reference = document.createElement("h3");
            reference.textContent =
                order.order_reference || String(order.id);

            referenceBlock.append(label, reference);

            const status = document.createElement("span");
            status.className = "order-status";

            const statusText = safeText(order.order_status || "Pending");
            status.textContent = statusText;

            const statusKey = statusText.toLowerCase();

            if (
                ["completed", "delivered", "fulfilled"].includes(statusKey)
            ) {
                status.classList.add("status-success");
            } else if (
                ["cancelled", "canceled", "failed"].includes(statusKey)
            ) {
                status.classList.add("status-danger");
            } else {
                status.classList.add("status-pending");
            }

            header.append(referenceBlock, status);

            const totalBlock = document.createElement("div");

            const totalLabel = document.createElement("p");
            totalLabel.textContent = "ORDER TOTAL";

            const total = document.createElement("strong");
            total.textContent = formatStoreMoney(order.total_amount);

            totalBlock.append(totalLabel, total);

            const details = document.createElement("div");
            details.className = "order-details";

            function addDetail(labelText, valueText) {
                const row = document.createElement("div");
                row.className = "order-detail-row";

                const labelElement = document.createElement("span");
                labelElement.className = "order-detail-label";
                labelElement.textContent = labelText;

                const valueElement = document.createElement("span");
                valueElement.className = "order-detail-value";
                valueElement.textContent = valueText;

                row.append(labelElement, valueElement);
                details.appendChild(row);
            }

            addDetail(
                "Order date & time",
                formatOrderDateTime(order.created_at)
            );

            addDetail(
                "Payment status",
                order.payment_status || "Unknown"
            );

            addDetail(
                "Payment network",
                order.payment_network || "Not specified"
            );

            addDetail(
                "Subtotal",
                formatStoreMoney(order.subtotal)
            );

            addDetail(
                "Service charge",
                formatStoreMoney(order.service_charge)
            );

            card.append(header, totalBlock, details);
            list.appendChild(card);
        });

        if (targetOrderId !== null) {
            if (targetFound) {
                $("order-card-" + String(targetOrderId))
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
            } else if (message) {
                message.textContent =
                    "The order linked to this notification was not found.";
            }
        }

    } catch (error) {
        console.error("My Orders error:", error);

        if (message) {
            message.textContent =
                "Unable to load your orders. Please try again.";
        }

    } finally {
        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.textContent = "↻ Refresh Orders";
        }
    }
}


$("refreshOrdersBtn")?.addEventListener("click", () => {
    loadMyOrders();
});


$("myOrdersLink")?.addEventListener("click", async event => {
    event.preventDefault();

    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "./login.html";
        return;
    }

    const section = $("myOrders");

    if (!section) return;

    section.hidden = false;
    section.style.display = "block";

    $("profileMenu") && ($("profileMenu").hidden = true);

    $("profileButton")?.setAttribute("aria-expanded", "false");

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    await loadMyOrders();
});


/* =========================================================
   10. DARK AND LIGHT MODE
========================================================= */

const themeToggle = $("themeToggle");
const themeIcon = $("themeIcon");


function setTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-mode", isDark);

    if (themeIcon) {
        themeIcon.textContent = isDark ? "light_mode" : "dark_mode";
    }

    if (themeToggle) {
        themeToggle.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );
    }

    try {
        localStorage.setItem("sweetKitchenTheme", theme);
    } catch (error) {
        console.warn("Theme preference could not be saved.");
    }
}


if (themeToggle) {
    let savedTheme = "light";

    try {
        savedTheme =
            localStorage.getItem("sweetKitchenTheme") || "light";
    } catch (_) {}

    setTheme(savedTheme);

    themeToggle.addEventListener("click", () => {
        const isDark = document.body.classList.contains("dark-mode");

        setTheme(isDark ? "light" : "dark");
    });
}


/* =========================================================
   11. NOTIFICATIONS
========================================================= */

const notificationButton = $("notificationButton");
const notificationCount = $("notificationCount");
const notificationMenu = $("notificationMenu");
const notificationList = $("notificationList");
const markAllNotificationsRead = $("markAllNotificationsRead");

let notificationUserId = null;
let notificationChannel = null;


notificationButton?.addEventListener("click", event => {
    event.stopPropagation();

    if (!notificationMenu) return;

    const shouldOpen = notificationMenu.hidden;

    notificationMenu.hidden = !shouldOpen;

    notificationButton.setAttribute(
        "aria-expanded",
        String(shouldOpen)
    );
});


document.addEventListener("click", event => {
    if (
        notificationMenu &&
        notificationButton &&
        !notificationMenu.contains(event.target) &&
        !notificationButton.contains(event.target)
    ) {
        notificationMenu.hidden = true;

        notificationButton.setAttribute("aria-expanded", "false");
    }
});


function updateNotificationBadge(notifications) {
    const unreadCount = notifications.filter(
        item => !item.is_read
    ).length;

    if (notificationCount) {
        notificationCount.textContent =
            unreadCount > 99 ? "99+" : String(unreadCount);

        notificationCount.hidden = unreadCount === 0;
    }

    notificationButton?.classList.toggle(
        "has-unread",
        unreadCount > 0
    );
}


function displayNotifications(notifications) {
    if (!notificationList) return;

    notificationList.replaceChildren();

    if (!notifications.length) {
        const empty = document.createElement("p");
        empty.className = "notification-empty";
        empty.textContent = "You have no notifications.";

        notificationList.appendChild(empty);
        return;
    }

    notifications.forEach(notification => {
        const item = document.createElement("button");

        item.type = "button";
        item.className = notification.is_read
            ? "notification-item"
            : "notification-item unread";

        item.style.width = "100%";
        item.style.textAlign = "left";
        item.style.cursor = "pointer";
        item.style.border = "0";
        item.style.font = "inherit";

        const title = document.createElement("strong");
        title.textContent = notification.title || "Order update";

        const message = document.createElement("p");
        message.textContent =
            notification.message || "Your order has been updated.";

        const reference = document.createElement("small");
        reference.textContent = notification.order_id
            ? "Click to view related order"
            : "No linked order";

        const date = document.createElement("small");
        date.textContent = notification.created_at
            ? new Date(notification.created_at).toLocaleString(
                "en-GH",
                { timeZone: "Africa/Accra" }
            )
            : "";

        item.append(title, message, reference, date);

        item.addEventListener("click", async () => {
            if (!notificationUserId) return;

            item.disabled = true;

            try {
                if (!notification.is_read) {
                    const { error } = await supabaseClient
                        .from("notifications")
                        .update({ is_read: true })
                        .eq("id", notification.id)
                        .eq("user_id", notificationUserId);

                    if (error) throw error;
                }

                if (notificationMenu) {
                    notificationMenu.hidden = true;
                }

                notificationButton?.setAttribute(
                    "aria-expanded",
                    "false"
                );

                if (!notification.order_id) {
                    showMessage(
                        "This notification has no linked order."
                    );

                    await loadNotifications();
                    return;
                }

                const { data, error } =
                    await supabaseClient.auth.getUser();

                if (error || !data.user) {
                    window.location.href = "./login.html";
                    return;
                }

                const section = $("myOrders");

                if (!section) {
                    throw new Error("My Orders section was not found.");
                }

                section.hidden = false;
                section.style.display = "block";

                $("profileMenu") && ($("profileMenu").hidden = true);

                $("profileButton")?.setAttribute(
                    "aria-expanded",
                    "false"
                );

                section.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                await loadMyOrders(notification.order_id);
                await loadNotifications();

            } catch (error) {
                console.error("Notification error:", error);
                showMessage("Unable to open this order.");

            } finally {
                item.disabled = false;
            }
        });

        notificationList.appendChild(item);
    });
}


async function loadNotifications() {
    if (!notificationUserId) return;

    const { data, error } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq("user_id", notificationUserId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("Notification loading error:", error);
        return;
    }

    const notifications = data || [];

    updateNotificationBadge(notifications);
    displayNotifications(notifications);
}


markAllNotificationsRead?.addEventListener("click", async () => {
    if (!notificationUserId) return;

    markAllNotificationsRead.disabled = true;

    try {
        const { error } = await supabaseClient
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", notificationUserId)
            .eq("is_read", false);

        if (error) throw error;

        await loadNotifications();

    } catch (error) {
        console.error("Mark notifications read error:", error);
        showMessage("Unable to update notifications.");

    } finally {
        markAllNotificationsRead.disabled = false;
    }
});


async function startNotificationRealtime() {
    if (!notificationUserId) return;

    if (notificationChannel) {
        await supabaseClient.removeChannel(notificationChannel);
        notificationChannel = null;
    }

    notificationChannel = supabaseClient
        .channel("customer-notifications-" + notificationUserId)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "notifications",
                filter: "user_id=eq." + notificationUserId
            },
            () => loadNotifications()
        )
        .subscribe();
}


async function initializeNotifications() {
    try {
        const { data, error } = await supabaseClient.auth.getUser();

        if (error || !data.user) {
            notificationUserId = null;

            if (notificationChannel) {
                await supabaseClient.removeChannel(notificationChannel);
                notificationChannel = null;
            }

            updateNotificationBadge([]);
            displayNotifications([]);

            return;
        }

        notificationUserId = data.user.id;

        await loadNotifications();
        await startNotificationRealtime();

    } catch (error) {
        console.error("Notification initialization error:", error);
    }
}


/* =========================================================
   12. INITIALIZE WEBSITE
========================================================= */

async function initializeSweetKitchen() {
    console.log("Starting SWEET'S KITCHEN & COLLECTIONS...");

    await Promise.allSettled([
        loadLiveStoreProducts(),
        loadFlashSales()
    ]);

    startProductRealtime();
    startFlashSalesRealtime();

    setupCustomerProfile();
    setupPaystackCheckout();

    await verifyPaymentOnReturn();
    await initializeNotifications();

    console.log(
        "SWEET'S KITCHEN & COLLECTIONS is ready."
    );
}


/* REFRESH FLASH SALE DISPLAY PERIODICALLY */

setInterval(() => {
    refreshFlashSaleDisplays();
}, 15000);


/* START WHEN HTML IS READY */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeSweetKitchen,
        { once: true }
    );
} else {
    initializeSweetKitchen();
}
