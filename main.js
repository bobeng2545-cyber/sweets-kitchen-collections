
/* =====================================================
   SWEET's KITCHEN & COLLECTIONS
   COMPLETE MAIN WEBSITE JAVASCRIPT

   Features:
   1. Supabase connection
   2. Dark and light mode
   3. Mobile navigation
   4. Shopping cart
   5. Add, increase, decrease and remove products
   6. Product search
   7. Category filtering
   8. Customer profile and logout
   9. Paystack checkout
   10. My Orders navigation
===================================================== */


/* =====================================================
   1. SUPABASE CONNECTION
===================================================== */

const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_QN5w738LNyUrYy2X93M1OQ_md6F2xTN";

if (!window.supabase) {
    console.error(
        "Supabase library is missing. Check your Supabase CDN script."
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
       4. MOBILE MENU
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

        // Close menu after clicking a navigation link.
        navMenu.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {

                navMenu.classList.remove("show");
                menuButton.setAttribute("aria-expanded", "false");

            });

        });

    }


    /* =================================================
       5. SHOPPING CART ELEMENTS
    ================================================= */

    let cart = [];

    const cartOverlay = document.getElementById("cartOverlay");
    const cartItem = document.getElementById("cartItem");
    const cartButton = document.getElementById("cartButton");
    const closeCart = document.getElementById("closeCart");
    const cartTotal = document.getElementById("cartTotal");
    const cartCount = document.getElementById("cartCount");
    const checkoutButton = document.getElementById("checkoutButton");


    // Open cart.
    if (cartButton && cartOverlay) {

        cartButton.addEventListener("click", function () {

            cartOverlay.classList.add("show");

        });

    }


    // Close cart.
    if (closeCart && cartOverlay) {

        closeCart.addEventListener("click", function () {

            cartOverlay.classList.remove("show");

        });

    }


    // Close cart when clicking outside its contents.
    if (cartOverlay) {

        cartOverlay.addEventListener("click", function (event) {

            if (event.target === cartOverlay) {
                cartOverlay.classList.remove("show");
            }

        });

    }


    /* =================================================
       6. UPDATE CART DISPLAY
    ================================================= */

    function updateCart() {

        if (!cartItem || !cartCount || !cartTotal) {

            console.error(
                "Cart HTML is missing. Check cartItem, cartCount and cartTotal."
            );

            return;
        }

        cartItem.innerHTML = "";

        if (cart.length === 0) {

            cartItem.innerHTML = `
                <p class="empty-cart">Your cart is empty.</p>
            `;

            cartCount.textContent = "0";
            cartTotal.textContent = "GH₵0.00";

            return;
        }

        let total = 0;
        let numberOfItems = 0;

        cart.forEach(function (item, index) {

            total += item.price * item.quantity;
            numberOfItems += item.quantity;

            const cartItemElement = document.createElement("div");
            cartItemElement.className = "cart-item";

            // Product information.
            const itemInfo = document.createElement("div");
            itemInfo.className = "cart-item-info";

            const itemName = document.createElement("h3");
            itemName.textContent = item.name;

            const itemPrice = document.createElement("p");
            itemPrice.textContent =
                "GH₵" + item.price.toLocaleString("en-GH");

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

        cartTotal.textContent = "GH₵" + total.toLocaleString(
            "en-GH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    }


    /* =================================================
       7. ADD PRODUCTS TO CART
    ================================================= */

    const addCartButtons = document.querySelectorAll(".add-to-cart");

    addCartButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const name = (button.dataset.name || "").trim();
            const price = Number(button.dataset.price);

            if (
                !name ||
                !Number.isFinite(price) ||
                price < 0
            ) {

                alert("This product has invalid information.");

                return;
            }


            // Match both name and price.
            // This allows two products with the same name but
            // different prices to be treated separately.

            const existingProduct = cart.find(function (item) {

                return (
                    item.name === name &&
                    item.price === price
                );

            });


            if (existingProduct) {

                existingProduct.quantity++;

            } else {

                cart.push({
                    name: name,
                    price: price,
                    quantity: 1
                });

            }


            updateCart();

            button.textContent = "Added to Cart";
            button.disabled = true;

        });

    });


    /* =================================================
       8. CART QUANTITY AND REMOVE BUTTONS
    ================================================= */

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


            // Increase quantity.
            if (button.classList.contains("increase")) {

                cart[index].quantity++;

            }


            // Decrease quantity.
            else if (button.classList.contains("decrease")) {

                cart[index].quantity--;

                if (cart[index].quantity <= 0) {

                    const removedItem = cart[index];

                    cart.splice(index, 1);

                    restoreAddButton(removedItem);

                }

            }


            // Remove product completely.
            else if (button.classList.contains("remove-item")) {

                const removedItem = cart[index];

                cart.splice(index, 1);

                restoreAddButton(removedItem);

            }

            updateCart();

        });

    }


    // Restore the Add to Cart button after removing a product.
    function restoreAddButton(removedItem) {

        document.querySelectorAll(".add-to-cart").forEach(
            function (button) {

                const name = (button.dataset.name || "").trim();
                const price = Number(button.dataset.price);

                if (
                    name === removedItem.name &&
                    price === removedItem.price
                ) {

                    button.disabled = false;
                    button.textContent = "Add to Cart";

                }

            }
        );

    }


    // Initial cart display.
    updateCart();


    /* =================================================
       9. PRODUCT SEARCH AND CATEGORY FILTERING
    ================================================= */

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    const categoryButtons =
        document.querySelectorAll(".category-btn");

    const productCards =
        document.querySelectorAll(".product-card");

    const productSection = document.getElementById("products");
    const productsGrid = document.getElementById("productsGrid");

    let selectedCategory = "all";


    // Create no-results message.
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
                card.querySelector(".products-category")?.textContent || ""
            ).trim().toLowerCase();


            const matchesSearch =
                productName.includes(searchTerm) ||
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


    // Search button.
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


    // Search while typing.
    if (searchInput) {

        searchInput.addEventListener("input", filterProducts);


        // Search when Enter is pressed.
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


    // Category buttons.
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


    /* =================================================
       10. CUSTOMER PROFILE
    ================================================= */

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


        if (
            !supabaseClient ||
            !profileButton ||
            !profileArea ||
            !profileMenu
        ) {

            console.warn(
                "Customer profile was not initialized. Check the profile HTML IDs."
            );

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


        // Open profile menu or redirect to login.
        profileButton.addEventListener(
            "click",
            async function (event) {

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

            }
        );


        // Close profile menu when clicking outside.
        document.addEventListener("click", function (event) {

            if (!profileArea.contains(event.target)) {

                closeProfileMenu();

            }

        });


        // Customer logout.
        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                async function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    logoutButton.disabled = true;

                    try {

                        const { error } =
                            await supabaseClient.auth.signOut();

                        if (error) {
                            throw error;
                        }

                        closeProfileMenu();
                        showSignedOut();

                        window.location.href = "./login.html";

                    } catch (error) {

                        console.error("Logout failed:", error);

                        alert("Unable to log out. Please try again.");

                    } finally {

                        logoutButton.disabled = false;

                    }

                }
            );

        }


        // Listen for login and logout changes.
        supabaseClient.auth.onAuthStateChange(
            function (_event, session) {

                if (session?.user) {

                    showSignedIn(session.user);

                } else {

                    showSignedOut();
                    closeProfileMenu();

                }

            }
        );


        refreshProfile();

    })();


    /* =================================================
       11. PAYSTACK CHECKOUT
    ================================================= */

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

            console.error(
                "Checkout error: One or more required checkout HTML elements are missing."
            );

            return;

        }


        function closePaymentWindow() {

            paymentOverlay.style.display = "none";
            paymentOverlay.hidden = true;

        }


        // Open payment window.
        checkoutButton.addEventListener("click", function (event) {

            event.preventDefault();

            if (cart.length === 0) {

                alert(
                    "Your cart is empty. Add a product before checkout."
                );

                return;

            }


            const subtotal = cart.reduce(function (sum, item) {

                return sum + (item.price * item.quantity);

            }, 0);


            // This is only the displayed estimate.
            // The Edge Function must calculate the final amount securely.
            const total = subtotal + (subtotal * 0.01);

            paymentTotal.textContent = "GH₵" + total.toFixed(2);

            paymentReference.textContent =
                "Generated securely when checkout starts.";

            paymentNetwork.value = "";

            paymentOverlay.hidden = false;
            paymentOverlay.style.display = "flex";

        });


        // Start Paystack payment.
        confirmButton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                // Validate customer information.
                if (
                    !customerEmail.value.trim() ||
                    !customerEmail.checkValidity() ||
                    !customerName.value.trim() ||
                    !customerPhone.value.trim() ||
                    !deliveryAddress.value.trim()
                ) {

                    alert(
                        "Please complete all customer details with a valid email."
                    );

                    return;

                }


                // Validate mobile money network.
                const network = paymentNetwork.value;

                if (!["mtn", "telecel", "at"].includes(network)) {

                    alert("Please select your Mobile Money network.");

                    return;

                }


                if (cart.length === 0) {

                    alert("Your cart is empty.");

                    return;

                }


                if (!supabaseClient) {

                    alert(
                        "The payment service is not connected. Please refresh the page."
                    );

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

                        console.error(
                            "Checkout function error:",
                            error
                        );

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
                            "Payment connection failed. Check the browser console for details."
                        );

                    }


                    if (!data || !data.authorization_url) {

                        throw new Error(
                            data?.error ||
                            "Paystack did not return a payment link."
                        );

                    }


                    // Redirect customer to Paystack.
                    window.location.href = data.authorization_url;


                } catch (error) {

                    console.error(
                        "Paystack checkout error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Payment could not start. Please try again."
                    );

                    confirmButton.disabled = false;
                    confirmButton.textContent = originalButtonText;

                }

            }
        );


        // Close payment window.
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


        closePaymentWindow();

        console.log("Paystack checkout initialized.");

    })();


    /* =================================================
       12. MY ORDERS NAVIGATION
    ================================================= */

    const myOrdersMenuLink =
        document.getElementById("myOrdersLink");

    const myOrdersSectionElement =
        document.getElementById("myOrders");


    if (myOrdersMenuLink && myOrdersSectionElement) {

        myOrdersMenuLink.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                myOrdersSectionElement.hidden = false;
                myOrdersSectionElement.style.display = "block";

                myOrdersSectionElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    }


    /* =================================================
       13. INITIALIZATION COMPLETE
    ================================================= */

    console.log(
        "SWEET's KITCHEN & COLLECTIONS website initialized successfully."
    );

}


/* =====================================================
   14. START WEBSITE AFTER HTML IS READY
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
