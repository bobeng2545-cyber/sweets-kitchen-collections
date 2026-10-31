/* =========================================================
   SWEET'S KITCHEN & COLLECTIONS
   COMPLETE MAIN JAVASCRIPT
   Supabase + Live Product Prices + Cart + Search
   Profile + Paystack + My Orders + Theme + Notifications
========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_jOGj9C6m_fFryLL8yrcQmw_5wyZoidy";

if (!window.supabase) {
    throw new Error("Supabase library is missing. Check your HTML script imports.");
}

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.sweetSupabase = supabaseClient;


/* =========================================================
   2. MENU ICON
========================================================= */

const menuButton = document.getElementById("menuButton");
const navMenu = document.getElementById("nav");

if (menuButton && navMenu) {
    menuButton.addEventListener("click", function () {
        navMenu.classList.toggle("show");

        const isOpen = navMenu.classList.contains("show");

        menuButton.setAttribute("aria-expanded", String(isOpen));
    });
}


/* =========================================================
   3. SHOPPING CART
========================================================= */

let cart = [];

try {
    const savedCart = JSON.parse(
        localStorage.getItem("sweetKitchenCart") || "[]"
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

const cartOverlay = document.getElementById("cartOverlay");
const cartItem = document.getElementById("cartItem");
const checkoutButton = document.getElementById("checkoutButton");
const closeCart = document.getElementById("closeCart");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const cartButton = document.getElementById("cartButton");


/* OPEN CART */

if (cartButton && cartOverlay) {
    cartButton.addEventListener("click", function () {
        cartOverlay.classList.add("show");
    });
}


/* CLOSE CART */

if (closeCart && cartOverlay) {
    closeCart.addEventListener("click", function () {
        cartOverlay.classList.remove("show");
    });
}


/* UPDATE CART */

function updateCart() {
    try {
        localStorage.setItem(
            "sweetKitchenCart",
            JSON.stringify(cart)
        );
    } catch (error) {
        console.error("Could not save cart:", error);
    }

    if (!cartItem || !cartCount || !cartTotal) {
        console.error("One or more cart HTML elements are missing.");
        return;
    }

    cartItem.replaceChildren();

    if (cart.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-cart";
        emptyMessage.textContent = "Your cart is empty.";

        cartItem.appendChild(emptyMessage);

        cartCount.textContent = "0";
        cartTotal.textContent = "GH₵0";

        return;
    }

    let total = 0;
    let numberOfItems = 0;

    cart.forEach(function (item, index) {
        total += item.price * item.quantity;
        numberOfItems += item.quantity;

        const cartItemElement = document.createElement("div");
        cartItemElement.className = "cart-item";

        const info = document.createElement("div");
        info.className = "cart-item-info";

        const name = document.createElement("h3");
        name.textContent = item.name;

        const price = document.createElement("p");
        price.textContent = "GH₵" + item.price.toLocaleString();

        info.append(name, price);

        const controls = document.createElement("div");
        controls.className = "quantity-controls";

        const decrease = document.createElement("button");
        decrease.type = "button";
        decrease.className = "decrease";
        decrease.dataset.index = index;
        decrease.textContent = "−";
        decrease.setAttribute("aria-label", "Decrease quantity");

        const quantity = document.createElement("span");
        quantity.textContent = item.quantity;

        const increase = document.createElement("button");
        increase.type = "button";
        increase.className = "increase";
        increase.dataset.index = index;
        increase.textContent = "+";
        increase.setAttribute("aria-label", "Increase quantity");

        controls.append(decrease, quantity, increase);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-item";
        remove.dataset.index = index;
        remove.textContent = "Remove";

        cartItemElement.append(info, controls, remove);

        cartItem.appendChild(cartItemElement);
    });

    cartCount.textContent = String(numberOfItems);
    cartTotal.textContent = "GH₵" + total.toLocaleString();
}


/* ADD TO CART */

const addCartButtons = document.querySelectorAll(".add-to-cart");

addCartButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const name = button.dataset.name;
        const price = Number(button.dataset.price);

        if (!name || !Number.isFinite(price) || price < 0) {
            alert("This product has invalid information.");
            return;
        }

        const existingProduct = cart.find(
            item => item.name === name
        );

        if (existingProduct) {
            alert(
                "This product is already in your cart. Use + or − to change the quantity."
            );
            return;
        }

        cart.push({
            name: name,
            price: price,
            quantity: 1
        });

        updateCart();

        button.textContent = "Added to Cart";
        button.disabled = true;
    });
});


/* RESTORE PRODUCT BUTTON STATES */

document.querySelectorAll(".add-to-cart").forEach(function (button) {
    const alreadyAdded = cart.some(
        item => item.name === button.dataset.name
    );

    if (alreadyAdded) {
        button.textContent = "Added to Cart";
        button.disabled = true;
    }
});


/* HANDLE CART QUANTITY AND REMOVE BUTTONS */

if (cartItem) {
    cartItem.addEventListener("click", function (event) {
        const button = event.target.closest(
            ".increase, .decrease, .remove-item"
        );

        if (!button || !cartItem.contains(button)) {
            return;
        }

        const index = Number(button.dataset.index);

        if (!Number.isInteger(index) || !cart[index]) {
            return;
        }

        if (button.classList.contains("increase")) {
            cart[index].quantity++;
        }

        else if (button.classList.contains("decrease")) {
            cart[index].quantity--;

            if (cart[index].quantity <= 0) {
                const removedName = cart[index].name;

                cart.splice(index, 1);

                document.querySelectorAll(".add-to-cart").forEach(
                    function (addButton) {
                        if (addButton.dataset.name === removedName) {
                            addButton.disabled = false;
                            addButton.textContent = "Add to Cart";
                        }
                    }
                );
            }
        }

        else if (button.classList.contains("remove-item")) {
            const removedName = cart[index].name;

            cart.splice(index, 1);

            document.querySelectorAll(".add-to-cart").forEach(
                function (addButton) {
                    if (addButton.dataset.name === removedName) {
                        addButton.disabled = false;
                        addButton.textContent = "Add to Cart";
                    }
                }
            );
        }

        updateCart();
    });
}


/* INITIAL CART DISPLAY */

updateCart();



/* =========================================================
   4. SEARCH AND CATEGORY FILTERING
========================================================= */

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const categoryButtons = document.querySelectorAll(".category-btn");
const productSection = document.getElementById("products");
const productsGrid = document.getElementById("productsGrid");

let selectedCategory = "all";
let searchMessage = document.getElementById("searchMessage");

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

    const searchTerm = (searchInput?.value || "")
        .trim()
        .toLowerCase();

    const productCards =
        productsGrid.querySelectorAll(".product-card");

    let matchingProducts = 0;

    productCards.forEach(function (card) {
        const heading = card.querySelector("h3");

        const productName = (
            card.dataset.name ||
            heading?.textContent ||
            ""
        ).trim().toLowerCase();

        const productCategory = (
            card.dataset.category ||
            card.querySelector(".products-category")?.textContent ||
            ""
        ).trim().toLowerCase();

        const matchesSearch =
            productName.includes(searchTerm) ||
            productCategory.includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            productCategory === selectedCategory;

        // Do not show products deactivated in Supabase.
        const isAvailable = card.dataset.storeAvailable !== "false";

        const shouldShow =
            matchesSearch &&
            matchesCategory &&
            isAvailable;

        card.hidden = !shouldShow;
        card.style.display = shouldShow ? "" : "none";

        if (shouldShow) matchingProducts++;
    });

    if (searchMessage) {
        searchMessage.hidden = matchingProducts > 0;
    }
}

if (searchButton) {
    searchButton.addEventListener("click", function () {
        filterProducts();

        productSection?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}

if (searchInput) {
    searchInput.addEventListener("input", filterProducts);

    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            filterProducts();

            productSection?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
}

categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        selectedCategory = (
            button.dataset.category || "all"
        ).trim().toLowerCase();

        categoryButtons.forEach(function (categoryButton) {
            categoryButton.classList.remove("active");
        });

        button.classList.add("active");

        filterProducts();

        productSection?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});


/* =========================================================
   5. FLASH SALES + LIVE PRODUCT PRICES
========================================================= */

const flashSalesMap = new Map();
const originalProductPrices = new Map();

function getProductKey(name) {
    return String(name || "").trim().toLowerCase();
}

function getCurrentFlashSale(productName) {
    const sale = flashSalesMap.get(getProductKey(productName));

    if (!sale || sale.is_active !== true) return null;

    const now = Date.now();
    const startsAt = new Date(sale.starts_at).getTime();
    const endsAt = new Date(sale.ends_at).getTime();

    if (
        !Number.isFinite(startsAt) ||
        !Number.isFinite(endsAt) ||
        now < startsAt ||
        now >= endsAt
    ) {
        return null;
    }

    return sale;
}

function getDiscountedPrice(originalPrice, percentage) {
    return Math.round(
        (originalPrice * (1 - percentage / 100) + Number.EPSILON) * 100
    ) / 100;
}

function formatStoreMoney(amount) {
    return "GH₵" + Number(amount).toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updateProductSaleDisplay(card, basePrice) {
    const heading = card.querySelector("h3");
    const priceElement = card.querySelector(".product-buttom strong");
    const addButton = card.querySelector(".add-to-cart");

    const productName = (
        heading?.textContent ||
        card.dataset.name ||
        ""
    ).trim();

    if (!productName || !Number.isFinite(basePrice)) return;

    originalProductPrices.set(getProductKey(productName), basePrice);

    const sale = getCurrentFlashSale(productName);

    let displayedPrice = basePrice;

    if (sale) {
        displayedPrice = getDiscountedPrice(
            basePrice,
            Number(sale.discount_percentage)
        );

        if (priceElement) {
            priceElement.replaceChildren();

            const oldPrice = document.createElement("del");
            oldPrice.className = "flash-sale-old-price";
            oldPrice.textContent = formatStoreMoney(basePrice);

            const newPrice = document.createElement("strong");
            newPrice.className = "flash-sale-new-price";
            newPrice.textContent = formatStoreMoney(displayedPrice);

            priceElement.append(oldPrice, document.createTextNode(" "), newPrice);
        }

        let badge = card.querySelector(".flash-sale-badge");

        if (!badge) {
            badge = document.createElement("span");
            badge.className = "flash-sale-badge";
            card.appendChild(badge);
        }

        badge.textContent =
            "FLASH SALE -" + Number(sale.discount_percentage) + "%";

    } else {
        if (priceElement) {
            priceElement.textContent = formatStoreMoney(basePrice);
        }

        card.querySelector(".flash-sale-badge")?.remove();
    }

    if (addButton) {
        addButton.dataset.name = productName;
        addButton.dataset.price = String(displayedPrice);
    }

    // Keep an existing cart item synchronized with the displayed price.
    const cartItem = cart.find(
        item => getProductKey(item.name) === getProductKey(productName)
    );

    if (cartItem) {
        cartItem.price = displayedPrice;
    }
}

function refreshFlashSaleDisplays() {
    if (!productsGrid) return;

    productsGrid.querySelectorAll(".product-card").forEach(function (card) {
        const name = card.querySelector("h3")?.textContent ||
            card.dataset.name;

        const basePrice = originalProductPrices.get(getProductKey(name));

        if (Number.isFinite(basePrice)) {
            updateProductSaleDisplay(card, basePrice);
        }
    });

    updateCart();
}

async function loadFlashSales() {
    try {
        const { data, error } = await supabaseClient
            .from("store_flash_sales")
            .select("product_name, discount_percentage, starts_at, ends_at, is_active");

        if (error) throw error;

        flashSalesMap.clear();

        (data || []).forEach(function (sale) {
            flashSalesMap.set(
                getProductKey(sale.product_name),
                sale
            );
        });

        refreshFlashSaleDisplays();

        console.log("Flash Sales loaded successfully.");

    } catch (error) {
        console.error("Could not load Flash Sales:", error);
    }
}

async function loadLiveStoreProducts() {
    if (!productsGrid) return;

    try {
        const { data: products, error } = await supabaseClient
            .from("store_products")
            .select("product_name, unit_price, active");

        if (error) throw error;

        if (!products || products.length === 0) {
            console.warn("No products returned from Supabase.");
            return;
        }

        const productMap = new Map();

        products.forEach(function (product) {
            productMap.set(
                getProductKey(product.product_name),
                product
            );
        });

        productsGrid.querySelectorAll(".product-card").forEach(function (card) {
            const heading = card.querySelector("h3");
            const productName = (
                heading?.textContent ||
                card.dataset.name ||
                ""
            ).trim();

            const product = productMap.get(getProductKey(productName));

            if (!product || product.active === false) {
                card.dataset.storeAvailable = "false";
                card.hidden = true;
                card.style.display = "none";
                return;
            }

            card.dataset.storeAvailable = "true";
            card.hidden = false;

            const basePrice = Number(product.unit_price);

            if (!Number.isFinite(basePrice) || basePrice < 0) {
                console.warn("Invalid price for:", product.product_name);
                return;
            }

            card.dataset.name = product.product_name;

            updateProductSaleDisplay(card, basePrice);
        });

        updateCart();
        filterProducts();

        document.querySelectorAll(".add-to-cart").forEach(function (button) {
            const alreadyAdded = cart.some(
                item => getProductKey(item.name) ===
                    getProductKey(button.dataset.name)
            );

            button.textContent = alreadyAdded
                ? "Added to Cart"
                : "Add to Cart";

            button.disabled = alreadyAdded;
        });

        console.log("Live product prices synchronized.");

    } catch (error) {
        console.error("Could not load live products:", error);
    }
}

// Load products and Flash Sales.
loadLiveStoreProducts();
loadFlashSales();

// Refresh sale status periodically, including start/end times.
setInterval(function () {
    refreshFlashSaleDisplays();
}, 15000);

// Listen for changes made by the administrator.
supabaseClient
    .channel("store-products-live-updates")
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "store_products"
        },
        loadLiveStoreProducts
    )
    .subscribe();

supabaseClient
    .channel("store-flash-sales-live-updates")
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "store_flash_sales"
        },
        loadFlashSales
    )
    .subscribe();



/* =========================================================
   6. CUSTOMER PROFILE
========================================================= */

(async function setupCustomerProfile() {
    const authClient = window.sweetSupabase;

    const profileButton = document.getElementById("profileButton");
    const profileArea = document.getElementById("profileArea");
    const profileMenu = document.getElementById("profileMenu");
    const profileName = document.getElementById("profileName");
    const profileNameDisplay =
        document.getElementById("profileNameDisplay");
    const profileEmail = document.getElementById("profileEmail");
    const accountLink = document.getElementById("accountLink");
    const logoutButton = document.getElementById("logoutButton");

    if (!authClient || !profileButton || !profileArea || !profileMenu) {
        console.error("Supabase or profile HTML elements are missing.");
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
            accountLink.textContent = "My Account";
            accountLink.href = "./account.html";
        }

        if (logoutButton) logoutButton.hidden = true;
    }


    function showSignedIn(user) {
        const fullName = user.user_metadata?.full_name || "";

        const firstName =
            fullName.trim().split(/\s+/)[0] ||
            user.email?.split("@")[0] ||
            "Customer";

        if (profileName) profileName.textContent = firstName;

        if (profileNameDisplay) {
            profileNameDisplay.textContent = firstName;
        }

        if (profileEmail) {
            profileEmail.textContent = user.email || "";
        }

        if (accountLink) accountLink.hidden = true;
        if (logoutButton) logoutButton.hidden = false;
    }


    function closeProfileMenu() {
        profileMenu.hidden = true;

        profileButton.setAttribute("aria-expanded", "false");
    }


    async function refreshProfile() {
        const { data, error } = await authClient.auth.getUser();

        if (error || !data.user) {
            showSignedOut();
        } else {
            showSignedIn(data.user);
        }
    }


    profileButton.addEventListener("click", async function (event) {
        event.preventDefault();
        event.stopPropagation();

        const { data, error } = await authClient.auth.getUser();

        if (error || !data.user) {
            window.location.href = "./login.html";
            return;
        }

        const shouldOpen = profileMenu.hidden;

        profileMenu.hidden = !shouldOpen;

        profileButton.setAttribute(
            "aria-expanded",
            String(shouldOpen)
        );
    });


    document.addEventListener("click", function (event) {
        if (!profileArea.contains(event.target)) {
            closeProfileMenu();
        }
    });


    if (logoutButton) {
        logoutButton.addEventListener("click", async function (event) {
            event.preventDefault();
            event.stopPropagation();

            logoutButton.disabled = true;

            try {
                const { error } = await authClient.auth.signOut();

                if (error) throw error;

                closeProfileMenu();
                showSignedOut();

                window.location.href = "./login.html";

            } catch (error) {
                console.error("Logout failed:", error);

                alert("Unable to log out. Please try again.");

            } finally {
                logoutButton.disabled = false;
            }
        });
    }


    authClient.auth.onAuthStateChange(function (_event, session) {
        if (session?.user) {
            showSignedIn(session.user);
        } else {
            showSignedOut();
            closeProfileMenu();
        }
    });

    await refreshProfile();

})();


/* =========================================================
   7. PAYSTACK CHECKOUT
========================================================= */

function setupPaystackCheckout() {
    const paymentOverlay = document.getElementById("paymentOverlay");
    const closePayment = document.getElementById("closePayment");
    const closePaymentBottom =
        document.getElementById("closePaymentBottom");
    const paymentNetwork = document.getElementById("paymentNetwork");
    const paymentTotal = document.getElementById("paymentTotal");
    const paymentReference = document.getElementById("paymentReference");

    const customerEmail = document.getElementById("customerEmail");
    const customerName = document.getElementById("customerName");
    const customerPhone = document.getElementById("customerPhone");
    const deliveryAddress = document.getElementById("deliveryAddress");

    const confirmButton =
        document.getElementById("confirmPaymentInstructions");

    if (
        !checkoutButton ||
        !paymentOverlay ||
        !paymentNetwork ||
        !paymentTotal ||
        !paymentReference ||
        !customerEmail ||
        !customerName ||
        !customerPhone ||
        !deliveryAddress ||
        !confirmButton
    ) {
        console.error(
            "Checkout error: Required checkout HTML elements are missing."
        );
        return;
    }


    function closePaymentWindow() {
        paymentOverlay.style.display = "none";
        paymentOverlay.hidden = true;
    }


    checkoutButton.addEventListener("click", async function (event) {
        event.preventDefault();

        if (!Array.isArray(cart) || cart.length === 0) {
            alert("Your cart is empty. Add a product before checkout.");
            return;
        }

        try {
            const { data, error } =
                await window.sweetSupabase.auth.getUser();

            if (error || !data.user) {
                localStorage.setItem(
                    "sweetKitchenCart",
                    JSON.stringify(cart)
                );

                window.location.href =
                    "./login.html?redirect=checkout";

                return;
            }

            const subtotal = cart.reduce(function (sum, item) {
                return sum +
                    Number(item.price) * Number(item.quantity);
            }, 0);

            const total = subtotal + subtotal * 0.01;

            paymentTotal.textContent = "GH₵" + total.toFixed(2);

            paymentReference.textContent =
                "Generated securely when checkout starts.";

            paymentNetwork.value = "";

            paymentOverlay.hidden = false;
            paymentOverlay.style.display = "flex";

        } catch (error) {
            console.error("Could not open checkout:", error);
            alert("Unable to open checkout. Please try again.");
        }
    });


    confirmButton.addEventListener("click", async function (event) {
        event.preventDefault();

        if (
            !customerEmail.value.trim() ||
            !customerEmail.checkValidity() ||
            !customerName.value.trim() ||
            !customerPhone.value.trim() ||
            !deliveryAddress.value.trim()
        ) {
            alert("Please complete all customer details with a valid email.");
            return;
        }

        const network = paymentNetwork.value;

        if (!["mtn", "telecel", "at"].includes(network)) {
            alert("Please select your Mobile Money network.");
            return;
        }

        if (!Array.isArray(cart) || cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        const originalButtonText = confirmButton.textContent;

        confirmButton.disabled = true;
        confirmButton.textContent = "Connecting to Paystack...";

        try {
            const items = cart.map(function (item) {
                return {
                    name: String(item.name),
                    quantity: Number(item.quantity)
                };
            });

            const { data, error } =
                await window.sweetSupabase.functions.invoke(
                    "initialize-paystack",
                    {
                        body: {
                            action: "initialize",
                            email: customerEmail.value.trim(),
                            customerName: customerName.value.trim(),
                            customerPhone: customerPhone.value.trim(),
                            deliveryAddress: deliveryAddress.value.trim(),
                            network: network,
                            items: items
                        }
                    }
                );

            if (error) {
                console.error("Checkout function error:", error);
                console.error("Error details:", error.details);
                console.error("Error hint:", error.hint);
                console.error("Error code:", error.code);

                if (error.context) {
                    try {
                        console.error(
                            "Server response:",
                            await error.context.clone().text()
                        );
                    } catch (readError) {
                        console.error(
                            "Could not read server response:",
                            readError
                        );
                    }
                }

                throw new Error(
                    "Payment connection failed. Check the browser Console."
                );
            }

            if (!data || !data.authorization_url) {
                throw new Error(
                    data?.error ||
                    "Paystack did not return a payment link."
                );
            }

            window.location.href = data.authorization_url;

        } catch (error) {
            console.error("Paystack checkout error:", error);

            alert(
                error.message ||
                "Payment could not start. Please try again."
            );

            confirmButton.disabled = false;
            confirmButton.textContent = originalButtonText;
        }
    });


    if (closePayment) {
        closePayment.addEventListener("click", closePaymentWindow);
    }

    if (closePaymentBottom) {
        closePaymentBottom.addEventListener(
            "click",
            closePaymentWindow
        );
    }

    closePaymentWindow();

    console.log("Paystack checkout initialized.");
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        setupPaystackCheckout
    );
} else {
    setupPaystackCheckout();
}


/* =========================================================
   8. VERIFY PAYSTACK PAYMENT ON RETURN
========================================================= */

(async function verifyPaymentOnReturn() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("payment") !== "return") {
        return;
    }

    const reference =
        params.get("reference") ||
        params.get("trxref");

    if (!reference) {
        alert("Payment reference is missing. Please contact the store.");
        return;
    }

    try {
        const { data, error } =
            await window.sweetSupabase.functions.invoke(
                "initialize-paystack",
                {
                    body: {
                        action: "verify",
                        reference: reference
                    }
                }
            );

        if (error) {
            console.error("Payment verification error:", error);

            throw new Error(
                "We could not verify your payment. Please contact the store before trying again."
            );
        }

        if (!data || data.paid !== true) {
            alert(
                data?.message ||
                data?.error ||
                "Payment has not been confirmed. Please check your transaction before trying again."
            );

            return;
        }

        cart = [];

        localStorage.removeItem("sweetKitchenCart");

        updateCart();

        alert("Payment verified successfully! Your order has been paid.");

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    } catch (error) {
        console.error("Payment return verification failed:", error);

        alert(
            error.message ||
            "Payment verification failed. Please contact the store."
        );
    }
})();


/* =========================================================
   9. MY ORDERS — CUSTOMER ORDER HISTORY
========================================================= */

function formatOrderDateTime(dateValue) {
    if (!dateValue) {
        return "Date unavailable";
    }

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
    const myOrdersList =
        document.getElementById("myOrdersList");

    const ordersMessage =
        document.getElementById("ordersMessage");

    const refreshOrdersBtn =
        document.getElementById("refreshOrdersBtn");

    if (!myOrdersList) {
        console.error("My Orders list element was not found.");
        return;
    }

    myOrdersList.replaceChildren();

    if (ordersMessage) {
        ordersMessage.hidden = false;
        ordersMessage.textContent = "Loading your orders...";
    }

    if (refreshOrdersBtn) {
        refreshOrdersBtn.disabled = true;
        refreshOrdersBtn.textContent = "Loading...";
    }

    try {
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) throw userError;

        const user = userData.user;

        if (!user) {
            if (ordersMessage) {
                ordersMessage.textContent =
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
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            if (ordersMessage) {
                ordersMessage.textContent =
                    "You haven't placed any orders yet. Your orders will appear here after checkout.";
            }

            return;
        }

        if (ordersMessage) {
            ordersMessage.textContent =
                `${orders.length} order${orders.length === 1 ? "" : "s"} found.`;
        }


        function formatMoney(value) {
            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {
                return "Unavailable";
            }

            const amount = Number(value);

            if (!Number.isFinite(amount)) {
                return "Unavailable";
            }

            return "GH₵ " + amount.toLocaleString("en-GH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }


        function addOrderDetail(
            container,
            labelText,
            valueText,
            extraClass = ""
        ) {
            const row = document.createElement("div");
            row.className = "order-detail-row";

            const label = document.createElement("span");
            label.className = "order-detail-label";
            label.textContent = labelText;

            const value = document.createElement("span");
            value.className = "order-detail-value";
            value.textContent = valueText;

            if (extraClass) {
                value.classList.add(extraClass);
            }

            row.append(label, value);
            container.appendChild(row);
        }


        let targetOrderFound = false;

        orders.forEach(function (order) {
            const card = document.createElement("article");

            card.className = "order-card";

            card.id = "order-card-" + String(order.id);

            if (
                targetOrderId !== null &&
                String(order.id) === String(targetOrderId)
            ) {
                card.classList.add("order-card-highlight");
                targetOrderFound = true;
            }


            const header = document.createElement("div");
            header.className = "order-card-header";

            const referenceBlock = document.createElement("div");
            referenceBlock.className = "order-reference-block";

            const referenceLabel = document.createElement("p");
            referenceLabel.className = "order-reference-label";
            referenceLabel.textContent = "ORDER REFERENCE";

            const reference = document.createElement("h3");
            reference.className = "order-reference";

            reference.textContent =
                order.order_reference || String(order.id);

            referenceBlock.append(referenceLabel, reference);


            const status = document.createElement("span");
            status.className = "order-status";

            const orderStatus = String(
                order.order_status || "Pending"
            ).trim();

            status.textContent = orderStatus;

            const statusKey = orderStatus.toLowerCase();

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


            const divider = document.createElement("div");
            divider.className = "order-card-divider";


            const totalBlock = document.createElement("div");
            totalBlock.className = "order-total-block";

            const totalLabel = document.createElement("p");
            totalLabel.className = "order-total-label";
            totalLabel.textContent = "ORDER TOTAL";

            const total = document.createElement("strong");
            total.className = "order-total";
            total.textContent = formatMoney(order.total_amount);

            totalBlock.append(totalLabel, total);


            const details = document.createElement("div");
            details.className = "order-details";

            addOrderDetail(
                details,
                "Order date & time",
                formatOrderDateTime(order.created_at)
            );


            const paymentStatus = String(
                order.payment_status || "Unknown"
            ).trim();

            const paymentKey = paymentStatus.toLowerCase();

            let paymentClass = "payment-pending";

            if (
                ["paid", "success", "successful", "completed"].includes(paymentKey)
            ) {
                paymentClass = "payment-success";
            } else if (
                ["failed", "cancelled", "canceled"].includes(paymentKey)
            ) {
                paymentClass = "payment-danger";
            }

            addOrderDetail(
                details,
                "Payment status",
                paymentStatus,
                paymentClass
            );

            addOrderDetail(
                details,
                "Payment network",
                order.payment_network || "Not specified"
            );

            addOrderDetail(
                details,
                "Subtotal",
                formatMoney(order.subtotal)
            );

            addOrderDetail(
                details,
                "Service charge",
                formatMoney(order.service_charge)
            );

            card.append(
                header,
                divider,
                totalBlock,
                details
            );

            myOrdersList.appendChild(card);
        });


        if (targetOrderId !== null) {
            if (targetOrderFound) {
                const targetCard = document.getElementById(
                    "order-card-" + String(targetOrderId)
                );

                targetCard?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            } else if (ordersMessage) {
                ordersMessage.textContent =
                    "Your orders loaded, but the order linked to this notification was not found.";
            }
        }

    } catch (error) {
        console.error("My Orders error:", error);

        if (ordersMessage) {
            ordersMessage.textContent =
                "Unable to load your orders. Please refresh and try again.";
        }

    } finally {
        if (refreshOrdersBtn) {
            refreshOrdersBtn.disabled = false;
            refreshOrdersBtn.textContent = "↻ Refresh Orders";
        }
    }
}


/* REFRESH ORDERS BUTTON */

const refreshOrdersBtn =
    document.getElementById("refreshOrdersBtn");

if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener("click", function () {
        loadMyOrders();
    });
}


/* OPEN MY ORDERS */

const myOrdersLink =
    document.getElementById("myOrdersLink");

const myOrdersSection =
    document.getElementById("myOrders");

if (myOrdersLink && myOrdersSection) {
    myOrdersLink.addEventListener("click", async function (event) {
        event.preventDefault();

        const { data, error } =
            await supabaseClient.auth.getUser();

        if (error || !data.user) {
            window.location.href = "./login.html";
            return;
        }

        myOrdersSection.hidden = false;
        myOrdersSection.style.display = "block";

        const profileMenu =
            document.getElementById("profileMenu");

        const profileButton =
            document.getElementById("profileButton");

        if (profileMenu) {
            profileMenu.hidden = true;
        }

        if (profileButton) {
            profileButton.setAttribute("aria-expanded", "false");
        }

        myOrdersSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        await loadMyOrders();
    });
}


/* =========================================================
   10. DARK AND LIGHT MODE
========================================================= */

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");


function setTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-mode", isDark);

    if (themeIcon) {
        themeIcon.textContent =
            isDark ? "light_mode" : "dark_mode";
    }

    if (themeToggle) {
        themeToggle.setAttribute(
            "aria-label",
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
        );
    }

    try {
        localStorage.setItem("sweetKitchenTheme", theme);
    } catch (error) {
        console.warn("Theme preference could not be saved.");
    }
}


if (themeToggle && themeIcon) {
    let savedTheme = "light";

    try {
        savedTheme =
            localStorage.getItem("sweetKitchenTheme") || "light";
    } catch (error) {
        // Use light mode if browser storage is unavailable.
    }

    setTheme(savedTheme);

    themeToggle.addEventListener("click", function () {
        const isDark =
            document.body.classList.contains("dark-mode");

        setTheme(isDark ? "light" : "dark");
    });
}


/* =========================================================
   11. NOTIFICATION BELL — SUPABASE REALTIME
========================================================= */

const notificationButton =
    document.getElementById("notificationButton");

const notificationCount =
    document.getElementById("notificationCount");

const notificationMenu =
    document.getElementById("notificationMenu");

const notificationList =
    document.getElementById("notificationList");

const markAllNotificationsRead =
    document.getElementById("markAllNotificationsRead");

const notificationSupabase = window.sweetSupabase;

let notificationUserId = null;
let notificationChannel = null;


/* OPEN AND CLOSE NOTIFICATION MENU */

if (notificationButton && notificationMenu) {
    notificationButton.addEventListener("click", function (event) {
        event.stopPropagation();

        const shouldOpen = notificationMenu.hidden;

        notificationMenu.hidden = !shouldOpen;

        notificationButton.setAttribute(
            "aria-expanded",
            String(shouldOpen)
        );
    });
}


/* CLOSE NOTIFICATION MENU WHEN CLICKING OUTSIDE */

document.addEventListener("click", function (event) {
    if (
        notificationMenu &&
        notificationButton &&
        !notificationMenu.contains(event.target) &&
        !notificationButton.contains(event.target)
    ) {
        notificationMenu.hidden = true;

        notificationButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }
});


/* DISPLAY NOTIFICATIONS */

function displayNotifications(notifications) {
    if (!notificationList) return;

    notificationList.replaceChildren();

    if (!notifications || notifications.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "notification-empty";
        emptyMessage.textContent = "You have no notifications.";

        notificationList.appendChild(emptyMessage);

        return;
    }


    notifications.forEach(function (notification) {
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

        title.textContent =
            notification.title || "Order update";


        const message = document.createElement("p");

        message.textContent =
            notification.message || "Your order has been updated.";


        const orderReference = document.createElement("small");

        orderReference.textContent = notification.order_id
            ? "Click to view related order"
            : "Order reference unavailable";


        const date = document.createElement("small");

        date.textContent = notification.created_at
            ? new Date(notification.created_at).toLocaleString(
                "en-GH",
                { timeZone: "Africa/Accra" }
            )
            : "";

        item.append(title, message, orderReference, date);


        /* CLICK NOTIFICATION TO OPEN THE RELATED ORDER */

        item.addEventListener("click", async function () {
            if (!notificationUserId) return;

            item.disabled = true;

            try {
                // Mark notification as read.
                if (!notification.is_read) {
                    const { error } = await notificationSupabase
                        .from("notifications")
                        .update({ is_read: true })
                        .eq("id", notification.id)
                        .eq("user_id", notificationUserId);

                    if (error) throw error;
                }


                // Close notification dropdown.
                if (notificationMenu) {
                    notificationMenu.hidden = true;
                }

                if (notificationButton) {
                    notificationButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }


                // Check for linked order ID.
                if (!notification.order_id) {
                    alert(
                        "This notification has no linked order. Please contact the store."
                    );

                    await loadNotifications();

                    return;
                }


                // Check customer login.
                const { data: userData, error: userError } =
                    await notificationSupabase.auth.getUser();

                if (userError) throw userError;

                if (!userData.user) {
                    window.location.href = "./login.html";
                    return;
                }


                // Open My Orders.
                const ordersSection =
                    document.getElementById("myOrders");

                if (!ordersSection) {
                    throw new Error(
                        "The My Orders section was not found."
                    );
                }

                ordersSection.hidden = false;
                ordersSection.style.display = "block";


                // Close profile dropdown.
                const profileMenu =
                    document.getElementById("profileMenu");

                const profileButton =
                    document.getElementById("profileButton");

                if (profileMenu) {
                    profileMenu.hidden = true;
                }

                if (profileButton) {
                    profileButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }


                ordersSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


                // Load and highlight the related order.
                await loadMyOrders(notification.order_id);


                // Update notification badge and list.
                await loadNotifications();

            } catch (error) {
                console.error(
                    "Could not open order from notification:",
                    error
                );

                alert(
                    "Unable to open this order. Please try again."
                );

            } finally {
                item.disabled = false;
            }
        });


        notificationList.appendChild(item);
    });
}


/* UPDATE UNREAD BADGE */

function updateNotificationBadge(notifications) {
    const unreadCount = notifications.filter(
        notification => !notification.is_read
    ).length;

    if (notificationCount) {
        notificationCount.textContent =
            unreadCount > 99 ? "99+" : String(unreadCount);

        notificationCount.hidden = unreadCount === 0;
    }

    if (notificationButton) {
        notificationButton.classList.toggle(
            "has-unread",
            unreadCount > 0
        );
    }
}


/* LOAD NOTIFICATIONS FROM SUPABASE */

async function loadNotifications() {
    if (!notificationUserId || !notificationSupabase) {
        return;
    }

    const { data, error } = await notificationSupabase
        .from("notifications")
        .select("*")
        .eq("user_id", notificationUserId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error loading notifications:", error);
        return;
    }

    const notifications = data || [];

    updateNotificationBadge(notifications);

    displayNotifications(notifications);
}


/* MARK ALL NOTIFICATIONS AS READ */

if (markAllNotificationsRead) {
    markAllNotificationsRead.addEventListener(
        "click",
        async function () {
            if (!notificationUserId) return;

            markAllNotificationsRead.disabled = true;

            try {
                const { error } = await notificationSupabase
                    .from("notifications")
                    .update({ is_read: true })
                    .eq("user_id", notificationUserId)
                    .eq("is_read", false);

                if (error) throw error;

                await loadNotifications();

            } catch (error) {
                console.error(
                    "Could not mark notifications as read:",
                    error
                );

                alert(
                    "Unable to update notifications. Please try again."
                );

            } finally {
                markAllNotificationsRead.disabled = false;
            }
        }
    );
}


/* START SUPABASE REALTIME NOTIFICATIONS */

async function startNotificationRealtime() {
    if (!notificationUserId) return;

    if (notificationChannel) {
        await notificationSupabase.removeChannel(
            notificationChannel
        );

        notificationChannel = null;
    }

    notificationChannel = notificationSupabase
        .channel("customer-notifications-" + notificationUserId)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "notifications",
                filter: "user_id=eq." + notificationUserId
            },
            function () {
                loadNotifications();
            }
        )
        .subscribe();
}


/* INITIALIZE CUSTOMER NOTIFICATIONS */

async function initializeNotifications() {
    if (!notificationSupabase) {
        console.error("Supabase notification client is missing.");
        return;
    }

    const { data, error } =
        await notificationSupabase.auth.getUser();

    if (error || !data.user) {
        notificationUserId = null;

        if (notificationChannel) {
            await notificationSupabase.removeChannel(
                notificationChannel
            );

            notificationChannel = null;
        }

        updateNotificationBadge([]);

        displayNotifications([]);

        return;
    }

    notificationUserId = data.user.id;

    await loadNotifications();

    await startNotificationRealtime();
}


/* INITIALIZE NOTIFICATIONS ON PAGE LOAD */

if (notificationSupabase) {
    initializeNotifications();

    notificationSupabase.auth.onAuthStateChange(
        function (event) {
            if (
                event === "SIGNED_IN" ||
                event === "SIGNED_OUT"
            ) {
                initializeNotifications();
            }
        }
    );
}


console.log(
    "SWEET'S KITCHEN & COLLECTIONS — Main JavaScript loaded successfully."
);
