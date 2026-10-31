
/* ==========================================
   SWEET'S KITCHEN & COLLECTIONS
   MAIN JAVASCRIPT
========================================== */

const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QN5w738LNyUrYy2X93M1OQ_md6F2xTN";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.sweetSupabase = supabaseClient;


/* ==========================================
   DARK AND LIGHT MODE
========================================== */

(function setupTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    const THEME_KEY = "sweetKitchenTheme";

    function applyTheme(theme) {
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

            themeToggle.setAttribute(
                "title",
                isDark ? "Switch to light mode" : "Switch to dark mode"
            );

            themeToggle.setAttribute("aria-pressed", String(isDark));
        }
    }

    // Restore the customer's previously selected theme.
    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem(THEME_KEY) || "light";
    } catch (error) {
        console.warn("Could not access saved theme:", error);
    }

    applyTheme(savedTheme);

    // Switch between dark and light mode.
    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const isCurrentlyDark =
                document.body.classList.contains("dark-mode");

            const newTheme = isCurrentlyDark ? "light" : "dark";

            applyTheme(newTheme);

            try {
                localStorage.setItem(THEME_KEY, newTheme);
            } catch (error) {
                console.warn("Could not save theme:", error);
            }
        });
    } else {
        console.warn("Theme button #themeToggle was not found.");
    }
})();


/* ==========================================
   MOBILE MENU
========================================== */

const menuButton = document.getElementById("menuButton");
const navMenu = document.getElementById("nav");

if (menuButton && navMenu) {
    menuButton.addEventListener("click", function () {
        navMenu.classList.toggle("show");

        const isOpen = navMenu.classList.contains("show");
        menuButton.setAttribute("aria-expanded", String(isOpen));
    });
}


/* ==========================================
   SHOPPING CART
========================================== */

let cart = [];

const cartOverlay = document.getElementById("cartOverlay");
const cartItem = document.getElementById("cartItem");
const checkoutButton = document.getElementById("checkoutButton");
const closeCart = document.getElementById("closeCart");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const cartButton = document.getElementById("cartButton");

if (cartButton && cartOverlay) {
    cartButton.addEventListener("click", function () {
        cartOverlay.classList.add("show");
    });
}

if (closeCart && cartOverlay) {
    closeCart.addEventListener("click", function () {
        cartOverlay.classList.remove("show");
    });
}


/* ==========================================
   ADD TO CART
========================================== */

const addCartButtons = document.querySelectorAll(".add-to-cart");

addCartButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const name = button.dataset.name;
        const price = Number(button.dataset.price);

        if (!name || !Number.isFinite(price)) {
            alert("This product has invalid information.");
            return;
        }

        const existingProduct = cart.find(function (item) {
            return item.name === name;
        });

        if (existingProduct) {
            alert(
                "This product is already in your cart. Use + or − in the cart to change the quantity."
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


/* ==========================================
   UPDATE CART
========================================== */

function updateCart() {
    if (!cartItem || !cartCount || !cartTotal) {
        console.error("Cart HTML elements are missing.");
        return;
    }

    cartItem.innerHTML = "";

    if (cart.length === 0) {
        cartItem.innerHTML = `
            <p class="empty-cart">Your cart is empty.</p>
        `;

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
        cartItemElement.classList.add("cart-item");

        cartItemElement.innerHTML = `
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>GH₵${item.price.toLocaleString()}</p>
            </div>

            <div class="quantity-controls">
                <button type="button"
                    class="decrease"
                    data-index="${index}"
                    aria-label="Decrease ${item.name} quantity">
                    −
                </button>

                <span>${item.quantity}</span>

                <button type="button"
                    class="increase"
                    data-index="${index}"
                    aria-label="Increase ${item.name} quantity">
                    +
                </button>
            </div>

            <button type="button"
                class="remove-item"
                data-index="${index}">
                Remove
            </button>
        `;

        cartItem.appendChild(cartItemElement);
    });

    cartCount.textContent = numberOfItems;
    cartTotal.textContent = "GH₵" + total.toLocaleString();
}


/* ==========================================
   CART QUANTITY AND REMOVE BUTTONS
========================================== */

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
                const removedProductName = cart[index].name;

                cart.splice(index, 1);

                document.querySelectorAll(".add-to-cart").forEach(
                    function (addButton) {
                        if (addButton.dataset.name === removedProductName) {
                            addButton.disabled = false;
                            addButton.textContent = "Add to Cart";
                        }
                    }
                );
            }
        }

        else if (button.classList.contains("remove-item")) {
            const removedProductName = cart[index].name;

            cart.splice(index, 1);

            document.querySelectorAll(".add-to-cart").forEach(
                function (addButton) {
                    if (addButton.dataset.name === removedProductName) {
                        addButton.disabled = false;
                        addButton.textContent = "Add to Cart";
                    }
                }
            );
        }

        updateCart();
    });
}


/* ==========================================
   SEARCH AND CATEGORY FILTERING
========================================== */

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const categoryButtons = document.querySelectorAll(".category-btn");
const productCards = document.querySelectorAll(".product-card");
const productSection = document.getElementById("products");
const productsGrid = document.getElementById("productsGrid");

let selectedCategory = "all";

let searchMessage = null;

if (productsGrid) {
    searchMessage = document.createElement("p");
    searchMessage.id = "searchMessage";
    searchMessage.textContent = "No matching products found.";
    searchMessage.style.textAlign = "center";
    searchMessage.style.padding = "20px";
    searchMessage.style.display = "none";

    productsGrid.insertAdjacentElement("afterend", searchMessage);
}

function filterProducts() {
    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    let matchingProducts = 0;

    productCards.forEach(function (card) {
        const productName = (
            card.dataset.name ||
            card.querySelector("h3")?.textContent ||
            ""
        ).toLowerCase();

        const headingName = (
            card.querySelector("h3")?.textContent || ""
        ).toLowerCase();

        const productCategory = (
            card.dataset.category || ""
        ).toLowerCase();

        const displayedCategory = (
            card.querySelector(".products-category")?.textContent || ""
        ).trim().toLowerCase();

        const matchesSearch =
            productName.includes(searchTerm) ||
            headingName.includes(searchTerm) ||
            productCategory.includes(searchTerm) ||
            displayedCategory.includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            productCategory === selectedCategory;

        if (matchesSearch && matchesCategory) {
            card.style.display = "";
            matchingProducts++;
        } else {
            card.style.display = "none";
        }
    });

    if (searchMessage) {
        searchMessage.style.display =
            matchingProducts === 0 ? "block" : "none";
    }
}

if (searchButton) {
    searchButton.addEventListener("click", function () {
        filterProducts();

        if (productSection) {
            productSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
}

if (searchInput) {
    searchInput.addEventListener("input", filterProducts);

    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            filterProducts();

            if (productSection) {
                productSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    });
}

categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        selectedCategory = (
            button.dataset.category || "all"
        ).toLowerCase();

        categoryButtons.forEach(function (categoryButton) {
            categoryButton.classList.remove("active");
        });

        button.classList.add("active");

        filterProducts();

        if (productSection) {
            productSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});


/* ==========================================
   CUSTOMER PROFILE
========================================== */

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


/* ==========================================
   PAYSTACK CHECKOUT
========================================== */

document.addEventListener("DOMContentLoaded", function () {
    const checkoutButton = document.getElementById("checkoutButton");
    const paymentOverlay = document.getElementById("paymentOverlay");
    const closePayment = document.getElementById("closePayment");
    const closePaymentBottom = document.getElementById("closePaymentBottom");
    const paymentNetwork = document.getElementById("paymentNetwork");
    const paymentTotal = document.getElementById("paymentTotal");
    const paymentReference = document.getElementById("paymentReference");

    const customerEmail = document.getElementById("customerEmail");
    const customerName = document.getElementById("customerName");
    const customerPhone = document.getElementById("customerPhone");
    const deliveryAddress = document.getElementById("deliveryAddress");
    const confirmButton = document.getElementById("confirmPaymentInstructions");

    if (
        !checkoutButton || !paymentOverlay || !paymentNetwork ||
        !paymentTotal || !paymentReference || !customerEmail ||
        !customerName || !customerPhone || !deliveryAddress ||
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

    checkoutButton.addEventListener("click", function (event) {
        event.preventDefault();

        if (!Array.isArray(cart) || cart.length === 0) {
            alert("Your cart is empty. Add a product before checkout.");
            return;
        }

        const subtotal = cart.reduce(function (sum, item) {
            return sum + Number(item.price) * Number(item.quantity);
        }, 0);

        const total = subtotal + subtotal * 0.01;

        paymentTotal.textContent = "GH₵" + total.toFixed(2);
        paymentReference.textContent =
            "Generated securely when checkout starts.";

        paymentNetwork.value = "";
        paymentOverlay.hidden = false;
        paymentOverlay.style.display = "flex";
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
                console.error("Error message:", error.message);
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
                    "Payment connection failed. Open F12 > Console to see the exact error."
                );
            }

            if (!data || !data.authorization_url) {
                throw new Error(
                    data?.error || "Paystack did not return a payment link."
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
        closePaymentBottom.addEventListener("click", closePaymentWindow);
    }

    closePaymentWindow();

    console.log("Paystack checkout initialized.");
});


/* ==========================================
   MY ORDERS MENU LINK
========================================== */

const myOrdersMenuLink = document.getElementById("myOrdersLink");
const myOrdersSectionElement = document.getElementById("myOrders");

if (myOrdersMenuLink && myOrdersSectionElement) {
    myOrdersMenuLink.addEventListener("click", function (event) {
        event.preventDefault();

        myOrdersSectionElement.hidden = false;
        myOrdersSectionElement.style.display = "block";

        myOrdersSectionElement.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}


/* ==========================================
   INITIALIZE CART
========================================== */

updateCart();

console.log("SWEET'S KITCHEN & COLLECTIONS is ready.");
