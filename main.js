/* =====================================================
   SWEET's KITCHEN & COLLECTIONS
   COMPLETE MAIN WEBSITE JAVASCRIPT

   FEATURES
   1. Supabase connection
   2. Dark and light mode
   3. Mobile navigation
   4. Shopping cart
   5. Add, increase, decrease and remove products
   6. Product search
   7. Category filtering
   8. Customer profile and logout
   9. Paystack checkout
   10. Secure notification token storage
   11. My Orders navigation
   12. Separate Flash Sale section
===================================================== */


/* =====================================================
   1. SUPABASE CONNECTION
===================================================== */

const SUPABASE_URL =
    "https://vbrlprrbtumonmroybdv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_jOGj9C6m_fFryLL8yrcQmw_5wyZoidy";

if (!window.supabase) {
    console.error(
        "Supabase library is missing. Check the Supabase CDN script."
    );
} else {
    window.sweetSupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
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
       3. CURRENCY FORMATTER
    ================================================= */

    function formatMoney(amount) {

        const value = Number(amount);

        if (!Number.isFinite(value)) {
            return "GH₵0.00";
        }

        return "GH₵" + value.toLocaleString("en-GH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

   
/* ======================================
   PRODUCT STOCK DISPLAY
====================================== */

function createStockDisplay(stock) {
    const stockElement = document.createElement("p");
    stockElement.className = "product-stock";

    if (stock === null || stock === undefined || stock === "") {
        stockElement.textContent = "Stock information unavailable";
        stockElement.classList.add("stock-unavailable");
        return stockElement;
    }

    const quantity = Number(stock);

    if (!Number.isFinite(quantity) || quantity < 0) {
        stockElement.textContent = "Stock information unavailable";
        stockElement.classList.add("stock-unavailable");
    } else if (quantity === 0) {
        stockElement.textContent = "Out of stock";
        stockElement.classList.add("out-of-stock");
    } else if (quantity <= 5) {
        stockElement.textContent = `Low stock: ${quantity} left`;
        stockElement.classList.add("low-stock");
    } else {
        stockElement.textContent = `Available: ${quantity}`;
        stockElement.classList.add("in-stock");
    }

    return stockElement;
}



    /* =================================================
       4. CONNECT SUPABASE PRODUCT IDS
    ================================================= */

    

async function connectStoreProductIds() {
    if (!supabaseClient) {
        console.error("Supabase connection is unavailable.");
        return;
    }

    const { data, error } = await supabaseClient
        .from("store_products")
        .select("id, name, description, price, category, image_url, stock, is_new_arrival")
        .eq("is_active", true);

    if (error) {
        console.error("Could not load store products:", error);
        throw error;
    }

    const productsGrid = document.getElementById("productsGrid");

    if (!productsGrid) {
        console.error("Products grid was not found.");
        return;
    }

    const products = data || [];

    function normalize(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    }

   // ======================================
// DISPLAY PRODUCT STOCK QUANTITY
// ======================================

function createStockDisplay(stock) {
    const stockElement = document.createElement("p");
    stockElement.className = "product-stock";

    if (stock === null || stock === undefined || stock === "") {
        stockElement.textContent = "Stock information unavailable";
        stockElement.classList.add("stock-unavailable");
        return stockElement;
    }

    const quantity = Number(stock);

    if (!Number.isFinite(quantity) || quantity < 0) {
        stockElement.textContent = "Stock information unavailable";
        stockElement.classList.add("stock-unavailable");
    } else if (quantity === 0) {
        stockElement.textContent = "Out of stock";
        stockElement.classList.add("out-of-stock");
    } else if (quantity <= 5) {
        stockElement.textContent = `Low stock: ${quantity} left`;
        stockElement.classList.add("low-stock");
    } else {
        stockElement.textContent = `Available: ${quantity}`;
        stockElement.classList.add("in-stock");
    }

    return stockElement;
}


function updateProductStock(card, stock) {
    let stockElement = card.querySelector(".product-stock");

    if (!stockElement) {
        stockElement = document.createElement("p");
        stockElement.className = "product-stock";

        const description = card.querySelector(".product-description");
        const productInfo = card.querySelector(".product-info");

        if (description) {
            description.insertAdjacentElement(
                "afterend",
                stockElement
            );
        } else if (productInfo) {
            productInfo.appendChild(stockElement);
        } else {
            card.appendChild(stockElement);
        }
    }

    const updatedStock = createStockDisplay(stock);

    stockElement.textContent = updatedStock.textContent;
    stockElement.className = updatedStock.className;
}


    // Permanent connections for the six existing HTML product cards.
    const PRODUCT_CARD_IDS = {
        airfryer: "7ae8e8dd-00f5-48e5-94ce-d0c495996168",
        blender: "bba08aa0-d7b7-4678-bf70-3b8e6631b8cf",
        kettle: "3c7c050f-7108-43d4-bf8c-a0445c973a8f",
        cutleryset: "6996946d-e1ef-4983-ae59-59d84b9e1385",
        bowls: "cdac8cef-49c4-460b-b2a0-c5260607b704",
        juicermixer: "7e34ba9a-ebdf-461d-87db-429e9c37be77"
    };

    // Remove previously generated database cards before reloading.
    productsGrid
        .querySelectorAll(".database-product-card")
        .forEach(card => card.remove());

    const existingCards = Array.from(
        productsGrid.querySelectorAll(
            ".product-card:not(.flash-sale-card):not(.database-product-card)"
        )
    );

    const usedProductIds = new Set();

    // Update the six existing product cards from Supabase.
    existingCards.forEach(card => {
        const button = card.querySelector(".add-to-cart");

        if (!button) return;

        // Use the original HTML name to identify its permanent database ID.
        const originalName =
            button.dataset.name ||
            card.dataset.name ||
            card.querySelector("h3")?.textContent ||
            "";

        const productId =
            card.dataset.productId ||
            PRODUCT_CARD_IDS[normalize(originalName)];

        if (!productId) return;

        const product = products.find(
            item => String(item.id) === String(productId)
        );

        if (!product) {
    console.warn(
        "Product is inactive, hidden or unavailable:",
        originalName
    );

    // Do not display products that are not active in Supabase.
    card.remove();

    return;
}

        usedProductIds.add(product.id);

        // Keep the card connected to its permanent database ID.
        card.dataset.productId = product.id;
        card.dataset.name = product.name || "";
        card.dataset.category = product.category || "";

        button.dataset.productId = product.id;
        button.dataset.name = product.name || "";
        button.dataset.price = String(Number(product.price || 0));
        button.dataset.originalPrice = String(Number(product.price || 0));

        // Update product name.
        const heading = card.querySelector("h3");

        if (heading) {
            heading.textContent = product.name || "Unnamed product";
        }

        // Update product description.
        const description = card.querySelector(".product-description");

        if (description) {
            description.textContent = product.description || "";
        }

       // Display actual Supabase stock quantity.
       updateProductStock(card, product.stock);

        // Update product category.
        const category = card.querySelector(".products-category");

        if (category) {
            category.textContent = product.category || "Other";
        }

        // Update product image.
        const imageContainer = card.querySelector(".product-image");

        if (imageContainer && product.image_url) {
            let image = imageContainer.querySelector("img");

            if (!image) {
                image = document.createElement("img");
                imageContainer.prepend(image);
            }

            image.src = product.image_url;
            image.alt = product.name || "Product image";
        }

        // Update displayed price.
        const price = card.querySelector(
            ".product-buttom strong, .product-bottom strong"
        );

        if (price) {
            price.textContent =
                `GH₵${Number(product.price || 0).toLocaleString("en-GH")}`;
        }

        // Update stock status.
        const isOutOfStock =
            product.stock !== null &&
            product.stock !== undefined &&
            Number(product.stock) <= 0;

        button.dataset.databaseOutOfStock = String(isOutOfStock);
        button.disabled = isOutOfStock;
        button.textContent = isOutOfStock
            ? "Out of Stock"
            : "Add to cart";
    });

    // Add any additional products created through the admin dashboard.
    products.forEach(product => {
        if (usedProductIds.has(product.id)) return;

        const card = document.createElement("article");
        card.className = "product-card database-product-card";

        card.dataset.productId = product.id;
        card.dataset.category = product.category || "";
        card.dataset.name = product.name || "";

        const imageContainer = document.createElement("div");
        imageContainer.className = "product-image";

        if (product.image_url) {
            const image = document.createElement("img");
            image.src = product.image_url;
            image.alt = product.name || "Product image";
            image.loading = "lazy";
            imageContainer.appendChild(image);
        }

        const favouriteButton = document.createElement("button");
        favouriteButton.type = "button";
        favouriteButton.className = "favourite-button";
        favouriteButton.setAttribute(
            "aria-label",
            `Add ${product.name} to favourites`
        );
        favouriteButton.textContent = "💖";

        imageContainer.appendChild(favouriteButton);

        const productInfo = document.createElement("div");
        productInfo.className = "product-info";

        const category = document.createElement("p");
        category.className = "products-category";
        category.textContent = product.category || "Other";

        const heading = document.createElement("h3");
        heading.textContent = product.name || "Unnamed product";

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description || "";

        const stockDisplay = createStockDisplay(product.stock);
       
       productInfo.append(
          category,
          heading,
          description,
          stockDisplay
       );

        const productBottom = document.createElement("div");
        productBottom.className = "product-buttom";

        const price = document.createElement("strong");
        price.textContent =
            `GH₵${Number(product.price || 0).toLocaleString("en-GH")}`;

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "add-to-cart";
        addButton.textContent = "Add to cart";
        addButton.dataset.name = product.name || "";
        addButton.dataset.price = String(Number(product.price || 0));
        addButton.dataset.productId = product.id;
        addButton.dataset.originalPrice = String(Number(product.price || 0));

        const isOutOfStock =
            product.stock !== null &&
            product.stock !== undefined &&
            Number(product.stock) <= 0;

        addButton.dataset.databaseOutOfStock = String(isOutOfStock);

        if (isOutOfStock) {
            addButton.disabled = true;
            addButton.textContent = "Out of Stock";
        }

        productBottom.append(price, addButton);
        card.append(imageContainer, productInfo, productBottom);

        productsGrid.appendChild(card);
    });

       // =========================================
    // DISPLAY PRODUCTS MARKED AS NEW ARRIVALS
    // =========================================

    const newArrivalsSection =
        document.getElementById("newArrivalsSection");

    const newArrivalsGrid =
        document.getElementById("newArrivalsGrid");

    if (newArrivalsSection && newArrivalsGrid) {

        // Remove previous New Arrival cards before reloading.
        newArrivalsGrid
            .querySelectorAll(".new-arrival-product-card")
            .forEach(card => card.remove());

        // Get active products marked as New Arrivals.
        const newArrivalProducts = products.filter(product =>
            product.is_new_arrival === true
        );

        newArrivalProducts.forEach(product => {

            // Find the product's existing card in the normal catalogue.
            const originalCard = Array.from(
                productsGrid.querySelectorAll(".product-card")
            ).find(card =>
                String(card.dataset.productId) === String(product.id)
            );

            if (!originalCard) {
                console.warn(
                    "New Arrival card not found:",
                    product.name
                );
                return;
            }

            // Clone the original card to preserve its product details.
            const arrivalCard = originalCard.cloneNode(true);

            arrivalCard.classList.add("new-arrival-product-card");

            // Add the NEW badge to the product image.
            const imageContainer =
                arrivalCard.querySelector(".product-image");

            if (imageContainer) {

                const badge = document.createElement("span");

                badge.className = "new-arrival-badge";
                badge.textContent = "NEW";

                imageContainer.prepend(badge);
            }

            newArrivalsGrid.appendChild(arrivalCard);

           // Remove the original from Sweet Products.
           // It will now appear only in New Arrivals.
           originalCard.remove();
        });

        // Hide the section when there are no New Arrivals.
        newArrivalsSection.hidden =
            newArrivalProducts.length === 0;
    }

    console.log(
        "Store products loaded successfully:",
        products.length
    );
}



    // IMPORTANT: Flash Sales will wait for this promise.
    const productIdsReady = connectStoreProductIds();


    /* =================================================
       5. DARK AND LIGHT MODE
    ================================================= */

    const themeToggle =
        document.getElementById("themeToggle");

    const themeIcon =
        document.getElementById("themeIcon");

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
        savedTheme =
            localStorage.getItem("sweetTheme") || "light";
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
       6. MOBILE NAVIGATION
    ================================================= */

    const menuButton =
        document.getElementById("menuButton");

    const navMenu =
        document.getElementById("nav");

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
       7. SHOPPING CART
    ================================================= */

    let cart = [];

    const cartOverlay =
        document.getElementById("cartOverlay");

    const cartItem =
        document.getElementById("cartItem");

    const cartButton =
        document.getElementById("cartButton");

    const closeCart =
        document.getElementById("closeCart");

    const cartTotal =
        document.getElementById("cartTotal");

    const cartCount =
        document.getElementById("cartCount");

    const checkoutButton =
        document.getElementById("checkoutButton");


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
       8. UPDATE CART DISPLAY
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

            const emptyMessage =
                document.createElement("p");

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

            const cartItemElement =
                document.createElement("div");

            cartItemElement.className = "cart-item";

            const itemInfo =
                document.createElement("div");

            itemInfo.className = "cart-item-info";

            const itemName =
                document.createElement("h3");

            itemName.textContent = item.name;

            const itemPrice =
                document.createElement("p");

            itemPrice.textContent = formatMoney(item.price);

            itemInfo.appendChild(itemName);
            itemInfo.appendChild(itemPrice);


            const quantityControls =
                document.createElement("div");

            quantityControls.className = "quantity-controls";


            const decreaseButton =
                document.createElement("button");

            decreaseButton.type = "button";
            decreaseButton.className = "decrease";
            decreaseButton.dataset.index = index;
            decreaseButton.textContent = "−";

            decreaseButton.setAttribute(
                "aria-label",
                "Decrease quantity"
            );


            const quantityNumber =
                document.createElement("span");

            quantityNumber.textContent = item.quantity;


            const increaseButton =
                document.createElement("button");

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


            const removeButton =
                document.createElement("button");

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


    /* =================================================
       9. ADD PRODUCTS TO CART
    ================================================= */

    function addProductToCart(button) {

        if (button.disabled) return;

        const name =
            (button.dataset.name || "").trim();

        const price =
            Number(button.dataset.price);

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

        const existingProduct = cart.find(function (item) {

            if (productId && item.productId) {
                return item.productId === productId;
            }

            return (
                !productId &&
                !item.productId &&
                item.name === name
            );
        });

        if (existingProduct) {

            existingProduct.price = price;
            existingProduct.quantity++;

            existingProduct.flashSaleId =
                button.dataset.flashSaleId || null;

            existingProduct.originalPrice =
                Number(button.dataset.originalPrice) || price;

        } else {

            cart.push({
                productId: productId,
                name: name,
                price: price,
                quantity: 1,
                flashSaleId: button.dataset.flashSaleId || null,
                originalPrice:
                    Number(button.dataset.originalPrice) || price
            });
        }

        updateCart();

        const originalText =
            button.dataset.originalText || "Add to Cart";

        button.dataset.originalText = originalText;
        button.textContent = "Added to Cart";

        window.setTimeout(function () {
            if (!button.disabled) {
                button.textContent = originalText;
            }
        }, 1000);
    }


    document.addEventListener("click", function (event) {

        const target = event.target;

        if (!target.closest) return;

        const button = target.closest(".add-to-cart");

        if (!button) return;

        addProductToCart(button);
    });


    /* =================================================
       10. CART QUANTITY AND REMOVE BUTTONS
    ================================================= */

    if (cartItem) {

        cartItem.addEventListener("click", function (event) {

            const target = event.target;

            if (!target.closest) return;

            const button = target.closest(
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


    /* =================================================
       11. PRODUCT SEARCH AND CATEGORY FILTERING
    ================================================= */

    const searchInput =
        document.getElementById("searchInput");

    const searchButton =
        document.getElementById("searchButton");

    const categoryButtons =
        document.querySelectorAll(".category-btn");

    const productSection =
        document.getElementById("products");

    const productsGrid =
        document.getElementById("productsGrid");

    let selectedCategory = "all";

    let searchMessage =
        document.getElementById("searchMessage");


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

        // Filter only products inside the main Sweet Products catalogue.
       // New Arrivals and Flash Sales remain separate.
       const productCards = productsGrid
          ? productsGrid.querySelectorAll(
             ".product-card:not(.flash-sale-card)"
          )
          : [];

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


    /* =================================================
       12. FLASH SALE PRODUCTS
       Updates existing product cards AND keeps
       the separate Flash Sale section.
    ================================================= */

    const flashSaleSection =
        document.getElementById("flashSaleSection");

    const flashSaleGrid =
        document.getElementById("flashSaleGrid");

    const flashSaleMessage =
        document.getElementById("flashSaleMessage");


    function normalizeFlashSaleText(value) {

        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    }


    /* =================================================
       12A. RESTORE ORIGINAL PRODUCT CARD PRICES
    ================================================= */

    function restoreOriginalProductCards() {

        const productCards = document.querySelectorAll(
            ".product-card:not(.flash-sale-card)"
        );

        productCards.forEach(card => {

            const button = card.querySelector(".add-to-cart");

            if (!button) return;

            const originalPrice = Number(
                button.dataset.originalPrice
            );

            if (
                !Number.isFinite(originalPrice) ||
                originalPrice <= 0
            ) {
                return;
            }

            button.dataset.price = String(originalPrice);

            delete button.dataset.flashSaleId;

            const priceElement = card.querySelector(
                ".product-buttom strong, .product-bottom strong"
            );

            if (priceElement) {
                priceElement.textContent =
                    formatMoney(originalPrice);
            }

            card.querySelectorAll(
                ".product-card-original-price"
            ).forEach(element => element.remove());

            card.querySelectorAll(
                ".product-card-sale-badge"
            ).forEach(element => element.remove());

            // Re-enable products unless the database says they are out of stock.
            if (button.dataset.databaseOutOfStock !== "true") {
                button.disabled = false;

                if (button.dataset.originalText) {
                    button.textContent = button.dataset.originalText;
                }
            }
        });
    }


    /* =================================================
       12B. APPLY FLASH SALES TO EXISTING PRODUCT CARDS
    ================================================= */

    function updateExistingProductCardsWithFlashSales(sales) {

        restoreOriginalProductCards();

        const productCards = document.querySelectorAll(
            ".product-card:not(.flash-sale-card)"
        );

        sales.forEach(sale => {

            const product = sale.product;

            if (!product) return;

            const discount = Number(
                sale.discount_percentage
            );

            const originalPrice = Number(product.price);

            if (
                !Number.isFinite(discount) ||
                discount <= 0 ||
                discount >= 100 ||
                !Number.isFinite(originalPrice) ||
                originalPrice <= 0
            ) {
                return;
            }

            let matchingCard = null;

            productCards.forEach(card => {

                if (matchingCard) return;

                const button = card.querySelector(".add-to-cart");

                if (!button) return;

                const existingProductId =
                    button.dataset.productId;

                const cardName =
                    button.dataset.name ||
                    card.dataset.name ||
                    card.querySelector("h3")?.textContent ||
                    "";

                const cardCategory =
                    card.dataset.category || "";

                const sameProductId =
                    existingProductId &&
                    existingProductId === String(product.id);

                const sameName =
                    normalizeFlashSaleText(cardName) ===
                    normalizeFlashSaleText(product.name);

                const sameCategory =
                    normalizeFlashSaleText(cardCategory) ===
                    normalizeFlashSaleText(product.category);

                if (
                    sameProductId ||
                    (sameName && sameCategory)
                ) {
                    matchingCard = card;
                }
            });

            if (!matchingCard) {

                console.warn(
                    "Could not find existing product card for Flash Sale:",
                    product.name
                );

                return;
            }

            const button =
                matchingCard.querySelector(".add-to-cart");

            if (!button) return;

            const discountedPrice = Number(
                (
                    originalPrice *
                    (1 - discount / 100)
                ).toFixed(2)
            );

            button.dataset.productId = product.id;

            button.dataset.originalPrice =
                String(originalPrice);

            button.dataset.price =
                String(discountedPrice);

            button.dataset.flashSaleId = sale.id;

            const priceElement = matchingCard.querySelector(
                ".product-buttom strong, .product-bottom strong"
            );

            if (priceElement) {

                priceElement.textContent =
                    formatMoney(discountedPrice);

                const oldPrice =
                    document.createElement("span");

                oldPrice.className =
                    "flash-sale-original product-card-original-price";

                oldPrice.textContent =
                    formatMoney(originalPrice);

                priceElement.insertAdjacentElement(
                    "afterend",
                    oldPrice
                );
            }

            let imageContainer = matchingCard.querySelector(
                ".product-image, .product-img"
            );

            if (!imageContainer) {

                const image = matchingCard.querySelector("img");

                if (image) {
                    imageContainer = image.parentElement;
                }
            }

            if (imageContainer) {

                imageContainer.style.position = "relative";

                const badge =
                    document.createElement("span");

                badge.className =
                    "flash-sale-badge product-card-sale-badge";

                badge.textContent = `${discount}% OFF`;

                imageContainer.appendChild(badge);
            }

            if (
                product.stock !== null &&
                product.stock !== undefined &&
                Number(product.stock) <= 0
            ) {
                button.disabled = true;
                button.dataset.databaseOutOfStock = "true";
                button.textContent = "Out of Stock";
            }

            console.log(
                "Existing product card updated:",
                product.name,
                formatMoney(discountedPrice)
            );
        });
    }


    /* =================================================
       12C. RENDER SEPARATE FLASH SALE SECTION
    ================================================= */

    function renderStoreFlashSales(sales) {

        flashSaleGrid.replaceChildren();

        if (!sales.length) {

            flashSaleSection.hidden = true;

            if (flashSaleMessage) {
                flashSaleMessage.hidden = true;
            }

            return;
        }

        flashSaleSection.hidden = false;

        if (flashSaleMessage) {
            flashSaleMessage.hidden = true;
        }

        sales.forEach(function (sale) {

            const product = sale.product;

            const originalPrice =
                Number(product.price);

            const discount =
                Number(sale.discount_percentage);

            const discountedPrice = Number(
                (
                    originalPrice *
                    (1 - discount / 100)
                ).toFixed(2)
            );

            const card =
                document.createElement("article");

            card.className =
                "flash-sale-card product-card";

            card.dataset.name = product.name || "";
            card.dataset.category = product.category || "";


            const badge =
                document.createElement("span");

            badge.className = "flash-sale-badge";
            badge.textContent = `${discount}% OFF`;


            const image =
                document.createElement("img");

            image.src = product.image_url || "";
            image.alt = product.name || "Flash sale product";
            image.loading = "lazy";

            image.onerror = function () {
                image.style.display = "none";
            };


            const details =
                document.createElement("div");

            details.className = "flash-sale-details";


            const name =
                document.createElement("h3");

            name.textContent = product.name || "Product";


            const description =
                document.createElement("p");

            description.textContent =
                product.description || "";


            const prices =
                document.createElement("div");

            prices.className = "flash-sale-prices";


            const salePrice =
                document.createElement("span");

            salePrice.className = "flash-sale-price";
            salePrice.textContent =
                formatMoney(discountedPrice);


            const oldPrice =
                document.createElement("span");

            oldPrice.className = "flash-sale-original";
            oldPrice.textContent =
                formatMoney(originalPrice);


            prices.appendChild(salePrice);
            prices.appendChild(oldPrice);


            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "add-to-cart flash-sale-add";

            button.textContent = "Add to Cart";

            button.dataset.name = product.name || "";
            button.dataset.price = String(discountedPrice);
            button.dataset.productId = product.id;
            button.dataset.flashSaleId = sale.id;

            button.dataset.originalPrice =
                String(originalPrice);


            if (
                product.stock !== null &&
                product.stock !== undefined &&
                Number(product.stock) <= 0
            ) {
                button.disabled = true;
                button.textContent = "Out of Stock";
            }


            const stockDisplay = createStockDisplay(product.stock);
           
           details.appendChild(name);
           details.appendChild(description);
           details.appendChild(stockDisplay);
           details.appendChild(prices);
           details.appendChild(button);

            card.appendChild(badge);
            card.appendChild(image);
            card.appendChild(details);

            flashSaleGrid.appendChild(card);
        });

        filterProducts();

        console.log(
            `${sales.length} active Flash Sale product(s) loaded.`
        );
    }


    /* =================================================
       12D. LOAD FLASH SALES FROM SUPABASE
    ================================================= */

    async function loadStoreFlashSales() {

        if (!supabaseClient) {

            console.error("Supabase connection is unavailable.");

            return;
        }

        if (!flashSaleSection || !flashSaleGrid) {

            console.warn(
                "Flash Sale HTML elements are missing."
            );

            return;
        }

        try {

            const { data, error } = await supabaseClient
                .from("store_flash_sales")
                .select(`
                    id,
                    product_id,
                    discount_percentage,
                    starts_at,
                    ends_at,
                    is_active,
                    product:store_products (
                        id,
                        name,
                        description,
                        price,
                        category,
                        image_url,
                        stock,
                        is_active
                    )
                `)
                .eq("is_active", true);

            if (error) throw error;

            const now = Date.now();

            const activeSales = (data || []).filter(sale => {

                const start =
                    new Date(sale.starts_at).getTime();

                const end =
                    new Date(sale.ends_at).getTime();

                const product = sale.product;

                return (
                    sale.is_active === true &&
                    Number.isFinite(start) &&
                    Number.isFinite(end) &&
                    now >= start &&
                    now < end &&
                    product &&
                    product.is_active === true &&
                    Number(product.price) > 0 &&
                    Number(sale.discount_percentage) > 0 &&
                    Number(sale.discount_percentage) < 100
                );
            });

            updateExistingProductCardsWithFlashSales(activeSales);

            renderStoreFlashSales(activeSales);

        } catch (error) {

            console.error(
                "Flash Sale loading failed:",
                error
            );

            restoreOriginalProductCards();

            flashSaleGrid.replaceChildren();

            flashSaleSection.hidden = false;

            if (flashSaleMessage) {

                flashSaleMessage.hidden = false;

                flashSaleMessage.textContent =
                    "Flash Sale offers could not be loaded. Please try again later.";
            }
        }
    }


    /* =================================================
       12E. START FLASH SALES AFTER PRODUCT IDS LOAD
    ================================================= */

    productIdsReady
        .then(function () {
            return loadStoreFlashSales();
        })
        .catch(function (error) {

            console.error(
                "Product and Flash Sale initialization failed:",
                error
            );
        });


    /* =================================================
       12F. AUTOMATIC FLASH SALE REFRESH
    ================================================= */

    window.setInterval(function () {

        if (!document.hidden) {
            loadStoreFlashSales();
        }

    }, 60000);


    
// ==========================================
// 13. CUSTOMER PROFILE
// PROFILE PICTURE UPLOAD + DISPLAY + REMOVE
// ==========================================

(() => {
    const client = window.sweetSupabase;

    if (!client) {
        console.error("Supabase client not found.");
        return;
    }

    // HTML ELEMENTS
    const profileButton = document.getElementById("profileButton");
    const profileArea = document.getElementById("profileArea");
    const profileMenu = document.getElementById("profileMenu");

    const profileName = document.getElementById("profileName");
    const profileNameDisplay = document.getElementById("profileNameDisplay");
    const profileEmail = document.getElementById("profileEmail");

    const profilePicture = document.getElementById("profilePicture");
    const profilePicturePreview = document.getElementById("profilePicturePreview");
    const profileIcon = document.getElementById("profileIcon");

    const profilePictureInput = document.getElementById("profilePictureInput");
    const removeProfilePicture = document.getElementById("removeProfilePicture");
    const profilePictureMessage = document.getElementById("profilePictureMessage");

    const logoutButton = document.getElementById("logoutButton");

    const BUCKET_NAME = "profile-pictures";
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    let currentUser = null;

    // ======================================
    // DISPLAY PROFILE PICTURE
    // ======================================

    function displayProfilePicture(url) {
        if (url) {
            profilePicture.src = url;
            profilePicturePreview.src = url;

            profilePicture.hidden = false;
            profilePicturePreview.hidden = false;

            if (profileIcon) {
                profileIcon.hidden = true;
            }

            if (removeProfilePicture) {
                removeProfilePicture.hidden = false;
            }

        } else {
            profilePicture.removeAttribute("src");
            profilePicturePreview.removeAttribute("src");

            profilePicture.hidden = true;
            profilePicturePreview.hidden = true;

            if (profileIcon) {
                profileIcon.hidden = false;
            }

            if (removeProfilePicture) {
                removeProfilePicture.hidden = true;
            }
        }
    }

    // ======================================
    // SHOW MESSAGE
    // ======================================

    function showProfileMessage(message, isError = false) {
        if (!profilePictureMessage) return;

        profilePictureMessage.textContent = message;
        profilePictureMessage.style.color = isError ? "red" : "green";
    }

    // ======================================
    // SIGNED OUT DISPLAY
    // ======================================

    function showSignedOut() {
        currentUser = null;

        if (profileName) profileName.textContent = "Sign in";

        if (profileNameDisplay) {
            profileNameDisplay.textContent = "My Account";
        }

        if (profileEmail) profileEmail.textContent = "";

        if (logoutButton) logoutButton.hidden = true;

        displayProfilePicture(null);

        if (profileMenu) profileMenu.hidden = true;

        if (profileButton) {
            profileButton.setAttribute("aria-expanded", "false");
        }
    }

    // ======================================
    // SIGNED IN DISPLAY
    // ======================================

    function showSignedIn(user) {
        currentUser = user;

        const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Customer";

const firstName = fullName.trim().split(/\s+/)[0];

        if (profileName) {
            profileName.textContent = firstName;
        }

        if (profileNameDisplay) {
            profileNameDisplay.textContent = firstName;
        }

        if (profileEmail) {
            profileEmail.textContent = user.email || "";
        }

        if (logoutButton) {
            logoutButton.hidden = false;
        }

        const avatarUrl = user.user_metadata?.avatar_url || null;

        displayProfilePicture(avatarUrl);

        if (profilePictureMessage) {
            profilePictureMessage.textContent = "";
        }
    }

    // ======================================
    // PROFILE MENU TOGGLE
    // ======================================

    if (profileButton && profileMenu) {
        profileButton.addEventListener("click", () => {
            const isOpen = !profileMenu.hidden;

            profileMenu.hidden = isOpen;

            profileButton.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );
        });
    }

    // Close menu when clicking outside
    document.addEventListener("click", (event) => {
        if (
            profileArea &&
            !profileArea.contains(event.target) &&
            profileMenu
        ) {
            profileMenu.hidden = true;

            if (profileButton) {
                profileButton.setAttribute("aria-expanded", "false");
            }
        }
    });

    // ======================================
    // UPLOAD PROFILE PICTURE
    // ======================================

    if (profilePictureInput) {
        profilePictureInput.addEventListener("change", async () => {
            const file = profilePictureInput.files[0];

            if (!file) return;

            try {
                if (!currentUser) {
                    throw new Error("Please sign in before uploading a picture.");
                }

                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];

                if (!allowedTypes.includes(file.type)) {
                    throw new Error("Please select a JPG, PNG, or WEBP image.");
                }

                if (file.size > MAX_FILE_SIZE) {
                    throw new Error("Image must not exceed 5MB.");
                }

                showProfileMessage("Uploading picture...");

                const extension = {
                    "image/jpeg": "jpg",
                    "image/png": "png",
                    "image/webp": "webp"
                }[file.type];

                const userId = currentUser.id;

                // Each customer has their own folder.
                const filePath =
                    `${userId}/avatar-${Date.now()}.${extension}`;

                const oldPath = currentUser.user_metadata?.avatar_path;

                // Upload to Supabase Storage
                const { error: uploadError } = await client.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, file, {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: file.type
                    });

                if (uploadError) {
                    throw uploadError;
                }

                // Get public image URL
                const { data: publicData } = client.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(filePath);

                const avatarUrl = publicData.publicUrl;

                // Save picture information in user metadata
                const { data: updateData, error: updateError } =
                    await client.auth.updateUser({
                        data: {
                            avatar_url: avatarUrl,
                            avatar_path: filePath
                        }
                    });

                if (updateError) {
                    // Remove newly uploaded file if metadata update fails
                    await client.storage
                        .from(BUCKET_NAME)
                        .remove([filePath]);

                    throw updateError;
                }

                // Update current user information
                currentUser = updateData.user;

                showSignedIn(currentUser);

                // Remove previous picture after successful update
                if (oldPath && oldPath !== filePath) {
                    await client.storage
                        .from(BUCKET_NAME)
                        .remove([oldPath]);
                }

                showProfileMessage("Profile picture updated successfully!");

            } catch (error) {
                console.error("Profile picture upload error:", error);

                showProfileMessage(
                    error.message || "Could not upload profile picture.",
                    true
                );

            } finally {
                profilePictureInput.value = "";
            }
        });
    }

    // ======================================
    // REMOVE PROFILE PICTURE
    // ======================================

    if (removeProfilePicture) {
        removeProfilePicture.addEventListener("click", async () => {
            if (!currentUser) return;

            try {
                showProfileMessage("Removing picture...");

                const oldPath = currentUser.user_metadata?.avatar_path;

                // Clear saved avatar information
                const { data, error } = await client.auth.updateUser({
                    data: {
                        avatar_url: null,
                        avatar_path: null
                    }
                });

                if (error) throw error;

                currentUser = data.user;

                displayProfilePicture(null);

                if (oldPath) {
                    const { error: deleteError } = await client.storage
                        .from(BUCKET_NAME)
                        .remove([oldPath]);

                    if (deleteError) {
                        console.error(
                            "Could not delete old image:",
                            deleteError
                        );
                    }
                }

                showProfileMessage("Profile picture removed.");

            } catch (error) {
                console.error("Remove picture error:", error);

                showProfileMessage(
                    error.message || "Could not remove picture.",
                    true
                );
            }
        });
    }

    // ======================================
    // LOG OUT
    // ======================================

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            const { error } = await client.auth.signOut();

            if (error) {
                console.error("Logout error:", error);
                return;
            }

            showSignedOut();
            window.location.href = "./login.html";
        });
    }

    // ======================================
    // CHECK EXISTING LOGIN SESSION
    // ======================================

    async function refreshProfile() {
        const { data, error } = await client.auth.getSession();

        if (error) {
            console.error("Session error:", error);
            showSignedOut();
            return;
        }

        if (data.session?.user) {
            showSignedIn(data.session.user);
        } else {
            showSignedOut();
        }
    }

    // Listen for login/logout changes
    client.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
            showSignedIn(session.user);
        } else {
            showSignedOut();
        }
    });

   // ==========================================
// AUTHENTICATION + 5-MINUTE INACTIVITY LOGOUT
// ==========================================

const INACTIVITY_LIMIT = 5 * 60 * 1000;
let inactivityTimer = null;
let customerIsSignedIn = false;

function resetInactivityTimer() {

    if (!customerIsSignedIn) return;

    clearTimeout(inactivityTimer);

    inactivityTimer = setTimeout(async () => {

        try {
            const { error } = await client.auth.signOut();

            if (error) {
                console.error("Automatic logout failed:", error);
                return;
            }

            alert(
                "You have been logged out due to 5 minutes of inactivity. Please sign in again."
            );

            window.location.replace("./login.html?reason=timeout");

        } catch (error) {
            console.error("Automatic logout error:", error);
        }

    }, INACTIVITY_LIMIT);
}

// Detect customer activity
[
    "mousemove",
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
    "click"
].forEach(eventName => {
    document.addEventListener(eventName, resetInactivityTimer, {
        passive: true
    });
});

// Listen for login/logout changes
client.auth.onAuthStateChange((event, session) => {

    customerIsSignedIn = Boolean(session?.user);

    clearTimeout(inactivityTimer);

    if (session?.user) {
        showSignedIn(session.user);
        resetInactivityTimer();
    } else {
        showSignedOut();
    }

});

    // Load profile when page opens
    refreshProfile();

})();



    /* =================================================
       14. PAYSTACK CHECKOUT + NOTIFICATION TOKEN
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

                alert(
                    "Your cart is empty. Add products before checkout."
                );

                return;
            }

            const subtotal = cart.reduce(function (sum, item) {
                return sum + item.price * item.quantity;
            }, 0);

            const estimatedTotal = subtotal * 1.01;

            paymentTotal.textContent =
                formatMoney(estimatedTotal);

            paymentReference.textContent =
                "Generated securely when checkout starts.";

            paymentNetwork.value = "";

            paymentOverlay.hidden = false;
            paymentOverlay.style.display = "flex";
        }


        checkoutButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                openPaymentWindow();
            }
        );


        confirmButton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                if (!supabaseClient) {

                    alert(
                        "Payment service is unavailable. Please refresh the page."
                    );

                    return;
                }

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

                const network = paymentNetwork.value;

                if (!["mtn", "telecel", "at"].includes(network)) {

                    alert(
                        "Please select your Mobile Money network."
                    );

                    return;
                }

                if (cart.length === 0) {
                    alert("Your cart is empty.");
                    return;
                }

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

                const originalButtonText =
                    confirmButton.textContent;

                confirmButton.disabled = true;

                confirmButton.textContent =
                    "Connecting to Paystack...";

                try {

                    // Send product IDs and quantities only.
                    // The server must calculate the final prices.

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
                            data?.error ||
                            "Payment could not be initialized. Please check the payment server logs."
                        );
                    }


                    if (!data || !data.authorization_url) {

                        throw new Error(
                            data?.error ||
                            "Paystack did not return a payment link."
                        );
                    }


                    if (
                        !data.reference ||
                        !data.notification_token
                    ) {

                        throw new Error(
                            "Payment started without notification access details. Please contact the store."
                        );
                    }


                    const notificationStorageKey =
                        "sweet_order_notification_" + data.reference;


                    try {

                        localStorage.setItem(
                            notificationStorageKey,
                            JSON.stringify({

                                reference: data.reference,

                                token: data.notification_token,

                                savedAt: new Date().toISOString()
                            })
                        );

                    } catch (storageError) {

                        console.error(
                            "Notification token could not be saved:",
                            storageError
                        );

                        throw new Error(
                            "Your order notification access could not be saved. Please enable browser storage and try again."
                        );
                    }


                    paymentReference.textContent =
                        data.reference;

                    console.log(
                        "Payment initialized successfully.",
                        data.reference
                    );

                    console.log(
                        "Private order notification access saved."
                    );

                    window.location.href =
                        data.authorization_url;

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

                    confirmButton.textContent =
                        originalButtonText;
                }
            }
        );


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

        paymentOverlay.addEventListener(
            "click",
            function (event) {

                if (event.target === paymentOverlay) {
                    closePaymentWindow();
                }
            }
        );

        closePaymentWindow();

        console.log("Checkout interface initialized.");

    })();


    
    /* =================================================
       15. MY ORDERS + NOTIFICATION SYSTEM
       SINGLE CONSOLIDATED VERSION
    ================================================= */

    const myOrdersMenuLink =
        document.getElementById("myOrdersLink");

    const myOrdersSectionElement =
        document.getElementById("myOrders");

    const myOrdersList =
        document.getElementById("myOrdersList");

    const ordersMessage =
        document.getElementById("ordersMessage");

    const refreshOrdersBtn =
        document.getElementById("refreshOrdersBtn");

    const closeOrdersBtn =
        document.getElementById("closeOrdersBtn");

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationMenu =
        document.getElementById("notificationMenu");

    const notificationList =
        document.getElementById("notificationList");

    const notificationCount =
        document.getElementById("notificationCount");

    const markAllNotificationsRead =
        document.getElementById("markAllNotificationsRead");

    const clearNotifications =
        document.getElementById("clearNotifications");

    const SWEET_NOTIFICATIONS_KEY =
        "sweet_customer_notifications";

    const SWEET_ORDER_STATUS_KEY =
        "sweet_order_status_snapshots";

    let customerNotifications = [];
    let orderStatusSnapshots = {};
    let notificationCheckInProgress = false;


    /* =================================================
       15A. LOAD SAVED NOTIFICATIONS
    ================================================= */

    try {
        customerNotifications = JSON.parse(
            localStorage.getItem(SWEET_NOTIFICATIONS_KEY) || "[]"
        );

        orderStatusSnapshots = JSON.parse(
            localStorage.getItem(SWEET_ORDER_STATUS_KEY) || "{}"
        );

        if (!Array.isArray(customerNotifications)) {
            customerNotifications = [];
        }

        if (
            !orderStatusSnapshots ||
            typeof orderStatusSnapshots !== "object" ||
            Array.isArray(orderStatusSnapshots)
        ) {
            orderStatusSnapshots = {};
        }

    } catch (error) {
        console.error("Notification storage error:", error);
        customerNotifications = [];
        orderStatusSnapshots = {};
    }


    /* =================================================
       15B. SAVE NOTIFICATIONS
    ================================================= */

    function saveCustomerNotifications() {
        try {
            localStorage.setItem(
                SWEET_NOTIFICATIONS_KEY,
                JSON.stringify(customerNotifications)
            );
        } catch (error) {
            console.error("Could not save notifications:", error);
        }
    }

    function saveOrderStatusSnapshots() {
        try {
            localStorage.setItem(
                SWEET_ORDER_STATUS_KEY,
                JSON.stringify(orderStatusSnapshots)
            );
        } catch (error) {
            console.error("Could not save order status:", error);
        }
    }


    /* =================================================
       15C. GET SAVED ORDER REFERENCES AND TOKENS
    ================================================= */

    function getSavedOrderNotifications() {
        const savedOrders = [];

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (
                    !key ||
                    !key.startsWith("sweet_order_notification_")
                ) {
                    continue;
                }

                try {
                    const savedData = JSON.parse(
                        localStorage.getItem(key)
                    );

                    if (
                        savedData &&
                        savedData.reference &&
                        savedData.token
                    ) {
                        savedOrders.push(savedData);
                    }
                } catch (error) {
                    console.warn(
                        "Invalid saved order notification:",
                        key,
                        error
                    );
                }
            }
        } catch (error) {
            console.error(
                "Could not read saved order notifications:",
                error
            );
        }

        return savedOrders;
    }


    /* =================================================
       15D. GENERAL ORDER ELEMENT HELPER
    ================================================= */

    function createOrderElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined && text !== null) {
            element.textContent = text;
        }

        return element;
    }


    function formatOrderDate(dateValue) {
        if (!dateValue) return "Date unavailable";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleString("en-GH", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    }


    function createStatusBadge(status) {
        const displayedStatus = String(status || "Pending")
            .replace(/_/g, " ");

        const normalizedStatus = displayedStatus
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-");

        return createOrderElement(
            "span",
            `order-status-badge status-${normalizedStatus}`,
            displayedStatus
        );
    }


    /* =================================================
       15E. NOTIFICATION COUNTER
    ================================================= */

    function updateNotificationCount() {
        if (!notificationCount) return;

        const unreadCount = customerNotifications.filter(
            item => !item.read
        ).length;

        notificationCount.textContent = unreadCount;
        notificationCount.hidden = unreadCount === 0;

        if (notificationButton) {
            notificationButton.setAttribute(
                "aria-label",
                unreadCount > 0
                    ? `${unreadCount} unread notifications`
                    : "Notifications"
            );
        }
    }


    /* =================================================
       15F. DISPLAY NOTIFICATIONS IN THE BELL
    ================================================= */

    function renderCustomerNotifications() {
        if (!notificationList) return;

        notificationList.replaceChildren();

        if (customerNotifications.length === 0) {
            notificationList.appendChild(
                createOrderElement(
                    "p",
                    "empty-notifications",
                    "No notifications yet."
                )
            );

            updateNotificationCount();
            return;
        }

        customerNotifications.forEach(item => {
            const notificationItem = createOrderElement(
                "div",
                "notification-item"
            );

            if (!item.read) {
                notificationItem.classList.add("unread");
            }

            const icon = createOrderElement(
                "span",
                "notification-item-icon",
                "📦"
            );

            const content = createOrderElement(
                "div",
                "notification-item-content"
            );

            content.appendChild(
                createOrderElement(
                    "strong",
                    "",
                    item.title || "Order update"
                )
            );

            content.appendChild(
                createOrderElement(
                    "p",
                    "",
                    item.message || ""
                )
            );

            content.appendChild(
                createOrderElement(
                    "small",
                    "",
                    formatOrderDate(item.createdAt)
                )
            );

            notificationItem.append(icon, content);

            if (!item.read) {
                notificationItem.appendChild(
                    createOrderElement(
                        "span",
                        "notification-unread-dot"
                    )
                );
            }

            notificationList.appendChild(notificationItem);
        });

        updateNotificationCount();
    }


    /* =================================================
       15G. CREATE A NEW CUSTOMER NOTIFICATION
    ================================================= */

    function addCustomerNotification(
        title,
        message,
        reference
    ) {
        const notification = {
            id: `${reference}-${Date.now()}`,
            title,
            message,
            reference,
            createdAt: new Date().toISOString(),
            read: false
        };

        customerNotifications.unshift(notification);

        customerNotifications =
            customerNotifications.slice(0, 100);

        saveCustomerNotifications();
        renderCustomerNotifications();

        console.log(
            "Customer notification created:",
            notification
        );
    }

   
/* =================================================
   15G-1. LOAD REAL DATABASE NOTIFICATIONS
================================================= */

function mergeDatabaseNotifications(records) {
    if (!Array.isArray(records)) return;

    const notificationMap = new Map();

    // Preserve existing local notifications.
    customerNotifications
        .filter(item => item.source !== "database")
        .forEach(item => {
            notificationMap.set(String(item.id), item);
        });

    // Add or update notifications retrieved from Supabase.

   console.log("NOTIFICATIONS RECEIVED FROM DATABASE:", records);

console.table(
    records.map(item => ({
        title: item.title,
        reference: item.order_reference,
        is_read: item.is_read,
        created_at: item.created_at
    }))
);
   
    records.forEach(item => {
        if (!item || !item.id) return;

        notificationMap.set(String(item.id), {
            id: String(item.id),
            title: item.title || "Order update",
            message: item.message || "",
            reference: item.order_reference || "",
            createdAt: item.created_at || new Date().toISOString(),
            read: item.is_read === true,
            source: "database"
        });
    });

    customerNotifications = Array.from(notificationMap.values())
        .sort((a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
        .slice(0, 100);

    saveCustomerNotifications();
    renderCustomerNotifications();
}


    /* =================================================
       15H. NOTIFICATION BELL OPEN AND CLOSE
    ================================================= */

    if (
        notificationButton &&
        notificationMenu &&
        notificationList
    ) {
        notificationButton.setAttribute(
            "aria-expanded",
            "false"
        );

        notificationButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                const shouldOpen = notificationMenu.hidden;

                notificationMenu.hidden = !shouldOpen;

                notificationButton.setAttribute(
                    "aria-expanded",
                    String(shouldOpen)
                );

                if (shouldOpen) {
                    renderCustomerNotifications();
                }
            }
        );

        document.addEventListener("click", function (event) {
            if (
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
    }


    
    /* =================================================
       15I. MARK ALL NOTIFICATIONS AS READ
    ================================================= */

    
if (markAllNotificationsRead) {
    markAllNotificationsRead.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            if (customerNotifications.length === 0) {
                return;
            }

            try {

                // ==========================================
                // 1. CHECK CUSTOMER LOGIN SESSION
                // ==========================================

                const {
                    data: sessionData,
                    error: sessionError
                } = await supabaseClient.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                const session = sessionData?.session;

                // ==========================================
                // 2. MARK REGISTERED CUSTOMER NOTIFICATIONS
                // ==========================================

                if (session?.user) {

                    const {
                        data,
                        error
                    } = await supabaseClient.functions.invoke(
                        "manage-order-notifications",
                        {
                            body: {
                                action: "mark_all_read",
                                customer_type: "registered"
                            }
                        }
                    );

                    if (error || data?.success !== true) {
                        throw new Error(
                            data?.message ||
                            error?.message ||
                            "Could not update registered customer notifications."
                        );
                    }
                }

                // ==========================================
                // 3. MARK ALL SAVED GUEST ORDER NOTIFICATIONS
                // ==========================================

                const savedOrders =
                    getSavedOrderNotifications();

                for (const savedOrder of savedOrders) {

                    const {
                        data,
                        error
                    } = await supabaseClient.functions.invoke(
                        "manage-order-notifications",
                        {
                            body: {
                                action: "mark_all_read",
                                customer_type: "guest",
                                reference: savedOrder.reference,
                                notification_token: savedOrder.token
                            }
                        }
                    );

                    if (error || data?.success !== true) {
                        throw new Error(
                            data?.message ||
                            error?.message ||
                            "Could not update guest order notifications."
                        );
                    }
                }

                // ==========================================
                // 4. UPDATE THE LOCAL NOTIFICATION DISPLAY
                // ==========================================

                customerNotifications.forEach(item => {
                    item.read = true;
                });

                saveCustomerNotifications();
                renderCustomerNotifications();

            } catch (error) {

                console.error(
                    "Mark all notifications as read failed:",
                    error
                );

                alert(
                    "Could not update all notifications. Please try again."
                );
            }
        }
    );
}


    
    /* =================================================
       15J. CLEAR ALL NOTIFICATIONS
    ================================================= */

    
if (clearNotifications) {
    clearNotifications.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            if (customerNotifications.length === 0) {
                return;
            }

            if (!confirm(
                "Are you sure you want to clear all notifications?"
            )) {
                return;
            }

            try {

                // ==========================================
                // 1. CHECK CUSTOMER LOGIN SESSION
                // ==========================================

                const {
                    data: sessionData,
                    error: sessionError
                } = await supabaseClient.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                const session = sessionData?.session;

                // ==========================================
                // 2. CLEAR REGISTERED CUSTOMER NOTIFICATIONS
                // ==========================================

                if (session?.user) {

                    const {
                        data,
                        error
                    } = await supabaseClient.functions.invoke(
                        "manage-order-notifications",
                        {
                            body: {
                                action: "clear",
                                customer_type: "registered"
                            }
                        }
                    );

                    if (error || data?.success !== true) {
                        throw new Error(
                            data?.message ||
                            error?.message ||
                            "Could not clear registered customer notifications."
                        );
                    }
                }

                // ==========================================
                // 3. CLEAR ALL SAVED GUEST ORDER NOTIFICATIONS
                // ==========================================

                const savedOrders =
                    getSavedOrderNotifications();

                for (const savedOrder of savedOrders) {

                    const {
                        data,
                        error
                    } = await supabaseClient.functions.invoke(
                        "manage-order-notifications",
                        {
                            body: {
                                action: "clear",
                                customer_type: "guest",
                                reference: savedOrder.reference,
                                notification_token: savedOrder.token
                            }
                        }
                    );

                    if (error || data?.success !== true) {
                        throw new Error(
                            data?.message ||
                            error?.message ||
                            "Could not clear guest order notifications."
                        );
                    }
                }

                // ==========================================
                // 4. CLEAR LOCAL NOTIFICATION DISPLAY
                // ==========================================

                customerNotifications = [];

                saveCustomerNotifications();
                renderCustomerNotifications();

            } catch (error) {

                console.error(
                    "Clear notifications failed:",
                    error
                );

                alert(
                    "Could not clear all notifications. Please try again."
                );
            }
        }
    );
}




    

/* =================================================
   15K. ORDER STATUS UPDATE CONTAINER
================================================= */

function createOrderNotificationContainer() {
    // Do not create a second order-updates panel.
    const existingContainer = document.getElementById(
        "orderNotificationContainer"
    );

    if (existingContainer) {
        existingContainer.remove();
    }

    return null;
}




    /* =================================================
       15L. DISPLAY ORDER STATUS UPDATES
    ================================================= */

    function displayOrderNotification(order, notification) {
        const list = document.getElementById(
            "orderNotificationList"
        );

        if (!list) return;

        const reference = String(
            notification.reference || order.reference || "unknown"
        );

        const safeId = reference.replace(
            /[^a-zA-Z0-9_-]/g,
            "-"
        );

        let card = document.getElementById(
            "notification-" + safeId
        );

        if (!card) {
            card = document.createElement("div");

            card.id = "notification-" + safeId;
            card.className = "order-notification-card";

            card.append(
                createOrderElement("p", "notification-reference"),
                createOrderElement("p", "notification-payment"),
                createOrderElement("p", "notification-status"),
                createOrderElement("small", "notification-updated")
            );

            list.appendChild(card);
        }

        card.querySelector(
            ".notification-reference"
        ).textContent = "Order reference: " + reference;

        card.querySelector(
            ".notification-payment"
        ).textContent =
            "Payment: " + (notification.payment_status || "Pending");

        card.querySelector(
            ".notification-status"
        ).textContent =
            "Delivery status: " + (notification.order_status || "Pending");

        card.querySelector(
            ".notification-updated"
        ).textContent =
            "Last updated: " + formatOrderDate(notification.updated_at);
    }


    /* =================================================
       15M. RENDER ONE COMPLETE ORDER
    ================================================= */

    function renderSingleOrder(order) {
        const card = createOrderElement(
            "article",
            "customer-order-card"
        );

        // Order header
        const header = createOrderElement(
            "div",
            "customer-order-header"
        );

        const referenceArea = createOrderElement(
            "div",
            "customer-order-reference"
        );

        referenceArea.append(
            createOrderElement("strong", "", "Order reference"),
            createOrderElement(
                "p",
                "",
                order.reference || "Unavailable"
            ),
            createOrderElement(
                "small",
                "",
                formatOrderDate(order.created_at)
            )
        );

        const statusArea = createOrderElement(
            "div",
            "customer-order-status"
        );

        const paymentStatus = createOrderElement(
            "div",
            "order-status-row"
        );

        paymentStatus.append(
            createOrderElement("span", "", "Payment"),
            createStatusBadge(order.payment_status)
        );

        const deliveryStatus = createOrderElement(
            "div",
            "order-status-row"
        );

        deliveryStatus.append(
            createOrderElement("span", "", "Delivery"),
            createStatusBadge(order.order_status)
        );

        statusArea.append(paymentStatus, deliveryStatus);
        header.append(referenceArea, statusArea);
        card.appendChild(header);


        // Customer details
        const customer = order.customer || {};

        const customerSection = createOrderElement(
            "div",
            "customer-order-details"
        );

        customerSection.append(
            createOrderElement("h4", "", "Customer details"),
            createOrderElement(
                "p",
                "",
                `Name: ${customer.name || "Not available"}`
            ),
            createOrderElement(
                "p",
                "",
                `Email: ${customer.email || "Not available"}`
            ),
            createOrderElement(
                "p",
                "",
                `Phone: ${customer.phone || "Not available"}`
            ),
            createOrderElement(
                "p",
                "",
                `Delivery address: ${order.delivery_address || "Not available"}`
            )
        );

        card.appendChild(customerSection);


        // Products ordered
        const productsSection = createOrderElement(
            "div",
            "customer-order-products"
        );

        productsSection.appendChild(
            createOrderElement("h4", "", "Products ordered")
        );

        const items = Array.isArray(order.items)
            ? order.items
            : [];

        if (items.length === 0) {
            productsSection.appendChild(
                createOrderElement(
                    "p",
                    "order-empty-items",
                    "No product details are available for this order."
                )
            );
        }

        items.forEach(item => {
            const productRow = createOrderElement(
                "div",
                "customer-order-product"
            );

            // Product image
            const image = document.createElement("img");

            image.className = "customer-order-product-image";
            image.alt = item.name || "Product image";
            image.loading = "lazy";

            const fallbackImage =
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="100%" height="100%" fill="#eeeeee"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#777777" font-size="12">No image</text></svg>'
                );

            image.onerror = function () {
                image.onerror = null;
                image.src = fallbackImage;
            };

            image.src = item.image_url || fallbackImage;


            // Product information
            const information = createOrderElement(
                "div",
                "customer-order-product-info"
            );

            const unitPrice = Number(item.unitPrice) || 0;
            const lineTotal = Number(item.lineTotal) || 0;

            const originalPrice =
                Number(item.originalUnitPrice) || unitPrice;

            const discount =
                Number(item.discountPercentage) || 0;

            information.append(
                createOrderElement(
                    "h5",
                    "",
                    item.name || "Unnamed product"
                ),
                createOrderElement(
                    "p",
                    "",
                    `Quantity: ${Number(item.quantity) || 0}`
                )
            );

            if (
                discount > 0 &&
                originalPrice > unitPrice
            ) {
                information.append(
                    createOrderElement(
                        "p",
                        "order-original-price",
                        `Original price: ${formatMoney(originalPrice)}`
                    ),
                    createOrderElement(
                        "p",
                        "order-discount",
                        `${discount}% Flash Sale discount`
                    )
                );
            }

            information.appendChild(
                createOrderElement(
                    "p",
                    "order-unit-price",
                    `Unit price: ${formatMoney(unitPrice)}`
                )
            );

            const lineTotalElement = createOrderElement(
                "strong",
                "customer-order-line-total",
                formatMoney(lineTotal)
            );

            productRow.append(
                image,
                information,
                lineTotalElement
            );

            productsSection.appendChild(productRow);
        });

        card.appendChild(productsSection);


        // Payment summary
        const summary = createOrderElement(
            "div",
            "customer-order-summary"
        );

        summary.appendChild(
            createOrderElement("h4", "", "Payment summary")
        );

        const subtotal = Number(order.subtotal) || 0;
        const serviceCharge = Number(order.service_charge) || 0;
        const total = Number(order.total_amount) || 0;

        function addSummaryRow(label, amount, isTotal = false) {
            const row = createOrderElement(
                "div",
                isTotal
                    ? "customer-order-summary-row order-grand-total"
                    : "customer-order-summary-row"
            );

            row.append(
                createOrderElement("span", "", label),
                createOrderElement(
                    "strong",
                    "",
                    formatMoney(amount)
                )
            );

            summary.appendChild(row);
        }

        addSummaryRow("Subtotal", subtotal);
        addSummaryRow("Service charge", serviceCharge);
        addSummaryRow("Total amount", total, true);

        card.appendChild(summary);

        return card;
    }


    /* =================================================
       15N. RENDER ALL CUSTOMER ORDERS
    ================================================= */

    function renderCustomerOrders(orders) {
        if (!myOrdersList) {
            console.warn("myOrdersList was not found.");
            return;
        }

        myOrdersList.replaceChildren();

        if (!orders || orders.length === 0) {
            if (ordersMessage) {
                ordersMessage.hidden = false;
                ordersMessage.textContent =
                    "Your orders will appear here after checkout.";
            }

            return;
        }

        if (ordersMessage) {
            ordersMessage.hidden = true;
        }

        orders.forEach(order => {
            myOrdersList.appendChild(
                renderSingleOrder(order)
            );
        });
    }


    /* =================================================
       15O. OPEN AND CLOSE MY ORDERS POPUP
    ================================================= */

    function openMyOrdersPopup() {
        if (!myOrdersSectionElement) return;

        myOrdersSectionElement.hidden = false;

        document.body.classList.add("orders-popup-open");

        if (ordersMessage) {
            ordersMessage.hidden = false;
            ordersMessage.textContent = "Loading your orders...";
        }

        if (profileMenu) {
            profileMenu.hidden = true;
        }

        checkOrderNotifications();
    }

    function closeMyOrdersPopup() {
        if (!myOrdersSectionElement) return;

        myOrdersSectionElement.hidden = true;

        document.body.classList.remove("orders-popup-open");
    }

    if (myOrdersMenuLink && myOrdersSectionElement) {
        myOrdersMenuLink.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                openMyOrdersPopup();
            }
        );
    }

    if (closeOrdersBtn) {
        closeOrdersBtn.addEventListener(
            "click",
            closeMyOrdersPopup
        );
    }

    if (myOrdersSectionElement) {
        myOrdersSectionElement.addEventListener(
            "click",
            function (event) {
                if (event.target === myOrdersSectionElement) {
                    closeMyOrdersPopup();
                }
            }
        );
    }

    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            myOrdersSectionElement &&
            !myOrdersSectionElement.hidden
        ) {
            closeMyOrdersPopup();
        }
    });


    
/* =================================================
   15P. CHECK AND RETRIEVE COMPLETE ORDERS
================================================= */


async function checkOrderNotifications() {

    if (!supabaseClient || notificationCheckInProgress) {
        return;
    }

    notificationCheckInProgress = true;

    if (refreshOrdersBtn) {
        refreshOrdersBtn.disabled = true;
        refreshOrdersBtn.setAttribute("aria-busy", "true");
    }

    const retrievedOrders = [];
    const orderReferences = new Set();

    // Collect every database notification before merging.
    const allDatabaseNotifications = [];

    try {

        // ==========================================
// 1. RETRIEVE REGISTERED CUSTOMER ORDERS
// ==========================================

   const {
      data: { session },
      error: sessionError
   } = await supabaseClient.auth.getSession();
       
       console.log("MY ORDERS SESSION CHECK:", {
          hasSession: Boolean(session),
          userId: session?.user?.id || null,
          error: sessionError?.message || null
       });

const {
    data: accountData,
    error: accountError
} = await supabaseClient.functions.invoke(
    "get-my-orders"
);

console.log("REGISTERED ACCOUNT RESPONSE:", accountData);

if (accountError) {

    console.warn(
        "Account orders retrieval:",
        accountError.message
    );

} else if (accountData?.success === true) {

    console.log(
        "REGISTERED NOTIFICATIONS:",
        accountData.notifications
    );

    // Collect registered-customer notifications.
    if (Array.isArray(accountData.notifications)) {
        allDatabaseNotifications.push(
            ...accountData.notifications
        );
    }

    // Load registered-customer orders.
    if (Array.isArray(accountData.orders)) {

        accountData.orders.forEach(order => {

            if (!order.reference) return;

            retrievedOrders.push(order);

            orderReferences.add(order.reference);
        });
    }
}

        // ==========================================
        // 2. RETRIEVE GUEST CUSTOMER ORDERS
        // ==========================================

        const savedOrders = getSavedOrderNotifications();

        for (const savedOrder of savedOrders) {

            try {

                const {
                    data,
                    error
                } = await supabaseClient.functions.invoke(
                    "get-order-notifications",
                    {
                        body: {
                            reference: savedOrder.reference,
                            notification_token: savedOrder.token
                        }
                    }
                );

                if (error) {

                    console.warn(
                        "Guest order retrieval failed:",
                        savedOrder.reference,
                        error.message
                    );

                    continue;
                }

                if (
                    !data ||
                    data.success !== true ||
                    !data.order
                ) {
                    continue;
                }

                // Collect this guest order's notifications.
                if (Array.isArray(data.notifications)) {
                    allDatabaseNotifications.push(
                        ...data.notifications
                    );
                }

                const order = data.order;
                const notification = data.notification;

                // Display the latest payment and delivery status.
                if (notification) {
                    displayOrderNotification(
                        order,
                        notification
                    );
                }

                // Add the guest order without duplicating it.
                if (!orderReferences.has(order.reference)) {

                    retrievedOrders.push(order);

                    orderReferences.add(order.reference);
                }

            } catch (error) {

                console.error(
                    "Could not retrieve guest order:",
                    savedOrder.reference,
                    error
                );
            }
        }

        // ==========================================
        // 3. MERGE ALL DATABASE NOTIFICATIONS ONCE
        // ==========================================

        mergeDatabaseNotifications(
            allDatabaseNotifications
        );

        // ==========================================
        // 4. SORT ORDERS BY DATE
        // ==========================================

        retrievedOrders.sort((a, b) =>
            new Date(b.created_at || 0) -
            new Date(a.created_at || 0)
        );

        // ==========================================
        // 5. DISPLAY CUSTOMER ORDERS
        // ==========================================

        renderCustomerOrders(retrievedOrders);

        const list = document.getElementById(
            "orderNotificationList"
        );

        if (list && list.children.length === 0) {
            list.textContent = "No order updates yet.";
        }

        if (
            retrievedOrders.length === 0 &&
            ordersMessage
        ) {

            ordersMessage.hidden = false;

            ordersMessage.textContent =
                "No orders were found for this account or browser.";
        }

    } catch (error) {

        console.error(
            "My Orders refresh failed:",
            error
        );

        if (ordersMessage) {

            ordersMessage.hidden = false;

            ordersMessage.textContent =
                "We could not retrieve your orders. Please refresh and try again.";
        }

    } finally {

        notificationCheckInProgress = false;

        if (refreshOrdersBtn) {

            refreshOrdersBtn.disabled = false;

            refreshOrdersBtn.removeAttribute("aria-busy");
        }
    }
}





    /* =================================================
       15Q. REFRESH ORDERS BUTTON
    ================================================= */

    if (refreshOrdersBtn) {
        refreshOrdersBtn.addEventListener(
            "click",
            function () {
                checkOrderNotifications();
            }
        );
    }


    /* =================================================
       15R. INITIALIZE NOTIFICATIONS AND ORDER UPDATES
    ================================================= */

    renderCustomerNotifications();

    if (myOrdersSectionElement) {
        createOrderNotificationContainer();
    }

    // Initial check when the website loads.
    checkOrderNotifications();


    /* =================================================
       15S. AUTOMATIC ORDER REFRESH
       Only ONE interval is created.
    ================================================= */

    window.setInterval(function () {
        if (!document.hidden) {
            checkOrderNotifications();
        }
    }, 15000);


    /* =================================================
       16. INITIALIZATION COMPLETE
    ================================================= */

    console.log(
        "SWEET's KITCHEN & COLLECTIONS website initialized successfully."
    );
}


/* =====================================================
   17. START WEBSITE AFTER HTML IS READY
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
