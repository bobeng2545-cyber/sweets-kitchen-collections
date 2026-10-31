
/* =========================================================
   SWEET'S KITCHEN & COLLECTIONS
   COMPLETE MAIN.JS
========================================================= */

/* 1. SUPABASE CONNECTION */

const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_jOGj9C6m_fFryLL8yrcQmw_5wyZoidy";

if (!window.supabase) {
    throw new Error("Supabase library is missing.");
}

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.sweetSupabase = supabaseClient;

/* 2. HELPERS */

const $ = id => document.getElementById(id);
const CART_STORAGE_KEY = "sweetKitchenCart";

const safeText = value => String(value ?? "").trim();

function getProductKey(name) {
    return safeText(name).toLowerCase();
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

/*
   IMAGE HELPER

   Accepts:
   1. Full image URLs.
   2. Local image paths.
   3. Supabase Storage file paths.
*/

function getProductImageUrl(imagePath, productName = "") {
    const path = safeText(imagePath);

    if (!path) {
        return getLocalProductImage(productName);
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    if (
        path.startsWith("./") ||
        path.startsWith("../") ||
        path.startsWith("/")
    ) {
        return path;
    }

    const cleanPath = path
        .replace(/^product-images\//, "")
        .replace(/^\/+/, "");

    const { data } = supabaseClient
        .storage
        .from("product-images")
        .getPublicUrl(cleanPath);

    return data?.publicUrl || getLocalProductImage(productName);
}

function getLocalProductImage(productName) {
    const images = {
        "heater": "./images/Heater.jpeg",
        "blender": "./images/Blender.jpeg",
        "air fryer": "./images/Airfryer.jpeg",
        "cutlery set": "./images/Cutlery Set.jpeg",
        "bowls": "./images/Bowls.jpeg"
    };

    return images[getProductKey(productName)] || "";
}

function setUnavailableImage(image) {
    image.onerror = null;

    image.src = "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg"
                 width="400" height="300">
                <rect width="100%" height="100%" fill="#eeeeee"/>
                <text x="50%" y="50%"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      font-family="Arial"
                      font-size="20"
                      fill="#777">
                    Image unavailable
                </text>
            </svg>
        `);
}

/* 3. MOBILE NAVIGATION */

const menuButton = $("menuButton");
const navMenu = $("nav");

if (menuButton && navMenu) {
    menuButton.addEventListener("click", () => {
        const opened = navMenu.classList.toggle("show");
        menuButton.setAttribute("aria-expanded", String(opened));
    });

    navMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("show");
            menuButton.setAttribute("aria-expanded", "false");
        });
    });
}

/* 4. SHOPPING CART */

let cart = [];

try {
    const saved = JSON.parse(
        localStorage.getItem(CART_STORAGE_KEY) || "[]"
    );

    if (Array.isArray(saved)) {
        cart = saved
            .filter(item =>
                item &&
                typeof item.name === "string" &&
                Number.isFinite(Number(item.price)) &&
                Number(item.quantity) > 0
            )
            .map(item => ({
                name: item.name,
                price: Number(item.price),
                quantity: Math.max(1, Number(item.quantity))
            }));
    }
} catch (error) {
    console.error("Cart restoration error:", error);
}

const cartOverlay = $("cartOverlay");
const cartItem = $("cartItem");
const cartTotal = $("cartTotal");
const cartCount = $("cartCount");
const cartButton = $("cartButton");
const closeCartButton = $("closeCart");
const checkoutButton = $("checkoutButton");
const productsGrid = $("productsGrid");

function saveCart() {
    try {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );
    } catch (error) {
        console.error("Cart saving error:", error);
    }
}

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
closeCartButton?.addEventListener("click", closeCartWindow);

function updateProductCartButtons() {
    document.querySelectorAll(".add-to-cart").forEach(button => {
        const exists = cart.some(item =>
            getProductKey(item.name) ===
            getProductKey(button.dataset.name)
        );

        button.textContent = exists ? "Added to Cart" : "Add to Cart";
        button.disabled = false;
    });
}

function updateCart() {
    saveCart();

    if (!cartItem || !cartCount || !cartTotal) return;

    cartItem.replaceChildren();

    let total = 0;
    let count = 0;

    if (!cart.length) {
        const empty = document.createElement("p");
        empty.className = "empty-cart";
        empty.textContent = "Your cart is empty.";
        cartItem.appendChild(empty);
    }

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        count += item.quantity;

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

    cartCount.textContent = String(count);
    cartTotal.textContent = formatStoreMoney(total);

    updateProductCartButtons();
}

document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest(".add-to-cart");
    if (!button) return;

    event.preventDefault();

    const name = safeText(button.dataset.name);
    const price = Number(button.dataset.price);

    if (!name || !Number.isFinite(price) || price < 0) {
        showMessage("Invalid product information.");
        return;
    }

    const existing = cart.find(item =>
        getProductKey(item.name) === getProductKey(name)
    );

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ name, price, quantity: 1 });
    }

    updateCart();
    showMessage(name + " added to your cart.");
});

cartItem?.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest(
        ".increase, .decrease, .remove-item"
    );

    if (!button) return;

    const index = Number(button.dataset.index);
    if (!cart[index]) return;

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

/* 5. SEARCH AND CATEGORIES */

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
    searchMessage.hidden = true;
    productsGrid.insertAdjacentElement("afterend", searchMessage);
}

function filterProducts() {
    if (!productsGrid) return;

    const term = safeText(searchInput?.value).toLowerCase();
    const cards = productsGrid.querySelectorAll(".product-card");

    let visibleCount = 0;

    cards.forEach(card => {
        const name = safeText(card.dataset.name).toLowerCase();

        const category = safeText(
            card.dataset.category ||
            card.querySelector(".products-category")?.textContent
        ).toLowerCase();

        const matchesSearch =
            name.includes(term) || category.includes(term);

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

/* 6. FLASH SALES AND PRODUCTS */

const flashSalesMap = new Map();
const originalProductPrices = new Map();

let productsRealtimeChannel = null;
let flashSalesRealtimeChannel = null;

function getCurrentFlashSale(name) {
    const sale = flashSalesMap.get(getProductKey(name));

    if (!sale || sale.is_active !== true) return null;

    const start = new Date(sale.starts_at).getTime();
    const end = new Date(sale.ends_at).getTime();
    const now = Date.now();

    if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        now < start ||
        now >= end
    ) return null;

    return sale;
}

function getDiscountedPrice(price, percentage) {
    return Math.round(
        price * (1 - percentage / 100) * 100
    ) / 100;
}

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
    image.src = getProductImageUrl(
        product.image_url,
        product.product_name
    );
    image.alt = safeText(product.product_name);
    image.loading = "lazy";

    image.onerror = function () {
        if (this.dataset.localFallback !== "used") {
            this.dataset.localFallback = "used";

            const localImage = getLocalProductImage(
                product.product_name
            );

            if (localImage && this.src !== new URL(
                localImage, window.location.href
            ).href) {
                this.src = localImage;
                return;
            }
        }

        setUnavailableImage(this);
    };

    const favourite = document.createElement("button");
    favourite.type = "button";
    favourite.className = "favourite-button";
    favourite.textContent = "♡";
    favourite.setAttribute(
        "aria-label",
        "Favourite " + product.product_name
    );

    favourite.addEventListener("click", () => {
        favourite.classList.toggle("active");
        favourite.textContent =
            favourite.classList.contains("active") ? "♥" : "♡";
    });

    imageContainer.append(image, favourite);

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

function updateProductSaleDisplay(card, basePrice) {
    const name = card.dataset.name;
    const priceElement = card.querySelector(".product-bottom > strong");
    const addButton = card.querySelector(".add-to-cart");

    if (!name || !Number.isFinite(basePrice)) return;

    const sale = getCurrentFlashSale(name);
    let displayedPrice = basePrice;

    if (sale) {
        const discount = Number(sale.discount_percentage);

        if (
            !Number.isFinite(discount) ||
            discount <= 0 ||
            discount >= 100
        ) return;

        displayedPrice = getDiscountedPrice(basePrice, discount);

        if (priceElement) {
            const oldPrice = document.createElement("del");
            oldPrice.textContent = formatStoreMoney(basePrice);

            const newPrice = document.createElement("span");
            newPrice.className = "flash-sale-new-price";
            newPrice.textContent = formatStoreMoney(displayedPrice);

            priceElement.replaceChildren(oldPrice, newPrice);
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

function refreshFlashSaleDisplays() {
    if (!productsGrid) return;

    productsGrid.querySelectorAll(".product-card").forEach(card => {
        const price = originalProductPrices.get(
            getProductKey(card.dataset.name)
        );

        if (Number.isFinite(price)) {
            updateProductSaleDisplay(card, price);
        }
    });
}

function renderStoreProducts(products) {
    if (!productsGrid) return;

    // Preserve the HTML products if Supabase has no active products.
    if (!products || products.length === 0) {
        console.warn("No active Supabase products. Showing HTML products.");
        refreshFlashSaleDisplays();
        filterProducts();
        updateProductCartButtons();
        return;
    }

    productsGrid.replaceChildren();
    originalProductPrices.clear();

    const fragment = document.createDocumentFragment();

    products.forEach(product => {
        const price = Number(product.unit_price);

        if (
            !product.product_name ||
            !Number.isFinite(price) ||
            price < 0
        ) return;

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

async function loadLiveStoreProducts() {
    if (!productsGrid) return;

    try {
        const { data, error } = await supabaseClient
            .from("store_products")
            .select("product_name, category, unit_price, image_url, active")
            .eq("active", true)
            .order("product_name", { ascending: true });

        if (error) throw error;

        renderStoreProducts(data || []);

        console.log("Products loaded:", data?.length || 0);
    } catch (error) {
        console.error("Product loading error:", error);
        console.warn("Keeping existing HTML products visible.");
        filterProducts();
    }
}

async function loadFlashSales() {
    try {
        const { data, error } = await supabaseClient
            .from("store_flash_sales")
            .select("product_name, discount_percentage, starts_at, ends_at, is_active");

        if (error) throw error;

        flashSalesMap.clear();

        (data || []).forEach(sale => {
            flashSalesMap.set(
                getProductKey(sale.product_name),
                sale
            );
        });

        refreshFlashSaleDisplays();
    } catch (error) {
        console.error("Flash sale loading error:", error);
    }
}

function startProductRealtime() {
    if (productsRealtimeChannel) {
        supabaseClient.removeChannel(productsRealtimeChannel);
    }

    productsRealtimeChannel = supabaseClient
        .channel("store-products-live-updates")
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "store_products"
        }, loadLiveStoreProducts)
        .subscribe();
}

function startFlashSalesRealtime() {
    if (flashSalesRealtimeChannel) {
        supabaseClient.removeChannel(flashSalesRealtimeChannel);
    }

    flashSalesRealtimeChannel = supabaseClient
        .channel("store-flash-sales-live-updates")
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "store_flash_sales"
        }, loadFlashSales)
        .subscribe();
}

/* 7. CUSTOMER PROFILE */

function setupCustomerProfile() {
    const profileButton = $("profileButton");
    const profileArea = $("profileArea");
    const profileMenu = $("profileMenu");
    const profileName = $("profileName");
    const profileNameDisplay = $("profileNameDisplay");
    const profileEmail = $("profileEmail");
    const accountLink = $("accountLink");
    const logoutButton = $("logoutButton");

    if (!profileButton || !profileArea || !profileMenu) return;

    function showSignedOut() {
        if (profileName) profileName.textContent = "Sign in";
        if (profileNameDisplay) profileNameDisplay.textContent = "My Account";
        if (profileEmail) profileEmail.textContent = "";
        if (accountLink) accountLink.hidden = false;
        if (logoutButton) logoutButton.hidden = true;
    }

    function showSignedIn(user) {
        const fullName = safeText(user.user_metadata?.full_name);

        const firstName =
            fullName.split(/\s+/)[0] ||
            user.email?.split("@")[0] ||
            "Customer";

        if (profileName) profileName.textContent = firstName;
        if (profileNameDisplay) profileNameDisplay.textContent = firstName;
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

            if (error || !data.user) showSignedOut();
            else showSignedIn(data.user);
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

        const open = profileMenu.hidden;
        profileMenu.hidden = !open;
        profileButton.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", event => {
        if (!profileArea.contains(event.target)) closeProfileMenu();
    });

    logoutButton?.addEventListener("click", async event => {
        event.preventDefault();
        event.stopPropagation();

        logoutButton.disabled = true;

        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            window.location.href = "./login.html";
        } catch (error) {
            console.error("Logout error:", error);
            showMessage("Unable to log out. Please try again.");
        } finally {
            logoutButton.disabled = false;
        }
    });

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (session?.user) showSignedIn(session.user);
        else {
            showSignedOut();
            closeProfileMenu();
        }
    });

    refreshProfile();
}

/* 8. PAYSTACK CHECKOUT */

function setupPaystackCheckout() {
    const paymentOverlay = $("paymentOverlay");
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

    if (!checkoutButton || !paymentOverlay || !confirmButton) {
        console.warn("Checkout elements are missing.");
        return;
    }

    function closePaymentWindow() {
        paymentOverlay.hidden = true;
        paymentOverlay.style.display = "none";
    }

    checkoutButton.addEventListener("click", async event => {
        event.preventDefault();

        if (!cart.length) {
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
                paymentReference.textContent = "Generated securely at checkout.";
            }

            paymentNetwork.value = "";
            paymentOverlay.hidden = false;
            paymentOverlay.style.display = "flex";
        } catch (error) {
            console.error("Checkout opening error:", error);
            showMessage("Unable to open checkout.");
        }
    });

    confirmButton.addEventListener("click", async event => {
        event.preventDefault();

        if (
            !customerEmail?.value.trim() ||
            !customerEmail.checkValidity() ||
            !customerName?.value.trim() ||
            !customerPhone?.value.trim() ||
            !deliveryRegion?.value ||
            !deliveryTown?.value.trim() ||
            !deliveryAddress?.value.trim()
        ) {
            showMessage("Complete all required delivery details.");
            return;
        }

        const network = paymentNetwork.value;

        if (!["mtn", "telecel", "at"].includes(network)) {
            showMessage("Choose your Mobile Money network.");
            return;
        }

        if (!cart.length) {
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
                deliveryRegion: deliveryRegion.value,
                deliveryTown: deliveryTown.value.trim(),
                ghanaPostAddress: ghanaPostAddress?.value.trim() || "",
                deliveryInstructions: deliveryInstructions?.value.trim() || "",
                network,
                items: cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity
                }))
            };

            const { data, error } =
                await supabaseClient.functions.invoke(
                    "initialize-paystack",
                    { body: checkoutBody }
                );

            if (error) throw error;

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

    $("closePayment")?.addEventListener("click", closePaymentWindow);
    $("closePaymentBottom")?.addEventListener("click", closePaymentWindow);

    closePaymentWindow();
}

/* VERIFY PAYMENT AFTER RETURN */

async function verifyPaymentOnReturn() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("payment") !== "return") return;

    const reference = params.get("reference") || params.get("trxref");

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
                data?.message || data?.error || "Payment is not confirmed."
            );
            return;
        }

        cart = [];
        localStorage.removeItem(CART_STORAGE_KEY);
        updateCart();

        showMessage("Payment verified successfully!");

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );
    } catch (error) {
        console.error("Payment verification error:", error);
        showMessage(error.message || "Payment verification failed.");
    }
}

/* 9. MY ORDERS */

function formatOrderDateTime(value) {
    const date = new Date(value);

    if (!value || Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-GH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Accra"
    }).format(date);
}

async function loadMyOrders(targetOrderId = null) {
    const list = $("myOrdersList");
    const message = $("ordersMessage");
    const refreshButton = $("refreshOrdersBtn");

    if (!list) return;

    list.replaceChildren();

    if (message) message.textContent = "Loading your orders...";
    if (refreshButton) refreshButton.disabled = true;

    try {
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
            if (message) message.textContent = "Please sign in to view your orders.";
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
                created_at
            `)
            .eq("user_id", userData.user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!orders?.length) {
            if (message) message.textContent = "You have not placed any orders yet.";
            return;
        }

        if (message) message.textContent = orders.length + " order(s) found.";

        let targetFound = false;

        orders.forEach(order => {
            const card = document.createElement("article");
            card.className = "order-card";
            card.id = "order-card-" + order.id;

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
            reference.textContent = order.order_reference || String(order.id);

            referenceBlock.append(label, reference);

            const status = document.createElement("span");
            status.className = "order-status";
            status.textContent = order.order_status || "Pending";

            const statusKey = safeText(order.order_status).toLowerCase();

            status.classList.add(
                ["completed", "delivered", "fulfilled"].includes(statusKey)
                    ? "status-success"
                    : ["cancelled", "canceled", "failed"].includes(statusKey)
                        ? "status-danger"
                        : "status-pending"
            );

            header.append(referenceBlock, status);

            const totalBlock = document.createElement("div");
            const totalLabel = document.createElement("p");
            totalLabel.textContent = "ORDER TOTAL";

            const total = document.createElement("strong");
            total.textContent = formatStoreMoney(order.total_amount);

            totalBlock.append(totalLabel, total);

            const details = document.createElement("div");
            details.className = "order-details";

            function addDetail(title, value) {
                const row = document.createElement("div");
                row.className = "order-detail-row";

                const left = document.createElement("span");
                left.className = "order-detail-label";
                left.textContent = title;

                const right = document.createElement("span");
                right.className = "order-detail-value";
                right.textContent = value;

                row.append(left, right);
                details.appendChild(row);
            }

            addDetail("Order date", formatOrderDateTime(order.created_at));
            addDetail("Payment status", order.payment_status || "Unknown");
            addDetail("Payment network", order.payment_network || "Not specified");
            addDetail("Subtotal", formatStoreMoney(order.subtotal));
            addDetail("Service charge", formatStoreMoney(order.service_charge));

            card.append(header, totalBlock, details);
            list.appendChild(card);
        });

        if (targetOrderId !== null && targetFound) {
            $("order-card-" + targetOrderId)?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    } catch (error) {
        console.error("My Orders error:", error);
        if (message) message.textContent = "Unable to load orders. Please try again.";
    } finally {
        if (refreshButton) refreshButton.disabled = false;
    }
}

$("refreshOrdersBtn")?.addEventListener("click", () => loadMyOrders());

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

    if ($("profileMenu")) $("profileMenu").hidden = true;

    $("profileButton")?.setAttribute("aria-expanded", "false");

    section.scrollIntoView({ behavior: "smooth", block: "start" });

    await loadMyOrders();
});

/* 10. DARK AND LIGHT MODE */

const themeToggle = $("themeToggle");
const themeIcon = $("themeIcon");

function setTheme(theme) {
    const dark = theme === "dark";

    document.body.classList.toggle("dark-mode", dark);

    if (themeIcon) {
        themeIcon.textContent = dark ? "light_mode" : "dark_mode";
    }

    themeToggle?.setAttribute(
        "aria-label",
        dark ? "Switch to light mode" : "Switch to dark mode"
    );

    try {
        localStorage.setItem("sweetKitchenTheme", theme);
    } catch (_) {}
}

if (themeToggle) {
    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem("sweetKitchenTheme") || "light";
    } catch (_) {}

    setTheme(savedTheme);

    themeToggle.addEventListener("click", () => {
        setTheme(
            document.body.classList.contains("dark-mode")
                ? "light"
                : "dark"
        );
    });
}

/* 11. NOTIFICATIONS */

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

    const open = notificationMenu.hidden;
    notificationMenu.hidden = !open;

    notificationButton.setAttribute("aria-expanded", String(open));
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
    const unread = notifications.filter(item => !item.is_read).length;

    if (notificationCount) {
        notificationCount.textContent = unread > 99 ? "99+" : String(unread);
        notificationCount.hidden = unread === 0;
    }

    notificationButton?.classList.toggle("has-unread", unread > 0);
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

        const title = document.createElement("strong");
        title.textContent = notification.title || "Order update";

        const message = document.createElement("p");
        message.textContent = notification.message || "Your order has been updated.";

        const date = document.createElement("small");
        date.textContent = notification.created_at
            ? new Date(notification.created_at).toLocaleString("en-GH", {
                timeZone: "Africa/Accra"
            })
            : "";

        item.append(title, message, date);

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

                notificationMenu.hidden = true;
                notificationButton?.setAttribute("aria-expanded", "false");

                if (notification.order_id) {
                    const section = $("myOrders");

                    if (section) {
                        section.hidden = false;
                        section.style.display = "block";
                        section.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                        await loadMyOrders(notification.order_id);
                    }
                }

                await loadNotifications();
            } catch (error) {
                console.error("Notification error:", error);
                showMessage("Unable to open notification.");
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
    }

    notificationChannel = supabaseClient
        .channel("customer-notifications-" + notificationUserId)
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: "user_id=eq." + notificationUserId
        }, loadNotifications)
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

/* 12. INITIALIZE WEBSITE */

async function initializeSweetKitchen() {
    console.log("Starting SWEET'S KITCHEN & COLLECTIONS...");

    // Display existing HTML products immediately.
    filterProducts();
    updateCart();

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

    console.log("SWEET'S KITCHEN & COLLECTIONS is ready.");
}

/* UPDATE FLASH SALES PERIODICALLY */

setInterval(refreshFlashSaleDisplays, 15000);

/* START WEBSITE */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeSweetKitchen,
        { once: true }
    );
} else {
    initializeSweetKitchen();
}
