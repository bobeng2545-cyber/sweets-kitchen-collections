done let continue 


/* =========================================================
   SWEET'S KITCHEN & COLLECTIONS
   COMPLETE MAIN.JS
   Supabase Products + Cart + Search + Flash Sales
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
   2. COMMON HELPERS
========================================================= */

function getProductKey(name) {
    return String(name || "").trim().toLowerCase();
}

function formatStoreMoney(amount) {
    return "GH₵" + Number(amount).toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showMessage(message) {
    alert(message);
}


/* =========================================================
   3. MENU ICON
========================================================= */

const menuButton = document.getElementById("menuButton");
const navMenu = document.getElementById("nav");

if (menuButton && navMenu) {
    menuButton.addEventListener("click", function () {
        navMenu.classList.toggle("show");

        menuButton.setAttribute(
            "aria-expanded",
            String(navMenu.classList.contains("show"))
        );
    });
}


/* =========================================================
   4. SHOPPING CART
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

const productsGrid = document.getElementById("productsGrid");


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


/* UPDATE PRODUCT BUTTON STATES */

function updateProductCartButtons() {
    if (!productsGrid) return;

    productsGrid.querySelectorAll(".add-to-cart").forEach(function (button) {
        const alreadyAdded = cart.some(
            item => getProductKey(item.name) ===
                getProductKey(button.dataset.name)
        );

        button.textContent = alreadyAdded
            ? "Added to Cart"
            : "Add to Cart";

        button.disabled = alreadyAdded;
    });
}


/* UPDATE CART DISPLAY */

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
        console.error("Cart HTML elements are missing.");
        return;
    }

    cartItem.replaceChildren();

    if (cart.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-cart";
        emptyMessage.textContent = "Your cart is empty.";

        cartItem.appendChild(emptyMessage);

        cartCount.textContent = "0";
        cartTotal.textContent = "GH₵0.00";

        updateProductCartButtons();
        return;
    }

    let total = 0;
    let numberOfItems = 0;

    cart.forEach(function (item, index) {
        total += item.price * item.quantity;
        numberOfItems += item.quantity;

        const itemElement = document.createElement("div");
        itemElement.className = "cart-item";

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
        quantity.textContent = item.quantity;

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

        itemElement.append(info, controls, remove);
        cartItem.appendChild(itemElement);
    });

    cartCount.textContent = String(numberOfItems);
    cartTotal.textContent = formatStoreMoney(total);

    updateProductCartButtons();
}


/* ADD TO CART — EVENT DELEGATION */

if (productsGrid) {
    productsGrid.addEventListener("click", function (event) {
        const button = event.target.closest(".add-to-cart");

        if (!button || !productsGrid.contains(button)) return;

        const name = button.dataset.name;
        const price = Number(button.dataset.price);

        if (!name || !Number.isFinite(price) || price < 0) {
            showMessage("This product has invalid information.");
            return;
        }

        const existingProduct = cart.find(
            item => getProductKey(item.name) === getProductKey(name)
        );

        if (existingProduct) {
            showMessage(
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
    });
}


/* CART QUANTITY AND REMOVE BUTTONS */

if (cartItem) {
    cartItem.addEventListener("click", function (event) {
        const button = event.target.closest(
            ".increase, .decrease, .remove-item"
        );

        if (!button) return;

        const index = Number(button.dataset.index);

        if (!Number.isInteger(index) || !cart[index]) return;

        if (button.classList.contains("increase")) {
            cart[index].quantity++;
        } else if (button.classList.contains("decrease")) {
            cart[index].quantity--;

            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
        } else if (button.classList.contains("remove-item")) {
            cart.splice(index, 1);
        }

        updateCart();
    });
}


/* INITIAL CART DISPLAY */

updateCart();


/* =========================================================
   5. SEARCH AND CATEGORY FILTERING
========================================================= */

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const categoryButtons = document.querySelectorAll(".category-btn");
const productSection = document.getElementById("products");

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

    const cards = productsGrid.querySelectorAll(".product-card");

    let matchingProducts = 0;

    cards.forEach(function (card) {
        const name = (
            card.dataset.name ||
            card.querySelector("h3")?.textContent ||
            ""
        ).trim().toLowerCase();

        const category = (
            card.dataset.category ||
            card.querySelector(".products-category")?.textContent ||
            ""
        ).trim().toLowerCase();

        const matchesSearch =
            name.includes(searchTerm) ||
            category.includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;

        const shouldShow = matchesSearch && matchesCategory;

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
   6. SUPABASE PRODUCTS AND FLASH SALES
========================================================= */

const flashSalesMap = new Map();
const originalProductPrices = new Map();


/* FIND CURRENT FLASH SALE */

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


/* CALCULATE DISCOUNTED PRICE */

function getDiscountedPrice(originalPrice, percentage) {
    return Math.round(
        (
            originalPrice *
            (1 - percentage / 100) +
            Number.EPSILON
        ) * 100
    ) / 100;
}


/* CREATE PRODUCT CARD */

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    card.dataset.name = product.product_name;
    card.dataset.category = String(product.category || "")
        .trim()
        .toLowerCase();

    const imageContainer = document.createElement("div");
    imageContainer.className = "product-image";

    const image = document.createElement("img");

    image.src = product.image_url ||
        "./images/product-placeholder.png";

    image.alt = product.product_name;
    image.loading = "lazy";

    image.addEventListener("error", function () {
        image.src = "./images/product-placeholder.png";
    }, { once: true });

    const favouriteButton = document.createElement("button");
    favouriteButton.type = "button";
    favouriteButton.className = "favourite-button";
    favouriteButton.textContent = "💖";
    favouriteButton.setAttribute(
        "aria-label",
        "Favourite " + product.product_name
    );

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
    bottom.className = "product-buttom";

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


/* RENDER PRODUCTS FROM SUPABASE */

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

    products.forEach(function (product) {
        const price = Number(product.unit_price);

        if (
            !product.product_name ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            console.warn("Skipping invalid product:", product);
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


/* LOAD PRODUCTS FROM SUPABASE */

async function loadLiveStoreProducts() {
    if (!productsGrid) return;

    productsGrid.setAttribute("aria-busy", "true");

    const loadingMessage = document.getElementById("productsLoading");

    if (loadingMessage) {
        loadingMessage.textContent = "Loading products...";
    }

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

        console.log(
            "Supabase products loaded:",
            data?.length || 0
        );

    } catch (error) {
        console.error("Product loading error:", error);

        productsGrid.replaceChildren();

        const message = document.createElement("p");
        message.className = "products-error";
        message.textContent =
            "We could not load products. Please refresh the page and try again.";

        productsGrid.appendChild(message);

    } finally {
        productsGrid.setAttribute("aria-busy", "false");
    }
}


/* UPDATE FLASH SALE PRICE ON A PRODUCT CARD */

function updateProductSaleDisplay(card, basePrice) {
    const productName = (
        card.dataset.name ||
        card.querySelector("h3")?.textContent ||
        ""
    ).trim();

    const priceElement =
        card.querySelector(".product-buttom > strong");

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
            oldPrice.className = "flash-sale-old-price";
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
        addButton.dataset.name = productName;
        addButton.dataset.price = String(displayedPrice);
    }

    // Update existing cart item display price.
    const cartProduct = cart.find(
        item => getProductKey(item.name) === getProductKey(productName)
    );

    if (cartProduct) {
        cartProduct.price = displayedPrice;
    }
}


/* REFRESH ALL FLASH SALE PRICES */

function refreshFlashSaleDisplays() {
    if (!productsGrid) return;

    productsGrid.querySelectorAll(".product-card").forEach(function (card) {
        const name = card.dataset.name ||
            card.querySelector("h3")?.textContent;

        const basePrice =
            originalProductPrices.get(getProductKey(name));

        if (Number.isFinite(basePrice)) {
            updateProductSaleDisplay(card, basePrice);
        }
    });

    updateCart();
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

        (data || []).forEach(function (sale) {
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


/* INITIAL PRODUCT AND FLASH SALE LOAD */

loadLiveStoreProducts();
loadFlashSales();


/* REFRESH FLASH SALES EVERY 15 SECONDS */

setInterval(refreshFlashSaleDisplays, 15000);


/* REALTIME PRODUCT UPDATES */

supabaseClient
    .channel("store-products-live-updates")
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "store_products"
        },
        function () {
            loadLiveStoreProducts();
        }
    )
    .subscribe();


/* REALTIME FLASH SALE UPDATES */

supabaseClient
    .channel("store-flash-sales-live-updates")
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "store_flash_sales"
        },
        function () {
            loadFlashSales();
        }
    )
    .subscribe();


/* =========================================================
   7. CUSTOMER PROFILE
========================================================= */

(async function setupCustomerProfile() {
    const authClient = window.sweetSupabase;

    const profileButton = document.getElementById("profileButton");
    const profileArea = document.getElementById("profileArea");
    const profileMenu = document.getElementById("profileMenu");
    const profileName = document.getElementById("profileName");
    const profileNameDisplay = document.getElementById("profileNameDisplay");
    const profileEmail = document.getElementById("profileEmail");
    const accountLink = document.getElementById("accountLink");
    const logoutButton = document.getElementById("logoutButton");

    if (!authClient || !profileButton || !profileArea || !profileMenu) {
        console.warn("Profile HTML elements are missing.");
        return;
    }

    function showSignedOut() {
        if (profileName) profileName.textContent = "Sign in";
        if (profileNameDisplay) profileNameDisplay.textContent = "My Account";
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
        profileButton.setAttribute("aria-expanded", String(shouldOpen));
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
                showMessage("Unable to log out. Please try again.");

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
   8. PAYSTACK CHECKOUT
========================================================= */

function setupPaystackCheckout() {
    const paymentOverlay = document.getElementById("paymentOverlay");
    const closePayment = document.getElementById("closePayment");
    const closePaymentBottom = document.getElementById("closePaymentBottom");
    const paymentNetwork = document.getElementById("paymentNetwork");
    const paymentTotal = document.getElementById("paymentTotal");
    const paymentReference = document.getElementById("paymentReference");

    const customerEmail = document.getElementById("customerEmail");
    const customerName = document.getElementById("customerName");
    const customerPhone = document.getElementById("customerPhone");

    const deliveryRegion = document.getElementById("deliveryRegion");
    const deliveryTown = document.getElementById("deliveryTown");
    const deliveryAddress = document.getElementById("deliveryAddress");
    const ghanaPostAddress = document.getElementById("ghanaPostAddress");
    const deliveryInstructions = document.getElementById("deliveryInstructions");

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
        console.warn("Some checkout HTML elements are missing.");
        return;
    }

    function closePaymentWindow() {
        paymentOverlay.style.display = "none";
        paymentOverlay.hidden = true;
    }

    checkoutButton.addEventListener("click", async function (event) {
        event.preventDefault();

        if (cart.length === 0) {
            showMessage("Your cart is empty. Add a product before checkout.");
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

                window.location.href = "./login.html?redirect=checkout";
                return;
            }

            const subtotal = cart.reduce(function (sum, item) {
                return sum + Number(item.price) * Number(item.quantity);
            }, 0);

            const total = subtotal + subtotal * 0.01;

            paymentTotal.textContent = formatStoreMoney(total);
            paymentReference.textContent =
                "Generated securely when checkout starts.";

            paymentNetwork.value = "";

            paymentOverlay.hidden = false;
            paymentOverlay.style.display = "flex";

        } catch (error) {
            console.error("Could not open checkout:", error);
            showMessage("Unable to open checkout. Please try again.");
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
            showMessage("Please complete all required customer details with a valid email.");
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

            const checkoutBody = {
                action: "initialize",
                email: customerEmail.value.trim(),
                customerName: customerName.value.trim(),
                customerPhone: customerPhone.value.trim(),
                deliveryAddress: deliveryAddress.value.trim(),
                network: network,
                items: items
            };

            // These additional fields are sent to the Edge Function.
            // The Edge Function must also be updated to save/use them.
            if (deliveryRegion) {
                checkoutBody.deliveryRegion = deliveryRegion.value.trim();
            }

            if (deliveryTown) {
                checkoutBody.deliveryTown = deliveryTown.value.trim();
            }

            if (ghanaPostAddress) {
                checkoutBody.ghanaPostAddress = ghanaPostAddress.value.trim();
            }

            if (deliveryInstructions) {
                checkoutBody.deliveryInstructions =
                    deliveryInstructions.value.trim();
            }

            const { data, error } =
                await window.sweetSupabase.functions.invoke(
                    "initialize-paystack",
                    { body: checkoutBody }
                );

            if (error) {
                console.error("Checkout function error:", error);

                if (error.context) {
                    try {
                        console.error(
                            "Server response:",
                            await error.context.clone().text()
                        );
                    } catch (readError) {
                        console.error(readError);
                    }
                }

                throw new Error("Payment connection failed. Check the browser Console.");
            }

            if (!data || !data.authorization_url) {
                throw new Error(
                    data?.error || "Paystack did not return a payment link."
                );
            }

            window.location.href = data.authorization_url;

        } catch (error) {
            console.error("Paystack checkout error:", error);

            showMessage(
                error.message || "Payment could not start. Please try again."
            );

            confirmButton.disabled = false;
            confirmButton.textContent = originalButtonText;
        }
    });

    closePayment?.addEventListener("click", closePaymentWindow);
    closePaymentBottom?.addEventListener("click", closePaymentWindow);

    closePaymentWindow();

    console.log("Paystack checkout initialized.");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPaystackCheckout);
} else {
    setupPaystackCheckout();
}


/* =========================================================
   9. VERIFY PAYSTACK PAYMENT ON RETURN
========================================================= */

(async function verifyPaymentOnReturn() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("payment") !== "return") return;

    const reference = params.get("reference") || params.get("trxref");

    if (!reference) {
        showMessage("Payment reference is missing. Please contact the store.");
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

        if (error) throw error;

        if (!data || data.paid !== true) {
            showMessage(
                data?.message ||
                data?.error ||
                "Payment has not been confirmed. Please check your transaction."
            );
            return;
        }

        cart = [];
        localStorage.removeItem("sweetKitchenCart");

        updateCart();

        showMessage("Payment verified successfully! Your order has been paid.");

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    } catch (error) {
        console.error("Payment verification failed:", error);

        showMessage(
            error.message ||
            "Payment verification failed. Please contact the store."
        );
    }
})();


/* =========================================================
   10. MY ORDERS
========================================================= */

function formatOrderDateTime(dateValue) {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

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
    const myOrdersList = document.getElementById("myOrdersList");
    const ordersMessage = document.getElementById("ordersMessage");
    const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");

    if (!myOrdersList) return;

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

        if (!userData.user) {
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
            .eq("user_id", userData.user.id)
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
                orders.length + " order(s) found.";
        }

        function addDetail(container, labelText, valueText, extraClass = "") {
            const row = document.createElement("div");
            row.className = "order-detail-row";

            const label = document.createElement("span");
            label.className = "order-detail-label";
            label.textContent = labelText;

            const value = document.createElement("span");
            value.className = "order-detail-value";
            value.textContent = valueText;

            if (extraClass) value.classList.add(extraClass);

            row.append(label, value);
            container.appendChild(row);
        }

        function formatMoney(value) {
            const amount = Number(value);

            if (!Number.isFinite(amount)) return "Unavailable";

            return formatStoreMoney(amount);
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

            const referenceLabel = document.createElement("p");
            referenceLabel.textContent = "ORDER REFERENCE";

            const reference = document.createElement("h3");
            reference.textContent =
                order.order_reference || String(order.id);

            referenceBlock.append(referenceLabel, reference);

            const status = document.createElement("span");
            status.className = "order-status";

            const orderStatus = String(order.order_status || "Pending");
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

            const totalLabel = document.createElement("p");
            totalLabel.textContent = "ORDER TOTAL";

            const total = document.createElement("strong");
            total.textContent = formatMoney(order.total_amount);

            totalBlock.append(totalLabel, total);

            const details = document.createElement("div");
            details.className = "order-details";

            addDetail(
                details,
                "Order date & time",
                formatOrderDateTime(order.created_at)
            );

            addDetail(
                details,
                "Payment status",
                order.payment_status || "Unknown"
            );

            addDetail(
                details,
                "Payment network",
                order.payment_network || "Not specified"
            );

            addDetail(details, "Subtotal", formatMoney(order.subtotal));

            addDetail(
                details,
                "Service charge",
                formatMoney(order.service_charge)
            );

            card.append(header, divider, totalBlock, details);
            myOrdersList.appendChild(card);
        });

        if (targetOrderId !== null) {
            if (targetOrderFound) {
                document.getElementById(
                    "order-card-" + String(targetOrderId)
                )?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            } else if (ordersMessage) {
                ordersMessage.textContent =
                    "The order linked to this notification was not found.";
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

const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");

if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener("click", function () {
        loadMyOrders();
    });
}


/* OPEN MY ORDERS */

const myOrdersLink = document.getElementById("myOrdersLink");
const myOrdersSection = document.getElementById("myOrders");

if (myOrdersLink && myOrdersSection) {
    myOrdersLink.addEventListener("click", async function (event) {
        event.preventDefault();

        const { data, error } = await supabaseClient.auth.getUser();

        if (error || !data.user) {
            window.location.href = "./login.html";
            return;
        }

        myOrdersSection.hidden = false;
        myOrdersSection.style.display = "block";

        const profileMenu = document.getElementById("profileMenu");
        const profileButton = document.getElementById("profileButton");

        if (profileMenu) profileMenu.hidden = true;

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
   11. DARK AND LIGHT MODE
========================================================= */

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

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

if (themeToggle && themeIcon) {
    let savedTheme = "light";

    try {
        savedTheme =
            localStorage.getItem("sweetKitchenTheme") || "light";
    } catch (error) {
        // Use light mode.
    }

    setTheme(savedTheme);

    themeToggle.addEventListener("click", function () {
        const isDark = document.body.classList.contains("dark-mode");
        setTheme(isDark ? "light" : "dark");
    });
}


/* =========================================================
   12. NOTIFICATIONS
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

document.addEventListener("click", function (event) {
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


/* DISPLAY NOTIFICATIONS */

function displayNotifications(notifications) {
    if (!notificationList) return;

    notificationList.replaceChildren();

    if (!notifications || notifications.length === 0) {
        const empty = document.createElement("p");
        empty.className = "notification-empty";
        empty.textContent = "You have no notifications.";

        notificationList.appendChild(empty);
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
        title.textContent = notification.title || "Order update";

        const message = document.createElement("p");
        message.textContent =
            notification.message || "Your order has been updated.";

        const reference = document.createElement("small");
        reference.textContent = notification.order_id
            ? "Click to view related order"
            : "Order reference unavailable";

        const date = document.createElement("small");
        date.textContent = notification.created_at
            ? new Date(notification.created_at).toLocaleString(
                "en-GH",
                { timeZone: "Africa/Accra" }
            )
            : "";

        item.append(title, message, reference, date);

        item.addEventListener("click", async function () {
            if (!notificationUserId) return;

            item.disabled = true;

            try {
                if (!notification.is_read) {
                    const { error } = await notificationSupabase
                        .from("notifications")
                        .update({ is_read: true })
                        .eq("id", notification.id)
                        .eq("user_id", notificationUserId);

                    if (error) throw error;
                }

                if (notificationMenu) notificationMenu.hidden = true;

                if (notificationButton) {
                    notificationButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }

                if (!notification.order_id) {
                    showMessage(
                        "This notification has no linked order. Please contact the store."
                    );

                    await loadNotifications();
                    return;
                }

                const { data: userData, error: userError } =
                    await notificationSupabase.auth.getUser();

                if (userError) throw userError;

                if (!userData.user) {
                    window.location.href = "./login.html";
                    return;
                }

                const ordersSection = document.getElementById("myOrders");

                if (!ordersSection) {
                    throw new Error("The My Orders section was not found.");
                }

                ordersSection.hidden = false;
                ordersSection.style.display = "block";

                const profileMenu = document.getElementById("profileMenu");
                const profileButton = document.getElementById("profileButton");

                if (profileMenu) profileMenu.hidden = true;

                if (profileButton) {
                    profileButton.setAttribute("aria-expanded", "false");
                }

                ordersSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                await loadMyOrders(notification.order_id);
                await loadNotifications();

            } catch (error) {
                console.error("Notification error:", error);
                showMessage("Unable to open this order. Please try again.");

            } finally {
                item.disabled = false;
            }
        });

        notificationList.appendChild(item);
    });
}


/* UPDATE NOTIFICATION BADGE */

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


/* LOAD NOTIFICATIONS */

async function loadNotifications() {
    if (!notificationUserId || !notificationSupabase) return;

    const { data, error } = await notificationSupabase
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
                console.error("Could not mark notifications as read:", error);
                showMessage("Unable to update notifications. Please try again.");

            } finally {
                markAllNotificationsRead.disabled = false;
            }
        }
    );
}


/* START NOTIFICATION REALTIME */

async function startNotificationRealtime() {
    if (!notificationUserId) return;

    if (notificationChannel) {
        await notificationSupabase.removeChannel(notificationChannel);
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


/* INITIALIZE NOTIFICATIONS */

async function initializeNotifications() {
    if (!notificationSupabase) return;

    const { data, error } =
        await notificationSupabase.auth.getUser();

    if (error || !data.user) {
        notificationUserId = null;

        if (notificationChannel) {
            await notificationSupabase.removeChannel(notificationChannel);
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

if (notificationSupabase) {
    initializeNotifications();

    notificationSupabase.auth.onAuthStateChange(function (event) {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
            initializeNotifications();
        }
    });
}


/* =========================================================
   13. FINAL MESSAGE
========================================================= */

console.log(
    "SWEET'S KITCHEN & COLLECTIONS — Main JavaScript loaded successfully."
);
