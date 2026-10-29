
const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QN5w738LNyUrYy2X93M1OQ_md6F2xTN";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.sweetSupabase = supabaseClient;


// Menu Icon

const menuButton = document.getElementById("menuButton");
const navMenu = document.getElementById("nav");

if (menuButton && navMenu) {
    menuButton.addEventListener("click", function () {
        navMenu.classList.toggle("show");

        const isOpen = navMenu.classList.contains("show");
        menuButton.setAttribute("aria-expanded", String(isOpen));
    });
}

let cart = [];

// Restore saved cart items when the page loads
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



cartButton.addEventListener("click", function(){
    cartOverlay.classList.add("show");
});

closeCart.addEventListener("click", function(){
    cartOverlay.classList.remove("show")
});


// Add to Cart Button 


const addCartButtons = document.querySelectorAll(".add-to-cart");

addCartButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        const name = button.dataset.name;
        const price = Number(button.dataset.price);

        // Check whether this product is already in the cart
        const existingProduct = cart.find(function(item) {
            return item.name === name;
        });

        if (existingProduct) {
            alert("This product is already in your cart. Use + or − in the cart to change the quantity.");
            return;
        }

        // Add the product only if it is not already in the cart
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });

        // Update cart count and total without opening the cart
        updateCart();

        // Change the button to show that the product is already added
        button.textContent = "Added to Cart";
        button.disabled = true;
    });
});




function updateCart() {
    // Save the latest cart
    localStorage.setItem(
        "sweetKitchenCart",
        JSON.stringify(cart)
    );

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

    cart.forEach(function(item, index) {
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


updateCart();

// Update product buttons for items restored from storage
document.querySelectorAll(".add-to-cart").forEach(function(button) {
    const alreadyAdded = cart.some(function(item) {
        return item.name === button.dataset.name;
    });

    if (alreadyAdded) {
        button.textContent = "Added to Cart";
        button.disabled = true;
    }
});


// Handle +, − and Remove clicks from the cart
// One listener is enough, even when the cart is re-rendered.
cartItem.addEventListener("click", function(event) {
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

    // Remove the item when its quantity reaches zero
    if (cart[index].quantity <= 0) {
        const removedProductName = cart[index].name;

        cart.splice(index, 1);

        // Re-enable the product's Add to Cart button
        document.querySelectorAll(".add-to-cart").forEach(function(addButton) {
            if (addButton.dataset.name === removedProductName) {
                addButton.disabled = false;
                addButton.textContent = "Add to Cart";
            }
        });
    }
}


    
else if (button.classList.contains("remove-item")) {
    const removedProductName = cart[index].name;

    cart.splice(index, 1);

    // Re-enable the product's Add to Cart button
    document.querySelectorAll(".add-to-cart").forEach(function(addButton) {
        if (addButton.dataset.name === removedProductName) {
            addButton.disabled = false;
            addButton.textContent = "Add to Cart";
        }
    });
}


    updateCart();
});


 

/* =========================================
   SEARCH AND CATEGORY FILTERING
   SWEET'S KITCHEN & COLLECTIONS
========================================= */

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
    if (!productsGrid) {
        console.error("Product grid #productsGrid was not found.");
        return;
    }

    const searchTerm = (searchInput?.value || "")
        .trim()
        .toLowerCase();

    // Query the grid each time so newly added cards are included.
    const productCards = productsGrid.querySelectorAll(".product-card");
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

        const shouldShow = matchesSearch && matchesCategory;

        card.style.display = shouldShow ? "" : "none";

        if (shouldShow) {
            matchingProducts++;
        }
    });

    if (searchMessage) {
        searchMessage.hidden = matchingProducts > 0;
    }

    console.log(
        "Products found:",
        productCards.length,
        "| Matching products:",
        matchingProducts,
        "| Category:",
        selectedCategory
    );
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

// Apply the default category when the page loads.
filterProducts();




/* CUSTOMER PROFILE — SINGLE EVENT SYSTEM */

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

    // Display the signed-out state
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

    // Display the signed-in customer's details
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

    // One click handler for the profile button
    profileButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const { data, error } = await authClient.auth.getUser();

        // Ask signed-out customers to sign in
        if (error || !data.user) {
            window.location.href = "./login.html";
            return;
        }

        // Toggle the menu only once
        const shouldOpen = profileMenu.hidden;

        profileMenu.hidden = !shouldOpen;
        profileButton.setAttribute(
            "aria-expanded",
            String(shouldOpen)
        );
    });

    // Close the menu only when clicking outside the profile area
    document.addEventListener("click", (event) => {
        if (!profileArea.contains(event.target)) {
            closeProfileMenu();
        }
    });

    // Log out the customer
    if (logoutButton) {
        logoutButton.addEventListener("click", async (event) => {
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

    // Update the profile when the authentication state changes
    authClient.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            showSignedIn(session.user);
        } else {
            showSignedOut();
            closeProfileMenu();
        }
    });

    await refreshProfile();
})();



/* ==================================
   PAYSTACK CHECKOUT
   SWEET's KITCHEN & COLLECTIONS
================================== */

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
        console.error("Checkout error: Required checkout HTML elements are missing.");
        return;
    }

    function closePaymentWindow() {
        paymentOverlay.style.display = "none";
        paymentOverlay.hidden = true;
    }

    
checkoutButton.addEventListener("click", async function (event) {
    event.preventDefault();

    // First, check whether the cart contains products
    if (!Array.isArray(cart) || cart.length === 0) {
        alert("Your cart is empty. Add a product before checkout.");
        return;
    }

    // Check the customer's Supabase sign-in status
    const { data, error } = await window.sweetSupabase.auth.getUser();

    if (error || !data.user) {
        // Save the cart so it can be restored after sign-in
        localStorage.setItem("sweetKitchenCart", JSON.stringify(cart));

        // Redirect the customer to the existing login page
        window.location.href = "./login.html?redirect=checkout";
        return;
    }

    // Continue checkout for signed-in customers
    const subtotal = cart.reduce((sum, item) => {
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

        if (!customerEmail.value.trim() ||
            !customerEmail.checkValidity() ||
            !customerName.value.trim() ||
            !customerPhone.value.trim() ||
            !deliveryAddress.value.trim()) {
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
            const items = cart.map(item => ({
                name: String(item.name),
                quantity: Number(item.quantity)
            }));

            const { data, error } = await window.sweetSupabase.functions.invoke(
                "initialize-paystack",
                {
                    body: {
                        action: "initialize",
                        email: customerEmail.value.trim(),
                        customerName: customerName.value.trim(),
                        customerPhone: customerPhone.value.trim(),
                        deliveryAddress: deliveryAddress.value.trim(),
                        network,
                        items
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
            console.error("Could not read server response:", readError);
        }
    }

    throw new Error(
        "Payment connection failed. Open F12 > Console to see the exact error."
    );
}


            if (!data || !data.authorization_url) {
                throw new Error(data?.error || "Paystack did not return a payment link.");
            }

            // Redirect the customer to Paystack's secure payment page.
            window.location.href = data.authorization_url;

        } catch (error) {
            console.error("Paystack checkout error:", error);
            alert(error.message || "Payment could not start. Please try again.");
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

/* ==================================
   VERIFY PAYSTACK PAYMENT ON RETURN
================================== */

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
            throw new Error("We could not verify your payment. Please contact the store before trying again.");
        }

        if (!data || data.paid !== true) {
            alert(
                data?.message ||
                data?.error ||
                "Payment has not been confirmed. Please do not pay again until you check your transaction."
            );
            return;
        }

        // Clear the cart only after payment is verified.
        cart = [];
        localStorage.removeItem("sweetKitchenCart");
        updateCart();

        alert("Payment verified successfully! Your order has been paid.");

        // Remove payment parameters from the address bar.
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    } catch (error) {
        console.error("Payment return verification failed:", error);
        alert(error.message || "Payment verification failed. Please contact the store.");
    }
})();

        

/* ============================================
   MY ORDERS — CUSTOMER ORDER HISTORY
   SWEET'S KITCHEN & COLLECTIONS
============================================ */

async function loadMyOrders() {
    const myOrdersList = document.getElementById("myOrdersList");
    const ordersMessage = document.getElementById("ordersMessage");
    const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");

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
        // 1. Get the signed-in customer.
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) {
            throw userError;
        }

        const user = userData.user;

        if (!user) {
            if (ordersMessage) {
                ordersMessage.textContent =
                    "Please sign in to view your orders.";
            }
            return;
        }

        // 2. Retrieve this customer's orders.
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
            .order("id", { ascending: false });

        if (error) {
            throw error;
        }

        // 3. Handle customers with no orders.
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

        // 4. Display each order.
        orders.forEach(function (order) {
            const card = document.createElement("article");
            card.className = "order-card";

            // Order heading.
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

            // Order status badge.
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

            // Divider.
            const divider = document.createElement("div");
            divider.className = "order-card-divider";

            // Order total.
            const totalBlock = document.createElement("div");
            totalBlock.className = "order-total-block";

            const totalLabel = document.createElement("p");
            totalLabel.className = "order-total-label";
            totalLabel.textContent = "ORDER TOTAL";

            const total = document.createElement("strong");
            total.className = "order-total";

            const totalAmount = Number(order.total_amount);

            total.textContent = Number.isFinite(totalAmount)
                ? "GH₵ " + totalAmount.toLocaleString("en-GH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
                : "Amount unavailable";

            totalBlock.append(totalLabel, total);

            // Order details.
            const details = document.createElement("div");
            details.className = "order-details";

            function addOrderDetail(labelText, valueText, extraClass = "") {
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
                details.appendChild(row);
            }

            function formatMoney(value) {
                const amount = Number(value);

                if (!Number.isFinite(amount)) {
                    return "Unavailable";
                }

                return "GH₵ " + amount.toLocaleString("en-GH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

            // Payment status.
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
                "Payment status",
                paymentStatus,
                paymentClass
            );

            addOrderDetail(
                "Payment network",
                order.payment_network || "Not specified"
            );

            if (
                order.subtotal !== null &&
                order.subtotal !== undefined
            ) {
                addOrderDetail(
                    "Subtotal",
                    formatMoney(order.subtotal)
                );
            }

            if (
                order.service_charge !== null &&
                order.service_charge !== undefined
            ) {
                addOrderDetail(
                    "Service charge",
                    formatMoney(order.service_charge)
                );
            }

            card.append(
                header,
                divider,
                totalBlock,
                details
            );

            myOrdersList.appendChild(card);
        });

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


/* ============================================
   REFRESH ORDERS BUTTON
============================================ */

const refreshOrdersBtn =
    document.getElementById("refreshOrdersBtn");

if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener("click", loadMyOrders);
}


/* ============================================
   OPEN MY ORDERS
============================================ */

const myOrdersLink = document.getElementById("myOrdersLink");
const myOrdersSection = document.getElementById("myOrders");

if (myOrdersLink && myOrdersSection) {
    myOrdersLink.addEventListener("click", function (event) {
        event.preventDefault();

        myOrdersSection.hidden = false;
        myOrdersSection.style.display = "block";

        myOrdersSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        loadMyOrders();
    });
}

