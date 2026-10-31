/* =====================================================
   SWEET's KITCHEN & COLLECTIONS
   MAIN WEBSITE JAVASCRIPT
   Supabase + Cart + Search + Profile + Paystack
===================================================== */


/* =====================================================
   1. SUPABASE CONNECTION
===================================================== */

const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QN5w738LNyUrYy2X93M1OQ_md6F2xTN";

if (!window.supabase) {
    console.error("Supabase library is missing. Check your Supabase CDN script in HTML.");
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
       3. MOBILE MENU
    ================================================= */

    const menuButton = document.getElementById("menuButton");
    const navMenu = document.getElementById("nav");

    if (menuButton && navMenu) {
        menuButton.addEventListener("click", function () {
            navMenu.classList.toggle("show");

            const isOpen = navMenu.classList.contains("show");

            menuButton.setAttribute("aria-expanded", String(isOpen));
        });
    }


    /* =================================================
       4. SHOPPING CART ELEMENTS
    ================================================= */

    let cart = [];

    const cartOverlay = document.getElementById("cartOverlay");
    const cartItem = document.getElementById("cartItem");
    const cartButton = document.getElementById("cartButton");
    const closeCart = document.getElementById("closeCart");
    const cartTotal = document.getElementById("cartTotal");
    const cartCount = document.getElementById("cartCount");
    const checkoutButton = document.getElementById("checkoutButton");


    // Open cart
    if (cartButton && cartOverlay) {
        cartButton.addEventListener("click", function () {
            cartOverlay.classList.add("show");
        });
    }


    // Close cart
    if (closeCart && cartOverlay) {
        closeCart.addEventListener("click", function () {
            cartOverlay.classList.remove("show");
        });
    }


    /* =================================================
       5. UPDATE CART DISPLAY
    ================================================= */

    function updateCart() {

        if (!cartItem || !cartCount || !cartTotal) {
            console.error("One or more cart HTML elements are missing.");
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
            cartItemElement.classList.add("cart-item");

            const itemInfo = document.createElement("div");
            itemInfo.classList.add("cart-item-info");

            const itemName = document.createElement("h3");
            itemName.textContent = item.name;

            const itemPrice = document.createElement("p");
            itemPrice.textContent = "GH₵" + item.price.toLocaleString();

            itemInfo.appendChild(itemName);
            itemInfo.appendChild(itemPrice);


            const quantityControls = document.createElement("div");
            quantityControls.classList.add("quantity-controls");

            const decreaseButton = document.createElement("button");
            decreaseButton.type = "button";
            decreaseButton.className = "decrease";
            decreaseButton.dataset.index = index;
            decreaseButton.textContent = "−";
            decreaseButton.setAttribute(
                "aria-label",
                "Decrease " + item.name + " quantity"
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
                "Increase " + item.name + " quantity"
            );

            quantityControls.appendChild(decreaseButton);
            quantityControls.appendChild(quantityNumber);
            quantityControls.appendChild(increaseButton);


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
       6. ADD PRODUCTS TO CART
    ================================================= */

    const addCartButtons = document.querySelectorAll(".add-to-cart");

    addCartButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const name = button.dataset.name;
            const price = Number(button.dataset.price);

            if (!name || !Number.isFinite(price) || price < 0) {
                alert("This product has invalid information. Please contact the store.");
                return;
            }

            const existingProduct = cart.find(function (item) {
                return item.name === name;
            });

            if (existingProduct) {
                alert("This product is already in your cart. Use + or − to change the quantity.");
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


    /* =================================================
       7. CART QUANTITY AND REMOVE BUTTONS
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

            if (!Number.isInteger(index) || !cart[index]) {
                return;
            }


            // Increase quantity
            if (button.classList.contains("increase")) {

                cart[index].quantity++;

            }


            // Decrease quantity
            else if (button.classList.contains("decrease")) {

                cart[index].quantity--;

                if (cart[index].quantity <= 0) {

                    const removedProductName = cart[index].name;

                    cart.splice(index, 1);

                    restoreAddButton(removedProductName);
                }

            }


            // Remove product completely
            else if (button.classList.contains("remove-item")) {

                const removedProductName = cart[index].name;

                cart.splice(index, 1);

                restoreAddButton(removedProductName);
            }

            updateCart();

        });

    }


    // Restore Add to Cart button when product is removed
    function restoreAddButton(productName) {

        document.querySelectorAll(".add-to-cart").forEach(function (button) {

            if (button.dataset.name === productName) {

                button.disabled = false;
                button.textContent = "Add to Cart";

            }

        });

    }


    // Display the initial empty cart
    updateCart();


    /* =================================================
       8. PRODUCT SEARCH AND CATEGORY FILTERING
    ================================================= */

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    const categoryButtons = document.querySelectorAll(".category-btn");
    const productCards = document.querySelectorAll(".product-card");

    const productSection = document.getElementById("products");
    const productsGrid = document.getElementById("productsGrid");

    let selectedCategory = "all";


    // Create no-results message
    let searchMessage = document.getElementById("searchMessage");

    if (!searchMessage && productsGrid) {

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


    // Search button
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


    // Search while typing
    if (searchInput) {

        searchInput.addEventListener("input", filterProducts);


        // Search when Enter is pressed
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


    // Category buttons
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
       9. CUSTOMER PROFILE
    ================================================= */

    (function setupCustomerProfile() {

        const profileButton = document.getElementById("profileButton");
        const profileArea = document.getElementById("profileArea");
        const profileMenu = document.getElementById("profileMenu");

        const profileName = document.getElementById("profileName");
        const profileNameDisplay = document.getElementById("profileNameDisplay");
        const profileEmail = document.getElementById("profileEmail");

        const accountLink = document.getElementById("accountLink");
        const logoutButton = document.getElementById("logoutButton");


        if (!supabaseClient || !profileButton || !profileArea || !profileMenu) {

            console.warn("Customer profile was not initialized. Check the profile HTML IDs.");

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

            const fullName = user.user_metadata?.full_name || "";

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

            profileButton.setAttribute("aria-expanded", "false");

        }


        async function refreshProfile() {

            const { data, error } = await supabaseClient.auth.getUser();

            if (error || !data.user) {

                showSignedOut();

            } else {

                showSignedIn(data.user);

            }

        }


        // Profile button
        profileButton.addEventListener("click", async function (event) {

            event.preventDefault();
            event.stopPropagation();

            const { data, error } = await supabaseClient.auth.getUser();


            // Send signed-out customer to login page
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


        // Close profile menu when clicking outside
        document.addEventListener("click", function (event) {

            if (!profileArea.contains(event.target)) {
                closeProfileMenu();
            }

        });


        // Customer logout
        if (logoutButton) {

            logoutButton.addEventListener("click", async function (event) {

                event.preventDefault();
                event.stopPropagation();

                logoutButton.disabled = true;

                try {

                    const { error } = await supabaseClient.auth.signOut();

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

            });

        }


        // Listen for customer login/logout changes
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


    /* =================================================
       10. PAYSTACK CHECKOUT
    ================================================= */

    (function setupPaystackCheckout() {

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

            console.error("Checkout error: One or more required checkout HTML elements are missing.");

            return;
        }


        function closePaymentWindow() {

            paymentOverlay.style.display = "none";
            paymentOverlay.hidden = true;

        }


        // Open payment window
        checkoutButton.addEventListener("click", function (event) {

            event.preventDefault();

            if (cart.length === 0) {

                alert("Your cart is empty. Add a product before checkout.");

                return;
            }


            const subtotal = cart.reduce(function (sum, item) {

                return sum + (Number(item.price) * Number(item.quantity));

            }, 0);


            // Display estimate including the 1% fee shown in your existing checkout.
            // The Edge Function must calculate and verify the final payment amount.
            const total = subtotal + (subtotal * 0.01);


            paymentTotal.textContent = "GH₵" + total.toFixed(2);

            paymentReference.textContent =
                "Generated securely when checkout starts.";


            paymentNetwork.value = "";

            paymentOverlay.hidden = false;
            paymentOverlay.style.display = "flex";

        });


        // Start Paystack payment
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


            if (cart.length === 0) {

                alert("Your cart is empty.");

                return;
            }


            if (!supabaseClient) {

                alert("The payment service is not connected. Please refresh the page.");

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


                const { data, error } = await supabaseClient.functions.invoke(
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
                        "Payment connection failed. Check the browser console for details."
                    );

                }


                if (!data || !data.authorization_url) {

                    throw new Error(
                        data?.error || "Paystack did not return a payment link."
                    );

                }


                // Redirect customer to Paystack
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


        // Close payment window
        if (closePayment) {

            closePayment.addEventListener("click", closePaymentWindow);

        }


        if (closePaymentBottom) {

            closePaymentBottom.addEventListener("click", closePaymentWindow);

        }


        closePaymentWindow();

        console.log("Paystack checkout initialized.");

    })();


    /* =================================================
       11. MY ORDERS NAVIGATION
    ================================================= */

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


    console.log("SWEET's KITCHEN & COLLECTIONS website initialized.");

}


/* =====================================================
   12. START WEBSITE AFTER HTML IS READY
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
