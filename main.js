
/* =====================================================
   SWEET's KITCHEN & COLLECTIONS
   COMPLETE MAIN WEBSITE JAVASCRIPT
   Corrected replacement: main.js

   FEATURES
   1. Supabase connection
   2. Dark and light mode
   3. Mobile navigation
   4. Shopping cart
   5. Add, increase, decrease and remove products
   6. Product search
   7. Category filtering
   8. Customer profile and logout
   9. Paystack checkout preparation
   10. My Orders navigation
===================================================== */


/* =====================================================
   1. SUPABASE CONNECTION
===================================================== */

const SUPABASE_URL =
    "https://vbrlprrbtumonmroybdv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_QN5w738LNyUrYy2X93M1OQ_md6F2xTN";

if (!window.supabase) {
    console.error(
        "Supabase library is missing. Check the Supabase CDN script."
    );
} else {
    window.sweetSupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
}


/* =====================================================
   2. MAIN WEBSITE INITIALIZATION
===================================================== */

function initializeSweetWebsite() {

    if (window.sweetWebsiteInitialized) return;
    window.sweetWebsiteInitialized = true;

    const supabaseClient = window.sweetSupabase;


    /* =================================================
       3. DARK AND LIGHT MODE
    ================================================= */

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    function applyTheme(theme) {

        const isDark = theme === "dark";

        document.body.classList.toggle("dark-mode", isDark);

        if (themeIcon) {
            themeIcon.textContent = isDark
                ? "light_mode"
                : "dark_mode";
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

        }
    }

    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem("sweetTheme") || "light";
    } catch (error) {
        console.warn("Could not load saved theme:", error);
    }

    applyTheme(savedTheme);

    if (themeToggle) {

        themeToggle.addEventListener("click", function () {

            const isDark =
                document.body.classList.contains("dark-mode");

            const newTheme = isDark ? "light" : "dark";

            applyTheme(newTheme);

            try {
                localStorage.setItem("sweetTheme", newTheme);
            } catch (error) {
                console.warn("Could not save theme:", error);
            }

        });

    }


    /* =================================================
       4. MOBILE NAVIGATION
    ================================================= */

    const menuButton = document.getElementById("menuButton");
    const navMenu = document.getElementById("nav");

    if (menuButton && navMenu) {

        menuButton.setAttribute("aria-expanded", "false");

        menuButton.addEventListener("click", function () {

            navMenu.classList.toggle("show");

            const isOpen = navMenu.classList.contains("show");

            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        });

        navMenu.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {

                navMenu.classList.remove("show");

                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });

    }


    /* =================================================
       5. SHOPPING CART
    ================================================= */

    let cart = [];

    const cartOverlay = document.getElementById("cartOverlay");
    const cartItem = document.getElementById("cartItem");
    const cartButton = document.getElementById("cartButton");
    const closeCart = document.getElementById("closeCart");
    const cartTotal = document.getElementById("cartTotal");
    const cartCount = document.getElementById("cartCount");
    const checkoutButton = document.getElementById("checkoutButton");


    function openCart() {

        if (cartOverlay) {
            cartOverlay.classList.add("show");
        }

    }

    function closeCartWindow() {

        if (cartOverlay) {
            cartOverlay.classList.remove("show");
        }

    }

    if (cartButton) {
        cartButton.addEventListener("click", openCart);
    }

    if (closeCart) {
        closeCart.addEventListener("click", closeCartWindow);
    }

    if (cartOverlay) {

        cartOverlay.addEventListener("click", function (event) {

            if (event.target === cartOverlay) {
                closeCartWindow();
            }

        });

    }

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeCartWindow();
        }

    });


    /* =================================================
       6. CURRENCY FORMATTER
    ================================================= */

    function formatMoney(amount) {

        return "GH₵" + Number(amount).toLocaleString("en-GH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    }


    /* =================================================
       7. UPDATE CART DISPLAY
    ================================================= */

    function updateCart() {

        if (!cartItem || !cartCount || !cartTotal) {

            console.error(
                "Cart HTML is incomplete. Check cartItem, cartCount and cartTotal."
            );

            return;

        }

        cartItem.innerHTML = "";

        if (cart.length === 0) {

            const emptyMessage = document.createElement("p");

            emptyMessage.className = "empty-cart";
            emptyMessage.textContent = "Your cart is empty.";

            cartItem.appendChild(emptyMessage);

            cartCount.textContent = "0";
            cartTotal.textContent = formatMoney(0);

            if (checkoutButton) {
                checkoutButton.disabled = true;
            }

            return;

        }

        let total = 0;
        let numberOfItems = 0;

        cart.forEach(function (item, index) {

            total += item.price * item.quantity;
            numberOfItems += item.quantity;

            const cartItemElement = document.createElement("div");
            cartItemElement.className = "cart-item";

            const itemInfo = document.createElement("div");
            itemInfo.className = "cart-item-info";

            const itemName = document.createElement("h3");
            itemName.textContent = item.name;

            const itemPrice = document.createElement("p");
            itemPrice.textContent = formatMoney(item.price);

            itemInfo.appendChild(itemName);
            itemInfo.appendChild(itemPrice);


            // Quantity controls.

            const quantityControls = document.createElement("div");
            quantityControls.className = "quantity-controls";

            const decreaseButton = document.createElement("button");
            decreaseButton.type = "button";
            decreaseButton.className = "decrease";
            decreaseButton.dataset.index = index;
            decreaseButton.textContent = "−";
            decreaseButton.setAttribute(
                "aria-label",
                "Decrease quantity"
            );

            const quantityNumber = document.createElement("span");
            quantityNumber.textContent = item.quantity;

            const increaseButton = document.createElement("button");
            increaseButton.type = "button";
            increaseButton.className = "increase";
            increaseButton.dataset.index = index;
            increaseButton.textContent = "+";
            increaseButton.setAttribute(
                "aria-label",
                "Increase quantity"
            );

            quantityControls.appendChild(decreaseButton);
            quantityControls.appendChild(quantityNumber);
            quantityControls.appendChild(increaseButton);


            // Remove button.

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-item";
            removeButton.dataset.index = index;
            removeButton.textContent = "Remove";


            cartItemElement.appendChild(itemInfo);
            cartItemElement.appendChild(quantityControls);
            cartItemElement.appendChild(removeButton);

            cartItem.appendChild(cartItemElement);

        });

        cartCount.textContent = numberOfItems;
        cartTotal.textContent = formatMoney(total);

        if (checkoutButton) {
            checkoutButton.disabled = false;
        }

    }


    /* =====================================================
       8. ADD PRODUCTS TO CART
    ===================================================== */

    function addProductToCart(button) {

        const name = (button.dataset.name || "").trim();

        const price = Number(button.dataset.price);

        // Product ID will be required for database checkout.
        // Supports either data-product-id or data-id.

        const productId =
            button.dataset.productId ||
            button.dataset.id ||
            null;

        if (
            !name ||
            !Number.isFinite(price) ||
            price <= 0
        ) {

            alert("This product has invalid information.");
            return;

        }

        // A product with no ID can still be added to the cart.
        // However, it cannot be checked out until connected
        // to a real Supabase product record.

        const existingProduct = cart.find(function (item) {

            if (productId && item.productId) {
                return item.productId === productId;
            }

            return (
                !productId &&
                !item.productId &&
                item.name === name &&
                item.price === price
            );

        });

        if (existingProduct) {

            existingProduct.quantity++;

        } else {

            cart.push({

                productId: productId,
                name: name,
                price: price,
                quantity: 1

            });

        }

        updateCart();

        const originalText =
            button.dataset.originalText || "Add to Cart";

        button.dataset.originalText = originalText;
        button.textContent = "Added to Cart";

        // Do not disable the button. Customers can add more.

        window.setTimeout(function () {

            button.textContent = originalText;

        }, 1000);

    }


    // Event delegation also supports products loaded later.

    document.addEventListener("click", function (event) {

        const button = event.target.closest(".add-to-cart");

        if (!button) return;

        addProductToCart(button);

    });


    /* =====================================================
       9. CART QUANTITY AND REMOVE BUTTONS
    ===================================================== */

    if (cartItem) {

        cartItem.addEventListener("click", function (event) {

            const button = event.target.closest(
                ".increase, .decrease, .remove-item"
            );

            if (!button || !cartItem.contains(button)) {
                return;
            }

            const index = Number(button.dataset.index);

            if (
                !Number.isInteger(index) ||
                !cart[index]
            ) {
                return;
            }

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

    updateCart();


    /* =====================================================
       10. PRODUCT SEARCH AND CATEGORY FILTERING
    ===================================================== */

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    const categoryButtons =
        document.querySelectorAll(".category-btn");

    const productSection = document.getElementById("products");
    const productsGrid = document.getElementById("productsGrid");

    let selectedCategory = "all";

    let searchMessage = document.getElementById("searchMessage");

    if (!searchMessage && productsGrid) {

        searchMessage = document.createElement("p");

        searchMessage.id = "searchMessage";
        searchMessage.textContent = "No matching products found.";
        searchMessage.style.textAlign = "center";
        searchMessage.style.padding = "20px";
        searchMessage.style.display = "none";

        productsGrid.insertAdjacentElement(
            "afterend",
            searchMessage
        );

    }


    function filterProducts() {

        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        // Get cards each time so newly loaded products are included.

        const productCards =
            document.querySelectorAll(".product-card");

        let matchingProducts = 0;

        productCards.forEach(function (card) {

            const productName = (
                card.dataset.name ||
                card.querySelector("h3")?.textContent ||
                ""
            ).toLowerCase();

            const productCategory = (
                card.dataset.category || ""
            ).toLowerCase();

            const displayedCategory = (
                card.querySelector(".products-category")?.textContent ||
                ""
            ).trim().toLowerCase();

            const matchesSearch =
                productName.includes(searchTerm) ||
                productCategory.includes(searchTerm) ||
                displayedCategory.includes(searchTerm);

            const matchesCategory =
                selectedCategory === "all" ||
                productCategory === selectedCategory ||
                displayedCategory === selectedCategory;

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


    function searchAndScroll() {

        filterProducts();

        if (productSection) {

            productSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }

    if (searchButton) {
        searchButton.addEventListener("click", searchAndScroll);
    }

    if (searchInput) {

        searchInput.addEventListener("input", filterProducts);

        searchInput.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {

                event.preventDefault();
                searchAndScroll();

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

            if (productSection) {

                productSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    /* =====================================================
       11. CUSTOMER PROFILE
    ===================================================== */

    (function setupCustomerProfile() {

        const profileButton =
            document.getElementById("profileButton");

        const profileArea =
            document.getElementById("profileArea");

        const profileMenu =
            document.getElementById("profileMenu");

        const profileName =
            document.getElementById("profileName");

        const profileNameDisplay =
            document.getElementById("profileNameDisplay");

        const profileEmail =
            document.getElementById("profileEmail");

        const accountLink =
            document.getElementById("accountLink");

        const logoutButton =
            document.getElementById("logoutButton");


        if (!supabaseClient) {
            console.warn("Supabase is unavailable. Customer profile is disabled.");
            return;
        }

        if (!profileButton || !profileArea || !profileMenu) {
            console.warn("Customer profile HTML elements were not found.");
            return;
        }


        function showSignedOut() {

            if (profileName) {
                profileName.textContent = "Sign in";
            }

            if (profileNameDisplay) {
                profileNameDisplay.textContent = "My Account";
            }

            if (profileEmail) {
                profileEmail.textContent = "";
            }

            if (accountLink) {

                accountLink.hidden = false;
                accountLink.textContent = "My Account";
                accountLink.href = "./account.html";

            }

            if (logoutButton) {
                logoutButton.hidden = true;
            }

        }


        function showSignedIn(user) {

            const fullName =
                user.user_metadata?.full_name || "";

            const firstName =
                fullName.trim().split(/\s+/)[0] ||
                user.email?.split("@")[0] ||
                "Customer";

            if (profileName) {
                profileName.textContent = firstName;
            }

            if (profileNameDisplay) {
                profileNameDisplay.textContent = firstName;
            }

            if (profileEmail) {
                profileEmail.textContent = user.email || "";
            }

            if (accountLink) {
                accountLink.hidden = true;
            }

            if (logoutButton) {
                logoutButton.hidden = false;
            }

        }


        function closeProfileMenu() {

            profileMenu.hidden = true;

            profileButton.setAttribute(
                "aria-expanded",
                "false"
            );

        }


        async function refreshProfile() {

            try {

                const { data, error } =
                    await supabaseClient.auth.getUser();

                if (error || !data.user) {

                    showSignedOut();

                } else {

                    showSignedIn(data.user);

                }

            } catch (error) {

                console.error("Profile loading failed:", error);
                showSignedOut();

            }

        }


        profileButton.setAttribute("aria-expanded", "false");

        profileButton.addEventListener("click", async function (event) {

            event.preventDefault();
            event.stopPropagation();

            try {

                const { data, error } =
                    await supabaseClient.auth.getUser();

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

            } catch (error) {

                console.error("Could not check customer login:", error);

                alert("Unable to check your account. Please try again.");

            }

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

                    const { error } =
                        await supabaseClient.auth.signOut();

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


        supabaseClient.auth.onAuthStateChange(function (_event, session) {

            if (session?.user) {

                showSignedIn(session.user);

            } else {

                showSignedOut();
                closeProfileMenu();

            }

        });

        refreshProfile();

    })();


    /* =====================================================
       12. PAYSTACK CHECKOUT
    ===================================================== */

    (function setupPaystackCheckout() {

        const paymentOverlay =
            document.getElementById("paymentOverlay");

        const closePayment =
            document.getElementById("closePayment");

        const closePaymentBottom =
            document.getElementById("closePaymentBottom");

        const paymentNetwork =
            document.getElementById("paymentNetwork");

        const paymentTotal =
            document.getElementById("paymentTotal");

        const paymentReference =
            document.getElementById("paymentReference");

        const customerEmail =
            document.getElementById("customerEmail");

        const customerName =
            document.getElementById("customerName");

        const customerPhone =
            document.getElementById("customerPhone");

        const deliveryAddress =
            document.getElementById("deliveryAddress");

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

            console.warn(
                "Checkout is unavailable because some payment HTML elements are missing."
            );

            return;

        }


        function closePaymentWindow() {

            paymentOverlay.style.display = "none";
            paymentOverlay.hidden = true;

        }


        function openPaymentWindow() {

            if (cart.length === 0) {

                alert("Your cart is empty. Add products before checkout.");
                return;

            }

            const subtotal = cart.reduce(function (sum, item) {

                return sum + item.price * item.quantity;

            }, 0);

            // Display estimate only.
            // The server must calculate the actual amount.

            const estimatedTotal = subtotal * 1.01;

            paymentTotal.textContent = formatMoney(estimatedTotal);

            paymentReference.textContent =
                "Generated securely when checkout starts.";

            paymentNetwork.value = "";

            paymentOverlay.hidden = false;
            paymentOverlay.style.display = "flex";

        }


        checkoutButton.addEventListener("click", function (event) {

            event.preventDefault();
            openPaymentWindow();

        });


        confirmButton.addEventListener("click", async function (event) {

            event.preventDefault();

            if (!supabaseClient) {

                alert("Payment service is unavailable. Please refresh the page.");
                return;

            }


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


            if (cart.length === 0) {

                alert("Your cart is empty.");
                return;

            }


            // Every product must have a real database ID.
            // This prevents the payment server from relying on
            // customer-supplied product names or browser prices.

            const missingProductId = cart.some(function (item) {

                return !item.productId;

            });

            if (missingProductId) {

                alert(
                    "Checkout is not ready yet. Some products are not connected to the Supabase product database. Please contact the store administrator."
                );

                console.error(
                    "Checkout blocked: one or more cart products have no Supabase product ID."
                );

                return;

            }


            const originalButtonText = confirmButton.textContent;

            confirmButton.disabled = true;
            confirmButton.textContent = "Connecting to Paystack...";


            try {

                const items = cart.map(function (item) {

                    return {
                        productId: item.productId,
                        quantity: Number(item.quantity)
                    };

                });


                const { data, error } =
                    await supabaseClient.functions.invoke(
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
                        "Payment could not be initialized. The payment server may not have been deployed yet."
                    );

                }


                if (!data || !data.authorization_url) {

                    throw new Error(
                        data?.error || "Paystack did not return a payment link."
                    );

                }


                // Redirect to Paystack only after the server
                // successfully returns a payment authorization URL.

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

            closePayment.addEventListener(
                "click",
                closePaymentWindow
            );

        }

        if (closePaymentBottom) {

            closePaymentBottom.addEventListener(
                "click",
                closePaymentWindow
            );

        }

        paymentOverlay.addEventListener("click", function (event) {

            if (event.target === paymentOverlay) {
                closePaymentWindow();
            }

        });

        closePaymentWindow();

        console.log("Checkout interface initialized.");

    })();


    /* =====================================================
       13. MY ORDERS NAVIGATION
    ===================================================== */

    const myOrdersMenuLink =
        document.getElementById("myOrdersLink");

    const myOrdersSectionElement =
        document.getElementById("myOrders");

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


    /* =====================================================
       14. INITIALIZATION COMPLETE
    ===================================================== */

    console.log(
        "SWEET's KITCHEN & COLLECTIONS website initialized successfully."
    );

}


/* =====================================================
   15. START WEBSITE AFTER HTML IS READY
===================================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSweetWebsite,
        { once: true }
    );

} else {

    initializeSweetWebsite();

}
