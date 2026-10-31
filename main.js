
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


 // SEARCH AND CATEGORY FILTERING

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const categoryButtons = document.querySelectorAll(".category-btn");
const productCards = document.querySelectorAll(".product-card");
const productSection = document.getElementById("products");
const productsGrid = document.getElementById("productsGrid");

// The currently selected category
let selectedCategory = "all";

// Message displayed when no products match
const searchMessage = document.createElement("p");
searchMessage.id = "searchMessage";
searchMessage.textContent = "No matching products found.";
searchMessage.style.textAlign = "center";
searchMessage.style.padding = "20px";
searchMessage.style.display = "none";

productsGrid.insertAdjacentElement("afterend", searchMessage);

// Search products and apply the selected category together
function filterProducts() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    let matchingProducts = 0;

    productCards.forEach(function(card) {
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

        // Search product names and categories
        const matchesSearch =
            productName.includes(searchTerm) ||
            headingName.includes(searchTerm) ||
            productCategory.includes(searchTerm) ||
            displayedCategory.includes(searchTerm);

        // Check the selected category
        const matchesCategory =
            selectedCategory === "all" ||
            productCategory === selectedCategory;

        // Show only products matching BOTH conditions
        if (matchesSearch && matchesCategory) {
            card.style.display = "";
            matchingProducts++;
        } else {
            card.style.display = "none";
        }
    });

    // Show a message if no products match
    searchMessage.style.display =
        matchingProducts === 0 ? "block" : "none";
}

// Search button
searchButton.addEventListener("click", function() {
    filterProducts();

    productSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

// Search immediately while typing
searchInput.addEventListener("input", filterProducts);

// Allow customers to press Enter to search
searchInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        filterProducts();

        productSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
});

// Category buttons
categoryButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        selectedCategory = (
            button.dataset.category || "all"
        ).toLowerCase();

        // Update the active category button
        categoryButtons.forEach(function(categoryButton) {
            categoryButton.classList.remove("active");
        });

        button.classList.add("active");

        // Keep the search term when changing categories
        filterProducts();

        productSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});


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

    checkoutButton.addEventListener("click", function (event) {
        event.preventDefault();

        if (!Array.isArray(cart) || cart.length === 0) {
            alert("Your cart is empty. Add a product before checkout.");
            return;
        }

        const subtotal = cart.reduce((sum, item) => {
            return sum + Number(item.price) * Number(item.quantity);
        }, 0);

        const total = subtotal + subtotal * 0.01;

        paymentTotal.textContent = "GH₵" + total.toFixed(2);
        paymentReference.textContent = "Generated securely when checkout starts.";

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
