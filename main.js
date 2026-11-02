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
        .select("id, name, description, price, category, image_url, stock")
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
            console.warn("Product not found in Supabase:", originalName);
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

        productInfo.append(category, heading, description);

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


            details.appendChild(name);
            details.appendChild(description);
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


    /* =================================================
       13. CUSTOMER PROFILE
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


        if (!supabaseClient) {

            console.warn(
                "Supabase is unavailable. Customer profile is disabled."
            );

            return;
        }


        if (!profileButton || !profileArea || !profileMenu) {

            console.warn(
                "Customer profile HTML elements were not found."
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


        // Use the locally stored session to load the profile.
        async function refreshProfile() {

            try {

                const { data, error } =
                    await supabaseClient.auth.getSession();

                if (error) throw error;

                if (!data.session || !data.session.user) {
                    showSignedOut();
                    return;
                }

                showSignedIn(data.session.user);

            } catch (error) {

                console.error(
                    "Profile session loading failed:",
                    error
                );

                showSignedOut();
            }
        }


        profileButton.setAttribute(
            "aria-expanded",
            "false"
        );


        profileButton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();
                event.stopPropagation();

                try {

                    const { data, error } =
                        await supabaseClient.auth.getSession();

                    if (error) throw error;

                    const session = data.session;

                    if (!session || !session.user) {

                        window.location.href = "./login.html";

                        return;
                    }

                    showSignedIn(session.user);

                    const shouldOpen = profileMenu.hidden;

                    profileMenu.hidden = !shouldOpen;

                    profileButton.setAttribute(
                        "aria-expanded",
                        String(shouldOpen)
                    );

                } catch (error) {

                    console.error(
                        "Could not check customer login:",
                        error
                    );

                    alert(
                        "Unable to check your account. Please refresh and try again."
                    );
                }
            }
        );


        document.addEventListener("click", function (event) {

            if (!profileArea.contains(event.target)) {
                closeProfileMenu();
            }
        });


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

                        if (error) throw error;

                        closeProfileMenu();
                        showSignedOut();

                        window.location.href = "./login.html";

                    } catch (error) {

                        console.error(
                            "Logout failed:",
                            error
                        );

                        alert(
                            "Unable to log out. Please try again."
                        );

                    } finally {

                        logoutButton.disabled = false;
                    }
                }
            );
        }


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

        console.error(
            "Notification storage error:",
            error
        );

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

            console.error(
                "Could not save notifications:",
                error
            );
        }
    }


    function saveOrderStatusSnapshots() {

        try {

            localStorage.setItem(
                SWEET_ORDER_STATUS_KEY,
                JSON.stringify(orderStatusSnapshots)
            );

        } catch (error) {

            console.error(
                "Could not save order status:",
                error
            );
        }
    }


    /* =================================================
       15C. GET SAVED ORDER REFERENCES AND TOKENS
    ================================================= */

    function getSavedOrderNotifications() {

        const savedOrders = [];

        try {

            for (
                let i = 0;
                i < localStorage.length;
                i++
            ) {

                const key = localStorage.key(i);

                if (
                    !key ||
                    !key.startsWith("sweet_order_notification_")
                ) {
                    continue;
                }

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
       15D. UPDATE NOTIFICATION COUNTER
    ================================================= */

    function updateNotificationCount() {

        if (!notificationCount) return;

        const unreadCount =
            customerNotifications.filter(
                item => !item.read
            ).length;

        notificationCount.textContent = unreadCount;

        notificationCount.hidden =
            unreadCount === 0;

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
       15E. DISPLAY NOTIFICATIONS IN THE BELL
    ================================================= */

    function renderCustomerNotifications() {

        if (!notificationList) return;

        notificationList.innerHTML = "";

        if (customerNotifications.length === 0) {

            const emptyMessage =
                document.createElement("p");

            emptyMessage.className =
                "empty-notifications";

            emptyMessage.textContent =
                "No notifications yet.";

            notificationList.appendChild(emptyMessage);

            updateNotificationCount();

            return;
        }

        customerNotifications.forEach(function (item) {

            const notificationItem =
                document.createElement("div");

            notificationItem.className =
                "notification-item";

            if (!item.read) {
                notificationItem.classList.add("unread");
            }

            const icon =
                document.createElement("span");

            icon.className =
                "notification-item-icon";

            icon.textContent = "📦";


            const content =
                document.createElement("div");

            content.className =
                "notification-item-content";


            const title =
                document.createElement("strong");

            title.textContent =
                item.title || "Order update";


            const message =
                document.createElement("p");

            message.textContent =
                item.message || "";


            const date =
                document.createElement("small");

            date.textContent = new Date(
                item.createdAt
            ).toLocaleString();


            content.appendChild(title);
            content.appendChild(message);
            content.appendChild(date);

            notificationItem.appendChild(icon);
            notificationItem.appendChild(content);


            if (!item.read) {

                const unreadDot =
                    document.createElement("span");

                unreadDot.className =
                    "notification-unread-dot";

                notificationItem.appendChild(unreadDot);
            }

            notificationList.appendChild(notificationItem);
        });

        updateNotificationCount();
    }


    /* =================================================
       15F. CREATE A NEW NOTIFICATION
    ================================================= */

    function addCustomerNotification(
        title,
        message,
        reference
    ) {

        const notification = {

            id: `${reference}-${Date.now()}`,

            title: title,

            message: message,

            reference: reference,

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
       15G. NOTIFICATION BELL OPEN AND CLOSE
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

                const shouldOpen =
                    notificationMenu.hidden;

                notificationMenu.hidden =
                    !shouldOpen;

                notificationButton.setAttribute(
                    "aria-expanded",
                    String(shouldOpen)
                );

                if (shouldOpen) {
                    renderCustomerNotifications();
                }
            }
        );

        document.addEventListener(
            "click",
            function (event) {

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
            }
        );

    } else {

        console.warn(
            "Notification bell HTML is incomplete. Check notificationButton, notificationMenu and notificationList."
        );
    }


    /* =================================================
       15H. MARK ALL NOTIFICATIONS AS READ
    ================================================= */

    if (markAllNotificationsRead) {

        markAllNotificationsRead.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                customerNotifications.forEach(function (item) {
                    item.read = true;
                });

                saveCustomerNotifications();
                renderCustomerNotifications();
            }
        );
    }


    /* =================================================
       15I. CLEAR ALL NOTIFICATIONS
    ================================================= */

    if (clearNotifications) {

        clearNotifications.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (customerNotifications.length === 0) {
                    return;
                }

                const confirmed = confirm(
                    "Are you sure you want to clear all notifications?"
                );

                if (!confirmed) return;

                customerNotifications = [];

                saveCustomerNotifications();
                renderCustomerNotifications();
            }
        );
    }


    /* =================================================
       15L. DISPLAY CLICKABLE ORDER CARDS
    ================================================= */

    function displayCustomerOrder(order) {

        if (!myOrdersList || !order) return;

        const reference = String(order.reference || "");

        if (!reference) return;

        let card = document.getElementById(
            "customer-order-" + reference
        );

        // Remember whether the customer has expanded this order.
        const wasExpanded = card
            ? card.querySelector(".view-order-products")
                ?.getAttribute("aria-expanded") === "true"
            : false;

        if (!card) {

            card = document.createElement("article");

            card.id = "customer-order-" + reference;
            card.className = "customer-order-card";
        }

        // Order heading.
        const heading = document.createElement("h3");
        heading.textContent = "Order Details";

        // Order reference.
        const referenceText = document.createElement("p");
        referenceText.className = "customer-order-reference";
        referenceText.textContent = "Reference: " + reference;

        // Order date.
        const dateText = document.createElement("p");
        dateText.textContent =
            "Order date: " +
            (
                order.created_at
                    ? new Date(order.created_at).toLocaleString()
                    : "Not available"
            );

        // Payment status.
        const paymentText = document.createElement("p");
        paymentText.textContent =
            "Payment: " + (order.payment_status || "Pending");

        // Delivery status.
        const statusText = document.createElement("p");
        statusText.textContent =
            "Delivery status: " + (order.order_status || "Pending");

        // Order subtotal.
        const subtotalText = document.createElement("p");
        subtotalText.textContent =
            "Subtotal: " + formatMoney(order.subtotal);

        // Service charge.
        const serviceChargeText = document.createElement("p");
        serviceChargeText.textContent =
            "Service charge: " + formatMoney(order.service_charge);

        // Total amount.
        const totalText = document.createElement("strong");
        totalText.className = "customer-order-total";
        totalText.textContent =
            "Total: " + formatMoney(order.total_amount);

        // View products button.
        const viewButton = document.createElement("button");

        viewButton.type = "button";
        viewButton.className = "view-order-products";
        viewButton.textContent = wasExpanded
            ? "Hide Products"
            : "View Products";

        viewButton.setAttribute(
            "aria-expanded",
            String(wasExpanded)
        );

        // Products container.
        const productsContainer = document.createElement("div");

        productsContainer.className = "order-products-list";
        productsContainer.hidden = !wasExpanded;

        const productsHeading = document.createElement("h4");
        productsHeading.textContent = "Products Purchased";

        productsContainer.appendChild(productsHeading);

        const items = Array.isArray(order.items)
            ? order.items
            : [];

        if (items.length === 0) {

            const emptyProducts = document.createElement("p");

            emptyProducts.textContent =
                "Product details are not available for this order.";

            productsContainer.appendChild(emptyProducts);

        } else {

            items.forEach(function (item) {

                const productRow = document.createElement("div");

                productRow.className = "order-product-item";

                // Product image.
                const image = document.createElement("img");

                image.className = "order-product-image";
                image.alt = item.name || "Purchased product";
                image.loading = "lazy";

                if (item.image_url) {

                    image.src = item.image_url;

                    image.onerror = function () {
                        image.style.display = "none";
                    };

                } else {

                    image.hidden = true;
                }

                // Product information.
                const productInfo = document.createElement("div");

                productInfo.className = "order-product-info";

                const productName = document.createElement("h5");

                productName.textContent =
                    item.name || "Product";

                const quantity = document.createElement("p");

                quantity.textContent =
                    "Quantity: " + (Number(item.quantity) || 0);

                const unitPrice = document.createElement("p");

                unitPrice.textContent =
                    "Unit price: " + formatMoney(item.unitPrice);

                const lineTotal = document.createElement("strong");

                lineTotal.textContent =
                    "Subtotal: " + formatMoney(item.lineTotal);

                productInfo.append(
                    productName,
                    quantity,
                    unitPrice,
                    lineTotal
                );

                productRow.append(image, productInfo);

                productsContainer.appendChild(productRow);
            });
        }

        // Toggle product details when clicked.
        viewButton.addEventListener("click", function () {

            const isExpanded =
                viewButton.getAttribute("aria-expanded") === "true";

            const newExpandedState = !isExpanded;

            viewButton.setAttribute(
                "aria-expanded",
                String(newExpandedState)
            );

            productsContainer.hidden = !newExpandedState;

            viewButton.textContent = newExpandedState
                ? "Hide Products"
                : "View Products";
        });

        card.replaceChildren(
            heading,
            referenceText,
            dateText,
            paymentText,
            statusText,
            subtotalText,
            serviceChargeText,
            totalText,
            viewButton,
            productsContainer
        );

        // Keep the existing card in place when refreshing.
        const existingCard = document.getElementById(
            "customer-order-" + reference
        );

        if (existingCard) {

            existingCard.replaceWith(card);

        } else {

            myOrdersList.appendChild(card);
        }
    }


    /* =================================================
       15M. CHECK ORDER STATUS AND RETRIEVE ORDER DETAILS
    ================================================= */

    async function checkOrderNotifications() {

        if (
            !supabaseClient ||
            notificationCheckInProgress
        ) {
            return;
        }

        const savedOrders =
            getSavedOrderNotifications();

        if (savedOrders.length === 0) {

            if (myOrdersList) {
                myOrdersList.replaceChildren();
            }

            if (ordersMessage) {
                ordersMessage.textContent =
                    "No saved orders yet. Your orders will appear here after checkout.";
                ordersMessage.hidden = false;
            }

            const list = document.getElementById(
                "orderNotificationList"
            );

            if (list) {
                list.textContent =
                    "No saved orders yet.";
            }

            return;
        }

        notificationCheckInProgress = true;

        if (ordersMessage) {
            ordersMessage.textContent =
                "Loading your orders...";
            ordersMessage.hidden = false;
        }

        if (refreshOrdersBtn) {
            refreshOrdersBtn.disabled = true;
            refreshOrdersBtn.textContent = "Refreshing...";
        }

        let successfullyLoaded = 0;

        try {

            for (const order of savedOrders) {

                try {

                    const { data, error } =
                        await supabaseClient.functions.invoke(
                            "get-order-notifications",
                            {
                                body: {
                                    reference: order.reference,
                                    notification_token: order.token
                                }
                            }
                        );

                    if (error) {

                        console.error(
                            "Order retrieval failed:",
                            order.reference,
                            error
                        );

                        continue;
                    }

                    if (
                        !data ||
                        !data.success ||
                        !data.notification ||
                        !data.order
                    ) {

                        console.warn(
                            "Order details were not returned:",
                            order.reference,
                            data
                        );

                        continue;
                    }

                    const notification = data.notification;
                    const orderDetails = data.order;

                    // Display the actual purchased products and images.
                    displayCustomerOrder(orderDetails);

                    successfullyLoaded++;

                    if (
                        notification.payment_status == null ||
                        notification.order_status == null
                    ) {
                        continue;
                    }

                    const currentStatus = {
                        payment_status: notification.payment_status,
                        order_status: notification.order_status
                    };

                    const previousStatus =
                        orderStatusSnapshots[order.reference];

                    // First successful check establishes a baseline.
                    if (!previousStatus) {

                        orderStatusSnapshots[order.reference] =
                            currentStatus;

                        saveOrderStatusSnapshots();

                        continue;
                    }

                    const paymentChanged =
                        previousStatus.payment_status !==
                        currentStatus.payment_status;

                    const orderChanged =
                        previousStatus.order_status !==
                        currentStatus.order_status;

                    if (paymentChanged || orderChanged) {

                        const changes = [];

                        if (paymentChanged) {
                            changes.push(
                                "Payment status: " +
                                currentStatus.payment_status
                            );
                        }

                        if (orderChanged) {
                            changes.push(
                                "Delivery status: " +
                                currentStatus.order_status
                            );
                        }

                        addCustomerNotification(
                            "Your order has been updated",
                            changes.join(" | ") +
                            ". Order reference: " +
                            order.reference,
                            order.reference
                        );
                    }

                    orderStatusSnapshots[order.reference] =
                        currentStatus;

                    saveOrderStatusSnapshots();

                } catch (error) {

                    console.error(
                        "Could not retrieve order:",
                        order.reference,
                        error
                    );
                }
            }

            if (ordersMessage) {

                if (successfullyLoaded > 0) {

                    ordersMessage.textContent =
                        "Your orders are displayed below. Select View Products to see what you purchased.";

                    ordersMessage.hidden = false;

                } else {

                    ordersMessage.textContent =
                        "We could not load your orders. Please try again.";

                    ordersMessage.hidden = false;
                }
            }

        } finally {

            notificationCheckInProgress = false;

            if (refreshOrdersBtn) {
                refreshOrdersBtn.disabled = false;
                refreshOrdersBtn.textContent = "Refresh Orders";
            }
        }
    }


    /* =================================================
   15N. INITIALIZE NOTIFICATIONS
================================================= */

renderCustomerNotifications();


    /* =================================================
       15O. OPEN MY ORDERS
    ================================================= */

    if (
        myOrdersMenuLink &&
        myOrdersSectionElement
    ) {

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

                checkOrderNotifications();
            }
        );
    }


    /* =================================================
       15P. REFRESH ORDERS
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
       15Q. INITIAL CHECK WHEN WEBSITE LOADS
    ================================================= */

    checkOrderNotifications();


    /* =================================================
       15R. AUTOMATIC CHECK EVERY 15 SECONDS
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
